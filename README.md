# Accommodation Finder (Full‑Stack)

Accommodation Finder is a web app for discovering student accommodation and (eventually) booking / contacting landlords and finding roommates.

This repository contains:
- A **Django + DRF** backend (currently focused on **Accounts/Auth**).
- A **React + Vite + Tailwind** frontend (currently using **mock data** and a local **json-server** for demo auth data).

## Contents
- [Project status](#project-status)
- [Repo structure](#repo-structure)
- [Local setup](#local-setup)
  - [Backend (Django)](#backend-django)
  - [Frontend (React + Vite)](#frontend-react--vite)
  - [Demo login data (json-server)](#demo-login-data-json-server)
- [Backend API (Accounts/Auth)](#backend-api-accountsauth)
- [Architecture (current)](#architecture-current)

## Project status
Active development. Some items in the UI and original tech‑stack plan are not implemented yet in the codebase (see “What’s implemented”).

## Repo structure
- `backend/` — Django project (`config`) + `accounts` app + DRF API under `api/`
- `frontend/` — React (Vite) application
- `README.md` — single-file documentation (this file)

## Local setup

### Backend (Django)
Prereqs: Python 3.12+ recommended, PostgreSQL optional (SQLite works by default).

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Backend will run at `http://127.0.0.1:8000/`.

Optional (admin user):
```bash
python manage.py createsuperuser
```

#### Backend environment variables
Backend reads variables from `backend/.env` (via `python-dotenv` in `backend/config/settings.py`).

Used keys:
- `SECRET_KEY` (string)
- `DEBUG` (`True`/`False`)
- `ALLOWED_HOSTS` (comma-separated; example: `localhost,127.0.0.1`)
- `DB_ENGINE` (example: `django.db.backends.sqlite3` or `django.db.backends.postgresql`)
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`

#### Database options

SQLite (default):
- If you don’t set any `DB_*` variables, Django uses SQLite at `backend/db.sqlite3`.

PostgreSQL:
1) Create the database/user (example script):
```bash
cd backend
psql -f setup_db.sql
```
2) Update `backend/.env` to point to PostgreSQL (see `backend/.env.example`).

### Frontend (React + Vite)
Prereqs: Node.js 18+ recommended.

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at `http://127.0.0.1:5173/` (Vite default).

### Demo login data (json-server)
The current frontend login screen queries a json-server instance (port `3001`) using `frontend/db.json`.

```bash
cd frontend
npx json-server --watch db.json --port 3001
```

## Backend API (Accounts/Auth)

Base URL (local): `http://127.0.0.1:8000/api/accounts/`

Authentication: JWT via `Authorization: Bearer <access_token>`.

### Endpoints

- `POST /register/` — create user (no tokens; login after)
- `POST /login/` — returns JWT `access` + `refresh`
- `POST /logout/` — placeholder (no blacklist yet)
- `GET|PUT|PATCH /profile/` — get/update current user (JWT required)
- `POST /token/refresh/` — refresh access token (SimpleJWT)

### `POST /register/`
Creates a new user. This endpoint does **not** return tokens; call `/login/` after registration.

Body (JSON):
```json
{
  "username": "demo",
  "email": "demo@example.com",
  "first_name": "Demo",
  "last_name": "User",
  "password": "your-password",
  "phone_number": "+201234567890",
  "gender": "M",
  "date_of_birth": "2000-01-01"
}
```

Notes:
- `phone_number` is validated to require a `+` prefix and a minimum length.
- `profile_picture` exists on the model and serializer; uploading it requires `multipart/form-data`.

### `POST /login/`
Returns user data and JWT tokens.

Body (JSON):
```json
{ "username": "demo", "password": "your-password" }
```

Response shape:
```json
{
  "user": { "id": 1, "username": "demo", "email": "demo@example.com", "...": "..." },
  "tokens": { "refresh": "…", "access": "…" }
}
```

### `POST /logout/` (JWT required)
Currently a placeholder endpoint that returns a success message. Token blacklisting is not implemented in this repo yet.

### `GET /profile/` (JWT required)
Returns the current authenticated user.

### `PUT /profile/` and `PATCH /profile/` (JWT required)
Updates the current authenticated user.

### `POST /token/refresh/`
Refreshes an access token (SimpleJWT built-in view).

Body (JSON):
```json
{ "refresh": "…" }
```

### cURL examples

Register:
```bash
curl -X POST http://127.0.0.1:8000/api/accounts/register/ \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","email":"demo@example.com","password":"pass1234"}'
```

Login:
```bash
curl -X POST http://127.0.0.1:8000/api/accounts/login/ \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"pass1234"}'
```

Get profile:
```bash
curl http://127.0.0.1:8000/api/accounts/profile/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## What’s implemented (as of this repo)
- Backend: custom `Users` model, JWT auth endpoints, profile read/update, media upload field for profile picture.
- Frontend: routes/pages for onboarding, home, find room (mock), property details (mock), community UI (mock), profile UI (mock).

## Architecture (current)

### Backend
- Django project: `backend/config/`
- Apps:
  - `backend/accounts/` — custom user model (`Users`) extending `AbstractUser`
  - `backend/api/` — DRF routing
  - `backend/api/accounts_api/` — register/login/logout/profile endpoints + JWT refresh

Key points:
- Auth: SimpleJWT (access + refresh tokens)
- Media: `profile_picture` is an `ImageField` stored under `backend/media/profile_pics/` in development
- CORS: allowed origins are currently hard-coded for localhost ports `3000` and `5173`

### Frontend
- React app (Vite) under `frontend/`
- Routing is handled in `frontend/src/App.jsx`

Current data state:
- Many pages use mock/static data.
- The login page currently reads user data from a local json-server (`frontend/db.json`) rather than the Django backend.

### Roadmap notes (suggested next integration steps)
- Frontend auth should call the Django endpoints (`/api/accounts/login/`, `/api/accounts/profile/`) and store JWT tokens.
- If you want refresh-token blacklisting on logout, enable SimpleJWT’s blacklist app and implement token invalidation server-side.
