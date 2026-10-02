"""
MantraAI — Assessment Response Normalizer
==========================================

PURPOSE
-------
This module translates raw questionnaire answer dictionaries (as stored in the
assessment_responses table) into a typed, domain-structured representation called
NormalizedAssessment.

WHAT THIS MODULE DOES
---------------------
- Maps each known question ID to one of the 13 health-context domains.
- Preserves multi-select / array values as lists.
- Normalizes numeric values (slider responses) from string → int/float where the
  schema requires a numeric type.
- Strips accidental leading/trailing whitespace from string values.
- Handles missing (None / absent) answers safely — they are preserved as None, NOT
  coerced to 0, "No", or any other default that could alter clinical meaning.
- Collects any question ID not present in the canonical schema mapping into an
  `unmapped_fields` dict so that schema drift is detectable.

WHAT THIS MODULE DOES NOT DO
-----------------------------
- It does NOT produce any risk score, severity label, clinical category, or
  fertility probability. Scoring belongs to the future Domain & Context Engine.
- It does NOT diagnose, recommend medication, or generate any clinical output.
- It does NOT modify the database. Raw responses continue to be stored exactly as
  they were submitted.
- It does NOT send any data to external services.
- It does NOT log raw health response values.

DOMAIN MAPPING SOURCE
---------------------
Domains are derived directly from the MantraAI Clinical Assessment Schema
(assessment_questions_document.md, assessmentSchema.js) — 13 blocks, 86 questions.
Domain names match the internal architecture target (not the frontend block labels).

UNKNOWN QUESTIONS
-----------------
If the raw responses dict contains a key not present in the canonical mapping,
the key/value pair is placed in `unmapped_fields` and a warning is emitted via
the module logger (without including the actual value to protect sensitive data).

DISCLAIMER
----------
This normalizer structures questionnaire context only. It is NOT a clinically
validated instrument and does NOT produce clinical diagnoses.
"""

import logging
from typing import Any, Optional, Union
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Canonical question → domain mapping
# Built from assessment_questions_document.md (86 questions, 13 blocks)
# ---------------------------------------------------------------------------

