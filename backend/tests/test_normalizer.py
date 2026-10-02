"""
Tests for app/services/normalizer.py
=====================================

All tests use synthetic / mock questionnaire responses only.
No real user data, names, emails, phone numbers, or health records are used.

Coverage:
  TEST 1  – Basic domain mapping (known question IDs routed correctly)
  TEST 2  – Numeric normalization for slider fields
  TEST 3  – Boolean-like categorical fields are NOT converted to bool
  TEST 4  – Multi-select / list values are preserved as lists
  TEST 5  – Missing optional values do not crash; produce None entries
  TEST 6  – Unknown question ID appears in unmapped_fields, not silently lost
  TEST 7  – Empty response dict returns a valid NormalizedAssessment with all domains
  TEST 8  – Logger does NOT emit raw response values for unmapped fields
  TEST 9  – Existing completion endpoint integration (API contract unchanged)
"""

import sys
import os
import logging
import pytest
from unittest.mock import patch, MagicMock

# Ensure the backend root is on sys.path so imports resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.normalizer import (
    normalize_assessment_responses,
    NormalizedAssessment,
    QUESTION_DOMAIN_MAP,
    NUMERIC_FIELDS,
    ALL_DOMAINS,
)


# ===========================================================================
# TEST 1 — Basic domain mapping
# ===========================================================================

def test_basic_domain_mapping():
    """
    Known question IDs must be routed into the correct domain bucket.
    Values are preserved as-is (categorical strings remain strings).
    """
    mock_responses = {
        "age_years": 28,                        # demographics
        "bmi_category": "Normal",               # demographics
        "smoking_status": "Never",              # lifestyle_behaviors
        "sleep_duration": "7-9",                # lifestyle_behaviors
        "laptop_on_lap": "Occasionally",        # heat_exposure
        "diet_type": "Vegetarian",              # diet_nutrition
        "proximity_to_industrial_or_traffic": "No",  # environmental_exposure
        "perceived_stress_pss10": 10,           # mental_health_stress
        "prior_sti_history": "No",              # reproductive_history_symptoms
        "anabolic_steroid_use": "Never",        # substance_medication_use
        "pornography_use_frequency": "Never",   # digital_sexual_behavior
        "anticipatory_anxiety_before_sex": "Never",  # sexual_performance_anxiety
        "general_body_satisfaction": "4",       # body_image_self_perception
        "relationship_satisfaction": "Satisfied",    # social_relational_context
        "primary_stress_coping_method": "Exercise",  # coping_mechanisms
    }

    result = normalize_assessment_responses(mock_responses)

    assert isinstance(result, NormalizedAssessment)
    assert "age_years" in result.demographics
    assert "bmi_category" in result.demographics
    assert "smoking_status" in result.lifestyle_behaviors
    assert "sleep_duration" in result.lifestyle_behaviors
    assert "laptop_on_lap" in result.heat_exposure
    assert "diet_type" in result.diet_nutrition
    assert "proximity_to_industrial_or_traffic" in result.environmental_exposure
    assert "perceived_stress_pss10" in result.mental_health_stress
    assert "prior_sti_history" in result.reproductive_history_symptoms
    assert "anabolic_steroid_use" in result.substance_medication_use
    assert "pornography_use_frequency" in result.digital_sexual_behavior
    assert "anticipatory_anxiety_before_sex" in result.sexual_performance_anxiety
    assert "general_body_satisfaction" in result.body_image_self_perception
    assert "relationship_satisfaction" in result.social_relational_context
    assert "primary_stress_coping_method" in result.coping_mechanisms


# ===========================================================================
# TEST 2 — Numeric normalization (slider fields only)
# ===========================================================================

def test_numeric_normalization_string_to_int():
    """
    Slider fields (NUMERIC_FIELDS) must be coerced from string → int.
    Only fields explicitly listed in NUMERIC_FIELDS should be converted.
    """
    mock_responses = {
        "age_years": "24",          # string "24" → int 24
        "perceived_stress_pss10": "16",  # string "16" → int 16
        "gad7_score": "8",          # string "8" → int 8
        "phq9_score": "5",          # string "5" → int 5
    }

    result = normalize_assessment_responses(mock_responses)

    assert result.demographics["age_years"] == 24
    assert isinstance(result.demographics["age_years"], int)
    assert result.mental_health_stress["perceived_stress_pss10"] == 16
    assert isinstance(result.mental_health_stress["perceived_stress_pss10"], int)
    assert result.mental_health_stress["gad7_score"] == 8
    assert result.mental_health_stress["phq9_score"] == 5


