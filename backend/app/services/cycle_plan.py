"""Deterministic 90-Day Cycle Plan Selection and Management Service.

Selects the top 3 modifiable focus factors deterministically from the user's latest
completed assessment report based on evidence grade (A > B > C) and tie-breaking priority.
No LLM is used.
"""

from typing import List, Dict, Any, Optional
from datetime import date, timedelta

from app.services.evidence_grades import QUESTION_EVIDENCE_MAP
from app.constants.plan_actions import (
    FACTOR_ACTION_LADDERS,
    SPERMATOGENESIS_RATIONALE_EN,
    CLINICIAN_REVIEW_REQUIRED,
)

# Fixed tie-breaking priority ranking (lower number = higher priority)
TIE_BREAKER_PRIORITY: Dict[str, int] = {
    "tobacco": 1,
    "smoking": 1,
    "tobacco_smoking_frequency": 1,
    "alcohol": 2,
    "alcohol_consumption_frequency": 2,
    "sleep": 3,
    "sleep_duration": 3,
    "sleep_quality": 3,
    "heat_exposure": 4,
    "laptop_on_lap_heat": 4,
    "working_in_hot_conditions": 4,
    "activity": 5,
    "physical_activity": 5,
    "sedentary_hours_per_day": 5,
    "bmi": 6,
    "bmi_management": 6,
}

GRADE_WEIGHT: Dict[str, int] = {
    "A": 3,
    "B": 2,
    "C": 1,
    "D": 0,
    "E": 0,
}


def map_raw_factor_to_plan_family(factor_id: str) -> Optional[str]:
    """Maps a raw questionnaire factor ID to an action plan factor family."""
    f_lower = factor_id.lower()
    if "steroid" in f_lower or "anabolic" in f_lower:
        # Clinical brief rule: Anabolic steroid disclosure routes to a clinician instead of a plan item!
        return None

    if "tobacco" in f_lower or "smoking" in f_lower:
        return "tobacco"
    if "alcohol" in f_lower:
        return "alcohol"
    if "sleep" in f_lower:
        return "sleep"
    if "heat" in f_lower or "laptop" in f_lower:
        return "heat_exposure"
    if "activity" in f_lower or "sedentary" in f_lower or "exercise" in f_lower:
        return "activity"
    if "bmi" in f_lower or "diet" in f_lower or "weight" in f_lower:
        return "bmi"
    return None


def select_focus_factors_from_report(report_content: Dict[str, Any]) -> List[str]:
    """
    Selects top 3 distinct focus factors by evidence grade (A > B > C),
    ignoring items with counts_toward_attention=False, and applying tie-breaking priority.
    """
    factors = report_content.get("factors_evaluated", []) or []
    
    candidates = []
    seen_families = set()

    for item in factors:
        factor_id = item.get("id") or item.get("name", "")
        # Clinical brief: check if factor counts toward attention
        meta = QUESTION_EVIDENCE_MAP.get(factor_id, {})
        if meta and not meta.get("counts_toward_attention", True):
            continue

        family = map_raw_factor_to_plan_family(factor_id)
        if not family or family in seen_families:
            continue

        grade = meta.get("grade") or item.get("evidence_grade", "B")
        grade_score = GRADE_WEIGHT.get(grade, 1)
        tie_score = TIE_BREAKER_PRIORITY.get(family, 99)

        # Higher grade score first; lower tie-breaker score second
        candidates.append({
            "family": family,
            "sort_key": (-grade_score, tie_score),
        })
        seen_families.add(family)

    candidates.sort(key=lambda x: x["sort_key"])
    selected = [c["family"] for c in candidates[:3]]

    # If fewer than 3 factors available, supplement with standard baseline pillars
    fallback_pillars = ["sleep", "activity", "heat_exposure", "bmi"]
    for pillar in fallback_pillars:
        if len(selected) >= 3:
            break
        if pillar not in selected:
            selected.append(pillar)

    return selected[:3]


def get_plan_step_for_week(factor_family: str, week_index: int, lang: str = "en") -> Dict[str, Any]:
    """Retrieves authored action step for a given factor and week index (1 to 12)."""
    ladder = FACTOR_ACTION_LADDERS.get(factor_family)
    if not ladder:
        ladder = FACTOR_ACTION_LADDERS["sleep"]

    clamped_week = max(1, min(12, week_index))
    step_item = ladder["weeks"][clamped_week - 1]

    text = step_item.get(lang) or step_item.get("en", "")
    title = ladder.get(f"title_{lang}") or ladder.get("title_en", factor_family)

    return {
        "factor_id": factor_family,
        "factor_title": title,
        "week": clamped_week,
        "action_text": text,
        "quitline": ladder.get("quitline"),
    }
