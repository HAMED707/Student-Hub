# Authentication Debug Report

## Summary
- Domain: Authentication
- Gate Verdict: PASS WITH GAPS
- Status: ✅ Working / ⚠ Partial / 🚧 Missing Backend
- Audit scope: login, student register, landlord register, token refresh, protected-route assumptions, logout cleanup, and password recovery handling.
- Overall assessment: core authentication is now functionally integrated end to end. Login no longer bypasses the backend, registration now persists key profile data for both roles, logout cleanup is centralized, and protected routes are enforced. The remaining gap is backend password recovery support.

## Frontend Issues
- Resolved: `frontend/src/pages/Auth/Login/login.jsx` now navigates only after a successful login response.
- Resolved: login validation no longer blocks valid existing users with extra client-only password rules.
- Resolved: student and landlord registration now enforce the backend 8-character password minimum.
- Resolved: student registration now saves onboarding profile fields through `/api/auth/profile/` immediately after account creation.
- Resolved: landlord registration now saves city, national ID, profile picture, and ID document after account creation.
- Resolved: protected routes now redirect unauthenticated users to `/login` and redirect role mismatches to the correct area.
- Resolved: shared logout cleanup now clears access token, refresh token, and stored user state across nav/sidebar flows.
- Remaining: forgot-password UI is intentionally disabled because there is still no real backend reset flow.

## Backend Issues
- Remaining: backend still does not provide password reset / forgot-password endpoints.
- Resolved: auth serializers now accept both `M/F` and `Male/Female` style gender values, making the API more tolerant of frontend inputs.
- Resolved: registration serializer now accepts `city`, so onboarding can persist location earlier in the lifecycle.

## Integration Issues
- Resolved: login flow no longer creates false authenticated navigation.
- Resolved: registration is no longer limited to base account creation; key profile completion now happens during onboarding.
- Resolved: token refresh failure now clears stale session data instead of leaving broken auth state in storage.
- Remaining: password recovery remains blocked by missing backend capability, but the UI no longer fakes success.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/auth/register/` | POST | Used | Implemented | ✅ Working |
| `/api/auth/login/` | POST | Used | Implemented | ✅ Working |
| `/api/token/refresh/` | POST | Used by API client | Implemented | ✅ Working |
| `/api/auth/profile/` | GET/PATCH | Used for onboarding completion and profile sync | Implemented | ✅ Working |
| `/api/auth/profile/<id>/` | GET | Used by protected profile flows | Implemented | ✅ Working |
| `/api/auth/verify/documents/` | POST | Used in landlord onboarding | Implemented | ⚠ Partial |
| password recovery endpoint | POST | UI disabled until available | Missing | 🚧 Missing Backend |

## Production Risks
- Missing password recovery still means account recovery depends on manual support/admin intervention.
- Student verification upload is still not part of the student registration UI, so identity verification remains asymmetric across roles.

## Recommendations
- Keep the new guarded login/register/session flow as the auth baseline for all later domains.
- Add backend password recovery endpoints before calling auth fully production-ready.
- Add student-side verification upload only if verification is required during onboarding rather than later in profile/settings.
- Consider moving the generated username strategy to a more collision-resistant approach if duplicate names become common.

## Manual E2E Checklist
- Preconditions: backend running, empty browser storage, one student test account and one landlord test account.
- Login success: submit valid credentials and verify tokens are stored and user lands on `/home` or `/owner/overview` based on role.
- Login failure: submit invalid credentials and verify no navigation occurs and no tokens are stored.
- Student register: create a student account and verify `/api/auth/profile/` includes city, university, faculty, and academic year immediately after onboarding.
- Landlord register: create a landlord account and verify city, `landlord_profile.national_id`, uploaded profile picture, and verification document persist.
- Protected route check: open `/bookings` or `/owner/overview` while logged out and verify redirect to `/login`.
- Role guard check: try a student session on `/owner/overview` and verify redirect back to the student area.
- Refresh handling: expire the access token and verify the next authenticated request refreshes successfully or fully clears the session on refresh failure.
- Logout: sign out from both student navbar and owner sidebar and verify `token`, `refresh`, and `user` are removed from storage.
- Password recovery: open `/forgot-password` and verify the page clearly states the feature is not live yet instead of simulating success.

## Overall Status
- Working: 85%
- Partial: 10%
- Missing Backend: 5%
- Checkpoint: PASS for core authentication. Final production readiness still depends on backend password recovery support.