def test_numeric_normalization_already_int():
    """Integer values in numeric fields should remain as ints unchanged."""
    mock_responses = {"age_years": 30}
    result = normalize_assessment_responses(mock_responses)
    assert result.demographics["age_years"] == 30
    assert isinstance(result.demographics["age_years"], int)


def test_numeric_normalization_float_string():
    """Float-string like "18.0" in a numeric field should coerce cleanly to int."""
    mock_responses = {"age_years": "18.0"}
    result = normalize_assessment_responses(mock_responses)
    assert result.demographics["age_years"] == 18


# ===========================================================================
# TEST 3 — Categorical fields are NOT converted to bool or int
# ===========================================================================

def test_categorical_fields_not_scored():
    """
    Categorical string values must be preserved as strings.
    "Yes" stays "Yes" (not True). "High" stays "High" (not 3).
    Scoring is intentionally excluded from the normalizer.
    """
    mock_responses = {
        "working_in_hot_conditions": "Yes",   # heat_exposure — categorical
        "irregular_sleep": "Often",           # lifestyle_behaviors — categorical
        "pesticide_occupational_exposure": "No",  # environmental_exposure
    }
    result = normalize_assessment_responses(mock_responses)

    assert result.heat_exposure["working_in_hot_conditions"] == "Yes"
    assert not isinstance(result.heat_exposure["working_in_hot_conditions"], bool)
    assert result.lifestyle_behaviors["irregular_sleep"] == "Often"
    assert result.environmental_exposure["pesticide_occupational_exposure"] == "No"


# ===========================================================================
# TEST 4 — Multi-select / list preservation
# ===========================================================================

def test_multiselect_list_preserved():
    """
    Multi-select (dropdown) responses stored as lists must remain as lists.
    Individual string elements within the list should be whitespace-stripped.
    """
    mock_responses = {
        "supplement_use": ["Zinc", " Omega-3 ", "CoQ10"],  # diet_nutrition
        "negative_consequences_noticed": ["Sleep", "Work/study focus"],  # digital_sexual_behavior
    }
    result = normalize_assessment_responses(mock_responses)

    assert isinstance(result.diet_nutrition["supplement_use"], list)
    assert result.diet_nutrition["supplement_use"] == ["Zinc", "Omega-3", "CoQ10"]  # stripped

    assert isinstance(result.digital_sexual_behavior["negative_consequences_noticed"], list)
    assert result.digital_sexual_behavior["negative_consequences_noticed"] == [
        "Sleep", "Work/study focus"
    ]


def test_empty_list_preserved():
    """An empty list value should remain an empty list, not become None."""
    mock_responses = {"supplement_use": []}
    result = normalize_assessment_responses(mock_responses)
    assert result.diet_nutrition["supplement_use"] == []
    assert isinstance(result.diet_nutrition["supplement_use"], list)


# ===========================================================================
# TEST 5 — Missing optional values handled safely
# ===========================================================================

def test_missing_value_is_none():
    """
    If a question ID is present in the raw_responses dict but its value is None
    (unanswered optional question), the normalizer must preserve None — not
    coerce it to 0, "No", "None", or any other default.
    """
    mock_responses = {
        "age_years": 25,
        "libido_changes": None,       # optional — not answered
        "known_varicocele": None,     # optional — not answered
    }
    result = normalize_assessment_responses(mock_responses)

    assert result.demographics["age_years"] == 25
    assert "libido_changes" in result.reproductive_history_symptoms
    assert result.reproductive_history_symptoms["libido_changes"] is None
    assert "known_varicocele" in result.reproductive_history_symptoms
    assert result.reproductive_history_symptoms["known_varicocele"] is None


def test_partial_responses_do_not_crash():
    """
    A response dict containing only a subset of all 86 questions must not crash.
    All 13 domain dicts must still be present in the output (some will be empty).
    """
    mock_responses = {"age_years": 22, "smoking_status": "Never"}
    result = normalize_assessment_responses(mock_responses)

    for domain in ALL_DOMAINS:
        assert hasattr(result, domain), f"Domain '{domain}' missing from NormalizedAssessment"
    # Domains with no input should be empty dicts, not None
    assert result.heat_exposure == {}
    assert result.diet_nutrition == {}


