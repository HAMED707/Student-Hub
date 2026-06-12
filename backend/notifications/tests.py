from datetime import timedelta
from decimal import Decimal

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient

from accounts.models import Users
from bookings.models import Booking
from config.asgi import application
from messaging.models import Conversation, Message
from notifications.models import Notification
from properties.models import Property
from reviews.models import Review


def create_user(username, role, first_name="", last_name=""):
    return Users.objects.create_user(
        username=username,
        password="pass1234",
        email=f"{username}@test.com",
        role=role,
        first_name=first_name,
        last_name=last_name,
    )


def create_property(landlord):
    return Property.objects.create(
        landlord=landlord,
        title="Notifications Property",
        property_type="apartment",
        price=Decimal("4200.00"),
        city="Cairo",
        district="Maadi",
        gender_preference="male",
        status="available",
    )


@override_settings(
    CHANNEL_LAYERS={
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }
)
class NotificationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = create_user("student_notify", "student", "Ahmed", "Ali")
        self.landlord = create_user("landlord_notify", "landlord", "Mona", "Hassan")
        self.other_user = create_user("other_notify", "student", "Sara", "Mahmoud")
        Notification.objects.all().delete()

        self.property = create_property(self.landlord)
        self.booking = Booking.objects.create(
            tenant=self.student,
            property=self.property,
            status="confirmed",
            move_in_date="2026-06-12",
            duration_months=6,
            total_amount_cents=420000,
            deposit_amount_cents=84000,
            remaining_amount_cents=336000,
        )
        self.conversation = Conversation.objects.create(
            initiator=self.student,
            receiver=self.landlord,
            booking=self.booking,
            property=self.property,
        )
        Notification.objects.all().delete()

    def build_access_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_list_returns_newest_first_with_unread_count(self):
        older = Notification.objects.create(
            recipient=self.student,
            actor=self.landlord,
            notification_type="new_message",
            title="Older",
            message="Older notification",
            data={"conversation_id": self.conversation.id},
            is_read=True,
        )
        newest = Notification.objects.create(
            recipient=self.student,
            actor=self.landlord,
            notification_type="booking_update",
            title="Newest",
            message="Newest notification",
            data={"booking_id": self.booking.id},
            is_read=False,
        )
        Notification.objects.filter(id=older.id).update(
            created_at=timezone.now() - timedelta(days=1)
        )
        Notification.objects.filter(id=newest.id).update(created_at=timezone.now())

        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["unread_count"], 1)
        self.assertEqual(payload["notifications"][0]["id"], newest.id)
        self.assertEqual(payload["notifications"][1]["id"], older.id)

    def test_unread_filter_returns_only_unread_notifications(self):
        Notification.objects.create(
            recipient=self.student,
            notification_type="welcome",
            title="Read",
            message="Already read",
            is_read=True,
        )
        unread = Notification.objects.create(
            recipient=self.student,
            notification_type="new_message",
            title="Unread",
            message="Unread notification",
            data={"conversation_id": self.conversation.id},
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/notifications/?unread=true")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["unread_count"], 1)
        self.assertEqual(len(payload["notifications"]), 1)
        self.assertEqual(payload["notifications"][0]["id"], unread.id)

    def test_mark_one_read_affects_only_authenticated_user_notification(self):
        own = Notification.objects.create(
            recipient=self.student,
            notification_type="new_message",
            title="Student notification",
            message="Unread",
            data={"conversation_id": self.conversation.id},
        )
        other = Notification.objects.create(
            recipient=self.other_user,
            notification_type="welcome",
            title="Other user notification",
            message="Unread",
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.patch(f"/api/notifications/{own.id}/read/")

        self.assertEqual(response.status_code, 200)
        own.refresh_from_db()
        other.refresh_from_db()
        self.assertTrue(own.is_read)
        self.assertFalse(other.is_read)

    def test_mark_all_read_affects_only_authenticated_user_notifications(self):
        own_one = Notification.objects.create(
            recipient=self.student,
            notification_type="welcome",
            title="One",
            message="Unread one",
        )
        own_two = Notification.objects.create(
            recipient=self.student,
            notification_type="new_message",
            title="Two",
            message="Unread two",
            data={"conversation_id": self.conversation.id},
        )
        other = Notification.objects.create(
            recipient=self.other_user,
            notification_type="welcome",
            title="Other",
            message="Unread other",
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/notifications/read/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["marked_read"], 2)
        own_one.refresh_from_db()
        own_two.refresh_from_db()
        other.refresh_from_db()
        self.assertTrue(own_one.is_read)
        self.assertTrue(own_two.is_read)
        self.assertFalse(other.is_read)

    async def _connect_notification_socket(self, user=None):
        token_query = f"?token={self.build_access_token(user)}" if user else ""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/notifications/{token_query}",
        )
        connected, _ = await communicator.connect()
        return communicator, connected

    def test_notification_socket_rejects_anonymous_users(self):
        async def scenario():
            communicator, connected = await self._connect_notification_socket()
            self.assertFalse(connected)

        async_to_sync(scenario)()

    def test_notification_socket_accepts_authenticated_users_and_sends_normalized_payload(self):
        notification = Notification.objects.create(
            recipient=self.student,
            actor=self.landlord,
            notification_type="new_message",
            title="Socket message",
            message="Mona sent you a message.",
            data={"conversation_id": self.conversation.id},
        )

        async def scenario():
            communicator, connected = await self._connect_notification_socket(self.student)
            self.assertTrue(connected)

            channel_layer = get_channel_layer()
            await channel_layer.group_send(
                f"notifications_{self.student.id}",
                {
                    "type": "notify",
                    "id": notification.id,
                    "notification_type": notification.notification_type,
                    "title": notification.title,
                    "message": notification.message,
                    "data": notification.data,
                    "is_read": notification.is_read,
                    "actor_name": "Mona Hassan",
                    "actor_avatar": None,
                    "created_at": notification.created_at.isoformat(),
                },
            )

            response = await communicator.receive_json_from()
            self.assertEqual(response["type"], "notification")
            self.assertEqual(response["id"], notification.id)
            self.assertEqual(response["notification_type"], "new_message")
            self.assertEqual(response["data"]["conversation_id"], self.conversation.id)
            self.assertEqual(response["actor_name"], "Mona Hassan")
            self.assertIn("T", response["created_at"])
            await communicator.disconnect()

        async_to_sync(scenario)()

    def test_message_notification_preserves_conversation_deep_link_data(self):
        Message.objects.create(
            conversation=self.conversation,
            sender=self.landlord,
            body="Please confirm the move-in date",
        )

        notification = Notification.objects.filter(
            recipient=self.student,
            notification_type="new_message",
        ).latest("id")

        self.assertEqual(notification.data["conversation_id"], self.conversation.id)
        self.assertIn("message_id", notification.data)

    def test_booking_notification_preserves_booking_and_property_data(self):
        new_booking = Booking.objects.create(
            tenant=self.other_user,
            property=self.property,
            status="pending_payment",
            move_in_date="2026-07-01",
            duration_months=4,
            total_amount_cents=240000,
            deposit_amount_cents=48000,
            remaining_amount_cents=192000,
        )

        notification = Notification.objects.filter(
            recipient=self.landlord,
            notification_type="booking_request",
        ).latest("id")

        self.assertEqual(notification.data["booking_id"], new_booking.id)
        self.assertEqual(notification.data["property_id"], self.property.id)
        self.assertEqual(notification.data["property_title"], self.property.title)

    def test_review_notification_preserves_property_deep_link_data(self):
        Review.objects.create(
            reviewer=self.student,
            reviewer_role="landlord",
            property=self.property,
            booking=self.booking,
            rating=5,
            comment="Excellent stay",
        )

        notification = Notification.objects.filter(
            recipient=self.landlord,
            notification_type="new_review",
        ).latest("id")

        self.assertEqual(notification.data["property_id"], self.property.id)
