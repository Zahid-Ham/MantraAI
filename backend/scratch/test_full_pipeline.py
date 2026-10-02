import os
import sys
import json
import time
sys.path.insert(0, os.path.abspath("."))

from app.database import SessionLocal
from app.models.assessment import AssessmentResponse
from app.services.normalizer import normalize_assessment_responses
from app.services.context_engine import build_health_context
from app.services.evidence_retriever import retrieve_evidence_for_health_context
from app.services.report_generator import (
    generate_mantra_report, build_system_prompt, build_user_prompt,
    execute_groq_request, validate_report_content
)
from app.schemas.report import ReportMetadata, new_report_to_legacy_view
from app.config import settings

def test_full_pipeline():
    db = SessionLocal()
    try:
        responses_list = db.query(AssessmentResponse).filter(
            AssessmentResponse.assessment_session_id == "449142a9-e6e9-4e05-b9b4-1586d72a59b0"
        ).all()
        answers = {r.question_id: r.response_value for r in responses_list}
        norm = normalize_assessment_responses(answers)
        ctx = build_health_context(norm)
        ev = retrieve_evidence_for_health_context(ctx)
        
        meta = ReportMetadata(
            report_version="2.0",
            generated_at="2026-10-02T16:00:00Z",
            model_provider="groq",
            model_name=settings.GROQ_MODEL,
            questionnaire_version="1.0"
        )
        
        print("Calling generate_mantra_report...")
        report = generate_mantra_report(
            normalized_assessment=norm,
            health_context=ctx,
            evidence_context=ev,
            metadata=meta,
        )
        
        print("\n--- REPORT RESULTS ---")
        print(f"Model: {report.report_metadata.model_name}")
        print(f"Headline: {report.executive_summary.headline}")
        print(f"Priority Factors: {len(report.priority_factors)}")
        print(f"Positive Factors: {len(report.positive_factors)}")
        print(f"Action Plan: {len(report.personalized_action_plan)}")
        print(f"Clinician Questions: {len(report.questions_to_discuss_with_clinician)}")
        print(f"Professional Help: {len(report.when_to_seek_professional_help)}")
        print(f"Evidence References: {len(report.evidence)}")
        
        # Test serialization
        report_dict = report.model_dump(mode="json")
        legacy_view = new_report_to_legacy_view(report)
        persisted_content = {**legacy_view, **report_dict}
        
        print("\n--- PERSISTED CONTENT KEYS ---")
        print(list(persisted_content.keys()))
        print(f"Positive Factors in persisted: {len(persisted_content.get('positive_factors', []))}")
        print(f"Action Plan in persisted: {len(persisted_content.get('personalized_action_plan', []))}")
        print(f"Clinician Questions in persisted: {len(persisted_content.get('questions_to_discuss_with_clinician', []))}")
        print(f"Evidence in persisted: {len(persisted_content.get('evidence', []))}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_full_pipeline()
