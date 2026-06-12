# Bookings Debug Report

## Summary
- Domain: Bookings
- Gate Verdict: FAIL
- Status: ⚠ Partial / ❌ Broken / 🚧 Missing Frontend
- Audit scope: booking creation, student booking list, landlord booking list, status updates, and payment-state assumptions.
- Overall assessment: owner-side booking management is partially wired, but student booking creation is not connected and UI status models do not match backend booking states.

## Frontend Issues
- `frontend/src/api/bookings.js` exposes `createBooking`, but no student-facing page currently uses it.
- `frontend/src/pages/FindRoom/PropertyDetails.jsx` contains booking intent UI that is still static and not connected to real booking creation.
- `frontend/src/pages/MyBookings/MyBookings.jsx` expects a richer booking card model and different status vocabulary than the backend returns.
- Student booking views assume property context and landlord info that backend serializers do not currently include directly.
- Owner dashboard booking management is better connected, but still depends on extra enrichment requests to render usable cards.

## Backend Issues
- Booking serializer output is relatively thin for the current frontend screens and does not ship fully nested property details needed by the student UI.
- Backend booking statuses differ from current frontend labels and flow assumptions, especially around payment progression.

## Integration Issues
- Student booking creation is missing end to end.
- Student booking list is only partially connected because frontend display logic does not align with backend payload shape.
- Landlord booking status updates are implemented and represent the strongest part of this domain.
- Payment and booking lifecycle are coupled in backend, but the current student UI does not reflect that lifecycle accurately.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/bookings/create/` | POST | Helper exists, not used | Implemented | 🚧 Missing Frontend |
| `/api/bookings/my/` | GET | Used in student and owner contexts | Implemented | ⚠ Partial |
| `/api/bookings/<id>/status/` | PATCH | Used in owner dashboard | Implemented | ✅ Working |

## Production Risks
- Students cannot complete a real booking journey from property discovery to reservation.
- Status mismatches can mislead users about whether a booking is pending, paid, confirmed, or active.
- Missing nested details increase frontend fragility and duplicate API fetches.

## Recommendations
- Connect booking creation from the live property detail page.
- Align frontend booking status labels with backend enum values.
- Either extend booking read serializers with property snapshots/details or normalize the student UI to the existing API contract.
- Keep owner status updates, but add explicit guards for only valid transitions.

## Manual E2E Checklist
- Preconditions: authenticated student, authenticated landlord, at least one bookable property.
- Create booking: from a live property detail page, submit a booking and verify `/api/bookings/create/` returns the new record.
- Student list: open My Bookings and verify live bookings render with correct status text and dates.
- Landlord list: open owner bookings dashboard and verify landlord sees bookings for owned properties only.
- Status update: approve/cancel a booking as landlord and verify `/api/bookings/<id>/status/` persists and student view updates.
- Invalid transition: attempt an unsupported status change and verify UI handles backend validation cleanly.

## Overall Status
- Working: 30%
- Partial: 40%
- Missing Frontend: 20%
- Broken: 10%
- Checkpoint: FAIL until students can create and accurately view bookings end to end.
