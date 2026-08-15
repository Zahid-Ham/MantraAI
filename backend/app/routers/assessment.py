from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List, Dict, Any

from app.database import get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report
from app.models.audit import AuditEvent
from app.schemas.assessment import (
    AssessmentSessionCreate,
    AssessmentSessionOut,
    AssessmentResponseSave,
    AssessmentResultOut,
    ReportOut
)

router = APIRouter(prefix="/api/v1/assessments", tags=["assessments"])

@router.post("", response_model=AssessmentSessionOut)
def create_assessment_session(
    payload: AssessmentSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if there is an in-progress assessment to avoid spamming
    existing = db.query(AssessmentSession).filter(
        AssessmentSession.user_id == current_user.id,
        AssessmentSession.status == "IN_PROGRESS"
    ).first()
    
    if existing:
        # Return existing in-progress session so they can resume it
        return existing

    session = AssessmentSession(
        user_id=current_user.id,
        assessment_version=payload.assessment_version or "1.0",
        status="IN_PROGRESS",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Log audit event
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="ASSESSMENT_STARTED",
        event_metadata={"assessment_session_id": str(session.id)}
    )
    db.add(audit)
    db.commit()

    return session

@router.get("", response_model=List[AssessmentSessionOut])
def get_assessment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Returns history ordered by started_at descending
    sessions = db.query(AssessmentSession).filter(
        AssessmentSession.user_id == current_user.id
    ).order_by(AssessmentSession.started_at.desc()).all()
    return sessions

@router.get("/{assessment_id}", response_model=AssessmentSessionOut)
def get_assessment_session(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    # Enforce strict user isolation
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access to this assessment is unauthorized.")

    return session

@router.patch("/{assessment_id}", response_model=AssessmentSessionOut)
def update_assessment_session_status(
    assessment_id: UUID,
    status_val: str,  # IN_PROGRESS, COMPLETED, ABANDONED
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if status_val not in ["IN_PROGRESS", "COMPLETED", "ABANDONED"]:
        raise HTTPException(status_code=422, detail="Invalid status value.")

    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    session.status = status_val
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session

@router.get("/{assessment_id}/responses")
def get_responses(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    responses = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_session_id == assessment_id
    ).all()

    return {"responses": {r.question_id: r.response_value for r in responses}}

@router.post("/{assessment_id}/responses")
def save_responses(
    assessment_id: UUID,
    payload: AssessmentResponseSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    if session.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Cannot edit a completed or abandoned assessment.")

    # Progressive Upsert: save responses progressively
    for q_id, q_val in payload.responses.items():
        existing_resp = db.query(AssessmentResponse).filter(
            AssessmentResponse.assessment_session_id == assessment_id,
            AssessmentResponse.question_id == q_id
        ).first()

        if existing_resp:
            existing_resp.response_value = q_val
            existing_resp.updated_at = datetime.utcnow()
        else:
            new_resp = AssessmentResponse(
                assessment_session_id=assessment_id,
                question_id=q_id,
                response_value=q_val
            )
            db.add(new_resp)
            
    db.commit()
    return {"status": "ok", "saved_count": len(payload.responses)}

# Helper to run the Groq LLM API call (re-wired from existing main.py logic)
def generate_report_via_groq(answers: dict) -> dict:
    import urllib.request
    import json
    import time
    from app.config import settings

    api_key = settings.GROQ_API_KEY
    model = settings.GROQ_MODEL
    
    if not api_key:
        # Fallback to local default pre-compiled report if no API key exists (testing fallback)
        return {
            "summary": {
                "headline": "Assessment Completed Successfully",
                "overview": "Your assessment responses have been securely stored in the private PostgreSQL database. The Groq API key is not configured on this server instance.",
                "overall_wellness_status": "Stable"
            },
            "key_findings": [],
            "reproductive_health": {"summary": "Information saved securely.", "relevant_factors": [], "protective_factors": [], "areas_to_monitor": []},
            "sexual_health": {"summary": "Information saved securely.", "relevant_factors": [], "areas_to_monitor": []},
            "mental_wellbeing": {"summary": "Information saved securely.", "relevant_factors": [], "areas_to_monitor": []},
            "lifestyle": {
                "sleep": "Saved.", "exercise": "Saved.", "diet": "Saved.",
                "substance_use": "Saved.", "heat_exposure": "Saved.", "environment": "Saved."
            },
            "behavioral_patterns": {"summary": "Saved.", "patterns": [], "potential_triggers": []},
            "priority_actions": [],
            "positive_factors": [],
            "questions_to_discuss_with_clinician": [],
            "when_to_seek_professional_help": [],
            "disclaimer": "Groq report configuration missing. Stored responses are intact."
        }

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    # Same prompts as existing main.py
    system_prompt = """You are MantraAI's AI wellness-report engine. Analyze the health questionnaire. Return ONLY valid JSON schema matching:
{
  "summary": {"headline": "headline", "overview": "overview", "overall_wellness_status": "Stable | Worth monitoring | Several areas need attention"},
  "key_findings": [{"title": "Title", "severity": "low | moderate | notable", "explanation": "explanation", "evidence": []}],
  "reproductive_health": {"summary": "summary", "relevant_factors": [], "protective_factors": [], "areas_to_monitor": []},
  "sexual_health": {"summary": "summary", "relevant_factors": [], "areas_to_monitor": []},
  "mental_wellbeing": {"summary": "summary", "relevant_factors": [], "areas_to_monitor": []},
  "lifestyle": {"sleep": "sleep", "exercise": "exercise", "diet": "diet", "substance_use": "substance", "heat_exposure": "heat", "environment": "environment"},
  "behavioral_patterns": {"summary": "summary", "patterns": [], "potential_triggers": []},
  "priority_actions": [{"priority": 1, "area": "Area", "action": "action", "reason": "reason"}],
  "positive_factors": [],
  "questions_to_discuss_with_clinician": [],
  "when_to_seek_professional_help": [],
  "disclaimer": "disclaimer"
}"""
    
    user_prompt = f"Analyze the completed questionnaire:\n{json.dumps(answers, indent=2)}"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    for attempt in range(3):
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=20) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                content_str = res_json["choices"][0]["message"]["content"]
                return json.loads(content_str)
        except Exception as e:
            print(f"Groq API connection error on attempt {attempt+1}: {str(e)}")
            if attempt == 2:
                # Fallback on ultimate failure so assessment completion does not crash
                return {
                    "summary": {
                        "headline": "Assessment Completed - Report Generation Deferred",
                        "overview": "Your assessment was successfully saved, but we ran into a connection timeout when communicating with the AI report generator. Please refresh to try again.",
                        "overall_wellness_status": "Stable"
                    },
                    "key_findings": [],
                    "reproductive_health": {"summary": "Pending connection.", "relevant_factors": [], "protective_factors": [], "areas_to_monitor": []},
                    "sexual_health": {"summary": "Pending.", "relevant_factors": [], "areas_to_monitor": []},
                    "mental_wellbeing": {"summary": "Pending.", "relevant_factors": [], "areas_to_monitor": []},
                    "lifestyle": {"sleep": "Pending.", "exercise": "Pending.", "diet": "Pending.", "substance_use": "Pending.", "heat_exposure": "Pending.", "environment": "Pending."},
                    "behavioral_patterns": {"summary": "Pending.", "patterns": [], "potential_triggers": []},
                    "priority_actions": [],
                    "positive_factors": [],
                    "questions_to_discuss_with_clinician": [],
                    "when_to_seek_professional_help": [],
                    "disclaimer": "Failed to connect to AI server. Responses are persisted."
                }
            time.sleep(1.0)

@router.post("/{assessment_id}/complete", response_model=AssessmentResultOut)
def complete_assessment(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    if session.status == "COMPLETED":
        # Already completed, just return existing result
        res = db.query(AssessmentResult).filter(
            AssessmentResult.assessment_session_id == assessment_id
        ).first()
        if res:
            return res

    # 1. Fetch all responses in DB for this session
    responses_list = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_session_id == assessment_id
    ).all()

    answers = {r.question_id: r.response_value for r in responses_list}

    # 2. Compute non-diagnostic risk scores
    score_lifestyle = 0
    score_mental = 0
    score_reproductive = 0

    if answers.get("stress_level") in ["High", "Moderate"]:
        score_mental += 3
    if answers.get("sleep_hours") and str(answers.get("sleep_hours")).isdigit() and int(answers.get("sleep_hours")) < 7:
        score_lifestyle += 3
    if answers.get("smoking_status") == "Yes":
        score_lifestyle += 3
    if answers.get("scrotal_heat_exposure") == "Yes":
        score_reproductive += 3
    if answers.get("chemical_exposure") == "Yes":
        score_reproductive += 3

    total_score = score_lifestyle + score_mental + score_reproductive

    overall_cat = "Stable"
    interpretation = "Your responses suggest a stable baseline with protective daily habits."
    
    if total_score >= 6:
        overall_cat = "Worth monitoring"
        interpretation = "Some responses indicate areas worth monitoring. Adjusting environmental or lifestyle factors can help maintain healthy indicators."
    if total_score >= 9:
        overall_cat = "Several areas need attention"
        interpretation = "Multiple factors suggest several areas need attention. A structured discussion with an Andrologist or Urologist is recommended."

    # 3. Create AssessmentResult record
    result = AssessmentResult(
        assessment_session_id=assessment_id,
        overall_category=overall_cat,
        risk_scores={
            "lifestyle": score_lifestyle,
            "mental_health": score_mental,
            "reproductive_risk": score_reproductive,
            "total_score": total_score
        },
        interpretation=interpretation
    )
    db.add(result)

    # 4. Generate & store AI Report
    report_data = generate_report_via_groq(answers)
    report = Report(
        assessment_session_id=assessment_id,
        report_version="1.0",
        model_provider="groq",
        model_name=report_data.get("summary", {}).get("overall_wellness_status", "Stable"), # store status overview as name or use default
        report_content=report_data,
        structured_findings=report_data.get("key_findings", [])
    )
    db.add(report)

    # 5. Mark session status as completed
    session.status = "COMPLETED"
    session.completed_at = datetime.utcnow()
    session.updated_at = datetime.utcnow()

    # Log audit event
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="ASSESSMENT_COMPLETED",
        event_metadata={"assessment_session_id": str(session.id)}
    )
    db.add(audit)

    db.commit()
    db.refresh(result)
    return result

@router.get("/{assessment_id}/results", response_model=AssessmentResultOut)
def get_assessment_results(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    result = db.query(AssessmentResult).filter(
        AssessmentResult.assessment_session_id == assessment_id
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Assessment results not compiled yet.")
    
    return result

@router.get("/{assessment_id}/report")
def get_assessment_report(
    assessment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(AssessmentSession).filter(
        AssessmentSession.id == assessment_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access unauthorized.")

    report = db.query(Report).filter(
        Report.assessment_session_id == assessment_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="AI report not generated for this assessment.")

    # Return report content dictionary
    return report.report_content
