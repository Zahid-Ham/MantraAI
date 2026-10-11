from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import urllib.request
import json
import os
import time
from dotenv import load_dotenv

# Import App configuration, routers, and database setups
from app.config import settings
from app.routers import (
    auth as auth_router,
    assessment as assessment_router,
    evidence as evidence_router,
    health as health_router,
    goals as goals_router,
    myth_fact as myth_fact_router,
    companion as companion_router,
    wellness_plan as wellness_plan_router,
)

from contextlib import asynccontextmanager
from app.database import engine, Base
import app.models

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Notice: automatic table creation on startup skipped or failed: {str(e)}")
    yield

app = FastAPI(title="MantraAI Backend Clinical API", version="1.0.0", lifespan=lifespan)

# Configure dynamic CORS origins from configurations
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.middleware.request_size import RequestSizeLimitMiddleware

app.add_middleware(
    RequestSizeLimitMiddleware,
    max_bytes=settings.MAX_REQUEST_BODY_BYTES,
)

# Include Authentication, Assessment, Evidence, Health, Goals, Myth vs Fact, AI Companion, and Wellness Plan Routers
app.include_router(auth_router.router)
app.include_router(assessment_router.router)
app.include_router(evidence_router.router)
app.include_router(health_router.router)
app.include_router(goals_router.router)
app.include_router(myth_fact_router.router)
app.include_router(companion_router.router)
app.include_router(wellness_plan_router.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "groq_configured": bool(settings.GROQ_API_KEY)}

@app.api_route("/api/assessment/analyze", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def legacy_analyze_disabled():
    """
    Security Tombstone: Permanently disables unauthenticated legacy AI endpoint.
    All clients must use the authenticated V1 clinical assessment pipeline (/api/v1/assessments).
    """
    raise HTTPException(
        status_code=404,
        detail="The legacy assessment analysis endpoint has been permanently disabled. Please use the authenticated /api/v1/assessments pipeline.",
    )
