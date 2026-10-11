from datetime import date, timedelta
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session

from app.auth.firebase_auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.config import settings
from app.security.rate_limiter import check_rate_limit
from app.models.wellness_plan import WellnessActionLog, WellnessActionItem
from app.schemas.wellness_plan import (
    PlannerDashboardOut,
    WellnessPlanOut,
    WellnessActionItemOut,
    WellnessActionLogOut,
    WellnessActionLogCreate,
    WellnessActionStatusUpdate,
    WeeklyAdherenceStats,
)
from app.services.wellness_plan_service import WellnessPlanService

router = APIRouter(prefix="/api/v1/wellness-plan", tags=["wellness-plan"])


@router.get("/dashboard", response_model=PlannerDashboardOut)
def get_planner_dashboard(
    date_param: Optional[date] = Query(None, alias="date", description="Target calendar date (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the consolidated Wellness Planner dashboard for the authenticated user:
    - Active wellness plan
    - Today's evidence-grounded action items with completion statuses
    - Upcoming and paused actions
    - Reused daily adaptive movement & sleep goals from the Adaptive Goal Engine
    - 7-day self-reported adherence statistics
    """
    target = date_param or date.today()
    return WellnessPlanService.get_planner_dashboard(user=current_user, target_date=target, db=db)


@router.post("/generate", response_model=WellnessPlanOut)
def generate_wellness_plan(
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates or updates the user's personalized wellness plan.
    - If a completed assessment report exists, derives personalized actions grounded in evidence.
    - If no assessment exists, provides evidence-informed educational starter actions.
    - Idempotent and archives previous plans.
    """
    if request:
        check_rate_limit(
            request=request,
            key=f"wellness_generate:{current_user.id}",
            max_requests=settings.RATE_LIMIT_ASSESSMENT_PER_MINUTE,
            window_seconds=60,
        )

    if settings.ENFORCE_USER_CONSENT:
        from app.services import user_data_service
        user_data_service.require_consent_for_operation(
            db=db,
            user=current_user,
            consent_types=["HEALTH_DATA_PROCESSING"],
        )
    plan = WellnessPlanService.get_or_create_user_plan(
        user=current_user, db=db, force_regenerate=True
    )
    return plan


@router.post("/actions/{action_id}/log", response_model=WellnessActionLogOut)
def log_action_progress(
    action_id: UUID,
    payload: WellnessActionLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Logs user-reported completion, skip, or postponement of an action item for today or a specific date.
    Strictly enforces user ownership.
    """
    try:
        log_entry = WellnessPlanService.log_action_progress(
            user=current_user,
            action_id=action_id,
            status_val=payload.status,
            target_date=payload.date,
            notes=payload.notes,
            db=db,
        )
        return log_entry
    except LookupError as le:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(le))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.patch("/actions/{action_id}/state", response_model=WellnessActionItemOut)
def update_action_state(
    action_id: UUID,
    payload: WellnessActionStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Pauses, resumes, or dismisses an action item.
    Strictly enforces user ownership.
    """
    try:
        action = WellnessPlanService.update_action_state(
            user=current_user,
            action_id=action_id,
            new_state=payload.status,
            db=db,
        )
        return action
    except LookupError as le:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(le))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.get("/adherence", response_model=WeeklyAdherenceStats)
def get_adherence_stats(
    date_param: Optional[date] = Query(None, alias="date", description="Reference date (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns 7-day adherence metrics calculated strictly from self-reported action logs.
    Non-clinical and non-diagnostic.
    """
    ref_date = date_param or date.today()
    return WellnessPlanService.get_weekly_adherence_stats(
        user=current_user, end_date=ref_date, db=db
    )


@router.get("/history", response_model=List[WellnessActionLogOut])
def get_action_history(
    days: int = Query(30, ge=1, le=90, description="Number of past days to fetch"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns chronological history of action completion logs for the authenticated user.
    """
    start_d = date.today() - timedelta(days=days)
    return (
        db.query(WellnessActionLog)
        .filter(
            WellnessActionLog.user_id == current_user.id,
            WellnessActionLog.date >= start_d,
        )
        .order_by(WellnessActionLog.date.desc())
        .all()
    )
