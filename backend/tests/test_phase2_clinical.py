"""
MantraAI — Phase 2 Clinical Correctness Tests
===============================================

EXIT CRITERIA (from implementation brief):
  - PHQ-9 boundary tests: sub-threshold (score<10) → no follow_up; threshold+ (score>=10) → follow_up
  - GAD-7 boundary tests: sub-threshold (score<10) → no follow_up; threshold+ (score>=10) → follow_up
  - Crisis flow: phq9_item_9==0 → no crisis flag; phq9_item_9>0 → crisis_flag=True, crisis_support in report
  - Privacy shield: raw phq9_item_9 integer never appears in the LLM user prompt payload
  - v1 legacy session: old slider values go to legacy_scores bucket, v2 cutoffs not applied
  - Overall category boundaries match evidence_grades.py thresholds

All mocks are synthetic only. No real user data is used.
"""

import json
import sys
import os

from datetime import datetime, timezone
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.normalizer import normalize_assessment_responses, NormalizedAssessment
from app.services.context_engine import build_health_context, HealthContext, FactorItem
from app.services.evidence_retriever import EvidenceContext
from app.services.report_generator import build_user_prompt, build_fallback_report
from app.schemas.report import MantraAIReport, ReportMetadata
from app.services.evidence_grades import (
    ATTENTION_THRESHOLD_FOLLOW_UPS,
    ATTENTION_THRESHOLD_MODIFIABLE,
    MONITORING_THRESHOLD_MODIFIABLE_MIN,
    MONITORING_THRESHOLD_MODIFIABLE_MAX,
)


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _phq9_answers(item9_val: int, other_items_val: int = 0) -> dict:
    """Build a minimal answers dict with all nine PHQ-9 items."""
    answers = {f"phq9_item_{i}": other_items_val for i in range(1, 9)}
    answers["phq9_item_9"] = item9_val
    return answers


def _phq9_score_answers(score: int) -> dict:
    """Build answers that produce a specific total PHQ-9 score (items 1-8 only, item9=0)."""
    per_item = score // 8
    remainder = score % 8
    answers = {}
    for i in range(1, 9):
        answers[f"phq9_item_{i}"] = per_item + (1 if i <= remainder else 0)
    answers["phq9_item_9"] = 0
    return answers


def _gad7_score_answers(score: int) -> dict:
    """Build answers that produce a specific total GAD-7 score."""
    per_item = score // 7
    remainder = score % 7
    answers = {}
    for i in range(1, 8):
        answers[f"gad7_item_{i}"] = per_item + (1 if i <= remainder else 0)
    return answers


def _minimal_evidence_context() -> EvidenceContext:
    return EvidenceContext(items=[], matched_count=0, query_tags=[], retrieval_notes="test")


def _minimal_metadata() -> ReportMetadata:
    return ReportMetadata(
        report_version="2.0",
        generated_at=datetime.now(timezone.utc).isoformat(),
        model_provider="test",
        model_name="test-model",
    )


