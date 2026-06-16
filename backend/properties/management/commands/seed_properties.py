"""
Management command: seed_properties
=====================================
Creates varied landlord accounts, property listings, and real cover images.

Images are downloaded from Unsplash (free, no auth) and stored as
PropertyImage records so cover_image appears correctly in the FindRoom page.

Usage:
    python manage.py seed_properties                     # medium preset (10 landlords, 40 props)
    python manage.py seed_properties --size small        # 3 landlords, 15 props
    python manage.py seed_properties --size large        # 20 landlords, 120 props
    python manage.py seed_properties --reset             # wipe seeded data then re-seed
    python manage.py seed_properties --skip-images       # skip downloading images (fast, no net)
"""

import io
import random
import urllib.request
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Users, StudentProfile
from properties.models import Property, PropertyImage


# ── Unsplash photo IDs for apartment / room photos (free, no auth needed) ────
# Format: https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=800&q=75
PHOTO_IDS = [
    "1522708323590-d24dbb6b0267",  # bright apartment living room
    "1502672260266-1c1ef2d93688",  # minimalist bedroom
    "1493809842364-78817add7ffb",  # cozy studio
    "1501183638710-841dd1904471",  # modern kitchen/living
    "1554995207-c18c203602cb",     # white bedroom
    "1522771753035-4850d32f7041",  # room with desk
    "1595526114035-0d45ed16cfbf",  # cozy dorm-style room
    "1512917774080-9991f1c4c750",  # luxury apartment exterior
    "1560448204-e02f11c3d0e2",     # furnished room
    "1484154218962-a197022b5858",  # kitchen
    "1556909211-36987daf7b4d",     # bathroom
    "1558618666-fcd25c85cd64",     # balcony view
    "1585412727339-54e4bae3bbf9",  # bright studio
    "1556742049-0cfed4f6a45d",     # shared apartment
    "1600585154340-be6161a56a0c",  # modern apartment
    "1600596542815-ffad4c1539a9",  # elegant room
]


