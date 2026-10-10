from datetime import datetime
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status, Header
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

    return user
