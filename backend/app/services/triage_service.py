"""
MantraAI — Clinical Safety & Deterministic Red-Flag Triage Service
===================================================================

PURPOSE
-------
Provides deterministic, rule-based clinical safety triage for men's reproductive
and general health screening.

CLINICAL BOUNDARIES & ETHICAL GOVERNANCE
----------------------------------------
- NOT A DIAGNOSTIC ENGINE: Does NOT diagnose medical conditions.
- NOT AN EMERGENCY DISPATCH SERVICE: Does NOT replace emergency services.
- DETERMINISTIC ONLY: Does NOT use an LLM or statistical model as the decision-maker
  for red-flag triage. All triage classifications trace directly to deterministic,
  clinically verified rules.
- THREE-TIER URGENCY TAXONOMY:
    1. TIER_1_EMERGENCY: Immediate emergency care (Emergency Department / Call 112 / Seek emergency assessment now).
    2. TIER_2_PROMPT_EVALUATION: In-person clinical evaluation within 24–48 hours (Urologist / Physician).
    3. TIER_3_ROUTINE_CONSULTATION: Routine elective consultation / lifestyle guidance.
"""

import re
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TriageTier(str, Enum):
    TIER_1_EMERGENCY = "TIER_1_EMERGENCY"
    TIER_2_PROMPT_EVALUATION = "TIER_2_PROMPT_EVALUATION"
    TIER_3_ROUTINE_CONSULTATION = "TIER_3_ROUTINE_CONSULTATION"


# Convenient tier constants for backwards compatibility & clean imports
TIER_1_EMERGENCY = TriageTier.TIER_1_EMERGENCY
TIER_2_PROMPT_EVALUATION = TriageTier.TIER_2_PROMPT_EVALUATION
TIER_3_ROUTINE_CONSULTATION = TriageTier.TIER_3_ROUTINE_CONSULTATION


class EmergencyContact(BaseModel):
    name: str
    number: str
    hours: str = "24/7"
    cost: str = "Toll-Free"
    description: str
    region: str = "India"
    source_url: str = ""
    verification_date: str = "2026-10"
    intended_use: str = ""


# Verified authoritative emergency contacts for deployment regions
# All numbers verified against official government and foundation records (October 2026)
VERIFIED_EMERGENCY_CONTACTS: List[EmergencyContact] = [
    EmergencyContact(
        name="National Emergency Helpline (ERSS)",
        number="112",
        hours="24/7",
        cost="Toll-Free",
        description="Unified national emergency response system for police, fire, and medical/ambulance emergencies across India.",
        region="India",
        source_url="https://112.gov.in (Emergency Response Support System, Ministry of Home Affairs, Govt of India)",
        verification_date="2026-10",
        intended_use="Immediate emergency police, fire, or medical dispatch across all Indian states.",
    ),
    EmergencyContact(
        name="Tele-MANAS (National Tele Mental Health Programme)",
        number="14416 / 1800-891-4416",
        hours="24/7",
        cost="Toll-Free",
        description="Government of India 24/7 national mental health and crisis counseling helpline in 20+ languages.",
        region="India",
        source_url="https://telemanas.mohfw.gov.in (Ministry of Health & Family Welfare, Govt of India)",
        verification_date="2026-10",
        intended_use="Free, confidential tele-mental health counseling and psychological crisis intervention.",
    ),
    EmergencyContact(
        name="KIRAN Mental Health Helpline",
        number="1800-599-0019",
        hours="24/7",
        cost="Toll-Free",
        description="Ministry of Social Justice and Empowerment 24/7 national mental health helpline in 13 languages.",
        region="India",
        source_url="https://disabilityaffairs.gov.in (Department of Empowerment of Persons with Disabilities, Govt of India)",
        verification_date="2026-10",
        intended_use="Mental health rehabilitation, psychological first aid, anxiety, and distress counseling.",
    ),
    EmergencyContact(
        name="Vandrevala Foundation Mental Health Helpline",
        number="+91 9999 666 555",
        hours="24/7",
        cost="Free Counseling",
        description="24/7 professional mental health and emotional distress helpline via phone and WhatsApp.",
        region="India",
        source_url="https://vandrevalafoundation.com (Vandrevala Foundation for Mental Health)",
        verification_date="2026-10",
        intended_use="Professional psychological counseling and emotional crisis support via phone and WhatsApp.",
    ),
    EmergencyContact(
        name="National Ambulance Service",
        number="108",
        hours="24/7",
        cost="Toll-Free",
        description="Emergency medical and ambulance transport services in India.",
        region="India",
        source_url="https://nhm.gov.in (National Health Mission, Ministry of Health & Family Welfare, Govt of India)",
        verification_date="2026-10",
        intended_use="Emergency medical ambulance transportation across Indian states.",
    ),
]

