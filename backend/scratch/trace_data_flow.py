import os
import sys
import json
sys.path.insert(0, os.path.abspath("."))

from app.database import SessionLocal
from app.models.assessment import AssessmentSession, AssessmentResponse, Report
from app.services.normalizer import normalize_assessment_responses
from app.services.context_engine import build_health_context
from app.services.evidence_retriever import retrieve_evidence_for_health_context
from app.services.report_generator import build_user_prompt, build_system_prompt

def trace_session(session_id_str):
    db = SessionLocal()
    try:
        responses_list = db.query(AssessmentResponse).filter(
            AssessmentResponse.assessment_session_id == session_id_str
        ).all()
        
        answers = {r.question_id: r.response_value for r in responses_list}
        print(f"Total responses in DB: {len(answers)}")
        
        # 1. Normalize
        norm = normalize_assessment_responses(answers)
        
        # 2. Health Context
        ctx = build_health_context(norm)
        print("\n=== HEALTH CONTEXT ===")
        print(f"Modifiable factors ({len(ctx.modifiable_factors)}): {[f.id for f in ctx.modifiable_factors]}")
        print(f"Positive factors ({len(ctx.positive_factors)}): {[f.id for f in ctx.positive_factors]}")
        print(f"Context flags ({len(ctx.context_flags)}): {[f.id for f in ctx.context_flags]}")
        print(f"Follow up flags ({len(ctx.follow_up_flags)}): {[f.id for f in ctx.follow_up_flags]}")
        print(f"Evidence tags ({len(ctx.evidence_tags)}): {ctx.evidence_tags}")
        
        # 3. Evidence
        ev = retrieve_evidence_for_health_context(ctx)
        print(f"\n=== EVIDENCE RETRIEVED ===")
        print(f"Matched count: {ev.matched_count}")
        for item in ev.items:
            print(f"  - [{item.evidence_id}] {item.title[:60]}... (tags: {item.matched_tags})")
            
        # 4. User Prompt inspection
        from app.schemas.report import ReportMetadata
        meta = ReportMetadata(
            report_version="2.0",
            generated_at="2026-10-02T15:56:00Z",
            model_provider="groq",
            model_name="openai/gpt-oss-120b",
            questionnaire_version="1.0"
        )
        user_prompt = build_user_prompt(norm, ctx, ev, metadata=meta)
        
        print("\n=== USER PROMPT STATS ===")
        prompt_json = json.loads(user_prompt)
        print("Prompt keys:", list(prompt_json.keys()))
        print("valid_question_ids_to_cite count:", len(prompt_json.get("valid_question_ids_to_cite", [])))
        print("valid_evidence_ids_to_cite:", prompt_json.get("valid_evidence_ids_to_cite"))
        print("health_context modifiable:", len(prompt_json["health_context"]["modifiable_factors"]))
        print("health_context positive:", len(prompt_json["health_context"]["positive_factors"]))
        print("health_context follow_up:", len(prompt_json["health_context"]["follow_up_flags"]))
        print("evidence_context items count:", len(prompt_json["evidence_context"]["items"]))
        print("instructions:", prompt_json["instructions"])
        
    finally:
        db.close()

if __name__ == "__main__":
    trace_session("449142a9-e6e9-4e05-b9b4-1586d72a59b0")
