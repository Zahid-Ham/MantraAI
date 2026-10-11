"""API Router for Semen Report Management and WHO 6th Edition Interpretation.

Endpoints:
- POST /api/v1/semen-reports: create a new semen analysis report with plausible range validation.
- GET /api/v1/semen-reports: list user's reports with parameter trend history.
- GET /api/v1/semen-reports/{id}: get detailed interpretation of a specific report.
- DELETE /api/v1/semen-reports/{id}: delete a semen report with user isolation.
"""

from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.firebase_auth import get_current_user
from app.models.user import User
from app.models.semen_report import SemenReport
from app.services.semen_interpreter import (
    interpret_semen_report,
    SemenAnalysisEvaluation,
)

router = APIRouter(prefix="/api/v1/semen-reports", tags=["Semen Reports"])


class SemenReportCreateRequest(BaseModel):
    collection_date: date
    abstinence_days: Optional[int] = Field(None, ge=0, le=60, description="Days of ejaculatory abstinence.")
    volume_ml: Optional[float] = Field(None, ge=0.0, le=20.0, description="Ejaculate volume in mL.")
    concentration_m_per_ml: Optional[float] = Field(None, ge=0.0, le=500.0, description="Sperm concentration in million/mL.")
    total_count_m: Optional[float] = Field(None, ge=0.0, le=2000.0, description="Total sperm count in millions.")
    total_motility_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Total motility percentage (0-100%).")
    progressive_motility_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Progressive motility percentage (0-100%).")
    vitality_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Vitality percentage (0-100%).")
    normal_morphology_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Normal morphology percentage (0-100%).")
    ph: Optional[float] = Field(None, ge=5.0, le=10.0, description="Semen pH.")
    lab_name: Optional[str] = Field(None, max_length=255, description="Laboratory or clinic name.")

    @field_validator("lab_name")
    @classmethod
    def sanitize_lab_name(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return v.strip()[:255]
        return v


class SemenReportOut(BaseModel):
    id: str
    collection_date: str
    retest_due_date: Optional[str]
    abstinence_days: Optional[int]
    volume_ml: Optional[float]
    concentration_m_per_ml: Optional[float]
    total_count_m: Optional[float]
    total_motility_pct: Optional[float]
    progressive_motility_pct: Optional[float]
    vitality_pct: Optional[float]
    normal_morphology_pct: Optional[float]
    ph: Optional[float]
    lab_name: Optional[str]
    created_at: str
    evaluation: SemenAnalysisEvaluation


class SemenReportListResponse(BaseModel):
    reports: List[SemenReportOut]
    trend_summary: Dict[str, List[Dict[str, Any]]]


def _to_report_out(report: SemenReport) -> SemenReportOut:
    raw_dict = {
        "collection_date": report.collection_date,
        "abstinence_days": report.abstinence_days,
        "volume_ml": report.volume_ml,
        "concentration_m_per_ml": report.concentration_m_per_ml,
        "total_count_m": report.total_count_m,
        "total_motility_pct": report.total_motility_pct,
        "progressive_motility_pct": report.progressive_motility_pct,
        "vitality_pct": report.vitality_pct,
        "normal_morphology_pct": report.normal_morphology_pct,
        "ph": report.ph,
    }
    evaluation = interpret_semen_report(raw_dict)

    return SemenReportOut(
        id=str(report.id),
        collection_date=report.collection_date.isoformat(),
        retest_due_date=report.retest_due_date.isoformat() if report.retest_due_date else None,
        abstinence_days=report.abstinence_days,
        volume_ml=report.volume_ml,
        concentration_m_per_ml=report.concentration_m_per_ml,
        total_count_m=report.total_count_m,
        total_motility_pct=report.total_motility_pct,
        progressive_motility_pct=report.progressive_motility_pct,
        vitality_pct=report.vitality_pct,
        normal_morphology_pct=report.normal_morphology_pct,
        ph=report.ph,
        lab_name=report.lab_name,
        created_at=report.created_at.isoformat() if report.created_at else "",
        evaluation=evaluation,
    )


# ---------------------------------------------------------------------------
# 1. Create Semen Report
# ---------------------------------------------------------------------------
@router.post("", response_model=SemenReportOut)
def create_semen_report(
    payload: SemenReportCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    retest_date = payload.collection_date + timedelta(days=90)

    # If concentration and volume provided, compute total_count_m if omitted
    total_count = payload.total_count_m
    if total_count is None and payload.volume_ml is not None and payload.concentration_m_per_ml is not None:
        total_count = round(payload.volume_ml * payload.concentration_m_per_ml, 2)

    new_report = SemenReport(
        user_id=current_user.id,
        collection_date=payload.collection_date,
        abstinence_days=payload.abstinence_days,
        volume_ml=payload.volume_ml,
        concentration_m_per_ml=payload.concentration_m_per_ml,
        total_count_m=total_count,
        total_motility_pct=payload.total_motility_pct,
        progressive_motility_pct=payload.progressive_motility_pct,
        vitality_pct=payload.vitality_pct,
        normal_morphology_pct=payload.normal_morphology_pct,
        ph=payload.ph,
        lab_name=payload.lab_name,
        retest_due_date=retest_date,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return _to_report_out(new_report)


# ---------------------------------------------------------------------------
# 2. List Semen Reports with Trends
# ---------------------------------------------------------------------------
@router.get("", response_model=SemenReportListResponse)
def list_semen_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = (
        db.query(SemenReport)
        .filter(SemenReport.user_id == current_user.id)
        .order_by(SemenReport.collection_date.desc())
        .all()
    )

    out_reports = [_to_report_out(r) for r in reports]

    # Chronological order for trends
    chronological = list(reversed(reports))
    trends: Dict[str, List[Dict[str, Any]]] = {
        "volume_ml": [],
        "concentration_m_per_ml": [],
        "total_count_m": [],
        "total_motility_pct": [],
        "progressive_motility_pct": [],
        "normal_morphology_pct": [],
    }

    for r in chronological:
        date_str = r.collection_date.isoformat()
        if r.volume_ml is not None:
            trends["volume_ml"].append({"date": date_str, "value": r.volume_ml})
        if r.concentration_m_per_ml is not None:
            trends["concentration_m_per_ml"].append({"date": date_str, "value": r.concentration_m_per_ml})
        if r.total_count_m is not None:
            trends["total_count_m"].append({"date": date_str, "value": r.total_count_m})
        if r.total_motility_pct is not None:
            trends["total_motility_pct"].append({"date": date_str, "value": r.total_motility_pct})
        if r.progressive_motility_pct is not None:
            trends["progressive_motility_pct"].append({"date": date_str, "value": r.progressive_motility_pct})
        if r.normal_morphology_pct is not None:
            trends["normal_morphology_pct"].append({"date": date_str, "value": r.normal_morphology_pct})

    return SemenReportListResponse(reports=out_reports, trend_summary=trends)


# ---------------------------------------------------------------------------
# 3. Get Semen Report by ID
# ---------------------------------------------------------------------------
@router.get("/{report_id}", response_model=SemenReportOut)
def get_semen_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(SemenReport).filter(SemenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semen report not found")

    if report.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: cannot view another user's semen report")

    return _to_report_out(report)


# ---------------------------------------------------------------------------
# 4. Delete Semen Report
# ---------------------------------------------------------------------------
@router.delete("/{report_id}")
def delete_semen_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(SemenReport).filter(SemenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semen report not found")

    if report.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: cannot delete another user's semen report")

    db.delete(report)
    db.commit()

    return {"status": "deleted", "report_id": str(report_id)}