# ===========================================================================
# TEST 6 — Unknown question ID ends up in unmapped_fields
# ===========================================================================

def test_unknown_question_id_captured():
    """
    A question ID not in the canonical QUESTION_DOMAIN_MAP must be placed in
    unmapped_fields with its value intact. It must NOT silently disappear.
    """
    mock_responses = {
        "age_years": 30,
        "future_experimental_question_xyz": "some_value",
    }
    result = normalize_assessment_responses(mock_responses)

    assert "future_experimental_question_xyz" in result.unmapped_fields
    assert result.unmapped_fields["future_experimental_question_xyz"] == "some_value"
    # Mapped field still goes to correct domain
    assert result.demographics["age_years"] == 30


def test_multiple_unknown_fields():
    """All unknown fields should be collected in unmapped_fields."""
    mock_responses = {
        "unknown_a": "val_a",
        "unknown_b": 42,
    }
    result = normalize_assessment_responses(mock_responses)
    assert len(result.unmapped_fields) == 2
    assert "unknown_a" in result.unmapped_fields
    assert "unknown_b" in result.unmapped_fields


# ===========================================================================
# TEST 7 — Empty response dict produces a valid, empty structure
# ===========================================================================

def test_empty_response_dict():
    """
    An empty dict (user answered nothing) must produce a valid NormalizedAssessment
    with all 13 domain dicts present and empty, and no unmapped_fields.
    """
    result = normalize_assessment_responses({})

    assert isinstance(result, NormalizedAssessment)
    for domain in ALL_DOMAINS:
        assert getattr(result, domain) == {}, f"Domain '{domain}' should be empty dict"
    assert result.unmapped_fields == {}


def test_non_dict_input_returns_empty_normalized():
    """
    If the input is not a dict (e.g. None or a list), the function must not crash.
    It should return a valid empty NormalizedAssessment.
    """
    result_none = normalize_assessment_responses(None)
    assert isinstance(result_none, NormalizedAssessment)

    result_list = normalize_assessment_responses([])
    assert isinstance(result_list, NormalizedAssessment)


# ===========================================================================
# TEST 8 — Sensitive data: normalizer must NOT log raw response values
# ===========================================================================

def test_unmapped_field_logging_does_not_include_value(caplog):
    """
    When an unknown question ID is encountered, the logger warning must
    include the question_id (for schema drift detection) but must NOT
    include the raw response value (privacy protection).
    """
    unknown_key = "hypothetical_sensitive_field_2099"
    sensitive_value = "a-sensitive-health-response"

    mock_responses = {unknown_key: sensitive_value}

    with caplog.at_level(logging.WARNING, logger="app.services.normalizer"):
        normalize_assessment_responses(mock_responses)

    # The field name should appear in the log (to detect drift)
    assert any(unknown_key in record.message for record in caplog.records)
    # The actual value must NOT appear in any log record
    assert not any(sensitive_value in record.message for record in caplog.records)


def test_normalizer_does_not_log_answer_values(caplog):
    """
    For known fields, the normalizer should log nothing about the actual
    response values. Logging is debug-level only (about structure, not values).
    """
    mock_responses = {
        "age_years": 25,
        "smoking_status": "Regular",
        "perceived_stress_pss10": 20,
    }
    with caplog.at_level(logging.WARNING, logger="app.services.normalizer"):
        normalize_assessment_responses(mock_responses)

    # At WARNING level, there should be no output for fully mapped responses
    assert len(caplog.records) == 0


# ===========================================================================
# TEST 9 — Integration: existing completion API contract is unchanged
# ===========================================================================

def test_completion_endpoint_integration():
    """
    Verifies that importing the normalizer into the assessment router does NOT
    break the existing test infrastructure (db override, auth override, etc.).
    This test validates backward compatibility by importing the router module
    after the normalizer has been injected.
    """
    # This import will fail if the normalizer integration broke the router module
    from app.routers.assessment import router as assessment_router

    # Verify the router still has all expected routes
    route_paths = [route.path for route in assessment_router.routes]

    assert any("/complete" in p for p in route_paths), "complete endpoint must still exist"
    assert any("/responses" in p for p in route_paths), "responses endpoint must still exist"
    assert any("{assessment_id}" in p for p in route_paths), "session ID routing must still exist"


# ===========================================================================
# Additional edge cases
# ===========================================================================

