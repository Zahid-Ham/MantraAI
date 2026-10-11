import logging
import json
from typing import Dict, Any, List, Optional, Tuple
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.models.assessment import AssessmentSession, AssessmentResponse, AssessmentResult, Report
from app.models.companion import CompanionConversation, CompanionMessage
from app.models.health import HealthConnection, HealthDailyMetrics, AdaptiveGoal
from app.models.wellness_plan import WellnessPlan, WellnessActionItem, WellnessActionLog
from app.models.myth_fact import MythFactQueryHistory
from app.models.consent import UserConsent
from app.models.deletion import AccountDeletionRecord
from app.models.audit import AuditEvent

logger = logging.getLogger(__name__)


def is_firebase_admin_configured() -> bool:
    """
    Checks whether Firebase Admin SDK is initialized and configured with credentials.
    """
    try:
        from app.auth import firebase_auth
        import firebase_admin
        return bool(firebase_auth.firebase_initialized and firebase_admin._apps)
    except Exception:
        return False


def delete_user_data_graph(db: Session, user: User) -> Dict[str, int]:
    """
    Explicitly and transactionally deletes the complete data graph for a given user.
    Executes in strict dependency order, avoiding reliance on implicit database cascade triggers.
    Ensures zero orphan records and zero data leakage.
    """
    user_id = user.id
    counts: Dict[str, int] = {}

    try:
        # 1. Assessment sessions and their child rows
        sessions = db.query(AssessmentSession).filter(AssessmentSession.user_id == user_id).all()
        session_ids = [s.id for s in sessions]

        if session_ids:
            counts["reports"] = (
                db.query(Report)
                .filter(Report.assessment_session_id.in_(session_ids))
                .delete(synchronize_session=False)
            )
            counts["assessment_results"] = (
                db.query(AssessmentResult)
                .filter(AssessmentResult.assessment_session_id.in_(session_ids))
                .delete(synchronize_session=False)
            )
            counts["assessment_responses"] = (
                db.query(AssessmentResponse)
                .filter(AssessmentResponse.assessment_session_id.in_(session_ids))
                .delete(synchronize_session=False)
            )
        else:
            counts["reports"] = 0
            counts["assessment_results"] = 0
            counts["assessment_responses"] = 0

        # Unlink any wellness plans that reference these sessions
        db.query(WellnessPlan).filter(WellnessPlan.user_id == user_id).update(
            {WellnessPlan.assessment_session_id: None}, synchronize_session=False
        )

        counts["assessment_sessions"] = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.user_id == user_id)
            .delete(synchronize_session=False)
        )

        # 2. Companion conversations and messages
        convs = db.query(CompanionConversation).filter(CompanionConversation.user_id == user_id).all()
        conv_ids = [c.id for c in convs]
        if conv_ids:
            counts["companion_messages"] = (
                db.query(CompanionMessage)
                .filter(CompanionMessage.conversation_id.in_(conv_ids))
                .delete(synchronize_session=False)
            )
        else:
            counts["companion_messages"] = 0

        counts["companion_conversations"] = (
            db.query(CompanionConversation)
            .filter(CompanionConversation.user_id == user_id)
            .delete(synchronize_session=False)
        )

        # 3. Wellness planner action logs, action items, and plans
        counts["wellness_action_logs"] = (
            db.query(WellnessActionLog)
            .filter(WellnessActionLog.user_id == user_id)
            .delete(synchronize_session=False)
        )
        counts["wellness_action_items"] = (
            db.query(WellnessActionItem)
            .filter(WellnessActionItem.user_id == user_id)
            .delete(synchronize_session=False)
        )
        counts["wellness_plans"] = (
            db.query(WellnessPlan)
            .filter(WellnessPlan.user_id == user_id)
            .delete(synchronize_session=False)
        )

        # 4. Health metrics, adaptive goals, and connections
        counts["health_daily_metrics"] = (
            db.query(HealthDailyMetrics)
            .filter(HealthDailyMetrics.user_id == user_id)
            .delete(synchronize_session=False)
        )
        counts["adaptive_goals"] = (
            db.query(AdaptiveGoal)
            .filter(AdaptiveGoal.user_id == user_id)
            .delete(synchronize_session=False)
        )
        counts["health_connections"] = (
            db.query(HealthConnection)
            .filter(HealthConnection.user_id == user_id)
            .delete(synchronize_session=False)
        )

        # 5. Myth vs Fact search history
        counts["myth_fact_query_history"] = (
            db.query(MythFactQueryHistory)
            .filter(MythFactQueryHistory.user_id == user_id)
            .delete(synchronize_session=False)
        )

        # 6. User Consents
        counts["user_consents"] = (
            db.query(UserConsent)
            .filter(UserConsent.user_id == user_id)
            .delete(synchronize_session=False)
        )

        # 7. Disassociate Audit Events (preserve anonymized system auditability)
        counts["audit_events_disassociated"] = (
            db.query(AuditEvent)
            .filter(AuditEvent.user_id == user_id)
            .update({AuditEvent.user_id: None}, synchronize_session=False)
        )

        # 8. Delete user record
        counts["users"] = (
            db.query(User)
            .filter(User.id == user_id)
            .delete(synchronize_session=False)
        )

        db.commit()
        logger.info("Successfully wiped complete data graph for user %s: %s", str(user_id), counts)
        return counts

    except Exception as e:
        db.rollback()
        logger.error("Error deleting data graph for user %s: %s", str(user_id), str(e))
        raise


