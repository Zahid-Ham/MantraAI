import hashlib
from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta, time
from typing import List, Optional
from uuid import UUID

from app.schemas.health import NormalizedDailyHealthData


class HealthProvider(ABC):
    """
    Abstract Base Class representing an upstream health data provider.
    Decouples MantraAI's core backend and database from specific smartwatch brands,
    operating systems, or external mobile APIs.
    """

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns unique provider identifier string (e.g. 'mock', 'health_connect')."""
        pass

    @abstractmethod
    def fetch_daily_metrics(
        self, user_id: UUID, start_date: date, end_date: date
    ) -> List[NormalizedDailyHealthData]:
        """
        Fetches and normalizes observational health records for the specified user and date range.
        Must return validated NormalizedDailyHealthData instances.
        """
        pass


class MockHealthProvider(HealthProvider):
    """
    Deterministic Mock Health Provider for development, automated testing, and web demos.
    Produces realistic observational multi-day metrics without requiring physical hardware.
    
    Determinism Guarantee:
    Values are generated via cryptographic hash of (user_id, date), ensuring identical outputs
    on repeated calls for the same user and calendar day, while preserving natural day-to-day variance.
    """

    def get_provider_name(self) -> str:
        return "mock"

    def fetch_daily_metrics(
        self, user_id: UUID, start_date: date, end_date: date
    ) -> List[NormalizedDailyHealthData]:
        if start_date > end_date:
            start_date, end_date = end_date, start_date

        results: List[NormalizedDailyHealthData] = []
        current_d = start_date

        while current_d <= end_date:
            metric = self._generate_day_metric(user_id, current_d)
            results.append(metric)
            current_d += timedelta(days=1)

        return results

    def _generate_day_metric(self, user_id: UUID, metric_date: date) -> NormalizedDailyHealthData:
        # Seed pseudo-random generator deterministically using SHA256 of user_id + date string
        seed_str = f"{str(user_id)}:{metric_date.isoformat()}:mantra_mock_v1"
        seed_hash = hashlib.sha256(seed_str.encode("utf-8")).hexdigest()
        
        # Helper to extract integer in range [min_val, max_val] from hash slices
        def get_val(offset: int, min_val: int, max_val: int) -> int:
            slice_int = int(seed_hash[offset : offset + 4], 16)
            return min_val + (slice_int % (max_val - min_val + 1))

        # Deterministic generation within reasonable non-clinical test ranges:
        steps = get_val(0, 4200, 8800)
        active_mins = get_val(4, 18, 55)
        workout_mins = get_val(8, 0, 40) if steps > 5000 else 0
        sleep_mins = get_val(12, 340, 500)  # ~5.6 to 8.3 hours
        rhr = get_val(16, 62, 82)  # 62 - 82 bpm
        active_cal = round(steps * 0.045 + active_mins * 4.2, 1)

        # Approximate sleep window for the date (e.g., 23:15 to 07:00 next day)
        sleep_start = datetime.combine(metric_date - timedelta(days=1), time(23, 15))
        sleep_end = sleep_start + timedelta(minutes=sleep_mins)

        return NormalizedDailyHealthData(
            source="mock",
            source_device="Mock Android Device",
            date=metric_date,
            steps=steps,
            active_minutes=active_mins,
            workout_minutes=workout_mins,
            sleep_duration_minutes=sleep_mins,
            sleep_start=sleep_start,
            sleep_end=sleep_end,
            resting_heart_rate=rhr,
            active_calories=active_cal,
            distance=round(steps * 0.75, 1),
            water_intake=get_val(20, 1500, 3000),
        )


class HealthConnectProvider(HealthProvider):
    """
    Future Android Health Connect Provider Adapter.
    
    Architecture Note:
    In the upcoming React Native / Expo mobile app release, Health Connect permissions
    will be requested on Android devices. The mobile client will query Health Connect records
    (StepsRecord, TotalCaloriesBurnedRecord, SleepSessionRecord, RestingHeartRateRecord)
    and submit raw payloads to this provider adapter for normalization into NormalizedDailyHealthData.
    """

    def get_provider_name(self) -> str:
        return "health_connect"

    def fetch_daily_metrics(
        self, user_id: UUID, start_date: date, end_date: date
    ) -> List[NormalizedDailyHealthData]:
        # Future implementation will handle incoming Health Connect sync payloads
        raise NotImplementedError(
            "HealthConnectProvider will be activated in the upcoming Android mobile app release."
        )


def get_health_provider(provider_name: str = "mock") -> HealthProvider:
    """Factory helper returning the appropriate HealthProvider instance."""
    normalized_name = (provider_name or "mock").lower()
    if normalized_name == "mock":
        return MockHealthProvider()
    elif normalized_name == "health_connect":
        return HealthConnectProvider()
    else:
        raise ValueError(f"Unknown health provider '{provider_name}'. Supported: 'mock', 'health_connect'.")