REGIONAL_EMERGENCY_CONTACTS_INDIA: Dict[str, str] = {
    "112": "National Emergency Helpline (112)",
    "108": "National Ambulance Service (108)",
    "Tele-MANAS": "14416 / 1800-891-4416",
    "KIRAN Mental Health Helpline": "1800-599-0019",
    "Kiran Mental Health Helpline": "1800-599-0019",
    "Vandrevala Foundation": "+91 9999 666 555",
}

RED_FLAG_CATEGORIES: List[str] = [
    "ACUTE_TESTICULAR_PAIN",
    "TESTICULAR_TRAUMA_RUPTURE",
    "PENILE_FRACTURE",
    "GROSS_HEMATURIA_OR_RETENTION",
    "ACUTE_SCROTAL_INFECTION_SEPSIS",
    "PSYCHIATRIC_CRISIS",
    "PALPABLE_TESTICULAR_MASS",
    "SUSPECTED_GENITOURINARY_INFECTION",
    "PERSISTENT_SUBACUTE_ORCHIALGIA",
]

INTERNATIONAL_CRISIS_CONTACTS: List[EmergencyContact] = [
    EmergencyContact(
        name="988 Suicide & Crisis Lifeline",
        number="988",
        hours="24/7",
        cost="Toll-Free",
        description="US and Canada nationwide crisis and suicide prevention line (Call or Text 988).",
        region="US/Canada",
        source_url="https://988lifeline.org (Substance Abuse and Mental Health Services Administration, US HHS)",
        verification_date="2026-10",
        intended_use="Free, confidential 24/7 crisis counseling and emotional distress support for individuals in the United States and Canada.",
    ),
    EmergencyContact(
        name="NHS 111 / Emergency 999",
        number="111 / 999",
        hours="24/7",
        cost="Free",
        description="UK emergency medical dispatch (999) and urgent non-emergency medical advice line (111).",
        region="UK",
        source_url="https://111.nhs.uk (National Health Service, UK)",
        verification_date="2026-10",
        intended_use="Urgent health assessment and emergency medical services across the United Kingdom.",
    ),
]


class TriageResult(BaseModel):
    tier: TriageTier
    is_emergency: bool
    interruption_required: bool
    trigger_code: str
    headline: str
    guidance: str
    immediate_actions: List[str] = Field(default_factory=list)
    contraindicated_actions: List[str] = Field(default_factory=list)
    emergency_contacts: List[EmergencyContact] = Field(default_factory=list)
    recommended_timeframe: str
    disclaimer: str = (
        "MantraAI is an educational wellness screening platform and is NOT an emergency medical service, "
        "ambulance dispatcher, or diagnostic facility. If you are experiencing an acute medical emergency, "
        "immediately contact local emergency services (112 in India) or proceed to the nearest emergency department."
    )
    # Additional access aliases for consumer convenience
    requires_interruption: bool = False
    triggered_red_flags: List[str] = Field(default_factory=list)
    immediate_care_instructions: List[str] = Field(default_factory=list)
    regional_contacts: Dict[str, str] = Field(default_factory=lambda: dict(REGIONAL_EMERGENCY_CONTACTS_INDIA))

    def model_post_init(self, __context: Any) -> None:
        self.requires_interruption = self.interruption_required
        if not self.immediate_care_instructions:
            self.immediate_care_instructions = list(self.immediate_actions)
        if not self.regional_contacts:
            self.regional_contacts = dict(REGIONAL_EMERGENCY_CONTACTS_INDIA)
        if not self.triggered_red_flags and self.trigger_code:
            flags = [self.trigger_code.lower()]
            tc = self.trigger_code.lower()
            if "torsion" in tc or "pain" in tc:
                flags.extend(["testicular_torsion_risk", "acute_testicular_pain"])
            if "trauma" in tc:
                flags.extend(["testicular_trauma", "testicular_trauma_rupture"])
            if "infection" in tc or "sepsis" in tc or "fever" in tc or "swelling" in tc:
                flags.extend(["acute_severe_infection"])
            if "hematuria" in tc or "retention" in tc:
                flags.extend(["urinary_retention_or_hematuria"])
            if "psychiatric" in tc or "crisis" in tc or "mental" in tc or "suicide" in tc:
                flags.extend(["mental_health_crisis"])
            self.triggered_red_flags = list(set(flags))


# ===========================================================================
# Deterministic Rule Definitions
# ===========================================================================

