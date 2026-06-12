# Roommates Debug Report

## Summary
- Domain: Roommates
- Gate Verdict: FAIL
- Status: ⚠ Partial / 🚧 Missing Frontend
- Audit scope: roommate discovery, public profiles, own roommate profile, roommate requests, and AI matching.
- Overall assessment: browsing roommate candidates is connected, but request management and matching capabilities are not surfaced in the current frontend.

## Frontend Issues
- `frontend/src/pages/Roommate/Roommate.jsx` uses the roommate list API for discovery.
- Frontend does not use roommate request creation, request listing, or request-status update endpoints.
- Frontend does not use the AI roommate match endpoint.
- Own roommate-profile edit flow is not clearly connected as a dedicated end-to-end feature.

## Backend Issues
- Backend offers a broader roommate feature set than the current frontend uses; no major backend blocker was found for the audited endpoints.

## Integration Issues
- Discovery is partially working.
- Match/request workflows are missing from the actual UI despite backend support.
- The current roommate area underuses the strongest backend capabilities in this domain.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/roommates/` | GET | Used | Implemented | ✅ Working |
| `/api/roommates/profile/` | GET/PATCH | Not clearly surfaced | Implemented | ⚠ Partial |
| `/api/roommates/matches/` | GET | Not used | Implemented | 🚧 Missing Frontend |
| `/api/roommates/requests/create/` | POST | Not used | Implemented | 🚧 Missing Frontend |
| `/api/roommates/requests/` | GET | Not used | Implemented | 🚧 Missing Frontend |
| `/api/roommates/requests/<request_id>/status/` | PATCH | Not used | Implemented | 🚧 Missing Frontend |

## Production Risks
- Users can browse roommates but cannot complete the request/match workflow promised by the backend.
- Matching value is under-delivered because AI-assisted recommendations are hidden.

## Recommendations
- Add roommate request actions to candidate cards and profile views.
- Expose inbound/outbound roommate request management in a dedicated screen.
- Surface the match endpoint as a recommended roommates experience.
- Add a clear edit flow for the current user’s roommate profile.

## Manual E2E Checklist
- Preconditions: two student accounts with roommate profiles.
- Discovery: load roommate browse page and verify entries come from `/api/roommates/`.
- Profile edit: update the logged-in user roommate profile and verify persistence through `/api/roommates/profile/`.
- Send request: send a roommate request and verify the target user can see it in `/api/roommates/requests/`.
- Respond request: accept or reject the request and verify state changes persist.
- Matches: load recommended matches and verify response data is rendered meaningfully.

## Overall Status
- Working: 35%
- Partial: 25%
- Missing Frontend: 40%
- Checkpoint: FAIL until request and matching flows are implemented.
