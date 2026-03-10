import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Users
from properties.models import Property


class Command(BaseCommand):
    help = "Seed landlord users and property listings for local development."

    USER_PREFIX = "seed_landlord_"

    SIZE_PRESETS = {
        "small": {"landlords": 3, "properties": 20},
        "medium": {"landlords": 10, "properties": 120},
        "large": {"landlords": 30, "properties": 500},
    }

    CITIES = [
        "Cairo",
        "Giza",
        "Alexandria",
        "New Cairo",
        "Ismailia",
        "Mansoura",
        "Sohag",
    ]

    DISTRICTS = {
        "Cairo": ["Nasr City", "Heliopolis", "Maadi", "Zamalek", "Abbassia"],
        "Giza": ["Dokki", "Mohandessin", "6th October", "Haram", "Agouza"],
        "Alexandria": ["Smouha", "Sidi Gaber", "Ibrahimia", "Camp Caesar", "Shatby"],
        "New Cairo": ["5th Settlement", "Rehab", "Madinaty", "South Academy"],
        "Ismailia": ["El Sheikh Zayed", "Ring Road", "El Salam", "El Balad"],
        "Mansoura": ["Toriel", "El Gomhoria", "Gezirat El Ward", "University Area"],
        "Sohag": ["Al Kawthar", "Al Zahraa", "Downtown", "El Maragha"],
    }

    UNIVERSITIES = [
        "Cairo University",
        "Ain Shams University",
        "Alexandria University",
        "Al-Azhar University",
        "Helwan University",
        "Mansoura University",
        "Assiut University",
        "Suez Canal University",
        "Sohag University",
        "American University in Cairo (AUC)",
    ]

    AMENITIES = [
        "WiFi",
        "AC",
        "Kitchen",
        "Furnished",
        "Elevator",
        "Study Room",
        "Parking",
        "Supermarket",
        "Water",
        "Electricity",
        "Gas",
        "Security",
    ]

    PROPERTY_TITLES = [
        "Cozy Student Room",
        "Modern Studio Near Campus",
        "Shared Flat for Students",
        "Furnished Apartment",
        "Budget Room in Prime Location",
        "Private Room in Quiet Area",
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "--size",
            choices=["small", "medium", "large"],
            default="medium",
            help="Dataset size preset. Default: medium.",
        )
        parser.add_argument(
            "--landlords",
            type=int,
            default=None,
            help="Override number of landlords.",
        )
        parser.add_argument(
            "--properties",
            type=int,
            default=None,
            help="Override total number of properties.",
        )
        parser.add_argument(
            "--password",
            default="Pass1234!",
            help="Password for all generated landlord accounts.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
            help="Random seed for deterministic output. Default: 42.",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete previously generated seed landlords and their properties first.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(options["seed"])

        preset = self.SIZE_PRESETS[options["size"]]
        landlord_count = options["landlords"] if options["landlords"] is not None else preset["landlords"]
        property_count = options["properties"] if options["properties"] is not None else preset["properties"]
        password = options["password"]

        if landlord_count <= 0:
            self.stderr.write(self.style.ERROR("--landlords must be greater than 0."))
            return
        if property_count <= 0:
            self.stderr.write(self.style.ERROR("--properties must be greater than 0."))
            return

        if options["reset"]:
            deleted_users = Users.objects.filter(username__startswith=self.USER_PREFIX).count()
            Users.objects.filter(username__startswith=self.USER_PREFIX).delete()
            self.stdout.write(self.style.WARNING(f"Reset complete: deleted {deleted_users} seed landlords."))

        landlords = self._ensure_landlords(landlord_count, password)
        created_properties = self._create_properties(landlords, property_count)

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
        self.stdout.write(f"Landlords available: {len(landlords)}")
        self.stdout.write(f"Properties created: {created_properties}")

    def _ensure_landlords(self, count, password):
        landlords = []
        for index in range(1, count + 1):
            username = f"{self.USER_PREFIX}{index:03d}"
            defaults = {
                "email": f"{username}@studenthub.local",
                "role": "landlord",
                "first_name": f"Landlord{index}",
                "last_name": "Seed",
                "city": random.choice(self.CITIES),
                "is_verified": random.random() < 0.5,
                "is_top_rated": random.random() < 0.2,
                "is_quick_responder": random.random() < 0.35,
            }
            user, created = Users.objects.get_or_create(username=username, defaults=defaults)
            if created:
                user.set_password(password)
                user.save(update_fields=["password"])
            elif user.role != "landlord":
                user.role = "landlord"
                user.save(update_fields=["role"])
            landlords.append(user)
        return landlords

    def _create_properties(self, landlords, count):
        created = 0
        for idx in range(1, count + 1):
            landlord = random.choice(landlords)
            city = random.choice(self.CITIES)
            district = random.choice(self.DISTRICTS[city])
            property_type = random.choice(["apartment", "studio", "room", "shared"])
            num_rooms = random.randint(1, 5)
            num_beds = random.randint(1, max(2, num_rooms * 2))
            min_stay = random.randint(1, 6)
            max_stay = random.choice([None, random.randint(min_stay, 18)])
            status = random.choices(
                population=["available", "rented", "unavailable"],
                weights=[0.75, 0.15, 0.10],
                k=1,
            )[0]

            Property.objects.create(
                landlord=landlord,
                title=f"{random.choice(self.PROPERTY_TITLES)} #{idx}",
                description=f"Seed listing #{idx} in {district}, {city}.",
                property_type=property_type,
                price=Decimal(str(random.randint(1200, 9000))),
                city=city,
                district=district,
                address=f"{random.randint(1, 250)} {district} St.",
                latitude=Decimal(str(round(random.uniform(29.8, 31.6), 6))),
                longitude=Decimal(str(round(random.uniform(30.7, 32.1), 6))),
                nearby_university=random.choice(self.UNIVERSITIES),
                distance_to_university=f"{random.randint(3, 40)} mins",
                transport_type=random.choice(["walk", "metro", "transport"]),
                num_rooms=num_rooms,
                num_beds=num_beds,
                num_bathrooms=random.randint(1, 3),
                num_roommates=random.randint(0, 4),
                floor=random.choice([None, random.randint(0, 12)]),
                area_sqm=random.choice([None, random.randint(35, 220)]),
                gender_preference=random.choice(["male", "female"]),
                amenities=random.sample(self.AMENITIES, k=random.randint(3, 8)),
                min_stay_months=min_stay,
                max_stay_months=max_stay,
                status=status,
                is_featured=random.random() < 0.18,
                view_count=random.randint(0, 250),
            )
            created += 1
        return created

