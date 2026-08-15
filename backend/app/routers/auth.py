from fastapi import APIRouter, Depends
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.schemas.assessment import UserOut

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.get("/profile", response_model=UserOut)
def get_user_profile(current_user: User = Depends(get_current_user)):
    # Returns authenticated user derived directly from the Firebase ID token
    return current_user
