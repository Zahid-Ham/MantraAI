import hashlib
import re
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.assessment import AssessmentSession, Report
from app.models.wellness_plan import WellnessPlan, WellnessActionItem, WellnessActionLog
from app.models.health import AdaptiveGoal
from app.services.adaptive_goal_engine import AdaptiveGoalEngine
from app.services.evidence_corpus import DOCUMENT_MAP
from app.schemas.wellness_plan import (
    PlannerDashboardOut,
    WellnessPlanOut,
    WellnessActionItemOut,
    WellnessActionLogOut,
    WeeklyAdherenceStats,
)


class WellnessPlanService:
    """
    Personalized Wellness Planner & Action Tracking Service.
    
    Principles:
    - Evidence-grounded habit suggestions linked to clinical guidelines.
    - Strictly non-diagnostic and non-prescriptive.
    - Does not fabricate clinical claims, fertility probabilities, or medical diagnoses.
    - Reuses existing assessment reports and adaptive goal engine.
    - Strictly enforces user-ownership on all read/write operations.
    """

    # Baseline educational actions for users who haven't completed an assessment yet
    BASELINE_EDUCATIONAL_ACTIONS = [
        {
            "action_key": "baseline-sleep-regularity",
            "title": "Maintain consistent sleep and wake timing",
            "explanation": (
                "Aim for 7 to 8 hours of restorative sleep with consistent bedtimes. "
                "Regular sleep-wake patterns support nocturnal hormonal balance and cognitive recovery."
            ),
            "domain": "sleep_routine",
            "frequency": "daily",
            "target_value": 7.0,
            "target_unit": "hours",
            "priority": 1,
            "evidence_sources": [
                {
                    "evidence_id": "who-sleep-guidelines-2020",
                    "title": "WHO Guidelines on Physical Activity and Sedentary Behaviour",
                    "source": "WHO",
                    "organization": "World Health Organization",
                    "year": 2020,
                    "url": "https://www.who.int/publications/i/item/9789240015128",
                    "source_identifier": "ISBN: 978-92-4-001512-8",
                    "relevance": "Supports sleep hygiene and consistent sleep duration for metabolic recovery.",
                }
            ],
            "evidence_sufficiency": "educational",
        },
        {
            "action_key": "baseline-moderate-movement",
            "title": "Complete 30 minutes of moderate physical activity",
            "explanation": (
                "Engage in moderate-intensity movement such as brisk walking, cycling, or bodyweight exercises. "
                "Moderate physical activity supports systemic endothelial function and general vitality."
            ),
            "domain": "physical_activity",
            "frequency": "daily",
            "target_value": 30.0,
            "target_unit": "minutes",
            "priority": 2,
            "evidence_sources": [
                {
                    "evidence_id": "who-phys-activity-2020",
                    "title": "WHO Guidelines on Physical Activity and Sedentary Behaviour",
                    "source": "WHO",
                    "organization": "World Health Organization",
                    "year": 2020,
                    "url": "https://www.who.int/publications/i/item/9789240015128",
                    "source_identifier": "ISBN: 978-92-4-001512-8",
                    "relevance": "Recommends 150-300 minutes of moderate-intensity aerobic activity per week.",
                }
            ],
            "evidence_sufficiency": "educational",
        },
        {
            "action_key": "baseline-stress-breathing",
            "title": "Practice 5-10 minutes of diaphragmatic breathing",
            "explanation": (
                "Take a short mindful pause once or twice daily to practice slow, controlled breathing. "
                "Down-regulating sympathetic nervous system arousal helps buffer against chronic lifestyle stress."
            ),
            "domain": "stress_management",
            "frequency": "daily",
            "target_value": 10.0,
            "target_unit": "minutes",
            "priority": 3,
            "evidence_sources": [
                {
                    "evidence_id": "eau-mens-health-guidelines-2023",
                    "title": "EAU Guidelines on Sexual and Reproductive Health",
                    "source": "EAU",
                    "organization": "European Association of Urology",
                    "year": 2023,
                    "url": "https://uroweb.org/guidelines/sexual-and-reproductive-health",
                    "source_identifier": "EAU-GL-SRH-2023",
                    "relevance": "Highlights psychogenic stress reduction as a cornerstone of behavioral health.",
                }
            ],
            "evidence_sufficiency": "educational",
        },
        {
            "action_key": "baseline-hydration-water",
            "title": "Stay well-hydrated throughout the day",
            "explanation": (
                "Drink 2.5 to 3 liters of water across the day, adjusting for climate and physical exercise. "
                "Adequate daily hydration maintains circulatory volume and cellular cellular metabolism."
            ),
            "domain": "diet_nutrition",
            "frequency": "daily",
            "target_value": 8.0,
            "target_unit": "glasses",
            "priority": 4,
            "evidence_sources": [
                {
                    "evidence_id": "who-nutritional-hydration",
                    "title": "WHO Nutritional and Hydration Guidelines",
                    "source": "WHO",
                    "organization": "World Health Organization",
                    "year": 2021,
                    "url": "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
                    "source_identifier": "WHO-NUT-2021",
                    "relevance": "Emphasizes adequate fluid intake for optimal metabolic and systemic function.",
                }
            ],
            "evidence_sufficiency": "educational",
        },
    ]

    @classmethod
    def get_or_create_user_plan(
        cls, user: User, db: Session, force_regenerate: bool = False
    ) -> WellnessPlan:
        """
        Retrieves the active wellness plan for the user, or creates one.
        If the user has a completed assessment report, personalized actions are derived from it.
        Otherwise, an evidence-informed educational starter plan is provided.
        """
        existing_plan = (
            db.query(WellnessPlan)
            .filter(
                WellnessPlan.user_id == user.id,
                WellnessPlan.status == "active",
            )
            .order_by(WellnessPlan.created_at.desc())
            .first()
        )

        if existing_plan and not force_regenerate:
            return existing_plan

        # If force_regenerate and an existing plan is found, archive the old one
        if existing_plan and force_regenerate:
            existing_plan.status = "archived"
            db.commit()

        # Check for user's latest completed assessment session
        latest_session = (
            db.query(AssessmentSession)
            .filter(
                AssessmentSession.user_id == user.id,
                AssessmentSession.status == "COMPLETED",
            )
            .order_by(AssessmentSession.completed_at.desc())
            .first()
        )

        latest_report = None
        if latest_session:
            latest_report = (
                db.query(Report)
                .filter(Report.assessment_session_id == latest_session.id)
                .order_by(Report.created_at.desc())
                .first()
            )

        if latest_report and isinstance(latest_report.report_content, dict):
            # Create personalized plan grounded in assessment report
            return cls._create_plan_from_report(user, latest_session, latest_report, db)
        else:
            # Create educational baseline plan
            return cls._create_educational_baseline_plan(user, db)

    @classmethod
    def _create_plan_from_report(
        cls, user: User, session: AssessmentSession, report: Report, db: Session
    ) -> WellnessPlan:
        """Derives personalized, evidence-grounded action items from the assessment report."""
        report_data = report.report_content or {}
        raw_actions = report_data.get("personalized_action_plan", [])
        report_evidence = report_data.get("evidence", [])

        # Build evidence lookup map from report
        evidence_map: Dict[str, Dict[str, Any]] = {}
        for ev in report_evidence:
            if isinstance(ev, dict) and "evidence_id" in ev:
                evidence_map[ev["evidence_id"]] = ev

        plan = WellnessPlan(
            user_id=user.id,
            assessment_session_id=session.id,
            title="Personalized Wellness Plan",
            status="active",
            focus_areas=[],
            is_baseline_educational=False,
        )
        db.add(plan)
        db.flush()  # allocate plan.id

        focus_areas_set = set()
        seen_keys = set()
        priority_counter = 1

        for act in raw_actions:
            if not isinstance(act, dict):
                continue
            title = act.get("title", "").strip()
            if not title:
                continue

            # Generate deduplication action_key
            action_key = cls._generate_action_key(title, act.get("domain", "lifestyle"))
            if action_key in seen_keys:
                continue
            seen_keys.add(action_key)

            domain = act.get("domain", "lifestyle_wellness")
            focus_areas_set.add(domain.replace("_", " ").title())

            # Resolve evidence sources
            ev_refs = act.get("evidence_refs", [])
            resolved_sources = []
            for ref_id in ev_refs:
                if ref_id in evidence_map:
                    resolved_sources.append(evidence_map[ref_id])
                elif ref_id in DOCUMENT_MAP:
                    doc = DOCUMENT_MAP[ref_id]
                    resolved_sources.append({
                        "evidence_id": doc.id,
                        "title": doc.title,
                        "source": doc.source,
                        "organization": doc.organization,
                        "year": doc.publication_year,
                        "url": doc.url,
                        "source_identifier": doc.source_identifier,
                        "relevance": f"Authoritative clinical guideline from {doc.source}.",
                    })

            # Derive frequency and reasonable non-clinical targets
            frequency, target_val, target_unit = cls._derive_frequency_and_target(act)

            action_item = WellnessActionItem(
                plan_id=plan.id,
                user_id=user.id,
                action_key=action_key,
                title=title[:255],
                explanation=act.get("description", act.get("rationale", title)),
                domain=domain,
                frequency=frequency,
                target_value=target_val,
                target_unit=target_unit,
                start_date=date.today(),
                status="active",
                evidence_sources=resolved_sources,
                evidence_sufficiency="sufficient" if len(resolved_sources) > 0 else "educational",
                is_from_assessment=True,
                priority=priority_counter,
            )
            db.add(action_item)
            priority_counter += 1

        # If report had no valid action items, fall back to baseline educational items
        if priority_counter == 1:
            cls._seed_baseline_actions(plan.id, user.id, db)
            plan.is_baseline_educational = True
            plan.focus_areas = ["Sleep Routine", "Physical Activity", "Stress Management"]
        else:
            plan.focus_areas = sorted(list(focus_areas_set))

        db.commit()
        db.refresh(plan)
        return plan

    @classmethod
    def _create_educational_baseline_plan(cls, user: User, db: Session) -> WellnessPlan:
        """Creates a baseline evidence-informed starter plan when no assessment exists."""
        plan = WellnessPlan(
            user_id=user.id,
            assessment_session_id=None,
            title="Evidence-Informed Starter Wellness Plan",
            status="active",
            focus_areas=["Sleep Routine", "Physical Activity", "Stress Management", "Hydration"],
            is_baseline_educational=True,
        )
        db.add(plan)
        db.flush()

        cls._seed_baseline_actions(plan.id, user.id, db)
        db.commit()
        db.refresh(plan)
        return plan

    @classmethod
    def _seed_baseline_actions(cls, plan_id: UUID, user_id: UUID, db: Session):
        """Seeds baseline educational actions into a plan."""
        for item in cls.BASELINE_EDUCATIONAL_ACTIONS:
            action = WellnessActionItem(
                plan_id=plan_id,
                user_id=user_id,
                action_key=item["action_key"],
                title=item["title"],
                explanation=item["explanation"],
                domain=item["domain"],
                frequency=item["frequency"],
                target_value=item["target_value"],
                target_unit=item["target_unit"],
                start_date=date.today(),
                status="active",
                evidence_sources=item["evidence_sources"],
                evidence_sufficiency=item["evidence_sufficiency"],
                is_from_assessment=False,
                priority=item["priority"],
            )
            db.add(action)

    @classmethod
    def log_action_progress(
        cls,
        user: User,
        action_id: UUID,
        status_val: str,
        target_date: Optional[date] = None,
        notes: Optional[str] = None,
        db: Session = None,
    ) -> WellnessActionLog:
        """
        Logs a user's completion status for an action on a specific date.
        Enforces user ownership. Idempotent on (action_item_id, date).
        """
        if status_val not in ("completed", "skipped", "postponed"):
            raise ValueError(f"Invalid action status '{status_val}'. Must be completed, skipped, or postponed.")

        target_date = target_date or date.today()

        # Enforce user ownership of the action item
        action = (
            db.query(WellnessActionItem)
            .filter(
                WellnessActionItem.id == action_id,
                WellnessActionItem.user_id == user.id,
            )
            .first()
        )
        if not action:
            raise LookupError("Wellness action item not found or unauthorized.")

        # Check existing log
        existing_log = (
            db.query(WellnessActionLog)
            .filter(
                WellnessActionLog.action_item_id == action.id,
                WellnessActionLog.date == target_date,
            )
            .first()
        )

        if existing_log:
            existing_log.status = status_val
            if notes is not None:
                existing_log.notes = notes
            db.commit()
            db.refresh(existing_log)
            return existing_log

        new_log = WellnessActionLog(
            action_item_id=action.id,
            user_id=user.id,
            date=target_date,
            status=status_val,
            notes=notes,
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return new_log

    @classmethod
    def update_action_state(
        cls,
        user: User,
        action_id: UUID,
        new_state: str,
        db: Session,
    ) -> WellnessActionItem:
        """Updates lifecycle state of an action item (active, paused, dismissed, completed)."""
        if new_state not in ("active", "paused", "dismissed", "completed"):
            raise ValueError(f"Invalid state '{new_state}'. Must be active, paused, dismissed, or completed.")

        action = (
            db.query(WellnessActionItem)
            .filter(
                WellnessActionItem.id == action_id,
                WellnessActionItem.user_id == user.id,
            )
            .first()
        )
        if not action:
            raise LookupError("Wellness action item not found or unauthorized.")

        action.status = new_state
        db.commit()
        db.refresh(action)
        return action

    @classmethod
    def get_planner_dashboard(
        cls, user: User, target_date: Optional[date] = None, db: Session = None
    ) -> PlannerDashboardOut:
        """
        Consolidates the wellness plan, today's actions, adaptive goals, and weekly adherence stats.
        """
        target_date = target_date or date.today()

        # Ensure active plan exists
        plan = cls.get_or_create_user_plan(user, db)

        # Fetch action items for the plan
        all_actions = (
            db.query(WellnessActionItem)
            .filter(
                WellnessActionItem.plan_id == plan.id,
                WellnessActionItem.user_id == user.id,
            )
            .order_by(WellnessActionItem.priority.asc())
            .all()
        )

        # Fetch today's logs for these actions
        action_ids = [a.id for a in all_actions]
        today_logs = (
            db.query(WellnessActionLog)
            .filter(
                WellnessActionLog.action_item_id.in_(action_ids),
                WellnessActionLog.date == target_date,
            )
            .all()
        ) if action_ids else []

        log_map = {l.action_item_id: l for l in today_logs}

        today_action_outs: List[WellnessActionItemOut] = []
        upcoming_action_outs: List[WellnessActionItemOut] = []
        paused_dismissed_outs: List[WellnessActionItemOut] = []

        for a in all_actions:
            item_out = WellnessActionItemOut.model_validate(a)
            today_log = log_map.get(a.id)
            if today_log:
                item_out.today_status = today_log.status
                item_out.today_log = WellnessActionLogOut.model_validate(today_log)

            if a.status in ("paused", "dismissed"):
                paused_dismissed_outs.append(item_out)
            elif a.status == "active":
                # Active items appear in today's actions
                today_action_outs.append(item_out)
            elif a.status == "completed":
                upcoming_action_outs.append(item_out)

        # Get existing adaptive goals for today
        adaptive_goals = AdaptiveGoalEngine.get_or_create_daily_goals(
            user=user, target_date=target_date, db=db
        )

        # Calculate weekly stats
        weekly_stats = cls.get_weekly_adherence_stats(user, target_date, db)

        # Check latest completed assessment
        latest_assessment = (
            db.query(AssessmentSession)
            .filter(
                AssessmentSession.user_id == user.id,
                AssessmentSession.status == "COMPLETED",
            )
            .order_by(AssessmentSession.completed_at.desc())
            .first()
        )

        return PlannerDashboardOut(
            plan=WellnessPlanOut.model_validate(plan),
            today_actions=today_action_outs,
            upcoming_actions=upcoming_action_outs,
            paused_or_dismissed_actions=paused_dismissed_outs,
            adaptive_goals=adaptive_goals,
            weekly_stats=weekly_stats,
            has_assessment=latest_assessment is not None,
            assessment_date=latest_assessment.completed_at if latest_assessment else None,
        )

    @classmethod
    def get_weekly_adherence_stats(
        cls, user: User, end_date: date, db: Session
    ) -> WeeklyAdherenceStats:
        """
        Calculates 7-day adherence statistics strictly from self-reported action logs.
        Non-clinical and non-diagnostic.
        """
        start_date = end_date - timedelta(days=6)

        # Query all logs in the 7-day window
        logs = (
            db.query(WellnessActionLog)
            .filter(
                WellnessActionLog.user_id == user.id,
                WellnessActionLog.date >= start_date,
                WellnessActionLog.date <= end_date,
            )
            .all()
        )

        completed = sum(1 for l in logs if l.status == "completed")
        skipped = sum(1 for l in logs if l.status == "skipped")
        postponed = sum(1 for l in logs if l.status == "postponed")
        total = len(logs)

        rate = round((completed / total) * 100, 1) if total > 0 else 0.0

        # Calculate streak (consecutive days ending on end_date or yesterday with >= 1 completion)
        streak = cls._calculate_streak(user.id, end_date, db)

        return WeeklyAdherenceStats(
            start_date=start_date,
            end_date=end_date,
            total_scheduled_actions=total,
            completed_count=completed,
            skipped_count=skipped,
            postponed_count=postponed,
            completion_rate_pct=rate,
            streak_days=streak,
        )

    @classmethod
    def _calculate_streak(cls, user_id: UUID, reference_date: date, db: Session) -> int:
        """Calculates current consecutive days with at least one completed action."""
        streak = 0
        curr = reference_date

        # Check today first; if no completion today, check if yesterday was completed
        today_completed = (
            db.query(WellnessActionLog)
            .filter(
                WellnessActionLog.user_id == user_id,
                WellnessActionLog.date == curr,
                WellnessActionLog.status == "completed",
            )
            .first()
        )
        if not today_completed:
            curr = reference_date - timedelta(days=1)

        while True:
            day_has_completed = (
                db.query(WellnessActionLog)
                .filter(
                    WellnessActionLog.user_id == user_id,
                    WellnessActionLog.date == curr,
                    WellnessActionLog.status == "completed",
                )
                .first()
            )
            if day_has_completed:
                streak += 1
                curr -= timedelta(days=1)
            else:
                break

            if streak >= 365:  # safety bound
                break

        return streak

    @classmethod
    def _generate_action_key(cls, title: str, domain: str) -> str:
        """Produces a deterministic slug/hash key to prevent duplicate action insertion."""
        clean_title = re.sub(r"[^a-zA-Z0-9]+", "-", title.strip().lower())[:60]
        hash_suffix = hashlib.md5(title.strip().lower().encode()).hexdigest()[:8]
        return f"{domain[:20]}-{clean_title}-{hash_suffix}"

    @classmethod
    def _derive_frequency_and_target(cls, action_dict: Dict[str, Any]):
        """Deterministically extracts frequency and target value/unit without arbitrary hallucination."""
        timeframe = str(action_dict.get("timeframe", "ongoing")).lower()
        desc = (action_dict.get("description", "") + " " + action_dict.get("title", "")).lower()

        # Target unit extraction
        target_val = None
        target_unit = None
        frequency = "daily"

        if "weekly" in timeframe or "per week" in desc or "3x" in desc:
            frequency = "3x_weekly"
        elif "ongoing" in timeframe or "daily" in desc:
            frequency = "daily"

        # Look for numbers in minutes or hours
        min_match = re.search(r"(\d{1,3})\s*(?:min|minutes)", desc)
        if min_match:
            target_val = float(min_match.group(1))
            target_unit = "minutes"
        else:
            hr_match = re.search(r"(\d(?:\.\d)?)\s*(?:hours|hrs)", desc)
            if hr_match:
                target_val = float(hr_match.group(1))
                target_unit = "hours"

        return frequency, target_val, target_unit
