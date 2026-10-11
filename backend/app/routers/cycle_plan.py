"""API Router for 90-Day Cycle Plan.

Endpoints:
- POST /api/v1/plans: create one active plan per user.
- GET /api/v1/plans/active: get active plan, current week progress, action steps, and retest prompt.
- POST /api/v1/plans/{id}/checkins: record weekly action item check-in.
- PATCH /api/v1/plans/{id}: update plan status (pause, abandon, complete).
"""

from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import date, timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.assessment import AssessmentSession, Report
from app.models.cycle_plan import CyclePlan, CycleCheckin
from app.services.cycle_plan import (
    select_focus_factors_from_report,
    get_plan_step_for_week,
    SPERMATOGENESIS_RATIONALE_EN,
)

router = APIRouter(prefix="/api/v1/plans", tags=["90-Day Cycle Plan"])


class PlanCreateRequest(BaseModel):
    assessment_session_id: Optional[UUID] = None


class CheckinCreateRequest(BaseModel):
    week_index: int = Field(..., ge=1, le=12)
    factor_id: str
    status: str = Field(..., pattern="^(done|partial|skipped)$")


class PlanStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(active|paused|abandoned|completed)$")


class WeekActionStepOut(BaseModel):
    factor_id: str
    factor_title: str
    week: int
    action_text: str
    quitline: Optional[str] = None
    checkin_status: Optional[str] = None


class ActivePlanResponse(BaseModel):
    id: str
    assessment_session_id: str
    start_date: str
    end_date: str
    days_elapsed: int
    days_remaining: int
    current_week: int
    status: str
    focus_factors: List[str]
    current_week_steps: List[WeekActionStepOut]
    spermatogenesis_rationale: str
    retest_prompt: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# 1. Create Active Plan (one active plan per user)
# ---------------------------------------------------------------------------
@router.post("", response_model=ActivePlanResponse)
def create_cycle_plan(
    payload: PlanCreateRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if user already has an active plan
    existing_active = (
        db.query(CyclePlan)
        .filter(CyclePlan.user_id == current_user.id, CyclePlan.status == "active")
        .first()
    )
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active 90-day cycle plan. Complete or abandon it before starting a new one."
        )

    # Determine assessment session
    sess_id = payload.assessment_session_id if payload else None
    if sess_id:
        session = db.query(AssessmentSession).filter(AssessmentSession.id == sess_id).first()
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid assessment session")
    else:
        session = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.user_id == current_user.id, AssessmentSession.status == "COMPLETED")
            .order_by(AssessmentSession.completed_at.desc())
            .first()
        )

    report_content = {}
    if session:
        rep = db.query(Report).filter(Report.assessment_session_id == session.id).first()
        if rep and rep.report_content:
            report_content = rep.report_content

    focus_factors = select_focus_factors_from_report(report_content)
    today = date.today()
    end_date = today + timedelta(days=90)

    # If session is None (e.g. user started plan before assessment), create a dummy reference session or fallback
    if not session:
        session = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.user_id == current_user.id)
            .order_by(AssessmentSession.created_at.desc())
            .first()
        )
    if not session:
        session = AssessmentSession(
            user_id=current_user.id,
            status="IN_PROGRESS",
            assessment_version="2.0",
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    new_plan = CyclePlan(
        user_id=current_user.id,
        assessment_session_id=session.id,
        start_date=today,
        end_date=end_date,
        status="active",
        focus_factors=focus_factors,
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    steps = [get_plan_step_for_week(f, 1, "en") for f in focus_factors]

    return ActivePlanResponse(
        id=str(new_plan.id),
        assessment_session_id=str(new_plan.assessment_session_id),
        start_date=new_plan.start_date.isoformat(),
        end_date=new_plan.end_date.isoformat(),
        days_elapsed=0,
        days_remaining=90,
        current_week=1,
        status=new_plan.status,
        focus_factors=focus_factors,
        current_week_steps=steps,
        spermatogenesis_rationale=SPERMATOGENESIS_RATIONALE_EN,
        retest_prompt=None,
    )


# ---------------------------------------------------------------------------
# 2. Get Active Plan
# ---------------------------------------------------------------------------
@router.get("/active", response_model=ActivePlanResponse)
def get_active_cycle_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(CyclePlan)
        .filter(CyclePlan.user_id == current_user.id, CyclePlan.status == "active")
        .first()
    )
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active 90-day cycle plan found")

    today = date.today()
    days_elapsed = (today - plan.start_date).days
    current_week = min(12, max(1, (days_elapsed // 7) + 1))
    days_remaining = max(0, 90 - days_elapsed)

    # Fetch checkins for current week
    checkins = (
        db.query(CycleCheckin)
        .filter(CycleCheckin.plan_id == plan.id, CycleCheckin.week_index == current_week)
        .all()
    )
    checkin_map = {c.factor_id: c.status for c in checkins}

    steps = []
    for f in plan.focus_factors:
        step = get_plan_step_for_week(f, current_week, "en")
        step["checkin_status"] = checkin_map.get(f)
        steps.append(step)

    # Day 90 retest prompt
    retest_prompt = None
    if days_elapsed >= 90:
        retest_prompt = {
            "prompt_semen_analysis": True,
            "prompt_repeat_assessment": True,
            "message": (
                "Congratulations on completing your 90-day cycle! Because human spermatogenesis "
                "spans 72–90 days, mature sperm cells now reflect the cumulative lifestyle adaptations "
                "you established. You may now schedule an optional repeat semen analysis and reassessment."
            ),
        }

    return ActivePlanResponse(
        id=str(plan.id),
        assessment_session_id=str(plan.assessment_session_id),
        start_date=plan.start_date.isoformat(),
        end_date=plan.end_date.isoformat(),
        days_elapsed=days_elapsed,
        days_remaining=days_remaining,
        current_week=current_week,
        status=plan.status,
        focus_factors=plan.focus_factors,
        current_week_steps=steps,
        spermatogenesis_rationale=SPERMATOGENESIS_RATIONALE_EN,
        retest_prompt=retest_prompt,
    )


# ---------------------------------------------------------------------------
# 3. Record Weekly Check-in
# ---------------------------------------------------------------------------
@router.post("/{plan_id}/checkins")
def record_plan_checkin(
    plan_id: UUID,
    payload: CheckinCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(CyclePlan).filter(CyclePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    if plan.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: cannot check in on another user's plan")

    existing_checkin = (
        db.query(CycleCheckin)
        .filter(
            CycleCheckin.plan_id == plan.id,
            CycleCheckin.week_index == payload.week_index,
            CycleCheckin.factor_id == payload.factor_id,
        )
        .first()
    )

    if existing_checkin:
        existing_checkin.status = payload.status
        db.commit()
        db.refresh(existing_checkin)
        return {"status": "updated", "checkin_id": str(existing_checkin.id)}
    else:
        new_checkin = CycleCheckin(
            plan_id=plan.id,
            week_index=payload.week_index,
            factor_id=payload.factor_id,
            status=payload.status,
        )
        db.add(new_checkin)
        db.commit()
        db.refresh(new_checkin)
        return {"status": "created", "checkin_id": str(new_checkin.id)}


# ---------------------------------------------------------------------------
# 4. Update Plan Status (pause, abandon, complete)
# ---------------------------------------------------------------------------
@router.patch("/{plan_id}")
def update_plan_status(
    plan_id: UUID,
    payload: PlanStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(CyclePlan).filter(CyclePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    if plan.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: cannot modify another user's plan")

    plan.status = payload.status
    db.commit()

    return {"status": plan.status, "plan_id": str(plan.id)}
