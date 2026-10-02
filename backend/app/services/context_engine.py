"""
MantraAI — Evidence-Informed Health Domain & Context Engine
============================================================

PURPOSE
-------
This service provides a deterministic, modular context engine that transforms
normalized assessment responses (from `normalizer.py`) into structured health context.
The resulting health context is designed for subsequent consumption by the Evidence/RAG
retrieval layer and Groq report generation.

CORE CLINICAL & ETHICAL BOUNDARIES
-----------------------------------
- NOT a clinical diagnostic engine.
- Does NOT produce medical diagnoses or infer pathological conditions.
- Does NOT calculate infertility probabilities or generate fertility percentages.
- Does NOT claim that the questionnaire predicts fertility.
- Does NOT train, load, or use machine learning models.
- Does NOT use synthetic dataset records for predictive modeling.
- All evaluation rules are deterministic, explainable, and trace directly to
  canonical questionnaire fields with evidence tags for future literature retrieval.

ARCHITECTURAL PIPELINE
----------------------
  normalized questionnaire responses (NormalizedAssessment)
             ↓
  deterministic domain / context rules
             ↓
  structured health context (HealthContext)
             ↓
  [Future: Evidence Retrieval / RAG + Groq Report Synthesis]
"""

import logging
from typing import Any, Optional, Union
from pydantic import BaseModel, Field

from app.services.normalizer import NormalizedAssessment, normalize_assessment_responses, QUESTION_DOMAIN_MAP

logger = logging.getLogger(__name__)

# Canonical total question count
CANONICAL_QUESTION_COUNT = 86

# ---------------------------------------------------------------------------
# Pydantic Schemas for Structured Health Context
# ---------------------------------------------------------------------------

class FactorItem(BaseModel):
    """
    Represents an explainable contextual factor (modifiable, positive, context flag,
    or follow-up recommendation) derived deterministically from questionnaire answers.
    """
    id: str = Field(..., description="Stable unique identifier for the factor rule.")
    domain: str = Field(..., description="Health domain this factor belongs to.")
    type: str = Field(..., description="Classification: 'modifiable', 'positive', 'context', or 'follow_up'.")
    status: str = Field("flagged", description="Status code: 'flagged', 'optimal', 'present', 'noted', etc.")
    source_question_ids: list[str] = Field(default_factory=list, description="Exact question IDs that triggered this factor.")
    reason: str = Field(..., description="Short, factual, non-diagnostic explanation.")
    evidence_tags: list[str] = Field(default_factory=list, description="Tags for downstream literature/evidence retrieval.")


class ReproductiveHealthContext(BaseModel):
    """Structured context for reproductive history and physical symptoms."""
    reported_symptoms: list[str] = Field(default_factory=list)
    prior_conditions: list[str] = Field(default_factory=list)
    signals: list[str] = Field(default_factory=list)
    source_question_ids: list[str] = Field(default_factory=list)
    evidence_tags: list[str] = Field(default_factory=list)
    summary_notes: list[str] = Field(default_factory=list)


class SexualHealthContext(BaseModel):
    """Structured context for psychosexual wellbeing, intimacy, and digital habits."""
    performance_concerns: list[str] = Field(default_factory=list)
    behavioral_patterns: list[str] = Field(default_factory=list)
    signals: list[str] = Field(default_factory=list)
    source_question_ids: list[str] = Field(default_factory=list)
    evidence_tags: list[str] = Field(default_factory=list)
    summary_notes: list[str] = Field(default_factory=list)


class LifestyleWellnessContext(BaseModel):
    """Structured context for daily movement, sleep duration, nutrition, and hydration."""
    sleep_status: Optional[str] = None
    physical_activity_status: Optional[str] = None
    sedentary_status: Optional[str] = None
    diet_pattern: Optional[str] = None
    hydration_status: Optional[str] = None
    signals: list[str] = Field(default_factory=list)
    source_question_ids: list[str] = Field(default_factory=list)
    evidence_tags: list[str] = Field(default_factory=list)
    summary_notes: list[str] = Field(default_factory=list)


class EnvironmentalHeatContext(BaseModel):
    """Structured context for hyperthermia risk vectors and environmental exposures."""
    heat_exposures: list[str] = Field(default_factory=list)
    environmental_exposures: list[str] = Field(default_factory=list)
    signals: list[str] = Field(default_factory=list)
    source_question_ids: list[str] = Field(default_factory=list)
    evidence_tags: list[str] = Field(default_factory=list)
    summary_notes: list[str] = Field(default_factory=list)


class MentalBehavioralWellnessContext(BaseModel):
    """Structured context for stress levels, coping mechanisms, and mood indicators."""
    stress_context: Optional[str] = None
    mood_anxiety_context: Optional[str] = None
    coping_patterns: list[str] = Field(default_factory=list)
    signals: list[str] = Field(default_factory=list)
    source_question_ids: list[str] = Field(default_factory=list)
    evidence_tags: list[str] = Field(default_factory=list)
    summary_notes: list[str] = Field(default_factory=list)


class SubstanceMedicationContext(BaseModel):
    """Structured context for tobacco, alcohol, medications, and substance exposures."""
    substance_exposures: list[str] = Field(default_factory=list)
    medication_exposures: list[str] = Field(default_factory=list)
    signals: list[str] = Field(default_factory=list)
    source_question_ids: list[str] = Field(default_factory=list)
    evidence_tags: list[str] = Field(default_factory=list)
    summary_notes: list[str] = Field(default_factory=list)


class DomainsContainer(BaseModel):
    """Container grouping all six conceptual domain context models."""
    reproductive_health: ReproductiveHealthContext = Field(default_factory=ReproductiveHealthContext)
    sexual_health: SexualHealthContext = Field(default_factory=SexualHealthContext)
    lifestyle_wellness: LifestyleWellnessContext = Field(default_factory=LifestyleWellnessContext)
    environmental_heat: EnvironmentalHeatContext = Field(default_factory=EnvironmentalHeatContext)
    mental_behavioral_wellness: MentalBehavioralWellnessContext = Field(default_factory=MentalBehavioralWellnessContext)
    substance_medication: SubstanceMedicationContext = Field(default_factory=SubstanceMedicationContext)


class DataQuality(BaseModel):
    """Data quality and completeness indicators for the submitted assessment."""
    answered_count: int = Field(0, description="Total canonical questions answered with a non-None value.")
    expected_count: int = Field(CANONICAL_QUESTION_COUNT, description="Total canonical questions in schema.")
    missing_count: int = Field(CANONICAL_QUESTION_COUNT, description="Count of canonical questions not answered.")
    unmapped_count: int = Field(0, description="Count of unexpected / unmapped question fields received.")
    completeness: float = Field(0.0, description="Proportion of expected questions answered (0.0 to 1.0).")


class HealthContext(BaseModel):
    """
    Top-level structured health context object output by the context engine.
    """
    domains: DomainsContainer = Field(default_factory=DomainsContainer)
    modifiable_factors: list[FactorItem] = Field(default_factory=list)
    positive_factors: list[FactorItem] = Field(default_factory=list)
    context_flags: list[FactorItem] = Field(default_factory=list)
    follow_up_flags: list[FactorItem] = Field(default_factory=list)
    data_quality: DataQuality = Field(default_factory=DataQuality)

    @property
    def evidence_tags(self) -> list[str]:
        """Aggregate all deduplicated, sorted evidence tags across all factors and domain contexts."""
        tags: set[str] = set()
        for f in self.modifiable_factors:
            tags.update(f.evidence_tags)
        for f in self.positive_factors:
            tags.update(f.evidence_tags)
        for f in self.context_flags:
            tags.update(f.evidence_tags)
        for f in self.follow_up_flags:
            tags.update(f.evidence_tags)
        tags.update(self.domains.reproductive_health.evidence_tags)
        tags.update(self.domains.sexual_health.evidence_tags)
        tags.update(self.domains.lifestyle_wellness.evidence_tags)
        tags.update(self.domains.environmental_heat.evidence_tags)
        tags.update(self.domains.mental_behavioral_wellness.evidence_tags)
        tags.update(self.domains.substance_medication.evidence_tags)
        return sorted(list(tags))


# ---------------------------------------------------------------------------
# Internal Helper Utilities for Clean Rule Evaluation
# ---------------------------------------------------------------------------

def _val_equals(val: Any, target: str) -> bool:
    """Case-insensitive safe string equality comparison."""
    if val is None:
        return False
    if isinstance(val, str):
        return val.strip().lower() == target.strip().lower()
    return False


def _val_in(val: Any, targets: list[str]) -> bool:
    """Check if value equals any target string in list (case-insensitive)."""
    if val is None:
        return False
    if isinstance(val, str):
        v_clean = val.strip().lower()
        return any(v_clean == t.strip().lower() for t in targets)
    if isinstance(val, list):
        cleaned_list = [item.strip().lower() for item in val if isinstance(item, str)]
        return any(t.strip().lower() in cleaned_list for t in targets)
    return False


def _val_contains(val: Any, target: str) -> bool:
    """Check if string or list contains target (case-insensitive)."""
    if val is None:
        return False
    target_clean = target.strip().lower()
    if isinstance(val, str):
        return target_clean in val.strip().lower()
    if isinstance(val, list):
        return any(target_clean == item.strip().lower() for item in val if isinstance(item, str))
    return False


# ---------------------------------------------------------------------------
# Domain Rule Evaluator: Reproductive Health
# ---------------------------------------------------------------------------

