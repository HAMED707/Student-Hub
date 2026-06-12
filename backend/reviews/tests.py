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
        title="Reviewed Apartment",
        property_type="apartment",
        price=Decimal("3200.00"),
        city="Cairo",
        district="Nasr City",
        gender_preference="male",
        status="rented",
    )
    defaults.update(kwargs)
    return Property.objects.create(landlord=landlord, **defaults)


def create_booking(student, property_obj, **kwargs):
    defaults = dict(
        status="confirmed",
        move_in_date=timezone.now().date(),
        duration_months=6,
        total_amount_cents=320000,
        deposit_amount_cents=64000,
        remaining_amount_cents=256000,
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    defaults.update(kwargs)
    return Booking.objects.create(
        tenant=student,
        property=property_obj,
        **defaults,
    )


class ReviewApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = create_student()
        self.landlord = create_landlord()
        self.property = create_property(self.landlord)
        self.booking = create_booking(self.student, self.property)

    def test_duplicate_property_review_post_fails(self):
        Review.objects.create(
            reviewer=self.student,
            reviewer_role="landlord",
            property=self.property,
            booking=self.booking,
            rating=5,
            comment="Already reviewed",
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/reviews/property/{self.property.id}/",
            {
                "booking_id": self.booking.id,
                "rating": 4,
                "reviewer_role": "landlord",
                "comment": "Second review",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("already", str(response.json()).lower())

    def test_user_cannot_review_self(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/reviews/user/{self.student.id}/",
            {
                "rating": 4,
                "reviewer_role": "classmate",
                "comment": "Self review",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("cannot review yourself", str(response.json()).lower())
