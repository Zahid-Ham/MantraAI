"""
MantraAI — Deterministic Longitudinal Assessment Comparison Service
=====================================================================

PURPOSE
-------
Provides deterministic, server-side comparison between completed assessment snapshots.
Compares factors, responses, and habits across time with zero external LLM invocation.

CLINICAL & ETHICAL PRINCIPLES
-----------------------------
1. Snapshots are immutable historical records. Comparison consumes persisted data and never recalculates.
2. Zero external AI processing: comparison is pure rule-based logic.
3. Observational language: uses "no longer reported in this assessment" rather than "cured" or "resolved medically".
4. Historical medical conditions (e.g., mumps, varicocele history, injury) are distinguished from acute symptoms.
5. Missing questionnaire answers are explicitly isolated from negative responses.
6. Questionnaire version compatibility is inspected and disclosed.
7. Wellness plan adherence is presented alongside habit changes without claiming causality.
"""

import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Set, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, Report
from app.models.wellness_plan import WellnessPlan, WellnessActionLog
from app.services.normalizer import QUESTION_DOMAIN_MAP
from app.schemas.longitudinal import (
    AssessmentComparisonOut,
    ComparisonMetadata,
    LongitudinalSummary,
    DomainComparisonDelta,
    FactorDeltaItem,
    WellnessPlanAdherenceContext,
    ComparisonType,
    SchemaCompatibility,
    FactorTransitionType,
    ReportDomainKey,
)

logger = logging.getLogger(__name__)

# Canonical domain key mapping & display titles
CANONICAL_DOMAINS: Dict[ReportDomainKey, str] = {
    "reproductive_health": "Reproductive Health",
    "sexual_health": "Sexual & Psychosexual Health",
    "mental_behavioral_wellness": "Mental & Behavioral Wellness",
    "lifestyle_wellness": "Lifestyle & Sleep Wellness",
    "environmental_exposure": "Environmental & Heat Exposures",
    "substance_medication": "Substance & Medication Use",
}

# Domain alias normalizer (handles legacy or internal variants)
DOMAIN_KEY_ALIAS_MAP: Dict[str, ReportDomainKey] = {
    "reproductive_health": "reproductive_health",
    "reproductive_history_symptoms": "reproductive_health",
    "sexual_health": "sexual_health",
    "digital_sexual_behavior": "sexual_health",
    "sexual_performance_anxiety": "sexual_health",
    "mental_behavioral_wellness": "mental_behavioral_wellness",
    "mental_health_stress": "mental_behavioral_wellness",
    "coping_mechanisms": "mental_behavioral_wellness",
    "body_image_self_perception": "mental_behavioral_wellness",
    "social_relational_context": "mental_behavioral_wellness",
    "lifestyle_wellness": "lifestyle_wellness",
    "lifestyle_behaviors": "lifestyle_wellness",
    "diet_nutrition": "lifestyle_wellness",
    "environmental_exposure": "environmental_exposure",
    "environmental_heat_context": "environmental_exposure",
    "heat_exposure": "environmental_exposure",
    "substance_medication": "substance_medication",
    "substance_medication_context": "substance_medication",
    "substance_medication_use": "substance_medication",
}

# Canonical questions that represent permanent past medical history or anatomical conditions
HISTORICAL_CONDITION_QUESTION_IDS: Set[str] = {
    "childhood_disease_mumps",
    "scrotal_or_groin_injury",
    "prior_sti_history",
    "known_varicocele",
    "chemotherapy_history",
}


def normalize_domain_key(key: str) -> ReportDomainKey:
    """Safely normalizes any internal domain variant to one of the 6 canonical ReportDomainKeys."""
    return DOMAIN_KEY_ALIAS_MAP.get(key, "lifestyle_wellness")


