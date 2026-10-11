"""Router for secure, expiring clinician one-pager share links.

Endpoints:
- POST /api/v1/assessments/{id}/share: generate single-use expiring clinician share link.
- DELETE /api/v1/shares/{share_id}: revoke a share link.
- GET /api/v1/shared/{token}: unauthenticated endpoint returning sanitized clinical summary.
  Sends Cache-Control: no-store and X-Robots-Tag: noindex.
  Returns identical 404 for unknown, expired, revoked, or over-limit tokens.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResult, Report
from app.models.shared_report import SharedReport

router = APIRouter(tags=["Shared Reports"])


class ShareCreateRequest(BaseModel):
    expires_in_hours: int = Field(72, ge=1, le=168, description="Link expiration in hours (max 7 days / 168h).")
    max_views: int = Field(10, ge=1, le=50, description="Maximum allowed views before auto-invalidation.")
    include_digital_sexual: bool = Field(False, description="Whether to include digital sexual behavior block.")


class ShareCreateResponse(BaseModel):
    share_id: str
    token: str
    share_url: str
    expires_at: datetime
    max_views: int
    view_count: int
    included_sections: Dict[str, Any]


class ClinicianSummaryResponse(BaseModel):
    assessment_date: str
    overall_status: Optional[str]
    reported_symptoms_and_factors: List[Dict[str, Any]]
    medications_and_substances: List[str]
    clinical_follow_up_flags: List[str]
    questions_for_clinician: List[str]
    limitations_and_disclaimer: str


# ---------------------------------------------------------------------------
# 1. Create Share Link
# ---------------------------------------------------------------------------
@router.post("/api/v1/assessments/{assessment_id}/share", response_model=ShareCreateResponse)
def create_assessment_share(
    assessment_id: UUID,
    payload: ShareCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(AssessmentSession).filter(AssessmentSession.id == assessment_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")

    # Enforce strict user isolation
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: cannot share another user's assessment")

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=payload.expires_in_hours)

    shared_report = SharedReport(
        user_id=current_user.id,
        assessment_session_id=session.id,
        token_hash=token_hash,
        expires_at=expires_at,
        max_views=payload.max_views,
        view_count=0,
        included_sections={"include_digital_sexual": payload.include_digital_sexual},
    )
    db.add(shared_report)
    db.commit()
    db.refresh(shared_report)

    return ShareCreateResponse(
        share_id=str(shared_report.id),
        token=raw_token,
        share_url=f"/shared/{raw_token}",
        expires_at=shared_report.expires_at,
        max_views=shared_report.max_views,
        view_count=shared_report.view_count,
        included_sections=shared_report.included_sections or {},
    )


# ---------------------------------------------------------------------------
# 2. Revoke Share Link
# ---------------------------------------------------------------------------
@router.delete("/api/v1/shares/{share_id}")
def revoke_assessment_share(
    share_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shared_report = db.query(SharedReport).filter(SharedReport.id == share_id).first()
    if not shared_report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link not found")

    if shared_report.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: cannot revoke another user's share link")

    shared_report.revoked_at = datetime.now(timezone.utc)
    db.commit()

    return {"status": "revoked", "share_id": str(share_id)}


# ---------------------------------------------------------------------------
# 3. Unauthenticated View Sanitized Clinician One-Pager
# ---------------------------------------------------------------------------
@router.get("/api/v1/shared/{token}", response_model=ClinicianSummaryResponse)
def get_shared_clinician_one_pager(
    token: str,
    response: Response,
    db: Session = Depends(get_db),
):
    # Security requirement: Set anti-indexing and non-caching headers
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    shared_report = db.query(SharedReport).filter(SharedReport.token_hash == token_hash).first()

    now = datetime.now(timezone.utc)
    # Security requirement: Identical 404 for unknown, expired, revoked, or over-limit tokens
    not_found_exception = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Shared report link not found, expired, or revoked"
    )

    if not shared_report:
        raise not_found_exception

    if shared_report.revoked_at is not None:
        raise not_found_exception

    # Handle timezone compatibility
    expires_at = shared_report.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= now:
        raise not_found_exception

    if shared_report.view_count >= shared_report.max_views:
        raise not_found_exception

    # Increment view count
    shared_report.view_count += 1
    db.commit()

    # Fetch assessment and report data
    session = db.query(AssessmentSession).filter(AssessmentSession.id == shared_report.assessment_session_id).first()
    if not session:
        raise not_found_exception

    report_record = db.query(Report).filter(Report.assessment_session_id == session.id).first()
    result_record = db.query(AssessmentResult).filter(AssessmentResult.assessment_session_id == session.id).first()

    report_content = report_record.report_content if (report_record and report_record.report_content) else {}
    include_digital_sexual = bool(
        shared_report.included_sections and shared_report.included_sections.get("include_digital_sexual")
    )

    # Filter reported factors: omit digital sexual behavior block unless explicitly toggled
    raw_factors = report_content.get("factors_evaluated", []) or []
    sanitized_factors: List[Dict[str, Any]] = []

    for f in raw_factors:
        domain = f.get("domain", "")
        factor_id = f.get("id", "")
        # Digital sexual behavior screening block questions (Block 10: porn, masturbation detail, etc.)
        is_digital_sexual = (
            "porn" in factor_id
            or "masturbation" in factor_id
            or "digital_sex" in factor_id
            or domain == "digital_sexual_behavior"
        )
        if is_digital_sexual and not include_digital_sexual:
            continue

        sanitized_factors.append({
            "name": f.get("name") or f.get("title") or factor_id,
            "status": f.get("status", "reported"),
            "category": domain,
            "evidence_grade": f.get("evidence_grade", "B"),
            "notes": f.get("description") or f.get("reason", ""),
        })

    # Substances and medications reported
    substances = []
    first_response = session.responses[0] if session.responses else None
    raw_responses = first_response.responses if first_response else {}
    if raw_responses.get("tobacco_smoking_frequency") in ["daily", "weekly"]:
        substances.append("Tobacco / Nicotine")
    if raw_responses.get("alcohol_consumption_frequency") in ["frequent", "daily"]:
        substances.append("Alcohol")
    if raw_responses.get("prescription_medications"):
        substances.append("Prescription medications reported")

    # Clinical follow-up recommendations
    follow_up_flags = []
    actions = report_content.get("prioritized_action_plan", []) or []
    for act in actions:
        if act.get("action_type") == "professional_discussion":
            follow_up_flags.append(act.get("title", "Clinical consultation recommended"))

    if not follow_up_flags and report_content.get("overall_category") == "Several areas need attention":
        follow_up_flags.append("Screening identified areas warranting formal evaluation by a clinician.")

    # Questions for clinician discussion
    questions_for_clinician = [
        "Are any reported lifestyle, occupational heat, or stress factors significantly affecting baseline health?",
        "Is formal laboratory semen analysis indicated at this time?",
        "Should any prescription medications or supplements be reviewed or optimized?",
        "What clinical follow-up timeframe is suggested based on my personal health history?",
    ]

    date_str = session.completed_at.strftime("%B %d, %Y") if session.completed_at else session.created_at.strftime("%B %d, %Y")

    return ClinicianSummaryResponse(
        assessment_date=date_str,
        overall_status=result_record.overall_category if result_record else report_content.get("overall_category"),
        reported_symptoms_and_factors=sanitized_factors,
        medications_and_substances=substances,
        clinical_follow_up_flags=follow_up_flags,
        questions_for_clinician=questions_for_clinician,
        limitations_and_disclaimer=(
            "CONFIDENTIAL CLINICIAN ONE-PAGER SUMMARY: This patient-authorized summary was generated by MantraAI "
            "from structured patient questionnaires. It does not constitute a medical diagnosis, physician order, "
            "or laboratory confirmation. The patient has provided this summary to facilitate an informed clinical "
            "consultation. All symptoms, endocrine parameters, and physical findings must be clinically verified."
        ),
    )
