"""
Community API views.
"""

from __future__ import annotations

from django.db.models import Count, Exists, IntegerField, OuterRef, Prefetch, Subquery, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from community.models import Comment, Group, GroupChatMessage, GroupChatReadState, GroupMembership, Post, PostVote
from api.community_api.serializers import (
    CommentCreateSerializer,
    CommentSerializer,
    GroupChatMessageCreateSerializer,
    GroupChatMessageSerializer,
    GroupChatSummarySerializer,
    GroupCreateSerializer,
    GroupListSerializer,
    GroupSerializer,
    PostCreateSerializer,
    PostSerializer,
)


def get_group_or_404(group_id):
    try:
        return Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return None


def is_member(user, group):
    return GroupMembership.objects.filter(user=user, group=group).exists()


def community_group_queryset(user):
    return Group.objects.select_related("creator").prefetch_related(
        Prefetch(
            "memberships",
            queryset=GroupMembership.objects.filter(user=user),
            to_attr="request_user_memberships",
        ),
        Prefetch(
            "chat_read_states",
            queryset=GroupChatReadState.objects.filter(user=user),
            to_attr="request_user_read_states",
        ),
    )


class GroupListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = community_group_queryset(request.user).order_by("-updated_at", "-created_at")

        category = request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        queryset = queryset.annotate(
            is_member=Exists(
                GroupMembership.objects.filter(group=OuterRef("pk"), user=request.user)
            )
        )

        serializer = GroupListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyGroupsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_ids = GroupMembership.objects.filter(user=request.user).values_list("group_id", flat=True)
        queryset = community_group_queryset(request.user).filter(id__in=group_ids).order_by(
            "-updated_at",
            "-created_at",
        )
        serializer = GroupSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = community_group_queryset(request.user).filter(id=group_id).first()
        if not group:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = GroupSerializer(group, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupCreateView(APIView):
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
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_group_or_404(group_id)
        if not group:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        if GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({"error": "You are already a member of this group."}, status=status.HTTP_400_BAD_REQUEST)

        GroupMembership.objects.create(user=request.user, group=group, role="member")
        return Response(
            GroupSerializer(group, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class GroupLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_group_or_404(group_id)
        if not group:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            membership = GroupMembership.objects.get(user=request.user, group=group)
        except GroupMembership.DoesNotExist:
            return Response({"error": "You are not a member of this group."}, status=status.HTTP_400_BAD_REQUEST)

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_id = request.query_params.get("group")
        if not group_id:
            return Response({"error": "Query param 'group' is required."}, status=status.HTTP_400_BAD_REQUEST)

        group = get_group_or_404(group_id)
        if not group:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        if not is_member(request.user, group):
            return Response(
                {"error": "You must join this group to view its posts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        posts = (
            Post.objects.filter(group=group)
            .select_related("author")
            .annotate(
                vote_score=Coalesce(Sum("votes__value"), 0),
                user_vote=Coalesce(
                    Subquery(
                        PostVote.objects.filter(post=OuterRef("pk"), user=request.user)
                        .values("value")[:1],
                        output_field=IntegerField(),
                    ),
                    0,
                ),
                comment_count=Count("comments"),
            )
            .order_by("-vote_score", "-created_at")
        )
        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class PostCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        group_id = request.data.get("group")
        if not group_id:
            return Response({"error": "Field 'group' is required."}, status=status.HTTP_400_BAD_REQUEST)

        group = get_group_or_404(group_id)
        if not group:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

        if not is_member(request.user, group):
            return Response(
                {"error": "You must join this group before posting."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PostCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        post = serializer.save(author=request.user, group=group)
        Group.objects.filter(id=group.id).update(updated_at=timezone.now())
        return Response(PostSerializer(post, context={"request": request}).data, status=status.HTTP_201_CREATED)


class GroupChatListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group_ids = GroupMembership.objects.filter(user=request.user).values_list("group_id", flat=True)
        queryset = community_group_queryset(request.user).filter(id__in=group_ids).order_by(
            "-updated_at",
            "-created_at",
        )
        serializer = GroupChatSummarySerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupChatMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = get_group_or_404(group_id)
        if not group:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        if not is_member(request.user, group):
            return Response({"error": "You must join this group to open its chat."}, status=status.HTTP_403_FORBIDDEN)

        messages = group.chat_messages.select_related("sender", "group")
        serializer = GroupChatMessageSerializer(messages, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, group_id):
        group = get_group_or_404(group_id)
        if not group:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        if not is_member(request.user, group):
            return Response({"error": "You must join this group to send messages."}, status=status.HTTP_403_FORBIDDEN)

        serializer = GroupChatMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = GroupChatMessage.objects.create(
            group=group,
            sender=request.user,
            body=serializer.validated_data["body"],
        )
        Group.objects.filter(id=group.id).update(updated_at=timezone.now())
        return Response(GroupChatMessageSerializer(message, context={"request": request}).data, status=status.HTTP_201_CREATED)


class GroupChatReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_group_or_404(group_id)
        if not group:
            return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
        if not is_member(request.user, group):
            return Response({"error": "You must join this group to read its chat."}, status=status.HTTP_403_FORBIDDEN)

        read_state, _ = GroupChatReadState.objects.get_or_create(group=group, user=request.user)
        unread_qs = group.chat_messages.exclude(sender=request.user)
        if read_state.last_read_at:
            unread_qs = unread_qs.filter(created_at__gt=read_state.last_read_at)

        marked_read = unread_qs.count()
        latest_message_time = group.chat_messages.order_by("-created_at").values_list("created_at", flat=True).first()
        read_state.last_read_at = latest_message_time or timezone.now()
        read_state.save(update_fields=["last_read_at"])

        return Response({"marked_read": marked_read}, status=status.HTTP_200_OK)


class PostVoteView(APIView):
    """POST with {"value": 1 or -1}. Re-voting same value toggles (removes) the vote."""

    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)

        if not is_member(request.user, post.group):
            return Response({"error": "Join the group to vote."}, status=status.HTTP_403_FORBIDDEN)

        value = request.data.get("value")
        if value not in (1, -1, "1", "-1"):
            return Response({"error": "value must be 1 or -1."}, status=status.HTTP_400_BAD_REQUEST)
        value = int(value)

        existing = PostVote.objects.filter(post=post, user=request.user).first()
        if existing:
            if existing.value == value:
                existing.delete()
                user_vote = 0
            else:
                existing.value = value
                existing.save(update_fields=["value"])
                user_vote = value
        else:
            PostVote.objects.create(post=post, user=request.user, value=value)
            user_vote = value

        score = PostVote.objects.filter(post=post).aggregate(total=Coalesce(Sum("value"), 0))["total"]
        return Response({"score": score, "user_vote": user_vote}, status=status.HTTP_200_OK)


class PostCommentView(APIView):
    """GET: list comments for a post. POST: create a comment."""

    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)

        if not is_member(request.user, post.group):
            return Response({"error": "Join the group to view comments."}, status=status.HTTP_403_FORBIDDEN)

        comments = post.comments.select_related("author")
        return Response(CommentSerializer(comments, many=True, context={"request": request}).data)

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)

        if not is_member(request.user, post.group):
            return Response({"error": "Join the group to comment."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CommentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        comment = serializer.save(post=post, author=request.user)
        return Response(
            CommentSerializer(comment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )
