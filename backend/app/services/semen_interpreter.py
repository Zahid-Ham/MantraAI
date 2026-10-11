"""Deterministic Semen Analysis Interpreter based on WHO 6th Edition (2021).

Rules & Invariants:
- Evaluates parameters strictly against WHO 6th edition lower reference limits.
- Reports each parameter as 'below WHO lower reference limit' or 'at or above it'.
- NEVER outputs diagnostic verdicts or pathological labels (e.g., oligozoospermia, asthenozoospermia).
- Generates authored clinical caveats (single test non-diagnostic, abstinence window, retest timeframe).
- Calculates retest_due_date = collection_date + 90 days.
"""

from typing import Dict, Any, List, Optional
from datetime import date, timedelta
from pydantic import BaseModel, Field

from app.constants.who_semen_reference import (
    WHO_LOWER_REFERENCE_LIMITS,
    AUTHORED_CAVEATS,
    WHO_6TH_EDITION_CITATION,
    CLINICIAN_REVIEW_REQUIRED,
)


class ParameterInterpretation(BaseModel):
    parameter: str
    label: str
    value: Optional[float] = None
    unit: str
    who_lower_limit: float
    status: str = Field(..., description="'below_who_limit' | 'at_or_above_who_limit' | 'not_reported'")
    interpretation_text: str


class SemenAnalysisEvaluation(BaseModel):
    collection_date: date
    retest_due_date: date
    abstinence_days: Optional[int] = None
    parameters: List[ParameterInterpretation]
    below_limit_count: int
    at_or_above_limit_count: int
    not_reported_count: int
    caveats: List[str]
    citation: str


def interpret_semen_report(report_data: Dict[str, Any]) -> SemenAnalysisEvaluation:
    """
    Evaluates entered semen parameters against WHO 6th edition reference limits.
    Returns structured parameter assessments and clinical guidance.
    """
    coll_date = report_data.get("collection_date")
    if isinstance(coll_date, str):
        coll_date = date.fromisoformat(coll_date)
    elif not coll_date:
        coll_date = date.today()

    retest_due = coll_date + timedelta(days=90)
    abstinence = report_data.get("abstinence_days")

    parameters_eval: List[ParameterInterpretation] = []
    below_count = 0
    above_count = 0
    unreported_count = 0

    for param_key, meta in WHO_LOWER_REFERENCE_LIMITS.items():
        val = report_data.get(param_key)
        limit = meta["limit"]
        unit = meta["unit"]
        label = meta["label"]

        if val is None:
            unreported_count += 1
            parameters_eval.append(ParameterInterpretation(
                parameter=param_key,
                label=label,
                value=None,
                unit=unit,
                who_lower_limit=limit,
                status="not_reported",
                interpretation_text=f"Not reported. (WHO lower reference limit: {limit} {unit})",
            ))
            continue

        float_val = float(val)
        if float_val < limit:
            below_count += 1
            status_str = "below_who_limit"
            interp = f"Below the WHO lower reference limit of {limit} {unit}."
        else:
            above_count += 1
            status_str = "at_or_above_who_limit"
            interp = f"At or above the WHO lower reference limit of {limit} {unit}."

        parameters_eval.append(ParameterInterpretation(
            parameter=param_key,
            label=label,
            value=float_val,
            unit=unit,
            who_lower_limit=limit,
            status=status_str,
            interpretation_text=interp,
        ))

    # Assemble authored caveats
    caveats = [AUTHORED_CAVEATS["single_result"]]

    if abstinence is not None and (abstinence < 2 or abstinence > 7):
        caveats.append(AUTHORED_CAVEATS["abstinence_suboptimal"])

    caveats.append(AUTHORED_CAVEATS["collection_caveat"])
    caveats.append(AUTHORED_CAVEATS["clinical_discussion"])
    caveats.append(AUTHORED_CAVEATS["retest_window"])

    return SemenAnalysisEvaluation(
        collection_date=coll_date,
        retest_due_date=retest_due,
        abstinence_days=abstinence,
        parameters=parameters_eval,
        below_limit_count=below_count,
        at_or_above_limit_count=above_count,
        not_reported_count=unreported_count,
        caveats=caveats,
        citation=WHO_6TH_EDITION_CITATION,
    )