# ──────────────────────────────────────────────────────────────────────────────
# Crisis Flow Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestCrisisFlow:
    """PHQ-9 Item 9 crisis safety flag — server-side derivation and report injection."""

    def test_item9_zero_no_crisis_flag(self):
        """phq9_item_9 == 0 → crisis_flag MUST be False (no suicidal ideation)."""
        answers = _phq9_answers(item9_val=0)
        normalized = normalize_assessment_responses(answers)
        hc = build_health_context(normalized)

        crisis_factors = [f for f in hc.follow_up_flags if f.id == "phq9_item9_safety_flag"]
        assert len(crisis_factors) == 0, (
            "phq9_item9_safety_flag should NOT appear in follow_up_flags when item9=0"
        )

    def test_item9_one_triggers_crisis_flag(self):
        """phq9_item_9 == 1 → crisis_flag factor MUST appear in follow_up_flags."""
        answers = _phq9_answers(item9_val=1)
        normalized = normalize_assessment_responses(answers)
        hc = build_health_context(normalized)

        crisis_factors = [f for f in hc.follow_up_flags if f.id == "phq9_item9_safety_flag"]
        assert len(crisis_factors) == 1, (
            "phq9_item9_safety_flag MUST appear in follow_up_flags when item9=1"
        )

    def test_item9_three_triggers_crisis_flag(self):
        """phq9_item_9 == 3 (max) → crisis_flag factor MUST appear in follow_up_flags."""
        answers = _phq9_answers(item9_val=3)
        normalized = normalize_assessment_responses(answers)
        hc = build_health_context(normalized)

        crisis_factors = [f for f in hc.follow_up_flags if f.id == "phq9_item9_safety_flag"]
        assert len(crisis_factors) == 1

    def test_crisis_factor_has_correct_tags(self):
        """Crisis factor must carry safety_flag evidence tags."""
        answers = _phq9_answers(item9_val=2)
        normalized = normalize_assessment_responses(answers)
        hc = build_health_context(normalized)

        crisis_factors = [f for f in hc.follow_up_flags if f.id == "phq9_item9_safety_flag"]
        assert len(crisis_factors) == 1
        tags = crisis_factors[0].evidence_tags
        assert "safety_flag" in tags

    def test_fallback_report_crisis_section_present_when_flag_true(self):
        """build_fallback_report with crisis_flag=True MUST include crisis_support section."""
        answers = _phq9_answers(item9_val=1)
        normalized = normalize_assessment_responses(answers)
        hc = build_health_context(normalized)
        ec = _minimal_evidence_context()

        report = build_fallback_report(
            normalized_assessment=normalized,
            health_context=hc,
            evidence_context=ec,
            metadata=_minimal_metadata(),
            crisis_flag=True,
        )

        assert isinstance(report, MantraAIReport)
        assert report.crisis_support is not None, "crisis_support section must be present when crisis_flag=True"
        assert len(report.crisis_support.helplines) > 0, "At least one helpline must be listed"



    def test_fallback_report_crisis_section_absent_when_flag_false(self):
        """build_fallback_report with crisis_flag=False MUST NOT include crisis_support section."""
        answers = _phq9_answers(item9_val=0)
        normalized = normalize_assessment_responses(answers)
        hc = build_health_context(normalized)
        ec = _minimal_evidence_context()

        report = build_fallback_report(
            normalized_assessment=normalized,
            health_context=hc,
            evidence_context=ec,
            metadata=_minimal_metadata(),
            crisis_flag=False,
        )

        assert isinstance(report, MantraAIReport)
        assert report.crisis_support is None, "crisis_support section MUST be absent when crisis_flag=False"

    def test_crisis_helplines_contain_verified_numbers(self):
        """Crisis helplines must list verified Indian numbers (Tele-MANAS / KIRAN / Emergency)."""
        answers = _phq9_answers(item9_val=1)
        normalized = normalize_assessment_responses(answers)
        hc = build_health_context(normalized)
        ec = _minimal_evidence_context()

        report = build_fallback_report(
            normalized_assessment=normalized,
            health_context=hc,
            evidence_context=ec,
            metadata=_minimal_metadata(),
            crisis_flag=True,
        )

        helpline_numbers = {h.number for h in report.crisis_support.helplines}
        assert any("14416" in n for n in helpline_numbers), (
            "Tele-MANAS short code 14416 must be present"
        )


