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