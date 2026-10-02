import os
import sys
import json
sys.path.insert(0, os.path.abspath("."))

from app.database import SessionLocal
from app.models.assessment import AssessmentResponse
from app.services.normalizer import normalize_assessment_responses
from app.services.context_engine import build_health_context
from app.services.evidence_retriever import retrieve_evidence_for_health_context
from app.schemas.report import (
    MantraAIReport, ReportMetadata, PriorityFactorReportItem, PositiveFactorReportItem,
    PersonalizedAction, ClinicianDiscussionQuestion, ProfessionalHelpGuidance, EvidenceReference
)
from app.services.report_generator import (
    build_system_prompt, build_user_prompt, execute_groq_request,
    humanize_factor_title, humanize_factor_description,
    humanize_positive_title, humanize_positive_description,
    normalize_report_domain
)
from app.config import settings

def test_prompt_enhancement():
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
        
        # Test enhanced prompt
        sys_prompt = """You are the personal health report writer for MantraAI, an educational men's health and wellness platform in India.

YOUR AUDIENCE:
You are writing for a person with NO medical background. Explain their health screening results in clear, warm, conversational English completely free of clinical jargon.

MANDATORY RULES:
1. NON-DIAGNOSTIC: Never diagnose medical conditions or clinical disorders.
2. NO FERTILITY PREDICTIONS: Never predict fertility probabilities, percentages, or pregnancy chances.
3. NO INVENTED CLINICAL VALUES: Never invent semen parameters or lab values.
4. STRICT EVIDENCE TRACEABILITY: You can ONLY reference evidence items explicitly supplied in `valid_evidence_ids_to_cite`.
5. STRICT QUESTION ID TRACEABILITY: `source_question_ids` must ONLY contain valid question IDs provided in `valid_question_ids_to_cite`. Minimum 1 ID per item.
6. MANDATORY COMPLETENESS - YOU MUST POPULATE ALL SECTIONS:
   - `priority_factors`: 2 to 5 items based on `health_context.modifiable_factors`.
   - `positive_factors`: 2 to 5 items based on `health_context.positive_factors` celebrating healthy habits. DO NOT LEAVE EMPTY.
   - `personalized_action_plan`: 3 to 5 practical, evidence-informed action steps addressing modifiable factors. DO NOT LEAVE EMPTY.
   - `questions_to_discuss_with_clinician`: 2 to 4 comfortable, constructive questions for a physician consultation. DO NOT LEAVE EMPTY.
   - `when_to_seek_professional_help`: 2 to 4 clear situations/symptoms when an in-person medical consultation is appropriate. DO NOT LEAVE EMPTY.
   - `evidence`: Populate ALL evidence items provided in `evidence_context.items` with their exact evidence_id, title, source, year, url, and relevance. DO NOT LEAVE EMPTY.
   - All 6 domain sections (`reproductive_health`, `sexual_health`, `mental_behavioral_wellness`, `lifestyle_wellness`, `environmental_exposure`, `substance_medication`) must have a clear 1-2 sentence plain language summary and relevant factors.

JSON OUTPUT CONTRACT:
Output a single valid JSON object with ALL 16 keys matching the schema."""

        # Build clean user prompt with explicit requirements
        user_prompt = build_user_prompt(norm, ctx, ev, meta)
        
        print("Calling Groq with enhanced system prompt...")
        import time
        raw = None
        for attempt in range(1, 4):
            try:
                raw = execute_groq_request(
                    system_prompt=sys_prompt,
                    user_prompt=user_prompt,
                    api_key=settings.GROQ_API_KEY,
                    model=settings.GROQ_MODEL or "openai/gpt-oss-120b",
                    timeout_seconds=60.0
                )
                break
            except Exception as e:
                print(f"Attempt {attempt} failed: {e}. Sleeping 5s...")
                time.sleep(5.0)
        
        if not raw:
            print("Failed all attempts.")
            return
        
        parsed = json.loads(raw)
        print("\n=== ENHANCED GROQ RESPONSE COUNTS ===")
        print(f"priority_factors: {len(parsed.get('priority_factors', []))}")
        print(f"positive_factors: {len(parsed.get('positive_factors', []))}")
        print(f"personalized_action_plan: {len(parsed.get('personalized_action_plan', []))}")
        print(f"questions_to_discuss_with_clinician: {len(parsed.get('questions_to_discuss_with_clinician', []))}")
        print(f"when_to_seek_professional_help: {len(parsed.get('when_to_seek_professional_help', []))}")
        print(f"evidence: {len(parsed.get('evidence', []))}")
        
        if parsed.get('positive_factors'):
            print("\nSample Positive Factor:", parsed['positive_factors'][0])
        if parsed.get('personalized_action_plan'):
            print("\nSample Action:", parsed['personalized_action_plan'][0])
        if parsed.get('questions_to_discuss_with_clinician'):
            print("\nSample Question:", parsed['questions_to_discuss_with_clinician'][0])
        if parsed.get('evidence'):
            print("\nSample Evidence:", parsed['evidence'][0])
            
    finally:
        db.close()

if __name__ == "__main__":
    test_prompt_enhancement()
