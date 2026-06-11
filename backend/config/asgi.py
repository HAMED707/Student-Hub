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