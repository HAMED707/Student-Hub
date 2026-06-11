## review app ##


# ────────────────────────Start URL─────────────────────────────────────

```
"""Reviews API URL configuration."""
from django.urls import path
from api.reviews_api.views import PropertyReviewListView, UserReviewListView

urlpatterns = [
    # ── Property Reviews ──────────────────────────────────────────────────────
    path("property/<int:property_id>/", PropertyReviewListView.as_view(), name="property-reviews"),

    # ── User Reviews ──────────────────────────────────────────────────────────
    path("user/<int:user_id>/", UserReviewListView.as_view(), name="user-reviews"),
]

        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```
"""
Reviews API serializers.

Serializers:
    - ReviewSerializer              → GET responses (full read)
    - PropertyReviewCreateSerializer → POST /api/reviews/property/<id>/
    - UserReviewCreateSerializer     → POST /api/reviews/user/<id>/
"""

from rest_framework import serializers
from reviews.models import Review
from bookings.models import Booking

class ReviewSerializer(serializers.ModelSerializer):
    """
    Full read serializer. Used in all GET responses.
    Shows reviewer username so the frontend can display the author line.
    """

    reviewer_username    = serializers.CharField(source="reviewer.username", read_only=True)
    reviewer_picture     = serializers.ImageField(source="reviewer.profile_picture", read_only=True)

    class Meta:
        model  = Review
        fields = [
            "id",
            "reviewer", "reviewer_username", "reviewer_picture",
            "reviewer_role",
            "property", "reviewed_user",
            "rating", "comment",
            "created_at",
        ]
        read_only_fields = ["id", "reviewer", "created_at"]


class PropertyReviewCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for reviewing a property.
    property is injected from the URL — not accepted from the request body.
    reviewer is injected from request.user.

    Rules:
      - Only students can review properties (enforced in view via IsStudent)
      - One review per student per property
      - reviewer_role for property reviews is restricted to landlord (i.e. they are reviewing as a past tenant)
        — actually the role describes the reviewer's relationship, so we limit to sensible choices.
    """
    booking_id = serializers.IntegerField(write_only=True)
    class Meta:
        model  = Review
        fields = ["rating", "comment", "reviewer_role","booking_id"]

    
    def validate_booking_id(self, value):
        request = self.context.get("request")
        try:
            # Ensure booking exists AND belongs to the requesting student
            booking = Booking.objects.get(id=value, tenant=request.user)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found or you are not the tenant.")
        
        # Students can only review after the stay is confirmed or completed
        if booking.status not in ["confirmed", "completed"]:
            raise serializers.ValidationError("You can only review a property after your booking is confirmed or completed.")
        
        # Prevent duplicate reviews for the exact same booking
        if Review.objects.filter(booking=booking).exists():
            raise serializers.ValidationError("You have already submitted a review for this booking.")
        
        return value

    def validate_reviewer_role(self, value):
        # For property reviews, the student is reviewing as a past tenant.
        # Only these roles make sense in that context.
        allowed = ["roommate", "neighbor"]
        # NOTE: reviewer_role on a property review describes the reviewer's
        # living arrangement context — keeping all four valid for flexibility.
        allowed = ["landlord", "roommate", "classmate", "neighbor"]
        if value not in allowed:
            raise serializers.ValidationError(
                f"reviewer_role must be one of: {', '.join(allowed)}."
            )
        return value

    def validate(self, data):
        reviewer = self.context["request"].user
        property_obj = self.context["property"]

        # One review per student per property
        if Review.objects.filter(reviewer=reviewer, property=property_obj).exists():
            raise serializers.ValidationError("You have already reviewed this property.")

        return data

    def create(self, validated_data):
        booking_id = validated_data.pop("booking_id")
        booking = Booking.objects.get(id=booking_id)
        
        # Auto-inject fields securely
        validated_data["booking"] = booking
        validated_data["property"] = booking.property
        validated_data["reviewer"] = self.context["request"].user
        
        return Review.objects.create(**validated_data)


class UserReviewCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for reviewing another user.
    reviewed_user is injected from the URL — not accepted from the request body.
    reviewer is injected from request.user.

    Rules:
      - Cannot review yourself
      - One review per reviewer per reviewed_user
    """

    class Meta:
        model  = Review
        fields = ["rating", "comment", "reviewer_role"]

    def validate(self, data):
        reviewer      = self.context["request"].user
        reviewed_user = self.context["reviewed_user"]

        # Prevent self-reviews
        if reviewer == reviewed_user:
            raise serializers.ValidationError("You cannot review yourself.")

        # One review per reviewer per user
        if Review.objects.filter(reviewer=reviewer, reviewed_user=reviewed_user).exists():
            raise serializers.ValidationError("You have already reviewed this user.")

        return data

    def create(self, validated_data):
        # reviewer and reviewed_user injected from the view
        return Review.objects.create(**validated_data)

