# rules.md
> Read this before writing any code or prompting any AI.

---

## Coding Standards

- always use `status.HTTP_200_OK` not raw numbers like `200`
- always wrap `.get()`-style lookups in try/except — never trust a record exists
- always use `ModelSerializer` when a model exists; `SendMessageSerializer` is the
  one legitimate exception — there's no model for a raw outgoing message
- always name every URL in urls.py
- never let a Gemini API exception or tool-call exception bubble up as a raw
  500 — catch it in the view and return a clean error response
- never trust a `student_id`/`user_id` from the request body for tool calls —
  tools are always invoked with `request.user`/`request.user.id`, injected
  server-side, never accepted from the client or from the model's own output

---

## Architecture Decisions

- two-layer rule: `chatbot/models.py` + `chatbot/services.py` are the DB and
  business-logic layer, `api/chatbot_api/` is the API layer
- tool functions in `chatbot/services.py` call the SAME models and rules as
  the real views — `book_room` mirrors `BookingCreateView`,
  `find_roommate_matches` reuses `api.roommates_api.ml_utils.process_and_match`.
  Never reimplement booking or matching logic from scratch inside the chatbot app
- Gemini's chat session object does not survive across requests or multiple
  server workers — every request rebuilds the session from `ChatMessage` rows
  via the SDK's `history=` parameter
- the post-booking roommate/community nudge is triggered deterministically in
  `handle_chat_turn` by inspecting `automatic_function_calling_history` —
  never left to the model's discretion to remember
- permissions live in `api/accounts_api/permissions.py` — import `IsStudent`
  from there, never repeat role checks in the chatbot views

---

## Project-Specific Context

- `Property.unit_type` is one of `apartment`/`room`/`bed`; the active price
  lives in `price`, `room_price`, or `bed_price` depending on `unit_type` and
  `rental_mode` — never assume a single flat `price` field
- `Booking.status` starts as `pending_payment` on creation — this is NOT a
  confirmed booking. It expires in 30 minutes unless a deposit is paid. The
  assistant must always communicate this distinction to the student, never
  say "your booking is confirmed" at creation time
- creating a `Booking` via the ORM automatically fires the existing
  `notifications/signals.py` handlers (the landlord gets notified) — the
  chatbot must NOT send a duplicate notification itself
- `RoommateProfile` hard constraints are gender (`Users.gender`),
  `university`, and `city`; soft matching is cosine similarity inside
  `ml_utils.process_and_match` — the chatbot must pass the current user's own
  row into that function, since it excludes self internally
- community `Group` rows for universities are seeded 1:1 by name via the
  `seed_university_groups` management command — look them up by
  `category="university"` and `name__iexact=<university>`, never construct a
  group reference or URL manually
- currency is EGP — all price fields are in Egyptian Pounds; deposit is
  always 20% of the relevant unit price, matching `BookingCreateView`
- `GEMINI_API_KEY` (Developer API) and `GOOGLE_GENAI_USE_VERTEXAI` +
  `GOOGLE_CLOUD_PROJECT` + `GOOGLE_CLOUD_LOCATION` (Vertex) are mutually
  exclusive auth modes — `genai.Client()` with no arguments auto-detects
  whichever is configured via environment variables, so don't hardcode one
- only students may use the chatbot endpoints — `IsStudent`, same as
  roommate and favorites endpoints
