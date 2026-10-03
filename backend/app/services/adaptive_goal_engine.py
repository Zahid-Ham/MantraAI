import hashlib
import statistics
from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.health import HealthDailyMetrics, AdaptiveGoal
from app.models.assessment import AssessmentSession, Report


class AdaptiveGoalEngine:
    """
    Deterministic, rule-based adaptive goal engine.
    Calculates personalized daily wellness targets from passive health metrics
    and assessment action-plan context without LLM hallucination or clinical diagnosis.
    """

    @classmethod
    def get_or_create_daily_goals(
        cls, user: User, target_date: Optional[date] = None, db: Session = None
    ) -> List[AdaptiveGoal]:
        if target_date is None:
            target_date = date.today()

        # 1. Check if goals already exist for this user and date
        existing_goals = (
            db.query(AdaptiveGoal)
            .filter(
                AdaptiveGoal.user_id == user.id,
                AdaptiveGoal.date == target_date,
            )
            .order_by(AdaptiveGoal.created_at.asc())
            .all()
        )

        # 2. Look up today's observational metrics to sync progress
        today_metric = (
            db.query(HealthDailyMetrics)
            .filter(
                HealthDailyMetrics.user_id == user.id,
                HealthDailyMetrics.date == target_date,
            )
            .order_by(HealthDailyMetrics.synced_at.desc())
            .first()
        )

        if existing_goals and len(existing_goals) > 0:
            # Update progress values from latest synced health metrics
            if today_metric:
                cls._update_goal_progress_from_metric(existing_goals, today_metric, db)
            return existing_goals

        # 3. Generate new deterministic goals for the date
        new_goals = cls._calculate_goals_for_date(user, target_date, today_metric, db)
        
        for g in new_goals:
            db.add(g)
        db.commit()

        # Re-fetch persisted goals
        persisted = (
            db.query(AdaptiveGoal)
            .filter(
                AdaptiveGoal.user_id == user.id,
                AdaptiveGoal.date == target_date,
            )
            .order_by(AdaptiveGoal.created_at.asc())
            .all()
        )
        return persisted

    @classmethod
    def _calculate_goals_for_date(
        cls, user: User, target_date: date, today_metric: Optional[HealthDailyMetrics], db: Session
    ) -> List[AdaptiveGoal]:
        # Fetch up to 14 days of recent metrics prior to target_date
        past_metrics = (
            db.query(HealthDailyMetrics)
            .filter(
                HealthDailyMetrics.user_id == user.id,
                HealthDailyMetrics.date < target_date,
                HealthDailyMetrics.date >= target_date - timedelta(days=14),
            )
            .order_by(HealthDailyMetrics.date.desc())
            .all()
        )

        valid_step_days = [m.steps for m in past_metrics if m.steps is not None and m.steps > 0]
        valid_active_days = [m.active_minutes for m in past_metrics if m.active_minutes is not None and m.active_minutes > 0]

        goals: List[AdaptiveGoal] = []

        # ── 1. STEPS GOAL ───────────────────────────────────────────────────
        if len(valid_step_days) >= 3:
            med_steps = statistics.median(valid_step_days)
            if med_steps < 4000:
                step_target = 4500.0  # Starter progression
            elif med_steps < 8000:
                # Modest 10% progression rounded to nearest 500
                step_target = float(round((med_steps * 1.10) / 500) * 500)
            else:
                # Maintenance rounded to nearest 500
                step_target = float(round(med_steps / 500) * 500)
            step_target = max(4000.0, min(12000.0, step_target))
            step_rationale = f"Personalized target based on your recent 7-day median movement (~{int(med_steps):,} steps)."
        else:
            step_target = 6000.0  # Starter baseline goal
            step_rationale = "Starter movement baseline. Targets will adapt automatically as health data is recorded."

        step_progress = float(today_metric.steps) if (today_metric and today_metric.steps is not None) else 0.0
        step_status = "completed" if step_progress >= step_target else "in_progress" if step_progress > 0 else "pending"

        goals.append(
            AdaptiveGoal(
                user_id=user.id,
                date=target_date,
                goal_type="steps",
                title="Daily movement",
                target_value=step_target,
                unit="steps",
                rationale=step_rationale,
                source="adaptive_goal_engine",
                status=step_status,
                progress_value=step_progress,
            )
        )

        # ── 2. ACTIVE MINUTES GOAL ──────────────────────────────────────────
        if len(valid_active_days) >= 3:
            med_active = statistics.median(valid_active_days)
            if med_active < 20:
                active_target = 25.0
            else:
                active_target = float(min(60, max(30, int(med_active * 1.05))))
            active_rationale = f"Adapted from your recent active movement pattern (~{int(med_active)} min/day)."
        else:
            active_target = 30.0
            active_rationale = "Personalized activity goal based on your recent activity pattern."

        active_progress = float(today_metric.active_minutes) if (today_metric and today_metric.active_minutes is not None) else 0.0
        active_status = "completed" if active_progress >= active_target else "in_progress" if active_progress > 0 else "pending"

        goals.append(
            AdaptiveGoal(
                user_id=user.id,
                date=target_date,
                goal_type="active_minutes",
                title="Stay active",
                target_value=active_target,
                unit="minutes",
                rationale=active_rationale,
                source="adaptive_goal_engine",
                status=active_status,
                progress_value=active_progress,
            )
        )

        # ── 3. SLEEP CONSISTENCY GOAL ───────────────────────────────────────
        sleep_target = 420.0  # 7 hours target
        sleep_progress = float(today_metric.sleep_duration_minutes) if (today_metric and today_metric.sleep_duration_minutes is not None) else 0.0
        sleep_status = "completed" if sleep_progress >= sleep_target else "in_progress" if sleep_progress > 0 else "pending"

        goals.append(
            AdaptiveGoal(
                user_id=user.id,
                date=target_date,
                goal_type="sleep_consistency",
                title="Restful sleep duration",
                target_value=sleep_target,
                unit="minutes",
                rationale="Aiming for consistent restorative sleep duration supports daily recovery and cognitive focus.",
                source="adaptive_goal_engine",
                status=sleep_status,
                progress_value=sleep_progress,
            )
        )

        # ── 4. ASSESSMENT ACTION PLAN INTEGRATION ────────────────────────────
        action_goal = cls._derive_action_plan_goal(user, target_date, db)
        if action_goal:
            goals.append(action_goal)

        return goals

    @classmethod
    def _derive_action_plan_goal(cls, user: User, target_date: date, db: Session) -> Optional[AdaptiveGoal]:
        """
        Integrates ONE relevant action plan habit from the user's latest assessment report.
        Maintains strict determinism without altering the report schema.
        """
        latest_report = (
            db.query(Report)
            .join(AssessmentSession, Report.assessment_session_id == AssessmentSession.id)
            .filter(
                AssessmentSession.user_id == user.id,
                AssessmentSession.status == "COMPLETED",
            )
            .order_by(AssessmentSession.completed_at.desc())
            .first()
        )

        action_title = "Complete daily hydration and stress check"
        action_rationale = "Maintain baseline daily wellness habits to support hormonal balance and energy."

        if latest_report and isinstance(latest_report.report_content, dict):
            content = latest_report.report_content
            # Check for recommendations in report content
            candidates: List[str] = []

            # 1. priority_recommendations
            if "priority_recommendations" in content and isinstance(content["priority_recommendations"], list):
                for r in content["priority_recommendations"]:
                    if isinstance(r, dict) and "recommendation" in r:
                        candidates.append(r["recommendation"])
                    elif isinstance(r, str):
                        candidates.append(r)

            # 2. executive_summary areas for attention
            if not candidates and "executive_summary" in content and isinstance(content["executive_summary"], dict):
                exec_sum = content["executive_summary"]
                if "areas_for_proactive_attention" in exec_sum and isinstance(exec_sum["areas_for_proactive_attention"], list):
                    for a in exec_sum["areas_for_proactive_attention"]:
                        if isinstance(a, str):
                            candidates.append(a)

            if candidates:
                # Deterministic selection based on user_id and target_date
                seed_num = int(hashlib.md5(f"{str(user.id)}:{target_date.isoformat()}".encode()).hexdigest(), 16)
                chosen_candidate = candidates[seed_num % len(candidates)]
                # Clean up title
                action_title = chosen_candidate[:90]
                action_rationale = "Personalized priority action from your latest health assessment report."

        return AdaptiveGoal(
            user_id=user.id,
            date=target_date,
            goal_type="action_plan",
            title=f"Action Plan: {action_title}",
            target_value=1.0,
            unit="task",
            rationale=action_rationale,
            source="adaptive_goal_engine",
            status="pending",
            progress_value=0.0,
        )

    @classmethod
    def _update_goal_progress_from_metric(
        cls, goals: List[AdaptiveGoal], metric: HealthDailyMetrics, db: Session
    ):
        """Syncs observational metric values to matching goal progress values."""
        has_updates = False
        for g in goals:
            if g.goal_type == "steps" and metric.steps is not None:
                new_prog = float(metric.steps)
                if g.progress_value != new_prog:
                    g.progress_value = new_prog
                    if g.status != "completed" and new_prog >= (g.target_value or 0):
                        g.status = "completed"
                    has_updates = True

            elif g.goal_type == "active_minutes" and metric.active_minutes is not None:
                new_prog = float(metric.active_minutes)
                if g.progress_value != new_prog:
                    g.progress_value = new_prog
                    if g.status != "completed" and new_prog >= (g.target_value or 0):
                        g.status = "completed"
                    has_updates = True

            elif g.goal_type == "sleep_consistency" and metric.sleep_duration_minutes is not None:
                new_prog = float(metric.sleep_duration_minutes)
                if g.progress_value != new_prog:
                    g.progress_value = new_prog
                    if g.status != "completed" and new_prog >= (g.target_value or 0):
                        g.status = "completed"
                    has_updates = True

        if has_updates:
            db.commit()
