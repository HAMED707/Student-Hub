from django.urls import path
from api.messaging_api.views import (
    ConversationView,
    MessageView,
)

urlpatterns = [
    path("",                       ConversationView.as_view(),  name="conversations"),
    path("<int:conversation_id>/", MessageView.as_view(),   name="messages"),
]