def _evaluate_reproductive_health(
    norm: NormalizedAssessment
) -> tuple[ReproductiveHealthContext, list[FactorItem], list[FactorItem], list[FactorItem], list[FactorItem]]:
    ctx = ReproductiveHealthContext()
    modifiable: list[FactorItem] = []
    positive: list[FactorItem] = []
    flags: list[FactorItem] = []
    follow_ups: list[FactorItem] = []

    rep = norm.reproductive_history_symptoms

    varicocele = rep.get("known_varicocele")
    sti = rep.get("prior_sti_history")
    injury = rep.get("scrotal_or_groin_injury")
    mumps = rep.get("childhood_disease_mumps")
    ejac = rep.get("ejaculation_concerns")
    libido = rep.get("libido_changes")
    abstinence = rep.get("sexual_abstinence_period_days")

    # Varicocele
    if _val_equals(varicocele, "Yes"):
        ctx.prior_conditions.append("Diagnosed varicocele")
        ctx.source_question_ids.append("known_varicocele")
        ctx.evidence_tags.extend(["varicocele", "venous_stasis", "hyperthermia", "urology_consultation"])
        flag = FactorItem(
            id="known_varicocele_history",
            domain="reproductive_health",
            type="follow_up",
            status="flagged",
            source_question_ids=["known_varicocele"],
            reason="Reported diagnosis of varicocele (dilated scrotal veins); discussion with a urologist or andrologist is advised.",
            evidence_tags=["varicocele", "venous_stasis", "urology_consultation"]
        )
        flags.append(flag)
        follow_ups.append(flag)
    elif _val_equals(varicocele, "No"):
        positive.append(FactorItem(
            id="no_known_varicocele",
            domain="reproductive_health",
            type="positive",
            status="optimal",
            source_question_ids=["known_varicocele"],
            reason="No known varicocele reported.",
            evidence_tags=["varicocele_screening"]
        ))

    # Prior STI
    if _val_equals(sti, "Yes"):
        ctx.prior_conditions.append("Prior STI history")
        ctx.source_question_ids.append("prior_sti_history")
        ctx.evidence_tags.extend(["sti_history", "reproductive_tract", "inflammatory_markers"])
        flags.append(FactorItem(
            id="prior_sti_reported",
            domain="reproductive_health",
            type="context",
            status="noted",
            source_question_ids=["prior_sti_history"],
            reason="Reported history of sexually transmitted infection, which provides relevant clinical tract context.",
            evidence_tags=["sti_history", "reproductive_tract"]
        ))
    elif _val_equals(sti, "No"):
        positive.append(FactorItem(
            id="no_prior_sti",
            domain="reproductive_health",
            type="positive",
            status="optimal",
            source_question_ids=["prior_sti_history"],
            reason="No history of sexually transmitted infections reported.",
            evidence_tags=["sti_screening"]
        ))

    # Scrotal/Groin Injury
    if _val_equals(injury, "Yes"):
        ctx.prior_conditions.append("Prior scrotal or groin injury")
        ctx.source_question_ids.append("scrotal_or_groin_injury")
        ctx.evidence_tags.extend(["testicular_trauma", "tissue_integrity"])
        flags.append(FactorItem(
            id="groin_trauma_history",
            domain="reproductive_health",
            type="context",
            status="noted",
            source_question_ids=["scrotal_or_groin_injury"],
            reason="Reported history of significant physical trauma or injury to the groin or testicles.",
            evidence_tags=["testicular_trauma", "tissue_integrity"]
        ))
    elif _val_equals(injury, "No"):
        positive.append(FactorItem(
            id="no_groin_trauma",
            domain="reproductive_health",
            type="positive",
            status="optimal",
            source_question_ids=["scrotal_or_groin_injury"],
            reason="No history of scrotal or groin physical trauma reported.",
            evidence_tags=["testicular_trauma_screening"]
        ))

    # Childhood Mumps
    if _val_equals(mumps, "Yes"):
        ctx.prior_conditions.append("Childhood or adolescent mumps")
        ctx.source_question_ids.append("childhood_disease_mumps")
        ctx.evidence_tags.extend(["mumps_orchitis", "reproductive_history"])
        flags.append(FactorItem(
            id="childhood_mumps_history",
            domain="reproductive_health",
            type="context",
            status="noted",
            source_question_ids=["childhood_disease_mumps"],
            reason="Reported mumps infection during childhood or adolescence.",
            evidence_tags=["mumps_orchitis", "reproductive_history"]
        ))

    # Ejaculation Concerns
    if ejac is not None:
        ctx.source_question_ids.append("ejaculation_concerns")
        if _val_contains(ejac, "Blood") or _val_contains(ejac, "Pain"):
            ctx.reported_symptoms.append("Pain or blood in ejaculate")
            ctx.evidence_tags.extend(["hematospermia", "ejaculatory_pain", "urology_followup"])
            fu_flag = FactorItem(
                id="ejaculation_symptom_flag",
                domain="reproductive_health",
                type="follow_up",
                status="flagged",
                source_question_ids=["ejaculation_concerns"],
                reason="Reported pain or blood during ejaculation — warrants direct professional evaluation by a urologist.",
                evidence_tags=["hematospermia", "ejaculatory_pain", "urology_followup"]
            )
            flags.append(fu_flag)
            follow_ups.append(fu_flag)
        elif _val_contains(ejac, "Retrograde") or _val_contains(ejac, "Low volume"):
            ctx.reported_symptoms.append("Ejaculate volume or retrograde concern")
            flags.append(FactorItem(
                id="ejaculatory_volume_concern",
                domain="reproductive_health",
                type="context",
                status="noted",
                source_question_ids=["ejaculation_concerns"],
                reason="Reported concern regarding ejaculate volume or retrograde flow.",
                evidence_tags=["ejaculatory_function", "accessory_gland_function"]
            ))
        elif _val_contains(ejac, "No concerns") or _val_equals(ejac, "No concerns"):
            positive.append(FactorItem(
                id="no_ejaculation_concerns",
                domain="reproductive_health",
                type="positive",
                status="optimal",
                source_question_ids=["ejaculation_concerns"],
                reason="No ejaculatory pain, bleeding, or volume symptoms reported.",
                evidence_tags=["ejaculatory_health"]
            ))

    # Libido Changes
    if _val_in(libido, ["Decreased", "Fluctuating"]):
        ctx.reported_symptoms.append("Decreased or fluctuating libido")
        ctx.source_question_ids.append("libido_changes")
        ctx.evidence_tags.extend(["libido", "androgen_balance", "psychosexual_context"])
        flags.append(FactorItem(
            id="libido_change_reported",
            domain="reproductive_health",
            type="context",
            status="noted",
            source_question_ids=["libido_changes"],
            reason="Reported recent decrease or fluctuation in libido/sexual desire.",
            evidence_tags=["libido", "androgen_balance"]
        ))
    elif _val_equals(libido, "Normal"):
        positive.append(FactorItem(
            id="stable_libido",
            domain="reproductive_health",
            type="positive",
            status="optimal",
            source_question_ids=["libido_changes"],
            reason="Normal, consistent libido reported.",
            evidence_tags=["libido_baseline"]
        ))

    # Abstinence Period Context
    if abstinence is not None and not _val_equals(abstinence, "prefer_not_to_say"):
        ctx.signals.append(f"Usual abstinence window: {abstinence} days")
        ctx.source_question_ids.append("sexual_abstinence_period_days")

    if ctx.reported_symptoms:
        ctx.summary_notes.append("Active reproductive physical symptoms noted for clinical awareness.")
    elif ctx.prior_conditions:
        ctx.summary_notes.append("Historical reproductive background factors recorded.")
    else:
        ctx.summary_notes.append("No adverse reproductive symptoms or prior conditions reported.")

    # Deduplicate source_question_ids and evidence_tags
    ctx.source_question_ids = sorted(list(set(ctx.source_question_ids)))
    ctx.evidence_tags = sorted(list(set(ctx.evidence_tags)))

    return ctx, modifiable, positive, flags, follow_ups


# ---------------------------------------------------------------------------
# Domain Rule Evaluator: Sexual Health & Behavior
# ---------------------------------------------------------------------------

