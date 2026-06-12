# Reviews Debug Report

## Summary
- Domain: Reviews
- Gate Verdict: FAIL
- Status: ⚠ Partial / 🚧 Missing Frontend
- Audit scope: property reviews, user reviews, review listing, and review creation.
- Overall assessment: user review reading exists on profile screens, but review creation and property-review presentation are largely missing from the current UI.

## Frontend Issues
- User profile pages read review data, but there is no connected UI to create user reviews.
- Property detail does not load property reviews from backend because the property detail page itself is still static.
- No frontend uses the property review create endpoint.
- No frontend uses the user review create endpoint.

## Backend Issues
- Backend review APIs are available for user and property review flows, but current property review response shape is only useful once the detail page is migrated to live data.

## Integration Issues
- Read-only user profile review usage is partially working.
- Property review read/create flows are blocked by the static detail implementation.
- End-to-end review authoring is missing for both user and property targets.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/reviews/user/<user_id>/` | GET | Used on profile pages | Implemented | ✅ Working |
| `/api/reviews/user/create/` | POST | Not used | Implemented | 🚧 Missing Frontend |
| `/api/reviews/property/<property_id>/` | GET | Not used | Implemented | 🚧 Missing Frontend |
| `/api/reviews/property/create/` | POST | Not used | Implemented | 🚧 Missing Frontend |

## Production Risks
- Users cannot leave feedback despite review APIs existing.
- Property trust signals are absent on the main property journey.

## Recommendations
- Add review sections to the live property detail page.
- Add create-review flows with backend validation handling for both user and property reviews.
- Reuse backend averages/counts to avoid recomputing on the client.

## Manual E2E Checklist
- Preconditions: authenticated reviewer, one completed booking or otherwise review-eligible test scenario, one profile target.
- User review list: open a public profile and verify reviews load from `/api/reviews/user/<user_id>/`.
- User review create: submit a review and verify it appears in the target profile response.
- Property review list: open property detail and verify review summary and entries load from `/api/reviews/property/<property_id>/`.
- Property review create: submit a property review and verify average rating and review count update.

## Overall Status
- Working: 25%
- Partial: 25%
- Missing Frontend: 50%
- Checkpoint: FAIL until authoring flows and property review display are connected.