# High-urgency regex patterns for free-text or user input (English, Hindi, Hinglish, misspellings)
TIER_1_PATTERNS = [
    # Acute scrotal trauma / rupture
    (
        r"(\b(hit|kicked|struck|injury|trauma|accident)\b.*\b(testicles?|testical|scrotum|scrotem|balls|groin)\b.*\b(severe|swelling|swollen|black|purple|bruis\w*|hematoma|rupture|tearing)\b"
        r"|\bgot\s+kicked\s+in\s+(the\s+)?balls\b"
        r"|(अंडकोष|अंडकोश)\s*(में|पर)?\s*(गंभीर\s+चोट|चोट|आघात)"
        r"|\b(balls|andkosh)\s+(me|pe|par)\s+(chot|injury)\b)",
        "testicular_trauma",
        "Immediate Care Required: Acute Scrotal Trauma / Injury",
        "Significant physical trauma or injury to the testicles followed by severe pain, rapid swelling, or visible bruising requires immediate in-person emergency physical examination and scrotal ultrasound imaging to evaluate for complications such as testicular rupture.",
        [
            "Proceed immediately to the nearest hospital emergency department or call emergency services (112 / 108 in India).",
            "Support the scrotum gently and minimize physical movement while in transit.",
            "Follow instructions from emergency personnel regarding oral intake and evaluation.",
        ],
        [
            "Do not delay emergency evaluation hoping swelling will subside on its own.",
            "Do not take aspirin or other blood-thinning painkillers without emergency clinician direction.",
            "Do not let secondary advice or preparation delay immediate emergency care.",
        ],
        "Immediate (Seek emergency medical care now)",
    ),
    # Acute testicular / scrotal pain
    (
        r"(\b(sudden|acute|severe|extreme|agonizing|unbearable|sharp|intense)\s+(testicular|testicle|testical|testiculer|scrotal|scrotum|scrotem|groin|balls?)\s+pain\b"
        r"|\b(sudden|acute|severe|extreme|agonizing|unbearable|sharp|intense)\b.*\b(pain|aching|ache)\b.*\b(testicle|testical|testicular|scrotum|scrotem|scrotal|groin|balls?)\b"
        r"|\b(testicle|testical|testicular|scrotum|scrotem|scrotal|groin|balls?)\b.*\b(sudden|acute|severe|extreme|agonizing|unbearable|sharp|intense)\b.*\b(pain|aching|ache)\b"
        r"|\b(pain|aching|ache)\b.*\b(in\s+(the\s+|my\s+)?)?(testicle|testical|testicular|scrotum|scrotem|scrotal|groin|balls?)\b.*\b(sudden|acute|severe|extreme|agonizing|unbearable|sharp|intense)\b"
        r"|\b(testicular|testicle|testical|scrotal|scrotum|scrotem|groin|balls?)\b.*\b(pain|aching|ache)\b.*\b(started\s+\d+|hours?\s+ago|sudden|severe|sharp)\b"
        r"|\bsharp\s+pain\s+in\s+(my\s+)?(testicle|testicles|testical|balls|scrotum)\b"
        r"|(अंडकोष|अंडकोश|वृषण)\s*(में|mein)?\s*.*(अचानक|तेज|गंभीर|असहनीय|तीव्र)\s*.*(दर्द|pain)"
        r"|(अचानक|तेज|गंभीर|असहनीय|तीव्र)\s*.*(अंडकोष|अंडकोश|वृषण)\s*.*(दर्द|pain)"
        r"|\b(andkosh|testicle|testicles|balls|scrotum)\s+(me|mein)\s+.*(tez|achanak|severe|bahut\s+tez)\s+.*dard\b"
        r"|\b(tez|achanak|severe)\s+dard\s+(in|me|mein)\s+(testicle|testicles|balls|andkosh)\b)",
        "testicular_torsion_risk",
        "Immediate Care Required: Acute Severe Testicular or Scrotal Pain",
        "Sudden or severe testicular or scrotal pain is a time-critical medical emergency requiring immediate in-person emergency department evaluation to rule out acute conditions such as testicular torsion. Seek emergency medical assessment immediately right now. Do not wait for symptoms to improve, and do not delay seeking care to complete questionnaires.",
        [
            "Proceed immediately to the nearest hospital Emergency Room or call emergency services (112 / 108 in India).",
            "Have someone drive you to the hospital; do not drive yourself if pain is severe.",
            "Follow instructions from attending emergency clinicians and nurses upon arrival.",
            "If surgical evaluation may be required, avoid eating or drinking unless specifically advised by attending medical staff.",
        ],
        [
            "Do not wait to see if symptoms improve on their own or delay care to complete questionnaires.",
            "Do not apply heating pads, hot water bottles, or attempt home remedies.",
            "Do not let secondary advice or preparation delay immediate emergency care.",
        ],
        "Immediate (Seek emergency medical care now)",
    ),
    # Penile fracture / acute erect injury
    (
        r"(\b(popping|pop|crack|snap|snapping)\s+(sound|noise)?\s*(in|during|penis|erection)\b"
        r"|(इरेक्शन|लिंग)\s*(के\s+दौरान)?\s*(चटकने|टूटना|आवाज)"
        r"|\berection\s+ke\s+dauran\s+(chatakne|popping)\b)",
        "penile_fracture",
        "Immediate Care Required: Acute Penile Injury",
        "A snapping or popping sensation during an erection followed by sudden pain, loss of erection, or rapid swelling is a sign of acute tunica albuginea rupture (penile fracture), which is a time-critical urological surgical emergency requiring immediate evaluation.",
        [
            "Proceed immediately to the nearest emergency department.",
            "Apply a clean cold compress gently while traveling to the hospital.",
            "Follow instructions from emergency personnel regarding evaluation and clinical preparation.",
        ],
        [
            "Do not wait or attempt self-treatment at home.",
            "Do not engage in any sexual activity or manipulation.",
            "Do not delay seeking immediate medical care.",
        ],
        "Immediate (Seek emergency medical care now)",
    ),
    # Gross hematuria / urinary retention
    (
        r"(\b(heavy|lots\s+of|large\s+clots?|frank|gross)?\s*(blood\s+in\s+(my\s+)?(urine|semen|pee)|blood\s+when\s+peeing|hematuria)\b"
        r"|\b(cannot|unable\s+to|stopped|can\'?t)\s+(urinate|pee|pass\s+urine)\b"
        r"|(पेशाब\s+में\s+खून|पेशाब\s+रुक\s+गया|पेशाब\s+नहीं\s+हो\s+रहा)"
        r"|\b(peshab\s+me\s+khoon|peshab\s+nahi\s+ho\s+raha|urine\s+me\s+blood)\b)",
        "urinary_retention_or_hematuria",
        "Immediate Care Required: Gross Hematuria or Acute Urinary Retention",
        "Passing large blood clots in urine or an acute inability to urinate accompanied by lower abdominal fullness is an urgent urological emergency requiring immediate emergency medical evaluation and management.",
        [
            "Visit the nearest emergency care facility or call emergency services (112 / 108 in India) immediately.",
            "Avoid forcing urination or applying forceful pressure to the bladder area.",
            "Follow instructions from emergency personnel regarding urinary catheterization and assessment.",
        ],
        [
            "Do not take over-the-counter diuretics or bladder supplements.",
            "Do not delay seeking clinical care.",
        ],
        "Immediate (Seek emergency medical care now)",
    ),
    # Acute scrotal swelling with high fever
    (
        r"(\b(scrotal|testicle|testicular|scrotum|balls?)\b.*\b(swelling|swollen)\b.*\b(high\s+fever|fever|chills|shivering|vomiting|nausea)\b"
        r"|\b(swelling|swollen)\b.*\b(scrotal|testicle|testicular|scrotum|balls?)\b.*\b(high\s+fever|fever|chills|shivering|vomiting|nausea)\b"
        r"|\b(high\s+fever|fever|chills)\b.*\b(scrotal|testicle|testicular|scrotum|balls?)\b"
        r"|(अंडकोष|अंडकोश)\s*(में)?\s*(सूजन\s+और\s+तेज\s+बुखार|सूजन.*बुखार)"
        r"|\b(andkosh|testicle|scrotum)\s+me\s+(sujan|swelling)\s+aur\s+(tez\s+bukhar|fever)\b)",
        "acute_severe_infection",
        "Immediate Care Required: Rapid Scrotal Swelling with Fever",
        "Rapid testicular or scrotal swelling accompanied by high fever, severe chills, or systemic illness requires immediate in-person emergency medical evaluation to assess for severe bacterial infection or epididymo-orchitis.",
        [
            "Seek immediate emergency medical evaluation at an emergency department.",
            "Have your temperature, vital signs, and scrotal examination evaluated by a physician.",
            "Follow directions from attending emergency clinicians regarding diagnostic testing and antibiotic therapy.",
        ],
        [
            "Do not take leftover unprescribed antibiotics without formal medical evaluation and cultures.",
            "Do not delay emergency evaluation for home remedies.",
        ],
        "Immediate (Seek emergency medical care now)",
    ),
    # Psychiatric crisis / suicidal ideation
    (
        r"(\b(kill\s+myself|suicide|suicidal|suicde|sucide|suiside|suicdal)\b"
        r"|\b(end(ing)?\s+my\s+life|want\s+to\s+die|harm\s+myself|harming\s+myself|hurt\s+myself)\b"
        r"|\b(no\s+reason\s+to\s+live|no\s+reason\s+to\s+keep\s+living|take\s+my\s+own\s+life|taking\s+my\s+own\s+life)\b"
        r"|\b(better\s+off\s+dead|can\'?t\s+go\s+on\s+living|wish\s+i\s+(was|were)\s+dead|don\'?t\s+want\s+to\s+live\s+anymore|ready\s+to\s+end\s+it\s+all)\b"
        r"|\b(self[- ]harm)\b"
        r"|(आत्महत्या|खुदकुशी|खुद\s+को\s+मारना|जान\s+देना\s+चाहता|मरना\s+चाहता|खुद\s+को\s+खत्म\s+करना|जीने\s+का\s+कोई\s+मतलब\s+नहीं)"
        r"|\b(suicide\s+karne|suicide\s+ka\s+man|suicide\s+ka\s+mann|khud\s+ko\s+marna|khud\s+ko\s+khatam|marna\s+chahta|jaan\s+dena\s+chahta|khudkushi|apne\s+aap\s+ko\s+marna|khud\s+ko\s+hurt)\b)",
        "mental_health_crisis",
        "Immediate Mental Health Crisis Support Available",
        "If you are feeling overwhelmed, hopeless, or having thoughts of self-harm, please know that you are not alone and free, compassionate support is available right now. Immediate professional crisis support is ready to assist you.",
        [
            "Call Tele-MANAS toll-free at 14416 or 1800-891-4416 (Govt of India, 24/7, 20+ languages).",
            "Call the National Emergency Helpline at 112 (Police / Fire / Medical across India).",
            "Call KIRAN Mental Health Helpline at 1800-599-0019 (Govt of India, 24/7 Toll-Free).",
            "Call Vandrevala Foundation at +91 9999 666 555 for 24/7 free emotional support via phone or WhatsApp.",
            "Reach out to a trusted loved one, family member, or healthcare provider right now.",
        ],
        [
            "Do not isolate yourself.",
            "Do not wait to ask for help.",
        ],
        "Immediate (Right Now)",
    ),
]


