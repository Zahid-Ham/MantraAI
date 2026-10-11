import statistics
from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.firebase_auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.health import HealthConnection, HealthDailyMetrics
from app.schemas.health import (
    HealthConnectionOut,
    HealthDailyMetricsOut,
    HealthSyncRequest,
    HealthSyncResponse,
    HealthTrendsOut,
    HealthTrendMetric,
    HealthTrendDataPoint,
)
from app.services.health_sync_service import HealthSyncService
from app.services.trend_analysis import (
    classify_health_trend,
    calculate_sleep_midpoint_minutes,
    calculate_bedtime_variability_minutes,
)

router = APIRouter(prefix="/api/v1/health", tags=["health"])


@router.get("/connections", response_model=List[HealthConnectionOut])
def get_health_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns authenticated user's health provider connection status."""
    return (
        db.query(HealthConnection)
        .filter(HealthConnection.user_id == current_user.id)
        .order_by(HealthConnection.created_at.desc())
        .all()
    )


@router.post("/connections/mock", response_model=HealthConnectionOut)
def enable_mock_connection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enables or updates the development/test Mock Health Provider connection."""
    conn = (
        db.query(HealthConnection)
        .filter(
            HealthConnection.user_id == current_user.id,
            HealthConnection.provider == "mock",
        )
        .first()
    )

    if not conn:
        conn = HealthConnection(
            user_id=current_user.id,
            provider="mock",
            status="connected",
            display_name="Mock Health Provider",
            last_sync_at=datetime.utcnow(),
        )
        db.add(conn)
    else:
        conn.status = "connected"
        conn.last_sync_at = datetime.utcnow()

    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disconnects and removes a health data connection. Strictly enforces user ownership."""
    conn = (
        db.query(HealthConnection)
        .filter(
            HealthConnection.id == connection_id,
            HealthConnection.user_id == current_user.id,
        )
        .first()
    )

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health connection not found.",
        )

    db.delete(conn)
    db.commit()
    return None


