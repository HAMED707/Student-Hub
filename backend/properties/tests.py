"""
Properties App — Full Test Suite
=================================
Coverage:
    - Models          (Property, PropertyImage)
    - Serializers     (List, Detail, Create, Update)
    - Views / API     (all 9 endpoints)
    - Filters         (PropertyFilter)
    - Permissions     (IsPropertyOwner)

Run:
    python manage.py test api.properties_api.tests --verbosity=2
    # or point Django to this file directly if placed in the app folder
"""

from decimal import Decimal
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import Users
from properties.models import Property, PropertyImage


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def make_image_file(name="test.jpg"):
    """Minimal valid JPEG bytes so Pillow doesn't reject it."""
    return SimpleUploadedFile(name, b"\xff\xd8\xff\xe0" + b"\x00" * 16, content_type="image/jpeg")


def create_landlord(username="landlord1", password="pass1234"):
    return Users.objects.create_user(
        username=username,
        password=password,
        email=f"{username}@test.com",
        role="landlord",
    )


def create_student(username="student1", password="pass1234"):
    return Users.objects.create_user(
        username=username,
        password=password,
        email=f"{username}@test.com",
        role="student",
    )


def create_property(landlord, **kwargs):
    defaults = dict(
        title="Test Apartment",
        property_type="apartment",
        price=Decimal("3000.00"),
        city="Cairo",
        district="Dokki",
        gender_preference="male",
        status="available",
    )
    defaults.update(kwargs)
    return Property.objects.create(landlord=landlord, **defaults)


def get_tokens(client, username, password):
    """Obtain JWT access token via /api/auth/login/."""
    resp = client.post(
        "/api/auth/login/",
        {"username": username, "password": password},
        format="json",
    )
    return resp.data.get("access", "")


# ─────────────────────────────────────────────────────────────
# Model Tests
# ─────────────────────────────────────────────────────────────

class PropertyModelTests(TestCase):

    def setUp(self):
        self.landlord = create_landlord()
        self.prop = create_property(self.landlord)

    def test_str_representation(self):
        self.assertIn(self.prop.title, str(self.prop))
        self.assertIn(self.landlord.username, str(self.prop))

    def test_default_status_is_available(self):
        self.assertEqual(self.prop.status, "available")

    def test_default_view_count_is_zero(self):
        self.assertEqual(self.prop.view_count, 0)

    def test_average_rating_no_reviews(self):
        self.assertEqual(self.prop.average_rating, 0)

    def test_review_count_no_reviews(self):
        self.assertEqual(self.prop.review_count, 0)

    def test_amenities_default_empty_list(self):
        self.assertEqual(self.prop.amenities, [])

    def test_ordering_newest_first(self):
        prop2 = create_property(self.landlord, title="Newer Apartment")
        props = list(Property.objects.all())
        self.assertEqual(props[0], prop2)  # newest first

    def test_price_cannot_be_negative(self):
        from django.core.exceptions import ValidationError
        prop = Property(
            landlord=self.landlord,
            title="Bad",
            property_type="studio",
            price=Decimal("-100"),
            city="Cairo",
            gender_preference="male",
        )
        with self.assertRaises(Exception):
            prop.full_clean()


class PropertyImageModelTests(TestCase):

    def setUp(self):
        self.landlord = create_landlord()
        self.prop = create_property(self.landlord)

    def test_str_includes_cover_label(self):
        img = PropertyImage.objects.create(
            property=self.prop,
            image=make_image_file(),
            is_cover=True,
        )
        self.assertIn("Cover", str(img))

    def test_str_includes_gallery_label(self):
        img = PropertyImage.objects.create(
            property=self.prop,
            image=make_image_file(),
            is_cover=False,
        )
        self.assertIn("Gallery", str(img))

    def test_cover_image_ordered_first(self):
        gallery = PropertyImage.objects.create(property=self.prop, image=make_image_file("g.jpg"), is_cover=False)
        cover   = PropertyImage.objects.create(property=self.prop, image=make_image_file("c.jpg"), is_cover=True)
        first = self.prop.images.first()
        self.assertTrue(first.is_cover)

    def test_cascade_delete_with_property(self):
        PropertyImage.objects.create(property=self.prop, image=make_image_file(), is_cover=True)
        prop_id = self.prop.id
        self.prop.delete()
        self.assertEqual(PropertyImage.objects.filter(property_id=prop_id).count(), 0)


# ─────────────────────────────────────────────────────────────
# Filter Tests
# ─────────────────────────────────────────────────────────────

