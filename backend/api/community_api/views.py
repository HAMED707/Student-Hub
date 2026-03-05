"""
Community API views.

GroupListView          GET  /api/community/groups/
MyGroupsView           GET  /api/community/groups/my/
GroupDetailView        GET  /api/community/groups/<id>/
GroupCreateView        POST /api/community/groups/create/
GroupJoinView          POST /api/community/groups/<id>/join/
GroupLeaveView         POST /api/community/groups/<id>/leave/
PostListView           GET  /api/community/posts/?group=<id>
PostCreateView         POST /api/community/posts/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from community.models import Group, GroupMembership, Post
from api.community_api.serializers import (
    GroupListSerializer,
    GroupSerializer,
    GroupCreateSerializer,
    PostSerializer,
    PostCreateSerializer,
)


class GroupListView(APIView):
    """
    GET /api/community/groups/
    Returns all groups as lightweight cards.
    Optional filter: ?category=university|housing|social|study|other

    Open to all authenticated users (students + landlords can browse).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Group.objects.all()

        category = request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        serializer = GroupListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyGroupsView(APIView):
    """
    GET /api/community/groups/my/
    Returns all groups the requesting user has joined.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_ids = GroupMembership.objects.filter(user=request.user).values_list("group_id", flat=True)
        queryset  = Group.objects.filter(id__in=group_ids)
        serializer = GroupSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupDetailView(APIView):
    """
    GET /api/community/groups/<id>/
    Returns full group detail including membership status of the requester.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = GroupSerializer(group, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupCreateView(APIView):
    """
    POST /api/community/groups/create/
    Creates a new group and auto-enrolls the creator as admin.
    Any authenticated user can create a group.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GroupCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        group = serializer.save(creator=request.user)
        return Response(
            GroupSerializer(group, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class GroupJoinView(APIView):
    """
    POST /api/community/groups/<id>/join/
    Join a group.  Returns 400 if already a member.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        if GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({"error": "You are already a member of this group."}, status=status.HTTP_400_BAD_REQUEST)

        GroupMembership.objects.create(user=request.user, group=group, role="member")
        return Response(
            GroupSerializer(group, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class GroupLeaveView(APIView):
    """
    POST /api/community/groups/<id>/leave/
    Leave a group.
    - Returns 400 if the user is not a member.
    - Prevents the last admin from leaving (they must first promote another member).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            membership = GroupMembership.objects.get(user=request.user, group=group)
        except GroupMembership.DoesNotExist:
            return Response({"error": "You are not a member of this group."}, status=status.HTTP_400_BAD_REQUEST)

        # Guard: don't let the last admin abandon the group
        if membership.role == "admin":
            other_admins = GroupMembership.objects.filter(group=group, role="admin").exclude(user=request.user)
            if not other_admins.exists():
                return Response(
                    {"error": "You are the only admin. Promote another member before leaving."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        membership.delete()
        return Response({"detail": "You have left the group."}, status=status.HTTP_200_OK)


class PostListView(APIView):
    """
    GET /api/community/posts/?group=<id>
    Returns all posts for a group, newest first.
    The requesting user must be a member of the group to view its posts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_id = request.query_params.get("group")
        if not group_id:
            return Response({"error": "Query param 'group' is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        # Only members can read posts
        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response(
                {"error": "You must join this group to view its posts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        posts = Post.objects.filter(group=group).select_related("author")
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PostCreateView(APIView):
    """
    POST /api/community/posts/
    Body: { "group": <id>, "content": "...", "image": <optional file> }

    The user must be a member of the group to post.
    author is always the requesting user — never trusted from request body.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        group_id = request.data.get("group")
        if not group_id:
            return Response({"error": "Field 'group' is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        # Must be a member to post
        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response(
                {"error": "You must join this group before posting."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PostCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        post = serializer.save(author=request.user, group=group)
        return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)
