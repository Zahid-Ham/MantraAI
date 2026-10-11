import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.firebase_auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report
from app.models.health import HealthConnection, HealthDailyMetrics, AdaptiveGoal
from app.models.semen_report import SemenReport
from app.models.cycle_plan import CyclePlan, CycleCheckin
from app.models.shared_report import SharedReport
from app.models.audit import AuditEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UserDeleteRequest(BaseModel):
    confirmation: str = Field(..., description="Confirmation token; must be 'DELETE' to confirm irreversible account deletion.")


@router.get("/me/export")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Exports a comprehensive JSON archive of all personal, observational,
    and clinical health data associated with the authenticated user.
    """
    user_id = current_user.id

    # 1. User Profile
    user_data = {
        "id": str(current_user.id),
        "firebase_uid": current_user.firebase_uid,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
        "last_login_at": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
    }

    # 2. Assessment Sessions, Responses & Results
    sessions = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.user_id == user_id)
        .order_by(AssessmentSession.created_at.desc())
        .all()
    )

    assessment_sessions_data = []
    for s in sessions:
        responses = (
            db.query(AssessmentResponse)
            .filter(AssessmentResponse.assessment_session_id == s.id)
            .all()
        )
        results = (
            db.query(AssessmentResult)
            .filter(AssessmentResult.assessment_session_id == s.id)
            .all()
        )
        reports = (
            db.query(Report)
            .filter(Report.assessment_session_id == s.id)
            .all()
        )

        assessment_sessions_data.append({
            "session_id": str(s.id),
            "status": s.status,
            "report_status": getattr(s, "report_status", None),
            "report_error_class": getattr(s, "report_error_class", None),
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "responses": [
                {
                    "question_id": r.question_id,
                    "response_value": r.response_value,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in responses
            ],
            "results": [
                {
                    "id": str(res.id),
                    "overall_category": res.overall_category,
                    "risk_scores": res.risk_scores,
                    "safety_flags": res.safety_flags,
                    "interpretation": res.interpretation,
                    "created_at": res.created_at.isoformat() if res.created_at else None,
                }
                for res in results
            ],
            "reports": [
                {
                    "id": str(rep.id),
                    "model_provider": rep.model_provider,
                    "model_name": rep.model_name,
                    "report_content": rep.report_content,
                    "created_at": rep.created_at.isoformat() if rep.created_at else None,
                }
                for rep in reports
            ],
        })

    # 3. Health Connections
    connections = (
        db.query(HealthConnection)
        .filter(HealthConnection.user_id == user_id)
        .all()
    )
    connections_data = [
        {
            "id": str(c.id),
            "provider": c.provider,
            "status": c.status,
            "display_name": c.display_name,
            "last_sync_at": c.last_sync_at.isoformat() if c.last_sync_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in connections
    ]

    # 4. Daily Health Metrics
    metrics = (
        db.query(HealthDailyMetrics)
        .filter(HealthDailyMetrics.user_id == user_id)
        .order_by(HealthDailyMetrics.date.desc())
        .all()
    )
    metrics_data = [
        {
            "id": str(m.id),
            "date": m.date.isoformat(),
            "source": m.source,
            "steps": m.steps,
            "active_minutes": m.active_minutes,
            "workout_minutes": m.workout_minutes,
            "sleep_duration_minutes": m.sleep_duration_minutes,
            "sleep_start": m.sleep_start.isoformat() if m.sleep_start else None,
            "sleep_end": m.sleep_end.isoformat() if m.sleep_end else None,
            "resting_heart_rate": m.resting_heart_rate,
            "active_calories": m.active_calories,
            "distance": m.distance,
            "water_intake": m.water_intake,
            "synced_at": m.synced_at.isoformat() if m.synced_at else None,
        }
        for m in metrics
    ]

    # 5. Adaptive Goals
    goals = (
        db.query(AdaptiveGoal)
        .filter(AdaptiveGoal.user_id == user_id)
        .order_by(AdaptiveGoal.date.desc())
        .all()
    )
    goals_data = [
        {
            "id": str(g.id),
            "date": g.date.isoformat(),
            "goal_type": g.goal_type,
            "title": g.title,
            "target_value": g.target_value,
            "unit": g.unit,
            "status": g.status,
            "progress_value": g.progress_value,
            "source": g.source,
            "rationale": g.rationale,
            "created_at": g.created_at.isoformat() if g.created_at else None,
        }
        for g in goals
    ]

    # 6. Semen Analysis Reports
    semen_reports = (
        db.query(SemenReport)
        .filter(SemenReport.user_id == user_id)
        .all()
    )
    semen_reports_data = [
        {
            "id": str(sr.id),
            "collection_date": sr.collection_date.isoformat() if sr.collection_date else None,
            "abstinence_days": sr.abstinence_days,
            "volume_ml": sr.volume_ml,
            "concentration_m_per_ml": sr.concentration_m_per_ml,
            "total_motility_pct": sr.total_motility_pct,
            "progressive_motility_pct": sr.progressive_motility_pct,
            "normal_morphology_pct": sr.normal_morphology_pct,
            "vitality_pct": sr.vitality_pct,
            "ph": sr.ph,
            "lab_name": sr.lab_name,
        }
        for sr in semen_reports
    ]

    # 7. Cycle Plans
    cycle_plans = (
        db.query(CyclePlan)
        .filter(CyclePlan.user_id == user_id)
        .all()
    )
    cycle_plans_data = []
    for cp in cycle_plans:
        checkins = db.query(CycleCheckin).filter(CycleCheckin.plan_id == cp.id).all()
        cycle_plans_data.append({
            "id": str(cp.id),
            "start_date": cp.start_date.isoformat() if cp.start_date else None,
            "end_date": cp.end_date.isoformat() if cp.end_date else None,
            "status": cp.status,
            "focus_factors": cp.focus_factors,
            "created_at": cp.created_at.isoformat() if cp.created_at else None,
            "checkins": [
                {
                    "id": str(chk.id),
                    "week_index": chk.week_index,
                    "factor_id": chk.factor_id,
                    "status": chk.status,
                    "created_at": chk.created_at.isoformat() if chk.created_at else None,
                }
                for chk in checkins
            ],
        })

    # 8. Shared Reports
    shared_reports = (
        db.query(SharedReport)
        .filter(SharedReport.user_id == user_id)
        .all()
    )
    shared_reports_data = [
        {
            "id": str(sr.id),
            "share_token": sr.share_token,
            "is_active": sr.is_active,
            "expires_at": sr.expires_at.isoformat() if sr.expires_at else None,
            "created_at": sr.created_at.isoformat() if sr.created_at else None,
        }
        for sr in shared_reports
    ]

    # 9. Audit Events
    audit_events = (
        db.query(AuditEvent)
        .filter(AuditEvent.user_id == user_id)
        .all()
    )
    audit_events_data = [
        {
            "id": str(ae.id),
            "event_type": ae.event_type,
            "event_metadata": ae.event_metadata,
            "created_at": ae.created_at.isoformat() if ae.created_at else None,
        }
        for ae in audit_events
    ]

    return {
        "user": user_data,
        "assessment_sessions": assessment_sessions_data,
        "health_connections": connections_data,
        "health_daily_metrics": metrics_data,
        "adaptive_goals": goals_data,
        "semen_reports": semen_reports_data,
        "cycle_plans": cycle_plans_data,
        "shared_reports": shared_reports_data,
        "audit_events": audit_events_data,
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }


@router.delete("/me")
def delete_user_account(
    payload: UserDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """
    Permanently deletes user account and triggers database foreign key cascades.
    Also deletes user record in Firebase Authentication Admin SDK.
    Requires confirmation == 'DELETE'.
    """
    if payload.confirmation.strip().upper() != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation required to delete account. Confirmation field must be 'DELETE'.",
        )

    # 1. Attempt Firebase Admin SDK user deletion
    firebase_uid = current_user.firebase_uid
    try:
        import firebase_admin.auth
        firebase_admin.auth.delete_user(firebase_uid)
        logger.info("Successfully deleted user %s from Firebase Auth.", firebase_uid)
    except Exception as fb_err:
        logger.warning(
            "Could not delete Firebase user %s (%s). Proceeding with database cascade deletion.",
            firebase_uid,
            fb_err,
        )

    # 2. Delete user row in Database (relies on CASCADE foreign keys; AuditEvent uses SET NULL)
    db.delete(current_user)
    db.commit()

    return {
        "status": "deleted",
        "message": "User account and all associated personal data have been permanently deleted.",
    }
