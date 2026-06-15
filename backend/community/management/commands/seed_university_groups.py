"""
Management command: seed one university group per institution.

Usage:
    python manage.py seed_university_groups
    python manage.py seed_university_groups --reset   # wipe all university groups first
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from community.models import Group, GroupMembership

UNIVERSITIES = [
    ("Cairo University",     "The official community for Cairo University students. Share news, ask for help, and connect with campus life."),
    ("Ain Shams University", "The official community for Ain Shams University students. Connect, collaborate, and grow together."),
    ("Helwan University",    "The official community for Helwan University students. Stay informed and engaged with campus updates."),
    ("Mansoura University",  "The official community for Mansoura University students. Connect with peers across all faculties."),
    ("Suez University",      "The official community for Suez University students. Share knowledge and campus experiences."),
    ("Sohag University",     "The official community for Sohag University students. Build connections across departments."),
    ("Galala University",    "The official community for Galala University students. New campus, strong community."),
    ("EELU",                 "The official community for EELU (Egyptian E-Learning University) students."),
    ("Alexandria University","The official community for Alexandria University students. Connect from any faculty, anywhere."),
]


class Command(BaseCommand):
    help = "Seed one public university group for each institution in the Student Hub network."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing university-category groups before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            deleted, _ = Group.objects.filter(category="university").delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} university group(s)."))

        created_count = 0
        skipped_count = 0

        for name, description in UNIVERSITIES:
            group, created = Group.objects.get_or_create(
                name=name,
                defaults={
                    "description": description,
                    "category": "university",
                    "is_private": False,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  Created: {name}"))
            else:
                skipped_count += 1
                self.stdout.write(f"  Exists:  {name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone — {created_count} created, {skipped_count} already existed."
            )
        )
