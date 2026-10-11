"""
MantraAI — Evidence Grades & Clinical Constructs Mapping
=========================================================

PURPOSE
-------
Authoritative mapping of assessment factors and questionnaire items to their:
- Evidence Grade: A (guidelines/meta-analyses), B (multiple human studies),
  C (contextual/general wellness), D (inconsistent/uncertain evidence)
- Clinical Construct: 'reproductive' | 'sexual' | 'behavioral'
- counts_toward_attention: bool (whether factor contributes to overall clinical attention tier)

References: new.md (Evidence review of 86 questionnaire items)
"""

from typing import Any, Dict

# Threshold constants for overall assessment categorization
ATTENTION_THRESHOLD_FOLLOW_UPS = 1
ATTENTION_THRESHOLD_MODIFIABLE = 4
MONITORING_THRESHOLD_MODIFIABLE_MIN = 2
MONITORING_THRESHOLD_MODIFIABLE_MAX = 3

FACTOR_EVIDENCE_GRADES: Dict[str, Dict[str, Any]] = {
    # ── Reproductive Construct ───────────────────────────────────────────────
    # Modifiable Factors (Grade A / B)
    "smoking_tobacco_use": {
        "grade": "A",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Tobacco smoking status",
    },
    "regular_alcohol_consumption": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Alcohol intake frequency",
    },
    "elevated_bmi": {
        "grade": "A",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Overweight or obese BMI category",
    },
    "underweight_bmi": {
        "grade": "A",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Underweight BMI category",
    },
    "prolonged_daily_sitting": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Excessive daily sedentary time",
    },
    "laptop_on_lap_heat": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Potential localized heat exposure from laptop on lap",
    },
    "frequent_hot_baths_sauna": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Frequent hot tub or sauna exposure",
    },
    "extended_cycling_saddle_time": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Extended weekly cycling with saddle pressure and heat",
    },

    # Follow-Up Flags (Grade A / B)
    "current_anabolic_steroid_use": {
        "grade": "A",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Current or recent anabolic steroid exposure",
    },
    "known_varicocele_history": {
        "grade": "A",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "History of clinically identified varicocele",
    },
    "occupational_pesticide_exposure": {
        "grade": "A",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Occupational chemical/pesticide exposure",
    },
    "heavy_metal_solvent_exposure": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": True,
        "description": "Occupational heavy metals or solvent exposure",
    },

    # Context Flags (Not counted toward attention)
    "phone_front_pocket": {
        "grade": "D",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Mobile phone in front trouser pocket (evidence uncertain)",
    },
    "tight_underwear_heat": {
        "grade": "D",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Tight / compression underwear (evidence uncertain)",
    },
    "occupational_emf_radiation": {
        "grade": "D",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Workplace EMF radiation exposure (evidence uncertain)",
    },
    "occupational_heat_exposure": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Working in hot occupational environment",
    },
    "past_anabolic_steroid_use": {
        "grade": "A",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Past anabolic steroid exposure",
    },
    "finasteride_dutasteride_use": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "5-alpha reductase inhibitor medication use",
    },
    "ssri_antidepressant_use": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "SSRI antidepressant medication use",
    },
    "groin_trauma_history": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Past scrotal or groin physical trauma",
    },
    "prior_sti_reported": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "History of sexually transmitted infection",
    },
    "ejaculatory_volume_concern": {
        "grade": "A",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Perceived low semen volume",
    },
    "heated_plastic_exposure": {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Plastic container use with hot food or water",
    },

    # Protective / Positive Baselines (reproductive)
    "normal_bmi": {"grade": "A", "construct": "reproductive", "counts_toward_attention": False, "description": "Healthy BMI baseline"},
    "no_tobacco_smoking": {"grade": "A", "construct": "reproductive", "counts_toward_attention": False, "description": "No tobacco use"},
    "infrequent_or_no_alcohol": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "No or low alcohol consumption"},
    "no_recreational_drug_use": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "No recreational drug use"},
    "no_steroid_use": {"grade": "A", "construct": "reproductive", "counts_toward_attention": False, "description": "No steroid exposure"},
    "no_known_varicocele": {"grade": "A", "construct": "reproductive", "counts_toward_attention": False, "description": "No known varicocele"},
    "no_prior_sti": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "No STI history"},
    "no_groin_trauma": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "No groin trauma"},
    "no_laptop_lap_exposure": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "Laptop kept off lap"},
    "phone_stored_away": {"grade": "D", "construct": "reproductive", "counts_toward_attention": False, "description": "Phone stored away from groin"},
    "loose_underwear": {"grade": "D", "construct": "reproductive", "counts_toward_attention": False, "description": "Loose boxers worn"},
    "low_hyperthermia_exposure": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "Low thermal exposure"},
    "no_occupational_heat": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "No occupational heat exposure"},
    "no_pesticide_exposure": {"grade": "A", "construct": "reproductive", "counts_toward_attention": False, "description": "No occupational pesticide exposure"},
    "no_heavy_metal_exposure": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "No occupational heavy metal exposure"},
    "low_ambient_pollutant_exposure": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "Low ambient pollution"},
    "no_workplace_radiation": {"grade": "D", "construct": "reproductive", "counts_toward_attention": False, "description": "No workplace radiation"},
    "low_daily_sitting": {"grade": "B", "construct": "reproductive", "counts_toward_attention": False, "description": "Low sedentary time"},
    "no_ejaculation_concerns": {"grade": "A", "construct": "reproductive", "counts_toward_attention": False, "description": "No ejaculatory concerns"},

    # ── Sexual Health Construct ──────────────────────────────────────────────
    # Modifiable Factors (Grade B)
    "high_daily_screen_time_adult_content": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "High daily time on digital adult content",
    },
    "digital_content_emotional_coping": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Using adult content for emotional coping",
    },
    "perceived_loss_of_control_solo_behavior": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Difficulty moderating solo sexual behavior",
    },
    "perceived_loss_of_control_digital": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Difficulty moderating digital sexual content consumption",
    },
    "solo_behavior_functional_impact": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Daily life interference from solo behavior",
    },
    "digital_behavior_functional_impact": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Daily life interference from digital content",
    },
    "solo_behavior_emotional_coping": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Using solo sexual behavior for stress coping",
    },
    "difficulty_moderating_consumption": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Failed attempts to reduce digital content use",
    },
    "intimacy_avoidance_behavior": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Sexual avoidance due to performance anxiety",
    },
    "spectatoring_self_monitoring": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Cognitive spectatoring during sexual encounters",
    },
    "unrealistic_intimacy_comparisons": {
        "grade": "C",
        "construct": "sexual",
        "counts_toward_attention": False,
        "description": "Partner comparisons against digital media standards",
    },

    # Follow-Up Flags (Grade A / B)
    "physical_discomfort_symptom": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Physical pain or discomfort during ejaculation/masturbation",
    },
    "ejaculation_symptom_flag": {
        "grade": "A",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Painful ejaculation or significant ejaculatory dysfunction",
    },
    "partnered_sexual_difficulty_reported": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": True,
        "description": "Frequent partnered sexual difficulties",
    },

    # Context Flags (sexual)
    "libido_change_reported": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": False,
        "description": "Self-reported change in libido",
    },
    "unexpected_sexual_difficulty_history": {
        "grade": "B",
        "construct": "sexual",
        "counts_toward_attention": False,
        "description": "History of unexpected performance difficulties",
    },

    # Protective / Positive Baselines (sexual)
    "no_physical_discomfort_symptom": {"grade": "B", "construct": "sexual", "counts_toward_attention": False, "description": "No physical discomfort during solo sex"},
    "good_digital_habit_control": {"grade": "B", "construct": "sexual", "counts_toward_attention": False, "description": "Good perceived control over digital content"},
    "no_digital_negative_consequences": {"grade": "B", "construct": "sexual", "counts_toward_attention": False, "description": "No negative consequences from digital content"},
    "no_anticipatory_anxiety": {"grade": "B", "construct": "sexual", "counts_toward_attention": False, "description": "No anticipatory performance anxiety"},
    "no_partnered_sexual_difficulty": {"grade": "B", "construct": "sexual", "counts_toward_attention": False, "description": "No partnered sexual difficulty"},
    "stable_libido": {"grade": "B", "construct": "sexual", "counts_toward_attention": False, "description": "Stable libido baseline"},

    # ── Behavioral / Mental Wellness Construct ───────────────────────────────
    # Modifiable Factors (Grade A / B)
    "elevated_perceived_stress": {
        "grade": "A",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Moderate to high perceived stress rating",
    },
    "suboptimal_sleep_duration": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Short sleep duration (<6 hours)",
    },
    "severe_sleep_deprivation": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Severe sleep deprivation (<5 hours)",
    },
    "disrupted_sleep_quality": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Poor self-reported sleep quality screening",
    },
    "sedentary_activity_level": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Sedentary physical activity level",
    },
    "low_antioxidant_intake": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Low fruit and vegetable consumption",
    },
    "high_perceived_loneliness": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Elevated loneliness rating",
    },
    "genital_appearance_anxiety": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Significant body/genital image distress",
    },
    "maladaptive_stress_coping": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Maladaptive coping strategies under stress",
    },
    "difficult_emotional_regulation": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Difficulty regulating emotional responses",
    },
    "stress_triggered_substance_escalation": {
        "grade": "B",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "Substance use escalation under psychological stress",
    },

    # Modifiable Grade C (Not counted toward attention)
    "daily_fried_food": {
        "grade": "C",
        "construct": "behavioral",
        "counts_toward_attention": False,
        "description": "Daily fried food intake",
    },
    "daily_processed_food": {
        "grade": "C",
        "construct": "behavioral",
        "counts_toward_attention": False,
        "description": "Daily processed food intake",
    },
    "extended_work_hours": {
        "grade": "C",
        "construct": "behavioral",
        "counts_toward_attention": False,
        "description": "Long daily work hours (>10 hours)",
    },
    "sleep_avoidance_coping": {
        "grade": "C",
        "construct": "behavioral",
        "counts_toward_attention": False,
        "description": "Using excessive sleep as emotional escape",
    },
    "low_hydration": {
        "grade": "C",
        "construct": "behavioral",
        "counts_toward_attention": False,
        "description": "Water intake <1L daily (general wellness note only)",
    },

    # Follow-Up Flags (Grade A)
    "phq9_item9_safety_flag": {
        "grade": "A",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "PHQ-9 Item 9 crisis safety flag",
    },
    "elevated_mood_screening_proxy": {
        "grade": "A",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "PHQ-9 screening score >= 10 indicating professional discussion",
    },
    "elevated_anxiety_screening_proxy": {
        "grade": "A",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "GAD-7 screening score >= 10 indicating professional discussion",
    },
    "severe_perceived_stress": {
        "grade": "A",
        "construct": "behavioral",
        "counts_toward_attention": True,
        "description": "High perceived stress rating (>= 7/10)",
    },

    # Protective / Positive Baselines (behavioral)
    "low_perceived_stress": {"grade": "A", "construct": "behavioral", "counts_toward_attention": False, "description": "Low perceived stress"},
    "optimal_sleep_duration": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Optimal 7-9 hours sleep"},
    "restful_sleep": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Restful sleep quality"},
    "regular_physical_activity": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Regular physical exercise"},
    "high_fruit_veg_intake": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Frequent fruit and vegetable intake"},
    "low_fried_food": {"grade": "C", "construct": "behavioral", "counts_toward_attention": False, "description": "Rare fried food intake"},
    "low_processed_food": {"grade": "C", "construct": "behavioral", "counts_toward_attention": False, "description": "Rare processed food intake"},
    "adequate_hydration": {"grade": "C", "construct": "behavioral", "counts_toward_attention": False, "description": "Adequate daily water intake"},
    "no_genital_image_concern": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Positive body and genital image"},
    "strong_social_connection": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Low loneliness and strong social connection"},
    "healthy_stress_coping": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Healthy coping mechanisms under stress"},
    "effective_emotional_regulation": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Effective emotional regulation"},
    "no_stress_substance_escalation": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "No substance escalation under stress"},
    "regular_mindfulness_practice": {"grade": "B", "construct": "behavioral", "counts_toward_attention": False, "description": "Regular mindfulness or meditation practice"},
}


def get_factor_metadata(factor_id: str) -> Dict[str, Any]:
    """
    Returns the evidence grade, construct, and attention status for a factor ID.
    Falls back safely to conservative defaults if an unlisted factor is encountered.
    """
    if factor_id in FACTOR_EVIDENCE_GRADES:
        return FACTOR_EVIDENCE_GRADES[factor_id]

    # Conservative default for unknown factors
    return {
        "grade": "B",
        "construct": "reproductive",
        "counts_toward_attention": False,
        "description": "Uncategorized contextual factor",
    }


# Alias for backwards-compatibility with cycle_plan.py scaffolding
QUESTION_EVIDENCE_MAP = FACTOR_EVIDENCE_GRADES
