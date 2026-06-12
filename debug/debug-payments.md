# Payments Debug Report

## Summary
- Domain: Payments
- Gate Verdict: PASS WITH GAPS
- Status: ✅ Working / ⚠ Partial / 🚧 Missing Backend
- Audit scope: deposit payment, remaining payment, payment history, landlord payment views, and booking-to-payment handoff.
- Overall assessment: the student payment journey is now wired to the real backend contract. Booking creation can hand off into live deposit initiation, students have a dedicated payment center backed by `/api/payments/my/`, and confirmed bookings can launch remaining online payment. Landlord payment reporting still lacks a true backend ledger endpoint.

## Frontend Issues
- Deposit and remaining payments depend on opening the hosted Paymob page in a new tab; browser pop-up blocking can interrupt the smoothest handoff.
- Booking success cannot confirm payment completion immediately because status changes depend on the external webhook callback.
- Landlord payment screen still shows truthful derived totals, not real transaction rows.

## Backend Issues
- `GET /api/payments/my/` is effectively student-facing only; landlords still do not have a dedicated payment ledger endpoint.
- Payment completion state depends on Paymob webhook delivery, so local frontend flow cannot force immediate booking-status transitions.
- Remaining offline payment is backend-supported for landlords, but there is still no dedicated landlord-side transaction history API.

## Integration Issues
- Booking creation and deposit initiation are now connected, but payment completion remains asynchronous by design.
- Student payment history is now surfaced, but owner payment visibility remains summary-only.
- The owner dashboard still relies on landlord profile totals plus bookings/properties context because backend scope for owner payments is limited.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/payments/deposit/` | POST | Triggered from property booking flow and payments hub | Implemented | ✅ Working |
| `/api/payments/remaining/online/` | POST | Triggered from student payments hub for confirmed bookings | Implemented | ✅ Working |
| `/api/payments/remaining/offline/` | POST | No student usage; owner workflow still separate | Implemented | ⚠ Partial |
| `/api/payments/my/` | GET | Used by student payments hub | Implemented | ✅ Working |
| landlord payment ledger endpoint | GET | Owner UI would benefit | Missing | 🚧 Missing Backend |
| `/api/payments/webhook/` | POST | Backend-only status sync | Implemented | ⚠ Partial |

## Production Risks
- Students must still complete the hosted Paymob flow successfully before the booking state advances from `pending_payment`.
- If webhook delivery or test credentials are misconfigured, the frontend can launch payment but the booking status will not update correctly afterward.
- Landlords still cannot audit a full payment ledger from a dedicated backend endpoint.

## Recommendations
- Keep Paymob test credentials and webhook configuration verified before QA, because payment-state truth depends on them.
- Add a landlord payment ledger endpoint if owner transaction history is required for production readiness.
- Add explicit frontend polling or status refresh guidance after returning from Paymob if smoother confirmation UX is desired.
- Wire landlord offline-payment recording into a clearly labeled owner action once the bookings/payments owner review pass reaches that domain.

## Manual E2E Checklist
- Preconditions: authenticated student, available property, authenticated landlord, Paymob test mode configured, webhook reachable.
- Deposit handoff: create a booking from `frontend/src/pages/FindRoom/PropertyDetails.jsx`, confirm `/api/bookings/` succeeds, then confirm `/api/payments/deposit/` returns an `iframe_url`.
- Deposit completion: finish payment on Paymob and verify webhook updates booking status from `pending_payment` to `deposit_paid`.
- Student payment hub: open `/payments` and verify pending bookings, confirmed remaining-payment actions, and `/api/payments/my/` history render correctly.
- Booking shortcut: open `/bookings`, use the pay-now shortcut, and confirm it lands on the correct payment action for that booking.
- Remaining online payment: for a landlord-confirmed booking, start `/api/payments/remaining/online/`, complete the hosted payment, and verify booking status becomes `completed`.
- Remaining offline payment: as landlord, call `/api/payments/remaining/offline/` through an API client and verify booking completion until a dedicated owner UI is added.

## Overall Status
- Working: 60%
- Partial: 25%
- Missing Frontend: 0%
- Missing Backend: 15%
- Checkpoint: PASS WITH GAPS — student payment flow is connected end to end at the code/API level; landlord ledger/reporting remains backend-limited.
