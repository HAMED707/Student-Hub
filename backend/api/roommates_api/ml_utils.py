"""
ml_utils.py — Roommate Matching AI
====================================
Cosine similarity on ordinal-encoded lifestyle fields.
Field values match RoommateProfile model choices exactly.

Encoding:
    sleeping_time        → early=0,  normal=0.5, late=1.0
    cleanliness          → medium=0, high=1.0
    personality          → quiet=0,  social=1.0
    smoking              → non_smoker=0, smoker=1.0
    guests_policy        → never=0,  sometimes=0.5, often=1.0
    room_type_preference → single=0, shared=1.0
    budget               → min-max scaled average (relative to current data)
"""

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def process_and_match(current_user_username: str, profiles_queryset, top_n: int = 5):
    """
    Parameters
    ----------
    current_user_username : str
        Username of the student requesting matches.
    profiles_queryset : QuerySet .values() result
        Already filtered by hard constraints (gender, city, university, is_active).
        Must include the current user's own row.
    top_n : int
        Number of matches to return (default 5).

    Returns
    -------
    list[dict]
        [{"user__username": "...", "compatibility_score": 87.5}, ...]
        Sorted best → worst. Empty list if not enough profiles.
    """

    # 1. Convert to DataFrame
    df = pd.DataFrame(list(profiles_queryset))

    if df.empty or len(df) <= 1:
        return []

    # 2. Ordinal encoding — values match model choices exactly
    sleep_map       = {'early': 0, 'normal': 0.5, 'late': 1.0}
    clean_map       = {'low': 0, 'medium': 0.5, 'high': 1.0}
    personality_map = {'quiet': 0, 'moderate': 0.5, 'social': 1.0}
    smoking_map     = {'non_smoker': 0, 'smoker': 1.0}
    guests_map      = {'never': 0, 'sometimes': 0.5, 'often': 1.0}
    room_map        = {'single': 0, 'both': 0.5, 'shared': 1.0}

    df['sleep_encoded']       = df['sleeping_time'].map(sleep_map).fillna(0.5)
    df['clean_encoded']       = df['cleanliness'].map(clean_map).fillna(0.5)
    df['personality_encoded'] = df['personality'].map(personality_map).fillna(0.5)
    df['smoking_encoded']     = df['smoking'].map(smoking_map).fillna(0.5)
    df['guests_encoded']      = df['guests_policy'].map(guests_map).fillna(0.5)
    df['room_type_encoded']   = df['room_type_preference'].map(room_map).fillna(0.5)

    # 3. Budget — min-max scaling on the average of min/max budget
    #    Scales relative to actual data so no hardcoded cap needed
    if 'budget_min' in df.columns and 'budget_max' in df.columns:
        df['budget_avg'] = (df['budget_min'].fillna(0) + df['budget_max'].fillna(0)) / 2.0
        max_b = df['budget_avg'].max()
        min_b = df['budget_avg'].min()
        if max_b > min_b:
            df['budget_encoded'] = (df['budget_avg'] - min_b) / (max_b - min_b)
        else:
            df['budget_encoded'] = 0.5  # all budgets identical — no signal
    else:
        df['budget_encoded'] = 0.5

    # 4. Build numeric feature matrix
    numeric_columns = [
        'sleep_encoded',
        'clean_encoded',
        'personality_encoded',
        'smoking_encoded',
        'guests_encoded',
        'room_type_encoded',
        'budget_encoded',
    ]
    matrix = df[numeric_columns].fillna(0)

    # 5. Extract current user's vector
    target_mask = df['user__username'] == current_user_username
    if not target_mask.any():
        return []

    target_vector = matrix[target_mask]

    # 6. Cosine similarity → score out of 100
    similarities = cosine_similarity(target_vector, matrix)[0]
    df['compatibility_score'] = np.round(similarities * 100, 2)

    # 7. Exclude self, sort, cap at top_n
    matches = (
        df[~target_mask]
        .sort_values('compatibility_score', ascending=False)
        .head(top_n)
    )

    return [
        {
            "username": row["user__username"],
            "compatibility_score": row["compatibility_score"],
        }
        for _, row in matches.iterrows()
    ]