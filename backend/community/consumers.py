import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_id = self.scope["url_route"]["kwargs"]["group_id"]
        self.room_group_name = f"community_group_{self.group_id}"
        self.user = self.scope["user"]

        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        if not await self._user_in_group():
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        body = data.get("body", "").strip()
        if not body:
            return

        message = await self._save_message(body)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "group_chat_message",
                "group_id": int(self.group_id),
                "id": message["id"],
                "sender": self.user.id,
                "sender_name": await self._get_full_name(),
                "body": message["body"],
                "created_at": message["created_at"],
            },
        )

    async def group_chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    @database_sync_to_async
    def _user_in_group(self):
        from community.models import GroupMembership

        return GroupMembership.objects.filter(group_id=self.group_id, user=self.user).exists()

    @database_sync_to_async
    def _save_message(self, body):
        from community.models import Group, GroupChatMessage

        group = Group.objects.get(id=self.group_id)
        message = GroupChatMessage.objects.create(
            group=group,
            sender=self.user,
            body=body,
        )
        Group.objects.filter(id=group.id).update(updated_at=timezone.now())
        return {
            "id": message.id,
            "body": message.body,
            "created_at": message.created_at.isoformat(),
        }

    @database_sync_to_async
    def _get_full_name(self):
        return self.user.get_full_name() or self.user.username