```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```
"""
Reviews API views.

Endpoints:
    GET    /api/reviews/property/<id>/  → PropertyReviewListView   (anyone authenticated)
    POST   /api/reviews/property/<id>/  → PropertyReviewListView   (student only)
    GET    /api/reviews/user/<id>/      → UserReviewListView       (anyone authenticated)
    POST   /api/reviews/user/<id>/      → UserReviewListView       (authenticated, not self)
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated , AllowAny

from reviews.models import Review
from properties.models import Property
from accounts.models import Users
from bookings.models import Booking
from api.reviews_api.serializers import (
    ReviewSerializer,
    PropertyReviewCreateSerializer,
    UserReviewCreateSerializer,
)
from api.accounts_api.permissions import IsStudent


class PropertyReviewListView(APIView):
    """
    GET  /api/reviews/property/<id>/ → list all reviews for a property
    POST /api/reviews/property/<id>/ → student submits a review for a property
    """

    def get_permissions(self):
        """GET is open to anyone authenticated. POST is students only."""
        if self.request.method == "POST":
            return [IsStudent()]
        return [AllowAny()]

    def get(self, request, property_id):
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        reviews = Review.objects.filter(property=prop).select_related("reviewer")
        serializer = ReviewSerializer(reviews, many=True, context={"request": request})

        return Response({
            "property_id": prop.id,
            "average_rating": prop.average_rating,  # ADD THIS
            "review_count": prop.review_count,      # ADD THIS
            "reviews": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, property_id):
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PropertyReviewCreateSerializer(
            data=request.data,
            context={"request": request, "property": prop},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        booking_id = request.data.get("booking_id")
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id)
                if booking.property.id != prop.id:
                    return Response({"error": "This booking is not for the specified property."}, status=status.HTTP_400_BAD_REQUEST)
            except Booking.DoesNotExist:
                pass # Handled by serializer validation

        review = serializer.save()
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class UserReviewListView(APIView):
    """
    GET  /api/reviews/user/<id>/ → list all reviews for a user
    POST /api/reviews/user/<id>/ → authenticated user submits a review for another user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = Users.objects.get(id=user_id)
        except Users.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        reviews = Review.objects.filter(reviewed_user=user).select_related("reviewer")
        serializer = ReviewSerializer(reviews, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, user_id):
        try:
            reviewed_user = Users.objects.get(id=user_id)
        except Users.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserReviewCreateSerializer(
            data=request.data,
            context={"request": request, "reviewed_user": reviewed_user},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        review = serializer.save(reviewer=request.user, reviewed_user=reviewed_user)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

```

# ────────────────────────End View──────────────────────────────────────





# ────────────────────────Start Signals────────────────────────────────────
```


```
# ────────────────────────End Signals──────────────────────────────────────





# ────────────────────────Start Apps────────────────────────────────────
```


```
# ────────────────────────End Apps──────────────────────────────────────






# ────────────────────────Start Model────────────────────────────────────

```
"""
Reviews app models.
Handles star ratings and written reviews for both properties and users.

Models:
    - Review → a rating left on a property OR on another user
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import Users
from properties.models import Property
from bookings.models import Booking 


class Review(models.Model):
    """
    Unified review model for both property reviews and user reviews.

    A review targets EITHER a property or a user — never both at once.
    The target type is determined by which FK is set (property vs reviewed_user).

    reviewer_role tells us the relationship between the reviewer and the subject:
        - property reviews: reviewer is always a student (past tenant)
        - user reviews:     landlord ↔ student, or student ↔ student (roommate, classmate, neighbor)
    """

    REVIEWER_ROLE_CHOICES = [
        ("landlord",  "Landlord"),
        ("roommate",  "Roommate"),
        ("classmate", "Classmate"),
        ("neighbor",  "Neighbor"),
    ]

    # ── Who is reviewing ──────────────────────────────────────────────────────
    reviewer = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="reviews_given",
    )
    reviewer_role = models.CharField(max_length=20, choices=REVIEWER_ROLE_CHOICES)

    # ── What is being reviewed (exactly one must be set) ──────────────────────
    # Property review — student reviews a property they stayed at
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="reviews",
        blank=True,
        null=True,
    )

    # User review — one user reviews another (landlord reviews tenant, or vice versa)
    reviewed_user = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="reviews_received",
        blank=True,
        null=True,
    )

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="review",
        null=True,
        blank=True,
        help_text="Links property review to a specific booking. Null for user-to-user reviews."
    )
    # ── Review Content ────────────────────────────────────────────────────────
    rating  = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)

    # ── Timestamp ─────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        # One review per reviewer per target
        # NOTE: Django doesn't support conditional unique_together,
        # so uniqueness per target type is enforced in the serializer.
        verbose_name_plural = "Reviews"

    def __str__(self):
        target = self.property or self.reviewed_user
        return f"{self.reviewer.username} → {target} ({self.rating}★)"

```

# ────────────────────────End Model──────────────────────────────────────

