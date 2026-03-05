"""
Messaging API views.

Views:
    - ConversationListView   → GET  /api/messages/            ← inbox
    - ConversationDetailView → GET  /api/messages/<id>/       ← open thread + mark read
    - SendMessageView        → POST /api/messages/<id>/       ← send a message
    - StartConversationView  → POST /api/messages/start/      ← open or retrieve a DM
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from messaging.models import Conversation, Message
from api.messaging_api.serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    StartConversationSerializer,
    SendMessageSerializer,
    MessageSerializer,
)


class ConversationListView(APIView):
    """
    GET /api/messages/
    Returns every conversation the requesting user is a participant of,
    ordered by most recently updated (newest message first).
    Includes unread count per conversation so the inbox badge is instant.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = (
            Conversation.objects
            .filter(participants=request.user)
            .prefetch_related("participants", "messages", "messages__read_by", "messages__sender")
            .select_related("group")
        )
        serializer = ConversationListSerializer(
            conversations,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConversationDetailView(APIView):
    """
    GET /api/messages/<id>/
    Opens a conversation thread and marks all unread messages as read.
    Only participants may access the thread (403 otherwise).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = (
                Conversation.objects
                .prefetch_related(
                    "participants",
                    "messages",
                    "messages__sender",
                    "messages__read_by",
                )
                .select_related("group")
                .get(id=conversation_id)
            )
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        # Only participants can read the thread
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response({"error": "You are not a participant of this conversation."}, status=status.HTTP_403_FORBIDDEN)

        # Mark all messages the user hasn't read yet as read (bulk, single query)
        unread_ids = (
            conversation.messages
            .exclude(read_by=request.user)
            .exclude(sender=request.user)
            .values_list("id", flat=True)
        )
        for msg in Message.objects.filter(id__in=unread_ids):
            msg.read_by.add(request.user)

        serializer = ConversationDetailSerializer(
            conversation,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class SendMessageView(APIView):
    """
    POST /api/messages/<id>/
    Send a new message into an existing conversation.
    Only participants can send (403 otherwise).
    Bumps conversation.updated_at so the inbox re-sorts correctly.

    Body: { "body": "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        # Only participants can post into the thread
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response({"error": "You are not a participant of this conversation."}, status=status.HTTP_403_FORBIDDEN)

        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.save(sender=request.user, conversation=conversation)

        # Auto-mark as read by the sender
        message.read_by.add(request.user)

        # Bump updated_at on conversation so inbox ordering updates
        conversation.save(update_fields=["updated_at"])

        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class StartConversationView(APIView):
    """
    POST /api/messages/start/
    Opens a DM with another user.
    - If a DM already exists between the two users, returns it (no duplicate created).
    - Returns 201 on new creation, 200 on existing thread.

    Body: { "user_id": <int> }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartConversationSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        conversation, created = serializer.get_or_create_conversation()

        response_serializer = ConversationDetailSerializer(
            conversation,
            context={"request": request},
        )
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(response_serializer.data, status=http_status)