def _evaluate_sexual_health(
    norm: NormalizedAssessment
) -> tuple[SexualHealthContext, list[FactorItem], list[FactorItem], list[FactorItem], list[FactorItem]]:
    ctx = SexualHealthContext()
    modifiable: list[FactorItem] = []
    positive: list[FactorItem] = []
    flags: list[FactorItem] = []
    follow_ups: list[FactorItem] = []

    dig = norm.digital_sexual_behavior
    anx = norm.sexual_performance_anxiety

    # Digital sexual behavior & control
    control_use = dig.get("perceived_control_over_use")
    cut_down = dig.get("attempts_to_cut_down_failed")
    neg_consequences = dig.get("negative_consequences_noticed")
    daily_time = dig.get("daily_time_on_sexual_content")
    coping_dig = dig.get("use_as_emotional_coping")
    escalation = dig.get("escalation_pattern")

    mast_ctrl = dig.get("masturbation_control")
    mast_impact = dig.get("masturbation_functional_impact")
    mast_discomfort = dig.get("masturbation_physical_discomfort")
    mast_coping = dig.get("masturbation_emotional_coping")

    # Perceived control over digital media
    if _val_in(control_use, ["Disagree", "Totally disagree"]):
        ctx.behavioral_patterns.append("Reduced perceived control over digital adult content")
        ctx.source_question_ids.append("perceived_control_over_use")
        ctx.evidence_tags.extend(["behavioral_control", "digital_habits", "dopamine_reward"])
        modifiable.append(FactorItem(
            id="perceived_loss_of_control_digital",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["perceived_control_over_use"],
            reason="Reports feeling low perceived control over digital content habits.",
            evidence_tags=["behavioral_control", "digital_habits"]
        ))
    elif _val_in(control_use, ["Totally agree", "Agree"]):
        positive.append(FactorItem(
            id="good_digital_habit_control",
            domain="sexual_health",
            type="positive",
            status="optimal",
            source_question_ids=["perceived_control_over_use"],
            reason="Reports strong perceived control over digital consumption habits.",
            evidence_tags=["behavioral_control"]
        ))

    if _val_equals(cut_down, "Yes"):
        ctx.behavioral_patterns.append("Difficulty moderating digital consumption")
        ctx.source_question_ids.append("attempts_to_cut_down_failed")
        modifiable.append(FactorItem(
            id="difficulty_moderating_consumption",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["attempts_to_cut_down_failed"],
            reason="Reports past difficulty maintaining desired reductions in digital content use.",
            evidence_tags=["habit_formation", "behavioral_support"]
        ))

    if neg_consequences is not None and not _val_in(neg_consequences, ["No negative consequences", "none"]):
        ctx.behavioral_patterns.append("Functional impact from digital content reported")
        ctx.source_question_ids.append("negative_consequences_noticed")
        ctx.evidence_tags.extend(["functional_impact", "digital_wellness"])
        modifiable.append(FactorItem(
            id="digital_behavior_functional_impact",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["negative_consequences_noticed"],
            reason="Reported functional impacts from digital content (e.g. on sleep, relationships, focus, or intimacy).",
            evidence_tags=["functional_impact", "digital_wellness"]
        ))
    elif _val_equals(neg_consequences, "No negative consequences"):
        positive.append(FactorItem(
            id="no_digital_negative_consequences",
            domain="sexual_health",
            type="positive",
            status="optimal",
            source_question_ids=["negative_consequences_noticed"],
            reason="No negative functional consequences noticed from digital content.",
            evidence_tags=["digital_wellness"]
        ))

    if _val_in(daily_time, ["1-2 hrs", "2+ hrs"]):
        ctx.behavioral_patterns.append("High daily time spent on sexual content")
        ctx.source_question_ids.append("daily_time_on_sexual_content")
        modifiable.append(FactorItem(
            id="high_daily_screen_time_adult_content",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["daily_time_on_sexual_content"],
            reason="Spends over 1 hour daily viewing digital adult content.",
            evidence_tags=["screen_time", "behavioral_habits"]
        ))

    if _val_equals(coping_dig, "Yes"):
        ctx.behavioral_patterns.append("Digital adult content used for emotional coping")
        ctx.source_question_ids.append("use_as_emotional_coping")
        modifiable.append(FactorItem(
            id="digital_content_emotional_coping",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["use_as_emotional_coping"],
            reason="Regularly uses digital adult content to cope with negative emotions or stress.",
            evidence_tags=["emotional_coping", "behavioral_reinforcement"]
        ))

    if _val_equals(escalation, "Yes"):
        ctx.signals.append("Stimulus escalation pattern noted")
        ctx.source_question_ids.append("escalation_pattern")

    # Solo sexual behavior / physical discomfort
    if _val_in(mast_discomfort, ["Pain", "Frequent discomfort", "Skin irritation / injury"]):
        ctx.performance_concerns.append("Physical discomfort or pain related to ejaculation/masturbation")
        ctx.source_question_ids.append("masturbation_physical_discomfort")
        ctx.evidence_tags.extend(["genital_discomfort", "physical_symptoms", "clinical_review"])
        fu_discomfort = FactorItem(
            id="physical_discomfort_symptom",
            domain="sexual_health",
            type="follow_up",
            status="flagged",
            source_question_ids=["masturbation_physical_discomfort"],
            reason="Reported physical discomfort, pain, or skin irritation related to ejaculation/masturbation — medical review advised if persistent.",
            evidence_tags=["genital_discomfort", "physical_symptoms", "clinical_review"]
        )
        flags.append(fu_discomfort)
        follow_ups.append(fu_discomfort)
    elif _val_equals(mast_discomfort, "No"):
        positive.append(FactorItem(
            id="no_physical_discomfort_symptom",
            domain="sexual_health",
            type="positive",
            status="optimal",
            source_question_ids=["masturbation_physical_discomfort"],
            reason="No physical discomfort or pain reported during solo sexual behavior.",
            evidence_tags=["physical_comfort"]
        ))

    if _val_in(mast_ctrl, ["Often", "Almost always"]):
        ctx.behavioral_patterns.append("Engaging in solo sexual behavior more than intended")
        ctx.source_question_ids.append("masturbation_control")
        modifiable.append(FactorItem(
            id="perceived_loss_of_control_solo_behavior",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["masturbation_control"],
            reason="Reports frequently engaging in solo sexual behavior more than intended.",
            evidence_tags=["behavioral_control", "wellness_guidance"]
        ))

    if mast_impact is not None and not _val_in(mast_impact, ["No impact", "prefer_not_to_say"]):
        ctx.behavioral_patterns.append("Daily life interference from solo sexual behavior")
        ctx.source_question_ids.append("masturbation_functional_impact")
        modifiable.append(FactorItem(
            id="solo_behavior_functional_impact",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["masturbation_functional_impact"],
            reason="Reported daily life interference (e.g. on sleep, study/work, or relationships) related to solo behavior.",
            evidence_tags=["functional_impact", "lifestyle_balance"]
        ))

    if _val_in(mast_coping, ["Often", "Very often"]):
        ctx.behavioral_patterns.append("Solo sexual behavior used to cope with stress or difficult emotions")
        ctx.source_question_ids.append("masturbation_emotional_coping")
        modifiable.append(FactorItem(
            id="solo_behavior_emotional_coping",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["masturbation_emotional_coping"],
            reason="Frequently uses solo sexual behavior to manage stress, loneliness, or negative emotions.",
            evidence_tags=["emotional_regulation", "coping_strategies"]
        ))

    # Performance Anxiety & Intimacy
    anticip_anx = anx.get("anticipatory_anxiety_before_sex")
    avoidance = anx.get("sexual_avoidance_due_to_fear")
    spectatoring = anx.get("cognitive_self_monitoring_during_sex")
    comparison = anx.get("partner_comparison_porn_vs_reality")
    unexpected_diff = anx.get("history_of_unexpected_sexual_difficulty")
    partnered_diff = anx.get("partnered_sexual_difficulty")

    if _val_in(anticip_anx, ["Often", "Always"]):
        ctx.performance_concerns.append("Frequent anticipatory anxiety before intimacy")
        ctx.source_question_ids.append("anticipatory_anxiety_before_sex")
        ctx.evidence_tags.extend(["performance_anxiety", "sympathetic_nervous_system", "psychosexual_health"])
        flag_anx = FactorItem(
            id="anticipatory_intimacy_anxiety",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["anticipatory_anxiety_before_sex"],
            reason="Reports frequent anticipatory anxiety or performance worry prior to sexual intimacy.",
            evidence_tags=["performance_anxiety", "sympathetic_nervous_system", "psychosexual_health"]
        )
        modifiable.append(flag_anx)
        flags.append(flag_anx)
    elif _val_equals(anticip_anx, "Never"):
        positive.append(FactorItem(
            id="no_anticipatory_anxiety",
            domain="sexual_health",
            type="positive",
            status="optimal",
            source_question_ids=["anticipatory_anxiety_before_sex"],
            reason="No anticipatory anxiety reported before intimacy.",
            evidence_tags=["intimacy_confidence"]
        ))

    if _val_in(avoidance, ["Sometimes", "Yes"]):
        ctx.performance_concerns.append("Avoidance of intimate situations due to performance fear")
        ctx.source_question_ids.append("sexual_avoidance_due_to_fear")
        ctx.evidence_tags.extend(["avoidance_behavior", "anxiety_cycles", "relational_intimacy"])
        modifiable.append(FactorItem(
            id="intimacy_avoidance_behavior",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["sexual_avoidance_due_to_fear"],
            reason="Reports avoiding intimate situations due to performance concerns or fear.",
            evidence_tags=["avoidance_behavior", "anxiety_cycles"]
        ))

    if _val_in(spectatoring, ["Totally agree", "Agree"]):
        ctx.performance_concerns.append("Mental self-monitoring during intimacy (spectatoring)")
        ctx.source_question_ids.append("cognitive_self_monitoring_during_sex")
        ctx.evidence_tags.extend(["spectatoring", "cognitive_focus", "autonomic_balance"])
        modifiable.append(FactorItem(
            id="spectatoring_self_monitoring",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["cognitive_self_monitoring_during_sex"],
            reason="Reports mental self-monitoring (spectatoring) during intimacy, which can disrupt sensory focus.",
            evidence_tags=["spectatoring", "cognitive_focus"]
        ))

    if _val_equals(comparison, "Yes"):
        ctx.performance_concerns.append("Comparing real-life intimacy to digital media benchmarks")
        ctx.source_question_ids.append("partner_comparison_porn_vs_reality")
        modifiable.append(FactorItem(
            id="unrealistic_intimacy_comparisons",
            domain="sexual_health",
            type="modifiable",
            status="flagged",
            source_question_ids=["partner_comparison_porn_vs_reality"],
            reason="Compares real-life intimate experiences to digital media performance standards.",
            evidence_tags=["cognitive_standards", "media_expectations"]
        ))

    if _val_equals(unexpected_diff, "Yes"):
        ctx.signals.append("Past sudden unexpected sexual difficulty reported")
        ctx.source_question_ids.append("history_of_unexpected_sexual_difficulty")
        ctx.evidence_tags.extend(["erectile_function", "vascular_nervous_factors"])
        flags.append(FactorItem(
            id="unexpected_sexual_difficulty_history",
            domain="sexual_health",
            type="context",
            status="noted",
            source_question_ids=["history_of_unexpected_sexual_difficulty"],
            reason="Reported past sudden, unexpected erectile or ejaculatory difficulty.",
            evidence_tags=["erectile_function", "vascular_nervous_factors"]
        ))

    if partnered_diff is not None and not _val_in(partnered_diff, ["No", "Not applicable", "prefer_not_to_say"]):
        ctx.performance_concerns.append(f"Partnered difficulty reported: {partnered_diff}")
        ctx.source_question_ids.append("partnered_sexual_difficulty")
        ctx.evidence_tags.extend(["partnered_sexual_function", "clinical_consultation"])
        fu_part = FactorItem(
            id="partnered_sexual_difficulty_reported",
            domain="sexual_health",
            type="follow_up",
            status="flagged",
            source_question_ids=["partnered_sexual_difficulty"],
            reason="Reported difficulty during partnered sexual activity — recommended for constructive discussion with a specialist.",
            evidence_tags=["partnered_sexual_function", "clinical_consultation"]
        )
        flags.append(fu_part)
        follow_ups.append(fu_part)
    elif _val_equals(partnered_diff, "No"):
        positive.append(FactorItem(
            id="no_partnered_sexual_difficulty",
            domain="sexual_health",
            type="positive",
            status="optimal",
            source_question_ids=["partnered_sexual_difficulty"],
            reason="No difficulties reported during partnered sexual activity.",
            evidence_tags=["partnered_sexual_function"]
        ))

    if ctx.performance_concerns:
        ctx.summary_notes.append("Performance-related anxiety or intimacy concerns identified for constructive psychoeducation.")
    if ctx.behavioral_patterns:
        ctx.summary_notes.append("Behavioral patterns noted regarding digital consumption or solo habits.")
    if not ctx.performance_concerns and not ctx.behavioral_patterns:
        ctx.summary_notes.append("No adverse psychosexual performance concerns or behavioral disruptions reported.")

    ctx.source_question_ids = sorted(list(set(ctx.source_question_ids)))
    ctx.evidence_tags = sorted(list(set(ctx.evidence_tags)))

    return ctx, modifiable, positive, flags, follow_ups


# ---------------------------------------------------------------------------
# Domain Rule Evaluator: Lifestyle & Wellness
# ---------------------------------------------------------------------------

