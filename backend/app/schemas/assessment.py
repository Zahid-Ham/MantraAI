from pydantic import BaseModel, Field, field_validator
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

    @field_validator("responses")
    @classmethod
    def validate_responses_size(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(v, dict):
            raise ValueError("Responses must be a valid key-value dictionary.")
        if len(v) > 150:
            raise ValueError("Responses dictionary exceeds maximum allowed question count (150).")
        for key, val in v.items():
            if len(str(key)) > 100:
                raise ValueError("Question identifier key exceeds maximum length (100 characters).")
            if isinstance(val, str) and len(val) > 5000:
                raise ValueError(f"Response value for '{key}' exceeds maximum length (5000 characters).")
            elif isinstance(val, (list, dict)) and len(str(val)) > 10000:
                raise ValueError(f"Response value for '{key}' exceeds maximum payload length.")
        return v

class AssessmentCompleteRequest(BaseModel):
    pass

class TriageCheckRequest(BaseModel):
    checklist: Optional[Dict[str, Any]] = None
    checklist_items: Optional[List[str]] = None
    responses: Optional[Dict[str, Any]] = None
    text: Optional[str] = None
    free_text: Optional[str] = None

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


class AccountDeleteRequest(BaseModel):
    confirmation: str
    reason: Optional[str] = None

    @field_validator("confirmation")
    @classmethod
    def validate_confirmation(cls, v: str) -> str:
        if v.strip().upper() != "DELETE":
            raise ValueError("Confirmation token must be exactly 'DELETE'.")
        return "DELETE"


class AccountDeleteResponse(BaseModel):
    status: str
    message: str
    records_deleted: Dict[str, int]
    firebase_account_deleted: bool
    recovery_guidance: Optional[str] = None


class AssessmentDeleteResponse(BaseModel):
    status: str
    assessment_id: UUID
    message: str


class ConsentCreateRequest(BaseModel):
    consent_type: str = "PRIVACY_POLICY"
    policy_version: str = "1.0"
    action: str = "ACCEPTED"

    @field_validator("consent_type")
    @classmethod
    def validate_consent_type(cls, v: str) -> str:
        valid_types = {"PRIVACY_POLICY", "HEALTH_DATA_PROCESSING", "THIRD_PARTY_AI_ANALYSIS"}
        if v not in valid_types:
            raise ValueError(f"Invalid consent_type '{v}'. Must be one of: {sorted(valid_types)}")
        return v

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        valid_actions = {"ACCEPTED", "REVOKED"}
        if v.upper() not in valid_actions:
            raise ValueError(f"Invalid action '{v}'. Must be 'ACCEPTED' or 'REVOKED'.")
        return v.upper()


class ConsentOut(BaseModel):
    id: UUID
    consent_type: str
    policy_version: str
    action: str
    created_at: datetime

    class Config:
        from_attributes = True
