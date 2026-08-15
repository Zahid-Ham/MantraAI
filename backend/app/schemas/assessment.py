from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime

class AssessmentSessionCreate(BaseModel):
    assessment_version: Optional[str] = "1.0"

class AssessmentSessionOut(BaseModel):
    id: UUID
    user_id: UUID
    assessment_version: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AssessmentResponseSave(BaseModel):
    responses: Dict[str, Any]  # Dictionary of question_id: response_value

class AssessmentCompleteRequest(BaseModel):
    pass

class AssessmentResultOut(BaseModel):
    id: UUID
    assessment_session_id: UUID
    overall_category: str
    risk_scores: Dict[str, Any]
    interpretation: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReportOut(BaseModel):
    id: UUID
    assessment_session_id: UUID
    report_version: str
    model_provider: str
    model_name: str
    report_content: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: UUID
    firebase_uid: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    created_at: datetime
    last_login_at: datetime

    class Config:
        from_attributes = True
