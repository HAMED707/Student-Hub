# rules.md
> Read this before writing any code or prompting any AI.

---

## Coding Standards

- always use `status.HTTP_200_OK` not raw numbers like `200`
- always wrap `.get()` in try/except — never trust a record exists
- always use `ModelSerializer` not `Serializer` when a model exists
- always use `partial=True` on PATCH requests
- always use `select_related` / `prefetch_related` on ForeignKey queries
- never use `Booking.objects.all()` in views — always filter by the logged in user
- always name every URL in urls.py

---

## Architecture Decisions

- two-layer rule: `appname/models.py` is the DB layer, `api/appname_api/` is the API layer
- serializers are per-scenario not per-model — ask "what is the user doing?" not "what is the model?"
- permissions live in `api/accounts_api/permissions.py` — import from there, never repeat role checks in views
- object-level ownership checks live in `api/properties_api/permissions.py`
- business logic (validate, status transitions) lives in serializers and views — never in models
- signals live in `appname/signals.py` and are imported in `appname/apps.py` inside `ready()`

---

## Project-Specific Context

- two user types: `student` and `landlord` — stored in `Users.role`
- `Users` is a custom model that extends `AbstractUser` — always import from `accounts.models`
- `StudentProfile` and `LandlordProfile` are auto-created by signal on register — never create manually
- `tenant` is always injected from `request.user` in the view — never accepted from user input
- `owner` of a property is always injected from `request.user` — never accepted from user input
- property status is controlled by bookings signal — `approved` → `rented`, `cancelled/rejected` → `available`
- `IsStudent` and `IsLandlord` are in `api/accounts_api/permissions.py`
- `IsPropertyOwner` is in `api/properties_api/permissions.py` and requires `self.check_object_permissions(request, obj)`
- currency is EGP — all price fields are in Egyptian Pounds