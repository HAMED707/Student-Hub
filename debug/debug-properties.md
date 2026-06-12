# Properties Debug Report

## Summary
- Domain: Properties
- Gate Verdict: PASS WITH GAPS
- Status: ✅ Working / ⚠ Partial / 🚧 Missing Frontend
- Audit scope: property listing, detail view, filters, property-backed discovery, and landlord property management.
- Overall assessment: the student-facing browse/detail journey is now truly linked to the backend. Find Room fetches live filtered listings, the property detail page loads real API data and reviews, and property-to-owner navigation now respects the auth model. The main remaining gap is landlord CRUD/media management.

## Frontend Issues
- Resolved: `frontend/src/pages/FindRoom/FindRoom.jsx` now fetches listings from backend using live query params instead of relying only on local mock filtering.
- Resolved: `frontend/src/pages/FindRoom/PropertyDetails.jsx` now loads `/api/properties/<id>/` and live property reviews instead of rendering a static mock page.
- Resolved: property detail “View Profile” now opens the landlord public profile route rather than a landlord-only dashboard route.
- Resolved: property detail “Contact Owner” now points to the shared messaging area instead of a landlord-only route.
- Remaining: landlord create/edit/delete flows in owner property screens are still not connected.
- Remaining: property image upload/delete flows in owner tools are still not connected.

## Backend Issues
- Resolved: list serializer now exposes `latitude` and `longitude`, enabling live map placement from backend data.
- Resolved: property list filtering now supports frontend search query `q` and comma-separated `type` / `amenity` values.
- Remaining: backend still does not provide a richer room-by-room detail contract, so the frontend currently derives room cards from aggregate listing counts.

## Integration Issues
- Resolved: discovery cards now use live property data with real coordinates and live status.
- Resolved: property detail now uses backend detail + review data and no longer depends on a hardcoded property mock.
- Remaining: owner listing management is still missing end to end.
- Remaining: some detail-page sections such as room granularity and utility specifics are still derived/fallback because the backend contract is aggregate-level.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/properties/` | GET | Used with live filters/search | Implemented | ✅ Working |
| `/api/properties/<id>/` | GET | Used on detail page | Implemented | ✅ Working |
| `/api/reviews/property/<property_id>/` | GET | Used on detail page | Implemented | ✅ Working |
| `/api/properties/landlord/properties/` | GET | Used in owner areas elsewhere, not full property dashboard flow | Implemented | ⚠ Partial |
| `/api/properties/create/` | POST | Not used in owner property screens | Implemented | 🚧 Missing Frontend |
| `/api/properties/<id>/edit/` | PATCH | Not used in owner property screens | Implemented | 🚧 Missing Frontend |
| `/api/properties/<id>/images/` | POST | Not used | Implemented | 🚧 Missing Frontend |
| `/api/properties/<id>/images/<image_id>/` | DELETE | Not used | Implemented | 🚧 Missing Frontend |

## Production Risks
- Owner property management is still incomplete, so landlords cannot fully manage listings from the current UI.
- The detail page still derives room/bill breakdowns because the backend does not expose room-level inventory.

## Recommendations
- Keep the new live listing/detail flow as the source of truth for property browsing.
- Next, wire owner add/edit/delete and image-management flows to complete the domain.
- If room-level booking matters, either simplify the detail UX around aggregate listing availability or extend the backend contract with real room/bed models.

## Manual E2E Checklist
- Preconditions: backend seeded with multiple listings across cities/universities.
- Discovery load: open Find Room and verify cards render from `/api/properties/` with real titles, locations, statuses, and map pins.
- Search/filter: search by area/title and apply property type, amenity, Cairo, and max-price filters; verify requests and results change accordingly.
- Detail load: open `/find-room/<id>` and verify title, price, address, landlord info, images, review count, and review list come from live APIs.
- Profile navigation: click the owner profile CTA from property detail and verify it opens `/profile/<landlord_id>`.
- Contact navigation: click Contact Owner and verify the shared messaging route opens instead of redirecting into owner-only routes.
- Fallback behavior: temporarily break the property detail request and verify the page fails gracefully instead of crashing.

## Overall Status
- Working: 70%
- Partial: 15%
- Missing Frontend: 15%
- Checkpoint: PASS for student-facing property discovery and detail. Owner property management still needs its own integration pass.
