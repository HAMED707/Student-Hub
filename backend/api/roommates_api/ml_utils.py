"""
ml_utils.py — Roommate Matching AI
===================================
Uses cosine similarity (KNN-style) on encoded lifestyle fields
from RoommateProfile to compute a compatibility score (0–100).

Field mapping (RoommateProfile → encoded):
    sleeping_time     → ordinal  (early=0, normal=0.5, late=1)
    cleanliness       → ordinal  (low=0, medium=0.5, high=1)
    personality       → one-hot  (quiet, social, moderate)
    smoking           → one-hot  (smoker, non_smoker)
    guests_policy     → ordinal  (never=0, sometimes=0.5, often=1)
    budget_min/max    → normalised midpoint
"""

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


# ── Ordinal maps ─────────────────────────────────────────────────────────────

SLEEPING_MAP  = {"early": 0.0, "normal": 0.5, "late": 1.0}
CLEANLINESS_MAP = {"low": 0.0, "medium": 0.5, "high": 1.0}
GUESTS_MAP    = {"never": 0.0, "sometimes": 0.5, "often": 1.0}

BUDGET_SCALE = 10_000  # EGP — normalise budget midpoint against this cap


def _encode_profiles(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw RoommateProfile rows into a numeric feature matrix.
    Only uses fields that meaningfully represent lifestyle overlap.
    """
    features = pd.DataFrame(index=df.index)

    # Ordinal fields
    features["sleeping_time"]  = df["sleeping_time"].map(SLEEPING_MAP).fillna(0.5)
    features["cleanliness"]    = df["cleanliness"].map(CLEANLINESS_MAP).fillna(0.5)
    features["guests_policy"]  = df["guests_policy"].map(GUESTS_MAP).fillna(0.5)

    # One-hot: personality  (quiet / social / moderate)
    for val in ["quiet", "social", "moderate"]:
        features[f"personality_{val}"] = (df["personality"] == val).astype(float)

    # One-hot: smoking  (smoker / non_smoker)
    for val in ["smoker", "non_smoker"]:
        features[f"smoking_{val}"] = (df["smoking"] == val).astype(float)

    # Budget midpoint — normalised to [0, 1]
    budget_mid = (
        (df["budget_min"].fillna(0) + df["budget_max"].fillna(0)) / 2
    ) / BUDGET_SCALE
    features["budget_mid"] = budget_mid.clip(0, 1)

    return features


def process_and_match(current_user_username: str, profiles_queryset, top_n: int = 5):
    """
    Entry point called from the view.

    Parameters
    ----------
    current_user_username : str
        Username of the student requesting matches.
    profiles_queryset : QuerySet .values() result
        Active RoommateProfiles already filtered by hard constraints
        (same gender, university, city). Must include the current user's
        own row so their vector can be extracted.
    top_n : int
        How many matches to return (default 5).

    Returns
    -------
    list[dict]
        [{"username": "...", "compatibility_score": 87.5}, ...]
        Sorted best → worst. Empty list if not enough profiles.
    """
    df = pd.DataFrame(list(profiles_queryset))

    if df.empty or len(df) <= 1:
        return []

    feature_matrix = _encode_profiles(df)

    target_mask = df["user__username"] == current_user_username
    if not target_mask.any():
        return []

    target_vector = feature_matrix[target_mask]
    similarities  = cosine_similarity(target_vector, feature_matrix)[0]

    df["compatibility_score"] = np.round(similarities * 100, 2)

    matches = (
        df[~target_mask]
        .sort_values("compatibility_score", ascending=False)
        .head(top_n)
    )

    return [
        {
            "username": row["user__username"],
            "compatibility_score": row["compatibility_score"],
        }
        for _, row in matches.iterrows()
    ]