TIER_2_PATTERNS = [
    # Subacute scrotal lump or mass
    (
        r"\b(painless|hard|firm|new|growing)\s+(lump|mass|nodule|bump)\s+(in|on)\s+(the\s+)?(testicle|testicles|scrotum)\b",
        "PALPABLE_TESTICULAR_MASS",
        "Palpable Scrotal or Testicular Lump / Mass",
        "Any new, firm, or palpable lump within the testicle warrants in-person physical examination by a physician or urologist and a diagnostic scrotal ultrasound.",
        "Prompt medical evaluation (within 24–48 hours)",
    ),
    # Painful urination with discharge
    (
        r"\b(discharge|pus|drip|burning\s+when\s+peeing|painful\s+urination)\b.*\b(penis|urethra|sti|sex)\b",
        "SUSPECTED_GENITOURINARY_INFECTION",
        "Urethral Discharge / Suspected Genitourinary Infection",
        "Penile discharge or sharp burning during urination suggests an acute urethral or sexually transmitted infection that requires formal swab/urine testing and targeted medical therapy.",
        "Prompt medical evaluation (within 24–48 hours)",
    ),
    # Persistent testicular ache for days
    (
        r"\b(dull|constant|persistent|aching)\s+(testicular|scrotal|groin)\s+pain\b.*\b(days|weeks|week)\b",
        "PERSISTENT_SUBACUTE_ORCHIALGIA",
        "Persistent Subacute Scrotal Discomfort",
        "Subacute testicular discomfort persisting over several days or weeks warrants an outpatient physical evaluation and scrotal ultrasound to check for epididymitis, varicocele, or other conditions.",
        "Prompt medical evaluation (within 1–3 days)",
    ),
]