def delete_firebase_user(firebase_uid: str) -> Tuple[bool, Optional[str]]:
    """
    Safely deletes the user from Firebase Authentication.
    Handles already-deleted user errors gracefully as idempotent success.
    Returns (success_boolean, optional_error_message).
    """
    try:
        from firebase_admin import auth
        auth.delete_user(firebase_uid)
        logger.info("Successfully deleted Firebase account for UID %s", firebase_uid)
        return True, None
    except Exception as e:
        err_str = str(e)
        # Check if user was already deleted / not found in Firebase
        if "not found" in err_str.lower() or "not_found" in err_str.lower() or "user-not-found" in err_str.lower():
            logger.info("Firebase user %s was already deleted or not found.", firebase_uid)
            return True, None
        logger.warning("Could not delete Firebase account for UID %s: %s", firebase_uid, err_str)
        return False, err_str


def execute_complete_user_deletion(
    db: Session,
    user: User,
    require_recent_auth: bool = True,
    max_auth_age_seconds: int = 900,
) -> Dict[str, Any]:
    """
    Executes consistent, durable two-phase account deletion:
    1. Validates recent re-authentication when required.
    2. Explicitly verifies Firebase Admin SDK availability before touching DB.
    3. Prevents duplicate / concurrent requests (409 Conflict).
    4. Handles partial retries idempotently.
    5. Commits PostgreSQL data wipe BEFORE deleting Firebase to eliminate
       the critical risk of Firebase succeeding while PostgreSQL fails (which
       would leave inaccessible orphaned health data).
    6. Tracks deletion lifecycle state in AccountDeletionRecord.
    """
    firebase_uid = user.firebase_uid
    user_id = user.id

    # 1. Recent authentication verification
    if require_recent_auth:
        from app.auth.firebase_auth import verify_recent_authentication
        verify_recent_authentication(user, max_age_seconds=max_auth_age_seconds)

    # 2. Verify Firebase credentials explicitly
    if not is_firebase_admin_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Authentication service is not initialized or configured on the backend. Account deletion cannot be completed without identity provider integration.",
        )

    # 3. Check existing AccountDeletionRecord
    existing = (
        db.query(AccountDeletionRecord)
        .filter(AccountDeletionRecord.firebase_uid == firebase_uid)
        .order_by(AccountDeletionRecord.initiated_at.desc())
        .first()
    )

    if existing:
        if existing.status == "COMPLETED":
            return {
                "status": "COMPLETED",
                "message": "Account has already been permanently deleted.",
                "records_deleted": {},
                "firebase_account_deleted": True,
                "recovery_guidance": None,
            }

        # Concurrency / duplicate request lock
        if existing.status == "PENDING":
            now_ts = datetime.utcnow()
            diff_secs = (now_ts - existing.initiated_at.replace(tzinfo=None)).total_seconds()
            if diff_secs < 60:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account deletion request is already in progress. Please wait for completion.",
                )
            else:
                existing.status = "FAILED"
                existing.error_message = f"Previous deletion attempt timed out after {int(diff_secs)} seconds."
                db.commit()

        # Retry after partial failure (DB already deleted, Firebase pending)
        if existing.status == "PENDING_FIREBASE":
            existing.retry_count += 1
            fb_success, fb_error = delete_firebase_user(firebase_uid)
            if fb_success:
                existing.status = "COMPLETED"
                existing.completed_at = datetime.utcnow()
                existing.error_message = None
                # Clean up any transient/stray user row in PostgreSQL so no user record remains
                db.query(User).filter(User.firebase_uid == firebase_uid).delete(synchronize_session=False)
                db.commit()
                return {
                    "status": "COMPLETED",
                    "message": "Account and all associated health records permanently deleted.",
                    "records_deleted": {},
                    "firebase_account_deleted": True,
                    "recovery_guidance": None,
                }
            else:
                existing.error_message = fb_error
                db.commit()
                return {
                    "status": "PENDING_FIREBASE",
                    "message": "All personal health data in PostgreSQL was wiped. Firebase deletion encountered a service issue. Please retry.",
                    "records_deleted": {},
                    "firebase_account_deleted": False,
                    "recovery_guidance": "Personal health data is wiped. Please retry to finalize removal of your identity provider login record.",
                }

    # 4. Fresh Deletion Execution
    record = AccountDeletionRecord(
        firebase_uid=firebase_uid,
        user_id=user_id,
        status="PENDING",
    )
    db.add(record)
    db.commit()

    # Step A: Wipe database graph first in an isolated transaction
    try:
        counts = delete_user_data_graph(db, user)
        record.status = "DB_DELETED"
        record.records_deleted = json.dumps(counts)
        db.commit()
    except Exception as db_err:
        db.rollback()
        record.status = "FAILED"
        record.error_message = f"Database deletion failed: {str(db_err)}"
        db.commit()
        logger.error("Database deletion failed for user %s: %s", str(user_id), str(db_err))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database deletion encountered an unexpected error. Personal data was preserved and transaction rolled back safely.",
        )

    # Step B: Delete from Firebase Authentication
    fb_success, fb_error = delete_firebase_user(firebase_uid)
    if fb_success:
        record.status = "COMPLETED"
        record.completed_at = datetime.utcnow()
        db.commit()
        return {
            "status": "COMPLETED",
            "message": "Account and all associated health records have been permanently deleted.",
            "records_deleted": counts,
            "firebase_account_deleted": True,
            "recovery_guidance": None,
        }
    else:
        record.status = "PENDING_FIREBASE"
        record.error_message = fb_error
        db.commit()
        return {
            "status": "PENDING_FIREBASE",
            "message": "All personal health data in PostgreSQL has been permanently erased. Identity provider account deletion encountered a service issue.",
            "records_deleted": counts,
            "firebase_account_deleted": False,
            "recovery_guidance": "Personal health data in PostgreSQL is wiped. Please retry to finalize removal of your identity provider login record.",
        }


