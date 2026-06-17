"""
Chatbot API views.

Views:
    - ChatView → GET/POST /api/chatbot/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from chatbot.models import ChatMessage
from chatbot.services import handle_chat_turn
from api.accounts_api.permissions import IsStudent
from api.chatbot_api.serializers import ChatMessageSerializer, SendMessageSerializer


class ChatView(APIView):
    """
    GET  /api/chatbot/  → full message history for the logged-in student
    POST /api/chatbot/  → send a message, get the assistant's reply
    """

    permission_classes = [IsStudent]

    def get(self, request):
        messages = ChatMessage.objects.filter(user=request.user)
        return Response(ChatMessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reply = handle_chat_turn(request.user, serializer.validated_data["message"])
        except Exception:
            return Response(
                {"error": "The assistant is temporarily unavailable. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({"reply": reply}, status=status.HTTP_200_OK)