def is_negated_or_non_crisis(text: str, trigger_code: str) -> bool:
    """
    Checks if a pattern match is negated, purely informational/educational,
    or historical third-party context rather than an active personal crisis.
    """
    t = text.lower()

    if trigger_code == "mental_health_crisis":
        # 1. Negation of suicidal ideation
        negation_patterns = [
            r"\b(not|no|never|don't|dont|didn't|didnt)\s+(have|had|having|feel|feeling)?\s*(any\s+)?(thoughts?\s+of\s+)?(suicid\w*|killing\s+myself|want\w*\s+to\s+die|harming\s+myself|harm\s+myself|self[- ]harm)\b",
            r"\b(never|no|not|zero)\s+(had|have)?\s*(any\s+)?(thoughts?\s+of\s+)?(suicid\w*|killing\s+myself|self[- ]harm)\b",
            r"\b(not|never)\s+(suicidal|feeling\s+suicidal|planning\s+suicide)\b",
            r"\b(do\s+not|dont|don't)\s+want\s+to\s+die\b",
            r"\b(no|zero)\s+(suicidal\s+thoughts|thoughts\s+of\s+(suicide|self[- ]harm|dying))\b",
            r"\b(suicide|suicidal|marna|jaan\s+dena)\s+(nahi|nhi)\b",
            r"\b(nahi|nhi)\s+(marna|karna|hona)\b",
            r"(आत्महत्या\s+नहीं|मरना\s+नहीं)",
        ]
        for np in negation_patterns:
            if re.search(np, t):
                # Ensure there isn't a separate affirmative crisis statement
                affirmative = re.search(r"\b(but\s+now|actually|however)\s+.*\b(want\s+to\s+die|kill\s+myself)\b", t)
                if not affirmative:
                    return True

        # 2. Educational / prevention / third-party / academic context without personal distress
        informational_patterns = [
            r"\b(reading|studying|learning|wrote|writing|article|essay|project|book|class|lecture)\s+.*\b(about|on|regarding)?\s*(suicide|suicidal\s+rates|suicide\s+prevention)\b",
            r"\b(suicide\s+prevention|preventing\s+suicide)\b",
            r"\b(quote|quoted|quoting)\s*(text\s*)?[:\"'].*\b(suicide|kill\s+myself)\b",
            r"\b(he|she|they|friend|someone|cousin|uncle|brother|person)\s+(committed\s+suicide|killed\s+(himself|herself|themselves))\b",
        ]
        for ip in informational_patterns:
            if re.search(ip, t):
                if not re.search(r"\b(i\s+want\s+to\s+die|i\s+will\s+kill\s+myself|help\s+me\s+die|end\s+my\s+life)\b", t):
                    return True

    elif trigger_code in ["testicular_torsion_risk", "acute_testicular_pain"]:
        # Negation of acute testicular pain
        neg_pain_patterns = [
            r"\b(no|not|never|don't|dont|without)\s+(any\s+)?(testicular|testicle|scrotal|balls?|groin)?\s*(pain|ache|aching|discomfort|severe\s+pain)\b",
            r"\b(pain|ache)\s+(is\s+)?(not|no)\s+(severe|acute|sudden|bad)\b",
            r"\b(no|zero|without)\s+(acute|sudden|severe)\s+pain\b",
            r"\b(dard|pain)\s+(nahi|nhi)\b",
            r"(दर्द\s+नहीं|कोई\s+दर्द\s+नहीं)",
        ]
        for npp in neg_pain_patterns:
            if re.search(npp, t):
                if not re.search(r"\b(have|feel|experiencing)\s+(sudden|severe|sharp)\s+pain\b", t):
                    return True

    return False


