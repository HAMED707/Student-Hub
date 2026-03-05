"""Community API URL configuration."""

from django.urls import path
from api.community_api.views import (
    GroupListView,
    MyGroupsView,
    GroupDetailView,
    GroupCreateView,
    GroupJoinView,
    GroupLeaveView,
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

    # ── Posts ─────────────────────────────────────────────────────────────────
    path("posts/",               PostListView.as_view(),    name="community-post-list"),
    path("posts/create/",        PostCreateView.as_view(),  name="community-post-create"),
]
