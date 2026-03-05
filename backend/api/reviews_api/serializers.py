"""
Reviews API serializers.

Serializers:
    - ReviewSerializer              → GET responses (full read)
    - PropertyReviewCreateSerializer → POST /api/reviews/property/<id>/
    - UserReviewCreateSerializer     → POST /api/reviews/user/<id>/
"""

from rest_framework import serializers
from reviews.models import Review


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

    class Meta:
        model  = Review
        fields = ["rating", "comment", "reviewer_role"]

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
        # reviewer and property injected from the view
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