def evaluate_free_text_triage(text: str) -> Optional[TriageResult]:
    """
    Deterministically evaluates free-text messages (e.g. from companion, notes)
    against high-urgency clinical red-flag patterns.

    SAFETY AID NOTICE:
    Deterministic keyword detection in this service is an automated safety triage aid
    designed to escalate acute red-flag presentations to verified emergency resources.
    It is NOT a validated clinical suicide-risk assessment instrument (such as C-SSRS or Columbia Scale) and does NOT constitute a clinical diagnosis. MantraAI does not administer clinical suicide risk questionnaires.
    """
    if not text or not isinstance(text, str):
        return None

    cleaned_text = text.lower().strip()

    # 1. Check Tier 1 Emergency Patterns
    for pattern, code, headline, guidance, actions, contra, timeframe in TIER_1_PATTERNS:
        if re.search(pattern, cleaned_text, re.IGNORECASE):
            # Check negation or non-crisis contextual exception
            if is_negated_or_non_crisis(cleaned_text, code):
                continue

            return TriageResult(
                tier=TriageTier.TIER_1_EMERGENCY,
                is_emergency=True,
                interruption_required=True,
                trigger_code=code,
                headline=headline,
                guidance=guidance,
                immediate_actions=actions,
                contraindicated_actions=contra,
                emergency_contacts=VERIFIED_EMERGENCY_CONTACTS,
                recommended_timeframe=timeframe,
            )

    # 2. Check Tier 2 Prompt Evaluation Patterns
    for pattern, code, headline, guidance, timeframe in TIER_2_PATTERNS:
        if re.search(pattern, cleaned_text, re.IGNORECASE):
            return TriageResult(
                tier=TriageTier.TIER_2_PROMPT_EVALUATION,
                is_emergency=False,
                interruption_required=False,
                trigger_code=code,
                headline=headline,
                guidance=guidance,
                immediate_actions=[
                    "Schedule an in-person physical examination with a general physician or urologist.",
                    "Prepare notes on when the symptom started and any aggravating factors.",
                ],
                contraindicated_actions=[
                    "Do not self-prescribe antibiotics or unverified remedies.",
                ],
                emergency_contacts=[],
                recommended_timeframe=timeframe,
            )

    return TriageResult(
        tier=TriageTier.TIER_3_ROUTINE_CONSULTATION,
        is_emergency=False,
        interruption_required=False,
        trigger_code="ROUTINE_TEXT",
        headline="Routine Educational Information",
        guidance="No acute emergency red flags identified in message text.",
        immediate_actions=[],
        contraindicated_actions=[],
        emergency_contacts=[],
        recommended_timeframe="Routine / Non-Urgent",
    )


