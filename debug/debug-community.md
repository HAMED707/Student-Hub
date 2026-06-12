# Community Debug Report

## Summary
- Domain: Community
- Gate Verdict: FAIL
- Status: ⚠ Partial / ❌ Broken / 🚧 Missing Backend / 🚧 Missing Frontend
- Audit scope: groups, membership, posts, feed interactions, and community navigation assumptions.
- Overall assessment: posts and basic group fetching are partially connected, but group management remains largely local and the richer social feed interactions in the UI exceed what the backend currently supports.

## Frontend Issues
- `frontend/src/pages/Commuity/Posts.jsx` uses live group and post APIs and can create posts.
- `frontend/src/pages/Commuity/Groups.jsx` still relies heavily on local group state for join/create flows instead of backend endpoints.
- `frontend/src/pages/Commuity/Community.jsx` uses local mock chat/group coordination patterns and is not a fully backend-driven shell.
- Current UI supports local comment, share, and like behaviors that are not backed by APIs.

## Backend Issues
- Backend supports groups, group membership join/leave, and posts create/list.
- Backend does not currently provide comment, reply, like, or share endpoints for the richer feed interactions shown in the UI.

## Integration Issues
- Basic group list and my-group reads are connected.
- Post listing and post creation are connected in one screen.
- Group join/leave/create are not consistently wired where users expect them.
- Feed interaction breadth in the UI is larger than the real backend contract.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/community/groups/` | GET | Used | Implemented | ⚠ Partial |
| `/api/community/groups/my/` | GET | Used | Implemented | ✅ Working |
| `/api/community/groups/create/` | POST | Not consistently used | Implemented | 🚧 Missing Frontend |
| `/api/community/groups/<group_id>/` | GET | Limited use | Implemented | ⚠ Partial |
| `/api/community/groups/<group_id>/join/` | POST | Helper exists, not used in main flow | Implemented | 🚧 Missing Frontend |
| `/api/community/groups/<group_id>/leave/` | POST | Helper exists, not used in main flow | Implemented | 🚧 Missing Frontend |
| `/api/community/posts/<group_id>/` | GET | Used | Implemented | ✅ Working |
| `/api/community/posts/create/` | POST | Used | Implemented | ✅ Working |
| comments/likes/shares endpoints | mixed | UI implies them | Missing | 🚧 Missing Backend |

## Production Risks
- Users may think they joined or created groups when changes are only local.
- Social interactions beyond posting are misleading because they are not persisted anywhere.
- Community shell inconsistency makes future messaging/group integrations harder to reason about.

## Recommendations
- Convert groups page to a fully backend-driven join/leave/create flow.
- Remove or clearly disable unsupported comment/like/share behaviors until backend exists.
- Normalize community state around real group membership and selected-group context.

## Manual E2E Checklist
- Preconditions: authenticated student, at least one public group, one joined group.
- Group list: load groups and verify items come from `/api/community/groups/`.
- Join group: join a public group and verify membership persists and appears in `/api/community/groups/my/`.
- Leave group: leave the group and verify it disappears from the my-groups response.
- Create group: create a group and verify it is returned by both list and my-groups endpoints.
- Post flow: open a joined group, create a post, and verify it appears in `/api/community/posts/<group_id>/`.
- Unsupported actions: trigger comment/like/share UI and verify these are either disabled or documented as not implemented.

## Overall Status
- Working: 30%
- Partial: 30%
- Missing Frontend: 20%
- Missing Backend: 15%
- Broken: 5%
- Checkpoint: FAIL until group membership and unsupported feed actions are reconciled with the backend contract.
