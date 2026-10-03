from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.firebase_auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.health import AdaptiveGoal
from app.schemas.health import AdaptiveGoalOut, AdaptiveGoalUpdate
from app.services.adaptive_goal_engine import AdaptiveGoalEngine

router = APIRouter(prefix="/api/v1/goals", tags=["goals"])


@router.get("/today", response_model=List[AdaptiveGoalOut])
def get_today_goals(
    date_param: Optional[date] = Query(None, alias="date", description="Target calendar date (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns today's personalized adaptive health goals for the authenticated user.
    Calculates deterministic targets if not already generated.
    """
    target = date_param or date.today()
    goals = AdaptiveGoalEngine.get_or_create_daily_goals(
        user=current_user,
        target_date=target,
        db=db,
    )
    return goals


@router.patch("/{goal_id}", response_model=AdaptiveGoalOut)
def update_goal_progress(
    goal_id: UUID,
    payload: AdaptiveGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the completion status or progress value of an adaptive goal.
    Strictly enforces user ownership.
    """
    goal = (
        db.query(AdaptiveGoal)
        .filter(
            AdaptiveGoal.id == goal_id,
            AdaptiveGoal.user_id == current_user.id,
        )
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found.",
        )

    if payload.status is not None:
        goal.status = payload.status
        # If explicitly marked completed, ensure progress reflects target
        if payload.status == "completed" and goal.target_value and (goal.progress_value or 0) < goal.target_value:
            goal.progress_value = goal.target_value
        elif payload.status == "pending" and payload.progress_value is None:
            # If reset to pending and not supplied progress, revert progress if qualitative
            if goal.goal_type == "action_plan":
                goal.progress_value = 0.0

    if payload.progress_value is not None:
        goal.progress_value = payload.progress_value
        if goal.target_value and goal.progress_value >= goal.target_value and goal.status != "completed":
            goal.status = "completed"

    db.commit()
    db.refresh(goal)
    return goal