@router.post("/sync", response_model=HealthSyncResponse)
def sync_health_data(
    payload: HealthSyncRequest = HealthSyncRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Synchronizes observational health metrics for the authenticated user."""
    try:
        result = HealthSyncService.sync_user_health_data(
            user=current_user,
            db=db,
            provider_name=payload.provider,
            start_date=payload.start_date,
            end_date=payload.end_date,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Health data synchronization could not be completed.",
        )


@router.get("/daily", response_model=List[HealthDailyMetricsOut])
def get_daily_metrics(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    source: Optional[str] = Query(None, description="Source provider filter"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns chronological daily observational health metrics for the authenticated user."""
    query = db.query(HealthDailyMetrics).filter(HealthDailyMetrics.user_id == current_user.id)

    if start_date:
        query = query.filter(HealthDailyMetrics.date >= start_date)
    if end_date:
        query = query.filter(HealthDailyMetrics.date <= end_date)
    if source:
        query = query.filter(HealthDailyMetrics.source == source)

    return query.order_by(HealthDailyMetrics.date.asc()).all()


@router.get("/daily/latest", response_model=Optional[HealthDailyMetricsOut])
def get_latest_daily_metric(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the most recent daily health metric record for the authenticated user."""
    return (
        db.query(HealthDailyMetrics)
        .filter(HealthDailyMetrics.user_id == current_user.id)
        .order_by(HealthDailyMetrics.date.desc())
        .first()
    )


@router.get("/trends", response_model=HealthTrendsOut)
def get_health_trends(
    days: int = Query(7, ge=3, le=90, description="Number of days to evaluate"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Computes a transparent deterministic summary of observational health trends.
    Uses descriptive classifications (improving, maintaining, declining, insufficient_data).
    Strictly non-clinical and non-diagnostic.
    """
    end_d = date.today()
    start_d = end_d - timedelta(days=days - 1)

    metrics = (
        db.query(HealthDailyMetrics)
        .filter(
            HealthDailyMetrics.user_id == current_user.id,
            HealthDailyMetrics.date >= start_d,
            HealthDailyMetrics.date <= end_d,
        )
        .order_by(HealthDailyMetrics.date.asc())
        .all()
    )

    metric_map = {m.date: m for m in metrics}

    # Helper to evaluate single metric trend
    def evaluate_metric(metric_key: str, higher_is_better: bool = True) -> HealthTrendMetric:
        data_points: List[HealthTrendDataPoint] = []
        valid_values: List[float] = []

        curr = start_d
        while curr <= end_d:
            record = metric_map.get(curr)
            val = getattr(record, metric_key, None) if record else None
            val_float = float(val) if val is not None else None
            data_points.append(HealthTrendDataPoint(date=curr, value=val_float))
            if val_float is not None and val_float > 0:
                valid_values.append(val_float)
            curr += timedelta(days=1)

        if len(valid_values) < 3:
            return HealthTrendMetric(
                metric=metric_key,
                direction="insufficient_data",
                average_recent=None,
                average_previous=None,
                change_pct=None,
                data=data_points,
                description="Insufficient data recorded to calculate a trend.",
            )

        trend_res = classify_health_trend(valid_values, higher_is_better=higher_is_better)
        direction = trend_res["direction"]
        avg_rec = trend_res["avg_rec"]
        avg_prev = trend_res["avg_prev"]
        pct_diff = trend_res["pct_diff"]

        if direction == "maintaining":
            desc = "Activity levels are consistent with your baseline pattern."
        elif direction == "improving":
            desc = f"Showing an improving trend with a {abs(pct_diff)}% progression."
        else:
            desc = f"Observed a {abs(pct_diff)}% variation compared to earlier in the period."

        return HealthTrendMetric(
            metric=metric_key,
            direction=direction,
            average_recent=avg_rec,
            average_previous=avg_prev,
            change_pct=pct_diff,
            data=data_points,
            description=desc,
        )

    # Bedtime variability metric (standard deviation of sleep midpoint)
    def evaluate_bedtime_variability() -> HealthTrendMetric:
        data_points: List[HealthTrendDataPoint] = []
        valid_midpoints: List[float] = []

        curr = start_d
        while curr <= end_d:
            record = metric_map.get(curr)
            midpoint = None
            if record and record.sleep_start and record.sleep_end:
                midpoint = calculate_sleep_midpoint_minutes(record.sleep_start, record.sleep_end)
            data_points.append(HealthTrendDataPoint(date=curr, value=round(midpoint, 1) if midpoint is not None else None))
            if midpoint is not None:
                valid_midpoints.append(midpoint)
            curr += timedelta(days=1)

        if len(valid_midpoints) < 3:
            return HealthTrendMetric(
                metric="bedtime_variability",
                direction="insufficient_data",
                average_recent=None,
                average_previous=None,
                change_pct=None,
                data=data_points,
                description="Insufficient sleep timing records to evaluate bedtime variability.",
            )

        stdev_total = calculate_bedtime_variability_minutes(valid_midpoints)
        mid_mean = statistics.mean(valid_midpoints)
        # Higher variability represents more erratic sleep schedule (lower is better)
        deviations = [abs(m - mid_mean) for m in valid_midpoints]
        var_trend = classify_health_trend(deviations, higher_is_better=False)

        mid_idx = len(valid_midpoints) // 2
        prev_slice = valid_midpoints[:mid_idx] if mid_idx >= 2 else valid_midpoints
        rec_slice = valid_midpoints[mid_idx:] if len(valid_midpoints[mid_idx:]) >= 2 else valid_midpoints
        prev_stdev = calculate_bedtime_variability_minutes(prev_slice) if len(prev_slice) >= 2 else stdev_total
        rec_stdev = calculate_bedtime_variability_minutes(rec_slice) if len(rec_slice) >= 2 else stdev_total

        pct_change = round(((rec_stdev - prev_stdev) / prev_stdev) * 100, 1) if prev_stdev and prev_stdev > 0 else 0.0

        if var_trend["direction"] == "improving":
            desc = f"Bedtime regularity is improving (variability reduced to {rec_stdev} min)."
        elif var_trend["direction"] == "declining":
            desc = f"Bedtime schedule showed variability of {stdev_total} min across nights."
        else:
            desc = f"Bedtime variability is steady at ~{stdev_total} min."

        return HealthTrendMetric(
            metric="bedtime_variability",
            direction=var_trend["direction"],
            average_recent=rec_stdev,
            average_previous=prev_stdev,
            change_pct=pct_change,
            data=data_points,
            description=desc,
        )

    trends = [
        evaluate_metric("steps", higher_is_better=True),
        evaluate_metric("active_minutes", higher_is_better=True),
        evaluate_metric("sleep_duration_minutes", higher_is_better=True),
        evaluate_metric("resting_heart_rate", higher_is_better=False),  # lower/stable RHR is generally preferred
        evaluate_bedtime_variability(),
    ]

    return HealthTrendsOut(
        trends=trends,
        total_days_available=len(metrics),
    )
