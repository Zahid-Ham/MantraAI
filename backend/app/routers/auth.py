from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.auth.firebase_auth import get_current_user, require_admin_user
from app.database import get_db
from app.models.user import User
from app.schemas.assessment import (
    UserOut,
    AccountDeleteRequest,
    AccountDeleteResponse,
    ConsentCreateRequest,
    ConsentOut,
)
from app.config import settings
from app.services import user_data_service

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/profile", response_model=UserOut)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Returns authenticated user derived directly from verified Firebase token."""
    return current_user


@router.delete("/account", response_model=AccountDeleteResponse)
def delete_account(
    payload: AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently deletes the requesting user's account and entire health data graph.
    Requires explicit confirmation payload ('DELETE'), verified identity, and recent authentication.
    """
    result = user_data_service.execute_complete_user_deletion(
        db=db,
        user=current_user,
        require_recent_auth=True,
        max_auth_age_seconds=settings.MAX_AUTH_AGE_SECONDS_FOR_DELETION,
    )
    return result


@router.post("/account/delete", response_model=AccountDeleteResponse)
def delete_account_post(
    payload: AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alias for DELETE /account to accommodate client environments that
    restrict HTTP DELETE requests containing a JSON body.
    """
    return delete_account(payload, db, current_user)


@router.post("/account/reconcile")
def reconcile_pending_deletions(
    db: Session = Depends(get_db),
    admin_user: Optional[User] = Depends(require_admin_user),
):
    """
    Administrative recovery mechanism to retry and reconcile pending PENDING_FIREBASE
    account deletions without exposing user existence or permitting arbitrary deletion requests.
    Requires verified admin credentials.
    """
    return user_data_service.reconcile_pending_account_deletions(db=db)


@router.get("/export")
def export_user_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a secure, machine-readable JSON export of all personal data,
    assessment history, companion chats, health metrics, and wellness plans
    belonging exclusively to the requesting user.
    """
    data = user_data_service.export_user_data(db, current_user)
    filename = f"mantra_health_data_export_{str(current_user.id)[:8]}.json"
    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            "Pragma": "no-cache",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/consent", response_model=List[ConsentOut])
def get_consents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all versioned consent actions recorded for the authenticated user."""
    return user_data_service.get_user_consents(db, current_user)


@router.post("/consent", response_model=ConsentOut)
def record_consent(
    payload: ConsentCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Records an explicit user consent or revocation for a specific policy version and purpose.
    Captures timestamp, scope, and verification metadata.
    """
    ip_addr = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return user_data_service.record_consent(
        db=db,
        user=current_user,
        consent_type=payload.consent_type,
        policy_version=payload.policy_version,
        action=payload.action,
        ip_address=ip_addr,
        user_agent=user_agent,
    )
