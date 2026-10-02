"""
MantraAI — Centralized Evidence Tag Taxonomy
=============================================

PURPOSE
-------
Provides a canonical registry and taxonomy of evidence tags used across
the Health Domain & Context Engine and the Evidence Retrieval Layer.

Centralizing tag names prevents ad-hoc string divergence and enables
deterministic, structured literature retrieval for clinical reports.
"""

from typing import Optional

# ---------------------------------------------------------------------------
# Canonical Evidence Tag Categories
# ---------------------------------------------------------------------------

REPRODUCTIVE_TAGS: set[str] = {
    "male_infertility_evaluation",
    "infertility_guideline",
    "semen_analysis",
    "semen_parameters",
    "varicocele",
    "varicocele_screening",
    "venous_stasis",
    "urology_consultation",
    "sti_history",
    "sti_screening",
    "reproductive_tract",
    "inflammatory_markers",
    "testicular_trauma",
    "testicular_trauma_screening",
    "tissue_integrity",
    "mumps_orchitis",
    "reproductive_history",
    "hematospermia",
    "ejaculatory_pain",
    "urology_followup",
    "ejaculatory_function",
    "accessory_gland_function",
    "ejaculatory_health",
    "libido",
    "libido_baseline",
    "androgen_balance",
    "psychosexual_context",
}

SEXUAL_HEALTH_TAGS: set[str] = {
    "performance_anxiety",
    "sympathetic_nervous_system",
    "psychosexual_health",
    "intimacy_confidence",
    "avoidance_behavior",
    "anxiety_cycles",
    "relational_intimacy",
    "spectatoring",
    "cognitive_focus",
    "autonomic_balance",
    "cognitive_standards",
    "media_expectations",
    "erectile_function",
    "vascular_nervous_factors",
    "partnered_sexual_function",
    "clinical_consultation",
    "behavioral_control",
    "digital_habits",
    "dopamine_reward",
    "habit_formation",
    "behavioral_support",
    "functional_impact",
    "digital_wellness",
    "screen_time",
    "behavioral_habits",
    "emotional_coping",
    "behavioral_reinforcement",
    "genital_discomfort",
    "physical_symptoms",
    "clinical_review",
    "physical_comfort",
    "wellness_guidance",
    "lifestyle_balance",
    "emotional_regulation",
    "coping_strategies",
}

LIFESTYLE_TAGS: set[str] = {
    "bmi",
    "metabolic_health",
    "sleep_duration",
    "recovery",
    "endocrine_balance",
    "sleep_hygiene",
    "circadian_rhythm",
    "physical_activity",
    "cardiovascular_fitness",
    "sedentary_behavior",
    "circulation",
    "dietary_antioxidants",
    "micronutrients",
    "oxidative_stress",
    "processed_foods",
    "trans_fats",
    "lipid_profile",
    "inflammation",
    "diet_quality",
    "hydration",
    "cellular_function",
    "fluid_balance",
}

ENVIRONMENTAL_HEAT_TAGS: set[str] = {
    "hyperthermia",
    "hyperthermia_prevention",
    "device_heat",
    "scrotal_temperature",
    "clothing_thermal_insulation",
    "heat_exposure",
    "spermatogenesis_thermoregulation",
    "occupational_heat",
    "workplace_environment",
    "occupational_health",
    "cycling",
    "saddle_pressure",
    "perineal_circulation",
    "particulate_matter",
    "air_pollution",
    "environmental_toxins",
    "environmental_health",
    "organophosphates",
    "pesticides",
    "endocrine_disruptors",
    "heavy_metals",
    "lead_cadmium",
    "solvent_toxicity",
    "bisphenol_a",
    "microplastics",
    "phthalates",
    "endocrine_protection",
    "device_proximity",
    "emf_radiofrequency",
    "ionizing_radiation",
    "occupational_emf",
}

MENTAL_WELLNESS_TAGS: set[str] = {
    "workplace_stress",
    "fatigue",
    "recovery_cycles",
    "stress",
    "cortisol",
    "hpa_axis",
    "stress_resilience",
    "anxiety",
    "autonomic_regulation",
    "sympathetic_tone",
    "mood_screening",
    "somatic_strain",
    "psychological_wellbeing",
    "sleep_quality",
    "sleep_architecture",
    "stress_coping",
    "behavioral_loops",
    "adaptive_coping",
    "resilience",
    "cortisol_stability",
    "avoidance_coping",
    "behavioral_health",
    "stress_substance_loop",
    "metabolic_strain",
    "healthy_coping",
    "mindfulness",
    "parasympathetic_tone",
    "heart_rate_variability",
    "social_isolation",
    "loneliness",
    "social_support",
    "genital_self_image",
    "body_confidence",
    "body_image",
    "self_esteem",
    "body_pressure",
    "relational_support",
    "stress_buffer",
    "relational_stress",
    "peer_pressure",
}

SUBSTANCE_MEDICATION_TAGS: set[str] = {
    "tobacco",
    "nicotine",
    "tobacco_abstinence",
    "vascular_health",
    "alcohol",
    "alcohol_moderation",
    "cannabis",
    "cannabinoids",
    "endocrine_signaling",
    "anabolic_steroids",
    "anabolic_androgenic_steroids",
    "hypogonadotropic_hypogonadism",
    "endocrine_suppression",
    "testosterone",
    "endocrine_history",
    "endocrine_protection",
    "substance_abstinence",
    "5_alpha_reductase_inhibitors",
    "finasteride",
    "dht_modulation",
    "ssri",
    "serotonin",
    "sexual_function",
    "antihypertensive",
    "cardiovascular",
    "vascular_resistance",
    "chemotherapy",
    "gonadotoxicity",
    "radiation_therapy",
}

# Master lookup of all canonical evidence tags mapped to their primary domain
ALL_CANONICAL_TAGS: dict[str, str] = {}
for tag in REPRODUCTIVE_TAGS:
    ALL_CANONICAL_TAGS[tag] = "reproductive_health"
for tag in SEXUAL_HEALTH_TAGS:
    ALL_CANONICAL_TAGS[tag] = "sexual_health"
for tag in LIFESTYLE_TAGS:
    ALL_CANONICAL_TAGS[tag] = "lifestyle_wellness"
for tag in ENVIRONMENTAL_HEAT_TAGS:
    ALL_CANONICAL_TAGS[tag] = "environmental_heat"
for tag in MENTAL_WELLNESS_TAGS:
    ALL_CANONICAL_TAGS[tag] = "mental_behavioral_wellness"
for tag in SUBSTANCE_MEDICATION_TAGS:
    ALL_CANONICAL_TAGS[tag] = "substance_medication"


def get_tag_domain(tag: str) -> Optional[str]:
    """Return the canonical domain name for an evidence tag, or None if unrecognized."""
    return ALL_CANONICAL_TAGS.get(tag.strip().lower())


def is_valid_tag(tag: str) -> bool:
    """Return True if tag exists in canonical taxonomy."""
    return tag.strip().lower() in ALL_CANONICAL_TAGS