def _evaluate_lifestyle_wellness(
    norm: NormalizedAssessment
) -> tuple[LifestyleWellnessContext, list[FactorItem], list[FactorItem], list[FactorItem], list[FactorItem]]:
    ctx = LifestyleWellnessContext()
    modifiable: list[FactorItem] = []
    positive: list[FactorItem] = []
    flags: list[FactorItem] = []
    follow_ups: list[FactorItem] = []

    life = norm.lifestyle_behaviors
    diet = norm.diet_nutrition
    demo = norm.demographics

    # BMI Category
    bmi = demo.get("bmi_category")
    if _val_in(bmi, ["Overweight", "Obese"]):
        ctx.signals.append(f"Reported BMI category: {bmi}")
        ctx.source_question_ids.append("bmi_category")
        ctx.evidence_tags.extend(["bmi", "metabolic_health"])
        modifiable.append(FactorItem(
            id="elevated_bmi",
            domain="lifestyle_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["bmi_category"],
            reason="Reported BMI in overweight or obese range, which can influence metabolic markers.",
            evidence_tags=["bmi", "metabolic_health"]
        ))
    elif _val_equals(bmi, "Underweight"):
        ctx.signals.append("Reported BMI category: Underweight")
        ctx.source_question_ids.append("bmi_category")
        modifiable.append(FactorItem(
            id="underweight_bmi",
            domain="lifestyle_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["bmi_category"],
            reason="Reported BMI in underweight category, which provides nutritional baseline context.",
            evidence_tags=["bmi", "metabolic_health"]
        ))
    elif _val_equals(bmi, "Normal"):
        positive.append(FactorItem(
            id="normal_bmi",
            domain="lifestyle_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["bmi_category"],
            reason="Reported BMI within normal range.",
            evidence_tags=["bmi", "metabolic_health"]
        ))

    # Sleep Duration
    sleep_dur = life.get("sleep_duration")
    if sleep_dur is not None:
        ctx.source_question_ids.append("sleep_duration")
        if _val_equals(sleep_dur, "<5"):
            ctx.sleep_status = "Severely deficient (<5 hours/night)"
            ctx.evidence_tags.extend(["sleep_duration", "recovery", "endocrine_balance"])
            f_sleep = FactorItem(
                id="severe_sleep_deprivation",
                domain="lifestyle_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["sleep_duration"],
                reason="Average nightly sleep under 5 hours, significantly below biological recovery benchmarks.",
                evidence_tags=["sleep_duration", "recovery", "endocrine_balance"]
            )
            modifiable.append(f_sleep)
            flags.append(f_sleep)
        elif _val_equals(sleep_dur, "5-7"):
            ctx.sleep_status = "Suboptimal (5-7 hours/night)"
            ctx.evidence_tags.extend(["sleep_duration", "recovery"])
            modifiable.append(FactorItem(
                id="suboptimal_sleep_duration",
                domain="lifestyle_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["sleep_duration"],
                reason="Nightly sleep duration 5 to 7 hours, below optimal recovery benchmarks.",
                evidence_tags=["sleep_duration", "recovery"]
            ))
        elif _val_equals(sleep_dur, "7-9"):
            ctx.sleep_status = "Optimal (7-9 hours/night)"
            positive.append(FactorItem(
                id="optimal_sleep_duration",
                domain="lifestyle_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["sleep_duration"],
                reason="Optimal nightly sleep duration (7–9 hours) supporting cellular recovery.",
                evidence_tags=["sleep_duration", "recovery"]
            ))
        elif _val_equals(sleep_dur, "9+"):
            ctx.sleep_status = "Extended (9+ hours/night)"

    # Irregular Sleep / Circadian
    irreg_sleep = life.get("irregular_sleep")
    if _val_in(irreg_sleep, ["Often", "Always"]):
        ctx.source_question_ids.append("irregular_sleep")
        ctx.evidence_tags.extend(["circadian_rhythm", "sleep_hygiene", "cortisol"])
        modifiable.append(FactorItem(
            id="circadian_sleep_irregularity",
            domain="lifestyle_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["irregular_sleep"],
            reason="Frequent irregular sleep schedule or shift-work disruption.",
            evidence_tags=["circadian_rhythm", "sleep_hygiene"]
        ))
    elif _val_equals(irreg_sleep, "Never"):
        positive.append(FactorItem(
            id="consistent_sleep_schedule",
            domain="lifestyle_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["irregular_sleep"],
            reason="Consistent sleep schedule without frequent shift-work disruption.",
            evidence_tags=["circadian_rhythm"]
        ))

    # Physical Activity
    activity = life.get("physical_activity_level")
    if activity is not None:
        ctx.source_question_ids.append("physical_activity_level")
        if _val_equals(activity, "Sedentary"):
            ctx.physical_activity_status = "Sedentary (Little or no exercise)"
            ctx.evidence_tags.extend(["physical_activity", "metabolic_health", "cardiovascular_fitness"])
            modifiable.append(FactorItem(
                id="sedentary_activity_level",
                domain="lifestyle_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["physical_activity_level"],
                reason="Sedentary physical activity level with little or no routine exercise.",
                evidence_tags=["physical_activity", "metabolic_health"]
            ))
        elif _val_equals(activity, "Light"):
            ctx.physical_activity_status = "Light exercise"
        elif _val_in(activity, ["Moderate", "Intense"]):
            ctx.physical_activity_status = f"Active ({activity})"
            positive.append(FactorItem(
                id="regular_physical_activity",
                domain="lifestyle_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["physical_activity_level"],
                reason="Maintains moderate to intense weekly physical activity.",
                evidence_tags=["physical_activity", "cardiovascular_fitness"]
            ))

    # Daily Sitting Time
    sitting = life.get("hours_sitting_per_day")
    if sitting is not None:
        ctx.source_question_ids.append("hours_sitting_per_day")
        if _val_equals(sitting, "6+"):
            ctx.sedentary_status = "Prolonged sitting (>6 hours/day)"
            ctx.evidence_tags.extend(["sedentary_behavior", "circulation", "local_temperature"])
            modifiable.append(FactorItem(
                id="prolonged_daily_sitting",
                domain="lifestyle_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["hours_sitting_per_day"],
                reason="Prolonged daily sitting (>6 hours/day) which can impact circulation and posture.",
                evidence_tags=["sedentary_behavior", "circulation"]
            ))
        elif _val_in(sitting, ["<2", "2-4"]):
            ctx.sedentary_status = f"Low sitting time ({sitting} hours/day)"
            positive.append(FactorItem(
                id="low_daily_sitting",
                domain="lifestyle_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["hours_sitting_per_day"],
                reason="Limited daily sitting time (<4 hours/day).",
                evidence_tags=["sedentary_behavior"]
            ))

    # Diet & Nutrition
    fruit_veg = diet.get("fruit_veg_intake")
    processed = diet.get("processed_food_frequency")
    fried = diet.get("fried_food_frequency")
    water = diet.get("water_intake")
    supp = diet.get("supplement_use")

    if fruit_veg is not None:
        ctx.source_question_ids.append("fruit_veg_intake")
        if _val_equals(fruit_veg, "<1 serving/day"):
            ctx.evidence_tags.extend(["dietary_antioxidants", "micronutrients", "oxidative_stress"])
            modifiable.append(FactorItem(
                id="low_antioxidant_intake",
                domain="lifestyle_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["fruit_veg_intake"],
                reason="Low intake of fresh fruits and vegetables (<1 serving/day), limiting dietary antioxidant sources.",
                evidence_tags=["dietary_antioxidants", "micronutrients"]
            ))
        elif _val_in(fruit_veg, ["3-5", "5+"]):
            positive.append(FactorItem(
                id="high_fruit_veg_intake",
                domain="lifestyle_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["fruit_veg_intake"],
                reason="Consumes 3 or more servings of fruits and vegetables daily.",
                evidence_tags=["dietary_antioxidants"]
            ))

    if processed is not None:
        ctx.source_question_ids.append("processed_food_frequency")
        if _val_equals(processed, "Daily"):
            ctx.evidence_tags.extend(["processed_foods", "metabolic_health", "inflammation"])
            modifiable.append(FactorItem(
                id="daily_processed_food",
                domain="lifestyle_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["processed_food_frequency"],
                reason="Daily consumption of highly processed foods.",
                evidence_tags=["processed_foods", "inflammation"]
            ))
        elif _val_in(processed, ["Never", "Rarely"]):
            positive.append(FactorItem(
                id="low_processed_food",
                domain="lifestyle_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["processed_food_frequency"],
                reason="Infrequent consumption of processed foods.",
                evidence_tags=["diet_quality"]
            ))

    if fried is not None:
        ctx.source_question_ids.append("fried_food_frequency")
        if _val_equals(fried, "Daily"):
            ctx.evidence_tags.extend(["trans_fats", "lipid_profile", "inflammation"])
            modifiable.append(FactorItem(
                id="daily_fried_food",
                domain="lifestyle_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["fried_food_frequency"],
                reason="Daily consumption of fried foods high in dietary trans fats.",
                evidence_tags=["trans_fats", "lipid_profile"]
            ))
        elif _val_equals(fried, "Rarely"):
            positive.append(FactorItem(
                id="low_fried_food",
                domain="lifestyle_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["fried_food_frequency"],
                reason="Rare consumption of fried foods.",
                evidence_tags=["diet_quality"]
            ))

    if water is not None:
        ctx.source_question_ids.append("water_intake")
        if _val_equals(water, "<1L"):
            ctx.hydration_status = "Low (<1L/day)"
            ctx.evidence_tags.extend(["hydration", "cellular_function", "fluid_balance"])
            modifiable.append(FactorItem(
                id="low_hydration",
                domain="lifestyle_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["water_intake"],
                reason="Daily water consumption under 1 Liter.",
                evidence_tags=["hydration", "fluid_balance"]
            ))
        elif _val_in(water, ["2-3L", "3L+"]):
            ctx.hydration_status = f"Adequate ({water})"
            positive.append(FactorItem(
                id="adequate_hydration",
                domain="lifestyle_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["water_intake"],
                reason="Maintains healthy daily hydration of 2+ Liters.",
                evidence_tags=["hydration"]
            ))

    if supp is not None and not _val_in(supp, ["No supplement use", "none"]):
        ctx.source_question_ids.append("supplement_use")
        ctx.signals.append(f"Supplement use: {supp}")

    if modifiable:
        ctx.summary_notes.append(f"{len(modifiable)} modifiable lifestyle or wellness factor(s) identified for potential optimization.")
    else:
        ctx.summary_notes.append("Lifestyle and dietary indicators align well with health guidelines.")

    ctx.source_question_ids = sorted(list(set(ctx.source_question_ids)))
    ctx.evidence_tags = sorted(list(set(ctx.evidence_tags)))

    return ctx, modifiable, positive, flags, follow_ups


