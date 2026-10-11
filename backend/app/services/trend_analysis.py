import datetime as dt
import math
import statistics
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple


def calculate_theil_sen_slope(
    values: List[float],
    x_coords: Optional[List[float]] = None,
) -> float:
    """
    Computes the Theil-Sen estimator (median of pairwise slopes).
    Robust non-parametric linear slope resistant to outliers (breakdown point ~29%).
    """
    n = len(values)
    if n < 2:
        return 0.0

    if x_coords is None:
        x_coords = [float(i) for i in range(n)]

    slopes: List[float] = []
    for i in range(n - 1):
        for j in range(i + 1, n):
            dx = x_coords[j] - x_coords[i]
            if dx != 0:
                dy = values[j] - values[i]
                slopes.append(dy / dx)

    if not slopes:
        return 0.0

    return statistics.median(slopes)


def mann_kendall_test(values: List[float]) -> Dict[str, Any]:
    """
    Performs the Mann-Kendall non-parametric trend test in pure Python.
    Evaluates monotonic upward or downward trend without normality assumptions.
    Includes tie correction for tied observations.
    """
    n = len(values)
    if n < 3:
        return {
            "s": 0,
            "var_s": 0.0,
            "z": 0.0,
            "trend": "no_trend",
        }

    # 1. Compute Mann-Kendall S statistic
    s = 0
    for i in range(n - 1):
        for j in range(i + 1, n):
            diff = values[j] - values[i]
            if diff > 0:
                s += 1
            elif diff < 0:
                s -= 1

    # 2. Compute variance with tie correction
    counts = Counter(values)
    tie_term = sum(t * (t - 1) * (2 * t + 5) for t in counts.values() if t > 1)
    var_s = (n * (n - 1) * (2 * n + 5) - tie_term) / 18.0

    # 3. Compute standardized test statistic Z
    if var_s > 0:
        if s > 0:
            z = (s - 1) / math.sqrt(var_s)
        elif s < 0:
            z = (s + 1) / math.sqrt(var_s)
        else:
            z = 0.0
    else:
        z = 0.0

    if z > 1.28:  # ~80-90% confidence directionality for small n
        trend = "increasing"
    elif z < -1.28:
        trend = "decreasing"
    else:
        trend = "no_trend"

    return {
        "s": s,
        "var_s": round(var_s, 4),
        "z": round(z, 4),
        "trend": trend,
    }


def classify_health_trend(
    values: List[float],
    higher_is_better: bool = True,
) -> Dict[str, Any]:
    """
    Combines Theil-Sen slope and Mann-Kendall test to classify trend into:
    - 'insufficient_data' (< 3 points)
    - 'improving'
    - 'maintaining'
    - 'declining'
    """
    n = len(values)
    if n < 3:
        return {
            "direction": "insufficient_data",
            "theil_sen_slope": 0.0,
            "mann_kendall": mann_kendall_test(values),
            "pct_diff": 0.0,
            "avg_prev": None,
            "avg_rec": None,
        }

    slope = calculate_theil_sen_slope(values)
    mk = mann_kendall_test(values)

    # Baseline averages for backward-compatible display
    mid_idx = n // 2
    prev_slice = values[:mid_idx] if mid_idx > 0 else values[:1]
    recent_slice = values[mid_idx:]

    avg_prev = statistics.mean(prev_slice)
    avg_rec = statistics.mean(recent_slice)
    pct_diff = round(((avg_rec - avg_prev) / avg_prev) * 100, 1) if avg_prev > 0 else 0.0

    # Estimate normalized slope as percent of mean per day
    mean_val = statistics.mean(values)
    rel_daily_slope_pct = (slope / mean_val * 100.0) if mean_val > 0 else 0.0

    # A trend is maintaining if both Mann-Kendall is no_trend and total change is minor (< 5%)
    if abs(pct_diff) < 5.0 and mk["trend"] == "no_trend":
        direction = "maintaining"
    elif mk["trend"] == "increasing" or (slope > 0 and pct_diff >= 5.0):
        direction = "improving" if higher_is_better else "declining"
    elif mk["trend"] == "decreasing" or (slope < 0 and pct_diff <= -5.0):
        direction = "declining" if higher_is_better else "improving"
    else:
        # Fall back to maintaining if ambiguous or near baseline
        direction = "maintaining"

    return {
        "direction": direction,
        "theil_sen_slope": round(slope, 3),
        "mann_kendall": mk,
        "pct_diff": pct_diff,
        "avg_prev": round(avg_prev, 1),
        "avg_rec": round(avg_rec, 1),
    }


def calculate_sleep_midpoint_minutes(
    sleep_start: dt.datetime,
    sleep_end: dt.datetime,
) -> Optional[float]:
    """
    Calculates sleep midpoint as minutes relative to midnight (-720 to +720 min).
    Correctly accounts for sleep crossing midnight (e.g. 23:30 to 07:30 has midpoint at 03:30, +210 min).
    """
    if sleep_end <= sleep_start:
        return None

    duration = sleep_end - sleep_start
    midpoint_dt = sleep_start + (duration / 2)

    # Time of day in minutes
    tod_minutes = midpoint_dt.hour * 60 + midpoint_dt.minute + (midpoint_dt.second / 60.0)

    # Unroll around midnight: 12:00 PM to 11:59 PM is mapped to negative minutes relative to midnight
    # e.g., 23:00 (1380 min) becomes 1380 - 1440 = -60 min
    if tod_minutes > 720:
        tod_minutes -= 1440

    return tod_minutes


def calculate_bedtime_variability_minutes(
    midpoints: List[float],
) -> Optional[float]:
    """
    Calculates the standard deviation of sleep midpoints in minutes.
    This is an honest simplification of bedtime variability without requiring
    full sleep regularity index (SRI) data.
    """
    if len(midpoints) < 2:
        return None
    return round(statistics.stdev(midpoints), 1)
