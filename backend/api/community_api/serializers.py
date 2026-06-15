"""
Community API serializers.
"""

from __future__ import annotations

from django.db.models import Q
from rest_framework import serializers

from community.models import Comment, Group, GroupChatMessage, GroupChatReadState, GroupMembership, Post, PostVote


class _AuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    profile_picture = serializers.ImageField(read_only=True)


class _SenderSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    profile_picture = serializers.ImageField(read_only=True)


class GroupListSerializer(serializers.ModelSerializer):
    description = serializers.CharField(read_only=True)
    creator_name = serializers.SerializerMethodField()
    is_member = serializers.BooleanField(read_only=True)
    unread_count = serializers.SerializerMethodField()
    recent_posts_count = serializers.SerializerMethodField()
    latest_post_excerpt = serializers.SerializerMethodField()
    latest_activity_at = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "description",
            "category",
            "cover_image",
            "member_count",
            "is_private",
            "creator_name",
            "is_member",
            "created_at",
            "updated_at",
            "unread_count",
            "recent_posts_count",
            "latest_post_excerpt",
            "latest_activity_at",
        ]

    def _get_read_state(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        prefetched = getattr(obj, "request_user_read_states", None)
        if prefetched is not None:
            return prefetched[0] if prefetched else None
        return GroupChatReadState.objects.filter(group=obj, user=request.user).first()

    def _get_membership(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        prefetched = getattr(obj, "request_user_memberships", None)
        if prefetched is not None:
            return prefetched[0] if prefetched else None
        return obj.memberships.filter(user=request.user).first()

    def get_creator_name(self, obj):
        if obj.creator:
            return f"{obj.creator.first_name} {obj.creator.last_name}".strip()
        return None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        if not self._get_membership(obj):
            return 0
        read_state = self._get_read_state(obj)
        messages = obj.chat_messages.exclude(sender=request.user)
        if not read_state or not read_state.last_read_at:
            return messages.count()
        return messages.filter(created_at__gt=read_state.last_read_at).count()

    def get_recent_posts_count(self, obj):
        return obj.posts.count()

    def get_latest_post_excerpt(self, obj):
        latest_post = obj.posts.order_by("-created_at").first()
        if not latest_post:
            return ""
        return latest_post.content[:140]

    def get_latest_activity_at(self, obj):
        latest_post = obj.posts.order_by("-created_at").values_list("created_at", flat=True).first()
        latest_message = obj.chat_messages.order_by("-created_at").values_list("created_at", flat=True).first()
        return max(filter(None, [latest_post, latest_message, obj.updated_at]), default=obj.updated_at)


class GroupSerializer(serializers.ModelSerializer):
    is_member = serializers.SerializerMethodField()
    member_role = serializers.SerializerMethodField()
    creator_name = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    recent_posts_count = serializers.SerializerMethodField()
    latest_post_excerpt = serializers.SerializerMethodField()
    latest_activity_at = serializers.SerializerMethodField()
    latest_chat_message = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "description",
            "category",
            "cover_image",
            "member_count",
            "is_private",
            "creator_name",
            "is_member",
            "member_role",
            "created_at",
            "updated_at",
            "unread_count",
            "recent_posts_count",
            "latest_post_excerpt",
            "latest_activity_at",
            "latest_chat_message",
        ]

    def get_creator_name(self, obj):
        if obj.creator:
            return f"{obj.creator.first_name} {obj.creator.last_name}".strip()
        return None

    def get_is_member(self, obj):
        return bool(GroupListSerializer(context=self.context)._get_membership(obj))

    def get_member_role(self, obj):
        membership = GroupListSerializer(context=self.context)._get_membership(obj)
        return membership.role if membership else None

    def get_unread_count(self, obj):
        return GroupListSerializer(context=self.context).get_unread_count(obj)

    def get_recent_posts_count(self, obj):
        return obj.posts.count()

    def get_latest_post_excerpt(self, obj):
        return GroupListSerializer(context=self.context).get_latest_post_excerpt(obj)

    def get_latest_activity_at(self, obj):
        return GroupListSerializer(context=self.context).get_latest_activity_at(obj)

    def get_latest_chat_message(self, obj):
        latest = obj.chat_messages.select_related("sender").order_by("-created_at").first()
        if not latest:
            return None
        return {
            "id": latest.id,
            "body": latest.body,
            "sender_id": latest.sender_id,
            "sender_name": latest.sender.get_full_name() or latest.sender.username,
            "created_at": latest.created_at,
        }


class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["name", "description", "category", "cover_image", "is_private"]

    def validate_name(self, value):
        if Group.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("A group with this name already exists.")
        return value

    def create(self, validated_data):
        creator = validated_data.pop("creator")
        group = Group.objects.create(creator=creator, **validated_data)
        GroupMembership.objects.create(user=creator, group=group, role="admin")
        return group


class CommentSerializer(serializers.ModelSerializer):
    author = _AuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "text", "created_at"]


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["text"]

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment text cannot be empty.")
        return value

    def create(self, validated_data):
        return Comment.objects.create(**validated_data)


class PostSerializer(serializers.ModelSerializer):
    author        = _AuthorSerializer(read_only=True)
    vote_score    = serializers.IntegerField(read_only=True, default=0)
    user_vote     = serializers.IntegerField(read_only=True, default=0)
    comment_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Post
        fields = [
            "id", "author", "group", "title", "content", "image",
            "vote_score", "user_vote", "comment_count",
            "created_at", "updated_at",
        ]


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ["title", "content", "image"]

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Post content cannot be empty.")
        return value

    def create(self, validated_data):
        return Post.objects.create(**validated_data)


class GroupChatMessageSerializer(serializers.ModelSerializer):
    sender = _SenderSerializer(read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = GroupChatMessage
        fields = [
            "id",
            "group",
            "sender",
            "sender_name",
            "body",
            "created_at",
            "updated_at",
        ]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username


class GroupChatSummarySerializer(serializers.ModelSerializer):
    is_member = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "category",
            "cover_image",
            "member_count",
            "is_member",
            "unread_count",
            "last_message",
            "last_message_at",
        ]

    def get_is_member(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.memberships.filter(user=request.user).exists()

    def get_unread_count(self, obj):
        return GroupListSerializer(context=self.context).get_unread_count(obj)

    def get_last_message(self, obj):
        latest = obj.chat_messages.select_related("sender").order_by("-created_at").first()
        if not latest:
            return None
        return {
            "id": latest.id,
            "body": latest.body,
            "sender_id": latest.sender_id,
            "sender_name": latest.sender.get_full_name() or latest.sender.username,
            "created_at": latest.created_at,
        }

    def get_last_message_at(self, obj):
        return obj.chat_messages.order_by("-created_at").values_list("created_at", flat=True).first()


class GroupChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupChatMessage
        fields = ["body"]

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message body cannot be empty.")
        return value