def evaluate_pre_assessment_checklist(checklist: Any) -> TriageResult:
    """
    Evaluates the explicit pre-assessment clinical safety checklist.
    Accepts either a dict of boolean flags or a list/set of flagged key strings.
    """
    if isinstance(checklist, (list, set, tuple)):
        checklist_set = set(checklist)
    elif isinstance(checklist, dict):
        checklist_set = {k for k, v in checklist.items() if v}
    else:
        checklist_set = set()

    # 1. Acute testicular pain
    if any(k in checklist_set for k in ["acute_testicular_pain", "sudden_severe_testicular_pain", "testicular_pain"]):
        return TriageResult(
            tier=TriageTier.TIER_1_EMERGENCY,
            is_emergency=True,
            interruption_required=True,
            trigger_code="testicular_torsion_risk",
            headline="Immediate Care Required: Acute Severe Testicular or Scrotal Pain",
            guidance=(
                "You have reported sudden or severe testicular pain. This is a time-critical medical emergency. "
                "Seek emergency medical assessment immediately right now. Do not wait for symptoms to improve, "
                "and do not delay seeking care to complete questionnaires."
            ),
            immediate_actions=[
                "Go to the nearest hospital Emergency Room immediately or call emergency services (112 / 108 in India).",
                "Have someone drive you to the hospital; do not drive yourself if pain is severe.",
                "Follow directions from attending emergency clinicians and nurses.",
                "If surgical evaluation may be required, avoid eating or drinking unless specifically advised by attending medical staff.",
            ],
            contraindicated_actions=[
                "Do not wait to see if the pain improves on its own.",
                "Do not apply heating pads, hot water bottles, or attempt home remedies.",
                "Do not delay seeking care to complete online assessments.",
            ],
            emergency_contacts=VERIFIED_EMERGENCY_CONTACTS,
            recommended_timeframe="Immediate (Seek emergency medical care now)",
        )

    # 2. Acute trauma
    if any(k in checklist_set for k in ["recent_severe_trauma", "testicular_trauma", "scrotal_trauma"]):
        return TriageResult(
            tier=TriageTier.TIER_1_EMERGENCY,
            is_emergency=True,
            interruption_required=True,
            trigger_code="testicular_trauma",
            headline="Immediate Care Required: Acute Scrotal Trauma",
            guidance=(
                "You have reported recent direct genital trauma with severe pain or swelling. "
                "This requires immediate evaluation in an emergency department to rule out acute complications like testicular rupture "
                "or significant hematoma."
            ),
            immediate_actions=[
                "Go to an emergency department or urgent urology facility immediately or call 112 / 108.",
                "Follow instructions from attending emergency clinicians regarding examination and oral intake.",
            ],
            contraindicated_actions=[
                "Do not wait for swelling to subside without physical clinical evaluation.",
                "Do not take aspirin or other blood-thinners without medical advice.",
            ],
            emergency_contacts=VERIFIED_EMERGENCY_CONTACTS,
            recommended_timeframe="Immediate (Seek emergency medical care now)",
        )

    # 3. Swelling with fever
    if any(k in checklist_set for k in ["acute_scrotal_swelling_fever", "scrotal_swelling_fever", "swelling_fever"]):
        return TriageResult(
            tier=TriageTier.TIER_1_EMERGENCY,
            is_emergency=True,
            interruption_required=True,
            trigger_code="acute_severe_infection",
            headline="Immediate Care Required: Scrotal Swelling with Fever",
            guidance=(
                "Rapid scrotal swelling combined with fever or chills indicates a potentially severe bacterial "
                "infection that requires immediate in-person emergency medical evaluation."
            ),
            immediate_actions=[
                "Seek immediate in-person medical care at an emergency room or urgent clinic.",
                "Have your vital signs and scrotal examination completed by an emergency physician.",
            ],
            contraindicated_actions=[
                "Do not take unprescribed antibiotics or home remedies.",
            ],
            emergency_contacts=VERIFIED_EMERGENCY_CONTACTS,
            recommended_timeframe="Immediate (Seek emergency medical care now)",
        )

    # 4. Hematuria or retention
    if any(k in checklist_set for k in ["gross_hematuria_or_retention", "hematuria", "urinary_retention"]):
        return TriageResult(
            tier=TriageTier.TIER_1_EMERGENCY,
            is_emergency=True,
            interruption_required=True,
            trigger_code="urinary_retention_or_hematuria",
            headline="Immediate Care Required: Blood in Urine or Inability to Urinate",
            guidance=(
                "Visible heavy blood or clots in urine, or an acute inability to void urine, is an emergency "
                "requiring immediate evaluation by an emergency physician or urologist."
            ),
            immediate_actions=[
                "Visit the nearest emergency care facility immediately or call 112 / 108.",
            ],
            contraindicated_actions=[
                "Do not delay seeking clinical care.",
            ],
            emergency_contacts=VERIFIED_EMERGENCY_CONTACTS,
            recommended_timeframe="Immediate (Seek emergency medical care now)",
        )

    # 5. Mental health crisis
    if any(k in checklist_set for k in ["self_harm_or_crisis", "suicidal_thoughts", "mental_health_crisis"]):
        return TriageResult(
            tier=TriageTier.TIER_1_EMERGENCY,
            is_emergency=True,
            interruption_required=True,
            trigger_code="mental_health_crisis",
            headline="Immediate Mental Health Crisis Support Available",
            guidance=(
                "If you are feeling overwhelmed, having thoughts of self-harm, or in acute distress, "
                "please reach out to verified 24/7 crisis hotlines immediately. You do not have to go through this alone."
            ),
            immediate_actions=[
                "Call Tele-MANAS toll-free at 14416 or 1800-891-4416 (Govt of India, 24/7, 20+ languages).",
                "Call the National Emergency Helpline at 112 (Police / Fire / Medical).",
                "Call KIRAN Mental Health Helpline at 1800-599-0019 (Govt of India, 24/7 Toll-Free).",
                "Call Vandrevala Foundation at +91 9999 666 555 for 24/7 free emotional support.",
            ],
            contraindicated_actions=[
                "Do not isolate yourself.",
            ],
            emergency_contacts=VERIFIED_EMERGENCY_CONTACTS,
            recommended_timeframe="Immediate (Right Now)",
        )

    # Default routine baseline
    return TriageResult(
        tier=TriageTier.TIER_3_ROUTINE_CONSULTATION,
        is_emergency=False,
        interruption_required=False,
        trigger_code="ROUTINE_BASELINE",
        headline="No Immediate Emergency Red Flags Reported",
        guidance="No acute emergency red flags were reported. You may proceed with the wellness and lifestyle questionnaire.",
        immediate_actions=[],
        contraindicated_actions=[],
        emergency_contacts=[],
        recommended_timeframe="Routine / Non-Urgent",
    )


