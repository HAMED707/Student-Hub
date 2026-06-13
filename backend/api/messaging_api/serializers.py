

from rest_framework import serializers

from messaging.models import Conversation, Message
from accounts.models import Users
from bookings.models import Booking
 




class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True) #
    
    class Meta:
        model  = Message
        fields = ["id", "conversation", "sender", "sender_name", "body", "is_read", "created_at"]
        read_only_fields = fields

#────────────────────────────────────────────────────────────────────────────────────────────

class ConversationSerializer(serializers.ModelSerializer):
    last_message  = serializers.SerializerMethodField()# why i need the last message 
    unread_count  = serializers.SerializerMethodField()
    other_user    = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ["id", "initiator", "receiver", "booking", "property",
                  "other_user", "last_message", "unread_count", "created_at", "updated_at"]
        read_only_fields = fields

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if not msg:
            return None
        return {"body": msg.body, "created_at": msg.created_at, "sender": msg.sender_id}# sender_id from where

    def get_unread_count(self, obj):#we have in view??
        user = self.context["request"].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_other_user(self, obj):
        user = self.context["request"].user
        other = obj.receiver if obj.initiator == user else obj.initiator
        return {
            "id": other.id,
            "name": other.get_full_name() or other.username,
            "profile_picture": str(other.profile_picture) if other.profile_picture else None,
        }

#────────────────────────────────────────────────────────────────────────────────────────────

class StartConversationSerializer(serializers.Serializer):
    receiver_id = serializers.IntegerField()
    booking_id  = serializers.IntegerField(required=False)
    message     = serializers.CharField()

    def validate_receiver_id(self, value):
        try:
            Users.objects.get(id=value)
        except Users.DoesNotExist:
            raise serializers.ValidationError("User not found.")
        return value


class SendMessageSerializer(serializers.Serializer):
    body = serializers.CharField()
