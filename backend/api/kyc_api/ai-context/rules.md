# rules.md
> Read this before writing any code or prompting any AI.

---

## Coding Standards

- always use `status.HTTP_200_OK` not raw numbers like `200`
- the Persona webhook view is a plain Django `View`, not an `APIView` —
  Persona doesn't authenticate like a normal client, so DRF's auth/permission
  stack doesn't apply; trust comes ONLY from signature verification
- never accept verification status from the frontend — it only ever changes
  via a signature-verified webhook or (during create) the synchronous
  Persona API response
- always verify the `Persona-Signature` header using the RAW request body
  bytes, never a re-parsed/re-serialized version of the JSON
- webhook handler returns 200 even for events it can't act on (unknown
  inquiry id, missing fields) — returning a non-200 makes Persona retry-storm
  an event we'll never be able to process anyway

## Architecture Decisions

- two-layer rule: `kyc/models.py` + `kyc/services.py` are the DB and
  business-logic layer, `api/kyc_api/` is the API layer
- `LandlordVerification` is a separate table from `Users.kyc_status` on
  purpose — `kyc_status` is the fast field other apps check (e.g.
  `properties`), `LandlordVerification` is the audit trail of every attempt
- `kyc.services.is_kyc_approved(user)` is the ONE function other apps should
  call to gate landlord actions — never check `user.kyc_status == "APPROVED"`
  inline elsewhere, route it through this function so the check stays
  consistent if the logic ever changes
- the Persona status → internal enum mapping lives in one place
  (`PERSONA_STATUS_MAP` in `kyc/services.py`) — never hardcode a Persona
  status string anywhere else

## Project-Specific Context

- this is ADDITIVE to the existing manual verification system —
  `accounts.VerificationDocument` (manual doc upload + admin review) and
  `LandlordProfile.is_id_verified` (manual boolean) both still exist
  untouched. Decide later whether to sync `is_id_verified` to mirror
  `kyc_status == APPROVED`, or keep the two systems for different purposes
  (e.g. Persona for personal ID, manual review for property ownership docs)
- Persona's real inquiry status values are lowercase strings (`pending`,
  `completed`, `approved`, `declined`, `failed`, `needs_review`, `expired`,
  `created`) — these are NOT the same strings as our internal enum
  (`NOT_STARTED`/`CREATED`/.../`APPROVED`). Always go through
  `map_persona_status()`, never compare a raw Persona string against our enum
- `reference-id` sent when creating an inquiry is our own `landlord.id` —
  this is how incoming webhooks get matched back to a `LandlordVerification`
  row via `persona_inquiry_id`, not via `reference-id` directly (we match on
  the Persona inquiry id we stored at creation time)
- sandbox API keys are prefixed `persona_sandbox_`, production keys
  `persona_production_` — never let a sandbox key reach a production
  environment variable or vice versa
- the property-creation KYC check belongs in `PropertyCreateView`, not in a
  serializer or model — it's a permission-style business rule, matching how
  `IsLandlord`/`IsStudent` are handled elsewhere in this codebase
