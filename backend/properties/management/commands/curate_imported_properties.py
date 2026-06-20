import hashlib
from datetime import date
from decimal import Decimal
from pathlib import Path

from django.core.files import File
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q

from accounts.models import Users
from properties.models import Property, PropertyImage, Transport


IMPORT_USERNAME = "imported_ismailia_listings"
CURATED_PREFIX = "curated_landlord_"
PHOTO_SOURCE = Path(__file__).resolve().parents[2] / "data" / "curated_photos"

LANDLORDS = [
    ("ahmed_elsayed", "Ahmed", "El-Sayed"),
    ("mohamed_hassan", "Mohamed", "Hassan"),
    ("mahmoud_ibrahim", "Mahmoud", "Ibrahim"),
    ("omar_khalil", "Omar", "Khalil"),
    ("youssef_mostafa", "Youssef", "Mostafa"),
    ("karim_nassar", "Karim", "Nassar"),
    ("tarek_farouk", "Tarek", "Farouk"),
    ("hany_mansour", "Hany", "Mansour"),
    ("sarah_abdelrahman", "Sarah", "Abdelrahman"),
    ("mariam_adel", "Mariam", "Adel"),
    ("nourhan_samir", "Nourhan", "Samir"),
    ("dina_fathy", "Dina", "Fathy"),
]

APARTMENT_PHOTOS = [
    "apartment-living.jpg",
    "apartment-open-plan.jpg",
    "apartment-kitchen.jpg",
    "apartment-bathroom.jpg",
    "apartment-balcony.jpg",
    "apartment-exterior.jpg",
]

ROOM_PHOTOS = [
    "room-bedroom.jpg",
    "room-bright.jpg",
    "room-common-area.jpg",
    "room-furnished.jpg",
    "room-modern.jpg",
    "room-studio.jpg",
]