def test_whitespace_trimming_in_string_values():
    """String values with leading/trailing whitespace should be stripped."""
    mock_responses = {
        "smoking_status": "  Never  ",
        "bmi_category": "\tOverweight\n",
    }
    result = normalize_assessment_responses(mock_responses)
    assert result.lifestyle_behaviors["smoking_status"] == "Never"
    assert result.demographics["bmi_category"] == "Overweight"


def test_all_86_question_ids_are_mapped():
    """
    Every question ID extracted from the questionnaire schema document
    must be present in QUESTION_DOMAIN_MAP (completeness check).
    """
    # These are ALL 86 question IDs from assessment_questions_document.md
    expected_ids = {
        # Block 1
        "age_years", "bmi_category", "city_region", "residential_area_type",
        "occupation_type", "education_level", "relationship_status",
        # Block 2
        "smoking_status", "alcohol_frequency", "recreational_drug_use",
        "physical_activity_level", "hours_sitting_per_day", "irregular_sleep", "sleep_duration",
        # Block 3
        "laptop_on_lap", "mobile_phone_placement", "underwear_type",
        "hot_bath_frequency", "working_in_hot_conditions", "cycling_hours_per_week",
        # Block 4
        "diet_type", "fruit_veg_intake", "processed_food_frequency",
        "fried_food_frequency", "soy_phytoestrogen_intake", "water_intake", "supplement_use",
        # Block 5
        "proximity_to_industrial_or_traffic", "pesticide_occupational_exposure",
        "heavy_metal_occupational_exposure", "plastic_use_hot_food_water", "emf_radiation_at_work",
        # Block 6
        "daily_work_hours", "perceived_stress_pss10", "gad7_score", "phq9_score",
        "sleep_quality_psqi_proxy",
        # Block 7
        "prior_sti_history", "scrotal_or_groin_injury", "childhood_disease_mumps",
        "known_varicocele", "sexual_abstinence_period_days", "libido_changes",
        "ejaculation_concerns",
        # Block 8
        "anabolic_steroid_use", "finasteride_use", "antidepressant_use_ssri",
        "antihypertensive_use", "chemotherapy_history", "other_long_term_medication",
        # Block 9
        "pornography_use_frequency", "perceived_control_over_use", "use_as_emotional_coping",
        "escalation_pattern", "negative_consequences_noticed", "attempts_to_cut_down_failed",
        "daily_time_on_sexual_content", "masturbation_frequency", "masturbation_frequency_change",
        "masturbation_control", "masturbation_functional_impact", "masturbation_physical_discomfort",
        "masturbation_emotional_coping",
        # Block 10
        "anticipatory_anxiety_before_sex", "primary_fear_type", "sexual_avoidance_due_to_fear",
        "partner_comparison_porn_vs_reality", "cognitive_self_monitoring_during_sex",
        "history_of_unexpected_sexual_difficulty", "pornography_driven_performance_standard",
        "partnered_sexual_history", "recent_partnered_sex", "partnered_sexual_difficulty",
        # Block 11
        "general_body_satisfaction", "physique_muscularity_pressure",
        "genital_self_image_concern", "social_media_body_comparison_frequency",
        # Block 12
        "relationship_satisfaction", "perceived_loneliness_ucla3",
        "family_communication_comfort", "peer_pressure_sexual_behavior",
        # Block 13
        "primary_stress_coping_method", "emotional_regulation_ability",
        "sleep_as_escape", "substance_use_under_stress", "mindfulness_or_meditation_practice",
    }
    missing = expected_ids - set(QUESTION_DOMAIN_MAP.keys())
    assert missing == set(), f"Question IDs missing from QUESTION_DOMAIN_MAP: {missing}"


def test_numeric_field_invalid_string_returns_none():
    """If a numeric slider field contains a non-numeric string, result should be None."""
    mock_responses = {"age_years": "not-a-number"}
    result = normalize_assessment_responses(mock_responses)
    assert result.demographics["age_years"] is None


