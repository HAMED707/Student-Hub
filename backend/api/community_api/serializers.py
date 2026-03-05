"""
Community API serializers.

GroupSerializer          — full group detail (used in detail + my-groups)
GroupListSerializer      — lightweight card for browse list
GroupCreateSerializer    — POST create group
PostSerializer           — full post response
PostCreateSerializer     — POST new post
"""

from rest_framework import serializers
from community.models import Group, GroupMembership, Post


# ── Shared author snippet ─────────────────────────────────────────────────────

class _AuthorSerializer(serializers.Serializer):
    """Minimal author info embedded in Post responses."""
    id         = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name  = serializers.CharField(read_only=True)


# ── Group serializers ─────────────────────────────────────────────────────────

class GroupListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the group browse list.
    Adds `is_member` so the frontend can show Join / Leave immediately.
    """
    is_member = serializers.SerializerMethodField()

    class Meta:
        model  = Group
        fields = [
            "id", "name", "category", "cover_image",
            "member_count", "is_private", "is_member", "created_at",
        ]

    def get_is_member(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.memberships.filter(user=request.user).exists()


class GroupSerializer(serializers.ModelSerializer):
    """
    Full group detail — used for the group detail page and my-groups list.
    Includes creator name and the requesting user's membership role.
    """
    is_member   = serializers.SerializerMethodField()
    member_role = serializers.SerializerMethodField()
    creator_name = serializers.SerializerMethodField()

    class Meta:
        model  = Group
        fields = [
            "id", "name", "description", "category", "cover_image",
            "member_count", "is_private",
            "creator_name", "is_member", "member_role",
            "created_at", "updated_at",
        ]

    def get_creator_name(self, obj):
        if obj.creator:
            return f"{obj.creator.first_name} {obj.creator.last_name}".strip()
        return None

    def get_is_member(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.memberships.filter(user=request.user).exists()

    def get_member_role(self, obj):
        """Returns 'admin', 'member', or None if not a member."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else None


class GroupCreateSerializer(serializers.ModelSerializer):
    """Accepts name, description, category, cover_image, is_private."""

    class Meta:
        model  = Group
        fields = ["name", "description", "category", "cover_image", "is_private"]

    def validate_name(self, value):
        if Group.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("A group with this name already exists.")
        return value

    def create(self, validated_data):
        """
        Create the group and automatically enrol the creator as admin.
        member_count signal will fire and set count to 1.
        """
        creator = validated_data.pop("creator")
        group   = Group.objects.create(creator=creator, **validated_data)
        GroupMembership.objects.create(user=creator, group=group, role="admin")
        return group


# ── Post serializers ──────────────────────────────────────────────────────────

class PostSerializer(serializers.ModelSerializer):
    """Full post response with nested author info."""
    author = _AuthorSerializer(read_only=True)

    class Meta:
        model  = Post
        fields = ["id", "author", "group", "content", "image", "created_at", "updated_at"]


class PostCreateSerializer(serializers.ModelSerializer):
    """
    Accepts content and optional image.
    author and group are injected server-side — never trusted from request body.
    """

    class Meta:
        model  = Post
        fields = ["content", "image"]

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Post content cannot be empty.")
        return value

    def create(self, validated_data):
        """author and group are passed via save(author=..., group=...)."""
        return Post.objects.create(**validated_data)
