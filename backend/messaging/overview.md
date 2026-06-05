## messaging Websocket setup ##


# ────────────────────────Start Routing────────────────────────────────────
```
from django.urls import re_path
from messaging.consumers import ChatConsumer


# The client connects to: ws://localhost:8000/ws/chat/<conversation_id>/?token=<jwt>

websocket_urlpatterns = [
    re_path(r"^ws/chat/(?P<conversation_id>\d+)/$", ChatConsumer.as_asgi()),
]
```
# ────────────────────────End Routing──────────────────────────────────────

# ────────────────────────Start Middleware────────────────────────────────────
```
from urllib.parse import parse_qs


from channels.middleware import BaseMiddleware

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken , TokenError

from accounts.models import Users

@database_sync_to_async
def get_user_from_token(token_key):

    """
    Validates the JWT access token and returns the matching User.
    Returns AnonymousUser if the token is missing, invalid, or expired.
    """
    try:
        token = AccessToken(token_key)
        return Users.objects.get(id=token["user_id"])
    except (InvalidToken, TokenError, Users.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):

    """
    Reads the JWT token from the WebSocket query string.

    The browser connects like:
        ws://localhost:8000/ws/chat/5/?token=eyJ...

    Normal DRF authentication (Authorization header) does not work for
    WebSocket connections — headers are not accessible the same way.
    Passing the token as a query param is the standard workaround.
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params       = parse_qs(query_string)
        token_list   = params.get("token",[])
        token        = token_list[0] if token_list else None

        scope["user"] = (
            await get_user_from_token(token)
            if token
            else AnonymousUser()
        )

        return await super().__call__(scope, receive, send)
```
# ────────────────────────End Middleware──────────────────────────────────────





# ────────────────────────Start Consumers────────────────────────────────────
```
import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.db.models import Q

class ChatConsumer(AsyncWebsocketConsumer):
    """
    Handles one WebSocket connection for a single conversation room.

    Channel group name: "chat_<conversation_id>"
    All members connected to the same conversation share this group.
    When any member sends a message, every member in the group receives it.

    Flow:
        connect()    → verify JWT user → verify membership → join group → accept
        receive()    → save message to DB → broadcast to group
        chat_message() → push event to this specific WebSocket client
        disconnect() → leave group
    """    
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"
        self.user            = self.scope["user"]

        # Reject anonymous connections immediately
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return
        # Reject users who are not part of this conversation
        if not await self._user_in_conversation():
            await self.close()
            return
        
        await self.channel_layer.group_add(self.room_group_name,self.channel_name)
        await self.accept()


    # ─────── receive ───────────────────────────────────────────────────────────
          
    async def receive(self, text_data):
        """
        Called when the connected client sends a message over the WebSocket.
        Saves it to the database then broadcasts it to the entire group.
        """

        try:
            data=json.loads(text_data)
        except json.JSONDecodeError:
            return
        
        body= data.get("body","").strip()
        if not body:
            return
        
        message = await self._save_message(body)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type":       "chat_message",
                "id":          message.id,
                "body":        message.body,
                "sender_id":   self.user.id, 
                "sender_name": await self._get_full_name(),
                "created_at" : str(message.created_at), 
            },
        )

    # ─────── send ───────────────────────────────────────────────────────────  
    async def chat_message(self,event):
        """
        Called by the channel layer when group_send delivers an event
        with type="chat_message". Pushes the payload to the WebSocket client.
        """ 
        await self.send(text_data=json.dumps(event))


    # ── Private DB helpers ────────────────────────────────────────────────────

    @database_sync_to_async
    def _user_in_conversation(self):
        from .models import Conversation
        return Conversation.objects.filter(
            Q(initiator=self.user) | Q(receiver=self.user),
            id=self.conversation_id,
        ).exists()
    
    @database_sync_to_async
    def _save_message(self,body):
        from .models import Conversation ,Message
        conversation=Conversation.objects.get(id=self.conversation_id)
        return Message.objects.create( 
            conversation=conversation,
            sender=self.user,
            body=body,
        )

    @database_sync_to_async
    def _get_full_name(self):
        return self.user.get_full_name()

    # ─────── disconnect ───────────────────────────────────────────────────────────    
    async def disconnect(self,close_code):
        await self.channel_layer.group_discard(self.room_group_name,self.channel_name)
```
# ────────────────────────End Consumers──────────────────────────────────────





# ────────────────────────Start Asgi────────────────────────────────────
```
"""
ASGI entry point for StudentHub.

Replaces the default wsgi.py as the server gateway when running with
Daphne or Uvicorn. Routes incoming connections by protocol:

    HTTP      → Django URL router → DRF views  (same as before)
    WebSocket → JWTAuthMiddleware → ChatConsumer

wsgi.py can stay in the project — it is still used by some deployment
tools for the HTTP-only path.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# get_asgi_application() must be called before any models or consumers
# are imported so Django's app registry is fully loaded first.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from messaging.middleware import JWTAuthMiddleware
from messaging.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    # All normal HTTP traffic goes through Django as usual
    "http": django_asgi_app,

    # WebSocket connections are authenticated first, then routed to consumers
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})

```
# ────────────────────────End Asgi──────────────────────────────────────









# ────────────────────────Start Apps────────────────────────────────────
```
from django.apps import AppConfig


class MessagingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "messaging"

```
# ────────────────────────End Apps──────────────────────────────────────













