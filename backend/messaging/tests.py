from decimal import Decimal

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient

from accounts.models import Users
from bookings.models import Booking
from messaging.models import Conversation, Message
from notifications.models import Notification
from properties.models import Property
from config.asgi import application


def create_user(username, role):
    return Users.objects.create_user(
        username=username,
        password="pass1234",
        email=f"{username}@test.com",
        role=role,
    )


def create_property(landlord):
    return Property.objects.create(
        landlord=landlord,
        title="Messaging Apartment",
        property_type="apartment",
        price=Decimal("3500.00"),
        city="Cairo",
        district="Dokki",
        gender_preference="male",
        status="available",
    )


@override_settings(
    CHANNEL_LAYERS={
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }
)
class MessagingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = create_user("student_msg", "student")
        self.landlord = create_user("landlord_msg", "landlord")
        self.other_user = create_user("intruder_msg", "student")
        self.property = create_property(self.landlord)
        self.booking = Booking.objects.create(
            tenant=self.student,
            property=self.property,
            status="confirmed",
            move_in_date="2026-06-12",
            duration_months=6,
            total_amount_cents=350000,
            deposit_amount_cents=70000,
            remaining_amount_cents=280000,
        )
        self.conversation = Conversation.objects.create(
            initiator=self.student,
            receiver=self.landlord,
            booking=self.booking,
            property=self.property,
        )
        self.other_conversation = Conversation.objects.create(
            initiator=self.student,
            receiver=self.landlord,
            property=self.property,
        )
        Message.objects.create(
            conversation=self.other_conversation,
            sender=self.landlord,
            body="Older conversation preview",
        )

    def build_access_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_can_send_follow_up_message_to_existing_conversation(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            f"/api/messaging/{self.conversation.id}/",
            {"body": "Following up on move-in details"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["conversation"], self.conversation.id)
        self.assertEqual(payload["sender"], self.student.id)
        self.assertEqual(payload["body"], "Following up on move-in details")
        self.assertTrue(
            Message.objects.filter(
                conversation=self.conversation,
                sender=self.student,
                body="Following up on move-in details",
            ).exists()
        )

    def test_cannot_send_message_to_someone_elses_conversation(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(
            f"/api/messaging/{self.conversation.id}/",
            {"body": "I should not access this"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_post_read_marks_only_other_users_messages_in_conversation(self):
        self.client.force_authenticate(user=self.student)
        own_message = Message.objects.create(
            conversation=self.conversation,
            sender=self.student,
            body="My sent message",
        )
        incoming_message = Message.objects.create(
            conversation=self.conversation,
            sender=self.landlord,
            body="Unread incoming",
        )

        response = self.client.post(f"/api/messaging/{self.conversation.id}/read/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["marked_read"], 1)
        own_message.refresh_from_db()
        incoming_message.refresh_from_db()
        self.assertFalse(own_message.is_read)
        self.assertTrue(incoming_message.is_read)

    def test_http_message_send_moves_conversation_to_top(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            f"/api/messaging/{self.conversation.id}/",
            {"body": "Fresh follow-up"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        conversations = self.client.get("/api/messaging/").json()
        self.assertEqual(conversations[0]["id"], self.conversation.id)

    def test_websocket_rejects_non_members(self):
        self.client.force_authenticate(user=self.student)
        token = self.build_access_token(self.other_user)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={token}",
        )

        connected, _ = async_to_sync(communicator.connect)()
        self.assertFalse(connected)

    def test_websocket_accepts_members_and_broadcasts_normalized_payload(self):
        self.client.force_authenticate(user=self.student)
        token = self.build_access_token(self.student)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={token}",
        )

        connected, _ = async_to_sync(communicator.connect)()
        self.assertTrue(connected)

        async_to_sync(communicator.send_json_to)({"body": "Live hello"})
        payload = async_to_sync(communicator.receive_json_from)()

        self.assertEqual(payload["type"], "chat_message")
        self.assertEqual(payload["conversation_id"], self.conversation.id)
        self.assertEqual(payload["sender"], self.student.id)
        self.assertEqual(payload["body"], "Live hello")
        self.assertFalse(payload["is_read"])
        self.assertIn("T", payload["created_at"])

        conversations = self.client.get("/api/messaging/").json()
        self.assertEqual(conversations[0]["id"], self.conversation.id)

        async_to_sync(communicator.disconnect)()

    def test_message_notification_keeps_conversation_id_in_payload(self):
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.student,
            body="Notification message",
        )

        notification = Notification.objects.filter(
            notification_type="new_message",
            data__conversation_id=self.conversation.id,
            data__message_id=message.id,
        ).first()

        self.assertIsNotNone(notification)