def delete_individual_assessment(db: Session, user: User, assessment_id: UUID) -> Dict[str, Any]:
    """
    Safely deletes an individual assessment session and its associated results and report.
    Verifies user ownership before deletion.
    """
    session = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.id == assessment_id)
        .first()
    )

    if not session:
        return {"found": False, "authorized": False}

    if session.user_id != user.id:
        return {"found": True, "authorized": False}

    # Unlink any wellness plan referencing this session
    db.query(WellnessPlan).filter(WellnessPlan.assessment_session_id == assessment_id).update(
        {WellnessPlan.assessment_session_id: None}, synchronize_session=False
    )

    # Delete child rows
    db.query(Report).filter(Report.assessment_session_id == assessment_id).delete(synchronize_session=False)
    db.query(AssessmentResult).filter(AssessmentResult.assessment_session_id == assessment_id).delete(synchronize_session=False)
    db.query(AssessmentResponse).filter(AssessmentResponse.assessment_session_id == assessment_id).delete(synchronize_session=False)

    # Delete session
    db.delete(session)

    # Log audit event without logging raw health answers
    audit = AuditEvent(
        user_id=user.id,
        event_type="ASSESSMENT_DELETED",
        event_metadata={"assessment_session_id": str(assessment_id)},
    )
    db.add(audit)

    db.commit()
    logger.info("User %s deleted assessment session %s", str(user.id), str(assessment_id))
    return {"found": True, "authorized": True}


