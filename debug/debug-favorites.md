# Favorites Debug Report

## Summary
- Domain: Favorites
- Gate Verdict: PASS WITH GAPS
- Status: ✅ Working / ⚠ Partial
- Audit scope: add favorite, remove favorite, shortlist page, property-card heart actions, and property-details save action.
- Overall assessment: the main student favorites flow is now wired to the real backend contract. Listing cards, shortlist cards, and the property-details save button all use the real favorites API and stay synchronized through shared frontend state.

## Frontend Issues
- Homepage promotional property cards still use static mock data and are not part of the live favorites contract.
- Fallback recommendation cards on the shortlist page remain display-only when no real favorites exist.

## Backend Issues
- Backend favorites endpoints are simple and adequate for current scope; no blocker was found in this domain.

## Integration Issues
- Main student favorites flow now works across listing, shortlist, and details pages.
- Non-authenticated users are redirected to login before favorites are persisted.
- Landlords cannot favorite properties, which matches the backend permission model.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/favorites/` | GET | Used by shared favorites state and shortlist page | Implemented | ✅ Working |
| `/api/favorites/` | POST | Triggered from property cards and details save action | Implemented | ✅ Working |
| `/api/favorites/<property_id>/` | DELETE | Triggered from property cards and shortlist removal | Implemented | ✅ Working |

## Production Risks
- Mock homepage cards can still appear “heartable” locally even though they are not backed by a real property record.
- Duplicate clicks rely on backend validation and simple frontend sync rather than more advanced in-flight request deduplication.

## Recommendations
- Keep the shared favorites hook as the single truth source for all backend-backed student property views.
- When the homepage is converted to live backend property data, wire those cards into the same shared favorites state.
- If desired later, add a subtle loading spinner/disabled state across all heart buttons during in-flight requests.

## Manual E2E Checklist
- Preconditions: authenticated student, at least two available backend properties, and one logged-out browser session for auth checks.
- Add favorite from listings: open `/find-room`, click a heart, and verify `POST /api/favorites/` creates the shortlist item.
- Verify shortlist sync: open `/favorites` and confirm the saved property appears without needing a full page refresh.
- Remove favorite from shortlist: unheart the property from `/favorites` and verify `DELETE /api/favorites/<property_id>/` removes it.
- Add/remove from details page: open a property details page, use the Save button, and verify the shortlist reflects the change.
- Logged-out behavior: attempt to favorite a listing while logged out and verify the UI redirects to `/login`.
- Landlord behavior: attempt the same action as a landlord and verify the UI shows an error instead of faking success.

## Overall Status
- Working: 85%
- Partial: 15%
- Missing Frontend: 0%
- Missing Backend: 0%
- Checkpoint: PASS WITH GAPS — backend-backed student favorites are connected end to end; remaining gaps are limited to mock promotional card surfaces.
