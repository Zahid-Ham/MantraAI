from datetime import datetime
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User

firebase_initialized = False

try:
    if not firebase_admin._apps:
        if settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
            # Format clean multiline private key from string representation
            private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
            cred_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print("Firebase Admin SDK successfully initialized using service account credentials.")
        else:
            firebase_admin.initialize_app()
            firebase_initialized = True
            print("Firebase Admin SDK initialized using default application credentials.")
except Exception as e:
    print(f"WARNING: Firebase Admin SDK could not be initialized: {str(e)}")
    print("Endpoints requiring active Token Verification will return service errors.")

security = HTTPBearer(auto_error=True)
optional_security = HTTPBearer(auto_error=False)

def get_optional_current_user(
    db: Session = Depends(get_db),
    cred: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)
) -> Optional[User]:
    if not firebase_initialized or not cred or not cred.credentials:
        return None
    try:
        decoded_token = auth.verify_id_token(cred.credentials)
        firebase_uid = decoded_token.get("uid")
        if not firebase_uid:
            return None
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        return user
    except Exception:
        return None

def require_admin_user(
    db: Session = Depends(get_db),
    cred: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
) -> Optional[User]:
    """
    Enforces administrator authorization for privileged operations (e.g. corpus import).
    Accepts:
    1. A valid X-Admin-Key header matching settings.ADMIN_API_KEY, OR
    2. A verified Firebase ID token from a user with admin role/claim or registered in settings.ADMIN_EMAILS.
    """
    # 1. Check Admin API Key
    if settings.ADMIN_API_KEY and x_admin_key and x_admin_key.strip() == settings.ADMIN_API_KEY.strip():
        return None  # Authorized via service key

    # 2. Check Bearer Token
    if not cred or not cred.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required to perform this action."
        )

    if not firebase_initialized:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured on the backend."
        )

    try:
        decoded_token = auth.verify_id_token(cred.credentials)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}"
        )

    firebase_uid = decoded_token.get("uid")
    email = (decoded_token.get("email") or "").strip().lower()
    is_admin_claim = bool(decoded_token.get("admin") is True or decoded_token.get("role") == "admin")

    admin_emails = {e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()}
    is_admin_email = email in admin_emails if admin_emails else False

    if not (is_admin_claim or is_admin_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required."
        )

    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    return user

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    cred: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    if not firebase_initialized:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured on the backend."
        )

    token = cred.credentials
    try:
        # Decode and verify the JWT token via Firebase
        decoded_token = auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}"
        )

    firebase_uid = decoded_token.get("uid")
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification succeeded but payload was missing UID."
        )

    email = decoded_token.get("email")
    display_name = decoded_token.get("name")

    # Check deletion lifecycle state
    from app.models.deletion import AccountDeletionRecord
    deletion_rec = (
        db.query(AccountDeletionRecord)
        .filter(AccountDeletionRecord.firebase_uid == firebase_uid)
        .order_by(AccountDeletionRecord.initiated_at.desc())
        .first()
    )

    if deletion_rec:
        if deletion_rec.status == "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account has been permanently deleted.",
            )
        elif deletion_rec.status == "PENDING_FIREBASE":
            # Database records are wiped; Firebase deletion is pending retry.
            # Allow deletion retry requests to proceed, but block normal operations.
            req_path = request.url.path if request else ""
            is_deletion_route = any(p in req_path for p in ["/auth/account", "/account/delete"])
            if request and not is_deletion_route:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Account is in pending deletion. Please retry account deletion to finalize removal.",
                )

            # Return transient user object for deletion retry without persisting new DB row
            transient_user = User(
                id=deletion_rec.user_id,
                firebase_uid=firebase_uid,
                email=email,
                display_name=display_name,
            )
            transient_user._is_pending_deletion = True
            setattr(transient_user, "auth_time", decoded_token.get("auth_time"))
            return transient_user

    # Fetch existing database user or upsert new row
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    
    if not user:
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name,
            last_login_at=datetime.utcnow()
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            # Double check in case of concurrent insert
            user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error while persisting authenticated user state."
                )
    else:
        # Update last login timestamp and user details
        user.last_login_at = datetime.utcnow()
        if email and user.email != email:
            user.email = email
        if display_name and user.display_name != display_name:
            user.display_name = display_name
        try:
            db.commit()
        except Exception:
            db.rollback()

    # Attach token auth_time metadata for sensitive operations (e.g., account deletion)
    setattr(user, "auth_time", decoded_token.get("auth_time"))

    return user


def verify_recent_authentication(user: User, max_age_seconds: int = 900) -> None:
    """
    Verifies that the user authenticated recently within max_age_seconds (default 15 minutes).
    Raises HTTP 401 if auth_time is present and exceeds max_age_seconds.
    """
    auth_time = getattr(user, "auth_time", None)
    if auth_time is not None:
        current_ts = int(datetime.utcnow().timestamp())
        if (current_ts - auth_time) > max_age_seconds:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Recent authentication required. Please sign in again before performing irreversible account deletion.",
            )
