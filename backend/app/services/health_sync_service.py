import logging
from datetime import date, datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.health import HealthConnection, HealthDailyMetrics
from app.schemas.health import HealthSyncResponse, NormalizedDailyHealthData
from app.services.health_provider import get_health_provider

logger = logging.getLogger("mantra.health_sync")


class HealthSyncService:
    """
    Idempotent synchronization service for passive health metrics.
    Coordinates between upstream provider adapters, data validation,
    and PostgreSQL persistence without leaking sensitive payloads into logs.
    """

    @classmethod
    def sync_user_health_data(
        cls,
        user: User,
        db: Session,
        provider_name: str = "mock",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        metrics: Optional[list] = None,
    ) -> HealthSyncResponse:
        today = date.today()
        if end_date is None:
            end_date = today
        if start_date is None:
            start_date = end_date - timedelta(days=6)  # Default: last 7 days

        if start_date > end_date:
            start_date, end_date = end_date, start_date

        if metrics is not None and len(metrics) > 0:
            first_item = metrics[0]
            if isinstance(first_item, NormalizedDailyHealthData):
                source_name = first_item.source
            elif isinstance(first_item, dict) and "source" in first_item:
                source_name = first_item["source"]
            else:
                source_name = provider_name
            raw_metrics = metrics
        else:
            provider = get_health_provider(provider_name)
            source_name = provider.get_provider_name()
            raw_metrics = provider.fetch_daily_metrics(user.id, start_date, end_date)

        # 1. Ensure user connection record exists
        connection = (
            db.query(HealthConnection)
            .filter(
                HealthConnection.user_id == user.id,
                HealthConnection.provider == source_name,
            )
            .first()
        )

        if not connection:
            display_title = "Mock Health Provider" if source_name == "mock" else "Android Health Connect"
            connection = HealthConnection(
                user_id=user.id,
                provider=source_name,
                status="connected",
                display_name=display_title,
                last_sync_at=datetime.utcnow(),
            )
            db.add(connection)
            db.flush()
        else:
            connection.status = "connected"
            connection.last_sync_at = datetime.utcnow()

        records_inserted = 0
        records_updated = 0
        records_skipped = 0

        # 3. Idempotent upsert into health_daily_metrics
        for item in raw_metrics:
            # Re-validate schema integrity
            if not isinstance(item, NormalizedDailyHealthData):
                item = NormalizedDailyHealthData.model_validate(item)

            existing = (
                db.query(HealthDailyMetrics)
                .filter(
                    HealthDailyMetrics.user_id == user.id,
                    HealthDailyMetrics.date == item.date,
                    HealthDailyMetrics.source == item.source,
                )
                .first()
            )

            if existing:
                # Check for updates
                has_changes = False
                for field in [
                    "steps",
                    "active_minutes",
                    "workout_minutes",
                    "sleep_duration_minutes",
                    "sleep_start",
                    "sleep_end",
                    "resting_heart_rate",
                    "active_calories",
                    "distance",
                    "water_intake",
                ]:
                    val = getattr(item, field)
                    if val is not None and getattr(existing, field) != val:
                        setattr(existing, field, val)
                        has_changes = True

                if has_changes:
                    existing.source_device = item.source_device or existing.source_device
                    existing.synced_at = datetime.utcnow()
                    records_updated += 1
                else:
                    records_skipped += 1
            else:
                new_record = HealthDailyMetrics(
                    user_id=user.id,
                    connection_id=connection.id,
                    date=item.date,
                    source=item.source,
                    source_device=item.source_device,
                    steps=item.steps,
                    active_minutes=item.active_minutes,
                    workout_minutes=item.workout_minutes,
                    sleep_duration_minutes=item.sleep_duration_minutes,
                    sleep_start=item.sleep_start,
                    sleep_end=item.sleep_end,
                    resting_heart_rate=item.resting_heart_rate,
                    active_calories=item.active_calories,
                    distance=item.distance,
                    water_intake=item.water_intake,
                    sync_status="synced",
                    synced_at=datetime.utcnow(),
                )
                db.add(new_record)
                records_inserted += 1

        db.commit()

        logger.info(
            "Health sync completed for user_id=%s source=%s date_range=[%s to %s] inserted=%d updated=%d skipped=%d",
            str(user.id),
            source_name,
            start_date.isoformat(),
            end_date.isoformat(),
            records_inserted,
            records_updated,
            records_skipped,
        )

        return HealthSyncResponse(
            source=source_name,
            requested_start_date=start_date,
            requested_end_date=end_date,
            records_received=len(raw_metrics),
            records_inserted=records_inserted,
            records_updated=records_updated,
            records_skipped=records_skipped,
            synced_at=datetime.utcnow(),
        )
