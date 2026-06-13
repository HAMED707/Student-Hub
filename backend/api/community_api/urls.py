"""Community API URL configuration."""

from django.urls import path
from api.community_api.views import (
    GroupListView,
    MyGroupsView,
    GroupDetailView,
    GroupCreateView,
    GroupJoinView,
    GroupLeaveView,
    GroupChatListView,
    GroupChatMessageView,
    GroupChatReadView,
    PostListView,
    PostCreateView,
)

urlpatterns = [
    # ── Groups ───────────────────────────────────────────────────────────────
    path("groups/",              GroupListView.as_view(),   name="community-group-list"),
    path("groups/my/",           MyGroupsView.as_view(),    name="community-my-groups"),
    path("groups/<int:group_id>/",       GroupDetailView.as_view(), name="community-group-detail"),
    path("groups/create/",       GroupCreateView.as_view(), name="community-group-create"),
    path("groups/<int:group_id>/join/",  GroupJoinView.as_view(),   name="community-group-join"),
    path("groups/<int:group_id>/leave/", GroupLeaveView.as_view(),  name="community-group-leave"),
    path("chats/", GroupChatListView.as_view(), name="community-chat-list"),
    path("groups/<int:group_id>/messages/", GroupChatMessageView.as_view(), name="community-group-messages"),
    path("groups/<int:group_id>/messages/read/", GroupChatReadView.as_view(), name="community-group-messages-read"),

    # ── Posts ─────────────────────────────────────────────────────────────────
    path("posts/",               PostListView.as_view(),    name="community-post-list"),
    path("posts/create/",        PostCreateView.as_view(),  name="community-post-create"),
]
