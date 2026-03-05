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
from rest_framework.permissions import IsAuthenticated

from reviews.models import Review
from properties.models import Property
from accounts.models import Users
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
        return [IsAuthenticated()]

    def get(self, request, property_id):
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"error": "Property not found."}, status=status.HTTP_404_NOT_FOUND)

        reviews = Review.objects.filter(property=prop).select_related("reviewer")
        serializer = ReviewSerializer(reviews, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

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

        review = serializer.save(reviewer=request.user, property=prop)
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
