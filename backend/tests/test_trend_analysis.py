import datetime as dt
import pytest
from app.services.trend_analysis import (
    calculate_theil_sen_slope,
    mann_kendall_test,
    classify_health_trend,
    calculate_sleep_midpoint_minutes,
    calculate_bedtime_variability_minutes,
)


def test_theil_sen_monotonic_series():
    # Perfectly linear: y = 2x + 1
    values = [1.0, 3.0, 5.0, 7.0, 9.0]
    slope = calculate_theil_sen_slope(values)
    assert slope == 2.0


def test_theil_sen_robust_to_outlier():
    # Linear with one extreme outlier
    values = [10.0, 20.0, 30.0, 999.0, 50.0]
    slope = calculate_theil_sen_slope(values)
    assert slope == 10.0  # Median slope ignores single outlier


def test_theil_sen_flat_series():
    values = [50.0, 50.0, 50.0, 50.0]
    slope = calculate_theil_sen_slope(values)
    assert slope == 0.0


def test_mann_kendall_positive_trend():
    values = [100.0, 110.0, 120.0, 135.0, 150.0, 160.0]
    res = mann_kendall_test(values)
    assert res["s"] > 0
    assert res["z"] > 1.28
    assert res["trend"] == "increasing"


def test_mann_kendall_negative_trend():
    values = [200.0, 180.0, 160.0, 140.0, 120.0, 100.0]
    res = mann_kendall_test(values)
    assert res["s"] < 0
    assert res["z"] < -1.28
    assert res["trend"] == "decreasing"


def test_mann_kendall_no_trend_flat():
    values = [100.0, 100.0, 100.0, 100.0, 100.0]
    res = mann_kendall_test(values)
    assert res["s"] == 0
    assert res["trend"] == "no_trend"


def test_mann_kendall_tied_values():
    values = [10.0, 20.0, 20.0, 30.0, 30.0, 40.0]
    res = mann_kendall_test(values)
    assert res["s"] > 0
    assert res["trend"] == "increasing"


def test_classify_health_trend_insufficient_data():
    res = classify_health_trend([100.0, 120.0])
    assert res["direction"] == "insufficient_data"


def test_classify_health_trend_higher_is_better():
    improving_vals = [5000.0, 6000.0, 7000.0, 8000.0, 9000.0]
    res = classify_health_trend(improving_vals, higher_is_better=True)
    assert res["direction"] == "improving"

    declining_vals = [9000.0, 8000.0, 7000.0, 6000.0, 5000.0]
    res2 = classify_health_trend(declining_vals, higher_is_better=True)
    assert res2["direction"] == "declining"


def test_classify_health_trend_lower_is_better():
    # E.g. resting heart rate: dropping from 80 to 65 is improving
    improving_rhr = [80.0, 76.0, 72.0, 68.0, 65.0]
    res = classify_health_trend(improving_rhr, higher_is_better=False)
    assert res["direction"] == "improving"

    # Rising RHR is declining
    declining_rhr = [65.0, 68.0, 72.0, 76.0, 80.0]
    res2 = classify_health_trend(declining_rhr, higher_is_better=False)
    assert res2["direction"] == "declining"


def test_sleep_midpoint_calculation():
    # 23:00 to 07:00 (midpoint is 03:00 AM -> +180 min past midnight)
    start = dt.datetime(2026, 10, 1, 23, 0)
    end = dt.datetime(2026, 10, 2, 7, 0)
    midpoint = calculate_sleep_midpoint_minutes(start, end)
    assert midpoint == 180.0  # 3 hours past midnight

    # 22:30 to 06:30 (midpoint is 02:30 AM -> +150 min past midnight)
    start2 = dt.datetime(2026, 10, 1, 22, 30)
    end2 = dt.datetime(2026, 10, 2, 6, 30)
    midpoint2 = calculate_sleep_midpoint_minutes(start2, end2)
    assert midpoint2 == 150.0


def test_sleep_midpoint_pre_midnight():
    # Short nap from 21:00 to 23:00 (midpoint 22:00 -> -120 min relative to midnight)
    start = dt.datetime(2026, 10, 1, 21, 0)
    end = dt.datetime(2026, 10, 1, 23, 0)
    midpoint = calculate_sleep_midpoint_minutes(start, end)
    assert midpoint == -120.0


def test_bedtime_variability_identical_midpoints():
    midpoints = [180.0, 180.0, 180.0, 180.0]
    var = calculate_bedtime_variability_minutes(midpoints)
    assert var == 0.0


def test_bedtime_variability_different_midpoints():
    midpoints = [150.0, 180.0, 210.0]
    var = calculate_bedtime_variability_minutes(midpoints)
    assert var == 30.0  # std dev of [150, 180, 210] is 30.0
