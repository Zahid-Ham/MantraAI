import os
import sys
import json
sys.path.insert(0, os.path.abspath("."))

from app.database import SessionLocal
from app.models.assessment import AssessmentResponse
from app.services.normalizer import normalize_assessment_responses
from app.services.context_engine import build_health_context
from app.services.evidence_retriever import retrieve_evidence_for_health_context
from app.services.report_generator import build_user_prompt, build_system_prompt, execute_groq_request, validate_report_content
from app.schemas.report import ReportMetadata
from app.config import settings

def test_groq_direct():
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
            model_name=settings.GROQ_MODEL or "openai/gpt-oss-120b",
            questionnaire_version="1.0"
        )
        
        sys_prompt = build_system_prompt()
        user_prompt = build_user_prompt(norm, ctx, ev, meta)
        
        print("Sending request to Groq...")
        raw = execute_groq_request(
            system_prompt=sys_prompt,
            user_prompt=user_prompt,
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL or "openai/gpt-oss-120b",
            timeout_seconds=60.0
        )
        
        parsed = json.loads(raw)
        print("\n=== RAW GROQ RESPONSE COUNTS ===")
        print(f"priority_factors: {len(parsed.get('priority_factors', []))}")
        print(f"positive_factors: {len(parsed.get('positive_factors', []))}")
        print(f"personalized_action_plan: {len(parsed.get('personalized_action_plan', []))}")
        print(f"questions_to_discuss_with_clinician: {len(parsed.get('questions_to_discuss_with_clinician', []))}")
        print(f"when_to_seek_professional_help: {len(parsed.get('when_to_seek_professional_help', []))}")
        print(f"evidence: {len(parsed.get('evidence', []))}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_groq_direct()