def export_user_data(db: Session, user: User) -> Dict[str, Any]:
    """
    Compiles a comprehensive, portable JSON export of all personal data
    belonging to the requesting user. Strictly scoped to current_user.id.
    """
    user_id = user.id

    # 1. Profile
    profile_data = {
        "id": str(user.id),
        "firebase_uid": user.firebase_uid,
        "email": user.email,
        "display_name": user.display_name,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
    }

    # 2. Consents
    consents = db.query(UserConsent).filter(UserConsent.user_id == user_id).order_by(UserConsent.created_at.asc()).all()
    consents_data = [
        {
            "id": str(c.id),
            "consent_type": c.consent_type,
            "policy_version": c.policy_version,
            "action": c.action,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in consents
    ]

    # 3. Assessment sessions with responses, results, and reports
    sessions = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.user_id == user_id)
        .order_by(AssessmentSession.started_at.desc())
        .all()
    )
    assessments_data = []
    for sess in sessions:
        responses = db.query(AssessmentResponse).filter(AssessmentResponse.assessment_session_id == sess.id).all()
        result = db.query(AssessmentResult).filter(AssessmentResult.assessment_session_id == sess.id).first()
        report = db.query(Report).filter(Report.assessment_session_id == sess.id).first()

        assessments_data.append({
            "session_id": str(sess.id),
            "assessment_version": sess.assessment_version,
            "status": sess.status,
            "started_at": sess.started_at.isoformat() if sess.started_at else None,
            "completed_at": sess.completed_at.isoformat() if sess.completed_at else None,
            "responses": {r.question_id: r.response_value for r in responses},
            "results": {
                "overall_category": result.overall_category,
                "risk_scores": result.risk_scores,
                "interpretation": result.interpretation,
            } if result else None,
            "report": {
                "model_provider": report.model_provider,
                "model_name": report.model_name,
                "report_content": report.report_content,
                "structured_findings": report.structured_findings,
            } if report else None,
        })

    # 4. Companion conversations and messages
    convs = (
        db.query(CompanionConversation)
        .filter(CompanionConversation.user_id == user_id)
        .order_by(CompanionConversation.created_at.asc())
        .all()
    )
    companion_data = []
    for conv in convs:
        messages = (
            db.query(CompanionMessage)
            .filter(CompanionMessage.conversation_id == conv.id)
            .order_by(CompanionMessage.created_at.asc())
            .all()
        )
        companion_data.append({
            "conversation_id": str(conv.id),
            "title": conv.title,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "messages": [
                {
                    "id": str(m.id),
                    "role": m.role,
                    "content": m.content,
                    "evidence_sources": m.sources,
                    "evidence_sufficiency": m.evidence_sufficiency,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                }
                for m in messages
            ],
        })

    # 5. Health Connections and Daily Metrics
    connections = db.query(HealthConnection).filter(HealthConnection.user_id == user_id).all()
    connections_data = [
        {
            "id": str(conn.id),
            "provider": conn.provider,
            "status": conn.status,
            "display_name": conn.display_name,
            "last_sync_at": conn.last_sync_at.isoformat() if conn.last_sync_at else None,
        }
        for conn in connections
    ]

    metrics = (
        db.query(HealthDailyMetrics)
        .filter(HealthDailyMetrics.user_id == user_id)
        .order_by(HealthDailyMetrics.date.desc())
        .all()
    )
    metrics_data = [
        {
            "date": m.date.isoformat() if m.date else None,
            "source": m.source,
            "source_device": m.source_device,
            "steps": m.steps,
            "active_minutes": m.active_minutes,
            "workout_minutes": m.workout_minutes,
            "sleep_duration_minutes": m.sleep_duration_minutes,
            "resting_heart_rate": m.resting_heart_rate,
            "active_calories": m.active_calories,
            "distance": m.distance,
            "water_intake": m.water_intake,
        }
        for m in metrics
    ]

    goals = db.query(AdaptiveGoal).filter(AdaptiveGoal.user_id == user_id).order_by(AdaptiveGoal.date.desc()).all()
    goals_data = [
        {
            "id": str(g.id),
            "date": g.date.isoformat() if g.date else None,
            "goal_type": g.goal_type,
            "title": g.title,
            "target_value": g.target_value,
            "unit": g.unit,
            "status": g.status,
            "progress_value": g.progress_value,
        }
        for g in goals
    ]

    # 6. Wellness plans and actions
    plans = (
        db.query(WellnessPlan)
        .filter(WellnessPlan.user_id == user_id)
        .order_by(WellnessPlan.created_at.desc())
        .all()
    )
    plans_data = []
    for plan in plans:
        items = (
            db.query(WellnessActionItem)
            .filter(WellnessActionItem.plan_id == plan.id)
            .order_by(WellnessActionItem.priority.asc())
            .all()
        )
        items_data = []
        for item in items:
            logs = db.query(WellnessActionLog).filter(WellnessActionLog.action_item_id == item.id).all()
            items_data.append({
                "id": str(item.id),
                "action_key": item.action_key,
                "title": item.title,
                "explanation": item.explanation,
                "domain": item.domain,
                "frequency": item.frequency,
                "target_value": item.target_value,
                "target_unit": item.target_unit,
                "status": item.status,
                "evidence_sources": item.evidence_sources,
                "logs": [
                    {
                        "date": log.date.isoformat() if log.date else None,
                        "status": log.status,
                        "notes": log.notes,
                        "logged_at": log.logged_at.isoformat() if log.logged_at else None,
                    }
                    for log in logs
                ],
            })

        plans_data.append({
            "id": str(plan.id),
            "title": plan.title,
            "status": plan.status,
            "focus_areas": plan.focus_areas,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
            "action_items": items_data,
        })

    # 7. Myth vs Fact history
    myth_queries = (
        db.query(MythFactQueryHistory)
        .filter(MythFactQueryHistory.user_id == user_id)
        .order_by(MythFactQueryHistory.created_at.desc())
        .all()
    )
    myth_data = [
        {
            "id": str(q.id),
            "query_text": q.query_text,
            "match_type": q.match_type,
            "classification": q.classification,
            "domain": q.domain,
            "explanation": q.explanation,
            "created_at": q.created_at.isoformat() if q.created_at else None,
        }
        for q in myth_queries
    ]

    return {
        "export_metadata": {
            "platform": "MantraAI Health Intelligence",
            "export_version": "1.0",
            "exported_at": datetime.utcnow().isoformat(),
            "format": "JSON",
            "jurisdiction": "India",
            "clinical_disclaimer": "This portable export contains user-reported and health wellness parameters. Non-diagnostic.",
        },
        "user_profile": profile_data,
        "consent_history": consents_data,
        "symptom_assessments": assessments_data,
        "companion_conversations": companion_data,
        "health_tracking": {
            "connections": connections_data,
            "daily_metrics": metrics_data,
            "adaptive_goals": goals_data,
        },
        "wellness_plans": plans_data,
        "myth_fact_history": myth_data,
    }


