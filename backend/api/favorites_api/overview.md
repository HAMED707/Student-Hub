


# ────────────────────────Start URL─────────────────────────────────────

```
"""Favorites API URL configuration."""
from django.urls import path
from api.favorites_api.views import FavoritesListView, FavoriteDeleteView

urlpatterns = [
    # ── Student: View shortlist + heart a property ────────────────────────────
    path("", FavoritesListView.as_view(), name="favorites-list"),

    # ── Student: Unheart a property (by property id, not favorite id) ─────────
    path("<int:property_id>/", FavoriteDeleteView.as_view(), name="favorite-delete"),
]

        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```
"""
Favorites API serializers.

Serializers:
    - FavoriteSerializer       → GET /api/favorites/ (full read with nested property)
    - FavoriteCreateSerializer → POST /api/favorites/ (write — accepts property id only)
"""

from rest_framework import serializers
from favorites.models import Favorite
from api.properties_api.serializers import PropertyListSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    """
    Full read serializer. Used in all GET responses.
    Nests lightweight property card so the frontend can render the shortlist grid.
    """

    property_detail = PropertyListSerializer(source="property", read_only=True)

    class Meta:
        model  = Favorite
        fields = ["id", "property", "property_detail", "created_at"]
        read_only_fields = ["id", "created_at"]


class FavoriteCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for adding a property to the shortlist.
    User is injected from request.user in the view — not accepted from input.
    Raises a 400 if the student has already hearted this property.
    """

    class Meta:
        model  = Favorite
        fields = ["property"]

    def validate(self, data):
        user     = self.context["request"].user
        property = data.get("property")

        # unique_together is enforced at DB level, but we surface a clear error here
        if Favorite.objects.filter(user=user, property=property).exists():
            raise serializers.ValidationError("You have already saved this property.")

        return data

    def create(self, validated_data):
        # User is passed from the view via serializer.save(user=request.user)
        return Favorite.objects.create(**validated_data)

```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```
"""
Favorites API views.

Endpoints:
    GET    /api/favorites/                  → FavoritesListView    (student's shortlist)
    POST   /api/favorites/                  → FavoritesListView    (heart a property)
    DELETE /api/favorites/<property_id>/    → FavoriteDeleteView   (unheart a property)
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from favorites.models import Favorite
from api.favorites_api.serializers import FavoriteSerializer, FavoriteCreateSerializer
from api.accounts_api.permissions import IsStudent


class FavoritesListView(APIView):
    """
    GET  /api/favorites/ → returns the logged-in student's full shortlist
    POST /api/favorites/ → adds a property to the shortlist
    """
    permission_classes = [IsStudent]

    def get(self, request):
        queryset = (
            Favorite.objects
            .filter(user=request.user)
            .select_related("property", "property__owner")
            .prefetch_related("property__images")
        )
        serializer = FavoriteSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = FavoriteCreateSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Inject the authenticated student as the owner of this favorite
        favorite = serializer.save(user=request.user)
        return Response(
            FavoriteSerializer(favorite, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class FavoriteDeleteView(APIView):
    """
    DELETE /api/favorites/<property_id>/
    Removes a property from the student's shortlist.
    Uses property_id (not favorite id) so the frontend doesn't need to store favorite PKs.
    """
    permission_classes = [IsStudent]

    def delete(self, request, property_id):
        try:
            favorite = Favorite.objects.get(user=request.user, property_id=property_id)
        except Favorite.DoesNotExist:
            return Response({"error": "Property not in your shortlist."}, status=status.HTTP_404_NOT_FOUND)

        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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
Favorites app models.
Handles the student shortlist — the heart button on property cards.

Models:
    - Favorite → a saved property belonging to a student
"""

from django.db import models
from accounts.models import Users
from properties.models import Property


class Favorite(models.Model):
    """
    Represents a property saved to a student's shortlist.

    unique_together prevents the same student from hearting the same
    property twice — the API treats a duplicate POST as a 400 error.
    """

    # ── Parties ───────────────────────────────────────────────────────────────
    user = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="favorites",
        limit_choices_to={"role": "student"},   # only students can shortlist
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="favorited_by",
    )

    # ── Timestamp ─────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        # One heart per student per property — enforced at DB level
        unique_together = ("user", "property")

    def __str__(self):
        return f"{self.user.username} ♥ {self.property.title}"
```

# ────────────────────────End Model──────────────────────────────────────