# ---------------------------------------------------------------------------
# Domain Rule Evaluator: Environmental & Heat Exposure
# ---------------------------------------------------------------------------

def _evaluate_environmental_heat(
    norm: NormalizedAssessment
) -> tuple[EnvironmentalHeatContext, list[FactorItem], list[FactorItem], list[FactorItem], list[FactorItem]]:
    ctx = EnvironmentalHeatContext()
    modifiable: list[FactorItem] = []
    positive: list[FactorItem] = []
    flags: list[FactorItem] = []
    follow_ups: list[FactorItem] = []

    heat = norm.heat_exposure
    env = norm.environmental_exposure

    laptop = heat.get("laptop_on_lap")
    phone = heat.get("mobile_phone_placement")
    underwear = heat.get("underwear_type")
    bath = heat.get("hot_bath_frequency")
    hot_work = heat.get("working_in_hot_conditions")
    cycling = heat.get("cycling_hours_per_week")

    traffic = env.get("proximity_to_industrial_or_traffic")
    pesticide = env.get("pesticide_occupational_exposure")
    heavy_metal = env.get("heavy_metal_occupational_exposure")
    plastic = env.get("plastic_use_hot_food_water")
    emf = env.get("emf_radiation_at_work")

    # Heat: Laptop on lap
    if _val_in(laptop, ["Often", "Daily"]):
        ctx.heat_exposures.append("Frequent laptop use directly on lap")
        ctx.source_question_ids.append("laptop_on_lap")
        ctx.evidence_tags.extend(["hyperthermia", "device_heat", "scrotal_temperature"])
        modifiable.append(FactorItem(
            id="laptop_on_lap_heat",
            domain="environmental_heat",
            type="modifiable",
            status="flagged",
            source_question_ids=["laptop_on_lap"],
            reason="Frequent laptop use directly on lap creates localized device thermal exposure.",
            evidence_tags=["hyperthermia", "device_heat", "scrotal_temperature"]
        ))
    elif _val_equals(laptop, "Never"):
        positive.append(FactorItem(
            id="no_laptop_lap_exposure",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["laptop_on_lap"],
            reason="Avoids using laptop directly on lap.",
            evidence_tags=["hyperthermia_prevention"]
        ))

    # Heat: Mobile phone in front pocket
    if _val_equals(phone, "Front trouser pocket"):
        ctx.source_question_ids.append("mobile_phone_placement")
        ctx.evidence_tags.extend(["device_proximity", "emf_radiofrequency"])
        modifiable.append(FactorItem(
            id="phone_front_pocket",
            domain="environmental_heat",
            type="modifiable",
            status="flagged",
            source_question_ids=["mobile_phone_placement"],
            reason="Regularly carries mobile device in front trouser pocket in close proximity to groin.",
            evidence_tags=["device_proximity", "emf_radiofrequency"]
        ))
    elif _val_in(phone, ["Bag", "Other"]):
        positive.append(FactorItem(
            id="phone_stored_away",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["mobile_phone_placement"],
            reason="Carries phone in bag or away from groin area.",
            evidence_tags=["device_proximity"]
        ))

    # Heat: Tight underwear
    if _val_equals(underwear, "Compression shorts"):
        ctx.heat_exposures.append("Tight / compression underwear")
        ctx.source_question_ids.append("underwear_type")
        ctx.evidence_tags.extend(["scrotal_temperature", "clothing_thermal_insulation"])
        modifiable.append(FactorItem(
            id="tight_underwear_heat",
            domain="environmental_heat",
            type="modifiable",
            status="flagged",
            source_question_ids=["underwear_type"],
            reason="Frequent use of tight or compression underwear which may restrict airflow.",
            evidence_tags=["scrotal_temperature", "clothing_thermal_insulation"]
        ))
    elif _val_equals(underwear, "Boxers"):
        positive.append(FactorItem(
            id="loose_underwear",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["underwear_type"],
            reason="Wears loose boxers promoting pelvic airflow.",
            evidence_tags=["scrotal_temperature"]
        ))

    # Heat: Hot baths / saunas
    if _val_equals(bath, "Daily"):
        ctx.heat_exposures.append("Daily hot baths, steam baths, or saunas")
        ctx.source_question_ids.append("hot_bath_frequency")
        ctx.evidence_tags.extend(["hyperthermia", "heat_exposure", "spermatogenesis_thermoregulation"])
        modifiable.append(FactorItem(
            id="frequent_hot_baths_sauna",
            domain="environmental_heat",
            type="modifiable",
            status="flagged",
            source_question_ids=["hot_bath_frequency"],
            reason="Daily hot baths, steam baths, or saunas causing frequent elevated thermal exposure.",
            evidence_tags=["hyperthermia", "heat_exposure"]
        ))
    elif _val_in(bath, ["Never", "Rarely"]):
        positive.append(FactorItem(
            id="low_hyperthermia_exposure",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["hot_bath_frequency"],
            reason="Infrequent or no exposure to saunas/hot tubs.",
            evidence_tags=["hyperthermia_prevention"]
        ))

    # Heat: Working in hot conditions
    if _val_equals(hot_work, "Yes"):
        ctx.heat_exposures.append("Occupational high-temperature environment")
        ctx.source_question_ids.append("working_in_hot_conditions")
        ctx.evidence_tags.extend(["occupational_heat", "hyperthermia", "workplace_environment"])
        flags.append(FactorItem(
            id="occupational_heat_exposure",
            domain="environmental_heat",
            type="context",
            status="flagged",
            source_question_ids=["working_in_hot_conditions"],
            reason="Works in high-temperature environments (e.g. bakeries, kitchens, foundries).",
            evidence_tags=["occupational_heat", "hyperthermia"]
        ))
    elif _val_equals(hot_work, "No"):
        positive.append(FactorItem(
            id="no_occupational_heat",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["working_in_hot_conditions"],
            reason="No high-temperature occupational environment reported.",
            evidence_tags=["occupational_health"]
        ))

    # Heat: Extended cycling
    if _val_equals(cycling, "5+"):
        ctx.heat_exposures.append("Extended cycling (>5 hours/week)")
        ctx.source_question_ids.append("cycling_hours_per_week")
        ctx.evidence_tags.extend(["cycling", "saddle_pressure", "perineal_circulation"])
        modifiable.append(FactorItem(
            id="extended_cycling_saddle_time",
            domain="environmental_heat",
            type="modifiable",
            status="flagged",
            source_question_ids=["cycling_hours_per_week"],
            reason="Over 5 hours of cycling weekly, associated with saddle pressure and localized thermal retention.",
            evidence_tags=["cycling", "saddle_pressure"]
        ))

    # Environmental: Proximity to industrial/traffic
    if _val_equals(traffic, "Yes"):
        ctx.environmental_exposures.append("Proximity to industrial complexes or high-traffic highways")
        ctx.source_question_ids.append("proximity_to_industrial_or_traffic")
        ctx.evidence_tags.extend(["particulate_matter", "air_pollution", "environmental_toxins"])
        flags.append(FactorItem(
            id="ambient_pollutant_proximity",
            domain="environmental_heat",
            type="context",
            status="noted",
            source_question_ids=["proximity_to_industrial_or_traffic"],
            reason="Lives or works in close proximity to heavy industrial complexes or high-traffic highways.",
            evidence_tags=["particulate_matter", "air_pollution"]
        ))
    elif _val_equals(traffic, "No"):
        positive.append(FactorItem(
            id="low_ambient_pollutant_exposure",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["proximity_to_industrial_or_traffic"],
            reason="No reported residential or workplace proximity to heavy industrial zones.",
            evidence_tags=["environmental_health"]
        ))

    # Environmental: Pesticides
    if _val_equals(pesticide, "Yes"):
        ctx.environmental_exposures.append("Occupational pesticide or chemical spray exposure")
        ctx.source_question_ids.append("pesticide_occupational_exposure")
        ctx.evidence_tags.extend(["organophosphates", "pesticides", "endocrine_disruptors"])
        fu_pest = FactorItem(
            id="occupational_pesticide_exposure",
            domain="environmental_heat",
            type="follow_up",
            status="flagged",
            source_question_ids=["pesticide_occupational_exposure"],
            reason="Direct occupational exposure to agricultural pesticides or chemical sprays (potential endocrine disruptors).",
            evidence_tags=["organophosphates", "pesticides", "endocrine_disruptors"]
        )
        flags.append(fu_pest)
        follow_ups.append(fu_pest)
    elif _val_equals(pesticide, "No"):
        positive.append(FactorItem(
            id="no_pesticide_exposure",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["pesticide_occupational_exposure"],
            reason="No occupational pesticide exposure reported.",
            evidence_tags=["occupational_health"]
        ))

    # Environmental: Heavy metals / solvents
    if _val_in(heavy_metal, ["Welding", "Paint", "Battery mfg"]):
        ctx.environmental_exposures.append(f"Occupational exposure to {heavy_metal}")
        ctx.source_question_ids.append("heavy_metal_occupational_exposure")
        ctx.evidence_tags.extend(["heavy_metals", "lead_cadmium", "solvent_toxicity", "occupational_health"])
        fu_metal = FactorItem(
            id="heavy_metal_solvent_exposure",
            domain="environmental_heat",
            type="follow_up",
            status="flagged",
            source_question_ids=["heavy_metal_occupational_exposure"],
            reason=f"Occupational exposure to {heavy_metal} (welding fumes, paints/solvents, or lead battery manufacturing).",
            evidence_tags=["heavy_metals", "solvent_toxicity", "occupational_health"]
        )
        flags.append(fu_metal)
        follow_ups.append(fu_metal)
    elif _val_equals(heavy_metal, "No exposure"):
        positive.append(FactorItem(
            id="no_heavy_metal_exposure",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["heavy_metal_occupational_exposure"],
            reason="No occupational heavy metal or solvent exposure reported.",
            evidence_tags=["occupational_health"]
        ))

    # Environmental: Heated plastics
    if _val_equals(plastic, "Daily"):
        ctx.environmental_exposures.append("Daily hot food/drinks in plastic containers")
        ctx.source_question_ids.append("plastic_use_hot_food_water")
        ctx.evidence_tags.extend(["bisphenol_a", "microplastics", "phthalates", "endocrine_disruptors"])
        modifiable.append(FactorItem(
            id="heated_plastic_exposure",
            domain="environmental_heat",
            type="modifiable",
            status="flagged",
            source_question_ids=["plastic_use_hot_food_water"],
            reason="Daily consumption of hot food or beverages from plastic containers (BPA/phthalate leaching risk).",
            evidence_tags=["bisphenol_a", "microplastics", "endocrine_disruptors"]
        ))
    elif _val_equals(plastic, "Never"):
        positive.append(FactorItem(
            id="avoids_heated_plastics",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["plastic_use_hot_food_water"],
            reason="Avoids plastic containers for hot food and drinks.",
            evidence_tags=["endocrine_protection"]
        ))

    # Environmental: EMF / Radiation
    if _val_in(emf, ["Telecom tower", "Radiology", "Electrical"]):
        ctx.environmental_exposures.append(f"Occupational radiation/EMF exposure: {emf}")
        ctx.source_question_ids.append("emf_radiation_at_work")
        ctx.evidence_tags.extend(["ionizing_radiation", "occupational_emf"])
        flags.append(FactorItem(
            id="occupational_emf_radiation",
            domain="environmental_heat",
            type="context",
            status="noted",
            source_question_ids=["emf_radiation_at_work"],
            reason=f"Workplace exposure to specialized electromagnetic or radiation equipment ({emf}).",
            evidence_tags=["ionizing_radiation", "occupational_emf"]
        ))
    elif _val_equals(emf, "No exposure"):
        positive.append(FactorItem(
            id="no_workplace_radiation",
            domain="environmental_heat",
            type="positive",
            status="optimal",
            source_question_ids=["emf_radiation_at_work"],
            reason="No specialized workplace radiation or high-voltage EMF exposure.",
            evidence_tags=["occupational_health"]
        ))

    if ctx.heat_exposures:
        ctx.summary_notes.append(f"{len(ctx.heat_exposures)} local heat exposure factor(s) noted.")
    if ctx.environmental_exposures:
        ctx.summary_notes.append(f"{len(ctx.environmental_exposures)} ambient/occupational environmental factor(s) recorded.")
    if not ctx.heat_exposures and not ctx.environmental_exposures:
        ctx.summary_notes.append("No adverse heat or environmental risk exposures reported.")

    ctx.source_question_ids = sorted(list(set(ctx.source_question_ids)))
    ctx.evidence_tags = sorted(list(set(ctx.evidence_tags)))

    return ctx, modifiable, positive, flags, follow_ups


# ---------------------------------------------------------------------------
# Domain Rule Evaluator: Mental Health & Behavioral Wellness
# ---------------------------------------------------------------------------

def _evaluate_mental_behavioral_wellness(
    norm: NormalizedAssessment
) -> tuple[MentalBehavioralWellnessContext, list[FactorItem], list[FactorItem], list[FactorItem], list[FactorItem]]:
    ctx = MentalBehavioralWellnessContext()
    modifiable: list[FactorItem] = []
    positive: list[FactorItem] = []
    flags: list[FactorItem] = []
    follow_ups: list[FactorItem] = []

    m_stress = norm.mental_health_stress
    coping = norm.coping_mechanisms
    body = norm.body_image_self_perception
    social = norm.social_relational_context

    work_hours = m_stress.get("daily_work_hours")
    pss = m_stress.get("perceived_stress_pss10")
    gad7 = m_stress.get("gad7_score")
    phq9 = m_stress.get("phq9_score")
    sleep_qual = m_stress.get("sleep_quality_psqi_proxy")

    stress_coping = coping.get("primary_stress_coping_method")
    emo_reg = coping.get("emotional_regulation_ability")
    sleep_esc = coping.get("sleep_as_escape")
    sub_stress = coping.get("substance_use_under_stress")
    mindfulness = coping.get("mindfulness_or_meditation_practice")

    # Work hours
    if _val_equals(work_hours, "10+"):
        ctx.source_question_ids.append("daily_work_hours")
        ctx.evidence_tags.extend(["workplace_stress", "fatigue", "recovery_cycles"])
        modifiable.append(FactorItem(
            id="extended_work_hours",
            domain="mental_behavioral_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["daily_work_hours"],
            reason="Extended daily work schedule (>10 hours/day), limiting daily recovery cycles.",
            evidence_tags=["workplace_stress", "fatigue"]
        ))

    # PSS-10 Perceived Stress (slider: 0-33)
    if isinstance(pss, (int, float)):
        ctx.source_question_ids.append("perceived_stress_pss10")
        if pss >= 27:
            ctx.stress_context = f"Severe perceived stress (score: {int(pss)}/33)"
            ctx.evidence_tags.extend(["stress", "cortisol", "hpa_axis"])
            flag_pss = FactorItem(
                id="severe_perceived_stress",
                domain="mental_behavioral_wellness",
                type="context",
                status="flagged",
                source_question_ids=["perceived_stress_pss10"],
                reason=f"High perceived stress screening score ({int(pss)}/33) indicating substantial psychological strain.",
                evidence_tags=["stress", "cortisol", "hpa_axis"]
            )
            modifiable.append(flag_pss)
            flags.append(flag_pss)
        elif pss >= 16:
            ctx.stress_context = f"Moderate perceived stress (score: {int(pss)}/33)"
            ctx.evidence_tags.extend(["stress", "cortisol"])
            modifiable.append(FactorItem(
                id="elevated_perceived_stress",
                domain="mental_behavioral_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["perceived_stress_pss10"],
                reason=f"Moderate perceived stress screening score ({int(pss)}/33).",
                evidence_tags=["stress", "cortisol"]
            ))
        elif pss <= 13:
            ctx.stress_context = f"Low perceived stress (score: {int(pss)}/33)"
            positive.append(FactorItem(
                id="low_perceived_stress",
                domain="mental_behavioral_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["perceived_stress_pss10"],
                reason="Low perceived stress score on screening indicator.",
                evidence_tags=["stress_resilience"]
            ))

    # GAD-7 Anxiety Screening Proxy (slider: 0-16)
    if isinstance(gad7, (int, float)):
        ctx.source_question_ids.append("gad7_score")
        if gad7 >= 10:
            ctx.mood_anxiety_context = f"Elevated anxiety proxy score ({int(gad7)}/16)"
            ctx.evidence_tags.extend(["anxiety", "autonomic_regulation", "sympathetic_tone"])
            fu_gad = FactorItem(
                id="elevated_anxiety_screening_proxy",
                domain="mental_behavioral_wellness",
                type="follow_up",
                status="flagged",
                source_question_ids=["gad7_score"],
                reason=f"Elevated anxiety screening proxy score ({int(gad7)}/16) — discussion with a mental health professional may be helpful (screening indicator, not a clinical diagnosis).",
                evidence_tags=["anxiety", "autonomic_regulation", "sympathetic_tone"]
            )
            flags.append(fu_gad)
            follow_ups.append(fu_gad)

    # PHQ-9 Mood Screening Proxy (slider: 0-19)
    if isinstance(phq9, (int, float)):
        ctx.source_question_ids.append("phq9_score")
        if phq9 >= 10:
            ctx.mood_anxiety_context = f"Elevated mood screening proxy score ({int(phq9)}/19)"
            ctx.evidence_tags.extend(["mood_screening", "somatic_strain", "psychological_wellbeing"])
            fu_phq = FactorItem(
                id="elevated_mood_screening_proxy",
                domain="mental_behavioral_wellness",
                type="follow_up",
                status="flagged",
                source_question_ids=["phq9_score"],
                reason=f"Elevated mood screening proxy score ({int(phq9)}/19) — professional evaluation recommended for mood wellbeing (screening indicator, not a clinical diagnosis).",
                evidence_tags=["mood_screening", "somatic_strain", "psychological_wellbeing"]
            )
            flags.append(fu_phq)
            follow_ups.append(fu_phq)

    # Sleep Quality (PSQI proxy)
    if _val_in(sleep_qual, ["Trouble falling asleep", "Trouble staying asleep", "Waking early"]):
        ctx.source_question_ids.append("sleep_quality_psqi_proxy")
        ctx.evidence_tags.extend(["sleep_quality", "sleep_architecture", "autonomic_balance"])
        modifiable.append(FactorItem(
            id="disrupted_sleep_quality",
            domain="mental_behavioral_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["sleep_quality_psqi_proxy"],
            reason=f"Reported sleep quality disruption: {sleep_qual}.",
            evidence_tags=["sleep_quality", "sleep_architecture"]
        ))
    elif _val_equals(sleep_qual, "Feeling rested"):
        positive.append(FactorItem(
            id="restful_sleep",
            domain="mental_behavioral_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["sleep_quality_psqi_proxy"],
            reason="Wakes up feeling rested and refreshed.",
            evidence_tags=["sleep_quality"]
        ))

    # Coping Mechanisms
    if _val_in(stress_coping, ["Substance use", "Pornography"]):
        ctx.coping_patterns.append(f"Primary stress coping: {stress_coping}")
        ctx.source_question_ids.append("primary_stress_coping_method")
        ctx.evidence_tags.extend(["stress_coping", "behavioral_loops"])
        modifiable.append(FactorItem(
            id="maladaptive_stress_coping",
            domain="mental_behavioral_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["primary_stress_coping_method"],
            reason=f"Relies primarily on {stress_coping} to manage high stress or workload.",
            evidence_tags=["stress_coping", "behavioral_loops"]
        ))
    elif _val_in(stress_coping, ["Exercise", "Meditation or prayer", "Talking to someone", "Music or art"]):
        ctx.coping_patterns.append(f"Adaptive stress coping: {stress_coping}")
        positive.append(FactorItem(
            id="healthy_stress_coping",
            domain="mental_behavioral_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["primary_stress_coping_method"],
            reason=f"Utilizes adaptive stress-management practices ({stress_coping}).",
            evidence_tags=["adaptive_coping", "resilience"]
        ))

    if _val_equals(emo_reg, "No"):
        ctx.source_question_ids.append("emotional_regulation_ability")
        ctx.evidence_tags.extend(["emotional_regulation", "cortisol_stability"])
        modifiable.append(FactorItem(
            id="difficult_emotional_regulation",
            domain="mental_behavioral_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["emotional_regulation_ability"],
            reason="Finds it difficult to manage and regulate intense negative emotions.",
            evidence_tags=["emotional_regulation", "cortisol_stability"]
        ))
    elif _val_equals(emo_reg, "Yes"):
        positive.append(FactorItem(
            id="effective_emotional_regulation",
            domain="mental_behavioral_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["emotional_regulation_ability"],
            reason="Reports ability to regulate intense negative emotions effectively.",
            evidence_tags=["emotional_regulation"]
        ))

    if _val_equals(sleep_esc, "Yes"):
        ctx.coping_patterns.append("Uses sleep as an escape mechanism")
        ctx.source_question_ids.append("sleep_as_escape")
        modifiable.append(FactorItem(
            id="sleep_avoidance_coping",
            domain="mental_behavioral_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["sleep_as_escape"],
            reason="Regularly uses excessive sleep as an escape strategy for stress or worries.",
            evidence_tags=["avoidance_coping", "behavioral_health"]
        ))

    if _val_in(sub_stress, ["Smoking", "Alcohol", "Cannabis"]):
        ctx.coping_patterns.append(f"Increases {sub_stress} under stress")
        ctx.source_question_ids.append("substance_use_under_stress")
        ctx.evidence_tags.extend(["stress_substance_loop", "metabolic_strain"])
        modifiable.append(FactorItem(
            id="stress_triggered_substance_escalation",
            domain="mental_behavioral_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["substance_use_under_stress"],
            reason=f"Increases substance use ({sub_stress}) during periods of high stress.",
            evidence_tags=["stress_substance_loop", "metabolic_strain"]
        ))
    elif _val_equals(sub_stress, "No substance use"):
        positive.append(FactorItem(
            id="no_stress_substance_escalation",
            domain="mental_behavioral_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["substance_use_under_stress"],
            reason="Does not increase substance use when experiencing stress.",
            evidence_tags=["healthy_coping"]
        ))

    if _val_equals(mindfulness, "Yes (regular)"):
        ctx.coping_patterns.append("Regular mindfulness / meditation practice")
        ctx.source_question_ids.append("mindfulness_or_meditation_practice")
        positive.append(FactorItem(
            id="regular_mindfulness_practice",
            domain="mental_behavioral_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["mindfulness_or_meditation_practice"],
            reason="Maintains a regular practice of mindfulness, meditation, or breathing exercises.",
            evidence_tags=["mindfulness", "parasympathetic_tone", "heart_rate_variability"]
        ))

    # Loneliness & Body image
    loneliness = social.get("perceived_loneliness_ucla3")
    if _val_equals(loneliness, "High"):
        ctx.source_question_ids.append("perceived_loneliness_ucla3")
        ctx.evidence_tags.extend(["social_isolation", "loneliness", "psychological_wellbeing"])
        f_lone = FactorItem(
            id="high_perceived_loneliness",
            domain="mental_behavioral_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["perceived_loneliness_ucla3"],
            reason="High perceived loneliness or social isolation indicator.",
            evidence_tags=["social_isolation", "loneliness"]
        )
        modifiable.append(f_lone)
        flags.append(f_lone)
    elif _val_equals(loneliness, "Low"):
        positive.append(FactorItem(
            id="strong_social_connection",
            domain="mental_behavioral_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["perceived_loneliness_ucla3"],
            reason="Low loneliness and strong perceived social connection.",
            evidence_tags=["social_support"]
        ))

    genital_image = body.get("genital_self_image_concern")
    if _val_in(genital_image, ["Sometimes", "Yes"]):
        ctx.source_question_ids.append("genital_self_image_concern")
        ctx.evidence_tags.extend(["genital_self_image", "performance_anxiety", "intimacy_confidence"])
        modifiable.append(FactorItem(
            id="genital_appearance_anxiety",
            domain="mental_behavioral_wellness",
            type="modifiable",
            status="flagged",
            source_question_ids=["genital_self_image_concern"],
            reason="Reports worry or self-doubt regarding genital size or appearance, a frequent contributor to performance anxiety.",
            evidence_tags=["genital_self_image", "performance_anxiety"]
        ))
    elif _val_equals(genital_image, "No"):
        positive.append(FactorItem(
            id="no_genital_image_concern",
            domain="mental_behavioral_wellness",
            type="positive",
            status="optimal",
            source_question_ids=["genital_self_image_concern"],
            reason="No anxiety or self-doubt regarding genital appearance reported.",
            evidence_tags=["body_confidence"]
        ))

    if ctx.stress_context:
        ctx.summary_notes.append(f"Stress profile: {ctx.stress_context}.")
    if ctx.mood_anxiety_context:
        ctx.summary_notes.append(f"Screening indicator: {ctx.mood_anxiety_context}.")
    if not ctx.stress_context and not ctx.mood_anxiety_context:
        ctx.summary_notes.append("Mental wellness screening markers indicate manageable baseline stress.")

    ctx.source_question_ids = sorted(list(set(ctx.source_question_ids)))
    ctx.evidence_tags = sorted(list(set(ctx.evidence_tags)))

    return ctx, modifiable, positive, flags, follow_ups


