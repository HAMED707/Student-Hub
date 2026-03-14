"""
services/universities.py

Coordinate registry for Egyptian universities.
Used when a student queries nearby amenities relative to their university
and the frontend doesn't send GPS coords.

Add more entries as the platform expands.
"""

EGYPTIAN_UNIVERSITIES: dict[str, dict] = {
    # ── Cairo ──────────────────────────────────────────────────────
    "Cairo University":                     {"lat": 30.0262,  "lng": 31.2132,  "city": "Giza"},
    "Ain Shams University":                 {"lat": 30.0730,  "lng": 31.2798,  "city": "Cairo"},
    "Helwan University":                    {"lat": 29.8497,  "lng": 31.3238,  "city": "Cairo"},
    "Misr University for Science and Technology": {"lat": 29.8814, "lng": 31.3506, "city": "Giza"},
    "German University in Cairo":           {"lat": 29.9878,  "lng": 31.4414,  "city": "Cairo"},
    "American University in Cairo":         {"lat": 30.0220,  "lng": 31.4999,  "city": "Cairo"},
    "Future University in Egypt":           {"lat": 30.0281,  "lng": 31.4762,  "city": "Cairo"},
    "Modern Sciences and Arts University":  {"lat": 30.0617,  "lng": 31.2281,  "city": "Giza"},
    "Nile University":                      {"lat": 30.0618,  "lng": 30.8426,  "city": "Giza"},
    "October 6 University":                 {"lat": 29.9350,  "lng": 30.9296,  "city": "6th of October"},
    "Badr University in Cairo":             {"lat": 30.1290,  "lng": 31.7439,  "city": "Cairo"},

    # ── Alexandria ────────────────────────────────────────────────
    "Alexandria University":                {"lat": 31.2001,  "lng": 29.9187,  "city": "Alexandria"},
    "Arab Academy for Science and Technology": {"lat": 31.1842, "lng": 29.9370, "city": "Alexandria"},
    "Pharos University in Alexandria":      {"lat": 31.1697,  "lng": 29.9663,  "city": "Alexandria"},

    # ── Delta / Canal ─────────────────────────────────────────────
    "Mansoura University":                  {"lat": 31.0409,  "lng": 31.3785,  "city": "Mansoura"},
    "Tanta University":                     {"lat": 30.7969,  "lng": 31.0039,  "city": "Tanta"},
    "Zagazig University":                   {"lat": 30.5855,  "lng": 31.5027,  "city": "Zagazig"},
    "Suez Canal University":                {"lat": 30.6057,  "lng": 32.2694,  "city": "Ismailia"},
    "Port Said University":                 {"lat": 31.2544,  "lng": 32.2940,  "city": "Port Said"},
    "Benha University":                     {"lat": 30.4628,  "lng": 31.1856,  "city": "Benha"},
    "Kafr El Sheikh University":            {"lat": 31.1063,  "lng": 30.9388,  "city": "Kafr El Sheikh"},
    "Damietta University":                  {"lat": 31.4218,  "lng": 31.8131,  "city": "Damietta"},

    # ── Upper Egypt ───────────────────────────────────────────────
    "Assiut University":                    {"lat": 27.1810,  "lng": 31.1655,  "city": "Assiut"},
    "Sohag University":                     {"lat": 26.5569,  "lng": 31.6948,  "city": "Sohag"},
    "South Valley University":              {"lat": 25.6872,  "lng": 32.6439,  "city": "Qena"},
    "Aswan University":                     {"lat": 24.0889,  "lng": 32.8998,  "city": "Aswan"},
    "Luxor University":                     {"lat": 25.6872,  "lng": 32.6439,  "city": "Luxor"},

    # ── Sinai / Red Sea ───────────────────────────────────────────
    "Sinai University":                     {"lat": 30.9753,  "lng": 33.7959,  "city": "Arish"},
    "Galala University":                    {"lat": 29.4938,  "lng": 32.1197,  "city": "Ain Sokhna"},

    # ── New cities ────────────────────────────────────────────────
    "Zewail City of Science and Technology": {"lat": 29.9338, "lng": 30.9323, "city": "6th of October"},
    "New Mansoura University":              {"lat": 31.5173,  "lng": 32.0256,  "city": "New Mansoura"},
}


def get_university_coords(name: str) -> dict | None:
    """
    Case-insensitive lookup.
    Returns {"lat": float, "lng": float, "city": str} or None.
    """
    name_lower = name.strip().lower()
    for uni_name, coords in EGYPTIAN_UNIVERSITIES.items():
        if uni_name.lower() == name_lower:
            return coords
    # Partial match fallback
    for uni_name, coords in EGYPTIAN_UNIVERSITIES.items():
        if name_lower in uni_name.lower():
            return coords
    return None


def list_universities() -> list[str]:
    return sorted(EGYPTIAN_UNIVERSITIES.keys())