def record_consent(
    db: Session,
    user: User,
    consent_type: str,
    policy_version: str = "1.0",
    action: str = "ACCEPTED",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> UserConsent:
    """
    Creates an explicit, versioned record of user consent or revocation.
    """
    from datetime import timezone
    consent = UserConsent(
        user_id=user.id,
        consent_type=consent_type,
        policy_version=policy_version,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=datetime.now(timezone.utc),
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    logger.info("Recorded consent %s (%s, v%s) for user %s", consent_type, action, policy_version, str(user.id))
    return consent


def get_user_consents(db: Session, user: User) -> List[UserConsent]:
    """
    Returns all consent history records for the user.
    """
    return (
        db.query(UserConsent)
        .filter(UserConsent.user_id == user.id)
        .order_by(UserConsent.created_at.desc())
        .all()
    )


def has_active_consent(
    db: Session,
    user: User,
    consent_type: str,
    required_version: Optional[str] = None,
) -> bool:
    """
    Evaluates whether the user holds active, unrevoked consent for a specific processing scope.
    
    Strict versioned semantics:
    1. Evaluates the most recent UserConsent record for (user_id, consent_type).
    2. If no record exists -> False.
    3. If latest record action is not ACCEPTED (e.g., REVOKED) -> False.
    4. If policy_version is older than required_version -> False.
    5. Returns True only if latest record is ACCEPTED and version matches.
    """
    version = required_version or settings.CURRENT_PRIVACY_POLICY_VERSION

    latest_consent = (
        db.query(UserConsent)
        .filter(
            UserConsent.user_id == user.id,
            UserConsent.consent_type == consent_type,
        )
        .order_by(UserConsent.created_at.desc(), UserConsent.id.desc())
        .first()
    )

    if not latest_consent:
        return False

    if latest_consent.action != "ACCEPTED":
        return False

    if latest_consent.policy_version != version:
        return False

    return True


def require_consent_for_operation(
    db: Session,
    user: User,
    consent_types: List[str],
    required_version: Optional[str] = None,
    require_all: bool = True,
) -> None:
    """
    Server-side enforcement guard for privacy-sensitive and AI processing endpoints.
    Raises HTTP 403 Forbidden if user lacks active, unrevoked consent for the specified scopes.
    By default, requires all specified scopes (require_all=True) to prevent a generic
    privacy notice from substituting for an explicit processing scope.
    """
    version = required_version or settings.CURRENT_PRIVACY_POLICY_VERSION
    missing = [
        c_type for c_type in consent_types
        if not has_active_consent(db, user, c_type, version)
    ]

    if require_all and missing:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "CONSENT_REQUIRED",
                "message": f"Active consent for {missing} (version {version}) is required to perform this processing.",
                "missing_consent_types": missing,
                "required_policy_version": version,
            },
        )
    elif not require_all and len(missing) == len(consent_types):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "CONSENT_REQUIRED",
                "message": f"Active consent for at least one of {consent_types} (version {version}) is required to perform this processing.",
                "required_consent_types": consent_types,
                "required_policy_version": version,
            },
        )


