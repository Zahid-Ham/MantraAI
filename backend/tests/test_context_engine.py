"""
Tests for app/services/context_engine.py
=========================================

PURPOSE
-------
Verifies the deterministic rules, factor extractions, clinical boundaries,
and data quality calculations in the Evidence-Informed Health Domain & Context Engine.

All tests use synthetic / mock questionnaire responses only.
No real user, patient, or clinical data is used.

COVERAGE:
  1.  Empty assessment
  2.  Completely missing fields (all None)
  3.  Single-domain response
  4.  Lifestyle context extraction
  5.  Reproductive context extraction
  6.  Sexual-health context extraction
  7.  Mental/behavioral context extraction
  8.  Environmental/heat context extraction
  9.  Substance/medication context extraction
  10. Modifiable factor extraction
  11. Positive factor extraction
  12. Follow-up flag extraction
  13. Multiple domains simultaneously (full synthetic profile)
  14. Unknown / unmapped values handling
  15. Invalid / malformed numeric values
  16. Partial assessment (sparse completion)
  17. Data-quality calculation (accurate count, completeness, missing)
  18. Every generated factor has valid source_question_ids
  19. No generated output contains fertility percentage or probability
  20. No generated output claims diagnosis or disease
  21. Determinism — identical input produces identical output
  22. Evidence tags presence and stability across factors
"""

import sys
import os
import json
import pytest

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.normalizer import normalize_assessment_responses, NormalizedAssessment
from app.services.context_engine import (
    build_health_context,
    HealthContext,
    FactorItem,
    CANONICAL_QUESTION_COUNT,
)


# ===========================================================================
# 1. Empty assessment test
# ===========================================================================
def test_empty_assessment():
    """An empty dictionary should yield a clean HealthContext without throwing errors."""
    raw = {}
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    assert isinstance(ctx, HealthContext)
    assert ctx.data_quality.answered_count == 0
    assert ctx.data_quality.expected_count == CANONICAL_QUESTION_COUNT
    assert ctx.data_quality.missing_count == CANONICAL_QUESTION_COUNT
    assert ctx.data_quality.completeness == 0.0
    assert len(ctx.modifiable_factors) == 0
    assert len(ctx.follow_up_flags) == 0