class Command(BaseCommand):
    help = "Keep 100 varied imported properties and enrich them for the demo catalog."

    @transaction.atomic
    def handle(self, *args, **options):
        candidates = list(
            Property.objects.filter(
                Q(landlord__username=IMPORT_USERNAME)
                | Q(landlord__username__startswith=CURATED_PREFIX)
            ).select_related("landlord")
        )
        if len(candidates) < 100:
            raise CommandError(
                f"Need at least 100 imported properties; found {len(candidates)}. "
                "Run import_properties_from_csv first."
            )

        selected = self._select_varied(candidates)
        selected_ids = {prop.pk for prop in selected}
        landlords = self._ensure_landlords()
        transports = {item.name: item for item in Transport.objects.all()}
        stored_photos = self._ensure_photo_files()

        for index, prop in enumerate(selected):
            prop.landlord = landlords[index % len(landlords)]
            self._fill_missing_fields(prop, index)

        Property.objects.bulk_update(
            selected,
            [
                "landlord", "floor", "area_sqm", "latitude", "longitude",
                "available_from", "max_stay_months", "is_featured",
                "description",
            ],
            batch_size=250,
        )

        removed, _ = Property.objects.filter(
            Q(landlord__username=IMPORT_USERNAME)
            | Q(landlord__username__startswith=CURATED_PREFIX)
        ).exclude(pk__in=selected_ids).delete()

        self._set_transports(selected, transports)
        photo_count = self._set_photos(selected, stored_photos)

        Users.objects.filter(username=IMPORT_USERNAME).delete()

        apartment_count = sum(prop.unit_type == "apartment" for prop in selected)
        room_count = len(selected) - apartment_count
        self.stdout.write(
            self.style.SUCCESS(
                f"Curated {len(selected)} properties: {apartment_count} apartments/studios, "
                f"{room_count} rooms, {len(landlords)} landlords, {photo_count} photo records. "
                f"Removed {removed} non-selected imported database rows."
            )
        )

    def _select_varied(self, candidates):
        if len(candidates) == 100:
            return sorted(candidates, key=lambda prop: prop.pk)

        apartments = [prop for prop in candidates if prop.unit_type == "apartment"]
        rooms = [prop for prop in candidates if prop.unit_type == "room"]
        return self._round_robin_sample(apartments, 70) + self._round_robin_sample(rooms, 30)

    def _round_robin_sample(self, properties, target):
        groups = {}
        for prop in properties:
            key = (prop.district or "Unknown", prop.min_stay_months)
            groups.setdefault(key, []).append(prop)

        for key, items in groups.items():
            items.sort(key=lambda prop: self._stable_rank(prop, key))

        chosen = []
        ordered_keys = sorted(groups)
        while len(chosen) < target:
            progressed = False
            for key in ordered_keys:
                if groups[key] and len(chosen) < target:
                    chosen.append(groups[key].pop(0))
                    progressed = True
            if not progressed:
                break
        if len(chosen) != target:
            raise CommandError(f"Could select only {len(chosen)} of {target} requested rows.")
        return chosen

    def _stable_rank(self, prop, group_key):
        price = prop.price or prop.room_price or prop.bed_price or Decimal("0")
        digest = hashlib.sha256(
            f"{group_key}|{prop.title}|{prop.address}|{price}|{prop.num_beds}".encode()
        ).hexdigest()
        return digest

    def _ensure_landlords(self):
        usernames = [f"{CURATED_PREFIX}{slug}" for slug, _, _ in LANDLORDS]
        existing = {
            user.username: user
            for user in Users.objects.filter(username__in=usernames)
        }
        missing = []
        for slug, first_name, last_name in LANDLORDS:
            username = f"{CURATED_PREFIX}{slug}"
            if username in existing:
                continue
            user = Users(
                username=username,
                email=f"{username}@studenthub.local",
                first_name=first_name,
                last_name=last_name,
                role="landlord",
                city="Ismailia",
            )
            user.set_unusable_password()
            missing.append(user)
        if missing:
            Users.objects.bulk_create(missing)
        return list(Users.objects.filter(username__in=usernames).order_by("username"))

    def _fill_missing_fields(self, prop, index):
        seed = int(hashlib.sha256(f"{prop.pk}|{prop.address}".encode()).hexdigest()[:12], 16)
        prop.floor = 1 + seed % 8
        if prop.unit_type == "apartment":
            prop.area_sqm = 55 + prop.num_rooms * 18 + seed % 24
        else:
            prop.area_sqm = 12 + prop.num_beds * 5 + seed % 9

        # Approximate demo pins within Ismailia, not claimed as surveyed coordinates.
        prop.latitude = Decimal("30.596500") + Decimal((seed % 7001) - 3500) / Decimal("100000")
        prop.longitude = Decimal("32.271500") + Decimal(((seed // 7001) % 7001) - 3500) / Decimal("100000")
        prop.available_from = date.today()
        prop.max_stay_months = max(prop.min_stay_months, 12)
        prop.is_featured = index < 12

        note = (
            "Map location is an approximate demo pin for the listed district. "
            "Photos are representative interiors and are not original photos of this address."
        )
        description = (prop.description or "").strip()
        if note not in description:
            prop.description = f"{description}\n\n{note}".strip()

    def _set_transports(self, properties, transports):
        through = Property.transport_types.through
        through.objects.filter(property_id__in=[prop.pk for prop in properties]).delete()
        links = []
        for prop in properties:
            names = ["walk", "bus"]
            if prop.district and prop.district.lower() not in {"the stadium", "old university"}:
                names.append("tuk-tuk")
            for name in names:
                if name in transports:
                    links.append(
                        through(property_id=prop.pk, transport_id=transports[name].pk)
                    )
        through.objects.bulk_create(links, batch_size=500)

    def _ensure_photo_files(self):
        names = APARTMENT_PHOTOS + ROOM_PHOTOS
        missing_sources = [name for name in names if not (PHOTO_SOURCE / name).is_file()]
        if missing_sources:
            raise CommandError(f"Missing bundled photos: {', '.join(missing_sources)}")

        stored = {}
        for name in names:
            storage_name = f"property_images/curated/{name}"
            if not default_storage.exists(storage_name):
                with (PHOTO_SOURCE / name).open("rb") as source:
                    default_storage.save(storage_name, File(source, name=name))
            stored[name] = storage_name
        return stored

    def _set_photos(self, properties, stored_photos):
        PropertyImage.objects.filter(property_id__in=[prop.pk for prop in properties]).delete()
        records = []
        for prop in properties:
            names = (
                ROOM_PHOTOS
                if prop.unit_type == "room" or prop.title.lower().startswith("studio")
                else APARTMENT_PHOTOS
            )
            records.extend(
                PropertyImage(
                    property=prop,
                    image=stored_photos[name],
                    is_cover=(position == 0),
                )
                for position, name in enumerate(names)
            )
        PropertyImage.objects.bulk_create(records, batch_size=500)
        return len(records)
