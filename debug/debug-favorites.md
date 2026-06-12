# Favorites Debug Report

## Summary
- Domain: Favorites
- Gate Verdict: FAIL
- Status: ⚠ Partial / 🚧 Missing Frontend
- Audit scope: add favorite, remove favorite, and favorites list.
- Overall assessment: favorites listing is connected, but the actual add/remove interactions in the main browsing UI are still local-only.

## Frontend Issues
- `frontend/src/pages/Like/Like.jsx` reads favorites from the backend successfully.
- `frontend/src/assets/components/PropertyCard/PropertyCard.jsx` uses local favorite state and does not call `addFavorite` or `removeFavorite`.
- There is no shared favorite-state synchronization between property cards and the saved-favorites page.

## Backend Issues
- Backend favorites endpoints are simple and adequate for current scope; no major backend blocker was found in this domain.

## Integration Issues
- Read/list flow works.
- Create/remove flows are not integrated in the places users actually favorite properties.
- UI can drift out of sync because favorite state is managed optimistically without backend persistence.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/favorites/` | GET | Used in favorites page | Implemented | ✅ Working |
| `/api/favorites/add/` | POST | Helper exists, not used | Implemented | 🚧 Missing Frontend |
| `/api/favorites/remove/<property_id>/` | DELETE | Helper exists, not used | Implemented | 🚧 Missing Frontend |

## Production Risks
- Users may believe a property is saved when it only changed local UI state.
- Favorites list can become the only truthful view, creating inconsistent experience across screens.

## Recommendations
- Wire card-level heart actions to `addFavorite` and `removeFavorite`.
- Use one shared favorite cache/state source across discovery, details, and saved list.
- Handle duplicate-save and unauthorized responses explicitly.

## Manual E2E Checklist
- Preconditions: authenticated student and at least two properties.
- Add favorite: click the heart on a property card and verify `/api/favorites/add/` persists the property.
- Favorites list: open saved properties and verify the item appears from `/api/favorites/`.
- Remove favorite: remove it from the card and from the list view and verify backend state updates both times.
- Auth check: attempt the action logged out and verify UI prompts for login instead of showing a fake success state.

## Overall Status
- Working: 40%
- Partial: 20%
- Missing Frontend: 40%
- Checkpoint: FAIL until add/remove actions are truly connected.