# ──────────────────────────────────────────────────────────────────────────────
# Privacy Shield Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestPrivacyShield:
    """PHQ-9 item 9 raw value must NEVER appear in the LLM user prompt payload."""

    def _build_prompt_payload_dict(self, item9_val: int) -> dict:
        answers = _phq9_answers(item9_val=item9_val, other_items_val=2)
        normalized = normalize_assessment_responses(answers)
        hc = build_health_context(normalized)
        ec = _minimal_evidence_context()
        meta = _minimal_metadata()

        prompt_str = build_user_prompt(
            normalized_assessment=normalized,
            health_context=hc,
            evidence_context=ec,
            metadata=meta,
            crisis_flag=(item9_val > 0),
        )
        return json.loads(prompt_str)

    def test_phq9_item9_absent_from_prompt_when_crisis(self):
        """When item9=2, phq9_item_9 key must NOT appear in assessment_context (privacy shield).
        Note: the question ID string may appear in valid_question_ids_to_cite but the actual
        RESPONSE VALUE must never reach the LLM."""
        payload = self._build_prompt_payload_dict(item9_val=2)
        # The raw response value for phq9_item_9 must be scrubbed from assessment_context
        mental_ctx = payload.get("assessment_context", {}).get("mental_health_stress", {})
        assert "phq9_item_9" not in mental_ctx, (
            "phq9_item_9 must be scrubbed from assessment_context[mental_health_stress] (privacy shield)"
        )

    def test_phq9_item9_absent_from_prompt_when_no_crisis(self):
        """Even when item9=0, phq9_item_9 must NOT appear in assessment_context."""
        payload = self._build_prompt_payload_dict(item9_val=0)
        mental_ctx = payload.get("assessment_context", {}).get("mental_health_stress", {})
        assert "phq9_item_9" not in mental_ctx

    def test_crisis_support_shown_flag_present_in_prompt(self):
        """crisis_support_shown field must be True in payload when crisis_flag=True."""
        payload = self._build_prompt_payload_dict(item9_val=1)
        assert payload.get("crisis_support_shown") is True

    def test_crisis_support_shown_false_when_no_crisis(self):
        """crisis_support_shown must be False in payload when crisis_flag=False."""
        payload = self._build_prompt_payload_dict(item9_val=0)
        assert payload.get("crisis_support_shown") is False


# ──────────────────────────────────────────────────────────────────────────────
# PHQ-9 Boundary Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestPHQ9Boundaries:
    """PHQ-9 sub-threshold / threshold boundary classification (cutoff at score >= 10)."""

    def _hc_for_phq9(self, total_score: int) -> HealthContext:
        answers = _phq9_score_answers(total_score)
        normalized = normalize_assessment_responses(answers)
        return build_health_context(normalized)

    def _has_phq9_follow_up(self, hc: HealthContext) -> bool:
        return any(f.id == "elevated_mood_screening_proxy" for f in hc.follow_up_flags)

    def test_phq9_score_4_sub_threshold(self):
        """PHQ-9 score = 4 (mild-borderline) → no elevated_mood_screening_proxy follow_up."""
        hc = self._hc_for_phq9(4)
        assert not self._has_phq9_follow_up(hc), "PHQ-9 score 4 must not trigger follow_up"

    def test_phq9_score_9_sub_threshold(self):
        """PHQ-9 score = 9 (just below moderate threshold) → no follow_up."""
        hc = self._hc_for_phq9(9)
        assert not self._has_phq9_follow_up(hc), "PHQ-9 score 9 must not trigger follow_up"

    def test_phq9_score_10_threshold(self):
        """PHQ-9 score = 10 (moderate threshold) → elevated_mood_screening_proxy follow_up."""
        hc = self._hc_for_phq9(10)
        assert self._has_phq9_follow_up(hc), "PHQ-9 score 10 MUST trigger follow_up"

    def test_phq9_score_14_moderate(self):
        """PHQ-9 score = 14 (within moderate band) → follow_up triggered."""
        hc = self._hc_for_phq9(14)
        assert self._has_phq9_follow_up(hc)

    def test_phq9_score_15_moderately_severe(self):
        """PHQ-9 score = 15 (moderately severe band) → follow_up triggered."""
        hc = self._hc_for_phq9(15)
        assert self._has_phq9_follow_up(hc)

    def test_phq9_score_19_moderately_severe(self):
        """PHQ-9 score = 19 → follow_up triggered."""
        hc = self._hc_for_phq9(19)
        assert self._has_phq9_follow_up(hc)

    def test_phq9_score_20_severe(self):
        """PHQ-9 score = 20 (severe band) → follow_up triggered."""
        hc = self._hc_for_phq9(20)
        assert self._has_phq9_follow_up(hc)

    def test_phq9_score_0_no_follow_up(self):
        """PHQ-9 score = 0 (minimal) → no follow_up."""
        hc = self._hc_for_phq9(0)
        assert not self._has_phq9_follow_up(hc), "PHQ-9 score 0 must not trigger follow_up"


