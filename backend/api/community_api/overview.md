## community app ##


# ────────────────────────Start URL─────────────────────────────────────

```
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

        
```

# ────────────────────────End URL───────────────────────────────────────



# ────────────────────────Start Serializer──────────────────────────────

```
"""
Community API serializers.

GroupSerializer          — full group detail (used in detail + my-groups)
GroupListSerializer      — lightweight card for browse list
GroupCreateSerializer    — POST create group
PostSerializer           — full post response
PostCreateSerializer     — POST new post
"""

from rest_framework import serializers
from community.models import Group, GroupMembership, Post


# ── Shared author snippet ─────────────────────────────────────────────────────

class _AuthorSerializer(serializers.Serializer):
    """Minimal author info embedded in Post responses."""
    id         = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name  = serializers.CharField(read_only=True)


# ── Group serializers ─────────────────────────────────────────────────────────

class GroupListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the group browse list.
    Adds `is_member` so the frontend can show Join / Leave immediately.
    """
    is_member = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Group
        fields = [
            "id", "name", "category", "cover_image",
            "member_count", "is_private", "is_member", "created_at",
        ]

    


class GroupSerializer(serializers.ModelSerializer):
    """
    Full group detail — used for the group detail page and my-groups list.
    Includes creator name and the requesting user's membership role.
    """
    is_member   = serializers.SerializerMethodField()
    member_role = serializers.SerializerMethodField()
    creator_name = serializers.SerializerMethodField()

    class Meta:
        model  = Group
        fields = [
            "id", "name", "description", "category", "cover_image",
            "member_count", "is_private",
            "creator_name", "is_member", "member_role",
            "created_at", "updated_at",
        ]

    def get_creator_name(self, obj):
        if obj.creator:
            return f"{obj.creator.first_name} {obj.creator.last_name}".strip()
        return None

    def get_is_member(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.memberships.filter(user=request.user).exists()

    def get_member_role(self, obj):
        """Returns 'admin', 'member', or None if not a member."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else None


class GroupCreateSerializer(serializers.ModelSerializer):
    """Accepts name, description, category, cover_image, is_private."""

    class Meta:
        model  = Group
        fields = ["name", "description", "category", "cover_image", "is_private"]

    def validate_name(self, value):
        if Group.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("A group with this name already exists.")
        return value

    def create(self, validated_data):
        """
        Create the group and automatically enrol the creator as admin.
        member_count signal will fire and set count to 1.
        """
        creator = validated_data.pop("creator")
        group   = Group.objects.create(creator=creator, **validated_data)
        GroupMembership.objects.create(user=creator, group=group, role="admin")
        return group


# ── Post serializers ──────────────────────────────────────────────────────────

class PostSerializer(serializers.ModelSerializer):
    """Full post response with nested author info."""
    author = _AuthorSerializer(read_only=True)

    class Meta:
        model  = Post
        fields = ["id", "author", "group", "content", "image", "created_at", "updated_at"]


class PostCreateSerializer(serializers.ModelSerializer):
    """
    Accepts content and optional image.
    author and group are injected server-side — never trusted from request body.
    """

    class Meta:
        model  = Post
        fields = ["content", "image"]

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Post content cannot be empty.")
        return value

    def create(self, validated_data):
        """author and group are passed via save(author=..., group=...)."""
        return Post.objects.create(**validated_data)


```

# ────────────────────────End Serializer────────────────────────────────




# ────────────────────────Start View────────────────────────────────────

```
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
from django.db.models import Exists, OuterRef 
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

        queryset = queryset.annotate(
            is_member=Exists(
                GroupMembership.objects.filter(group=OuterRef('pk'), user=request.user)
            )
        )

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
        serializer = PostSerializer(posts, many=True,context={"request": request})
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
        return Response(
            PostSerializer(post,context={"request": request}).data
                        , status=status.HTTP_201_CREATED
                        )


```

# ────────────────────────End View──────────────────────────────────────





# ────────────────────────Start Signals────────────────────────────────────
```
"""
Signals for the community app.

Keeps Group.member_count in sync whenever a GroupMembership is
created or deleted, avoiding expensive COUNT(*) queries on every
group list request.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from community.models import GroupMembership


@receiver(post_save, sender=GroupMembership)
def increment_member_count(sender, instance, created, **kwargs):
    """Bump member_count when a new membership row is created."""
    if created:
        # Use F() expression to avoid race conditions
        from django.db.models import F
        instance.group.__class__.objects.filter(pk=instance.group_id).update(
            member_count=F("member_count") + 1
        )


@receiver(post_delete, sender=GroupMembership)
def decrement_member_count(sender, instance, **kwargs):
    """Lower member_count when a membership is removed."""
    from django.db.models import F
    instance.group.__class__.objects.filter(pk=instance.group_id).update(
        member_count=F("member_count") - 1
    )


```
# ────────────────────────End Signals──────────────────────────────────────





# ────────────────────────Start Apps────────────────────────────────────
```
"""Community app config — wires signals on startup."""

from django.apps import AppConfig


class CommunityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "community"

    def ready(self):
        import community.signals  # noqa: F401 — registers signal handlers

```
# ────────────────────────End Apps──────────────────────────────────────








# ────────────────────────Start Model────────────────────────────────────

```
"""
Community models: Group, GroupMembership, Post.

Groups are student-created spaces (e.g. "Cairo University 2025", "Engineers Only").
Any authenticated user can browse groups; students join/post.
"""

from django.db import models
from django.conf import settings


class Group(models.Model):
    """A community group that students can join and post in."""

    CATEGORY_CHOICES = [
        ("university", "University"),
        ("housing",    "Housing"),
        ("social",     "Social"),
        ("study",      "Study"),
        ("other",      "Other"),
    ]

    creator     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_groups",
    )
    name        = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    cover_image = models.ImageField(upload_to="group_covers/", null=True, blank=True)

    # Denormalised counter — updated by signals to avoid COUNT(*) on every list request
    member_count = models.PositiveIntegerField(default=0)

    is_private  = models.BooleanField(
        default=False,
        help_text="Private groups require approval to join (reserved for future use).",
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    """
    Through-model between Users and Group.
    One row = one member.  unique_together prevents duplicate joins.
    """

    ROLE_CHOICES = [
        ("member", "Member"),
        ("admin",  "Admin"),
    ]

    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="group_memberships",
    )
    group      = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    joined_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "group")
        ordering        = ["joined_at"]

    def __str__(self):
        return f"{self.user} → {self.group} ({self.role})"


class Post(models.Model):
    """A post inside a Group."""

    author  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_posts",
    )
    group   = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    content = models.TextField()
    image   = models.ImageField(upload_to="post_images/", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Post by {self.author} in {self.group} @ {self.created_at:%Y-%m-%d}"

```

# ────────────────────────End Model──────────────────────────────────────