# ---------------------------------------------------------------------------
# Domain Rule Evaluator: Substance & Medication Context
# ---------------------------------------------------------------------------

def _evaluate_substance_medication(
    norm: NormalizedAssessment
) -> tuple[SubstanceMedicationContext, list[FactorItem], list[FactorItem], list[FactorItem], list[FactorItem]]:
    ctx = SubstanceMedicationContext()
    modifiable: list[FactorItem] = []
    positive: list[FactorItem] = []
    flags: list[FactorItem] = []
    follow_ups: list[FactorItem] = []

    sub_med = norm.substance_medication_use
    life = norm.lifestyle_behaviors

    smoking = life.get("smoking_status")
    alcohol = life.get("alcohol_frequency")
    rec_drugs = life.get("recreational_drug_use")

    steroid = sub_med.get("anabolic_steroid_use")
    finasteride = sub_med.get("finasteride_use")
    ssri = sub_med.get("antidepressant_use_ssri")
    antihypertensive = sub_med.get("antihypertensive_use")
    chemo = sub_med.get("chemotherapy_history")
    other_med = sub_med.get("other_long_term_medication")

    # Tobacco Smoking
    if _val_in(smoking, ["Occasional", "Regular", "Heavy (20+/day)"]):
        ctx.substance_exposures.append(f"Tobacco smoking ({smoking})")
        ctx.source_question_ids.append("smoking_status")
        ctx.evidence_tags.extend(["tobacco", "nicotine", "oxidative_stress", "vascular_health"])
        f_smoke = FactorItem(
            id="smoking_tobacco_use",
            domain="substance_medication",
            type="modifiable",
            status="flagged",
            source_question_ids=["smoking_status"],
            reason=f"Reported tobacco smoking ({smoking}), associated with elevated oxidative stress and vascular impact.",
            evidence_tags=["tobacco", "nicotine", "oxidative_stress", "vascular_health"]
        )
        modifiable.append(f_smoke)
        if _val_equals(smoking, "Heavy (20+/day)"):
            flags.append(f_smoke)
    elif _val_equals(smoking, "Never"):
        positive.append(FactorItem(
            id="no_tobacco_smoking",
            domain="substance_medication",
            type="positive",
            status="optimal",
            source_question_ids=["smoking_status"],
            reason="No tobacco smoking exposure reported.",
            evidence_tags=["tobacco_abstinence"]
        ))

    # Alcohol Frequency
    if _val_in(alcohol, ["Weekly", "Daily"]):
        ctx.substance_exposures.append(f"Alcohol consumption ({alcohol})")
        ctx.source_question_ids.append("alcohol_frequency")
        ctx.evidence_tags.extend(["alcohol", "metabolic_health", "endocrine_balance"])
        modifiable.append(FactorItem(
            id="regular_alcohol_consumption",
            domain="substance_medication",
            type="modifiable",
            status="flagged",
            source_question_ids=["alcohol_frequency"],
            reason=f"Reported regular alcohol consumption ({alcohol}).",
            evidence_tags=["alcohol", "metabolic_health", "endocrine_balance"]
        ))
    elif _val_in(alcohol, ["Never", "Monthly"]):
        positive.append(FactorItem(
            id="infrequent_or_no_alcohol",
            domain="substance_medication",
            type="positive",
            status="optimal",
            source_question_ids=["alcohol_frequency"],
            reason="No frequent or heavy alcohol consumption reported.",
            evidence_tags=["alcohol_moderation"]
        ))

    # Recreational Drugs
    if _val_equals(rec_drugs, "Cannabis"):
        ctx.substance_exposures.append("Cannabis / Marijuana use")
        ctx.source_question_ids.append("recreational_drug_use")
        ctx.evidence_tags.extend(["cannabis", "cannabinoids", "endocrine_signaling"])
        modifiable.append(FactorItem(
            id="cannabis_use",
            domain="substance_medication",
            type="modifiable",
            status="flagged",
            source_question_ids=["recreational_drug_use"],
            reason="Reported recreational cannabis/marijuana use.",
            evidence_tags=["cannabis", "cannabinoids", "endocrine_signaling"]
        ))
    elif _val_equals(rec_drugs, "Steroids"):
        ctx.substance_exposures.append("Non-prescription anabolic steroids (recreational)")
        ctx.source_question_ids.append("recreational_drug_use")
        ctx.evidence_tags.extend(["anabolic_steroids", "endocrine_suppression", "testosterone"])
        fu_rec_steroid = FactorItem(
            id="anabolic_steroid_exposure",
            domain="substance_medication",
            type="follow_up",
            status="flagged",
            source_question_ids=["recreational_drug_use"],
            reason="Reported non-prescription anabolic steroid use — potent suppressor of endogenous endocrine signaling; specialist discussion advised.",
            evidence_tags=["anabolic_steroids", "endocrine_suppression"]
        )
        flags.append(fu_rec_steroid)
        follow_ups.append(fu_rec_steroid)
    elif _val_equals(rec_drugs, "No drug use"):
        positive.append(FactorItem(
            id="no_recreational_drug_use",
            domain="substance_medication",
            type="positive",
            status="optimal",
            source_question_ids=["recreational_drug_use"],
            reason="No recreational substance use reported.",
            evidence_tags=["substance_abstinence"]
        ))

    # Anabolic Steroid Use (Block 8)
    if _val_equals(steroid, "Current"):
        ctx.substance_exposures.append("Current anabolic steroid use")
        ctx.source_question_ids.append("anabolic_steroid_use")
        ctx.evidence_tags.extend(["anabolic_androgenic_steroids", "hypogonadotropic_hypogonadism", "endocrine_suppression"])
        fu_steroid = FactorItem(
            id="current_anabolic_steroid_use",
            domain="substance_medication",
            type="follow_up",
            status="flagged",
            source_question_ids=["anabolic_steroid_use"],
            reason="Current anabolic steroid use reported — strong inhibitor of natural gonadotropin/testosterone synthesis; medical consultation advised.",
            evidence_tags=["anabolic_androgenic_steroids", "hypogonadotropic_hypogonadism", "endocrine_suppression"]
        )
        flags.append(fu_steroid)
        follow_ups.append(fu_steroid)
    elif _val_equals(steroid, "Past"):
        ctx.substance_exposures.append("Past anabolic steroid use")
        ctx.source_question_ids.append("anabolic_steroid_use")
        ctx.evidence_tags.extend(["anabolic_androgenic_steroids", "endocrine_history"])
        flags.append(FactorItem(
            id="past_anabolic_steroid_use",
            domain="substance_medication",
            type="context",
            status="noted",
            source_question_ids=["anabolic_steroid_use"],
            reason="Prior history of anabolic steroid use noted for historical endocrine context.",
            evidence_tags=["anabolic_androgenic_steroids", "endocrine_history"]
        ))
    elif _val_equals(steroid, "Never"):
        positive.append(FactorItem(
            id="no_steroid_use",
            domain="substance_medication",
            type="positive",
            status="optimal",
            source_question_ids=["anabolic_steroid_use"],
            reason="No anabolic steroid use reported.",
            evidence_tags=["endocrine_protection"]
        ))

    # Finasteride / Dutasteride
    if _val_equals(finasteride, "Yes"):
        ctx.medication_exposures.append("5-alpha reductase inhibitor (Finasteride/Dutasteride)")
        ctx.source_question_ids.append("finasteride_use")
        ctx.evidence_tags.extend(["5_alpha_reductase_inhibitors", "finasteride", "dht_modulation"])
        flags.append(FactorItem(
            id="finasteride_dutasteride_use",
            domain="substance_medication",
            type="context",
            status="noted",
            source_question_ids=["finasteride_use"],
            reason="Reported use of Finasteride or Dutasteride, which modulates DHT and endocrine parameters.",
            evidence_tags=["5_alpha_reductase_inhibitors", "finasteride", "dht_modulation"]
        ))

    # SSRI Antidepressants
    if _val_equals(ssri, "Yes"):
        ctx.medication_exposures.append("SSRI antidepressant medication")
        ctx.source_question_ids.append("antidepressant_use_ssri")
        ctx.evidence_tags.extend(["ssri", "serotonin", "sexual_function"])
        flags.append(FactorItem(
            id="ssri_antidepressant_use",
            domain="substance_medication",
            type="context",
            status="noted",
            source_question_ids=["antidepressant_use_ssri"],
            reason="Reported SSRI antidepressant use, which can influence serotonergic autonomic pathways.",
            evidence_tags=["ssri", "serotonin", "sexual_function"]
        ))

    # Antihypertensive / Beta-blocker
    if _val_equals(antihypertensive, "Yes"):
        ctx.medication_exposures.append("Antihypertensive / blood pressure medication")
        ctx.source_question_ids.append("antihypertensive_use")
        ctx.evidence_tags.extend(["antihypertensive", "cardiovascular", "vascular_resistance"])
        flags.append(FactorItem(
            id="antihypertensive_medication",
            domain="substance_medication",
            type="context",
            status="noted",
            source_question_ids=["antihypertensive_use"],
            reason="Reported use of antihypertensive medication for blood pressure management.",
            evidence_tags=["antihypertensive", "cardiovascular"]
        ))

    # Chemotherapy / Radiation History
    if _val_equals(chemo, "Yes"):
        ctx.medication_exposures.append("Prior chemotherapy or radiation therapy")
        ctx.source_question_ids.append("chemotherapy_history")
        ctx.evidence_tags.extend(["chemotherapy", "gonadotoxicity", "radiation_therapy"])
        fu_chemo = FactorItem(
            id="chemotherapy_radiation_history",
            domain="substance_medication",
            type="follow_up",
            status="flagged",
            source_question_ids=["chemotherapy_history"],
            reason="Reported past history of chemotherapy or radiation therapy (potential cellular/gonadal impact).",
            evidence_tags=["chemotherapy", "gonadotoxicity", "radiation_therapy"]
        )
        flags.append(fu_chemo)
        follow_ups.append(fu_chemo)

    # Other Long-term Medications
    if _val_in(other_med, ["Reported (unspecified)", "Yes"]):
        ctx.medication_exposures.append("Other long-term prescribed medication")
        ctx.source_question_ids.append("other_long_term_medication")
        ctx.signals.append("Active long-term prescription medication reported")

    if ctx.substance_exposures:
        ctx.summary_notes.append(f"Substance exposures recorded: {', '.join(ctx.substance_exposures)}.")
    if ctx.medication_exposures:
        ctx.summary_notes.append(f"Prescribed medications noted: {', '.join(ctx.medication_exposures)}.")
    if not ctx.substance_exposures and not ctx.medication_exposures:
        ctx.summary_notes.append("No active substance exposures or long-term medication use reported.")

    ctx.source_question_ids = sorted(list(set(ctx.source_question_ids)))
    ctx.evidence_tags = sorted(list(set(ctx.evidence_tags)))

    return ctx, modifiable, positive, flags, follow_ups


