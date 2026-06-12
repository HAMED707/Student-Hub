# Services Debug Report

## Summary
- Domain: Services
- Gate Verdict: PASS WITH GAPS
- Status: ⚠ Partial
- Audit scope: university directory, university places, nearby places, and distance helper integration.
- Overall assessment: the service discovery screens are among the stronger integrations, but one endpoint is unused and authenticated service dependencies are not fully surfaced in the UI.

## Frontend Issues
- `frontend/src/pages/Services/Service.jsx` uses live APIs for universities and places, but does not expose a clear auth-state fallback when protected requests fail.
- The distance-calculation helper endpoint is not used anywhere in the frontend.
- Error states are present but do not clearly distinguish between unauthenticated, empty, and backend-failure cases.

## Backend Issues
- Protected service endpoints depend on authentication, but there is no dedicated frontend-friendly contract message beyond standard 401 behavior.
- Backend service APIs are read-only and do not expose richer metadata for caching or rate-limiting awareness, which may matter if maps/places providers are involved.

## Integration Issues
- Public university list is connected correctly.
- University place and nearby place lookups are connected, but behavior depends on valid auth without a strong user-facing explanation.
- Distance endpoint is available but currently unverified by any frontend flow.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/services/universities/` | GET | Used | Implemented | ✅ Working |
| `/api/services/university/` | GET | Used | Implemented | ⚠ Partial |
| `/api/services/nearby/` | GET | Used | Implemented | ⚠ Partial |
| `/api/services/distance/` | GET | Not used | Implemented | 🚧 Missing Frontend |

## Production Risks
- Auth failures on protected service lookups can feel like broken search instead of an access issue.
- Missing use of the distance endpoint leaves part of the backend contract unverified.

## Recommendations
- Add explicit UI handling for 401 responses on protected service requests.
- Integrate the distance endpoint where travel-time or comparison UX exists, or document it as intentionally deferred.
- Add request-state messaging for empty nearby-place responses.

## Manual E2E Checklist
- Preconditions: authenticated student account and configured backend service provider data.
- University list: load the page logged out and verify `/api/services/universities/` returns visible options.
- University places: select a university while logged in and verify campus/place results match `/api/services/university/`.
- Nearby places: trigger a nearby search and verify `/api/services/nearby/` returns mapped service categories.
- Auth check: repeat protected actions logged out and verify UI explains login is required.
- Distance helper: call the distance-based flow once integrated and verify origin/destination results match backend output.

## Overall Status
- Working: 60%
- Partial: 30%
- Missing Frontend: 10%
- Checkpoint: PASS for current connected flows, but not complete until auth UX and distance coverage are addressed.
