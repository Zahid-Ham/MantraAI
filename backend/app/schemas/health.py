from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
import datetime as dt
from uuid import UUID

class NormalizedDailyHealthData(BaseModel):
    """
    Standardized provider-independent health data schema.
    Validates observational health metrics from any upstream provider
    (Mock, Android Health Connect, Mobile) before persistence.
    """
    model_config = ConfigDict(from_attributes=True)

    source: str = Field(..., min_length=1, max_length=50, description="Provider source identifier (e.g., 'mock', 'health_connect')")
    source_device: Optional[str] = Field(None, max_length=100, description="Hardware device or client app name")
    date: dt.date = Field(..., description="Calendar date for observational metrics")
    
    steps: Optional[int] = Field(None, ge=0, le=200000, description="Total daily step count")
    active_minutes: Optional[int] = Field(None, ge=0, le=1440, description="Total active movement minutes")
    workout_minutes: Optional[int] = Field(None, ge=0, le=1440, description="Structured workout minutes")
    sleep_duration_minutes: Optional[int] = Field(None, ge=0, le=1440, description="Total sleep duration in minutes")
    sleep_start: Optional[dt.datetime] = Field(None, description="Sleep start timestamp")
    sleep_end: Optional[dt.datetime] = Field(None, description="Sleep end timestamp")
    resting_heart_rate: Optional[int] = Field(None, ge=30, le=250, description="Resting heart rate in beats per minute")
    active_calories: Optional[float] = Field(None, ge=0, le=20000, description="Active energy burned in kilocalories")
    distance: Optional[float] = Field(None, ge=0, le=500000, description="Total distance in meters")
    water_intake: Optional[float] = Field(None, ge=0, le=50000, description="Water intake in milliliters")

    @field_validator("steps", "active_minutes", "workout_minutes", "sleep_duration_minutes", "resting_heart_rate", "active_calories", mode="before")
    @classmethod
    def check_non_negative(cls, v):
        if v is not None and isinstance(v, (int, float)) and v < 0:
            raise ValueError("Health metrics cannot be negative numbers.")
        return v


class HealthConnectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    provider: str
    status: str
    display_name: Optional[str] = None
    last_sync_at: Optional[dt.datetime] = None
    created_at: dt.datetime
    updated_at: dt.datetime


class HealthDailyMetricsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    date: dt.date
    source: str
    source_device: Optional[str] = None
    steps: Optional[int] = None
    active_minutes: Optional[int] = None
    workout_minutes: Optional[int] = None
    sleep_duration_minutes: Optional[int] = None
    sleep_start: Optional[dt.datetime] = None
    sleep_end: Optional[dt.datetime] = None
    resting_heart_rate: Optional[int] = None
    active_calories: Optional[float] = None
    distance: Optional[float] = None
    water_intake: Optional[float] = None
    synced_at: dt.datetime


class HealthSyncRequest(BaseModel):
    provider: str = Field("mock", description="Provider to synchronize from (e.g. 'mock', 'health_connect')")
    start_date: Optional[dt.date] = Field(None, description="Start date for range sync (defaults to 7 days ago)")
    end_date: Optional[dt.date] = Field(None, description="End date for range sync (defaults to today)")


class HealthSyncResponse(BaseModel):
    source: str
    requested_start_date: Optional[dt.date] = None
    requested_end_date: Optional[dt.date] = None
    records_received: int
    records_inserted: int
    records_updated: int
    records_skipped: int
    synced_at: dt.datetime


class HealthTrendDataPoint(BaseModel):
    date: dt.date
    value: Optional[float] = None


class HealthTrendMetric(BaseModel):
    metric: str
    direction: str  # "improving", "maintaining", "declining", "insufficient_data"
    average_recent: Optional[float] = None
    average_previous: Optional[float] = None
    change_pct: Optional[float] = None
    data: List[HealthTrendDataPoint]
    description: str


class HealthTrendsOut(BaseModel):
    trends: List[HealthTrendMetric]
    total_days_available: int


class AdaptiveGoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    date: dt.date
    goal_type: str
    title: str
    target_value: Optional[float] = None
    unit: Optional[str] = None
    rationale: Optional[str] = None
    source: str
    status: str  # "pending", "in_progress", "completed", "skipped"
    progress_value: Optional[float] = 0.0
    created_at: dt.datetime
    updated_at: dt.datetime


class AdaptiveGoalUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Goal status ('pending', 'in_progress', 'completed', 'skipped')")
    progress_value: Optional[float] = Field(None, ge=0, description="Current progress numeric value")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None:
            allowed = {"pending", "in_progress", "completed", "skipped"}
            if v.lower() not in allowed:
                raise ValueError(f"Invalid status '{v}'. Must be one of {allowed}")
            return v.lower()
        return v
