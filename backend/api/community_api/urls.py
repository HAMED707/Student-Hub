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
    path("community/groups/",              GroupListView.as_view(),   name="community-group-list"),
    path("community/groups/my/",           MyGroupsView.as_view(),    name="community-my-groups"),
    path("community/groups/<int:group_id>/",       GroupDetailView.as_view(), name="community-group-detail"),
    path("community/groups/create/",       GroupCreateView.as_view(), name="community-group-create"),
    path("community/groups/<int:group_id>/join/",  GroupJoinView.as_view(),   name="community-group-join"),
    path("community/groups/<int:group_id>/leave/", GroupLeaveView.as_view(),  name="community-group-leave"),

    # ── Posts ─────────────────────────────────────────────────────────────────
    path("community/posts/",               PostListView.as_view(),    name="community-post-list"),
    path("community/posts/create/",        PostCreateView.as_view(),  name="community-post-create"),
]
