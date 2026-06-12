# Properties Debug Report

## Summary
- Domain: Properties
- Gate Verdict: FAIL
- Status: ⚠ Partial / ❌ Broken / 🚧 Missing Frontend
- Audit scope: property listing, detail view, landlord property management, filters, media handling, and property-backed home/discovery flows.
- Overall assessment: the backend exposes usable property APIs, but the frontend only partially consumes the list endpoint and still relies on static mocks for the most important detail and management flows.

## Frontend Issues
- `frontend/src/pages/FindRoom/FindRoom.jsx` fetches properties but still keeps fallback mock mapping and local-only filters.
- Filter UI does not send backend query params such as `city`, `district`, `type`, `price_min`, `price_max`, `gender`, `university`, or `amenity`.
- `frontend/src/pages/FindRoom/PropertyDetails.jsx` is still a static screen and does not call `fetchPropertyDetail`.
- `frontend/src/Owner interface/Dashboard Properties/AddNewProperty.jsx` does not submit to property create APIs.
- `frontend/src/Owner interface/Dashboard Properties/EditProperty.jsx` does not submit to property update APIs.
- Property image upload and delete flows are not connected.
- Property cards and detail UI expect richer nested room/service/review content than current backend detail responses provide.

## Backend Issues
- Property list API has limited filtering and no explicit pagination/search UX contract surfaced to the frontend.
- Property detail serializer is more compact than the current UI concept and does not provide the fully composed screen model expected by the static detail page.
- Media management is available, but backend does not package a one-call “full detail experience” with services/reviews/owner extras that the current frontend screen implies.

## Integration Issues
- Discovery page is only partially integrated because backend data is reshaped into a UI model while many filters never hit the API.
- Detail page is effectively not integrated at all.
- Landlord CRUD flows are visually present but not wired to backend endpoints.
- Property media handling is blocked by missing frontend implementation even though backend endpoints exist.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/properties/` | GET | Used in room discovery | Implemented | ⚠ Partial |
| `/api/properties/<id>/` | GET | Helper exists, page not connected | Implemented | ❌ Broken |
| `/api/properties/my/` | GET | Not used in owner property screens | Implemented | 🚧 Missing Frontend |
| `/api/properties/landlord/<landlord_id>/` | GET | Used in owner booking enrichment | Implemented | ⚠ Partial |
| `/api/properties/create/` | POST | Not used | Implemented | 🚧 Missing Frontend |
| `/api/properties/<id>/update/` | PATCH | Not used | Implemented | 🚧 Missing Frontend |
| `/api/properties/<id>/delete/` | DELETE | Not used | Implemented | 🚧 Missing Frontend |
| `/api/properties/<id>/images/` | POST | Not used | Implemented | 🚧 Missing Frontend |
| `/api/properties/images/<image_id>/delete/` | DELETE | Not used | Implemented | 🚧 Missing Frontend |

## Production Risks
- Students cannot trust property detail data because the current detail page is not backed by live API data.
- Owners cannot create or update listings from the current dashboard flows.
- Local-only filters produce misleading discovery results compared with the backend inventory.
- Media upload gaps prevent production-ready listing management.

## Recommendations
- Replace the static property detail screen with real data from `/api/properties/<id>/`.
- Push all search/filter controls through backend query params and reflect empty states from live results.
- Wire owner add/edit/delete screens to the existing CRUD endpoints.
- Add image upload/delete support to the owner listing workflow.
- Either simplify the detail UI to current backend shape or extend backend serializers to return the richer model the UI expects.

## Manual E2E Checklist
- Preconditions: backend seeded with at least three properties across multiple cities and one landlord account.
- Discovery load: open Find Room and verify cards render from `/api/properties/` without mock fallback.
- Filtering: apply city/price/type filters and verify request query params change and response count matches backend data.
- Property detail: click a property and verify page loads live details, images, and owner info from `/api/properties/<id>/`.
- Owner create: log in as landlord, submit a new property, and verify it appears in `/api/properties/my/`.
- Owner edit: update price/title and confirm persisted changes are visible on both owner and public detail screens.
- Owner media: upload and delete images and verify returned media URLs update the gallery.

## Overall Status
- Working: 20%
- Partial: 35%
- Missing Frontend: 35%
- Broken: 10%
- Checkpoint: FAIL until live detail and owner CRUD are fully connected.
