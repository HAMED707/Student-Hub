# Bookings Debug Report

## Summary
- Domain: Bookings
- Gate Verdict: PASS WITH GAPS
- Status: ✅ Working / ⚠ Partial / 🚧 Dependent on Payments
- Audit scope: booking creation, student booking list, landlord booking list, status updates, and booking lifecycle assumptions.
- Overall assessment: the bookings domain is now meaningfully linked. Students can create real bookings from the live property detail page, the student bookings page renders real backend bookings with enriched property data, and the landlord review/update flow remains connected. The remaining gap is deposit-payment progression.

## Frontend Issues
- Resolved: `frontend/src/pages/FindRoom/PropertyDetails.jsx` now submits a real booking request to `/api/bookings/` instead of ending in a fake success flow.
- Resolved: booking creation now checks auth/role before opening the flow.
- Resolved: `frontend/src/pages/MyBookings/MyBookings.jsx` now reads live backend bookings and enriches them with property details instead of relying on static mock bookings.
- Resolved: student-side booking statuses now match backend values like `pending_payment`, `deposit_paid`, `confirmed`, `completed`, and `cancelled`.
- Resolved: student cancellation now calls the real booking status endpoint.
- Remaining: the booking flow still does not initiate deposit payment after booking creation.

## Backend Issues
- Backend booking serializer is still lean and returns IDs rather than nested property snapshots, so the frontend must enrich bookings with additional property detail requests.
- Backend booking creation immediately reserves the property while the booking is only `pending_payment`, which may need expiration cleanup and stronger payment coupling in production.

## Integration Issues
- Resolved: student booking creation is now real and uses backend validation.
- Resolved: student booking list is now mapped to the backend contract and uses truthful status/timeline rendering.
- Resolved: landlord status review/update remains connected and consistent with backend transitions.
- Remaining: the full booking-to-payment flow is incomplete because payment initiation is still deferred to the payments domain.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/bookings/` | POST | Used from property detail booking flow | Implemented | ✅ Working |
| `/api/bookings/my/` | GET | Used for student and owner booking screens | Implemented | ✅ Working |
| `/api/bookings/<id>/status/` | PATCH | Used for landlord accept/reject and student cancel | Implemented | ✅ Working |
| deposit payment handoff from booking flow | POST | Not yet wired | Implemented elsewhere | 🚧 Dependent on Payments |

## Production Risks
- A created booking remains stuck in `pending_payment` until the payments flow is implemented, so users cannot complete the intended lifecycle yet.
- Booking pages currently enrich each booking with property detail requests, which may become expensive without batching if booking volume grows.

## Recommendations
- Keep the real booking create/list/status flow as the source of truth going forward.
- Next, connect deposit payment immediately after successful booking creation.
- Consider extending backend booking responses with lightweight property snapshots if booking volume becomes high.

## Manual E2E Checklist
- Preconditions: authenticated student, authenticated landlord, one available property.
- Booking create: open a live property detail page, complete the booking modal, and verify `/api/bookings/` returns a new `pending_payment` booking.
- Student list: open My Bookings and verify the new booking appears with real property title, address, amounts, and timeline.
- Student cancel: cancel a `pending_payment` booking and verify `/api/bookings/<id>/status/` changes it to `cancelled`.
- Landlord review: as the property owner, open owner bookings and verify `deposit_paid` bookings can be accepted or rejected.
- Status propagation: after a landlord accepts or rejects, verify the student bookings page reflects the updated status.
- Payment dependency: confirm the booking flow clearly stops before payment rather than pretending deposit payment completed.

## Overall Status
- Working: 75%
- Partial: 15%
- Dependent on Payments: 10%
- Checkpoint: PASS for booking creation/list/status management. Full lifecycle completion still depends on the payments integration.
