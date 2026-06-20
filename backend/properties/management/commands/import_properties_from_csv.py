import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import Users
from properties.models import City, Property, University


PLACEHOLDER_USERNAME = "imported_ismailia_listings"
DEFAULT_CSV = Path(__file__).resolve().parents[2] / "data" / "properties_cleaned.csv"


class Command(BaseCommand):
    help = "Import the cleaned Ismailia property dataset."

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv",
            default=str(DEFAULT_CSV),
            help=f"Cleaned CSV path (default: {DEFAULT_CSV})",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate every row and roll back all database changes.",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Replace properties from a previous import (other properties are untouched).",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv"])
        if not csv_path.is_file():
            raise CommandError(f"CSV not found: {csv_path}")

        try:
            with csv_path.open(newline="", encoding="utf-8-sig") as csv_file:
                rows = list(csv.DictReader(csv_file))
        except (OSError, csv.Error) as exc:
            raise CommandError(f"Could not read {csv_path}: {exc}") from exc

        if not rows:
            raise CommandError("The CSV contains no property rows.")

        required_columns = {
            "title", "description", "unit_type", "rental_mode", "price",
            "room_price", "bed_price", "city", "district", "address",
            "distance_to_university", "nearby_universities", "num_rooms",
            "num_beds", "num_bathrooms", "gender_preference", "has_internet",
            "has_water", "has_electricity", "has_gas", "has_ac",
            "min_stay_months", "max_stay_months", "status",
        }
        missing = sorted(required_columns - set(rows[0]))
        if missing:
            raise CommandError(f"CSV is missing columns: {', '.join(missing)}")

        dry_run = options["dry_run"]
        with transaction.atomic():
            landlord = self._get_or_create_landlord()
            previous = Property.objects.filter(landlord=landlord)

            if previous.exists() and not options["reset"] and not dry_run:
                raise CommandError(
                    "Imported properties already exist. Re-run with --reset to replace them safely."
                )
            if options["reset"]:
                deleted = previous.count()
                previous.delete()
                self.stdout.write(self.style.WARNING(f"Reset {deleted} previously imported properties."))

            cities = {city.name: city for city in City.objects.all()}
            universities = {university.name: university for university in University.objects.all()}
            properties = []
            university_pairs = []
            errors = []

            for row_number, row in enumerate(rows, start=2):
                try:
                    prop, university = self._build_property(
                        row, landlord, cities, universities
                    )
                    prop.full_clean(
                        exclude=["nearby_universities", "transport_types"]
                    )
                    properties.append(prop)
                    university_pairs.append(university)
                except Exception as exc:  # Report bad rows together instead of stopping at the first.
                    errors.append(
                        f"row {row_number} ({row.get('title', '?')!r}): {exc}"
                    )

            if errors:
                transaction.set_rollback(True)
                preview = "\n".join(f"  {error}" for error in errors[:30])
                remainder = (
                    f"\n  ... and {len(errors) - 30} more" if len(errors) > 30 else ""
                )
                raise CommandError(
                    f"Import aborted: {len(errors)} of {len(rows)} rows failed validation.\n"
                    f"{preview}{remainder}"
                )

            # Bulk insertion intentionally skips Property pre_save signals. In
            # particular, imported rows must not make 6,486 Google geocoding calls.
            Property.objects.bulk_create(properties, batch_size=500)
            through_model = Property.nearby_universities.through
            through_model.objects.bulk_create(
                [
                    through_model(
                        property_id=prop.pk,
                        university_id=university.pk,
                    )
                    for prop, university in zip(properties, university_pairs)
                ],
                batch_size=500,
            )

            if dry_run:
                transaction.set_rollback(True)

        prefix = "[DRY RUN] " if dry_run else ""
        suffix = "; no changes saved" if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefix}Validated {len(properties)} properties{suffix}."
            )
        )

    def _get_or_create_landlord(self):
        landlord = Users.objects.filter(username=PLACEHOLDER_USERNAME).first()
        if landlord is None:
            # This is a non-human system owner. bulk_create intentionally avoids
            # signup signals such as welcome notifications and Redis broadcasts.
            landlord = Users(
                username=PLACEHOLDER_USERNAME,
                email=f"{PLACEHOLDER_USERNAME}@studenthub.local",
                role="landlord",
                first_name="Imported",
                last_name="Listings",
            )
            landlord.set_unusable_password()
            Users.objects.bulk_create([landlord])
        if landlord.role != "landlord":
            raise CommandError(
                f"Existing user {PLACEHOLDER_USERNAME!r} is not a landlord."
            )
        return landlord

    def _build_property(self, row, landlord, cities, universities):
        city_name = row["city"].strip()
        university_name = row["nearby_universities"].strip()
        if city_name not in cities:
            raise ValueError(f"unknown city {city_name!r}; run migrations first")
        if university_name not in universities:
            raise ValueError(
                f"unknown university {university_name!r}; run migrations first"
            )

        def optional_int(value):
            value = value.strip()
            return int(value) if value else None

        def boolean(value):
            normalized = value.strip().lower()
            if normalized not in {"true", "false", "1", "0", "yes", "no"}:
                raise ValueError(f"invalid boolean value {value!r}")
            return normalized in {"true", "1", "yes"}

        prop = Property(
            landlord=landlord,
            title=row["title"].strip(),
            description=row["description"].strip(),
            unit_type=row["unit_type"].strip(),
            rental_mode=row["rental_mode"].strip() or None,
            price=optional_int(row["price"]),
            room_price=optional_int(row["room_price"]),
            bed_price=optional_int(row["bed_price"]),
            city=cities[city_name],
            district=row["district"].strip() or None,
            address=row["address"].strip() or None,
            distance_to_university=row["distance_to_university"].strip() or None,
            num_rooms=int(row["num_rooms"]),
            num_beds=int(row["num_beds"]),
            num_bathrooms=int(row["num_bathrooms"]),
            gender_preference=row["gender_preference"].strip(),
            has_internet=boolean(row["has_internet"]),
            has_water=boolean(row["has_water"]),
            has_electricity=boolean(row["has_electricity"]),
            has_gas=boolean(row["has_gas"]),
            has_ac=boolean(row["has_ac"]),
            min_stay_months=int(row["min_stay_months"]),
            max_stay_months=optional_int(row["max_stay_months"]),
            status=row["status"].strip(),
        )
        return prop, universities[university_name]
