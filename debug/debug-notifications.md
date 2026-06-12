# Notifications Debug Report

## Summary
- Domain: Notifications
- Gate Verdict: PASS WITH GAPS
- Status: ⚠ Partial
- Audit scope: notification list, unread count, mark one read, mark all read, and notification-action UX.
- Overall assessment: core read and read-state flows are integrated for both student and owner experiences, but deletion/clearing behavior and action routing remain thinner than the UI suggests.

## Frontend Issues
- Student and owner notification screens use live notification APIs.
- Some clear/delete style interactions are local-only because there is no matching backend delete endpoint.
- UI derives behavior from `notification_type` and does not always have backend-provided action metadata for deep linking.

## Backend Issues
- Backend supports list and read-state mutations, but does not provide delete/dismiss endpoints.
- Notification payloads are sufficient for listing, but not rich enough to fully drive contextual navigation/actions in all frontend cases.

## Integration Issues
- Core list and mark-read flows work.
- “Clear” semantics are only partially truthful because backend persistence stops at read-state changes.
- Owner notification use is viable but limited by backend payload richness.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/notifications/` | GET | Used | Implemented | ✅ Working |
| `/api/notifications/<notification_id>/read/` | PATCH | Used | Implemented | ✅ Working |
| `/api/notifications/read-all/` | PATCH | Used | Implemented | ✅ Working |
| delete/dismiss notification | DELETE/PATCH | UI implies it in places | Missing | 🚧 Missing Backend |

## Production Risks
- Users may think a notification was removed permanently when it was only marked read locally.
- Weak action metadata reduces confidence in notification-driven navigation.

## Recommendations
- Keep current read flows.
- Remove delete language from the UI unless a backend dismiss endpoint is added.
- Extend backend payloads with optional target/action metadata if deep links are important.

## Manual E2E Checklist
- Preconditions: authenticated student and landlord accounts with seeded notifications.
- Notification list: open notifications and verify `/api/notifications/` shows unread count and items.
- Single read: mark one notification read and verify backend unread count decreases.
- Mark all: trigger “mark all as read” and verify all items update after refresh.
- Delete/clear behavior: verify UI language matches actual persisted backend behavior.

## Overall Status
- Working: 65%
- Partial: 25%
- Missing Backend: 10%
- Checkpoint: PASS for read-state flows, but not feature-complete.
