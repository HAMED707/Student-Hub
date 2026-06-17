# Product Requirements Prompt — Payments (Stripe Marketplace)
> The full picture of what the payments app does, who uses it, and what can go wrong.

---

## Goal

Replace Paymob entirely with a Stripe Connect marketplace flow where the
platform holds the full booking payment in escrow and only releases it to
the landlord — minus commission — after a QR check-in scan confirms the
student actually arrived.

---

## Features

- Student pays the FULL booking total in one Stripe Checkout session (no
  deposit/remaining split anymore)
- Stripe webhook confirms payment and marks the booking `paid` — webhooks
  confirm, they never trigger payout
- Landlord scans a QR code (encoding the booking's `qr_token`) at check-in;
  this is the ONLY thing that triggers the Stripe Transfer to the landlord
- Commission is calculated server-side and deducted before the landlord's
  transfer amount
- Landlords must complete Stripe Connect (Express) onboarding before any
  transfer can target them
- Double payout is structurally prevented via `Booking.payout_done` checked
  inside a `select_for_update()` transaction

## User Flow

### Student pays for a booking
1. `POST /api/bookings/` creates the booking with `total_amount_cents`
   computed server-side from the property's price — same rule as before,
   the client only ever sends `booking_id`/`property`/dates, never an amount
2. `POST /api/payments/create-checkout-session/` with `{"booking_id": N}`
3. Backend verifies ownership + status, computes the amount from the
   booking row, creates a Stripe Checkout Session, returns `checkout_url`
4. Student pays on Stripe's hosted page
5. Stripe sends `checkout.session.completed` to `/api/webhooks/stripe/`
6. Backend verifies the signature, marks the `Payment` row `paid`, marks
   the `Booking` `paid`

### Landlord onboarding (necessary plumbing, not explicit in the original spec)
1. `POST /api/payments/connect/onboard/` creates an Express account if
   needed and returns a hosted onboarding URL
2. Landlord completes Stripe's hosted onboarding flow
3. `GET /api/payments/connect/status/` can be polled to check
   `payouts_enabled`/`details_submitted`

### Check-in triggers payout
1. Landlord scans the student's QR code (encodes `qr_token`)
2. `POST /api/payments/checkin/` with `{"qr_token": "<uuid>"}`
3. Backend validates: booking exists, requesting landlord owns the
   property, booking status is `paid`, `payout_done` is `False`, landlord
   has a Connect account
4. Commission is calculated, a `Payout` row is created/updated, Stripe
   Transfer API is called
5. On success: `Booking.payout_done = True`, `Booking.status = finished`
6. On failure: `Payout.status = failed`, booking stays `paid` so the
   landlord can retry the scan

## Edge Cases

- Checkout session requested for a booking not in `pending_payment` →
  reject with the current status in the error message
- Booking expired before payment → mark `expired`, reject
- Stripe webhook for an unknown checkout session id → log, return 200 (no retry storm)
- Webhook delivered twice for the same session → idempotent, second
  delivery is a no-op (checked via `Payment.status == PAID`)
- QR scanned for a booking that isn't `paid` yet → reject, do not transfer
- QR scanned twice → second attempt blocked by `payout_done`, returns 409
- Landlord without a Connect account scans a QR → reject before attempting
  any Stripe call, clear message pointing them to onboarding
- Stripe Transfer call fails → `Payout.status = failed`, `Booking` stays
  `paid` (not `finished`) so a retry is possible, never silently mark success
- Landlord scans a QR for a booking on a property they don't own → 403

## Performance Requirements
- To be filled in before production deployment
- Open item: confirm whether Student Hub (the platform) can actually open
  a live Stripe account from Egypt before this goes beyond dev/test mode —
  flagged separately, not a code-level concern
