from django.urls import re_path

from community.consumers import GroupChatConsumer

websocket_urlpatterns = [
    re_path(r"^ws/community/groups/(?P<group_id>\d+)/chat/$", GroupChatConsumer.as_asgi()),
]
