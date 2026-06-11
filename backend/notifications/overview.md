## notifications Websocket setup ##


# ────────────────────────Start Routing────────────────────────────────────
```
"""
notifications/routing.py
ws://localhost:8000/ws/notifications/?token=<jwt>
"""

from django.urls import re_path
from notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    re_path(r"^ws/notifications/$", NotificationConsumer.as_asgi()),
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
"""
notifications/consumers.py

One-way personal channel — server pushes, client only connects/disconnects.
Connection URL:  ws://localhost:8000/ws/notifications/?token=<jwt>
Group name:      notifications_<user_id>
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Much simpler than ChatConsumer — no receive() logic needed.
    The only job is:
        connect()    → authenticate → join personal group → accept
        notify()     → forward group_send event to this WebSocket client
        disconnect() → leave group
    """

    async def connect(self):
        self.user = self.scope["user"]

        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        # Personal group — only this user's notifications land here
        self.group_name = f"notifications_{self.user.id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ── Event handler ─────────────────────────────────────────────────────────
    # Called by channel layer when _broadcast() does group_send(type="notify")

    async def notify(self, event):
        """Push the notification payload to the connected WebSocket client."""
        await self.send(text_data=json.dumps(event))
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
from messaging.routing      import websocket_urlpatterns as chat_patterns
from notifications.routing  import websocket_urlpatterns as notification_patterns

application = ProtocolTypeRouter({
    # All normal HTTP traffic goes through Django as usual
    "http": django_asgi_app,

    # WebSocket connections are authenticated first, then routed to consumers
    "websocket":# AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(
                chat_patterns + notification_patterns   
            )
        )
    #),
})

```
# ────────────────────────End Asgi──────────────────────────────────────









# ────────────────────────Start Apps────────────────────────────────────
```
"""Notifications app config — wires signals on startup."""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        import notifications.signals  # noqa: F401 — registers all signal handlers
```
# ────────────────────────End Apps──────────────────────────────────────