#: Maps every known question_id → its internal domain name.
QUESTION_DOMAIN_MAP: dict[str, str] = {
    # ── Block 1: Demographics ──────────────────────────────────────────────
    "age_years":                      "demographics",
    "bmi_category":                   "demographics",
    "city_region":                    "demographics",
    "residential_area_type":          "demographics",
    "occupation_type":                "demographics",
    "education_level":                "demographics",
    "relationship_status":            "demographics",

    # ── Block 2: Lifestyle Behaviors ────────────────────────────────────────
    "smoking_status":                 "lifestyle_behaviors",
    "alcohol_frequency":              "lifestyle_behaviors",
    "recreational_drug_use":          "lifestyle_behaviors",
    "physical_activity_level":        "lifestyle_behaviors",
    "hours_sitting_per_day":          "lifestyle_behaviors",
    "irregular_sleep":                "lifestyle_behaviors",
    "sleep_duration":                 "lifestyle_behaviors",

    # ── Block 3: Heat Exposure ──────────────────────────────────────────────
    "laptop_on_lap":                  "heat_exposure",
    "mobile_phone_placement":         "heat_exposure",
    "underwear_type":                 "heat_exposure",
    "hot_bath_frequency":             "heat_exposure",
    "working_in_hot_conditions":      "heat_exposure",
    "cycling_hours_per_week":         "heat_exposure",

    # ── Block 4: Diet & Nutrition ───────────────────────────────────────────
    "diet_type":                      "diet_nutrition",
    "fruit_veg_intake":               "diet_nutrition",
    "processed_food_frequency":       "diet_nutrition",
    "fried_food_frequency":           "diet_nutrition",
    "soy_phytoestrogen_intake":       "diet_nutrition",
    "water_intake":                   "diet_nutrition",
    "supplement_use":                 "diet_nutrition",

    # ── Block 5: Environmental Exposure ────────────────────────────────────
    "proximity_to_industrial_or_traffic": "environmental_exposure",
    "pesticide_occupational_exposure":    "environmental_exposure",
    "heavy_metal_occupational_exposure":  "environmental_exposure",
    "plastic_use_hot_food_water":         "environmental_exposure",
    "emf_radiation_at_work":              "environmental_exposure",

    # ── Block 6: Mental Health & Stress ────────────────────────────────────
    "daily_work_hours":               "mental_health_stress",
    "perceived_stress_pss10":         "mental_health_stress",
    "gad7_score":                     "mental_health_stress",
    "phq9_score":                     "mental_health_stress",
    "sleep_quality_psqi_proxy":       "mental_health_stress",

    # ── Block 7: Reproductive History & Symptoms ───────────────────────────
    "prior_sti_history":              "reproductive_history_symptoms",
    "scrotal_or_groin_injury":        "reproductive_history_symptoms",
    "childhood_disease_mumps":        "reproductive_history_symptoms",
    "known_varicocele":               "reproductive_history_symptoms",
    "sexual_abstinence_period_days":  "reproductive_history_symptoms",
    "libido_changes":                 "reproductive_history_symptoms",
    "ejaculation_concerns":           "reproductive_history_symptoms",

    # ── Block 8: Substance & Medication Use ────────────────────────────────
    "anabolic_steroid_use":           "substance_medication_use",
    "finasteride_use":                "substance_medication_use",
    "antidepressant_use_ssri":        "substance_medication_use",
    "antihypertensive_use":           "substance_medication_use",
    "chemotherapy_history":           "substance_medication_use",
    "other_long_term_medication":     "substance_medication_use",

    # ── Block 9: Digital Sexual Behavior ───────────────────────────────────
    "pornography_use_frequency":      "digital_sexual_behavior",
    "perceived_control_over_use":     "digital_sexual_behavior",
    "use_as_emotional_coping":        "digital_sexual_behavior",
    "escalation_pattern":             "digital_sexual_behavior",
    "negative_consequences_noticed":  "digital_sexual_behavior",
    "attempts_to_cut_down_failed":    "digital_sexual_behavior",
    "daily_time_on_sexual_content":   "digital_sexual_behavior",
    "masturbation_frequency":         "digital_sexual_behavior",
    "masturbation_frequency_change":  "digital_sexual_behavior",
    "masturbation_control":           "digital_sexual_behavior",
    "masturbation_functional_impact": "digital_sexual_behavior",
    "masturbation_physical_discomfort": "digital_sexual_behavior",
    "masturbation_emotional_coping":  "digital_sexual_behavior",

    # ── Block 10: Sexual Performance / Anxiety ─────────────────────────────
    "anticipatory_anxiety_before_sex":        "sexual_performance_anxiety",
    "primary_fear_type":                      "sexual_performance_anxiety",
    "sexual_avoidance_due_to_fear":           "sexual_performance_anxiety",
    "partner_comparison_porn_vs_reality":     "sexual_performance_anxiety",
    "cognitive_self_monitoring_during_sex":   "sexual_performance_anxiety",
    "history_of_unexpected_sexual_difficulty":"sexual_performance_anxiety",
    "pornography_driven_performance_standard":"sexual_performance_anxiety",
    "partnered_sexual_history":               "sexual_performance_anxiety",
    "recent_partnered_sex":                   "sexual_performance_anxiety",
    "partnered_sexual_difficulty":            "sexual_performance_anxiety",

    # ── Block 11: Body Image & Self-Perception ─────────────────────────────
    "general_body_satisfaction":              "body_image_self_perception",
    "physique_muscularity_pressure":          "body_image_self_perception",
    "genital_self_image_concern":             "body_image_self_perception",
    "social_media_body_comparison_frequency": "body_image_self_perception",

    # ── Block 12: Social & Relational Context ──────────────────────────────
    "relationship_satisfaction":      "social_relational_context",
    "perceived_loneliness_ucla3":     "social_relational_context",
    "family_communication_comfort":   "social_relational_context",
    "peer_pressure_sexual_behavior":  "social_relational_context",

    # ── Block 13: Coping Mechanism Mapping ─────────────────────────────────
    "primary_stress_coping_method":   "coping_mechanisms",
    "emotional_regulation_ability":   "coping_mechanisms",
    "sleep_as_escape":                "coping_mechanisms",
    "substance_use_under_stress":     "coping_mechanisms",
    "mindfulness_or_meditation_practice": "coping_mechanisms",
}