# ──────────────────────────────────────────────────────────────────────────────
# GAD-7 Boundary Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestGAD7Boundaries:
    """GAD-7 sub-threshold / threshold boundary classification (cutoff at score >= 10)."""

    def _hc_for_gad7(self, total_score: int) -> HealthContext:
        answers = _gad7_score_answers(total_score)
        normalized = normalize_assessment_responses(answers)
        return build_health_context(normalized)

    def _has_gad7_follow_up(self, hc: HealthContext) -> bool:
        return any(f.id == "elevated_anxiety_screening_proxy" for f in hc.follow_up_flags)

    def test_gad7_score_4_sub_threshold(self):
        """GAD-7 score = 4 (mild-borderline) → no elevated_anxiety_screening_proxy follow_up."""
        hc = self._hc_for_gad7(4)
        assert not self._has_gad7_follow_up(hc), "GAD-7 score 4 must not trigger follow_up"

    def test_gad7_score_9_sub_threshold(self):
        """GAD-7 score = 9 (just below moderate threshold) → no follow_up."""
        hc = self._hc_for_gad7(9)
        assert not self._has_gad7_follow_up(hc), "GAD-7 score 9 must not trigger follow_up"

    def test_gad7_score_10_threshold(self):
        """GAD-7 score = 10 (moderate threshold) → elevated_anxiety_screening_proxy follow_up."""
        hc = self._hc_for_gad7(10)
        assert self._has_gad7_follow_up(hc), "GAD-7 score 10 MUST trigger follow_up"

    def test_gad7_score_14_moderate(self):
        """GAD-7 score = 14 → follow_up triggered."""
        hc = self._hc_for_gad7(14)
        assert self._has_gad7_follow_up(hc)

    def test_gad7_score_15_severe(self):
        """GAD-7 score = 15 (severe band) → follow_up triggered."""
        hc = self._hc_for_gad7(15)
        assert self._has_gad7_follow_up(hc)

    def test_gad7_score_21_max(self):
        """GAD-7 score = 21 (max) → follow_up triggered."""
        hc = self._hc_for_gad7(21)
        assert self._has_gad7_follow_up(hc)

    def test_gad7_score_0_no_follow_up(self):
        """GAD-7 score = 0 → no follow_up."""
        hc = self._hc_for_gad7(0)
        assert not self._has_gad7_follow_up(hc)


