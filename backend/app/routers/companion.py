"""
MantraAI — AI Health Companion REST API Router
===============================================

PURPOSE
-------
Provides authenticated endpoints for conversational men's health intelligence:
1. `POST /api/v1/companion/chat` — Send query, retrieve evidence-grounded answer.
2. `GET /api/v1/companion/conversations` — List user's conversations.
3. `GET /api/v1/companion/conversations/{conversation_id}` — Retrieve conversation detail.
4. `DELETE /api/v1/companion/conversations/{conversation_id}` — Delete a conversation with ownership checks.

SECURITY & PRIVACY
------------------
- Requires verified Firebase Authentication token.
- Strict user isolation prevents cross-tenant access.
- Never returns another user's conversations or messages.
"""

import logging
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.config import settings
from app.security.rate_limiter import check_rate_limit
from app.schemas.companion import (
    ChatRequest,
    ChatResponse,
    ConversationSummary,
    ConversationDetail,
)
from app.services.companion_service import (
    process_chat_message,
    list_user_conversations,
    get_conversation_details,
    delete_user_conversation,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/companion", tags=["AI Health Companion"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Send message to AI Health Companion",
    description="Submits a men's health question, retrieves authoritative evidence, and returns a cautious, evidence-grounded response.",
)
def chat_turn(
    payload: ChatRequest,
    request: Request = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChatResponse:
    if request:
        check_rate_limit(
            request=request,
            key=f"companion:{user.id}",
            max_requests=settings.RATE_LIMIT_AI_PER_MINUTE,
            window_seconds=60,
        )

    # Deterministic Emergency Pre-Screening:
    # Life-critical emergency and crisis escalation must NEVER be blocked by missing or revoked AI consent.
    # If the user is reporting acute red-flag symptoms or crisis ideation, bypass the consent gate so
    # immediate deterministic emergency directives and verified helplines are provided with zero LLM exposure.
    from app.services.companion_service import check_urgent_symptoms
    is_emergency = bool(check_urgent_symptoms(payload.message))

    if not is_emergency and settings.ENFORCE_USER_CONSENT:
        from app.services import user_data_service
        user_data_service.require_consent_for_operation(
            db=db,
            user=user,
            consent_types=["THIRD_PARTY_AI_ANALYSIS"],
        )

    return process_chat_message(request=payload, user=user, db=db)


@router.get(
    "/conversations",
    response_model=List[ConversationSummary],
    status_code=status.HTTP_200_OK,
    summary="List conversations",
    description="Returns list of conversation summaries belonging strictly to the authenticated user.",
)
def list_conversations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> List[ConversationSummary]:
    return list_user_conversations(user_id=user.id, db=db)


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetail,
    status_code=status.HTTP_200_OK,
    summary="Get conversation detail",
    description="Returns full conversation history with sources and evidence metadata for a user-owned conversation.",
)
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ConversationDetail:
    return get_conversation_details(conversation_id=conversation_id, user_id=user.id, db=db)


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete conversation",
    description="Deletes a conversation and its messages with strict user ownership validation.",
)
def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return delete_user_conversation(conversation_id=conversation_id, user_id=user.id, db=db)
