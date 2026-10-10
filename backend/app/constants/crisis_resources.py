CLINICIAN_REVIEW_REQUIRED = True

"""
National Mental Health Crisis Helplines (India)
Verified against official sources.
"""

CRISIS_RESOURCES = [
    {
        "name": "Tele-MANAS",
        "number": "14416",
        "alt_number": "1800-891-4416",
        "description": "National Tele Mental Health Programme of India",
        "source_url": "https://telemanas.mohfw.gov.in/",
        "last_verified": "2026-10-11"
    },
    {
        "name": "KIRAN",
        "number": "1800-599-0019",
        "alt_number": None,
        "description": "National Helpline for Mental Health Rehabilitation",
        "source_url": "https://pib.gov.in/PressReleasePage.aspx?PRID=1652243",
        "last_verified": "2026-10-11"
    },
    {
        "name": "Emergency",
        "number": "112",
        "alt_number": None,
        "description": "National Emergency Number",
        "source_url": "https://112.gov.in/",
        "last_verified": "2026-10-11"
    }
]

def get_crisis_support_text() -> str:
    lines = [
        "Your responses indicate that you may be going through a difficult time.",
        "Please know that support is available. You don't have to face this alone.",
        "Consider reaching out to one of these free, confidential helplines:",
        ""
    ]
    for res in CRISIS_RESOURCES:
        line = f"- {res['name']}: {res['number']}"
        if res.get("alt_number"):
            line += f" or {res['alt_number']}"
        lines.append(line)
        
    lines.append("")
    lines.append("If you are in immediate danger, please go to the nearest emergency department.")
    return "\n".join(lines)
