from django.contrib import admin
from .models import NearbyPlace


@admin.register(NearbyPlace)
class NearbyPlaceAdmin(admin.ModelAdmin):
    list_display  = ("name", "place_type", "distance_m", "rating", "open_now", "cached_at")
    list_filter   = ("place_type", "open_now")
    search_fields = ("name", "address", "external_id")
    readonly_fields = ("cached_at",)