class PropertyFilterTests(TestCase):

    def setUp(self):
        self.landlord = create_landlord()
        self.cairo_studio = create_property(
            self.landlord,
            title="Cairo Studio",
            property_type="studio",
            city="Cairo",
            price=Decimal("2000"),
            num_beds=1,
            gender_preference="female",
            nearby_university="Cairo University",
            amenities=["WiFi", "AC"],
        )
        self.alex_apartment = create_property(
            self.landlord,
            title="Alex Apartment",
            property_type="apartment",
            city="Alexandria",
            price=Decimal("5000"),
            num_beds=3,
            gender_preference="male",
            nearby_university="Alexandria University",
        )

    def _filter(self, **params):
        from api.properties_api.filters import PropertyFilter
        qs = Property.objects.all()
        return PropertyFilter(params, queryset=qs).qs

    def test_filter_by_city(self):
        result = self._filter(city="Cairo")
        self.assertIn(self.cairo_studio, result)
        self.assertNotIn(self.alex_apartment, result)

    def test_filter_by_city_case_insensitive(self):
        result = self._filter(city="cairo")
        self.assertIn(self.cairo_studio, result)

    def test_filter_by_property_type(self):
        result = self._filter(type="studio")
        self.assertIn(self.cairo_studio, result)
        self.assertNotIn(self.alex_apartment, result)

    def test_filter_price_min(self):
        result = self._filter(price_min=3000)
        self.assertIn(self.alex_apartment, result)
        self.assertNotIn(self.cairo_studio, result)

    def test_filter_price_max(self):
        result = self._filter(price_max=3000)
        self.assertIn(self.cairo_studio, result)
        self.assertNotIn(self.alex_apartment, result)

    def test_filter_price_range(self):
        result = self._filter(price_min=1000, price_max=2500)
        self.assertIn(self.cairo_studio, result)
        self.assertNotIn(self.alex_apartment, result)

    def test_filter_num_beds(self):
        result = self._filter(num_beds=3)
        self.assertIn(self.alex_apartment, result)
        self.assertNotIn(self.cairo_studio, result)

    def test_filter_gender(self):
        result = self._filter(gender="female")
        self.assertIn(self.cairo_studio, result)
        self.assertNotIn(self.alex_apartment, result)

    def test_filter_university(self):
        result = self._filter(university="Cairo")
        self.assertIn(self.cairo_studio, result)
        self.assertNotIn(self.alex_apartment, result)

    def test_filter_amenity_in_json_list(self):
        result = self._filter(amenity="WiFi")
        self.assertIn(self.cairo_studio, result)
        self.assertNotIn(self.alex_apartment, result)

    def test_no_filters_returns_all(self):
        result = self._filter()
        self.assertEqual(result.count(), 2)


# ─────────────────────────────────────────────────────────────
# Serializer Tests
# ─────────────────────────────────────────────────────────────

class PropertySerializerTests(TestCase):

    def setUp(self):
        self.landlord = create_landlord()
        self.prop = create_property(self.landlord, amenities=["WiFi", "AC"])

    def test_list_serializer_has_cover_image_field(self):
        from api.properties_api.serializers import PropertyListSerializer
        s = PropertyListSerializer(self.prop)
        self.assertIn("cover_image", s.data)

    def test_list_serializer_cover_image_none_when_no_images(self):
        from api.properties_api.serializers import PropertyListSerializer
        s = PropertyListSerializer(self.prop)
        self.assertIsNone(s.data["cover_image"])

    def test_detail_serializer_includes_landlord_fields(self):
        from api.properties_api.serializers import PropertySerializer
        s = PropertySerializer(self.prop)
        self.assertIn("landlord_name", s.data)
        self.assertIn("landlord_is_verified", s.data)
        self.assertIn("images", s.data)

    def test_create_serializer_validates_price_zero(self):
        from api.properties_api.serializers import PropertyCreateSerializer
        data = {
            "title": "Bad",
            "property_type": "studio",
            "price": 0,
            "city": "Cairo",
            "gender_preference": "male",
        }
        s = PropertyCreateSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("price", s.errors)

    def test_create_serializer_validates_stay_months(self):
        from api.properties_api.serializers import PropertyCreateSerializer
        data = {
            "title": "Bad Stay",
            "property_type": "studio",
            "price": 2000,
            "city": "Cairo",
            "gender_preference": "male",
            "min_stay_months": 6,
            "max_stay_months": 3,  # invalid: less than min
        }
        s = PropertyCreateSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_create_serializer_creates_property_with_images(self):
        from api.properties_api.serializers import PropertyCreateSerializer
        data = {
            "title": "New Place",
            "property_type": "apartment",
            "price": 3000,
            "city": "Cairo",
            "gender_preference": "male",
            "uploaded_images": [make_image_file("a.jpg"), make_image_file("b.jpg")],
        }
        s = PropertyCreateSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)
        prop = s.save(landlord=self.landlord)
        self.assertEqual(prop.images.count(), 2)
        self.assertTrue(prop.images.filter(is_cover=True).exists())

    def test_update_serializer_validates_stay_months_partial(self):
        from api.properties_api.serializers import PropertyUpdateSerializer
        self.prop.min_stay_months = 4
        self.prop.save()
        s = PropertyUpdateSerializer(self.prop, data={"max_stay_months": 2}, partial=True)
        self.assertFalse(s.is_valid())


