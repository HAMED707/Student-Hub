<div align="center">

# 🎓 Student Hub

**The all-in-one platform for student housing in Egypt — find a room, match with the right roommate, and manage everything in one place.**

[![Django](https://img.shields.io/badge/Django-6.0-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-REST_API-A30000?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)

</div>

---

## 📖 Overview

**Student Hub** connects students with verified accommodation and compatible roommates. Property owners list rooms and manage bookings; students search by location, filter by budget, book a place, and get matched with potential roommates through an **AI compatibility engine**. The platform also bundles community groups, in-app messaging, reviews, payments, and real-time notifications into a single experience.

Built as a full-stack application with a **Django REST** backend and a **React (Vite)** frontend.

---


## 🎬 Demo

https://github.com/user-attachments/assets/6a37ca06-707e-4558-9385-7f18785c473b


 
## ✨ Features

### 🏠 Accommodation
- Browse and search student housing with **map-based discovery** (Leaflet).
- Filter by city, university proximity, budget, and amenities.
- Detailed property listings with image galleries.
- Save favorites and revisit them later.

### 🤝 AI Roommate Matching
- Build a roommate profile (lifestyle, study habits, cleanliness, budget, etc.).
- Get ranked matches via **scikit-learn cosine similarity** — not naive field counting.
- Discover compatible students filtered by university and city.
- Send, accept, reject, and withdraw **roommate requests**.

### 📅 Bookings & Payments
- Request a booking and track its status (request → deposit paid → confirmed → completed).
- **Stripe-powered** deposit and payment flow with webhook handling.
- Owner-side booking management and status updates.

### 💬 Messaging & Community
- Direct conversations between students and landlords.
- Community **groups** and **posts** for student discussions.

### ⭐ Reviews & Notifications
- Leave star ratings and reviews on properties and profiles.
- **Real-time notifications** (booking updates, new messages, reviews) via Django Channels (WebSockets).

### 🔐 Identity & Trust
- JWT-based authentication with role separation (Student / Landlord).
- **KYC verification** through Persona webhooks.
- Document upload for landlord verification.

### 🤖 Extras
- Built-in chatbot widget for support.
- Services lookup directory.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Django 6, Django REST Framework, SimpleJWT |
| **Real-time** | Django Channels (ASGI), Redis |
| **Database** | PostgreSQL |
| **AI / ML** | scikit-learn (cosine similarity) |
| **Payments** | Stripe |
| **Identity** | Persona (KYC) |
| **Frontend** | React, Vite, React Router v6, Tailwind CSS |
| **UI / Maps** | Lucide icons, Leaflet / react-leaflet |

---

## 🏗️ Architecture

The backend is organized into clean, domain-oriented apps, each exposing its own REST router:

```
/api
├── auth/           → accounts (registration, login, profiles, verification)
├── properties/     → listings, search, owner CRUD
├── bookings/       → booking lifecycle
├── favorites/      → saved properties
├── reviews/        → property & profile reviews
├── roommates/      → AI matching, requests
├── community/      → groups & posts
├── messaging/      → conversations & messages
├── notifications/  → real-time alerts (Channels)
├── payments/       → Stripe checkout + webhooks
├── services/       → services directory
├── chatbot/        → support assistant
└── kyc/            → Persona identity verification
```

> JWT tokens are obtained at `/api/token/` and refreshed at `/api/token/refresh/`.
> Stripe and Persona events are handled at `/api/webhooks/stripe/` and `/api/webhooks/persona/`.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis (for Channels / real-time features)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd student-hub
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure your .env (see below), then:
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on Vite's dev server (default `http://localhost:5173`) and the API on `http://localhost:8000`.

---

## 🔧 Environment Variables

Create a `.env` file in `backend/` with at least:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/studenthub
REDIS_URL=redis://localhost:6379/0

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PERSONA_API_KEY=...
PERSONA_WEBHOOK_SECRET=...
```

---

## 🌱 Seed Data

Populate the database with realistic test data:

```bash
# Roommate test users (with varying AI match scores)
python manage.py seed_roommate_data
python manage.py seed_roommate_data --reset      # wipe and re-seed

# 40 properties across 10 landlords (with real images)
python manage.py seed_properties
python manage.py seed_properties --reset         # wipe and re-seed
python manage.py seed_properties --skip-images   # fast, no network needed
```

### Test Accounts

| Username | Password | Role | Notes |
|---|---|---|---|
| `test_student1` | `Test1234!` | Student | Main test account (Cairo University) |
| `seed_rm_ahmed_sayed` | `Test1234!` | Student | ~100% AI match with `test_student1` |
| `seed_rm_mohamed_farouk` | `Test1234!` | Student | ~94% AI match |
| `seed_rm_khaled_mostafa` | `Test1234!` | Student | ~84% AI match |
| `seed_rm_amir_samir` | `Test1234!` | Student | ~49% AI match |
| `seed_rm_tarek_nabil` | `Test1234!` | Student | ~29% AI match |
| `seed_landlord_001`–`010` | `Pass1234!` | Landlord | 10 landlords with 40 properties |

> A roommate profile must have `is_active = True` to appear in AI matching.

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary blue | `#155BC2` |
| Dark navy | `#091E42` |
| Neutrals | Tailwind `slate` palette |
| Cards | `rounded-3xl` |
| Icons | `lucide-react` |

---

## 📁 Project Structure

```
student-hub/
├── backend/
│   ├── api/                  # DRF app routers (auth, properties, roommates, …)
│   ├── accounts/             # User & profile models
│   ├── properties/           # Property models + seed command
│   ├── roommates/            # Roommate models + AI matching + seed command
│   ├── postman/              # API collections
│   └── manage.py
└── frontend/
    └── src/
        ├── pages/            # Home, FindRoom, Roommate, Messaging, Community, …
        ├── assets/components # Navbar, PropertyCard, ChatbotWidget, …
        ├── hooks/            # useMessagingInbox, …
        └── utils/            # properties helpers, …
```

---

## 🗺️ Roadmap

- [ ] Password recovery / reset flow
- [ ] Send-message endpoint for ongoing conversations + WebSocket delivery
- [ ] Community comments, likes, and shares
- [ ] Full owner property CRUD with media management
- [ ] Student payment-history screens
- [ ] Production deployment & end-to-end QA

---

## 📄 License

Released under the [MIT License](LICENSE).

---