def test_full_synthetic_assessment():
    """
    End-to-end test with a complete synthetic assessment (all domains represented).
    Verifies the structure of the output without checking for any risk scores.
    """
    full_synthetic = {
        # Demographics
        "age_years": "27", "bmi_category": "Normal", "city_region": "Pune",
        "residential_area_type": "Urban", "occupation_type": "Desk/sedentary",
        "education_level": "Graduate", "relationship_status": "Single",
        # Lifestyle
        "smoking_status": "Never", "alcohol_frequency": "Monthly",
        "recreational_drug_use": "No drug use", "physical_activity_level": "Moderate",
        "hours_sitting_per_day": "4-6", "irregular_sleep": "Sometimes",
        "sleep_duration": "7-9",
        # Heat
        "laptop_on_lap": "Occasionally", "mobile_phone_placement": "Front trouser pocket",
        "underwear_type": "Boxers", "hot_bath_frequency": "Never",
        "working_in_hot_conditions": "No", "cycling_hours_per_week": "0 (none)",
        # Diet
        "diet_type": "Non-vegetarian", "fruit_veg_intake": "1-2",
        "processed_food_frequency": "Few times/week", "fried_food_frequency": "Few times/week",
        "soy_phytoestrogen_intake": "Moderate", "water_intake": "2-3L",
        "supplement_use": ["Zinc", "Omega-3"],
        # Environmental
        "proximity_to_industrial_or_traffic": "No",
        "pesticide_occupational_exposure": "No",
        "heavy_metal_occupational_exposure": "No exposure",
        "plastic_use_hot_food_water": "Occasional",
        "emf_radiation_at_work": "No exposure",
        # Mental health
        "daily_work_hours": "8-10", "perceived_stress_pss10": "16",
        "gad7_score": "5", "phq9_score": "3",
        "sleep_quality_psqi_proxy": "Trouble falling asleep",
        # Reproductive
        "prior_sti_history": "No", "scrotal_or_groin_injury": "No",
        "childhood_disease_mumps": "No", "known_varicocele": "No",
        "sexual_abstinence_period_days": "2-7", "libido_changes": "Normal",
        "ejaculation_concerns": "No concerns",
        # Substance
        "anabolic_steroid_use": "Never", "finasteride_use": "No",
        "antidepressant_use_ssri": "No", "antihypertensive_use": "No",
        "chemotherapy_history": "No", "other_long_term_medication": "No other medication",
        # Digital / sexual behavior
        "pornography_use_frequency": "Monthly", "perceived_control_over_use": "Agree",
        "use_as_emotional_coping": "No", "escalation_pattern": "No",
        "negative_consequences_noticed": "No negative consequences",
        "attempts_to_cut_down_failed": "No",
        "daily_time_on_sexual_content": "<30 min",
        "masturbation_frequency": "1-2 times a week",
        "masturbation_frequency_change": "No significant change",
        "masturbation_control": "Never",
        "masturbation_functional_impact": "No impact",
        "masturbation_physical_discomfort": "No",
        "masturbation_emotional_coping": "Never",
        # Performance anxiety
        "anticipatory_anxiety_before_sex": "Sometimes",
        "primary_fear_type": "Other",
        "sexual_avoidance_due_to_fear": "No",
        "partner_comparison_porn_vs_reality": "No",
        "cognitive_self_monitoring_during_sex": "Disagree",
        "history_of_unexpected_sexual_difficulty": "No",
        "pornography_driven_performance_standard": "No",
        "partnered_sexual_history": "Yes",
        "recent_partnered_sex": "1-3 months ago",
        "partnered_sexual_difficulty": "No",
        # Body image
        "general_body_satisfaction": "4",
        "physique_muscularity_pressure": "Sometimes",
        "genital_self_image_concern": "No",
        "social_media_body_comparison_frequency": "Occasionally",
        # Social
        "relationship_satisfaction": "Not applicable",
        "perceived_loneliness_ucla3": "Moderate",
        "family_communication_comfort": "No",
        "peer_pressure_sexual_behavior": "No",
        # Coping
        "primary_stress_coping_method": "Exercise",
        "emotional_regulation_ability": "Somewhat",
        "sleep_as_escape": "No",
        "substance_use_under_stress": "No substance use",
        "mindfulness_or_meditation_practice": "No",
    }

    result = normalize_assessment_responses(full_synthetic)

    # All 13 domains populated
    assert result.demographics["age_years"] == 27      # numeric coercion applied
    assert isinstance(result.diet_nutrition["supplement_use"], list)
    assert result.mental_health_stress["perceived_stress_pss10"] == 16
    assert result.lifestyle_behaviors["smoking_status"] == "Never"
    # No scoring — nothing in the output resembles a risk score
    assert result.unmapped_fields == {}

    # Validate model — should serialize cleanly
    dumped = result.model_dump()
    assert "demographics" in dumped
    assert "unmapped_fields" in dumped