class Command(BaseCommand):
    help = "Seed landlord accounts, property listings, and real cover images."

    USER_PREFIX = "seed_landlord_"

    SIZE_PRESETS = {
        "small":  {"landlords": 3,  "properties": 15},
        "medium": {"landlords": 10, "properties": 40},
        "large":  {"landlords": 20, "properties": 120},
    }

    # ── Cities with districts ─────────────────────────────────────────────────
    CITIES = ["Cairo", "Giza", "Alexandria", "New Cairo", "Mansoura", "Ismailia"]

    DISTRICTS = {
        "Cairo":       ["Nasr City", "Heliopolis", "Maadi", "Zamalek", "Abbassia", "Downtown"],
        "Giza":        ["Dokki", "Mohandessin", "6th October", "Haram", "Agouza"],
        "Alexandria":  ["Smouha", "Sidi Gaber", "Ibrahimia", "Camp Caesar", "Shatby"],
        "New Cairo":   ["5th Settlement", "Rehab", "Madinaty", "South Academy"],
        "Mansoura":    ["University Area", "El Gomhoria", "Gezirat El Ward", "Toriel"],
        "Ismailia":    ["El Sheikh Zayed", "El Balad", "El Salam", "Ring Road"],
    }

    # ── Universities mapped to their natural city ─────────────────────────────
    UNIVERSITIES = {
        "Cairo":      ["Cairo University", "Ain Shams University", "Al-Azhar University",
                       "Helwan University", "Misr International University"],
        "Giza":       ["October 6 University", "MUST University", "MSA University",
                       "The Egyptian E-learning University (EELU)"],
        "Alexandria": ["Alexandria University", "Arab Academy for Science & Technology",
                       "Pharos University"],
        "New Cairo":  ["American University in Cairo (AUC)", "German University in Cairo (GUC)",
                       "The British University in Egypt (BUE)", "Future University in Egypt"],
        "Mansoura":   ["Mansoura University", "New Mansoura University"],
        "Ismailia":   ["Suez Canal University"],
    }

    # ── Rich property templates per type ─────────────────────────────────────
    TEMPLATES = {
        "studio": [
            ("Bright Studio Near Campus",
             "Fully furnished studio with natural light, AC, and high-speed WiFi. "
             "5-minute walk to the metro station. Perfect for a focused student lifestyle."),
            ("Modern Studio with City View",
             "Top-floor studio with a panoramic city view. Open-plan layout with a "
             "kitchenette, queen bed, and work desk. All bills included."),
            ("Compact Studio — Bills Included",
             "Ideal for students who want their own space without hassle. Everything "
             "you need in one clean, secure studio. Building has 24/7 security."),
        ],
        "apartment": [
            ("Spacious 2-Bed Apartment in Quiet Area",
             "Two bedrooms, large living room, fully equipped kitchen. "
             "10 minutes to campus by public transport. Great for two students sharing."),
            ("Furnished Apartment — Walking Distance to University",
             "Elegant furnished apartment on a calm street. Study room, fast internet, "
             "and a building gym. Available immediately."),
            ("3-Bedroom Apartment for Student Group",
             "Ideal for a group of 3 students. Split the rent and share a huge "
             "living space. Near cafés, pharmacies, and supermarkets."),
            ("Renovated Apartment with Balcony",
             "Freshly renovated flat with a private balcony overlooking a garden. "
             "Modern kitchen, two bathrooms, and ample storage."),
        ],
        "room": [
            ("Private Room in Friendly Flat",
             "Your own lockable room in a shared 3-bed flat. Common kitchen and "
             "living room. Flatmates are all students — quiet and clean."),
            ("Large Private Room — All Bills Paid",
             "Spacious room with a double bed, wardrobe, and desk. Shared bathroom "
             "with one other tenant. Very peaceful neighbourhood."),
            ("Private Room Near Metro",
             "Well-lit room 3 minutes from the metro. Great connectivity to campus "
             "and the city. Cleaning service included twice a week."),
        ],
        "shared": [
            ("Shared Room in Student Flat — Low Cost",
             "Budget-friendly option in a well-managed student flat. "
             "Two beds per room. Common study area, kitchen, and fast internet."),
            ("Female-Only Shared Room — Safe Building",
             "Secure building with 24/7 security and CCTV. Shared room for two. "
             "Fully furnished. Close to shops and restaurants."),
            ("Co-Living Space — Vibrant Community",
             "Join a community of students in this managed co-living flat. "
             "Regular social events, cleaning included, and a rooftop terrace."),
        ],
    }

    FACILITY_OPTIONS = ["WiFi", "AC", "Kitchen", "Furnished", "Elevator", "Washing Machine"]

    # Realistic facility bundles per property type (subset of FACILITY_OPTIONS)
    AMENITY_BUNDLES = {
        "studio":    ["WiFi", "AC", "Furnished", "Kitchen"],
        "apartment": ["WiFi", "AC", "Kitchen", "Furnished", "Elevator", "Washing Machine"],
        "room":      ["WiFi", "AC", "Furnished"],
        "shared":    ["WiFi", "Kitchen", "Furnished", "Washing Machine"],
    }

    BILL_OPTIONS = ["electricity", "water", "gas"]

    DISTANCE_OPTIONS = ["5 mins", "7 mins", "10 mins", "12 mins", "15 mins", "20 mins", "25 mins"]

    # Realistic price bands per type (EGP/month)
    PRICE_BANDS = {
        "studio":    (2500,  7000),
        "apartment": (4000, 12000),
        "room":      (1500,  4500),
        "shared":    (800,   2500),
    }

    def add_arguments(self, parser):
        parser.add_argument("--size", choices=["small", "medium", "large"], default="medium")
        parser.add_argument("--landlords", type=int, default=None)
        parser.add_argument("--properties", type=int, default=None)
        parser.add_argument("--password", default="Pass1234!")
        parser.add_argument("--seed", type=int, default=42)
        parser.add_argument("--reset", action="store_true",
                            help="Delete previously seeded landlords and their data first.")
        parser.add_argument("--skip-images", action="store_true",
                            help="Skip downloading cover images (useful if offline).")

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(options["seed"])

        preset         = self.SIZE_PRESETS[options["size"]]
        landlord_count = options["landlords"] if options["landlords"] is not None else preset["landlords"]
        prop_count     = options["properties"] if options["properties"] is not None else preset["properties"]
        password       = options["password"]
        skip_images    = options["skip_images"]

        if options["reset"]:
            deleted, _ = Users.objects.filter(username__startswith=self.USER_PREFIX).delete()
            self.stdout.write(self.style.WARNING(f"Reset: deleted {deleted} seeded users and their properties."))

        landlords = self._ensure_landlords(landlord_count, password)
        props     = self._create_properties(landlords, prop_count)

        if not skip_images:
            self._attach_images(props)
        else:
            self.stdout.write(self.style.WARNING("Skipping image download (--skip-images)."))

        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Done. {len(landlords)} landlords · {len(props)} properties · "
            f"{'images attached' if not skip_images else 'no images'}."
        ))

    # ─────────────────────────────────────────────────────────────────────────
    # Landlords
    # ─────────────────────────────────────────────────────────────────────────

    FIRST_NAMES = ["Ahmed", "Mohamed", "Ali", "Hassan", "Khaled", "Omar",
                   "Tarek", "Youssef", "Mahmoud", "Samir", "Hany", "Wael"]
    LAST_NAMES  = ["El-Sayed", "Ibrahim", "Mostafa", "Hassan", "Nasser",
                   "Farouk", "Ramadan", "Khalil", "Abdallah", "Mansour"]

    def _ensure_landlords(self, count, password):
        landlords = []
        for i in range(1, count + 1):
            username = f"{self.USER_PREFIX}{i:03d}"
            first    = random.choice(self.FIRST_NAMES)
            last     = random.choice(self.LAST_NAMES)
            city     = random.choice(self.CITIES)
            user, created = Users.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@studenthub.local",
                    "role": "landlord",
                    "first_name": first,
                    "last_name": last,
                    "city": city,
                    "is_verified":         random.random() < 0.5,
                    "is_top_rated":        random.random() < 0.2,
                    "is_quick_responder":  random.random() < 0.4,
                },
            )
            if created:
                user.set_password(password)
                user.save(update_fields=["password"])
            landlords.append(user)
        return landlords

    # ─────────────────────────────────────────────────────────────────────────
    # Properties
    # ─────────────────────────────────────────────────────────────────────────

    def _create_properties(self, landlords, count):
        # Spread types evenly so the UI filter shows variety
        type_cycle = (["studio"] * 3 + ["apartment"] * 4 + ["room"] * 4 + ["shared"] * 3) * (count // 14 + 2)
        random.shuffle(type_cycle)

        props = []
        for idx in range(count):
            ptype    = type_cycle[idx % len(type_cycle)]
            landlord = random.choice(landlords)
            city     = random.choice(self.CITIES)
            district = random.choice(self.DISTRICTS[city])
            uni      = random.choice(self.UNIVERSITIES.get(city, ["Cairo University"]))

            title, description = random.choice(self.TEMPLATES[ptype])

            price_lo, price_hi = self.PRICE_BANDS[ptype]
            price = Decimal(str(random.randint(price_lo, price_hi) // 50 * 50))  # round to 50

            min_stay = random.randint(1, 6)
            max_stay = random.choice([None, random.randint(min_stay + 1, 18)])

            # Start from the type bundle and randomly drop some extras for variety
            base_amenities = list(self.AMENITY_BUNDLES[ptype])
            extras = [a for a in self.FACILITY_OPTIONS if a not in base_amenities]
            amenities = base_amenities + random.sample(extras, min(random.randint(0, 2), len(extras)))

            num_rooms = {"studio": 1, "apartment": random.randint(2, 4),
                         "room": 1, "shared": 1}[ptype]
            num_beds  = {"studio": 1, "apartment": num_rooms,
                         "room": 1, "shared": random.randint(2, 3)}[ptype]

            # ~60% of apartments offer by-room pricing, ~50% offer by-bed
            # ~40% of studios offer by-bed pricing
            offer_by_room = ptype == "apartment" and random.random() < 0.60
            offer_by_bed  = (
                (ptype == "apartment" and random.random() < 0.50) or
                (ptype == "studio"    and random.random() < 0.40)
            )
            room_price = (Decimal(str(round(int(price) // max(1, num_rooms) // 50 * 50)))
                          if offer_by_room else None)
            bed_price  = (Decimal(str(round(int(price) // max(1, num_beds)  // 50 * 50)))
                          if offer_by_bed  else None)

            from datetime import date, timedelta
            available_from_choices = [None, None, None,  # 3/5 chance = available now
                                      date.today() + timedelta(days=random.randint(7, 60)),
                                      date.today() + timedelta(days=random.randint(1, 6))]
            available_from = random.choice(available_from_choices)

            transport_types = random.sample(
                ["walk", "metro", "bus"],
                k=random.randint(1, 2),
            )
            bills_included = random.sample(
                self.BILL_OPTIONS,
                k=random.randint(0, len(self.BILL_OPTIONS)),
            )

            prop = Property.objects.create(
                landlord       = landlord,
                title          = title,
                description    = description,
                property_type  = ptype,
                price          = price,
                city           = city,
                district       = district,
                address        = f"{random.randint(1, 200)} {district} St., {city}",
                latitude       = Decimal(str(round(random.uniform(29.8, 31.5), 6))),
                longitude      = Decimal(str(round(random.uniform(30.7, 32.1), 6))),
                nearby_university      = uni,
                distance_to_university = random.choice(self.DISTANCE_OPTIONS),
                transport_type         = transport_types,
                num_rooms      = num_rooms,
                num_beds       = num_beds,
                num_bathrooms  = random.randint(1, 3),
                floor          = random.choice([None, random.randint(0, 12)]),
                area_sqm       = {"studio": random.randint(30, 60),
                                  "apartment": random.randint(80, 200),
                                  "room": random.randint(15, 35),
                                  "shared": random.randint(12, 25)}[ptype],
                gender_preference = random.choice(["male", "female"]),
                amenities      = amenities,
                bills_included = bills_included,
                min_stay_months = min_stay,
                max_stay_months = max_stay,
                status         = random.choices(
                    ["available", "rented", "unavailable"],
                    weights=[0.70, 0.20, 0.10],
                )[0],
                is_featured    = random.random() < 0.15,
                view_count     = random.randint(0, 300),
                room_price     = room_price,
                bed_price      = bed_price,
                available_from = available_from,
            )
            props.append(prop)

        self.stdout.write(f"  ✓ Created {len(props)} properties")
        return props

    # ─────────────────────────────────────────────────────────────────────────
    # Images
    # ─────────────────────────────────────────────────────────────────────────

    def _fetch_image_bytes(self, photo_id):
        url = f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=800&q=75"
        req = urllib.request.Request(url, headers={"User-Agent": "StudentHub/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read()

    def _attach_images(self, props):
        self.stdout.write("  Downloading cover images…")
        # Pre-fetch a pool of unique images
        cache = {}
        for pid in PHOTO_IDS:
            try:
                cache[pid] = self._fetch_image_bytes(pid)
                self.stdout.write(f"    ↓ {pid[:20]}…")
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f"    ✗ {pid[:20]} — {exc}"))

        if not cache:
            self.stdout.write(self.style.ERROR("  No images downloaded. Run with --skip-images to proceed without photos."))
            return

        photo_ids = list(cache.keys())
        attached = 0

        for idx, prop in enumerate(props):
            if prop.images.exists():
                continue  # already has images, skip

            # Pick 1–3 images per property, first one is the cover
            picks = random.sample(photo_ids, min(random.randint(1, 3), len(photo_ids)))
            for image_idx, pid in enumerate(picks):
                image_bytes = cache[pid]
                fname = f"prop_{prop.id}_{image_idx}.jpg"
                try:
                    pi = PropertyImage(property=prop, is_cover=(image_idx == 0))
                    pi.image.save(fname, ContentFile(image_bytes), save=True)
                    attached += 1
                except Exception as exc:
                    self.stdout.write(self.style.WARNING(f"    ✗ Could not save image for property {prop.id}: {exc}"))

        self.stdout.write(f"  ✓ Attached {attached} images across {len(props)} properties")
