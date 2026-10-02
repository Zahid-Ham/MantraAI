import json
import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.database import SessionLocal
from app.models.assessment import Report, AssessmentSession, AssessmentResult, AssessmentResponse

def main():
    db = SessionLocal()
    try:
        latest_report = db.query(Report).order_by(Report.created_at.desc()).first()
        if not latest_report:
            print("NO_REPORTS_FOUND")
            return

        print(f"Report ID: {latest_report.id}")
        print(f"Session ID: {latest_report.assessment_session_id}")
        print(f"Model Provider: {latest_report.model_provider}")
        print(f"Model Name: {latest_report.model_name}")
        print(f"Report Version: {latest_report.report_version}")
        print(f"Created At: {latest_report.created_at}")
        
        content = latest_report.report_content or {}
        
        # Diagnostic summary of the actual persisted report structure & counts
        keys = list(content.keys())
        print(f"Top-level keys in report_content: {keys}")
        
        def safe_len(val):
            if isinstance(val, list):
                return len(val)
            if isinstance(val, dict):
                return len(val)
            return "present" if val is not None else "missing"

        summary = {
            "metadata": "present" if "report_metadata" in content else "missing",
            "executive_summary": "present" if "executive_summary" in content else "missing",
            "reproductive_health": safe_len(content.get("reproductive_health")),
            "sexual_health": safe_len(content.get("sexual_health")),
            "mental_behavioral_wellness": safe_len(content.get("mental_behavioral_wellness")),
            "lifestyle_wellness": safe_len(content.get("lifestyle_wellness")),
            "environmental_exposure": safe_len(content.get("environmental_exposure")),
            "substance_medication": safe_len(content.get("substance_medication")),
            "priority_factors": safe_len(content.get("priority_factors")),
            "positive_factors": safe_len(content.get("positive_factors")),
            "action_plan": safe_len(content.get("personalized_action_plan")),
            "clinician_questions": safe_len(content.get("questions_to_discuss_with_clinician")),
            "professional_help": safe_len(content.get("when_to_seek_professional_help")),
            "evidence_references": safe_len(content.get("evidence")),
        }
        
        print("\n=== SAFE DIAGNOSTIC SUMMARY ===")
        for k, v in summary.items():
            print(f"{k}: {v}")
            
        print("\n=== SAMPLE CONTENT INSPECTION ===")
        print("Executive Summary Overview snippet:", str(content.get("executive_summary", {}).get("overview", ""))[:200])
        print("Positive Factors raw:", content.get("positive_factors"))
        print("Priority Factors count/keys:", len(content.get("priority_factors", [])), [f.get("title") for f in content.get("priority_factors", []) if isinstance(f, dict)])
        print("Action Plan raw:", content.get("personalized_action_plan"))
        print("Clinician Questions raw:", content.get("questions_to_discuss_with_clinician"))
        print("Evidence raw:", content.get("evidence"))
        print("Reproductive Health summary:", content.get("reproductive_health", {}).get("summary"))
        print("Sexual Health summary:", content.get("sexual_health", {}).get("summary"))
        print("Mental Wellness summary:", content.get("mental_behavioral_wellness", {}).get("summary"))
        print("Lifestyle summary:", content.get("lifestyle_wellness", {}).get("summary"))
        print("Environmental summary:", content.get("environmental_exposure", {}).get("summary"))
        print("Substance summary:", content.get("substance_medication", {}).get("summary"))

    finally:
        db.close()

if __name__ == "__main__":
    main()