# ---------------------------------------------------------------------------
# Fields that should be treated as numeric (slider responses).
# These are the only fields where string → int/float coercion is applied.
# All other categorical/boolean fields are kept as-is.
# ---------------------------------------------------------------------------
NUMERIC_FIELDS: set[str] = {
    "age_years",           # slider: 18–50 (integer)
    "perceived_stress_pss10",  # slider: 0–33 (integer)
    "gad7_score",          # slider: 0–16 (integer)
    "phq9_score",          # slider: 0–19 (integer)
}

# ---------------------------------------------------------------------------
# All 13 internal domain names (used for initializing the output structure)
# ---------------------------------------------------------------------------
ALL_DOMAINS = [
    "demographics",
    "lifestyle_behaviors",
    "heat_exposure",
    "diet_nutrition",
    "environmental_exposure",
    "mental_health_stress",
    "reproductive_history_symptoms",
    "substance_medication_use",
    "digital_sexual_behavior",
    "sexual_performance_anxiety",
    "body_image_self_perception",
    "social_relational_context",
    "coping_mechanisms",
]

# ---------------------------------------------------------------------------
# Pydantic output model
# ---------------------------------------------------------------------------

class NormalizedAssessment(BaseModel):
    """
    Structured assessment context produced by the normalizer.

    Each domain contains a dict of question_id → normalized value.
    Values may be:
      - str         (categorical / radio / segmented responses)
      - int / float (slider responses for numeric fields)
      - list        (dropdown / multi-select responses)
      - None        (question was not answered — intentionally kept as None)

    unmapped_fields contains any raw response keys not present in the
    canonical QUESTION_DOMAIN_MAP, allowing schema drift to be detected.

    NOTE: This object carries structured assessment context ONLY.
    It does NOT carry any risk score, clinical category, or diagnosis.
    """
    demographics:                   dict[str, Any] = Field(default_factory=dict)
    lifestyle_behaviors:            dict[str, Any] = Field(default_factory=dict)
    heat_exposure:                  dict[str, Any] = Field(default_factory=dict)
    diet_nutrition:                 dict[str, Any] = Field(default_factory=dict)
    environmental_exposure:         dict[str, Any] = Field(default_factory=dict)
    mental_health_stress:           dict[str, Any] = Field(default_factory=dict)
    reproductive_history_symptoms:  dict[str, Any] = Field(default_factory=dict)
    substance_medication_use:       dict[str, Any] = Field(default_factory=dict)
    digital_sexual_behavior:        dict[str, Any] = Field(default_factory=dict)
    sexual_performance_anxiety:     dict[str, Any] = Field(default_factory=dict)
    body_image_self_perception:     dict[str, Any] = Field(default_factory=dict)
    social_relational_context:      dict[str, Any] = Field(default_factory=dict)
    coping_mechanisms:              dict[str, Any] = Field(default_factory=dict)
    unmapped_fields:                dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Helper: safe numeric coercion
# ---------------------------------------------------------------------------

def _to_int_safe(value: Any) -> Optional[int]:
    """
    Attempt to convert value to int. Returns None if conversion fails.
    Used only for fields in NUMERIC_FIELDS where the slider always
    produces a numeric string or an integer.
    """
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        stripped = value.strip()
        if stripped == "":
            return None
        try:
            return int(float(stripped))  # handles "18", "18.0"
        except (ValueError, TypeError):
            return None
    return None


