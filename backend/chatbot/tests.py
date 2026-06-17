from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Users
from bookings.models import Booking
from chatbot.models import ChatMessage
from chatbot.services import (
    HISTORY_LIMIT,
    _book_room,
    _find_roommate_matches,
    get_university_community_group,
    _load_history,
)
from properties.models import City, Property


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_student(username="student1", password="pass1234"):
    return Users.objects.create_user(
        username=username,
        password=password,
        email=f"{username}@test.com",
        role="student",
    )


def create_landlord(username="landlord1", password="pass1234"):
    return Users.objects.create_user(
        username=username,
        password=password,
        email=f"{username}@test.com",
        role="landlord",
    )


def create_city(name="Cairo"):
    return City.objects.get_or_create(name=name)[0]


def create_property(landlord, city=None, **kwargs):
    if city is None:
        city = create_city()
    defaults = dict(
        title="Test Room",
        unit_type="room",
        room_price=Decimal("2000.00"),
        city=city,
        district="Dokki",
        gender_preference="any",
        status="available",
    )
    defaults.update(kwargs)
    return Property.objects.create(landlord=landlord, **defaults)


def _mock_response(text="Here is my reply."):
    """Builds a minimal mock GenerateContentResponse with no tool calls."""
    mock_resp = MagicMock()
    mock_resp.text = text
    mock_resp.automatic_function_calling_history = []
    return mock_resp


# ---------------------------------------------------------------------------
# View: GET /api/chatbot/
# ---------------------------------------------------------------------------

class ChatHistoryViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = create_student()
        self.other = create_student("other", "pass1234")

    def test_unauthenticated_returns_401(self):
        response = self.client.get("/api/chatbot/")
        self.assertEqual(response.status_code, 401)

    def test_landlord_returns_403(self):
        landlord = create_landlord()
        self.client.force_authenticate(user=landlord)
        response = self.client.get("/api/chatbot/")
        self.assertEqual(response.status_code, 403)

    def test_empty_history_returns_empty_list(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/chatbot/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_history_scoped_to_requesting_user(self):
        ChatMessage.objects.create(user=self.student, role="user", content="Hi")
        ChatMessage.objects.create(user=self.other, role="user", content="Other's message")

        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/chatbot/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["content"], "Hi")

    def test_history_returned_in_chronological_order(self):
        ChatMessage.objects.create(user=self.student, role="user", content="First")
        ChatMessage.objects.create(user=self.student, role="model", content="Second")
        ChatMessage.objects.create(user=self.student, role="user", content="Third")

        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/chatbot/")
        contents = [m["content"] for m in response.json()]
        self.assertEqual(contents, ["First", "Second", "Third"])


# ---------------------------------------------------------------------------
# View: POST /api/chatbot/
# ---------------------------------------------------------------------------

class ChatSendViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = create_student()

    def test_unauthenticated_returns_401(self):
        response = self.client.post("/api/chatbot/", {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_landlord_returns_403(self):
        landlord = create_landlord()
        self.client.force_authenticate(user=landlord)
        response = self.client.post("/api/chatbot/", {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_empty_message_returns_400(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/chatbot/", {"message": ""}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_missing_message_field_returns_400(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/chatbot/", {}, format="json")
        self.assertEqual(response.status_code, 400)

    @patch("chatbot.services.client")
    def test_student_can_send_message_and_receive_reply(self, mock_client):
        mock_session = MagicMock()
        mock_session.send_message.return_value = _mock_response("Hello, student!")
        mock_client.chats.create.return_value = mock_session

        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/chatbot/", {"message": "Hello"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["reply"], "Hello, student!")

    @patch("chatbot.services.client")
    def test_message_and_reply_are_persisted(self, mock_client):
        mock_session = MagicMock()
        mock_session.send_message.return_value = _mock_response("Stored reply")
        mock_client.chats.create.return_value = mock_session

        self.client.force_authenticate(user=self.student)
        self.client.post("/api/chatbot/", {"message": "Save me"}, format="json")

        msgs = list(ChatMessage.objects.filter(user=self.student).order_by("created_at"))
        self.assertEqual(len(msgs), 2)
        self.assertEqual(msgs[0].role, "user")
        self.assertEqual(msgs[0].content, "Save me")
        self.assertEqual(msgs[1].role, "model")
        self.assertEqual(msgs[1].content, "Stored reply")

    @patch("chatbot.services.client")
    def test_gemini_exception_returns_503_not_500(self, mock_client):
        mock_client.chats.create.side_effect = Exception("Gemini quota exceeded")

        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/chatbot/", {"message": "Hello"}, format="json")

        self.assertEqual(response.status_code, 503)
        self.assertIn("error", response.json())


# ---------------------------------------------------------------------------
# Service: _book_room
# ---------------------------------------------------------------------------

class BookRoomServiceTests(TestCase):
    def setUp(self):
        self.student = create_student()
        self.landlord = create_landlord()
        self.city = create_city()
        self.prop = create_property(
            self.landlord,
            city=self.city,
            unit_type="room",
            room_price=Decimal("3000.00"),
            status="available",
        )

    def test_successful_booking_returns_success_true(self):
        result = _book_room(self.prop.id, self.student.id)
        self.assertTrue(result["success"])
        self.assertIn("booking_id", result)
        self.assertIn("deposit_amount_egp", result)

    def test_unavailable_property_returns_error(self):
        self.prop.status = "reserved"
        self.prop.save()
        result = _book_room(self.prop.id, self.student.id)
        self.assertFalse(result["success"])
        self.assertIn("no longer available", result["error"])

    def test_duplicate_active_booking_returns_error(self):
        from datetime import timedelta
        from django.utils import timezone
        Booking.objects.create(
            tenant=self.student,
            property=self.prop,
            booking_unit="room",
            move_in_date=timezone.now().date(),
            duration_months=3,
            total_amount_cents=900000,
            deposit_amount_cents=180000,
            remaining_amount_cents=720000,
            expires_at=timezone.now() + timedelta(minutes=30),
            status="pending_payment",
        )
        result = _book_room(self.prop.id, self.student.id)
        self.assertFalse(result["success"])
        self.assertIn("already have an active booking", result["error"])

    def test_booking_unit_inferred_from_unit_type_room(self):
        result = _book_room(self.prop.id, self.student.id, booking_unit="")
        self.assertTrue(result["success"])
        booking = Booking.objects.get(id=result["booking_id"])
        self.assertEqual(booking.booking_unit, "room")

    def test_booking_unit_inferred_apartment_to_whole(self):
        prop = create_property(
            self.landlord,
            city=self.city,
            unit_type="apartment",
            price=Decimal("5000.00"),
            rental_mode="whole_apartment",
            status="available",
        )
        result = _book_room(prop.id, self.student.id, booking_unit="")
        self.assertTrue(result["success"])
        booking = Booking.objects.get(id=result["booking_id"])
        self.assertEqual(booking.booking_unit, "whole")

    def test_booking_unit_inferred_bed(self):
        prop = create_property(
            self.landlord,
            city=self.city,
            unit_type="bed",
            bed_price=Decimal("1500.00"),
            status="available",
        )
        result = _book_room(prop.id, self.student.id, booking_unit="")
        self.assertTrue(result["success"])
        booking = Booking.objects.get(id=result["booking_id"])
        self.assertEqual(booking.booking_unit, "bed")

    def test_nonexistent_property_returns_error(self):
        result = _book_room(99999, self.student.id)
        self.assertFalse(result["success"])
        self.assertIn("not found", result["error"])

    def test_deposit_is_20_percent(self):
        result = _book_room(self.prop.id, self.student.id, duration_months=1)
        self.assertTrue(result["success"])
        booking = Booking.objects.get(id=result["booking_id"])
        self.assertEqual(booking.deposit_amount_cents, int(Decimal("3000.00") * 100 * Decimal("0.20")))

    def test_booking_expires_in_30_minutes(self):
        from django.utils import timezone
        result = _book_room(self.prop.id, self.student.id)
        self.assertTrue(result["success"])
        booking = Booking.objects.get(id=result["booking_id"])
        delta = booking.expires_at - timezone.now()
        self.assertAlmostEqual(delta.seconds / 60, 30, delta=1)


# ---------------------------------------------------------------------------
# Service: _find_roommate_matches
# ---------------------------------------------------------------------------

class FindRoommateMatchesServiceTests(TestCase):
    def setUp(self):
        self.student = create_student()

    def test_no_active_profile_returns_note_not_exception(self):
        result = _find_roommate_matches(self.student.id)
        self.assertIn("note", result)
        self.assertEqual(result["matches"], [])
        self.assertNotIn("exception", str(result).lower())

    def test_nonexistent_student_returns_note_not_exception(self):
        result = _find_roommate_matches(99999)
        self.assertIn("note", result)


# ---------------------------------------------------------------------------
# Service: get_university_community_group
# ---------------------------------------------------------------------------

class UniversityGroupServiceTests(TestCase):
    def test_unseeded_university_returns_found_false(self):
        result = get_university_community_group("Nonexistent University XYZ")
        self.assertEqual(result, {"found": False})

    def test_never_raises_on_missing_university(self):
        try:
            result = get_university_community_group("")
            self.assertFalse(result["found"])
        except Exception as exc:
            self.fail(f"get_university_community_group raised: {exc}")


# ---------------------------------------------------------------------------
# Service: _load_history (cap)
# ---------------------------------------------------------------------------

class LoadHistoryCapTests(TestCase):
    def setUp(self):
        self.student = create_student()

    def test_history_capped_at_limit(self):
        for i in range(HISTORY_LIMIT + 10):
            ChatMessage.objects.create(
                user=self.student, role="user", content=f"msg {i}"
            )
        history = _load_history(self.student)
        self.assertLessEqual(len(history), HISTORY_LIMIT)

    def test_history_returns_oldest_messages_first(self):
        for i in range(5):
            ChatMessage.objects.create(
                user=self.student, role="user", content=f"msg {i}"
            )
        history = _load_history(self.student)
        texts = [part.text for content in history for part in content.parts]
        self.assertEqual(texts, [f"msg {i}" for i in range(5)])
