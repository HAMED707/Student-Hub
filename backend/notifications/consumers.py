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
        await self.send(
            text_data=json.dumps(
                {
                    **event,
                    "type": "notification",
                }
            )
        )
