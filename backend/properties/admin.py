"""
Properties app admin.
Registers Property and PropertyImage for manual management in /admin.
"""
from django.contrib import admin
from properties.models import Property, PropertyImage, University, City, Transport


class PropertyAdminMedia:
    """Auto-fills room_price / bed_price when price / num_rooms / num_beds change."""
    class Media:
        js = ("admin/js/property_autocalc.js",)


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ["image", "is_cover", "uploaded_at"]
    readonly_fields = ["uploaded_at"]


@admin.register(Property)
class PropertyAdmin(PropertyAdminMedia, admin.ModelAdmin):
    inlines = [PropertyImageInline]

    list_display = [
        "title", "landlord", "unit_type", "rental_mode", "price", "room_price", "bed_price",
        "city", "status", "available_from", "is_featured", "view_count", "created_at",
    ]
    list_filter = ["unit_type", "rental_mode", "status", "is_featured", "city", "gender_preference"]
    search_fields = ["title", "landlord__username", "city__name", "district", "nearby_universities__name"]
    readonly_fields = ["view_count", "created_at", "updated_at"]
    filter_horizontal = ["nearby_universities", "transport_types"]
    list_editable = ["is_featured", "status"]

    fieldsets = (
        ("Ownership", {
            "fields": ("landlord",),
        }),
        ("Basic Info", {
            "fields": ("title", "description", "unit_type"),
        }),
        ("Pricing & Stay", {
            "fields": ("rental_mode", "price", "room_price", "bed_price", "available_from", "min_stay_months", "max_stay_months"),
        }),
        ("Location", {
            "fields": ("city", "district", "address", "latitude", "longitude"),
        }),
        ("University Proximity", {
            "fields": ("nearby_universities", "distance_to_university", "transport_types"),
        }),
        ("Room Details", {
            "fields": (
                "num_rooms", "num_beds", "num_bathrooms",
                "floor", "area_sqm", "gender_preference",
            ),
        }),
        ("Amenities & Bills", {
            "fields": ("has_internet", "has_ac", "has_water", "has_electricity", "has_gas"),
        }),
        ("Status & Visibility", {
            "fields": ("status", "is_featured"),
        }),
        ("Analytics (read-only)", {
            "fields": ("view_count", "created_at", "updated_at"),
        }),
    )


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ["name", "city"]
    list_filter = ["city"]
    search_fields = ["name", "city__name"]


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ["property", "is_cover", "uploaded_at"]
    list_filter = ["is_cover"]
    search_fields = ["property__title", "property__landlord__username"]
    readonly_fields = ["uploaded_at"]
