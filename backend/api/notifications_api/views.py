"""
Notifications API views.

Views:
    - NotificationListView   → GET  /api/notifications/         ← bell feed
    - MarkAllReadView        → POST /api/notifications/read/    ← mark all as read
    - MarkOneReadView        → PATCH /api/notifications/<id>/read/ ← mark one as read
"""

from rest_framework.views    import APIView
from rest_framework.response import Response
from rest_framework          import status
from rest_framework.permissions import IsAuthenticated

from notifications.models import Notification
from api.notifications_api.serializers import NotificationSerializer


class NotificationListView(APIView):
    """
    GET /api/notifications/
    Returns the requesting user's full notification feed, newest first.
    Also returns unread_count so the bell badge renders without parsing the list.

    Optional query param: ?unread=true → returns only unread notifications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user)

        if request.query_params.get("unread") == "true":
            qs = qs.filter(is_read=False)

        serializer = NotificationSerializer(qs, many=True, context={"request": request})
        return Response(
            {
                "unread_count":    qs.filter(is_read=False).count(),
                "notifications":   serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class MarkAllReadView(APIView):
    """
    POST /api/notifications/read/
    Bulk-marks every unread notification for the requesting user as read.
    Body: (none required)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = (
            Notification.objects
            .filter(recipient=request.user, is_read=False)
            .update(is_read=True)
        )
        return Response(
            {"marked_read": updated},
            status=status.HTTP_200_OK,
        )


class MarkOneReadView(APIView):
    """
    PATCH /api/notifications/<id>/read/
    Marks a single notification as read.
    Returns 404 if the notification doesn't belong to the requesting user.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response(
            NotificationSerializer(notification, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