# ──────────────────────────────────────────────────────────────────────────────
# Overall Category Boundary Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestOverallCategoryBoundaries:
    """
    Server-side category thresholds from evidence_grades.py:
      ATTENTION_THRESHOLD_FOLLOW_UPS = 1  (>=1 follow_up -> "Several areas need attention")
      ATTENTION_THRESHOLD_MODIFIABLE = 4  (>=4 grade A/B modifiable -> "Several areas need attention")
      MONITORING_THRESHOLD_MODIFIABLE_MIN = 2  (>=2 grade A/B modifiable -> "Worth monitoring")
      else -> "Stable"
    """

    def _compute_category(self, total_ab_modifiable: int, total_follow_ups: int) -> str:
        """Mirror the category logic from assessment.py router."""
        if total_follow_ups >= ATTENTION_THRESHOLD_FOLLOW_UPS or total_ab_modifiable >= ATTENTION_THRESHOLD_MODIFIABLE:
            return "Several areas need attention"
        elif total_ab_modifiable >= MONITORING_THRESHOLD_MODIFIABLE_MIN:
            return "Worth monitoring"
        else:
            return "Stable"

    def test_zero_factors_is_stable(self):
        """0 grade A/B modifiable + 0 follow_ups -> Stable."""
        assert self._compute_category(0, 0) == "Stable"

    def test_one_ab_modifiable_no_followup_is_stable(self):
        """1 grade A/B modifiable + 0 follow_ups -> Stable (below monitoring threshold)."""
        assert self._compute_category(1, 0) == "Stable"

    def test_two_ab_modifiable_is_worth_monitoring(self):
        """2 grade A/B modifiable + 0 follow_ups -> Worth monitoring."""
        assert self._compute_category(2, 0) == "Worth monitoring"

    def test_three_ab_modifiable_is_worth_monitoring(self):
        """3 grade A/B modifiable + 0 follow_ups -> Worth monitoring."""
        assert self._compute_category(3, 0) == "Worth monitoring"

    def test_four_ab_modifiable_needs_attention(self):
        """4 grade A/B modifiable -> Several areas need attention."""
        assert self._compute_category(4, 0) == "Several areas need attention"

    def test_five_ab_modifiable_needs_attention(self):
        """5 grade A/B modifiable -> Several areas need attention."""
        assert self._compute_category(5, 0) == "Several areas need attention"

    def test_one_follow_up_triggers_attention(self):
        """1 follow_up (even with 0 modifiable) -> Several areas need attention."""
        assert self._compute_category(0, 1) == "Several areas need attention"

    def test_one_follow_up_with_one_ab_modifiable_triggers_attention(self):
        """1 follow_up + 1 grade A/B modifiable -> Several areas need attention."""
        assert self._compute_category(1, 1) == "Several areas need attention"

    def test_thresholds_are_published_constants(self):
        """Published threshold constants must match expected clinical values."""
        assert ATTENTION_THRESHOLD_FOLLOW_UPS == 1
        assert ATTENTION_THRESHOLD_MODIFIABLE == 4
        assert MONITORING_THRESHOLD_MODIFIABLE_MIN == 2
        assert MONITORING_THRESHOLD_MODIFIABLE_MAX == 3


