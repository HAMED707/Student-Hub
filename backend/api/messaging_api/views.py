

from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from messaging.models import Conversation, Message
from accounts.models import Users
from bookings.models import Booking
from api.messaging_api.serializers import (
    ConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
    StartConversationSerializer,
)



class ConversationView(APIView):
    """
    GET  /api/messages/  → list all my conversations
    POST /api/messages/  → start a new conversation (or return existing one)
 
    Both methods live on the same view so they share one URL cleanly.
    Django routes to get() or post() based on the HTTP method.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(
            Q(initiator=request.user) | Q(receiver=request.user)
        ).prefetch_related("messages")
        serializer = ConversationSerializer(conversations, many=True, context={"request": request})
        return Response(serializer.data)
    
    def post(self, request):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        receiver_id = serializer.validated_data.get("receiver_id")
        receiver    = Users.objects.get(id=receiver_id)
        booking_id  = serializer.validated_data.get("booking_id")
        booking     = Booking.objects.get(id=booking_id) if booking_id else None

         # Return existing conversation if one already exists for this pai
        conv = Conversation.objects.filter(
            Q(initiator=request.user, receiver=receiver) |
            Q(initiator=receiver,     receiver=request.user),
            booking=booking
        ).first()

        if not conv:
            conv = Conversation.objects.create(
                initiator=request.user,
                receiver=receiver,
                booking=booking,
                property=booking.property if booking else None,
            )

        # Create first message
        Message.objects.create(
            conversation=conv,
            sender=request.user,
            body=serializer.validated_data.get("message"),
        )
        conv.touch()

        return Response(
            ConversationSerializer(conv, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


#────────────────────────────────────────────────────────────────────────────────────────────

class MessageView(APIView):
    """
    GET  /api/messages/<id>/ — load conversation history.
    POST /api/messages/<id>/ — send a message in an existing conversation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conv = Conversation.objects.get(
                Q(initiator=request.user) | Q(receiver=request.user),
                id=conversation_id,
            )
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        messages   = conv.messages.select_related("sender")
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, conversation_id):
        try:
            conv = Conversation.objects.get(
                Q(initiator=request.user) | Q(receiver=request.user),
                id=conversation_id,
            )
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conv,
            sender=request.user,
            body=serializer.validated_data["body"],
        )
        conv.touch()

        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


class MessageReadView(APIView):
    """
    POST /api/messages/<id>/read/ — mark incoming messages in one conversation as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conv = Conversation.objects.get(
                Q(initiator=request.user) | Q(receiver=request.user),
                id=conversation_id,
            )
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        marked_read = (
            conv.messages
            .filter(is_read=False)
            .exclude(sender=request.user)
            .update(is_read=True)
        )

        return Response({"marked_read": marked_read}, status=status.HTTP_200_OK)


    
