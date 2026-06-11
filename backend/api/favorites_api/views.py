"""Favorites API views."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from favorites.models import Favorite
from api.favorites_api.serializers import FavoriteSerializer, FavoriteCreateSerializer
from api.accounts_api.permissions import IsStudent


class FavoritesListView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        queryset = (
            Favorite.objects
            .filter(user=request.user)
            .select_related("property", "property__landlord")  
            .prefetch_related("property__images")
        )
        serializer = FavoriteSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = FavoriteCreateSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Inject the authenticated student
        favorite = serializer.save(user=request.user)
        return Response(
            FavoriteSerializer(favorite, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class FavoriteDeleteView(APIView):
    permission_classes = [IsStudent]

    def delete(self, request, property_id):
        try:
            favorite = Favorite.objects.get(user=request.user, property_id=property_id)
        except Favorite.DoesNotExist:
            return Response({"error": "Property not in your shortlist."}, status=status.HTTP_404_NOT_FOUND)

        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)