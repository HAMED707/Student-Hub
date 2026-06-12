# Messaging Debug Report

## Summary
- Domain: Messaging
- Gate Verdict: FAIL
- Status: ⚠ Partial / ❌ Broken / 🚧 Missing Backend / 🚧 Missing Frontend
- Audit scope: conversation list, conversation history, conversation creation, message sending, and realtime assumptions.
- Overall assessment: conversation listing and history reads exist, but end-to-end messaging is incomplete because the backend lacks a send-message-to-existing-conversation endpoint and the frontend still uses local message behavior in key screens.

## Frontend Issues
- Owner dashboard messaging reads conversations and histories from live endpoints.
- Community/message screens still contain local send-message behavior and mock conversation assumptions.
- There is no durable frontend flow for starting a conversation and then continuing it through backend APIs.
- No websocket or polling strategy is wired for live updates.

## Backend Issues
- Backend exposes conversation list and detail history endpoints.
- Backend can start a conversation with an initial message, but does not provide a dedicated endpoint to post new messages into an existing conversation.
- Backend does not expose file/message attachment support for the richer UI patterns.
- No websocket contract is exposed for realtime delivery in the audited API surface.

## Integration Issues
- Read-only messaging is partially connected.
- True ongoing chat is blocked by backend capability gaps and frontend reliance on local state.
- Messaging expectations in the UI are broader than the actual API contract.

## API Coverage
| Endpoint | Method | Frontend Status | Backend Status | Result |
| --- | --- | --- | --- | --- |
| `/api/messaging/` | GET | Used | Implemented | ✅ Working |
| `/api/messaging/` | POST | Limited use for new conversation only | Implemented | ⚠ Partial |
| `/api/messaging/<conversation_id>/` | GET | Used | Implemented | ✅ Working |
| send message to existing conversation | POST | UI needs it | Missing | 🚧 Missing Backend |
| realtime/websocket messaging | WS | UI implies it in places | Missing | 🚧 Missing Backend |

## Production Risks
- Users cannot rely on the app for an actual continuous chat experience.
- Local message sending can create false confidence that messages were delivered.
- Lack of realtime updates makes communication feel stale even where reads work.

## Recommendations
- Add backend endpoint for sending messages to an existing conversation.
- Disable local-only send interactions until the backend supports them.
- Add polling or websocket integration once backend contract exists.
- Standardize conversation bootstrapping and message history rendering across owner and student/community screens.

## Manual E2E Checklist
- Preconditions: two authenticated users with permission to message each other.
- Conversation list: load messaging hub and verify `/api/messaging/` returns existing threads.
- New conversation: start a conversation through `/api/messaging/` POST and verify initial message persists.
- History view: open the conversation and verify `/api/messaging/<conversation_id>/` returns the saved message sequence.
- Continued message send: attempt to send a second message and verify the feature is either implemented against a real endpoint or clearly blocked in UI.
- Refresh behavior: reload after message activity and verify conversation history remains accurate.

## Overall Status
- Working: 25%
- Partial: 30%
- Missing Backend: 30%
- Missing Frontend: 10%
- Broken: 5%
- Checkpoint: FAIL until ongoing send-message support exists and local-only chat behavior is removed.
