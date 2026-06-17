# Product Requirements Prompt — Chatbot
> The full picture of what the chatbot app does, who uses it, and what can go wrong.

---

## Goal

Add a Gemini-powered AI assistant for students that can search listings, create
bookings, find roommate matches, and point students to their university's
community group — all by calling the SAME models and business rules the rest
of the app already uses. The assistant must never reimplement booking or
matching logic from scratch.

---

## Features

- Student can send a message and receive a reply from the assistant
- Student can view their full chat history
- Assistant can search available listings (apartment/room/bed) by city, university, unit type
- Assistant can create a booking request on the student's behalf
- Assistant can find roommate matches using the existing AI matcher
- Assistant can look up the student's university community group
- After a successful booking, the assistant offers roommate matching and the
  relevant community group — exactly once per booking, and triggered
  deterministically server-side, not left to model discretion
- Conversation history persists across requests and server restarts by
  reconstructing the Gemini chat session from stored messages on every turn

---

## User Flow

### Student chats with the assistant
1. Frontend calls `GET /api/chatbot/` to load prior history on widget open
2. Student sends a message → `POST /api/chatbot/` with `{"message": "..."}`
3. Backend rebuilds the Gemini session from the student's last ~40 stored messages
4. Gemini decides whether to call a tool or just reply in text
5. Backend persists both the student's message and the assistant's reply
6. Frontend renders the reply

### Student asks the bot to book a room
1. Student describes what they want; assistant calls `search_available_rooms`
   and presents options
2. Student confirms one; assistant calls `book_room`
3. `book_room` performs the same checks as `BookingCreateView`: status check,
   duplicate-active-booking check, financial snapshot (20% deposit), 30-minute
   `pending_payment` expiry
4. On success, the backend detects the successful tool call by inspecting
   `automatic_function_calling_history` (not by trusting the model), then
   injects roommate-match + community-group context and sends a follow-up
   turn so the assistant offers both naturally
5. The assistant must explicitly tell the student the booking is RESERVED,
   not confirmed, and state the deposit deadline

### Student asks for roommate matches outside a booking flow
1. Assistant calls `find_roommate_matches`
2. If the student has no active `RoommateProfile`, the assistant explains
   they need to activate one — it must never silently report "no matches"

---

## Edge Cases

- Student has no active `RoommateProfile` → clear note, not an empty list
- No community group exists for the student's university → `found: False`, assistant must not invent a link
- Property no longer available when `book_room` runs → `success: False` with a relayable error
- Student already has an active booking on that property → reject, no duplicate
- Model omits `booking_unit` → infer from the property's `unit_type` (apartment→whole, room→room, bed→bed)
- Gemini API call fails (timeout, quota, bad key) → return a clean error response to the frontend, never a raw 500/stack trace
- Landlord accounts must not be able to call this endpoint at all
- Empty message body → reject with 400 before calling Gemini
- Unbounded history growth → cap loaded history per session to control token usage and latency

## Performance Requirements
- Chat history per session capped at 40 messages
- Synchronous request/response is acceptable for v1 — no streaming required
- Per-user rate limiting is NOT implemented yet — flag as a follow-up before production

---

## Implementation Checklist

Files to create (two-layer convention: `chatbot/` = DB + logic, `api/chatbot_api/` = API):

- [ ] `chatbot/__init__.py`
- [ ] `chatbot/apps.py` — `ChatbotConfig`
- [ ] `chatbot/models.py` — `ChatMessage(user FK, role choices=[user,model], content TextField, created_at)`, ordering by `created_at`
- [ ] `chatbot/services.py` — Gemini client, `SYSTEM_PROMPT`, tool functions (`search_available_rooms`, `book_room`, `find_roommate_matches`, `get_university_community_group`), `_load_history`, `handle_chat_turn`
- [ ] `api/chatbot_api/__init__.py`
- [ ] `api/chatbot_api/serializers.py` — `ChatMessageSerializer` (read-only ModelSerializer), `SendMessageSerializer` (plain Serializer, one `message` CharField)
- [ ] `api/chatbot_api/views.py` — `ChatView` (GET history / POST send), `permission_classes = [IsStudent]`
- [ ] `api/chatbot_api/urls.py` — single path, named `"chatbot"`

Settings / config:
- [ ] Add `'chatbot'` to `INSTALLED_APPS` in `config/settings.py`
- [ ] Add `path('chatbot/', include('api.chatbot_api.urls'))` to `api/urls.py`
- [ ] Add `google-genai` to `requirements.txt`
- [ ] Add `GEMINI_API_KEY` (dev) OR `GOOGLE_GENAI_USE_VERTEXAI` + `GOOGLE_CLOUD_PROJECT` + `GOOGLE_CLOUD_LOCATION` (Vertex) to `.env` / `.env.example` — these are mutually exclusive, document both options in `.env.example` with one commented out
- [ ] Run `python manage.py makemigrations chatbot && python manage.py migrate`

---

## Required Tests

Follow the existing per-app `tests.py` convention (see `bookings/tests.py`,
`messaging/tests.py` for the style: `APIClient`, `force_authenticate`, helper
functions for creating users/properties).

- [ ] Student can POST a message and receive a reply (mock the Gemini call — never hit the real API in tests)
- [ ] GET returns chat history in chronological order, scoped to the requesting user only
- [ ] Landlord gets 403 on both GET and POST
- [ ] Unauthenticated request gets 401
- [ ] Empty message body returns 400
- [ ] `book_room` rejects a property that isn't `available`
- [ ] `book_room` rejects a duplicate active booking for the same student+property
- [ ] `book_room` correctly infers `booking_unit` from `unit_type` when omitted
- [ ] `find_roommate_matches` returns a note (not an exception) when the student has no active `RoommateProfile`
- [ ] `get_university_community_group` returns `found: False` for an unseeded university, never raises
- [ ] History loaded for a session is capped at the configured limit
