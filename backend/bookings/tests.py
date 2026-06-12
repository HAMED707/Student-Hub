from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Users
from bookings.models import Booking
from properties.models import Property
from reviews.models import Review


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


def create_property(landlord, **kwargs):
    defaults = dict(
        title="Reviewable Apartment",
        property_type="apartment",
        price=Decimal("3500.00"),
        city="Cairo",
        district="Dokki",
        gender_preference="male",
        status="available",
    )
    defaults.update(kwargs)
    return Property.objects.create(landlord=landlord, **defaults)


def create_booking(student, property_obj, **kwargs):
    defaults = dict(
        status="pending_payment",
        move_in_date=timezone.now().date(),
        duration_months=6,
        total_amount_cents=350000,
        deposit_amount_cents=70000,
        remaining_amount_cents=280000,
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    defaults.update(kwargs)
    return Booking.objects.create(
        tenant=student,
        property=property_obj,
        **defaults,
    )


class BookingReviewMetadataTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = create_student()
        self.landlord = create_landlord()
        self.property = create_property(self.landlord)

    def test_pending_payment_booking_cannot_be_reviewed(self):
        booking = create_booking(self.student, self.property, status="pending_payment")

        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/bookings/my/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()[0]
        self.assertEqual(payload["id"], booking.id)
        self.assertFalse(payload["can_review_property"])
        self.assertFalse(payload["has_property_review"])
        self.assertIsNone(payload["property_review_id"])

    def test_confirmed_booking_without_review_can_be_reviewed(self):
        booking = create_booking(self.student, self.property, status="confirmed")

        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/bookings/my/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()[0]
        self.assertEqual(payload["id"], booking.id)
        self.assertTrue(payload["can_review_property"])
        self.assertFalse(payload["has_property_review"])
        self.assertIsNone(payload["property_review_id"])

    def test_completed_booking_with_review_is_marked_reviewed(self):
        booking = create_booking(self.student, self.property, status="completed")
        review = Review.objects.create(
            reviewer=self.student,
            reviewer_role="landlord",
            property=self.property,
            booking=booking,
            rating=5,
            comment="Great stay",
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/bookings/my/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()[0]
        self.assertEqual(payload["id"], booking.id)
        self.assertFalse(payload["can_review_property"])
        self.assertTrue(payload["has_property_review"])
        self.assertEqual(payload["property_review_id"], review.id)
