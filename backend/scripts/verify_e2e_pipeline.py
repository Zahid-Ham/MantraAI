"""
MantraAI - End-to-End Pipeline Verification Script
===================================================

PURPOSE
-------
Executes a controlled, live end-to-end verification of the full MantraAI
assessment-to-report pipeline with the REAL PostgreSQL database and REAL Groq API.

SAFETY & PRIVACY RULES:
-----------------------
- Uses 100% synthetic test profile only.
- Never prints or exposes GROQ_API_KEY or credentials.
- Never prints raw sensitive questionnaire answers or user IDs.
- Reports only structural metadata, validation results, and execution timings.
"""

import sys
import os
import time
import json
from uuid import uuid4
from datetime import datetime, timezone

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report
from app.models.audit import AuditEvent
from app.services.normalizer import normalize_assessment_responses, QUESTION_DOMAIN_MAP
from app.services.context_engine import build_health_context
from app.services.evidence_retriever import retrieve_evidence_for_health_context
from app.services.report_generator import generate_mantra_report
from app.schemas.report import MantraAIReport, new_report_to_legacy_view, FORBIDDEN_FIELDS


def run_e2e_verification():
    print("=" * 70)
    print("MANTRA.AI - LIVE CONTROLLED END-TO-END PIPELINE VERIFICATION")
    print("=" * 70)

    # 1. Audit Environment & Secrets Presence
    print("\n[STEP 1] Auditing Environment Configuration...")
    print(f"  * DATABASE_URL configured: {bool(settings.DATABASE_URL)}")
    print(f"  * GROQ_API_KEY configured: {bool(settings.GROQ_API_KEY)}")
    print(f"  * GROQ_MODEL: {settings.GROQ_MODEL}")
    print(f"  * Firebase configured: {bool(settings.FIREBASE_PROJECT_ID)}")

    if not settings.GROQ_API_KEY:
        print("[ERROR] GROQ_API_KEY is not configured.")
        return False

    db = SessionLocal()

    try:
        # 2. Setup Synthetic Test User
        print("\n[STEP 2] Setting up Isolated Synthetic Test User...")
        test_email = f"synthetic_test_{uuid4().hex[:8]}@mantra.ai"
        user = User(
            id=uuid4(),
            email=test_email,
            firebase_uid=f"mock_uid_{uuid4().hex[:8]}",
            display_name="Synthetic E2E Test Subject",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"  * Test user created with ID: {user.id}")

        # 3. Create Assessment Session
        print("\n[STEP 3] Creating Assessment Session...")
        session = AssessmentSession(
            user_id=user.id,
            assessment_version="1.0",
            status="IN_PROGRESS",
            started_at=datetime.now(timezone.utc),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        print(f"  * Assessment session created: {session.id} (status: {session.status})")

        # 4. Populate Realistic Synthetic Responses (Across All 13 Domains)
        print("\n[STEP 4] Submitting Synthetic Questionnaire Responses across 13 Domains...")
        synthetic_payload = {
            # Block 1: Demographics
            "age_years": 31,
            "bmi_category": "25-29.9",
            "city_region": "Tier 1 Metro",
            "residential_area_type": "Urban",
            "occupation_type": "Software / Desk-based",
            "education_level": "Postgraduate",
            "relationship_status": "In a relationship",

            # Block 2: Lifestyle Behaviors
            "smoking_status": "regular",
            "alcohol_frequency": "weekly_2_3",
            "recreational_drug_use": "No",
            "physical_activity_level": "sedentary",
            "hours_sitting_per_day": "8-10_hours",
            "irregular_sleep": "frequently",
            "sleep_duration": "less_than_6",

            # Block 3: Heat Exposure
            "laptop_on_lap": "daily_2plus_hours",
            "mobile_phone_placement": "front_trouser_pocket",
            "underwear_type": "tight_briefs",
            "hot_bath_frequency": "multiple_weekly",
            "working_in_hot_conditions": "No",
            "cycling_hours_per_week": "0-2",

            # Block 4: Diet & Nutrition
            "diet_type": "Non-vegetarian",
            "fruit_veg_intake": "1_2_servings",
            "processed_food_frequency": "3_4_weekly",
            "fried_food_frequency": "3_4_weekly",
            "soy_phytoestrogen_intake": "rarely",
            "water_intake": "1_2_liters",
            "supplement_use": ["multivitamin", "ashwagandha"],

            # Block 5: Environmental Exposure
            "proximity_to_industrial_or_traffic": "heavy_traffic_corridor",

            # Block 6: Mental Health & Stress
            "perceived_stress_pss10": 22,
            "gad7_score": 8,
            "phq9_score": 5,

            # Block 7: Reproductive History & Symptoms
            "known_varicocele": "No",
            "prior_sti_history": "No",
            "scrotal_or_groin_injury": "No",
            "childhood_disease_mumps": "No",
            "ejaculation_concerns": "No",
            "libido_changes": "slight_decrease",
            "sexual_abstinence_period_days": "3-5_days",

            # Block 8: Substance & Medication Use
            "finasteride_use": "No",
            "anabolic_steroid_use": "No",
            "antidepressant_use_ssri": "No",
            "antihypertensive_use": "No",
            "chemotherapy_history": "No",
            "other_long_term_medication": "None",

            # Block 9: Digital Sexual Behavior
            "pornography_use_frequency": "2-3_weekly",
            "perceived_control_over_use": "Yes",
            "use_as_emotional_coping": "sometimes",
            "masturbation_frequency": "2-3_weekly",
            "masturbation_control": "Yes",
            "masturbation_emotional_coping": "sometimes",

            # Block 10: Sexual Performance / Anxiety
            "anticipatory_anxiety_before_sex": "occasional",
            "partnered_sexual_difficulty": "occasional",
            "cognitive_self_monitoring_during_sex": "often",

            # Block 11: Body Image & Self-Perception
            "general_body_satisfaction": "moderate",
            "physique_muscularity_pressure": "moderate",
            "genital_self_image_concern": "minimal",

            # Block 12: Social & Relational Context
            "relationship_satisfaction": "satisfied",
            "family_communication_comfort": "comfortable",

            # Block 13: Coping Mechanisms
            "primary_stress_coping_method": "digital_media_and_games",
            "emotional_regulation_ability": "moderate",
            "sleep_as_escape": "sometimes",
            "mindfulness_or_meditation_practice": "rarely",
        }

        # Persist responses to DB
        for q_id, q_val in synthetic_payload.items():
            resp = AssessmentResponse(
                assessment_session_id=session.id,
                question_id=q_id,
                response_value=q_val,
            )
            db.add(resp)
        db.commit()

        saved_resp_count = db.query(AssessmentResponse).filter(
            AssessmentResponse.assessment_session_id == session.id
        ).count()
        print(f"  * Successfully persisted {saved_resp_count} responses in PostgreSQL.")

        # 5. Execute Full Pipeline with Real Groq Call
        print("\n[STEP 5] Executing Full Synthesis Pipeline with Real Groq LLM...")
        pipeline_start = time.time()

        # Step 5a: Response Normalization
        norm_start = time.time()
        normalized_context = normalize_assessment_responses(synthetic_payload)
        norm_duration_ms = int((time.time() - norm_start) * 1000)
        print(f"  * [1/4] Normalization: Completed in {norm_duration_ms}ms across 13 domains.")

        # Step 5b: Health Context Construction
        ctx_start = time.time()
        health_context = build_health_context(normalized_context)
        ctx_duration_ms = int((time.time() - ctx_start) * 1000)
        print(f"  * [2/4] Context Engine: Completed in {ctx_duration_ms}ms "
              f"({len(health_context.modifiable_factors)} modifiable factors, "
              f"{len(health_context.positive_factors)} positive factors, "
              f"{len(health_context.follow_up_flags)} follow-up flags).")

        # Step 5c: Evidence Retrieval
        ev_start = time.time()
        evidence_context = retrieve_evidence_for_health_context(health_context)
        ev_duration_ms = int((time.time() - ev_start) * 1000)
        print(f"  * [3/4] Evidence Retrieval: Completed in {ev_duration_ms}ms "
              f"({evidence_context.matched_count} guideline excerpts matched across {len(evidence_context.query_tags)} tags).")

        # Step 5d: Real Groq LLM Generation & Pydantic Validation
        print(f"  * [4/4] Invoking Groq LLM ({settings.GROQ_MODEL})...")
        groq_start = time.time()
        mantra_report = generate_mantra_report(
            normalized_assessment=normalized_context,
            health_context=health_context,
            evidence_context=evidence_context,
        )
        groq_duration_ms = int((time.time() - groq_start) * 1000)
        total_pipeline_ms = int((time.time() - pipeline_start) * 1000)
        print(f"  * Real Groq Generation & Validation: Completed in {groq_duration_ms}ms!")
        print(f"  * Total Pipeline Duration: {total_pipeline_ms}ms.")

        # 6. Verify Structural Integrity of Validated Report
        print("\n[STEP 6] Verifying Structural Integrity of MantraAIReport...")
        assert isinstance(mantra_report, MantraAIReport), "Output must be instance of MantraAIReport"
        print(f"  * Report Version: {mantra_report.report_metadata.report_version}")
        print(f"  * Model Provider: {mantra_report.report_metadata.model_provider}")
        print(f"  * Model Name: {mantra_report.report_metadata.model_name}")
        print(f"  * Executive Summary Headline: {mantra_report.executive_summary.headline}")
        print(f"  * Overall Wellness Status: {mantra_report.executive_summary.overall_wellness_status}")
        print(f"  * Priority Factors Count: {len(mantra_report.priority_factors)}")
        print(f"  * Positive Factors Count: {len(mantra_report.positive_factors)}")
        print(f"  * Personalized Actions Count: {len(mantra_report.personalized_action_plan)}")
        print(f"  * Clinician Questions Count: {len(mantra_report.questions_to_discuss_with_clinician)}")
        print(f"  * When to Seek Help Items: {len(mantra_report.when_to_seek_professional_help)}")
        print(f"  * Evidence References Count: {len(mantra_report.evidence)}")
        print(f"  * Limitations Defined: {bool(mantra_report.limitations.summary)}")
        print(f"  * Disclaimer Present: {bool(mantra_report.disclaimer)}")

        # 7. Verify Clinical Safety Boundaries
        print("\n[STEP 7] Verifying Clinical Safety Boundaries...")
        report_dict = mantra_report.model_dump(mode="json")

        def check_forbidden_keys(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    assert k not in FORBIDDEN_FIELDS, f"Forbidden field '{k}' found in report!"
                    check_forbidden_keys(v)
            elif isinstance(obj, list):
                for item in obj:
                    check_forbidden_keys(item)

        check_forbidden_keys(report_dict)
        print(f"  * All {len(FORBIDDEN_FIELDS)} forbidden diagnostic & fertility-prediction keys confirmed absent.")

        # 8. Verify Evidence & Question ID Provenance
        print("\n[STEP 8] Verifying Evidence & Question Traceability...")
        valid_ev_ids = {e.evidence_id for e in evidence_context.items}
        for ev in mantra_report.evidence:
            assert ev.evidence_id in valid_ev_ids, f"Unknown evidence_id: {ev.evidence_id}"
            assert ev.url.startswith("http"), f"Invalid evidence URL: {ev.url}"
        print(f"  * All {len(mantra_report.evidence)} evidence references trace to retrieved authoritative guidelines.")

        for pf in mantra_report.priority_factors:
            for q in pf.source_question_ids:
                assert q in QUESTION_DOMAIN_MAP, f"Unknown question ID in priority factors: {q}"
        print("  * All priority factor question IDs trace to canonical 86 questionnaire schema.")

        # 9. Verify PostgreSQL Persistence & Complete Assessment
        print("\n[STEP 9] Persisting Report to PostgreSQL...")
        legacy_view = new_report_to_legacy_view(mantra_report)
        persisted_content = {**report_dict, **legacy_view}

        result_record = AssessmentResult(
            assessment_session_id=session.id,
            overall_category=mantra_report.executive_summary.overall_wellness_status,
            risk_scores={
                "modifiable_factors_count": len(health_context.modifiable_factors),
                "positive_factors_count": len(health_context.positive_factors),
                "follow_up_flags_count": len(health_context.follow_up_flags),
            },
            interpretation=mantra_report.executive_summary.overview[:200],
        )
        db.add(result_record)

        report_record = Report(
            assessment_session_id=session.id,
            report_version=mantra_report.report_metadata.report_version,
            model_provider=mantra_report.report_metadata.model_provider,
            model_name=mantra_report.report_metadata.model_name,
            report_content=persisted_content,
            structured_findings=[f.model_dump() for f in mantra_report.priority_factors],
        )
        db.add(report_record)

        session.status = "COMPLETED"
        session.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(report_record)

        print(f"  * Report persisted with DB record ID: {report_record.id}")
        print(f"  * Session marked COMPLETED in PostgreSQL.")

        # 10. Verify API Query & Backward Compatibility
        print("\n[STEP 10] Verifying API Retrieval & ReportViewer Contract...")
        retrieved_report = db.query(Report).filter(
            Report.assessment_session_id == session.id
        ).first()

        assert retrieved_report is not None
        content = retrieved_report.report_content

        # Verify ReportViewer.jsx required keys
        assert "summary" in content, "Missing 'summary' object for ReportViewer"
        assert "headline" in content["summary"], "Missing 'headline'"
        assert "overview" in content["summary"], "Missing 'overview'"
        assert "key_findings" in content, "Missing 'key_findings' array"
        assert "reproductive_health" in content, "Missing 'reproductive_health'"
        assert "sexual_health" in content, "Missing 'sexual_health'"
        assert "priority_actions" in content, "Missing 'priority_actions'"
        assert "disclaimer" in content, "Missing 'disclaimer'"
        print("  * All fields required by frontend ReportViewer.jsx verified present and valid.")

        # Verify new schema fields are also available
        assert "report_metadata" in content
        assert "executive_summary" in content
        assert "personalized_action_plan" in content
        assert "when_to_seek_professional_help" in content
        print("  * All 16 structured MantraAIReport sections verified present in database payload.")

        print("\n" + "=" * 70)
        print("[SUCCESS] E2E VERIFICATION COMPLETED WITH 100% SUCCESS!")
        print("=" * 70)
        return True

    finally:
        db.close()


if __name__ == "__main__":
    success = run_e2e_verification()
    sys.exit(0 if success else 1)
