# Payments Debug Report

## Summary
- Domain: Payments
- Gate Verdict: FAIL
- Status: ⚠ Partial / 🚧 Missing Backend / 🚧 Missing Frontend
- Audit scope: deposit payment, remaining payment, payment history, landlord payment views, and owner dashboard assumptions.
- Overall assessment: payment APIs exist for student booking payments, but the frontend does not currently drive those flows and landlord-facing payment visibility is not fully supported by backend capabilities.

## Frontend Issues
- `frontend/src/api/payments.js` exposes payment helpers, but no student-facing page uses deposit or remaining-payment creation in a complete flow.
- `fetchMyPayments` exists but is not used by any current payments screen.
- Owner payments views rely on landlord profile/bookings/property summaries rather than live payment records.
- Payment initiation from booking/property screens is not connected.

## Backend Issues
- `GET /api/payments/my/` is student-only, leaving landlords without a dedicated payment ledger endpoint.
- Backend supports deposit and remaining payment actions, but current app-wide visibility into transaction history is limited for owner workflows.

## Integration Issues
- Payment contract exists, but the main user journey into those endpoints is missing.
- Student payment history is not surfaced despite API support.
- Owner payment reporting is blocked partly by missing frontend wiring and partly by backend scope limitations.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/payments/deposit/` | POST | Helper exists, not used | Implemented | 🚧 Missing Frontend |
| `/api/payments/remaining/online/` | POST | Helper exists, not used | Implemented | 🚧 Missing Frontend |
| `/api/payments/remaining/offline/` | POST | Helper exists, not used | Implemented | 🚧 Missing Frontend |
| `/api/payments/my/` | GET | Helper exists, not used | Implemented | 🚧 Missing Frontend |
| landlord payment ledger endpoint | GET | Owner UI would benefit | Missing | 🚧 Missing Backend |
| `/api/payments/webhook/stripe/` | POST | Backend-only | Implemented | ⚠ Partial |

## Production Risks
- Students cannot complete booking-to-payment flow through the shipped UI.
- Landlords lack trustworthy payment-history visibility.
- Payment state may diverge from booking UI because those flows are not coupled in the frontend.

## Recommendations
- Trigger deposit payment directly from a successful booking creation flow.
- Add a student payment-history screen using `/api/payments/my/`.
- Define whether landlord payment reporting belongs in backend and add a dedicated endpoint if required.
- Keep owner dashboard summaries clearly labeled as derived estimates until real payment ledger data exists.

## Manual E2E Checklist
- Preconditions: authenticated student with a pending-payment booking, one landlord owning the property, payment provider configured for test mode.
- Deposit flow: initiate deposit payment and verify `/api/payments/deposit/` updates payment and booking states.
- Remaining payment online: pay the remaining balance and verify backend reflects completion.
- Remaining payment offline: record offline payment and verify resulting booking/payment status changes.
- Student history: load a payment history screen and verify `/api/payments/my/` returns the transaction list.
- Owner visibility: verify whether landlord dashboards intentionally use derived booking totals or a real payment ledger.

## Overall Status
- Working: 15%
- Partial: 25%
- Missing Frontend: 40%
- Missing Backend: 20%
- Checkpoint: FAIL until student payment flows and owner payment visibility are defined and connected.
