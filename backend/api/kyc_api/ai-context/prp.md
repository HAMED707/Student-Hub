# Product Requirements Prompt — KYC (Persona)
> The full picture of what the kyc app does, who uses it, and what can go wrong.

---

## Goal

Verify every landlord's identity via Persona before they can publish
listings or receive payments. StudentHub manages the workflow and stores
results; Persona handles all document/selfie/liveness/fraud verification.

---

## Features

- Landlord can start identity verification from their dashboard
- Landlord can check their current KYC status at any time
- Persona webhooks update verification status automatically (no polling)
- Property creation is blocked server-side unless `kyc_status == APPROVED`
- Re-clicking "Start Verification" while one is already in progress returns
  the existing inquiry instead of creating a duplicate

## User Flow

See the original feature spec (pasted into chat, also kept alongside this
file for reference) for the full step-by-step journey. Summary:

1. Landlord registers and logs in with `kyc_status = NOT_STARTED` — nothing
   Persona-related happens at registration time
2. Dashboard calls `GET /api/kyc/status/` and shows a "Verify your identity"
   prompt if not yet approved
3. Landlord clicks "Start Verification" → `POST /api/kyc/create/` → backend
   creates a Persona Inquiry and returns a hosted `verification_url`
4. Frontend opens that URL (new tab/popup/redirect); landlord completes the
   flow entirely inside Persona's hosted UI
5. Persona sends webhook events to `POST /api/webhooks/persona/` as the
   inquiry progresses; the backend verifies the signature and updates both
   `LandlordVerification.status` and `Users.kyc_status`
6. Landlord attempts `POST /api/properties/create/` — blocked with 403 and
   a clear message unless `kyc_status == APPROVED`

## Edge Cases

- Landlord clicks "Start Verification" twice → return the existing active
  inquiry, never create a second one
- Webhook signature invalid → 403, ignore the payload entirely
- Webhook references an `inquiry_id` we don't have a record for → log and
  return 200 (don't trigger Persona retries for something we can't act on)
- Webhook missing expected fields → log the raw payload, return 200
- Persona API call fails (network/timeout/4xx) → 502 to the frontend, never
  a raw 500
- Property creation blocked must be enforced server-side — frontend
  disabling the button is UX only, not the actual security boundary

## Performance Requirements
- To be filled in before production deployment (Persona rate limits, retry
  behavior on webhook delivery failures)
