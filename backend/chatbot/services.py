"""
Chatbot app services.
Business logic layer for the assistant — keeps the view thin.

Tool functions here call the same models your real views use, so behavior
stays consistent with the rest of the app (e.g. _book_room mirrors
BookingCreateView's rules; _find_roommate_matches reuses the existing
cosine-similarity matcher instead of reimplementing matching logic).

student_id is NEVER exposed in tool signatures visible to the model.
_make_tools(user) creates user-bound closures so the model cannot forge
a different student's identity.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from google import genai
from google.genai import types

from chatbot.models import ChatMessage

client = genai.Client()  # reads GEMINI_API_KEY (or Vertex env vars) automatically

SYSTEM_PROMPT = """You are the Student Hub assistant. You help students search
for and book student housing (apartments, single rooms, or shared beds).

Tone: warm, concise, conversational. Mention a suggestion once — if the
student declines or changes topic, drop it.

Booking flow facts you must get right:
- Creating a booking does NOT mean the room is theirs yet. It reserves the
  property for 30 minutes while they pay a 20% deposit. Always state the
  deposit amount in EGP and the 30-minute window clearly.
- After a booking is successfully created, ask if they'd like help finding
  a roommate, and mention their university's community group if one exists
  and they're not already a member.
- Only raise the roommate/community suggestion once per booking."""

HISTORY_LIMIT = 40


# ---------------------------------------------------------------------------
# Stateless tools (no user identity needed)
# ---------------------------------------------------------------------------

def search_available_rooms(city: str = "", university: str = "", unit_type: str = "") -> dict:
    """Search available Student Hub listings. unit_type is one of
    'apartment', 'room', or 'bed'. city and university are partial-match
    text filters."""
    from properties.models import Property

    qs = Property.objects.filter(status="available").select_related("city")
    if city:
        qs = qs.filter(city__name__icontains=city)
    if university:
        qs = qs.filter(nearby_universities__name__icontains=university)
    if unit_type:
        qs = qs.filter(unit_type=unit_type)

    results = []
    for p in qs.distinct()[:10]:
        indicative_price = p.price or p.room_price or p.bed_price
        results.append({
            "id": p.id,
            "title": p.title,
            "unit_type": p.unit_type,
            "rental_mode": p.rental_mode,
            "city": p.city.name,
            "gender_preference": p.gender_preference,
            "indicative_price_egp": float(indicative_price) if indicative_price else None,
        })
    return {"rooms": results}


def get_university_community_group(university: str) -> dict:
    """Looks up the real seeded community Group for a university (one
    exists per institution via the seed_university_groups command)."""
    from community.models import Group

    group = Group.objects.filter(category="university", name__iexact=university).first()
    if not group:
        return {"found": False}
    return {
        "found": True,
        "group_id": group.id,
        "name": group.name,
        "member_count": group.member_count,
    }


# ---------------------------------------------------------------------------
# Internal implementations — student_id is server-injected, never model-provided
# ---------------------------------------------------------------------------

def _book_room(property_id: int, student_id: int, move_in_date: str = "",
               duration_months: int = 3, booking_unit: str = "") -> dict:
    from properties.models import Property
    from accounts.models import Users
    from bookings.models import Booking

    try:
        with transaction.atomic():
            prop = Property.objects.select_for_update().select_related("city").get(id=property_id)
            student = Users.objects.get(id=student_id, role="student")

            if prop.status != "available":
                return {"success": False, "error": "This property is no longer available."}

            already_active = Booking.objects.filter(
                tenant=student,
                property=prop,
                status__in=["pending_payment", "deposit_paid", "confirmed"],
            ).exists()
            if already_active:
                return {"success": False, "error": "You already have an active booking for this property."}

            unit = booking_unit or {"apartment": "whole", "room": "room", "bed": "bed"}.get(prop.unit_type, "whole")
            unit_price_map = {
                "whole": prop.price,
                "room": prop.room_price or prop.price,
                "bed": prop.bed_price or prop.price,
            }
            unit_price = unit_price_map.get(unit)
            if not unit_price:
                return {"success": False, "error": f"This property has no price set for booking_unit '{unit}'."}

            move_in = date.fromisoformat(move_in_date) if move_in_date else date.today()
            total = int(unit_price * 100 * duration_months)
            deposit = int(unit_price * 100 * Decimal("0.20"))
            remaining = total - deposit

            booking = Booking.objects.create(
                tenant=student,
                property=prop,
                booking_unit=unit,
                move_in_date=move_in,
                duration_months=duration_months,
                total_amount_cents=total,
                deposit_amount_cents=deposit,
                remaining_amount_cents=remaining,
                expires_at=timezone.now() + timedelta(minutes=30),
                status="pending_payment",
            )
            prop.status = "reserved"
            prop.save(update_fields=["status"])

        return {
            "success": True,
            "booking_id": booking.id,
            "property_title": prop.title,
            "city": prop.city.name,
            "deposit_amount_egp": deposit / 100,
            "expires_at": booking.expires_at.isoformat(),
        }
    except Property.DoesNotExist:
        return {"success": False, "error": "Property not found."}
    except Users.DoesNotExist:
        return {"success": False, "error": "Student not found."}


def _find_roommate_matches(student_id: int) -> dict:
    from accounts.models import Users
    from roommates.models import RoommateProfile
    from api.roommates_api.ml_utils import process_and_match

    try:
        student = Users.objects.get(id=student_id)
    except Users.DoesNotExist:
        return {"matches": [], "note": "Student not found."}

    try:
        current_profile = RoommateProfile.objects.get(user=student, is_active=True)
    except RoommateProfile.DoesNotExist:
        return {
            "matches": [],
            "note": "You don't have an active roommate profile yet. Activate one in the Roommates section to get matched.",
        }

    filters = {"is_active": True}
    if student.gender:
        filters["user__gender"] = student.gender
    if current_profile.university:
        filters["university"] = current_profile.university
    if current_profile.city:
        filters["city"] = current_profile.city

    compatible = RoommateProfile.objects.filter(**filters)
    profiles_data = compatible.values(
        "user__id", "user__username", "sleeping_time", "cleanliness",
        "personality", "smoking", "guests_policy", "budget_min", "budget_max",
        "room_type_preference",
    )
    matches = process_and_match(
        current_user_username=student.username,
        profiles_queryset=profiles_data,
        top_n=3,
    )
    return {"matches": matches}


# ---------------------------------------------------------------------------
# Tool factory — binds user identity server-side so the model can't forge it
# ---------------------------------------------------------------------------

def _make_tools(user):
    """Returns tool functions whose user-specific params are closed over
    from `user`. The model only sees property_id, dates, and filters —
    never a student_id it could manipulate."""

    def book_room(property_id: int, move_in_date: str = "",
                  duration_months: int = 3, booking_unit: str = "") -> dict:
        """Create a booking request for a property. booking_unit is 'whole',
        'room', or 'bed' — if omitted it's inferred from the property's
        unit_type. Returns success=False with an error message on failure."""
        return _book_room(property_id, user.id, move_in_date, duration_months, booking_unit)

    def find_roommate_matches() -> dict:
        """Returns top roommate matches using the existing cosine-similarity
        matcher, with the same hard constraints (gender, university, city) as
        /api/roommates/matches/. Returns a note if the student has no active
        roommate profile."""
        return _find_roommate_matches(user.id)

    return [search_available_rooms, book_room, find_roommate_matches, get_university_community_group]


# ---------------------------------------------------------------------------
# Session / history management
# ---------------------------------------------------------------------------

def _load_history(user):
    """Rebuilds a genai-compatible history list from stored ChatMessage rows."""
    turns = (
        ChatMessage.objects
        .filter(user=user)
        .order_by("created_at")[: HISTORY_LIMIT]
    )
    return [
        types.Content(role=t.role, parts=[types.Part(text=t.content)])
        for t in turns
    ]


def _booking_succeeded_in_response(response) -> bool:
    """Inspects automatic_function_calling_history to detect a successful
    book_room call. Checks FunctionResponse parts so the result is
    server-verified, not model-reported."""
    for content in getattr(response, "automatic_function_calling_history", None) or []:
        for part in getattr(content, "parts", None) or []:
            fr = getattr(part, "function_response", None)
            if fr is None:
                continue
            if getattr(fr, "name", None) == "book_room":
                resp = getattr(fr, "response", None) or {}
                if resp.get("success"):
                    return True
    return False


def handle_chat_turn(user, user_message: str) -> str:
    """Sends one user message through a freshly-rebuilt chat session, then
    deterministically injects the roommate/community nudge if a booking
    just succeeded. Raises on Gemini errors so the view can return a clean
    error response."""
    tools = _make_tools(user)

    chat_session = client.chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=tools,
        ),
        history=_load_history(user),
    )

    response = chat_session.send_message(user_message)
    reply_text = response.text

    if _booking_succeeded_in_response(response):
        university = getattr(getattr(user, "student_profile", None), "university", "") or ""
        roommates = _find_roommate_matches(user.id)
        group = get_university_community_group(university) if university else {"found": False}
        nudge = (
            f"[system note: booking reserved, deposit required within 30 minutes. "
            f"Roommate matches: {roommates['matches']}. Community group: {group}. "
            f"Remind them about the deposit deadline, then offer roommate help "
            f"and the community group per your instructions.]"
        )
        followup = chat_session.send_message(nudge)
        reply_text = f"{reply_text}\n\n{followup.text}"

    ChatMessage.objects.create(user=user, role="user", content=user_message)
    ChatMessage.objects.create(user=user, role="model", content=reply_text)

    return reply_text