# ===========================================================================
# 2. Completely missing fields (all None)
# ===========================================================================
def test_all_none_fields():
    """Explicit None answers should be counted as missing and not trigger false positive/negative rules."""
    raw = {
        "smoking_status": None,
        "sleep_duration": None,
        "known_varicocele": None,
        "gad7_score": None,
        "phq9_score": None,
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    assert ctx.data_quality.answered_count == 0
    assert ctx.data_quality.missing_count == CANONICAL_QUESTION_COUNT
    assert len(ctx.modifiable_factors) == 0
    assert len(ctx.positive_factors) == 0
    assert len(ctx.follow_up_flags) == 0


# ===========================================================================
# 3. Single-domain response
# ===========================================================================
def test_single_domain_response():
    """Submitting only demographics answers should process smoothly without side effects."""
    raw = {
        "age_years": "28",
        "bmi_category": "Normal",
        "city_region": "Bengaluru",
        "residential_area_type": "Urban",
        "occupation_type": "Desk/sedentary",
        "education_level": "Graduate",
        "relationship_status": "Single",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    assert ctx.data_quality.answered_count == 7
    assert ctx.data_quality.expected_count == CANONICAL_QUESTION_COUNT
    assert ctx.data_quality.missing_count == CANONICAL_QUESTION_COUNT - 7
    assert ctx.data_quality.completeness == round(7 / float(CANONICAL_QUESTION_COUNT), 3)

    # Normal BMI generates a positive factor
    pos_ids = [f.id for f in ctx.positive_factors]
    assert "normal_bmi" in pos_ids


# ===========================================================================
# 4. Lifestyle context extraction
# ===========================================================================
def test_lifestyle_context_extraction():
    """Verifies extraction of sleep, physical activity, and nutrition factors."""
    raw = {
        "sleep_duration": "<5",
        "irregular_sleep": "Often",
        "physical_activity_level": "Sedentary",
        "hours_sitting_per_day": "6+",
        "fruit_veg_intake": "<1 serving/day",
        "processed_food_frequency": "Daily",
        "water_intake": "<1L",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    mod_ids = [f.id for f in ctx.modifiable_factors]
    assert "severe_sleep_deprivation" in mod_ids
    assert "circadian_sleep_irregularity" in mod_ids
    assert "sedentary_activity_level" in mod_ids
    assert "prolonged_daily_sitting" in mod_ids
    assert "low_antioxidant_intake" in mod_ids
    assert "daily_processed_food" in mod_ids
    assert "low_hydration" in mod_ids

    assert ctx.domains.lifestyle_wellness.sleep_status is not None
    assert "Severely deficient" in ctx.domains.lifestyle_wellness.sleep_status
    assert "Sedentary" in ctx.domains.lifestyle_wellness.physical_activity_status


# ===========================================================================
# 5. Reproductive context extraction
# ===========================================================================
def test_reproductive_context_extraction():
    """Verifies symptoms and historical conditions in the reproductive domain."""
    raw = {
        "known_varicocele": "Yes",
        "prior_sti_history": "Yes",
        "scrotal_or_groin_injury": "Yes",
        "ejaculation_concerns": ["Pain", "Blood"],
        "libido_changes": "Decreased",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    rep = ctx.domains.reproductive_health
    assert "Diagnosed varicocele" in rep.prior_conditions
    assert "Prior STI history" in rep.prior_conditions
    assert "Prior scrotal or groin injury" in rep.prior_conditions
    assert any("Pain or blood" in s for s in rep.reported_symptoms)

    fu_ids = [f.id for f in ctx.follow_up_flags]
    assert "known_varicocele_history" in fu_ids
    assert "ejaculation_symptom_flag" in fu_ids


# ===========================================================================
# 6. Sexual-health context extraction
# ===========================================================================
def test_sexual_health_context_extraction():
    """Verifies psychosexual factors, spectatoring, anxiety, and digital behavior."""
    raw = {
        "anticipatory_anxiety_before_sex": "Often",
        "cognitive_self_monitoring_during_sex": "Totally agree",
        "sexual_avoidance_due_to_fear": "Yes",
        "perceived_control_over_use": "Disagree",
        "negative_consequences_noticed": ["Sleep", "Relationship"],
        "masturbation_physical_discomfort": "Pain",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    mod_ids = [f.id for f in ctx.modifiable_factors]
    assert "anticipatory_intimacy_anxiety" in mod_ids
    assert "spectatoring_self_monitoring" in mod_ids
    assert "intimacy_avoidance_behavior" in mod_ids
    assert "perceived_loss_of_control_digital" in mod_ids
    assert "digital_behavior_functional_impact" in mod_ids

    fu_ids = [f.id for f in ctx.follow_up_flags]
    assert "physical_discomfort_symptom" in fu_ids


# ===========================================================================
# 7. Mental/behavioral context extraction
# ===========================================================================
def test_mental_behavioral_context_extraction():
    """Verifies stress, GAD-7/PHQ-9 screening proxy interpretation, and coping."""
    raw = {
        "perceived_stress_pss10": 28,
        "gad7_score": 12,
        "phq9_score": 11,
        "daily_work_hours": "10+",
        "primary_stress_coping_method": "Substance use",
        "substance_use_under_stress": "Smoking",
        "emotional_regulation_ability": "No",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    mod_ids = [f.id for f in ctx.modifiable_factors]
    assert "severe_perceived_stress" in mod_ids or "elevated_perceived_stress" in mod_ids
    assert "extended_work_hours" in mod_ids
    assert "maladaptive_stress_coping" in mod_ids
    assert "stress_triggered_substance_escalation" in mod_ids
    assert "difficult_emotional_regulation" in mod_ids

    fu_ids = [f.id for f in ctx.follow_up_flags]
    assert "elevated_anxiety_screening_proxy" in fu_ids
    assert "elevated_mood_screening_proxy" in fu_ids


# ===========================================================================
# 8. Environmental/heat context extraction
# ===========================================================================
def test_environmental_heat_context_extraction():
    """Verifies heat and occupational environmental factors."""
    raw = {
        "laptop_on_lap": "Daily",
        "underwear_type": "Compression shorts",
        "hot_bath_frequency": "Daily",
        "working_in_hot_conditions": "Yes",
        "pesticide_occupational_exposure": "Yes",
        "heavy_metal_occupational_exposure": "Welding",
        "plastic_use_hot_food_water": "Daily",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    mod_ids = [f.id for f in ctx.modifiable_factors]
    assert "laptop_on_lap_heat" in mod_ids
    assert "tight_underwear_heat" in mod_ids
    assert "frequent_hot_baths_sauna" in mod_ids
    assert "heated_plastic_exposure" in mod_ids

    flag_ids = [f.id for f in ctx.context_flags]
    assert "occupational_heat_exposure" in flag_ids

    fu_ids = [f.id for f in ctx.follow_up_flags]
    assert "occupational_pesticide_exposure" in fu_ids
    assert "heavy_metal_solvent_exposure" in fu_ids


# ===========================================================================
# 9. Substance/medication context extraction
# ===========================================================================
def test_substance_medication_context_extraction():
    """Verifies substance, steroid, and prescription medication rules."""
    raw = {
        "smoking_status": "Heavy (20+/day)",
        "alcohol_frequency": "Daily",
        "recreational_drug_use": "Steroids",
        "anabolic_steroid_use": "Current",
        "finasteride_use": "Yes",
        "antidepressant_use_ssri": "Yes",
        "antihypertensive_use": "Yes",
        "chemotherapy_history": "Yes",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    mod_ids = [f.id for f in ctx.modifiable_factors]
    assert "smoking_tobacco_use" in mod_ids
    assert "regular_alcohol_consumption" in mod_ids

    flag_ids = [f.id for f in ctx.context_flags]
    assert "finasteride_dutasteride_use" in flag_ids
    assert "ssri_antidepressant_use" in flag_ids
    assert "antihypertensive_medication" in flag_ids

    fu_ids = [f.id for f in ctx.follow_up_flags]
    assert "current_anabolic_steroid_use" in fu_ids
    assert "chemotherapy_radiation_history" in fu_ids


# ===========================================================================
# 10. Modifiable factor extraction
# ===========================================================================
def test_modifiable_factor_structure():
    """Verifies that every modifiable factor has id, domain, status, reason, source_question_ids, evidence_tags."""
    raw = {
        "sleep_duration": "<5",
        "smoking_status": "Regular",
        "physical_activity_level": "Sedentary",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    assert len(ctx.modifiable_factors) >= 3
    for factor in ctx.modifiable_factors:
        assert factor.id != ""
        assert factor.domain in [
            "reproductive_health",
            "sexual_health",
            "lifestyle_wellness",
            "environmental_heat",
            "mental_behavioral_wellness",
            "substance_medication",
        ]
        assert factor.type in ["modifiable", "context", "follow_up"]
        assert len(factor.source_question_ids) >= 1
        assert len(factor.reason) > 5
        assert len(factor.evidence_tags) >= 1


# ===========================================================================
# 11. Positive factor extraction
# ===========================================================================
def test_positive_factor_extraction():
    """Verifies healthy protective answers generate positive factors."""
    raw = {
        "sleep_duration": "7-9",
        "smoking_status": "Never",
        "physical_activity_level": "Moderate",
        "fruit_veg_intake": "3-5",
        "water_intake": "2-3L",
        "working_in_hot_conditions": "No",
        "known_varicocele": "No",
        "anabolic_steroid_use": "Never",
        "mindfulness_or_meditation_practice": "Yes (regular)",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    pos_ids = [f.id for f in ctx.positive_factors]
    assert "optimal_sleep_duration" in pos_ids
    assert "no_tobacco_smoking" in pos_ids
    assert "regular_physical_activity" in pos_ids
    assert "high_fruit_veg_intake" in pos_ids
    assert "adequate_hydration" in pos_ids
    assert "no_occupational_heat" in pos_ids
    assert "no_known_varicocele" in pos_ids
    assert "no_steroid_use" in pos_ids
    assert "regular_mindfulness_practice" in pos_ids

    for factor in ctx.positive_factors:
        assert factor.type == "positive"
        assert factor.status == "optimal"
        assert len(factor.source_question_ids) >= 1


# ===========================================================================
# 12. Follow-up flag extraction
# ===========================================================================
def test_follow_up_flags():
    """Verifies that clinical follow-up recommendations are generated for significant findings."""
    raw = {
        "known_varicocele": "Yes",
        "anabolic_steroid_use": "Current",
        "pesticide_occupational_exposure": "Yes",
        "chemotherapy_history": "Yes",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    fu_ids = [f.id for f in ctx.follow_up_flags]
    assert "known_varicocele_history" in fu_ids
    assert "current_anabolic_steroid_use" in fu_ids
    assert "occupational_pesticide_exposure" in fu_ids
    assert "chemotherapy_radiation_history" in fu_ids

    for f in ctx.follow_up_flags:
        assert f.type == "follow_up"
        assert len(f.source_question_ids) >= 1
        assert "discussion" in f.reason.lower() or "advised" in f.reason.lower() or "disruptor" in f.reason.lower() or "impact" in f.reason.lower()


# ===========================================================================
# 13. Multiple domains simultaneously
# ===========================================================================
def test_multiple_domains_simultaneously():
    """Verifies a realistic comprehensive synthetic response across all 13 blocks."""
    raw = {
        "age_years": 32,
        "bmi_category": "Normal",
        "city_region": "Pune",
        "residential_area_type": "Urban",
        "occupation_type": "Desk/sedentary",
        "education_level": "Postgraduate",
        "relationship_status": "Married",
        "smoking_status": "Never",
        "alcohol_frequency": "Monthly",
        "recreational_drug_use": "No drug use",
        "physical_activity_level": "Moderate",
        "hours_sitting_per_day": "4-6",
        "irregular_sleep": "Sometimes",
        "sleep_duration": "7-9",
        "laptop_on_lap": "Never",
        "mobile_phone_placement": "Bag",
        "underwear_type": "Boxers",
        "hot_bath_frequency": "Rarely",
        "working_in_hot_conditions": "No",
        "cycling_hours_per_week": "<2",
        "diet_type": "Vegetarian",
        "fruit_veg_intake": "3-5",
        "processed_food_frequency": "Rarely",
        "fried_food_frequency": "Rarely",
        "soy_phytoestrogen_intake": "Moderate",
        "water_intake": "2-3L",
        "supplement_use": "Zinc",
        "proximity_to_industrial_or_traffic": "No",
        "pesticide_occupational_exposure": "No",
        "heavy_metal_occupational_exposure": "No exposure",
        "plastic_use_hot_food_water": "Never",
        "emf_radiation_at_work": "No exposure",
        "daily_work_hours": "6-8",
        "perceived_stress_pss10": 10,
        "gad7_score": 3,
        "phq9_score": 2,
        "sleep_quality_psqi_proxy": "Feeling rested",
        "prior_sti_history": "No",
        "scrotal_or_groin_injury": "No",
        "childhood_disease_mumps": "No",
        "known_varicocele": "No",
        "sexual_abstinence_period_days": "2-7",
        "libido_changes": "Normal",
        "ejaculation_concerns": "No concerns",
        "anabolic_steroid_use": "Never",
        "finasteride_use": "No",
        "antidepressant_use_ssri": "No",
        "antihypertensive_use": "No",
        "chemotherapy_history": "No",
        "other_long_term_medication": "No other medication",
        "pornography_use_frequency": "Monthly",
        "perceived_control_over_use": "Totally agree",
        "use_as_emotional_coping": "No",
        "escalation_pattern": "No",
        "negative_consequences_noticed": "No negative consequences",
        "attempts_to_cut_down_failed": "No",
        "daily_time_on_sexual_content": "<30 min",
        "masturbation_frequency": "1-2 times a week",
        "masturbation_frequency_change": "No significant change",
        "masturbation_control": "Never",
        "masturbation_functional_impact": "No impact",
        "masturbation_physical_discomfort": "No",
        "masturbation_emotional_coping": "Never",
        "anticipatory_anxiety_before_sex": "Never",
        "primary_fear_type": "Other",
        "sexual_avoidance_due_to_fear": "No",
        "partner_comparison_porn_vs_reality": "No",
        "cognitive_self_monitoring_during_sex": "Totally disagree",
        "history_of_unexpected_sexual_difficulty": "No",
        "pornography_driven_performance_standard": "No",
        "partnered_sexual_history": "Yes",
        "recent_partnered_sex": "1-4 weeks ago",
        "partnered_sexual_difficulty": "No",
        "general_body_satisfaction": "4",
        "physique_muscularity_pressure": "No",
        "genital_self_image_concern": "No",
        "social_media_body_comparison_frequency": "Never",
        "relationship_satisfaction": "Satisfied",
        "perceived_loneliness_ucla3": "Low",
        "family_communication_comfort": "Yes",
        "peer_pressure_sexual_behavior": "No",
        "primary_stress_coping_method": "Exercise",
        "emotional_regulation_ability": "Yes",
        "sleep_as_escape": "No",
        "substance_use_under_stress": "No substance use",
        "mindfulness_or_meditation_practice": "Yes (regular)",
    }
    assert len(raw) == 86

    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    assert ctx.data_quality.answered_count == 86
    assert ctx.data_quality.completeness == 1.0
    assert ctx.data_quality.missing_count == 0
    assert ctx.data_quality.unmapped_count == 0

    assert len(ctx.positive_factors) >= 15
    assert len(ctx.follow_up_flags) == 0


# ===========================================================================
# 14. Unknown values
# ===========================================================================
def test_unknown_and_unmapped_values():
    """Unrecognized keys or options must not crash the engine and should be recorded in data quality."""
    raw = {
        "future_custom_field_xyz": "Some unexpected value",
        "another_unknown_key": 999,
        "smoking_status": "Unknown_Smoking_Category",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    assert ctx.data_quality.unmapped_count == 2
    # The unknown smoking category should not crash and won't match regular/heavy
    mod_ids = [f.id for f in ctx.modifiable_factors]
    assert "smoking_tobacco_use" not in mod_ids


# ===========================================================================
# 15. Invalid numeric values
# ===========================================================================
def test_invalid_numeric_values():
    """String values that fail numeric coercion must be treated safely as None without exceptions."""
    raw = {
        "perceived_stress_pss10": "invalid_stress_string",
        "gad7_score": "not_a_number",
        "phq9_score": None,
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    # Invalid numeric strings should become None during normalization
    assert norm.mental_health_stress["perceived_stress_pss10"] is None
    assert norm.mental_health_stress["gad7_score"] is None
    assert len(ctx.follow_up_flags) == 0


# ===========================================================================
# 16. Partial assessment
# ===========================================================================
def test_partial_assessment():
    """A partial assessment (e.g. 10 questions answered) calculates completeness correctly."""
    raw = {
        "age_years": 25,
        "smoking_status": "Regular",
        "sleep_duration": "5-7",
        "laptop_on_lap": "Often",
        "working_in_hot_conditions": "No",
        "pesticide_occupational_exposure": "No",
        "perceived_stress_pss10": 15,
        "known_varicocele": "No",
        "anabolic_steroid_use": "Never",
        "primary_stress_coping_method": "Exercise",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    assert ctx.data_quality.answered_count == 10
    assert ctx.data_quality.missing_count == 76
    assert ctx.data_quality.completeness == round(10 / 86.0, 3)

    mod_ids = [f.id for f in ctx.modifiable_factors]
    assert "smoking_tobacco_use" in mod_ids
    assert "suboptimal_sleep_duration" in mod_ids
    assert "laptop_on_lap_heat" in mod_ids


# ===========================================================================
# 17. Data-quality calculation
# ===========================================================================
def test_data_quality_calculation_detailed():
    """Tests edge cases of data quality calculation."""
    # 0 questions
    ctx_0 = build_health_context({})
    assert ctx_0.data_quality.answered_count == 0
    assert ctx_0.data_quality.completeness == 0.0

    # None input
    ctx_none = build_health_context(None)
    assert ctx_none.data_quality.answered_count == 0
    assert ctx_none.data_quality.completeness == 0.0


# ===========================================================================
# 18. Every generated factor has source_question_ids
# ===========================================================================
def test_all_factors_have_source_question_ids():
    """Every factor produced across all categories must reference at least one valid source question ID."""
    raw = {
        "bmi_category": "Obese",
        "smoking_status": "Heavy (20+/day)",
        "sleep_duration": "<5",
        "laptop_on_lap": "Daily",
        "working_in_hot_conditions": "Yes",
        "pesticide_occupational_exposure": "Yes",
        "known_varicocele": "Yes",
        "anabolic_steroid_use": "Current",
        "gad7_score": 14,
        "anticipatory_anxiety_before_sex": "Always",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    all_factors = (
        ctx.modifiable_factors
        + ctx.positive_factors
        + ctx.context_flags
        + ctx.follow_up_flags
    )

    assert len(all_factors) > 0
    for factor in all_factors:
        assert isinstance(factor.source_question_ids, list)
        assert len(factor.source_question_ids) >= 1
        for q_id in factor.source_question_ids:
            assert isinstance(q_id, str)
            assert len(q_id) > 0


# ===========================================================================
# 19. No generated output contains a fertility percentage
# ===========================================================================
def test_no_fertility_percentage_in_output():
    """Verifies that no text, reason, or schema field contains fertility percentage or prediction."""
    raw = {
        "age_years": 45,
        "smoking_status": "Heavy (20+/day)",
        "known_varicocele": "Yes",
        "anabolic_steroid_use": "Current",
        "sleep_duration": "<5",
        "working_in_hot_conditions": "Yes",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    # Dump full JSON representation
    ctx_json = ctx.model_dump_json()

    # Forbidden phrases
    forbidden_terms = [
        "fertility percentage",
        "fertility score",
        "fertility probability",
        "chance of conceiving",
        "infertility risk: high",
        "infertility percentage",
        "chance of pregnancy",
        "pregnancy probability",
    ]

    for term in forbidden_terms:
        assert term not in ctx_json.lower(), f"Forbidden fertility claim found: '{term}'"


# ===========================================================================
# 20. No generated output claims diagnosis
# ===========================================================================
def test_no_diagnosis_claims():
    """Verifies that output maintains non-diagnostic boundaries."""
    raw = {
        "gad7_score": 15,
        "phq9_score": 18,
        "known_varicocele": "Yes",
        "anticipatory_anxiety_before_sex": "Always",
        "partnered_sexual_difficulty": "Difficulty getting an erection",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    ctx_json = ctx.model_dump_json()

    # Engine must describe screening indicators, not make authoritative clinical diagnoses
    forbidden_diagnostic_claims = [
        "you have major depressive disorder",
        "you have generalized anxiety disorder",
        "you have erectile dysfunction disease",
        "diagnosed with clinical infertility",
    ]

    for claim in forbidden_diagnostic_claims:
        assert claim not in ctx_json.lower(), f"Forbidden diagnostic claim found: '{claim}'"


# ===========================================================================
# 21. Determinism — identical input produces identical output
# ===========================================================================
def test_determinism():
    """Running build_health_context multiple times on identical input must yield identical output."""
    raw = {
        "age_years": 30,
        "smoking_status": "Regular",
        "sleep_duration": "5-7",
        "laptop_on_lap": "Often",
        "known_varicocele": "Yes",
        "perceived_stress_pss10": 22,
        "gad7_score": 11,
    }

    norm1 = normalize_assessment_responses(raw)
    ctx1 = build_health_context(norm1)

    norm2 = normalize_assessment_responses(raw)
    ctx2 = build_health_context(norm2)

    assert ctx1.model_dump_json() == ctx2.model_dump_json()


# ===========================================================================
# 22. Evidence tags presence and stability
# ===========================================================================
def test_evidence_tags():
    """Every rule must produce meaningful evidence tags for downstream RAG retrieval."""
    raw = {
        "sleep_duration": "<5",
        "smoking_status": "Regular",
        "known_varicocele": "Yes",
        "anabolic_steroid_use": "Current",
        "laptop_on_lap": "Daily",
    }
    norm = normalize_assessment_responses(raw)
    ctx = build_health_context(norm)

    all_factors = ctx.modifiable_factors + ctx.follow_up_flags
    for factor in all_factors:
        assert len(factor.evidence_tags) >= 1
        for tag in factor.evidence_tags:
            assert isinstance(tag, str)
            assert len(tag) > 0
