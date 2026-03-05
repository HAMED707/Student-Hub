"""Messaging app admin registration."""

from django.contrib import admin
from messaging.models import Conversation, Message


class MessageInline(admin.TabularInline):
    model  = Message
    extra  = 0
    fields = ["sender", "body", "is_deleted", "created_at"]
    readonly_fields = ["created_at"]


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display   = ["id", "is_group", "group", "updated_at", "created_at"]
    list_filter    = ["is_group"]
    search_fields  = ["group__name", "participants__username"]
    readonly_fields = ["created_at", "updated_at"]
    filter_horizontal = ["participants"]
    inlines        = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display   = ["id", "conversation", "sender", "is_deleted", "created_at"]
    list_filter    = ["is_deleted", "created_at"]
    search_fields  = ["sender__username", "body"]
    readonly_fields = ["created_at"]
    ordering       = ["-created_at"]