# ─────────────────────────────────────────────────────────────
# API View Tests
# ─────────────────────────────────────────────────────────────

class PropertyAPIBase(TestCase):
    """Shared setup for all API tests."""

    def setUp(self):
        self.client = APIClient()
        self.landlord = create_landlord("landlord_api", "pass1234")
        self.other_landlord = create_landlord("other_landlord", "pass1234")
        self.student = create_student("student_api", "pass1234")
        self.prop = create_property(self.landlord, title="API Test Property")
        self.featured_prop = create_property(self.landlord, title="Featured", is_featured=True)

    def auth(self, user):
        """Authenticate client as given user via JWT."""
        resp = self.client.post(
            "/api/auth/login/",
            {"username": user.username, "password": "pass1234"},
            format="json",
        )
        token = resp.data.get("access", "")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def deauth(self):
        self.client.credentials()


class PropertyListViewTests(PropertyAPIBase):

    def test_public_can_list_properties(self):
        resp = self.client.get("/api/properties/properties/")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)

    def test_default_returns_only_available(self):
        create_property(self.landlord, title="Rented One", status="rented")
        resp = self.client.get("/api/properties/properties/")
        statuses = [p["status"] for p in resp.data]
        self.assertTrue(all(s == "available" for s in statuses))

    def test_filter_by_city_via_api(self):
        create_property(self.landlord, title="Alex Place", city="Alexandria")
        resp = self.client.get("/api/properties/properties/?city=Alexandria")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(all("Alexandria" in p["city"] for p in resp.data))

    def test_filter_by_price_range(self):
        create_property(self.landlord, title="Cheap", price=Decimal("1000"))
        create_property(self.landlord, title="Expensive", price=Decimal("9000"))
        resp = self.client.get("/api/properties/properties/?price_min=500&price_max=2000")
        prices = [Decimal(p["price"]) for p in resp.data]
        self.assertTrue(all(500 <= p <= 2000 for p in prices))

    def test_filter_by_type(self):
        create_property(self.landlord, title="Studio Place", property_type="studio")
        resp = self.client.get("/api/properties/properties/?type=studio")
        types = [p["property_type"] for p in resp.data]
        self.assertTrue(all(t == "studio" for t in types))


class FeaturedPropertiesViewTests(PropertyAPIBase):

    def test_returns_only_featured(self):
        resp = self.client.get("/api/properties/properties/featured/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(all(p["is_featured"] for p in resp.data))

    def test_non_featured_not_included(self):
        resp = self.client.get("/api/properties/properties/featured/")
        titles = [p["title"] for p in resp.data]
        self.assertNotIn("API Test Property", titles)


class UniversityPropertiesViewTests(PropertyAPIBase):

    def setUp(self):
        super().setUp()
        self.uni_prop = create_property(
            self.landlord,
            title="Near Cairo Uni",
            nearby_university="Cairo University",
        )

    def test_returns_properties_with_university(self):
        resp = self.client.get("/api/properties/properties/university/")
        self.assertEqual(resp.status_code, 200)
        # All results must have a nearby_university value
        self.assertTrue(all(p.get("nearby_university") for p in resp.data))

    def test_filter_by_specific_university(self):
        resp = self.client.get("/api/properties/properties/university/?university=Cairo")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(p["title"] == "Near Cairo Uni" for p in resp.data))


