# rules.md
> Read this before writing any code or prompting any AI.

---

## Coding Standards

- always use `status.HTTP_200_OK` not raw numbers like `200`
- the Stripe webhook view is a plain Django `View`, not an `APIView` — same
  reasoning as the Persona webhook: Stripe doesn't authenticate like a
  normal client, trust comes only from `construct_webhook_event()`'s
  signature check
- never accept a payment amount from the client — `CreateCheckoutSessionSerializer`
  only has `booking_id`; the amount is ALWAYS read from `booking.total_amount_cents`
- never trigger a payout from the webhook handler — webhooks confirm
  payment status only; `CheckinScanView` is the only code path allowed to
  call `create_transfer()`
- always wrap the check-in flow in `transaction.atomic()` with
  `select_for_update()` on the `Booking` row — this is what makes
  `payout_done` an actually-reliable guard instead of a race condition
- never mark `payout_done = True` unless `create_transfer()` returned
  successfully — on `StripeError`, the booking stays `paid` so a retry is possible

## Architecture Decisions

- `Payment` (student → platform) and `Payout` (platform → landlord) are
  separate models on purpose — they're different events with different
  failure modes and different timing, and conflating them into one row
  made the old Paymob model harder to reason about
- `Booking.qr_token` is a single UUID, not a separate booking_id + token
  pair — the token alone uniquely identifies the booking, so there's
  nothing to cross-check; carrying both would be redundant
- commission/landlord split lives on `Payout`, not on `Booking` — it's
  computed at payout time from the configured commission rate, not stored
  at booking time, so a future commission-rate change doesn't require a
  migration or backfill
- `kyc.services.is_kyc_approved()` (landlord identity verification) and
  Stripe Connect onboarding (landlord payout capability) are two SEPARATE
  gates — a landlord can be KYC-approved and still unable to receive a
  payout if they haven't finished Connect onboarding. Don't conflate them
  into a single check anywhere
- `ConnectStatusView` polls Stripe synchronously rather than subscribing to
  `account.updated` webhooks — acceptable for v1, flagged as a future
  improvement if onboarding status needs to update in real time

## Project-Specific Context

- this REPLACES `payments/paymob.py`, the old `Payment` model, and the old
  `InitiateDepositView`/`PayRemainingOnlineView`/`MarkRemainingOfflineView`/
  `PaymobWebhookView` entirely — there is no deposit/remaining split anymore,
  the student pays the full `total_amount_cents` in one Checkout session
- `Booking.status` choices changed: `deposit_paid` and `confirmed` no
  longer exist. The new lifecycle is
  `pending_payment → paid → finished` (or `cancelled`/`expired`). Any code
  elsewhere in the project still checking for `"deposit_paid"` or
  `"confirmed"` is now dead/broken and needs updating — see
  `MANUAL_CHANGES.md` for the exact list
- currency is EGP, same as the rest of the project — Stripe Checkout and
  Transfer calls both use `"egp"` as the currency string
- `PLATFORM_COMMISSION_PERCENT` is a single global settings value for now,
  not per-property/per-landlord — note this if the business later wants
  variable commission rates
- Stripe Connect Express accounts are created with `country="EG"` — this
  is about the LANDLORD's connected account, which Stripe does support
  for cross-border payouts. Whether the PLATFORM itself can hold a live
  Stripe account from Egypt is a separate, unresolved business question —
  don't assume production deployment is unblocked just because dev/test
  mode works
