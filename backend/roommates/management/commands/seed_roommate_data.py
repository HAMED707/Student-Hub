"""
Management command: seed_roommate_data
=======================================
Injects varied test students to exercise the full roommate-matching pipeline.

Usage:
    python manage.py seed_roommate_data
    python manage.py seed_roommate_data --reset   # deletes seeded users first

Groups created
--------------
  [A] 5 students — same gender (M) + Cairo University + Cairo
      → appear in BOTH Discover AND AI Matches for test_student1
      → spread across low→high compatibility scores

  [B] 3 students — male but different university or city
      → appear in Discover ONLY (hard constraint mismatch)

  [C] 4 students — female, Cairo University, Cairo
      → appear in Discover ONLY (gender constraint)
      → lets you test the gender filter in Discover

Also updates test_student1's own RoommateProfile to be fully active
so the AI matching endpoint does not return a 404.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Users, StudentProfile
from roommates.models import RoommateProfile


# ── Seed tag so we can find and remove these users later ──────────────────────
SEED_PREFIX = "seed_rm_"


class Command(BaseCommand):
    help = "Seed varied roommate test data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete previously seeded users before re-creating them",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            deleted, _ = Users.objects.filter(username__startswith=SEED_PREFIX).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} seeded users"))

        with transaction.atomic():
            self._setup_test_student1()
            created = self._seed_students()

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Done. {created} student(s) created/updated.\n"
                f"  Log in as test_student1 / pass: Test1234! to run the full scenario."
            )
        )

    # ─────────────────────────────────────────────────────────────────────────

    def _setup_test_student1(self):
        """
        Ensure test_student1 has a complete, active RoommateProfile.
        This is the 'searcher' account for all AI-match tests.
        Profile: Male · Cairo University · Cairo · normal sleep · high cleanliness
                 · social · non_smoker · sometimes guests · single room · 3 000–5 000 EGP
        """
        try:
            user = Users.objects.get(username="test_student1")
        except Users.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                "test_student1 not found — create the account first via /join"
            ))
            return

        user.first_name = "Omar"
        user.last_name = "Hassan"
        user.gender = "M"
        user.save(update_fields=["first_name", "last_name", "gender"])

        sp, _ = StudentProfile.objects.get_or_create(user=user)
        sp.university = "Cairo University"
        sp.faculty = "Faculty of Engineering"
        sp.year_of_study = "3rd Year"
        sp.bio = "Engineering student looking for a clean, quiet roommate near campus."
        sp.save()

        rp, _ = RoommateProfile.objects.get_or_create(user=user)
        rp.is_active        = True
        rp.bio              = "Engineering student, non-smoker, likes a clean place."
        rp.university       = "Cairo University"
        rp.city             = "Cairo"
        rp.sleeping_time    = "normal"
        rp.cleanliness      = "high"
        rp.personality      = "social"
        rp.smoking          = "non_smoker"
        rp.guests_policy    = "sometimes"
        rp.room_type_preference = "single"
        rp.budget_min       = 3000
        rp.budget_max       = 5000
        rp.save()

        self.stdout.write(f"  ✓ test_student1 profile ready (active, Cairo University, Cairo, M)")

    # ─────────────────────────────────────────────────────────────────────────

    def _seed_students(self):
        students = self._get_student_definitions()
        count = 0
        for s in students:
            user, created = self._get_or_create_user(s)
            self._ensure_student_profile(user, s)
            self._ensure_roommate_profile(user, s)
            action = "created" if created else "updated"
            self.stdout.write(f"  {'✓' if created else '↻'} {user.username} ({action}) — {s['_label']}")
            count += 1 if created else 0
        return count

    def _get_or_create_user(self, s):
        user, created = Users.objects.get_or_create(
            username=s["username"],
            defaults={
                "email": f"{s['username']}@test.hub",
                "role": "student",
                "first_name": s["first_name"],
                "last_name": s["last_name"],
                "gender": s["gender"],
            },
        )
        if not created:
            user.first_name = s["first_name"]
            user.last_name = s["last_name"]
            user.gender = s["gender"]
            user.save(update_fields=["first_name", "last_name", "gender"])
        if not user.has_usable_password():
            user.set_password("Test1234!")
            user.save(update_fields=["password"])
        return user, created

    def _ensure_student_profile(self, user, s):
        sp, _ = StudentProfile.objects.get_or_create(user=user)
        sp.university   = s["university"]
        sp.faculty      = s["faculty"]
        sp.year_of_study = s["year_of_study"]
        sp.bio          = s["bio"]
        sp.save()

    def _ensure_roommate_profile(self, user, s):
        rp, _ = RoommateProfile.objects.get_or_create(user=user)
        rp.is_active            = s["is_active"]
        rp.bio                  = s["bio"]
        rp.university           = s["university"]
        rp.city                 = s["city"]
        rp.sleeping_time        = s["sleeping_time"]
        rp.cleanliness          = s["cleanliness"]
        rp.personality          = s["personality"]
        rp.smoking              = s["smoking"]
        rp.guests_policy        = s["guests_policy"]
        rp.room_type_preference = s["room_type_preference"]
        rp.budget_min           = s["budget_min"]
        rp.budget_max           = s["budget_max"]
        rp.save()

    # ─────────────────────────────────────────────────────────────────────────
    # Data definitions
    # ─────────────────────────────────────────────────────────────────────────

    def _get_student_definitions(self):
        return [

            # ════════════════════════════════════════════════════
            # GROUP A — M · Cairo University · Cairo
            # All pass hard constraints → appear in AI Matches
            # Ordered roughly best → worst compatibility with test_student1
            # (test_student1: normal/high/social/non_smoker/sometimes/single/3000-5000)
            # ════════════════════════════════════════════════════

            {
                "_label": "Group A · ~97% match",
                "username": f"{SEED_PREFIX}ahmed_sayed",
                "first_name": "Ahmed", "last_name": "Sayed",
                "gender": "M",
                "university": "Cairo University",
                "faculty": "Faculty of Engineering",
                "year_of_study": "4th Year",
                "city": "Cairo",
                "bio": "Final-year engineering student, love studying with good music, non-smoker.",
                "is_active": True,
                "sleeping_time":        "normal",   # same
                "cleanliness":          "high",     # same
                "personality":          "social",   # same
                "smoking":              "non_smoker", # same
                "guests_policy":        "sometimes",  # same
                "room_type_preference": "single",   # same
                "budget_min": 3500, "budget_max": 5000,  # near-identical range
            },

            {
                "_label": "Group A · ~85% match",
                "username": f"{SEED_PREFIX}mohamed_farouk",
                "first_name": "Mohamed", "last_name": "Farouk",
                "gender": "M",
                "university": "Cairo University",
                "faculty": "Faculty of Computer Science",
                "year_of_study": "2nd Year",
                "city": "Cairo",
                "bio": "CS sophomore, night owl but keeps things tidy, flexible on guests.",
                "is_active": True,
                "sleeping_time":        "late",     # slightly different
                "cleanliness":          "high",     # same
                "personality":          "social",   # same
                "smoking":              "non_smoker", # same
                "guests_policy":        "often",    # different
                "room_type_preference": "single",   # same
                "budget_min": 2500, "budget_max": 4500,  # small budget shift
            },

            {
                "_label": "Group A · ~68% match",
                "username": f"{SEED_PREFIX}khaled_mostafa",
                "first_name": "Khaled", "last_name": "Mostafa",
                "gender": "M",
                "university": "Cairo University",
                "faculty": "Faculty of Medicine",
                "year_of_study": "1st Year",
                "city": "Cairo",
                "bio": "Med student, need quiet nights, strict about cleanliness. Medium social.",
                "is_active": True,
                "sleeping_time":        "early",    # different
                "cleanliness":          "medium",   # different
                "personality":          "moderate", # different
                "smoking":              "non_smoker", # same
                "guests_policy":        "sometimes",  # same
                "room_type_preference": "both",     # flexible — partial match
                "budget_min": 3000, "budget_max": 5000,  # same
            },

            {
                "_label": "Group A · ~45% match",
                "username": f"{SEED_PREFIX}tarek_nabil",
                "first_name": "Tarek", "last_name": "Nabil",
                "gender": "M",
                "university": "Cairo University",
                "faculty": "Faculty of Law",
                "year_of_study": "3rd Year",
                "city": "Cairo",
                "bio": "Law student, smoker, early riser, prefers shared rooms to split cost.",
                "is_active": True,
                "sleeping_time":        "early",    # different
                "cleanliness":          "medium",   # different
                "personality":          "quiet",    # different
                "smoking":              "smoker",   # different
                "guests_policy":        "never",    # different
                "room_type_preference": "shared",   # different
                "budget_min": 1500, "budget_max": 3000,  # lower range, small overlap
            },

            {
                "_label": "Group A · ~22% match (worst)",
                "username": f"{SEED_PREFIX}amir_samir",
                "first_name": "Amir", "last_name": "Samir",
                "gender": "M",
                "university": "Cairo University",
                "faculty": "Faculty of Arts",
                "year_of_study": "4th Year",
                "city": "Cairo",
                "bio": "Arts student, heavy smoker, late-night parties, very social, needs shared room.",
                "is_active": True,
                "sleeping_time":        "late",     # different encoding but near
                "cleanliness":          "low",      # very different
                "personality":          "social",   # same (but all else differs)
                "smoking":              "smoker",   # different
                "guests_policy":        "often",    # different
                "room_type_preference": "shared",   # different
                "budget_min": 800, "budget_max": 1500,  # very different — no overlap
            },

            # ════════════════════════════════════════════════════
            # GROUP B — Male but different university or city
            # Pass gender constraint but FAIL university/city →
            # appear in Discover ONLY (not in AI Matches)
            # ════════════════════════════════════════════════════

            {
                "_label": "Group B · Ain Shams · Cairo (diff university)",
                "username": f"{SEED_PREFIX}hassan_fathy",
                "first_name": "Hassan", "last_name": "Fathy",
                "gender": "M",
                "university": "Ain Shams University",
                "faculty": "Faculty of Engineering",
                "year_of_study": "2nd Year",
                "city": "Cairo",
                "bio": "Ain Shams engineering student, neat, non-smoker.",
                "is_active": True,
                "sleeping_time":        "normal",
                "cleanliness":          "high",
                "personality":          "social",
                "smoking":              "non_smoker",
                "guests_policy":        "sometimes",
                "room_type_preference": "single",
                "budget_min": 3000, "budget_max": 5000,
            },

            {
                "_label": "Group B · Cairo University · Alexandria (diff city)",
                "username": f"{SEED_PREFIX}mostafa_ramadan",
                "first_name": "Mostafa", "last_name": "Ramadan",
                "gender": "M",
                "university": "Cairo University",
                "faculty": "Faculty of Commerce",
                "year_of_study": "3rd Year",
                "city": "Alexandria",
                "bio": "Commerce student based in Alex. Non-smoker, moderate personality.",
                "is_active": True,
                "sleeping_time":        "normal",
                "cleanliness":          "medium",
                "personality":          "moderate",
                "smoking":              "non_smoker",
                "guests_policy":        "never",
                "room_type_preference": "both",
                "budget_min": 2000, "budget_max": 4000,
            },

            {
                "_label": "Group B · Alexandria University · Alexandria (both diff)",
                "username": f"{SEED_PREFIX}amr_khalil",
                "first_name": "Amr", "last_name": "Khalil",
                "gender": "M",
                "university": "Alexandria University",
                "faculty": "Faculty of Science",
                "year_of_study": "1st Year",
                "city": "Alexandria",
                "bio": "Science freshman in Alex. Prefers quiet shared accommodation.",
                "is_active": True,
                "sleeping_time":        "early",
                "cleanliness":          "high",
                "personality":          "quiet",
                "smoking":              "non_smoker",
                "guests_policy":        "never",
                "room_type_preference": "shared",
                "budget_min": 1500, "budget_max": 2500,
            },

            # ════════════════════════════════════════════════════
            # GROUP C — Female · Cairo University · Cairo
            # Pass university + city but FAIL gender →
            # appear in Discover ONLY (not in AI Matches for test_student1 M)
            # Diverse lifestyle to test Discover card variety
            # ════════════════════════════════════════════════════

            {
                "_label": "Group C · F · near-perfect lifestyle",
                "username": f"{SEED_PREFIX}sara_ahmed",
                "first_name": "Sara", "last_name": "Ahmed",
                "gender": "F",
                "university": "Cairo University",
                "faculty": "Faculty of Pharmacy",
                "year_of_study": "5th Year",
                "city": "Cairo",
                "bio": "Pharmacy student, very tidy, early sleeper, no smoking please.",
                "is_active": True,
                "sleeping_time":        "early",
                "cleanliness":          "high",
                "personality":          "quiet",
                "smoking":              "non_smoker",
                "guests_policy":        "never",
                "room_type_preference": "single",
                "budget_min": 4000, "budget_max": 6000,
            },

            {
                "_label": "Group C · F · social & flexible budget",
                "username": f"{SEED_PREFIX}layla_hassan",
                "first_name": "Layla", "last_name": "Hassan",
                "gender": "F",
                "university": "Cairo University",
                "faculty": "Faculty of Mass Communication",
                "year_of_study": "2nd Year",
                "city": "Cairo",
                "bio": "Media student, very social, loves having friends over, shared room is fine.",
                "is_active": True,
                "sleeping_time":        "late",
                "cleanliness":          "medium",
                "personality":          "social",
                "smoking":              "non_smoker",
                "guests_policy":        "often",
                "room_type_preference": "shared",
                "budget_min": 2000, "budget_max": 3500,
            },

            {
                "_label": "Group C · F · smoker, low budget",
                "username": f"{SEED_PREFIX}nour_ibrahim",
                "first_name": "Nour", "last_name": "Ibrahim",
                "gender": "F",
                "university": "Cairo University",
                "faculty": "Faculty of Fine Arts",
                "year_of_study": "3rd Year",
                "city": "Cairo",
                "bio": "Fine arts, smoker, flexible sleeper, very artistic and social.",
                "is_active": True,
                "sleeping_time":        "late",
                "cleanliness":          "low",
                "personality":          "social",
                "smoking":              "smoker",
                "guests_policy":        "often",
                "room_type_preference": "both",
                "budget_min": 1000, "budget_max": 2000,
            },

            {
                "_label": "Group C · F · Ain Shams · Alexandria (all diff)",
                "username": f"{SEED_PREFIX}sara_mahmoud",
                "first_name": "Sara", "last_name": "Mahmoud",
                "gender": "F",
                "university": "Ain Shams University",
                "faculty": "Faculty of Education",
                "year_of_study": "4th Year",
                "city": "Alexandria",
                "bio": "Education student in Alex, early sleeper, very clean, no guests policy.",
                "is_active": True,
                "sleeping_time":        "early",
                "cleanliness":          "high",
                "personality":          "moderate",
                "smoking":              "non_smoker",
                "guests_policy":        "never",
                "room_type_preference": "single",
                "budget_min": 2500, "budget_max": 4000,
            },
        ]