class PropertyDetailViewTests(PropertyAPIBase):

    def test_returns_full_detail(self):
        resp = self.client.get(f"/api/properties/properties/{self.prop.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("images", resp.data)
        self.assertIn("landlord_name", resp.data)

    def test_increments_view_count(self):
        initial = self.prop.view_count
        self.client.get(f"/api/properties/properties/{self.prop.id}/")
        self.prop.refresh_from_db()
        self.assertEqual(self.prop.view_count, initial + 1)

    def test_increments_view_count_multiple_times(self):
        for _ in range(3):
            self.client.get(f"/api/properties/properties/{self.prop.id}/")
        self.prop.refresh_from_db()
        self.assertEqual(self.prop.view_count, 3)

    def test_404_for_nonexistent_property(self):
        resp = self.client.get("/api/properties/properties/99999/")
        self.assertEqual(resp.status_code, 404)


class PropertyCreateViewTests(PropertyAPIBase):

    def _create_payload(self):
        return {
            "title": "New Listing",
            "property_type": "studio",
            "price": "2500.00",
            "city": "Cairo",
            "district": "Zamalek",
            "gender_preference": "male",
        }

    def test_landlord_can_create_property(self):
        self.auth(self.landlord)
        resp = self.client.post(
            "/api/properties/properties/create/",
            self._create_payload(),
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["title"], "New Listing")

    def test_student_cannot_create_property(self):
        self.auth(self.student)
        resp = self.client.post(
            "/api/properties/properties/create/",
            self._create_payload(),
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_unauthenticated_cannot_create_property(self):
        resp = self.client.post(
            "/api/properties/properties/create/",
            self._create_payload(),
            format="json",
        )
        self.assertEqual(resp.status_code, 401)

    def test_create_with_images(self):
        self.auth(self.landlord)
        payload = self._create_payload()
        payload["uploaded_images"] = [make_image_file("upload1.jpg")]
        resp = self.client.post(
            "/api/properties/properties/create/",
            payload,
            format="multipart",
        )
        self.assertEqual(resp.status_code, 201)
        prop_id = resp.data["id"]
        self.assertEqual(PropertyImage.objects.filter(property_id=prop_id).count(), 1)

    def test_create_with_invalid_price_rejected(self):
        self.auth(self.landlord)
        payload = self._create_payload()
        payload["price"] = -100
        resp = self.client.post(
            "/api/properties/properties/create/",
            payload,
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("price", resp.data)

    def test_landlord_field_injected_server_side(self):
        """landlord must be set to the requesting user, not a client-supplied value."""
        self.auth(self.landlord)
        payload = self._create_payload()
        resp = self.client.post(
            "/api/properties/properties/create/",
            payload,
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["landlord_id"], self.landlord.id)


class PropertyEditViewTests(PropertyAPIBase):

    def test_owner_can_edit_property(self):
        self.auth(self.landlord)
        resp = self.client.patch(
            f"/api/properties/properties/{self.prop.id}/edit/",
            {"title": "Updated Title"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.prop.refresh_from_db()
        self.assertEqual(self.prop.title, "Updated Title")

    def test_non_owner_landlord_cannot_edit(self):
        self.auth(self.other_landlord)
        resp = self.client.patch(
            f"/api/properties/properties/{self.prop.id}/edit/",
            {"title": "Hijacked"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_student_cannot_edit(self):
        self.auth(self.student)
        resp = self.client.patch(
            f"/api/properties/properties/{self.prop.id}/edit/",
            {"title": "Student Edit"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_partial_update_preserves_other_fields(self):
        original_price = self.prop.price
        self.auth(self.landlord)
        self.client.patch(
            f"/api/properties/properties/{self.prop.id}/edit/",
            {"title": "Only Title Changed"},
            format="json",
        )
        self.prop.refresh_from_db()
        self.assertEqual(self.prop.price, original_price)

    def test_edit_nonexistent_returns_404(self):
        self.auth(self.landlord)
        resp = self.client.patch(
            "/api/properties/properties/99999/edit/",
            {"title": "Ghost"},
            format="json",
        )
        self.assertEqual(resp.status_code, 404)


class PropertyImageUploadViewTests(PropertyAPIBase):

    def test_owner_can_upload_images(self):
        self.auth(self.landlord)
        resp = self.client.post(
            f"/api/properties/properties/{self.prop.id}/images/",
            {"images": [make_image_file("new.jpg")]},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(self.prop.images.count(), 1)

    def test_first_uploaded_image_becomes_cover(self):
        self.auth(self.landlord)
        self.client.post(
            f"/api/properties/properties/{self.prop.id}/images/",
            {"images": [make_image_file("first.jpg"), make_image_file("second.jpg")]},
            format="multipart",
        )
        self.assertTrue(self.prop.images.filter(is_cover=True).exists())
        self.assertEqual(self.prop.images.filter(is_cover=True).count(), 1)

    def test_second_upload_does_not_change_cover(self):
        self.auth(self.landlord)
        # First upload — sets cover
        self.client.post(
            f"/api/properties/properties/{self.prop.id}/images/",
            {"images": [make_image_file("cover.jpg")]},
            format="multipart",
        )
        cover_id = self.prop.images.get(is_cover=True).id
        # Second upload
        self.client.post(
            f"/api/properties/properties/{self.prop.id}/images/",
            {"images": [make_image_file("extra.jpg")]},
            format="multipart",
        )
        self.assertEqual(self.prop.images.get(is_cover=True).id, cover_id)

    def test_non_owner_cannot_upload(self):
        self.auth(self.other_landlord)
        resp = self.client.post(
            f"/api/properties/properties/{self.prop.id}/images/",
            {"images": [make_image_file()]},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 403)

    def test_upload_with_no_files_returns_400(self):
        self.auth(self.landlord)
        resp = self.client.post(
            f"/api/properties/properties/{self.prop.id}/images/",
            {},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 400)


class PropertyImageDeleteViewTests(PropertyAPIBase):

    def setUp(self):
        super().setUp()
        self.auth(self.landlord)
        self.client.post(
            f"/api/properties/properties/{self.prop.id}/images/",
            {"images": [make_image_file("a.jpg"), make_image_file("b.jpg")]},
            format="multipart",
        )
        self.cover_img = self.prop.images.get(is_cover=True)
        self.gallery_img = self.prop.images.filter(is_cover=False).first()

    def test_owner_can_delete_gallery_image(self):
        resp = self.client.delete(
            f"/api/properties/properties/{self.prop.id}/images/{self.gallery_img.id}/"
        )
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(PropertyImage.objects.filter(id=self.gallery_img.id).exists())

    def test_deleting_cover_promotes_next_image(self):
        resp = self.client.delete(
            f"/api/properties/properties/{self.prop.id}/images/{self.cover_img.id}/"
        )
        self.assertEqual(resp.status_code, 204)
        # Gallery image should now be promoted to cover
        remaining = self.prop.images.first()
        self.assertIsNotNone(remaining)
        self.assertTrue(remaining.is_cover)

    def test_non_owner_cannot_delete(self):
        self.auth(self.other_landlord)
        resp = self.client.delete(
            f"/api/properties/properties/{self.prop.id}/images/{self.gallery_img.id}/"
        )
        self.assertEqual(resp.status_code, 403)

    def test_delete_nonexistent_image_returns_404(self):
        resp = self.client.delete(
            f"/api/properties/properties/{self.prop.id}/images/99999/"
        )
        self.assertEqual(resp.status_code, 404)


class LandlordPropertiesViewTests(PropertyAPIBase):

    def test_landlord_sees_only_own_properties(self):
        create_property(self.other_landlord, title="Other's Property")
        self.auth(self.landlord)
        resp = self.client.get("/api/properties/properties/landlord/properties/")
        self.assertEqual(resp.status_code, 200)
        titles = [p["title"] for p in resp.data]
        self.assertNotIn("Other's Property", titles)

    def test_landlord_sees_all_own_properties_regardless_of_status(self):
        create_property(self.landlord, title="Rented Mine", status="rented")
        self.auth(self.landlord)
        resp = self.client.get("/api/properties/properties/landlord/properties/")
        titles = [p["title"] for p in resp.data]
        self.assertIn("Rented Mine", titles)

    def test_student_cannot_access_landlord_dashboard(self):
        self.auth(self.student)
        resp = self.client.get("/api/properties/properties/landlord/properties/")
        self.assertEqual(resp.status_code, 403)

    def test_unauthenticated_cannot_access(self):
        self.deauth()
        resp = self.client.get("/api/properties/properties/landlord/properties/")
        self.assertEqual(resp.status_code, 401)


# ─────────────────────────────────────────────────────────────
# Permission Tests
# ─────────────────────────────────────────────────────────────

class IsPropertyOwnerPermissionTests(TestCase):

    def setUp(self):
        self.landlord = create_landlord("perm_landlord")
        self.other = create_landlord("perm_other")
        self.prop = create_property(self.landlord)

    def test_owner_has_object_permission(self):
        from api.properties_api.permissions import IsPropertyOwner
        from unittest.mock import MagicMock
        perm = IsPropertyOwner()
        request = MagicMock()
        request.user = self.landlord
        self.assertTrue(perm.has_object_permission(request, None, self.prop))

    def test_non_owner_denied_object_permission(self):
        from api.properties_api.permissions import IsPropertyOwner
        from unittest.mock import MagicMock
        perm = IsPropertyOwner()
        request = MagicMock()
        request.user = self.other
        self.assertFalse(perm.has_object_permission(request, None, self.prop))