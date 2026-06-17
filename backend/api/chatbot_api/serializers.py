"""Chatbot API serializers."""

from rest_framework import serializers
from chatbot.models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "content", "created_at"]
        read_only_fields = fields


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField()