def reconcile_pending_account_deletions(db: Session, max_records: int = 50) -> Dict[str, Any]:
    """
    Secure recovery mechanism for accounts stuck in PENDING_FIREBASE.
    Can be run as an automated background job or invoked by an administrator.
    Does not expose user data or allow arbitrary deletions.
    """
    records = (
        db.query(AccountDeletionRecord)
        .filter(AccountDeletionRecord.status == "PENDING_FIREBASE")
        .order_by(AccountDeletionRecord.initiated_at.asc())
        .limit(max_records)
        .all()
    )

    reconciled_count = 0
    failed_count = 0
    details = []

    for rec in records:
        rec.retry_count += 1
        fb_success, fb_error = delete_firebase_user(rec.firebase_uid)
        if fb_success:
            rec.status = "COMPLETED"
            rec.completed_at = datetime.utcnow()
            rec.error_message = None
            db.query(User).filter(User.firebase_uid == rec.firebase_uid).delete(synchronize_session=False)
            reconciled_count += 1
            details.append({"id": str(rec.id), "status": "COMPLETED"})
        else:
            rec.error_message = fb_error
            failed_count += 1
            details.append({"id": str(rec.id), "status": "FAILED", "error": fb_error})

    db.commit()
    logger.info("Reconciled pending deletions: %d completed, %d failed", reconciled_count, failed_count)
    return {
        "processed": len(records),
        "reconciled": reconciled_count,
        "failed": failed_count,
        "details": details,
    }