def _normalize_value(question_id: str, raw_value: Any) -> Any:
    """
    Normalize a single answer value for the given question_id.

    Rules applied (in order):
    1. If raw_value is None → return None (missing answer preserved as None).
    2. If question_id is a NUMERIC_FIELD → coerce to int via _to_int_safe.
    3. If raw_value is a list → strip whitespace from each string element
       (multi-select arrays are preserved as lists, not collapsed).
    4. If raw_value is a str → strip whitespace, return as-is.
    5. Otherwise (bool, int, float, etc.) → return as-is.

    NOTE: Categorical values are NOT converted to numeric scores here.
    "High" stays "High". Scoring is intentionally excluded from this layer.
    """
    if raw_value is None:
        return None

    if question_id in NUMERIC_FIELDS:
        return _to_int_safe(raw_value)

    if isinstance(raw_value, list):
        normalized_list = []
        for item in raw_value:
            if isinstance(item, str):
                normalized_list.append(item.strip())
            else:
                normalized_list.append(item)
        return normalized_list

    if isinstance(raw_value, str):
        return raw_value.strip()

    # bool, int, float — return unchanged
    return raw_value


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def normalize_assessment_responses(raw_responses: dict[str, Any]) -> NormalizedAssessment:
    """
    Normalize a raw questionnaire response dictionary into a structured
    NormalizedAssessment object.

    Parameters
    ----------
    raw_responses : dict[str, Any]
        The raw key/value response dict as fetched from assessment_responses
        (question_id → response_value). May be empty or partially filled.

    Returns
    -------
    NormalizedAssessment
        A Pydantic model containing each domain dict plus unmapped_fields.
        All 13 domain dicts are present even when empty.

    Raises
    ------
    Does NOT raise. All unexpected values are placed in unmapped_fields.
    Missing optional answers produce None values, not exceptions.

    Privacy
    -------
    This function does NOT log any raw response values.
    It logs only question IDs of unmapped fields (no health data).
    """
    # Initialize domain buckets — all 13 present even if empty
    domain_buckets: dict[str, dict[str, Any]] = {d: {} for d in ALL_DOMAINS}
    unmapped: dict[str, Any] = {}

    if not isinstance(raw_responses, dict):
        logger.warning(
            "normalize_assessment_responses received non-dict input type: %s",
            type(raw_responses).__name__
        )
        return NormalizedAssessment()

    for question_id, raw_value in raw_responses.items():
        domain = QUESTION_DOMAIN_MAP.get(question_id)

        if domain is None:
            # Unknown question — collect for detection; do NOT log the value
            logger.warning(
                "Unmapped question ID encountered during normalization: '%s'. "
                "This may indicate a schema update. Value is NOT logged for privacy.",
                question_id,
            )
            # Store in unmapped with value preserved for downstream use
            unmapped[question_id] = raw_value
        else:
            normalized_value = _normalize_value(question_id, raw_value)
            domain_buckets[domain][question_id] = normalized_value

    return NormalizedAssessment(
        demographics=domain_buckets["demographics"],
        lifestyle_behaviors=domain_buckets["lifestyle_behaviors"],
        heat_exposure=domain_buckets["heat_exposure"],
        diet_nutrition=domain_buckets["diet_nutrition"],
        environmental_exposure=domain_buckets["environmental_exposure"],
        mental_health_stress=domain_buckets["mental_health_stress"],
        reproductive_history_symptoms=domain_buckets["reproductive_history_symptoms"],
        substance_medication_use=domain_buckets["substance_medication_use"],
        digital_sexual_behavior=domain_buckets["digital_sexual_behavior"],
        sexual_performance_anxiety=domain_buckets["sexual_performance_anxiety"],
        body_image_self_perception=domain_buckets["body_image_self_perception"],
        social_relational_context=domain_buckets["social_relational_context"],
        coping_mechanisms=domain_buckets["coping_mechanisms"],
        unmapped_fields=unmapped,
    )