def _is_negative_or_unreported_value(val: Any) -> Tuple[bool, bool]:
    """
    Returns (is_missing, is_explicit_negative) for a questionnaire response value.
    """
    if val is None or val == "":
        return True, False
    
    if isinstance(val, str):
        v_lower = val.strip().lower()
        if v_lower in ("no", "never", "none", "not applicable", "n/a", "0"):
            return False, True
    elif isinstance(val, (int, float)):
        if val == 0:
            return False, True
    elif isinstance(val, list):
        if len(val) == 0:
            return False, True
        if len(val) == 1 and str(val[0]).strip().lower() in ("no", "none", "never", "n/a"):
            return False, True

    return False, False


class LongitudinalService:
    """
    Service for calculating deterministic comparisons between completed assessment snapshots.
    """

    @classmethod
    def compare_assessment_sessions(
        cls,
        db: Session,
        user: Optional[User] = None,
        assessment_id: Optional[UUID] = None,
        target_id: Optional[UUID] = None,
        *,
        current_user: Optional[User] = None,
        current_assessment_id: Optional[UUID] = None,
        target_assessment_id: Optional[UUID] = None,
    ) -> AssessmentComparisonOut:
        """
        Calculates longitudinal delta between current assessment and a target assessment.
        If target_id is omitted, compares against the immediately preceding completed assessment.
        """
        effective_user = user or current_user
        effective_assessment_id = assessment_id or current_assessment_id
        effective_target_id = target_id or target_assessment_id

        if not effective_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
        if not effective_assessment_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assessment ID required.")

        # 1. Fetch current assessment
        current_session = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == effective_assessment_id)
            .first()
        )
        if not current_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment session not found.",
            )

        if current_session.user_id != effective_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this assessment is unauthorized.",
            )

        if current_session.status != "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot perform longitudinal comparison on an incomplete assessment. Only completed assessments can be compared.",
            )

        # 2. Fetch current report
        current_report = (
            db.query(Report)
            .filter(Report.assessment_session_id == current_session.id)
            .first()
        )
        if not current_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report record not found for the requested assessment session.",
            )

        # 3. Identify comparison target
        comparison_type: ComparisonType = "PREVIOUS_COMPLETED"
        target_session: Optional[AssessmentSession] = None

        if effective_target_id is not None:
            if effective_target_id == current_session.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot compare an assessment session with itself.",
                )
            target_session = (
                db.query(AssessmentSession)
                .filter(AssessmentSession.id == effective_target_id)
                .first()
            )
            if not target_session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comparison target assessment session not found.",
                )
            if target_session.user_id != effective_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access to the comparison target assessment is unauthorized.",
                )
            if target_session.status != "COMPLETED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Comparison target assessment must be completed.",
                )
            comparison_type = "USER_SELECTED"
        else:
            # Query immediately preceding completed assessment
            query = (
                db.query(AssessmentSession)
                .filter(
                    AssessmentSession.user_id == effective_user.id,
                    AssessmentSession.status == "COMPLETED",
                    AssessmentSession.id != current_session.id,
                )
            )
            if current_session.completed_at:
                query = query.filter(AssessmentSession.completed_at < current_session.completed_at)
            elif current_session.started_at:
                query = query.filter(AssessmentSession.started_at < current_session.started_at)
            
            target_session = query.order_by(AssessmentSession.completed_at.desc(), AssessmentSession.started_at.desc()).first()

        # 4. Handle Baseline Case (No earlier assessment exists)
        if target_session is None:
            return cls._build_baseline_response(current_session, current_report, db)

        # 5. Fetch target report
        target_report = (
            db.query(Report)
            .filter(Report.assessment_session_id == target_session.id)
            .first()
        )
        if not target_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report record not found for the target assessment session.",
            )

        # 6. Execute deterministic comparison between snapshots
        return cls._build_comparison_response(
            db=db,
            user=effective_user,
            current_session=current_session,
            current_report=current_report,
            target_session=target_session,
            target_report=target_report,
            comparison_type=comparison_type,
        )

    @classmethod
    def _build_baseline_response(
        cls,
        current_session: AssessmentSession,
        current_report: Report,
        db: Session,
    ) -> AssessmentComparisonOut:
        """Constructs a clean baseline response when no earlier assessment exists."""
        metadata = ComparisonMetadata(
            current_assessment_id=current_session.id,
            current_completed_at=current_session.completed_at or current_session.started_at,
            current_assessment_version=current_session.assessment_version or "1.0",
            comparison_target_id=None,
            comparison_completed_at=None,
            comparison_assessment_version=None,
            comparison_type="BASELINE_ONLY",
            elapsed_days=None,
            has_comparison=False,
            schema_compatibility="FULLY_COMPATIBLE",
            compatibility_notes=[
                "This assessment represents your initial baseline record. Longitudinal comparisons will be available after completing a subsequent assessment."
            ],
        )

        priority_factors, positive_factors = cls._extract_report_factors(current_report)

        # Group factors by canonical domain
        domain_deltas: List[DomainComparisonDelta] = []
        for d_key, d_title in CANONICAL_DOMAINS.items():
            dom_factors = [f for f in priority_factors if normalize_domain_key(f.get("domain", "")) == d_key]
            dom_positives = [f for f in positive_factors if normalize_domain_key(f.get("domain", "")) == d_key]

            factor_items: List[FactorDeltaItem] = []
            for f in dom_factors:
                factor_items.append(
                    FactorDeltaItem(
                        id=f.get("id", "mod-factor"),
                        title=f.get("title", "Focus area"),
                        domain=d_key,
                        transition_type="PERSISTENT",
                        explanation=f.get("description", "Identified in initial baseline context."),
                        current_reported_value=None,
                        previous_reported_value=None,
                        evidence_refs=f.get("evidence_refs", []),
                        source_question_ids=f.get("source_question_ids", []),
                        is_historical_condition=any(q in HISTORICAL_CONDITION_QUESTION_IDS for q in f.get("source_question_ids", [])),
                    )
                )

            domain_deltas.append(
                DomainComparisonDelta(
                    domain_key=d_key,
                    domain_title=d_title,
                    newly_reported_count=0,
                    no_longer_reported_count=0,
                    persistent_count=len(dom_factors),
                    positive_adopted_count=0,
                    positive_maintained_count=len(dom_positives),
                    positive_lapsed_count=0,
                    factors=factor_items,
                    unanswered_questions_previous=[],
                    unanswered_questions_current=[],
                    domain_narrative=f"Baseline recorded with {len(dom_factors)} focus area(s) and {len(dom_positives)} positive habit(s).",
                )
            )

        summary = LongitudinalSummary(
            newly_reported_focus_areas_count=0,
            no_longer_reported_focus_areas_count=0,
            persistent_focus_areas_count=len(priority_factors),
            positive_habits_adopted_count=0,
            positive_habits_maintained_count=len(positive_factors),
            positive_habits_lapsed_count=0,
            total_factors_current=len(priority_factors) + len(positive_factors),
            total_factors_previous=0,
            unanswered_questions_current_count=0,
            unanswered_questions_previous_count=0,
            executive_narrative="Initial baseline assessment established. Future assessments will track longitudinal changes across your reported lifestyle and wellness context.",
        )

        return AssessmentComparisonOut(
            comparison_metadata=metadata,
            summary=summary,
            domains=domain_deltas,
            wellness_plan_context=None,
        )

    @classmethod
    def _build_comparison_response(
        cls,
        db: Session,
        user: User,
        current_session: AssessmentSession,
        current_report: Report,
        target_session: AssessmentSession,
        target_report: Report,
        comparison_type: ComparisonType,
    ) -> AssessmentComparisonOut:
        """Executes pure deterministic comparison between two completed snapshots."""
        current_time = current_session.completed_at or current_session.started_at
        target_time = target_session.completed_at or target_session.started_at
        elapsed_days = max(0, (current_time.date() - target_time.date()).days) if current_time and target_time else None

        # 1. Fetch raw responses for missing-data differentiation
        curr_resps = db.query(AssessmentResponse).filter(AssessmentResponse.assessment_session_id == current_session.id).all()
        target_resps = db.query(AssessmentResponse).filter(AssessmentResponse.assessment_session_id == target_session.id).all()
        curr_ans_map: Dict[str, Any] = {r.question_id: r.response_value for r in curr_resps}
        target_ans_map: Dict[str, Any] = {r.question_id: r.response_value for r in target_resps}

        # 2. Inspect version compatibility
        c_ver = current_session.assessment_version or "1.0"
        t_ver = target_session.assessment_version or "1.0"
        compat_notes: List[str] = []
        if c_ver == t_ver:
            schema_compat: SchemaCompatibility = "FULLY_COMPATIBLE"
        else:
            schema_compat = "VERSION_MISMATCH_PARTIAL"
            compat_notes.append(f"Assessment version changed from {t_ver} to {c_ver}. Questionnaire items may vary.")

        # 3. Parse report contents
        c_priority, c_positive = cls._extract_report_factors(current_report)
        t_priority, t_positive = cls._extract_report_factors(target_report)

        # Index factors by stable ID
        c_p_map: Dict[str, Dict[str, Any]] = {f.get("id"): f for f in c_priority if f.get("id")}
        t_p_map: Dict[str, Dict[str, Any]] = {f.get("id"): f for f in t_priority if f.get("id")}
        c_pos_map: Dict[str, Dict[str, Any]] = {f.get("id"): f for f in c_positive if f.get("id")}
        t_pos_map: Dict[str, Dict[str, Any]] = {f.get("id"): f for f in t_positive if f.get("id")}

        # Track global counters
        total_resolved = 0
        total_new = 0
        total_persistent = 0
        total_pos_adopted = 0
        total_pos_maintained = 0
        total_pos_lapsed = 0

        domain_deltas: List[DomainComparisonDelta] = []

        # 4. Compare by Canonical Domain
        for d_key, d_title in CANONICAL_DOMAINS.items():
            dom_factors: List[FactorDeltaItem] = []
            d_resolved = 0
            d_new = 0
            d_persistent = 0
            d_pos_adopted = 0
            d_pos_maintained = 0
            d_pos_lapsed = 0

            # Find all factor IDs relevant to this domain
            all_factor_ids = set()
            for fid, f in c_p_map.items():
                if normalize_domain_key(f.get("domain", "")) == d_key:
                    all_factor_ids.add(fid)
            for fid, f in t_p_map.items():
                if normalize_domain_key(f.get("domain", "")) == d_key:
                    all_factor_ids.add(fid)

            # Analyze modifiable focus areas
            for fid in all_factor_ids:
                in_curr = fid in c_p_map
                in_target = fid in t_p_map
                f_data = c_p_map.get(fid) or t_p_map.get(fid) or {}
                source_q_ids = f_data.get("source_question_ids", [])
                evidence_refs = f_data.get("evidence_refs", [])
                f_title = f_data.get("title", "Focus area")

                is_historical = any(q in HISTORICAL_CONDITION_QUESTION_IDS for q in source_q_ids) or f_data.get("is_historical_condition", False)

                if in_curr and in_target:
                    # Persistent
                    d_persistent += 1
                    total_persistent += 1
                    dom_factors.append(
                        FactorDeltaItem(
                            id=fid,
                            title=f_title,
                            domain=d_key,
                            transition_type="PERSISTENT",
                            explanation="Self-reported contextual focus area remains reported in current assessment.",
                            previous_reported_value=cls._extract_reported_value(source_q_ids, target_ans_map),
                            current_reported_value=cls._extract_reported_value(source_q_ids, curr_ans_map),
                            evidence_refs=evidence_refs,
                            source_question_ids=source_q_ids,
                            is_historical_condition=is_historical,
                        )
                    )
                elif in_target and not in_curr:
                    # Prior factor absent in current
                    if is_historical:
                        dom_factors.append(
                            FactorDeltaItem(
                                id=fid,
                                title=f_title,
                                domain=d_key,
                                transition_type="HISTORICAL_CONDITION_NOT_RECORDED",
                                explanation="Permanent or historical condition was noted in prior assessment but not recorded in current responses. This is an observational change, not a clinical resolution.",
                                previous_reported_value=cls._extract_reported_value(source_q_ids, target_ans_map),
                                current_reported_value=None,
                                evidence_refs=evidence_refs,
                                source_question_ids=source_q_ids,
                                is_historical_condition=True,
                            )
                        )
                    else:
                        was_unanswered_in_curr = (
                            any(_is_negative_or_unreported_value(curr_ans_map.get(q))[0] for q in source_q_ids if q in QUESTION_DOMAIN_MAP)
                            if source_q_ids else False
                        )
                        if was_unanswered_in_curr:
                            dom_factors.append(
                                FactorDeltaItem(
                                    id=fid,
                                    title=f_title,
                                    domain=d_key,
                                    transition_type="NEWLY_RECORDED_CONTEXT",
                                    explanation="Question was unanswered in current assessment; status is unrecorded context rather than no longer present.",
                                    previous_reported_value=cls._extract_reported_value(source_q_ids, target_ans_map),
                                    current_reported_value="Unanswered",
                                    evidence_refs=evidence_refs,
                                    source_question_ids=source_q_ids,
                                    is_historical_condition=False,
                                )
                            )
                        else:
                            d_resolved += 1
                            total_resolved += 1
                            dom_factors.append(
                                FactorDeltaItem(
                                    id=fid,
                                    title=f_title,
                                    domain=d_key,
                                    transition_type="NO_LONGER_REPORTED",
                                    explanation="Self-reported focus area is no longer reported in this assessment.",
                                    previous_reported_value=cls._extract_reported_value(source_q_ids, target_ans_map),
                                    current_reported_value=cls._extract_reported_value(source_q_ids, curr_ans_map),
                                    evidence_refs=evidence_refs,
                                    source_question_ids=source_q_ids,
                                    is_historical_condition=False,
                                )
                            )
                elif in_curr and not in_target:
                    # Current factor absent in prior
                    # Check whether question was unanswered in target assessment
                    was_unanswered_in_target = any(
                        target_ans_map.get(q) is None for q in source_q_ids if q in QUESTION_DOMAIN_MAP
                    )
                    if was_unanswered_in_target:
                        dom_factors.append(
                            FactorDeltaItem(
                                id=fid,
                                title=f_title,
                                domain=d_key,
                                transition_type="NEWLY_RECORDED_CONTEXT",
                                explanation="Newly recorded context; question was unanswered in prior assessment.",
                                previous_reported_value="Unanswered",
                                current_reported_value=cls._extract_reported_value(source_q_ids, curr_ans_map),
                                evidence_refs=evidence_refs,
                                source_question_ids=source_q_ids,
                                is_historical_condition=is_historical,
                            )
                        )
                    else:
                        d_new += 1
                        total_new += 1
                        dom_factors.append(
                            FactorDeltaItem(
                                id=fid,
                                title=f_title,
                                domain=d_key,
                                transition_type="NEWLY_REPORTED",
                                explanation="Newly reported focus area identified in current assessment.",
                                previous_reported_value=cls._extract_reported_value(source_q_ids, target_ans_map),
                                current_reported_value=cls._extract_reported_value(source_q_ids, curr_ans_map),
                                evidence_refs=evidence_refs,
                                source_question_ids=source_q_ids,
                                is_historical_condition=is_historical,
                            )
                        )

            # Analyze positive / protective habits
            all_pos_ids = set()
            for fid, f in c_pos_map.items():
                if normalize_domain_key(f.get("domain", "")) == d_key:
                    all_pos_ids.add(fid)
            for fid, f in t_pos_map.items():
                if normalize_domain_key(f.get("domain", "")) == d_key:
                    all_pos_ids.add(fid)

            for fid in all_pos_ids:
                in_curr = fid in c_pos_map
                in_target = fid in t_pos_map
                f_data = c_pos_map.get(fid) or t_pos_map.get(fid) or {}
                source_q_ids = f_data.get("source_question_ids", [])
                evidence_refs = f_data.get("evidence_refs", [])
                f_title = f_data.get("title", "Positive habit")

                if in_curr and in_target:
                    d_pos_maintained += 1
                    total_pos_maintained += 1
                    dom_factors.append(
                        FactorDeltaItem(
                            id=fid,
                            title=f_title,
                            domain=d_key,
                            transition_type="POSITIVE_MAINTAINED",
                            explanation="Protective lifestyle routine continued from prior assessment.",
                            previous_reported_value=cls._extract_reported_value(source_q_ids, target_ans_map),
                            current_reported_value=cls._extract_reported_value(source_q_ids, curr_ans_map),
                            evidence_refs=evidence_refs,
                            source_question_ids=source_q_ids,
                            is_historical_condition=False,
                        )
                    )
                elif in_curr and not in_target:
                    d_pos_adopted += 1
                    total_pos_adopted += 1
                    dom_factors.append(
                        FactorDeltaItem(
                            id=fid,
                            title=f_title,
                            domain=d_key,
                            transition_type="POSITIVE_ADOPTED",
                            explanation="Newly reported protective lifestyle habit.",
                            previous_reported_value=cls._extract_reported_value(source_q_ids, target_ans_map),
                            current_reported_value=cls._extract_reported_value(source_q_ids, curr_ans_map),
                            evidence_refs=evidence_refs,
                            source_question_ids=source_q_ids,
                            is_historical_condition=False,
                        )
                    )
                elif in_target and not in_curr:
                    d_pos_lapsed += 1
                    total_pos_lapsed += 1
                    dom_factors.append(
                        FactorDeltaItem(
                            id=fid,
                            title=f_title,
                            domain=d_key,
                            transition_type="POSITIVE_LAPSED",
                            explanation="Protective habit noted previously is no longer reported.",
                            previous_reported_value=cls._extract_reported_value(source_q_ids, target_ans_map),
                            current_reported_value=cls._extract_reported_value(source_q_ids, curr_ans_map),
                            evidence_refs=evidence_refs,
                            source_question_ids=source_q_ids,
                            is_historical_condition=False,
                        )
                    )

            # Track domain unanswered questions
            domain_q_ids = [q for q, dom in QUESTION_DOMAIN_MAP.items() if normalize_domain_key(dom) == d_key]
            unanswered_prev = [q for q in domain_q_ids if _is_negative_or_unreported_value(target_ans_map.get(q))[0]]
            unanswered_curr = [q for q in domain_q_ids if _is_negative_or_unreported_value(curr_ans_map.get(q))[0]]

            # Domain narrative
            dom_narrative = cls._build_domain_narrative(
                domain_title=d_title,
                resolved=d_resolved,
                new=d_new,
                persistent=d_persistent,
                pos_adopted=d_pos_adopted,
                pos_maintained=d_pos_maintained,
            )

            domain_deltas.append(
                DomainComparisonDelta(
                    domain_key=d_key,
                    domain_title=d_title,
                    newly_reported_count=d_new,
                    no_longer_reported_count=d_resolved,
                    persistent_count=d_persistent,
                    positive_adopted_count=d_pos_adopted,
                    positive_maintained_count=d_pos_maintained,
                    positive_lapsed_count=d_pos_lapsed,
                    factors=dom_factors,
                    unanswered_questions_previous=unanswered_prev,
                    unanswered_questions_current=unanswered_curr,
                    domain_narrative=dom_narrative,
                )
            )

        # 5. Intersect with Wellness Plan adherence
        wellness_context = cls._compute_wellness_adherence_context(
            db=db,
            user=user,
            start_date=target_time.date() if target_time else None,
            end_date=current_time.date() if current_time else None,
        )

        # 6. Overall Narrative
        exec_narrative = (
            f"Over {elapsed_days or 0} days between assessments, you reported {total_resolved} focus area(s) no longer present, "
            f"{total_new} newly identified focus area(s), and maintained {total_pos_maintained} positive habit(s). "
            f"{total_persistent} focus area(s) remain persistent."
        )

        summary = LongitudinalSummary(
            newly_reported_focus_areas_count=total_new,
            no_longer_reported_focus_areas_count=total_resolved,
            persistent_focus_areas_count=total_persistent,
            positive_habits_adopted_count=total_pos_adopted,
            positive_habits_maintained_count=total_pos_maintained,
            positive_habits_lapsed_count=total_pos_lapsed,
            total_factors_current=len(c_priority) + len(c_positive),
            total_factors_previous=len(t_priority) + len(t_positive),
            unanswered_questions_current_count=sum(len(d.unanswered_questions_current) for d in domain_deltas),
            unanswered_questions_previous_count=sum(len(d.unanswered_questions_previous) for d in domain_deltas),
            executive_narrative=exec_narrative,
        )

        metadata = ComparisonMetadata(
            current_assessment_id=current_session.id,
            current_completed_at=current_time,
            current_assessment_version=c_ver,
            comparison_target_id=target_session.id,
            comparison_completed_at=target_time,
            comparison_assessment_version=t_ver,
            comparison_type=comparison_type,
            elapsed_days=elapsed_days,
            has_comparison=True,
            schema_compatibility=schema_compat,
            compatibility_notes=compat_notes,
        )

        return AssessmentComparisonOut(
            comparison_metadata=metadata,
            summary=summary,
            domains=domain_deltas,
            wellness_plan_context=wellness_context,
        )

    @classmethod
    def _extract_reported_value(cls, source_q_ids: List[str], ans_map: Dict[str, Any]) -> Optional[str]:
        """Extracts human-readable response string for source questions."""
        values = []
        for q in source_q_ids:
            if q in ans_map and ans_map[q] is not None:
                val = ans_map[q]
                if isinstance(val, list):
                    values.append(", ".join(str(item) for item in val))
                else:
                    values.append(str(val))
        return "; ".join(values) if values else None

    @classmethod
    def _build_domain_narrative(
        cls,
        domain_title: str,
        resolved: int,
        new: int,
        persistent: int,
        pos_adopted: int,
        pos_maintained: int,
    ) -> str:
        """Constructs an observational, calibrated summary statement for a domain."""
        parts = []
        if resolved > 0:
            parts.append(f"{resolved} focus area(s) no longer reported")
        if new > 0:
            parts.append(f"{new} newly reported focus area(s)")
        if persistent > 0:
            parts.append(f"{persistent} persistent area(s)")
        if pos_adopted > 0:
            parts.append(f"{pos_adopted} positive habit(s) adopted")
        if pos_maintained > 0:
            parts.append(f"{pos_maintained} positive habit(s) maintained")

        if not parts:
            return f"Consistent baseline context observed in {domain_title}."
        return f"{domain_title}: " + ", ".join(parts) + "."

    @classmethod
    def _compute_wellness_adherence_context(
        cls,
        db: Session,
        user: User,
        start_date: Optional[date],
        end_date: Optional[date],
    ) -> Optional[WellnessPlanAdherenceContext]:
        """
        Extracts verified self-reported action logs between the two assessment dates.
        Never fabricates records or claims causality.
        """
        if not start_date or not end_date:
            return None

        # Fetch active or completed plan
        plan = (
            db.query(WellnessPlan)
            .filter(WellnessPlan.user_id == user.id)
            .order_by(WellnessPlan.created_at.desc())
            .first()
        )
        if not plan:
            return None

        # Query action logs in the intervening date window
        logs = (
            db.query(WellnessActionLog)
            .filter(
                WellnessActionLog.user_id == user.id,
                WellnessActionLog.date >= start_date,
                WellnessActionLog.date <= end_date,
            )
            .all()
        )

        total_logged = len(logs)
        if total_logged == 0:
            return WellnessPlanAdherenceContext(
                has_linked_plan=True,
                plan_id=plan.id,
                plan_title=plan.title,
                intervening_completed_actions_count=0,
                intervening_total_scheduled_actions_count=0,
                adherence_rate_pct=None,
                adherence_narrative="No self-reported wellness plan action logs were recorded in the intervening period between assessments.",
            )

        completed_count = sum(1 for l in logs if l.status == "completed")
        adherence_pct = round((completed_count / total_logged) * 100.0, 1)

        narrative = (
            f"You logged {completed_count} completed wellness action(s) out of {total_logged} scheduled entries "
            f"({adherence_pct}% adherence) in your wellness plan between assessments."
        )

        return WellnessPlanAdherenceContext(
            has_linked_plan=True,
            plan_id=plan.id,
            plan_title=plan.title,
            intervening_completed_actions_count=completed_count,
            intervening_total_scheduled_actions_count=total_logged,
            adherence_rate_pct=adherence_pct,
            adherence_narrative=narrative,
        )

    @classmethod
    def _extract_report_factors(cls, report: Optional[Report]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Extracts priority focus areas and positive protective habits from a Report.
        Handles modern schema (priority_factors / positive_factors),
        structured_findings, and domain section representations.
        """
        if not report:
            return [], []

        content = report.report_content or {}
        priority: List[Dict[str, Any]] = list(content.get("priority_factors") or [])
        positive: List[Dict[str, Any]] = list(content.get("positive_factors") or [])

        if not priority and getattr(report, "structured_findings", None):
            priority = list(report.structured_findings)

        # Also extract from domain section blocks if present
        for d_key in CANONICAL_DOMAINS:
            dom_obj = content.get(d_key) or {}
            if isinstance(dom_obj, dict):
                # risk / priority factors
                for rf in dom_obj.get("risk_factors") or dom_obj.get("priority_factors") or []:
                    if isinstance(rf, str):
                        rf_item = {"id": rf.lower().replace(" ", "_"), "title": rf, "domain": d_key, "description": rf}
                    elif isinstance(rf, dict):
                        rf_item = dict(rf)
                        fid = rf_item.get("id") or rf_item.get("factor") or rf_item.get("title") or "factor"
                        rf_item["id"] = fid.lower().replace(" ", "_") if isinstance(fid, str) else str(fid)
                        rf_item.setdefault("title", rf_item.get("factor", rf_item.get("title", "Focus area")))
                        rf_item.setdefault("domain", d_key)
                    else:
                        continue
                    if not any(x.get("id") == rf_item["id"] for x in priority):
                        priority.append(rf_item)

                # positive habits / protective factors
                for pf in dom_obj.get("positive_habits") or dom_obj.get("positive_factors") or []:
                    if isinstance(pf, str):
                        pf_item = {"id": pf.lower().replace(" ", "_"), "title": pf, "domain": d_key, "description": pf}
                    elif isinstance(pf, dict):
                        pf_item = dict(pf)
                        fid = pf_item.get("id") or pf_item.get("factor") or pf_item.get("title") or "habit"
                        pf_item["id"] = fid.lower().replace(" ", "_") if isinstance(fid, str) else str(fid)
                        pf_item.setdefault("title", pf_item.get("factor", pf_item.get("title", "Positive habit")))
                        pf_item.setdefault("domain", d_key)
                    else:
                        continue
                    if not any(x.get("id") == pf_item["id"] for x in positive):
                        positive.append(pf_item)

        return priority, positive

