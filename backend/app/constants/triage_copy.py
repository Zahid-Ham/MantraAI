"""Authored clinical copy and red-flag screening definitions for acute triage.

CLINICIAN_REVIEW_REQUIRED = True
================================
All text in this module represents authored clinical safety screening copy.
Under no circumstances should LLMs generate, alter, or offer differential
diagnoses for red-flag acute scrotal symptoms.
"""

from typing import Dict, Any, List

CLINICIAN_REVIEW_REQUIRED: bool = True

TRIAGE_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "sudden_severe_pain",
        "order": 1,
        "text_en": "Sudden, severe testicular or scrotal pain (especially with nausea or vomiting)",
        "tier": "emergency",
        "description": "Rapid onset severe scrotal pain can indicate testicular torsion requiring immediate emergency care."
    },
    {
        "id": "swollen_scrotum_fever",
        "order": 2,
        "text_en": "Painful, swollen, red or hot scrotum accompanied by fever or chills",
        "tier": "urgent",
        "description": "Acute inflammatory presentation requiring prompt same-day medical evaluation."
    },
    {
        "id": "testicular_lump",
        "order": 3,
        "text_en": "A new lump, firmness, or hardness in a testicle",
        "tier": "prompt",
        "description": "Any new testicular mass requires in-person clinical examination and ultrasound this week."
    },
    {
        "id": "blood_in_fluid",
        "order": 4,
        "text_en": "Visible blood in semen (hematospermia) or blood in urine (hematuria)",
        "tier": "prompt",
        "description": "Requires in-person medical evaluation and urinalysis this week."
    },
    {
        "id": "severe_pain_injury",
        "order": 5,
        "text_en": "Rapid swelling or severe pain following physical trauma or injury to the groin",
        "tier": "urgent",
        "description": "Traumatic scrotal injury requiring prompt same-day physical assessment."
    },
    {
        "id": "chronic_pain_weeks",
        "order": 6,
        "text_en": "Testicular, pelvic, or groin pain persisting for more than 2 to 3 weeks",
        "tier": "prompt",
        "description": "Persistent pain warrants formal clinical workup with a clinician this week."
    },
    {
        "id": "self_harm_thoughts",
        "order": 7,
        "text_en": "Thoughts of hurting yourself or that you would be better off dead",
        "tier": "crisis",
        "description": "Acute emotional distress or suicidal ideation requiring crisis intervention."
    },
]

TRIAGE_TIER_MESSAGES: Dict[str, Dict[str, Any]] = {
    "emergency": {
        "title": "Immediate Emergency Medical Care Required",
        "message": (
            "You reported sudden, severe testicular pain. This can indicate an acute surgical "
            "emergency such as testicular torsion where immediate evaluation within hours is vital. "
            "Please go to the nearest emergency department now or call 112 immediately. "
            "This is a safety screening check and not a clinical diagnosis. We do not provide differential diagnoses."
        ),
        "helpline": "Emergency Services: 112",
        "timeframe": "Immediately / Today",
        "can_continue": True,
    },
    "urgent": {
        "title": "Prompt Same-Day Medical Evaluation Recommended",
        "message": (
            "You reported acute scrotal swelling, fever, or traumatic injury. These symptoms require "
            "prompt in-person clinical assessment today by a doctor or at an urgent care facility. "
            "This screening is non-diagnostic and does not replace medical consultation."
        ),
        "helpline": "Emergency Services: 112 if symptoms rapidly worsen",
        "timeframe": "Today",
        "can_continue": True,
    },
    "prompt": {
        "title": "Clinical Examination Recommended This Week",
        "message": (
            "You reported symptoms such as a new testicular lump, blood in fluid, or persistent pain. "
            "These symptoms warrant in-person clinical examination (such as scrotal ultrasound or physical exam) "
            "with a urologist or general practitioner this week. This is an informational safety screen, not a diagnosis."
        ),
        "helpline": None,
        "timeframe": "This week",
        "can_continue": True,
    },
    "crisis": {
        "title": "Immediate Crisis Support Available",
        "message": (
            "You reported thoughts of self-harm. You are not alone, and immediate, free, confidential support "
            "is available right now. Please reach out to verified national mental health helplines."
        ),
        "helpline": "Tele-MANAS: 14416 / 1800-891-4416 | KIRAN: 1800-599-0019 | Emergency: 112",
        "timeframe": "Immediately",
        "can_continue": True,
    },
    "routine": {
        "title": "No Acute Red Flags Identified",
        "message": "No emergency or acute red-flag symptoms were reported. You may proceed with the full health and wellness assessment.",
        "helpline": None,
        "timeframe": "Routine",
        "can_continue": True,
    },
}
