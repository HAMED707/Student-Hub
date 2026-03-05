"""Admin registrations for the community app."""

from django.contrib import admin
from community.models import Group, GroupMembership, Post


class MembershipInline(admin.TabularInline):
    model  = GroupMembership
    extra  = 0
    fields = ("user", "role", "joined_at")
    readonly_fields = ("joined_at",)


class PostInline(admin.TabularInline):
    model  = Post
    extra  = 0
    fields = ("author", "content", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display  = ("name", "category", "member_count", "is_private", "creator", "created_at")
    list_filter   = ("category", "is_private")
    search_fields = ("name", "description")
    readonly_fields = ("member_count", "created_at", "updated_at")
    inlines       = [MembershipInline, PostInline]


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display  = ("user", "group", "role", "joined_at")
    list_filter   = ("role",)
    search_fields = ("user__email", "group__name")
    readonly_fields = ("joined_at",)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display  = ("author", "group", "created_at")
    list_filter   = ("group",)
    search_fields = ("author__email", "content")
    readonly_fields = ("created_at", "updated_at")