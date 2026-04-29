"""
Management command to seed test users for roommate matching.

Usage:
    python manage.py seed_roommate_test_data

Creates 6 female students all at Cairo University, Cairo.
Student 1 is the "requester" — run matches as her to see ranked results.
The others are designed to produce a spread of scores from ~95% down to ~30%.
"""

from django.core.management.base import BaseCommand
from accounts.models import Users, StudentProfile
from roommates.models import RoommateProfile


USERS = [
    # ── Student 1 — the requester (login as this one to test) ──────────────
    {
        "user": {
            "username": "test_student1",
            "password": "Test1234!",
            "first_name": "Nour",
            "last_name": "Hassan",
            "email": "nour@test.com",
            "role": "student",
            "gender": "F",
            "city": "Cairo",
        },
        "roommate_profile": {
            "is_active": True,
            "university": "Cairo University",
            "city": "Cairo",
            "sleeping_time": "late",
            "cleanliness": "high",
            "personality": "quiet",
            "smoking": "non_smoker",
            "guests_policy": "sometimes",
            "budget_min": 2000,
            "budget_max": 4000,
            "room_type_preference": "single",
        },
    },
    # ── Student 2 — near-perfect match with student 1 (~95%) ───────────────
    {
        "user": {
            "username": "test_student2",
            "password": "Test1234!",
            "first_name": "Layla",
            "last_name": "Ahmed",
            "email": "layla@test.com",
            "role": "student",
            "gender": "F",
            "city": "Cairo",
        },
        "roommate_profile": {
            "is_active": True,
            "university": "Cairo University",
            "city": "Cairo",
            "sleeping_time": "late",       # same
            "cleanliness": "high",         # same
            "personality": "quiet",        # same
            "smoking": "non_smoker",       # same
            "guests_policy": "sometimes",  # same
            "budget_min": 2500,
            "budget_max": 4500,
            "room_type_preference": "single",
        },
    },
    # ── Student 3 — good match (~70%) ──────────────────────────────────────
    {
        "user": {
            "username": "test_student3",
            "password": "Test1234!",
            "first_name": "Mariam",
            "last_name": "Youssef",
            "email": "mariam@test.com",
            "role": "student",
            "gender": "F",
            "city": "Cairo",
        },
        "roommate_profile": {
            "is_active": True,
            "university": "Cairo University",
            "city": "Cairo",
            "sleeping_time": "normal",     # different
            "cleanliness": "high",         # same
            "personality": "quiet",        # same
            "smoking": "non_smoker",       # same
            "guests_policy": "never",      # different
            "budget_min": 2000,
            "budget_max": 3500,
            "room_type_preference": "single",
        },
    },
    # ── Student 4 — average match (~50%) ───────────────────────────────────
    {
        "user": {
            "username": "test_student4",
            "password": "Test1234!",
            "first_name": "Sara",
            "last_name": "Mostafa",
            "email": "sara@test.com",
            "role": "student",
            "gender": "F",
            "city": "Cairo",
        },
        "roommate_profile": {
            "is_active": True,
            "university": "Cairo University",
            "city": "Cairo",
            "sleeping_time": "early",      # very different
            "cleanliness": "medium",       # different
            "personality": "social",       # different
            "smoking": "non_smoker",       # same
            "guests_policy": "often",      # different
            "budget_min": 2000,
            "budget_max": 4000,
            "room_type_preference": "shared",
        },
    },
    # ── Student 5 — poor match (~30%) ──────────────────────────────────────
    {
        "user": {
            "username": "test_student5",
            "password": "Test1234!",
            "first_name": "Dina",
            "last_name": "Khalil",
            "email": "dina@test.com",
            "role": "student",
            "gender": "F",
            "city": "Cairo",
        },
        "roommate_profile": {
            "is_active": True,
            "university": "Cairo University",
            "city": "Cairo",
            "sleeping_time": "early",      # very different
            "cleanliness": "low",          # very different
            "personality": "social",       # different
            "smoking": "smoker",           # different
            "guests_policy": "often",      # different
            "budget_min": 5000,
            "budget_max": 8000,            # budget gap
            "room_type_preference": "shared",
        },
    },
    # ── Student 6 — filtered OUT by hard constraints (male) ────────────────
    # This one should NEVER appear in student1's matches
    {
        "user": {
            "username": "test_student6",
            "password": "Test1234!",
            "first_name": "Omar",
            "last_name": "Farouk",
            "email": "omar@test.com",
            "role": "student",
            "gender": "M",                 # different gender → filtered out
            "city": "Cairo",
        },
        "roommate_profile": {
            "is_active": True,
            "university": "Cairo University",
            "city": "Cairo",
            "sleeping_time": "late",
            "cleanliness": "high",
            "personality": "quiet",
            "smoking": "non_smoker",
            "guests_policy": "sometimes",
            "budget_min": 2000,
            "budget_max": 4000,
            "room_type_preference": "single",
        },
    },
]


class Command(BaseCommand):
    help = "Seeds 6 test students for roommate matching tests"

    def handle(self, *args, **kwargs):
        created = 0
        skipped = 0

        for entry in USERS:
            u_data = entry["user"]
            rp_data = entry["roommate_profile"]
            username = u_data["username"]

            if Users.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f"  SKIP  {username} (already exists)"))
                skipped += 1
                continue

            # Create user
            user = Users.objects.create_user(
                username=u_data["username"],
                password=u_data["password"],
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                email=u_data["email"],
                role=u_data["role"],
                gender=u_data["gender"],
                city=u_data["city"],
            )

            # Create or update RoommateProfile
            RoommateProfile.objects.update_or_create(
                user=user,
                defaults=rp_data,
            )

            self.stdout.write(self.style.SUCCESS(f"  OK    {username} ({u_data['first_name']})"))
            created += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Done. {created} created, {skipped} skipped."))
        self.stdout.write("")
        self.stdout.write("Login as test_student1 / Test1234! to test matching.")
        self.stdout.write("Expected match order: student2 (~95%) > student3 (~70%) > student4 (~50%) > student5 (~30%)")
        self.stdout.write("student6 should NOT appear (different gender — filtered by hard constraint)")