# ──────────────────────────────────────────────────────────────────────────────
# V1 Legacy Session Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestV1LegacySession:
    """
    Assessment version 1.0 sessions: old slider composite keys go to legacy_scores bucket
    and are NOT re-scored with v2 per-item cutoffs.
    """

    def test_v1_legacy_keys_stored_in_legacy_scores(self):
        """perceived_stress_pss10 + gad7_score with version='1.0' -> in legacy_scores."""
        answers = {
            "perceived_stress_pss10": 24,
            "gad7_score": 12,
            "phq9_score": 8,
        }
        normalized = normalize_assessment_responses(answers, version="1.0")

        assert "perceived_stress_pss10" in normalized.legacy_scores, (
            "perceived_stress_pss10 must land in legacy_scores for v1.0 session"
        )
        assert normalized.legacy_scores["gad7_score"] == 12
        assert normalized.legacy_scores["phq9_score"] == 8

    def test_v1_legacy_keys_not_in_mental_health_domain(self):
        """Legacy PSS-10 score must NOT appear in mental_health_stress domain bucket."""
        answers = {"perceived_stress_pss10": 24, "gad7_score": 12}
        normalized = normalize_assessment_responses(answers, version="1.0")

        assert "perceived_stress_pss10" not in normalized.mental_health_stress, (
            "perceived_stress_pss10 must not be routed to mental_health_stress in v1.0 mode"
        )

    def test_v2_legacy_key_treated_as_unmapped(self):
        """
        For version='2.0' (default), perceived_stress_pss10 is unknown -> unmapped_fields.
        """
        answers = {"perceived_stress_pss10": 24}
        normalized = normalize_assessment_responses(answers)

        assert "perceived_stress_pss10" in normalized.unmapped_fields, (
            "perceived_stress_pss10 must end up in unmapped_fields for v2 schema"
        )

    def test_v1_session_no_derived_phq9_score(self):
        """
        For version='1.0', legacy composite phq9_score must NOT trigger v2 per-item
        derived score computation.
        """
        answers = {"phq9_score": 15}
        normalized = normalize_assessment_responses(answers, version="1.0")
        assert "phq9_score" not in normalized.mental_health_stress, (
            "v1.0 legacy phq9_score must not appear in mental_health_stress"
        )
        assert normalized.legacy_scores.get("phq9_score") == 15

    def test_v2_session_derives_phq9_score_from_items(self):
        """
        For version='2.0' (default), per-item PHQ-9 entries are summed into phq9_score.
        """
        answers = {f"phq9_item_{i}": 1 for i in range(1, 10)}
        normalized = normalize_assessment_responses(answers)

        derived_score = normalized.mental_health_stress.get("phq9_score")
        assert derived_score == 9, (
            f"v2 normalizer must derive phq9_score=9 from 9 items each=1; got {derived_score}"
        )

    def test_v2_session_derives_gad7_score_from_items(self):
        """
        For version='2.0', per-item GAD-7 entries are summed into gad7_score automatically.
        """
        answers = {f"gad7_item_{i}": 2 for i in range(1, 8)}
        normalized = normalize_assessment_responses(answers)

        derived_score = normalized.mental_health_stress.get("gad7_score")
        assert derived_score == 14, (
            f"v2 normalizer must derive gad7_score=14 from 7 items each=2; got {derived_score}"
        )


# ──────────────────────────────────────────────────────────────────────────────
# Wording Invariants — No Forbidden Instrument Names
# ──────────────────────────────────────────────────────────────────────────────

class TestWordingInvariants:
    """Ensure no visible user-facing strings contain forbidden instrument labels."""

    def test_fallback_report_has_no_psqi_string(self):
        """Fallback report text must never contain 'PSQI'."""
        normalized = normalize_assessment_responses({"perceived_stress_rating": 5})
        hc = build_health_context(normalized)
        ec = _minimal_evidence_context()

        report = build_fallback_report(
            normalized_assessment=normalized,
            health_context=hc,
            evidence_context=ec,
            metadata=_minimal_metadata(),
            crisis_flag=False,
        )
        report_json = json.dumps(report.model_dump())
        assert "PSQI" not in report_json, "Fallback report must not contain 'PSQI'"

    def test_fallback_report_has_no_pss10_string(self):
        """Fallback report text must never contain 'PSS-10'."""
        normalized = normalize_assessment_responses({"perceived_stress_rating": 5})
        hc = build_health_context(normalized)
        ec = _minimal_evidence_context()

        report = build_fallback_report(
            normalized_assessment=normalized,
            health_context=hc,
            evidence_context=ec,
            metadata=_minimal_metadata(),
            crisis_flag=False,
        )
        report_json = json.dumps(report.model_dump())
        assert "PSS-10" not in report_json, "Fallback report must not contain 'PSS-10'"

    def test_user_prompt_has_no_pss10_string(self):
        """LLM user prompt payload must never contain 'PSS-10'."""
        normalized = normalize_assessment_responses({"perceived_stress_rating": 5})
        hc = build_health_context(normalized)
        ec = _minimal_evidence_context()
        meta = _minimal_metadata()

        prompt_str = build_user_prompt(
            normalized_assessment=normalized,
            health_context=hc,
            evidence_context=ec,
            metadata=meta,
            crisis_flag=False,
        )
        assert "PSS-10" not in prompt_str, "LLM user prompt must not contain 'PSS-10'"
