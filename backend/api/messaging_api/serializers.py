"""
Messaging API serializers.

Serializers:
    - MessageSerializer          → single message (read)
    - ConversationListSerializer → inbox card — lightweight, last message + unread count
    - ConversationDetailSerializer → full thread with all messages
    - StartConversationSerializer  → POST /api/messages/start/ — opens or retrieves a DM
    - SendMessageSerializer        → POST /api/messages/<id>/ — send a new message
"""

from rest_framework import serializers
from messaging.models import Conversation, Message
from accounts.models import Users


class MessageSerializer(serializers.ModelSerializer):
    """
    Read serializer for a single message.
    Exposes sender info inline so the frontend never needs a second request.
    Body is replaced with a placeholder when the message is soft-deleted.
    """

    sender_id       = serializers.IntegerField(source="sender.id",              read_only=True)
    sender_username = serializers.CharField(source="sender.username",            read_only=True)
    sender_picture  = serializers.ImageField(source="sender.profile_picture",    read_only=True)
    # Whether the requesting user has read this message — set in context by the view
    is_read         = serializers.SerializerMethodField()
    body            = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = [
            "id",
            "sender_id", "sender_username", "sender_picture",
            "body", "is_deleted", "is_read",
            "created_at",
        ]

    def get_body(self, obj):
        """Return placeholder text instead of real content for deleted messages."""
        if obj.is_deleted:
            return "This message was deleted."
        return obj.body

    def get_is_read(self, obj):
        """True if the requesting user appears in read_by."""
        request = self.context.get("request")
        if not request:
            return False
        return obj.read_by.filter(id=request.user.id).exists()


class ConversationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the inbox card grid.
    Shows the other participant (DM) or group name, last message preview, and unread count.
    """

    title         = serializers.SerializerMethodField()
    avatar        = serializers.SerializerMethodField()  # profile picture or group cover
    last_message  = serializers.SerializerMethodField()
    unread_count  = serializers.SerializerMethodField()
    other_user_id = serializers.SerializerMethodField()  # NULL for group chats

    class Meta:
        model  = Conversation
        fields = [
            "id", "is_group",
            "title", "avatar", "other_user_id",
            "last_message", "unread_count",
            "updated_at",
        ]

    def _other_user(self, obj):
        """Returns the participant who is NOT the requesting user (DMs only)."""
        request = self.context.get("request")
        if not request or obj.is_group:
            return None
        return obj.participants.exclude(id=request.user.id).first()

    def get_title(self, obj):
        if obj.is_group and obj.group:
            return obj.group.name
        other = self._other_user(obj)
        return other.username if other else "Unknown"

    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.is_group and obj.group and obj.group.cover_image:
            return request.build_absolute_uri(obj.group.cover_image.url) if request else None
        other = self._other_user(obj)
        if other and other.profile_picture:
            return request.build_absolute_uri(other.profile_picture.url) if request else None
        return None

    def get_other_user_id(self, obj):
        other = self._other_user(obj)
        return other.id if other else None

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if not msg:
            return None
        body = "This message was deleted." if msg.is_deleted else msg.body
        return {
            "sender":     msg.sender.username if msg.sender else "deleted",
            "body":       body,
            "created_at": msg.created_at,
        }

    def get_unread_count(self, obj):
        """Messages in this conversation the requesting user has NOT read yet."""
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.exclude(read_by=request.user).exclude(sender=request.user).count()


class ConversationDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for the open chat thread.
    Includes all messages and participant list.
    """

    messages     = MessageSerializer(many=True, read_only=True)
    participants = serializers.SerializerMethodField()
    title        = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = [
            "id", "is_group", "title",
            "participants",
            "messages",
            "created_at", "updated_at",
        ]

    def get_title(self, obj):
        if obj.is_group and obj.group:
            return obj.group.name
        request = self.context.get("request")
        other   = obj.participants.exclude(id=request.user.id).first() if request else None
        return other.username if other else "Unknown"

    def get_participants(self, obj):
        return [
            {
                "id":              u.id,
                "username":        u.username,
                "profile_picture": (
                    self.context["request"].build_absolute_uri(u.profile_picture.url)
                    if u.profile_picture and self.context.get("request")
                    else None
                ),
                "role": u.role,
            }
            for u in obj.participants.all()
        ]


class StartConversationSerializer(serializers.Serializer):
    """
    Write serializer for opening a DM with another user.
    If a conversation between these two users already exists, it is returned (no duplicate created).

    Body: { "user_id": <int> }
    """

    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        request = self.context["request"]

        if value == request.user.id:
            raise serializers.ValidationError("You cannot start a conversation with yourself.")

        try:
            Users.objects.get(id=value)
        except Users.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        return value

    def get_or_create_conversation(self):
        """
        Finds an existing DM between the two users or creates a new one.
        Returns (conversation, created).
        """
        request    = self.context["request"]
        other_user = Users.objects.get(id=self.validated_data["user_id"])

        # Look for an existing DM that contains exactly these two participants
        existing = (
            Conversation.objects
            .filter(is_group=False, participants=request.user)
            .filter(participants=other_user)
        )
        if existing.exists():
            return existing.first(), False

        conv = Conversation.objects.create(is_group=False)
        conv.participants.add(request.user, other_user)
        return conv, True


class SendMessageSerializer(serializers.ModelSerializer):
    """
    Write serializer for sending a message into an existing Conversation.
    sender and conversation are injected by the view — never from request body.
    """

    class Meta:
        model  = Message
        fields = ["body"]

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message body cannot be empty.")
        return value