# ---------------------------------------------------------------------------
# Data Quality & Completeness Calculator
# ---------------------------------------------------------------------------

def _calculate_data_quality(
    norm: NormalizedAssessment
) -> DataQuality:
    """
    Computes data quality metrics across all 86 canonical questionnaire questions.
    Missing answers are strictly counted as missing, not coerced to negative/positive.
    """
    answered_count = 0

    # Aggregate all non-None values across the 13 normalized domains
    domain_dicts = [
        norm.demographics,
        norm.lifestyle_behaviors,
        norm.heat_exposure,
        norm.diet_nutrition,
        norm.environmental_exposure,
        norm.mental_health_stress,
        norm.reproductive_history_symptoms,
        norm.substance_medication_use,
        norm.digital_sexual_behavior,
        norm.sexual_performance_anxiety,
        norm.body_image_self_perception,
        norm.social_relational_context,
        norm.coping_mechanisms,
    ]

    for d in domain_dicts:
        for q_id, val in d.items():
            if q_id in QUESTION_DOMAIN_MAP and val is not None:
                answered_count += 1

    expected = CANONICAL_QUESTION_COUNT
    missing = max(0, expected - answered_count)
    unmapped = len(norm.unmapped_fields) if norm.unmapped_fields else 0
    completeness = round(answered_count / float(expected), 3) if expected > 0 else 0.0

    return DataQuality(
        answered_count=answered_count,
        expected_count=expected,
        missing_count=missing,
        unmapped_count=unmapped,
        completeness=completeness
    )


# ---------------------------------------------------------------------------
# Primary Context Engine Entry Point
# ---------------------------------------------------------------------------

def build_health_context(
    normalized_context: Union[NormalizedAssessment, dict[str, Any], None]
) -> HealthContext:
    """
    Build a structured, deterministic HealthContext from normalized assessment responses.

    Parameters
    ----------
    normalized_context : NormalizedAssessment or dict or None
        The normalized assessment representation produced by `normalizer.py`.
        If a raw or partially normalized dict is passed, it is safely normalized first.

    Returns
    -------
    HealthContext
        Strongly typed Pydantic model containing:
          - domains: 6 structured conceptual domain contexts
          - modifiable_factors: list of factors that can be optimized
          - positive_factors: list of protective habits / normal findings
          - context_flags: factual contextual signals for reporting
          - follow_up_flags: items appropriate for clinical discussion
          - data_quality: assessment completeness metrics

    Privacy & Clinical Guarantees
    -----------------------------
    - Does NOT calculate infertility percentages or probabilities.
    - Does NOT output clinical diagnoses.
    - Does NOT log sensitive health response values.
    """
    # 1. Ensure we have a valid NormalizedAssessment object
    if normalized_context is None:
        norm = NormalizedAssessment()
    elif isinstance(normalized_context, NormalizedAssessment):
        norm = normalized_context
    elif isinstance(normalized_context, dict):
        # Determine if it's already structured by domain or a flat response dictionary
        if "demographics" in normalized_context and isinstance(normalized_context.get("demographics"), dict):
            try:
                norm = NormalizedAssessment(**normalized_context)
            except Exception:
                norm = normalize_assessment_responses(normalized_context)
        else:
            norm = normalize_assessment_responses(normalized_context)
    else:
        logger.warning("build_health_context received unexpected input type: %s", type(normalized_context).__name__)
        norm = NormalizedAssessment()

    # 2. Evaluate all 6 conceptual domains deterministically
    rep_ctx, rep_mod, rep_pos, rep_flags, rep_fu = _evaluate_reproductive_health(norm)
    sex_ctx, sex_mod, sex_pos, sex_flags, sex_fu = _evaluate_sexual_health(norm)
    life_ctx, life_mod, life_pos, life_flags, life_fu = _evaluate_lifestyle_wellness(norm)
    env_ctx, env_mod, env_pos, env_flags, env_fu = _evaluate_environmental_heat(norm)
    men_ctx, men_mod, men_pos, men_flags, men_fu = _evaluate_mental_behavioral_wellness(norm)
    sub_ctx, sub_mod, sub_pos, sub_flags, sub_fu = _evaluate_substance_medication(norm)

    # 3. Calculate data quality & completeness
    dq = _calculate_data_quality(norm)

    # 4. Consolidate factors (preserving stable deterministic ordering)
    all_modifiable: list[FactorItem] = rep_mod + sex_mod + life_mod + env_mod + men_mod + sub_mod
    all_positive: list[FactorItem] = rep_pos + sex_pos + life_pos + env_pos + men_pos + sub_pos
    all_flags: list[FactorItem] = rep_flags + sex_flags + life_flags + env_flags + men_flags + sub_flags
    all_follow_ups: list[FactorItem] = rep_fu + sex_fu + life_fu + env_fu + men_fu + sub_fu

    domains = DomainsContainer(
        reproductive_health=rep_ctx,
        sexual_health=sex_ctx,
        lifestyle_wellness=life_ctx,
        environmental_heat=env_ctx,
        mental_behavioral_wellness=men_ctx,
        substance_medication=sub_ctx,
    )

    logger.debug(
        "HealthContext generated deterministically. Answered: %d/%d (completeness: %.1f%%). "
        "Modifiable: %d, Positive: %d, Flags: %d, Follow-ups: %d.",
        dq.answered_count,
        dq.expected_count,
        dq.completeness * 100.0,
        len(all_modifiable),
        len(all_positive),
        len(all_flags),
        len(all_follow_ups),
    )

    return HealthContext(
        domains=domains,
        modifiable_factors=all_modifiable,
        positive_factors=all_positive,
        context_flags=all_flags,
        follow_up_flags=all_follow_ups,
        data_quality=dq
    )
