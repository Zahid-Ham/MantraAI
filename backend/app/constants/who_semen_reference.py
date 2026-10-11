"""WHO 6th Edition (2021) Semen Analysis Lower Reference Limits.

CLINICIAN_REVIEW_REQUIRED = True
================================
CITATION:
World Health Organization. (2021).
WHO laboratory manual for the examination and processing of human semen, 6th ed.
Geneva: World Health Organization.
ISBN: 978-92-4-003078-7.

All limits represent the 5th centile (lower reference limit) of fertile reference populations.
Values below these thresholds are screening flags, NOT standalone diagnostic conclusions.
"""

from typing import Dict, Any

CLINICIAN_REVIEW_REQUIRED: bool = True

WHO_6TH_EDITION_CITATION = (
    "World Health Organization. (2021). WHO laboratory manual for the examination and processing "
    "of human semen (6th ed.). Geneva: World Health Organization."
)

# 5th centile lower reference limits (WHO 2021 6th Edition)
WHO_LOWER_REFERENCE_LIMITS: Dict[str, Dict[str, Any]] = {
    "volume_ml": {
        "limit": 1.4,
        "operator": ">=",
        "unit": "mL",
        "label": "Semen Volume",
        "description": "Lower reference limit: 1.4 mL",
    },
    "concentration_m_per_ml": {
        "limit": 16.0,
        "operator": ">=",
        "unit": "million/mL",
        "label": "Sperm Concentration",
        "description": "Lower reference limit: 16 × 10⁶ spermatozoa/mL",
    },
    "total_count_m": {
        "limit": 39.0,
        "operator": ">=",
        "unit": "million/ejaculate",
        "label": "Total Sperm Number",
        "description": "Lower reference limit: 39 × 10⁶ spermatozoa per ejaculate",
    },
    "total_motility_pct": {
        "limit": 42.0,
        "operator": ">=",
        "unit": "%",
        "label": "Total Motility (PR + NP)",
        "description": "Lower reference limit: 42% progressively or non-progressively motile",
    },
    "progressive_motility_pct": {
        "limit": 30.0,
        "operator": ">=",
        "unit": "%",
        "label": "Progressive Motility (PR)",
        "description": "Lower reference limit: 30% progressively motile",
    },
    "vitality_pct": {
        "limit": 54.0,
        "operator": ">=",
        "unit": "%",
        "label": "Vitality (Live Sperm)",
        "description": "Lower reference limit: 54% membrane-intact / live spermatozoa",
    },
    "normal_morphology_pct": {
        "limit": 4.0,
        "operator": ">=",
        "unit": "%",
        "label": "Normal Forms (Strict Tygerberg)",
        "description": "Lower reference limit: 4% strictly normal forms",
    },
    "ph": {
        "limit": 7.2,
        "operator": ">=",
        "unit": "pH units",
        "label": "Semen pH",
        "description": "Lower reference limit: pH ≥ 7.2",
    },
}

AUTHORED_CAVEATS: Dict[str, str] = {
    "single_result": (
        "A single semen analysis is never diagnostic of fertility status. Semen parameters "
        "naturally fluctuate considerably across weeks and seasons in healthy men. At least "
        "two to three independent samples collected weeks apart are clinically required before conclusions."
    ),
    "abstinence_suboptimal": (
        "Reported sexual abstinence was outside the standard WHO recommendation (2 to 7 days). "
        "Shorter abstinence can falsely depress volume and concentration; longer abstinence can reduce motility and viability."
    ),
    "collection_caveat": (
        "Sample collection completeness (first fraction contains highest concentration) and laboratory processing delay "
        "(transport within 60 minutes maintained at 20–37°C) heavily influence measured parameters."
    ),
    "clinical_discussion": (
        "These parameters should be reviewed with a qualified urologist, andrologist, or reproductive endocrinologist "
        "alongside full physical examination and hormonal evaluation."
    ),
    "retest_window": (
        "Because spermatogenesis spans approximately 72–90 days, a confirmatory or follow-up semen analysis "
        "is typically scheduled approximately 3 months after lifestyle adjustments."
    ),
}
