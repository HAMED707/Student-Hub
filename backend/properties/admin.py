"""
Properties app admin.
Registers Property and PropertyImage for manual management in /admin.
"""
from django.contrib import admin
from properties.models import Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    """
    Inline editor for images directly inside the Property admin page.
    Lets admin preview, add, or remove photos without leaving the listing.
    """
    model = PropertyImage
    extra = 1  # show 1 blank upload row by default
    fields = ["image", "is_cover", "uploaded_at"]
    readonly_fields = ["uploaded_at"]


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    """
    Main listing admin. is_featured is editable from the list view directly
    so admin can feature/unfeature listings without opening each one.
    """
    inlines = [PropertyImageInline]

    list_display = [
        "title", "owner", "property_type", "price",
        "city", "status", "is_featured", "view_count", "created_at",
    ]
    list_filter = ["property_type", "status", "is_featured", "city", "gender_preference"]
    search_fields = ["title", "owner__username", "city", "district", "nearby_university"]
    readonly_fields = ["view_count", "created_at", "updated_at"]

    # Allow featuring/unfeaturing directly from the list without opening each record
    list_editable = ["is_featured", "status"]

    fieldsets = (
        ("Ownership", {
            "fields": ("owner",),
        }),
        ("Basic Info", {
            "fields": ("title", "description", "property_type"),
        }),
        ("Pricing & Stay", {
            "fields": ("price", "min_stay_months", "max_stay_months"),
        }),
        ("Location", {
            "fields": ("city", "district", "address", "latitude", "longitude"),
        }),
        ("University Proximity", {
            "fields": ("nearby_university", "distance_to_university", "transport_type"),
        }),
        ("Room Details", {
            "fields": (
                "num_rooms", "num_beds", "num_bathrooms",
                "num_roommates", "floor", "area_sqm", "gender_preference",
            ),
        }),
        ("Amenities", {
            "fields": ("amenities",),
        }),
        ("Status & Visibility", {
            "fields": ("status", "is_featured"),
        }),
        ("Analytics (read-only)", {
            "fields": ("view_count", "created_at", "updated_at"),
        }),
    )


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    """
    Standalone image admin — useful for bulk cleanup or reviewing uploads.
    Day-to-day image management happens via the inline above.
    """
    list_display = ["property", "is_cover", "uploaded_at"]
    list_filter = ["is_cover"]
    search_fields = ["property__title", "property__owner__username"]
    readonly_fields = ["uploaded_at"]