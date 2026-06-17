"""
Properties API filters.
Replaces the manual apply_filters() helper in views.py.

Usage in views:
    from api.properties_api.filters import PropertyFilter

    queryset = Property.objects.all()
    filtered = PropertyFilter(request.query_params, queryset=queryset).qs

Supported query params:
    city, district, type, status,
    price_min, price_max,
    num_beds, num_rooms, num_bathrooms,
    gender, university,
    is_featured, has_internet, has_ac, has_water, has_electricity, has_gas
"""
import django_filters
from properties.models import Property


class PropertyFilter(django_filters.FilterSet):
    """
    FilterSet for Property listings.
    Each filter maps a clean query-param name to the correct ORM lookup.
    """

    # ── Location ─────────────────────────────────────────────────────────────
    city = django_filters.CharFilter(field_name="city__name", lookup_expr="icontains")
    district = django_filters.CharFilter(field_name="district", lookup_expr="icontains")

    # ── Type & Status ─────────────────────────────────────────────────────────
    # 'type' is a reserved word in Python, so we alias it here
    type = django_filters.CharFilter(field_name="unit_type", lookup_expr="exact")
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")

    # ── Pricing ───────────────────────────────────────────────────────────────
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    # ── Room Details ──────────────────────────────────────────────────────────
    num_beds = django_filters.NumberFilter(field_name="num_beds", lookup_expr="exact")
    num_rooms = django_filters.NumberFilter(field_name="num_rooms", lookup_expr="exact")
    num_bathrooms = django_filters.NumberFilter(field_name="num_bathrooms", lookup_expr="exact")

    # ── Preferences ───────────────────────────────────────────────────────────
    gender = django_filters.CharFilter(field_name="gender_preference", lookup_expr="exact")

    # ── University (M2M) ─────────────────────────────────────────────────────
    university = django_filters.CharFilter(field_name="nearby_universities__name", lookup_expr="icontains")

    # ── Visibility ────────────────────────────────────────────────────────────
    is_featured = django_filters.BooleanFilter(field_name="is_featured")

    # ── Amenities & Bills (hardcoded booleans) ──────────────────────────────────
    has_internet = django_filters.BooleanFilter(field_name="has_internet")
    has_ac = django_filters.BooleanFilter(field_name="has_ac")
    has_water = django_filters.BooleanFilter(field_name="has_water")
    has_electricity = django_filters.BooleanFilter(field_name="has_electricity")
    has_gas = django_filters.BooleanFilter(field_name="has_gas")

    class Meta:
        model = Property
        fields = [
            "city", "district", "type", "status",
            "price_min", "price_max",
            "num_beds", "num_rooms", "num_bathrooms",
            "gender", "university",
            "is_featured",
            "has_internet", "has_ac", "has_water", "has_electricity", "has_gas",
        ]