def evaluate_assessment_responses_triage(responses: Dict[str, Any]) -> TriageResult:
    """
    Evaluates submitted questionnaire responses for red flags that warrant urgent
    medical evaluation rather than routine lifestyle advice.
    """
    if not isinstance(responses, dict):
        responses = {}

    # 1. Check acute testicular pain or sudden onset
    pain_onset = str(responses.get("scrotal_pain_onset", "") or "").lower()
    pain_sev = responses.get("scrotal_pain_severity", 0)
    try:
        sev_num = int(pain_sev)
    except (ValueError, TypeError):
        sev_num = 0

    if ("sudden" in pain_onset or "acute" in pain_onset or "severe" in pain_onset) or sev_num >= 7:
        return TriageResult(
            tier=TriageTier.TIER_1_EMERGENCY,
            is_emergency=True,
            interruption_required=True,
            trigger_code="testicular_torsion_risk",
            headline="Immediate Emergency Evaluation Required: Acute Severe Testicular Pain",
            guidance=(
                "You have reported sudden or severe testicular pain. This is a time-critical medical emergency. "
                "Seek emergency medical assessment immediately right now. Do not wait for symptoms to improve, "
                "and do not delay seeking care to complete questionnaires."
            ),
            immediate_actions=[
                "Go immediately to the nearest hospital emergency room or call emergency services (112 / 108 in India).",
                "Have someone drive you to the hospital; do not drive yourself.",
                "Follow instructions from attending emergency clinicians regarding evaluation and oral intake.",
                "If surgical evaluation may be required, avoid eating or drinking unless advised by clinicians.",
            ],
            contraindicated_actions=[
                "Do not delay seeking care to complete online questionnaires or wait for pain to resolve.",
                "Do not apply heating pads or massage the area.",
            ],
            emergency_contacts=VERIFIED_EMERGENCY_CONTACTS,
            recommended_timeframe="Immediate (Seek emergency medical care now)",
        )

    # 2. Check ejaculation concerns for gross hematospermia or severe pain
    ejac = str(responses.get("ejaculation_concerns", "") or "")
    if "blood" in ejac.lower() or "pain" in ejac.lower():
        return TriageResult(
            tier=TriageTier.TIER_2_PROMPT_EVALUATION,
            is_emergency=False,
            interruption_required=False,
            trigger_code="EJACULATION_PAIN_OR_BLOOD",
            headline="Clinical Follow-Up Advised: Pain or Blood in Ejaculate",
            guidance=(
                "You have reported pain or blood associated with ejaculation. While often benign, "
                "this warrants an in-person clinical evaluation by a urologist to rule out infection, "
                "prostatic inflammation, or structural factors."
            ),
            immediate_actions=[
                "Schedule a clinical consultation with a urologist or general practitioner.",
                "Note down whether symptoms occur during or after ejaculation.",
            ],
            contraindicated_actions=[
                "Do not self-medicate with over-the-counter anti-inflammatories without examination.",
            ],
            emergency_contacts=[],
            recommended_timeframe="Prompt medical evaluation (within 1–2 weeks)",
        )

    # 3. Check physical trauma / injury history
    injury = str(responses.get("scrotal_or_groin_injury", "") or "")
    if injury.lower() == "yes":
        return TriageResult(
            tier=TriageTier.TIER_3_ROUTINE_CONSULTATION,
            is_emergency=False,
            interruption_required=False,
            trigger_code="PRIOR_INJURY_CONTEXT",
            headline="Clinical Awareness: History of Groin or Scrotal Injury",
            guidance=(
                "Your reported history of prior physical injury to the groin provides relevant background context. "
                "If you currently experience any persistent pain, swelling, or changes in testicular texture, "
                "an outpatient clinical review is advised."
            ),
            immediate_actions=[
                "Mention prior injuries during your next routine medical or urological evaluation.",
            ],
            contraindicated_actions=[],
            emergency_contacts=[],
            recommended_timeframe="Routine consultation",
        )

    return TriageResult(
        tier=TriageTier.TIER_3_ROUTINE_CONSULTATION,
        is_emergency=False,
        interruption_required=False,
        trigger_code="ROUTINE_ASSESSMENT",
        headline="Routine Health & Wellness Context",
        guidance="No acute emergency red flags identified from questionnaire responses.",
        immediate_actions=[],
        contraindicated_actions=[],
        emergency_contacts=[],
        recommended_timeframe="Routine",
    )

