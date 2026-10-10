"""
MantraAI — Evidence Matrix Exporter
===================================

PURPOSE
-------
Generates the research documentation artifact `research/questionnaire_evidence_matrix.csv`
mapping every canonical questionnaire item to its:
- block
- construct ('reproductive' | 'sexual' | 'behavioral')
- target outcome
- evidence level (A / B / C / D / E)
- evidence type (Guideline / Systematic review & Meta-analysis / Validated instrument / Observational)
- primary reference & PMID / DOI
- relationship & clinical validity boundaries

Columns match new.md Section 5.
"""

import os
import re
import csv
import sys
from pathlib import Path

# Paths
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
NEW_MD_PATH = REPO_ROOT / "new.md"
OUTPUT_DIR = REPO_ROOT / "research"
OUTPUT_CSV_PATH = OUTPUT_DIR / "questionnaire_evidence_matrix.csv"


def parse_references(text: str) -> dict[str, dict[str, str]]:
    """Extract markdown link references from the bottom of new.md."""
    ref_map = {}
    for line in text.splitlines():
        m = re.match(r'\[(\d+)\]:\s*(\S+)\s*"(.*)"', line.strip())
        if m:
            ref_num, url, title = m.groups()
            pmid_m = re.search(r'pubmed\.ncbi\.nlm\.nih\.gov/(\d+)', url)
            pmid = pmid_m.group(1) if pmid_m else ""
            doi_m = re.search(r'doi\.org/([^\?"]+)', url)
            doi = doi_m.group(1) if doi_m else ""
            ref_map[ref_num] = {
                "url": url,
                "title": title,
                "pmid": pmid,
                "doi": doi
            }
    return ref_map


def parse_question_sections(text: str, ref_map: dict[str, dict[str, str]]) -> list[dict[str, str]]:
    """Parses questions and evidence descriptions from new.md."""
    # Mapping block numbers to block names and constructs
    block_info = {
        1: ("Demographics", "reproductive"),
        2: ("Lifestyle Behaviors", "reproductive"),
        3: ("Heat Exposure", "reproductive"),
        4: ("Diet & Nutrition", "behavioral"),
        5: ("Environmental Exposure", "reproductive"),
        6: ("Mental Health & Stress", "behavioral"),
        7: ("Reproductive History & Symptoms", "reproductive"),
        8: ("Substance & Medication Use", "reproductive"),
        9: ("Digital Sexual Behavior", "behavioral"),
        10: ("Sexual Performance / Anxiety", "sexual"),
        11: ("Body Image & Self-Perception", "behavioral"),
        12: ("Social & Relational Context", "behavioral"),
        13: ("Coping Mechanisms", "behavioral"),
    }

    # Split by question headings: ### 1. `age_years` — 🟢 A/B or ## 8. `smoking_status` — 🟢 A
    pattern = re.compile(
        r'(?:###|##)\s*(\d+)\.\s*`([^`]+)`\s*—\s*([^\n]+)\n(.*?)(?=(?:###|##)\s*\d+\.\s*`|\n#\s|\Z)',
        re.DOTALL
    )

    current_block = 1
    rows = []

    # Map question IDs to human-readable question text from assessmentSchema
    q_text_map = {
        "age_years": "What is your age in completed years?",
        "bmi_category": "What is your current Body Mass Index (BMI) category?",
        "city_region": "Which city/region do you primarily reside in?",
        "residential_area_type": "How would you describe your primary residential area?",
        "occupation_type": "What best describes your primary occupation?",
        "education_level": "What is your highest level of completed formal education?",
        "relationship_status": "What is your current relationship status?",
        "smoking_status": "What is your tobacco smoking status?",
        "alcohol_frequency": "How often do you consume alcoholic beverages?",
        "recreational_drug_use": "Do you currently or have you previously used recreational drugs?",
        "physical_activity_level": "How would you describe your weekly physical activity level?",
        "hours_sitting_per_day": "On average, how many hours per day do you spend seated?",
        "irregular_sleep": "Do you have an irregular sleep schedule or do rotating shift work?",
        "sleep_duration": "On average, how many hours of sleep do you get per night?",
        "laptop_on_lap": "How often do you use a laptop computer directly resting on your lap?",
        "mobile_phone_placement": "How often do you keep a mobile device close to the groin for prolonged periods?",
        "underwear_type": "What style of underwear do you most commonly wear during the day?",
        "hot_bath_frequency": "How often do you take hot baths, sit in hot tubs, or use saunas?",
        "working_in_hot_conditions": "Does your occupation involve working in high-heat environments?",
        "cycling_hours_per_week": "On average, how many hours per week do you spend cycling?",
        "diet_type": "Which best describes your daily dietary pattern?",
        "fruit_veg_intake": "How many servings of fresh fruits and vegetables do you consume daily?",
        "processed_food_frequency": "How often do you consume ultra-processed or fast foods?",
        "fried_food_frequency": "How often do you consume deeply fried foods?",
        "soy_phytoestrogen_intake": "How often do you consume soy or phytoestrogen-rich foods?",
        "water_intake": "On average, how much water do you drink per day?",
        "supplement_use": "Do you currently take any dietary or fitness supplements?",
        "proximity_to_industrial_or_traffic": "Do you live or work close to heavy industrial complexes or highways?",
        "pesticide_occupational_exposure": "Do you have direct occupational exposure to agricultural pesticides?",
        "heavy_metal_occupational_exposure": "Are you exposed to heavy metals, welding fumes, or industrial solvents?",
        "plastic_use_hot_food_water": "Do you frequently consume hot foods or hot water from plastic containers?",
        "emf_radiation_at_work": "Are you exposed to occupational ionizing or radiofrequency radiation?",
        "daily_work_hours": "On average, how many hours do you work per day?",
        "perceived_stress_rating": "Over the past month, how stressed have you felt overall on a 0-10 scale?",
        "gad7_score": "Over the last 2 weeks, how often have you been bothered by anxiety symptoms? (GAD-7)",
        "phq9_score": "Over the last 2 weeks, how often have you been bothered by depressive symptoms? (PHQ-9)",
        "sleep_quality_screening": "How would you rate your overall sleep quality during the past month?",
        "prior_sti_history": "Have you ever been diagnosed with or treated for a sexually transmitted infection?",
        "scrotal_or_groin_injury": "Have you ever experienced a significant physical injury to your groin or scrotum?",
        "childhood_disease_mumps": "Did you have mumps after puberty or experience mumps orchitis?",
        "known_varicocele": "Have you ever been told by a doctor that you have a varicocele?",
        "sexual_abstinence_period_days": "When undergoing semen testing, what is your typical abstinence period in days?",
        "libido_changes": "Over the past 6 months, have you noticed any noticeable change in your sex drive?",
        "ejaculation_concerns": "Do you have any concerns regarding your ejaculation (pain, volume, timing)?",
        "anabolic_steroid_use": "Have you ever used anabolic-androgenic steroids or testosterone enhancements?",
        "finasteride_use": "Have you ever used oral finasteride or dutasteride for hair loss or prostate health?",
        "antidepressant_use_ssri": "Are you currently taking or have you taken SSRI or SNRI antidepressant medications?",
        "antihypertensive_use": "Do you currently take prescription medications for high blood pressure?",
        "chemotherapy_history": "Have you ever received chemotherapy or radiation therapy for cancer?",
        "other_long_term_medication": "Do you take any other daily prescription medications long-term?",
        "pornography_use_frequency": "How often do you typically view digital adult content / pornography?",
        "perceived_control_over_use": "How much control do you feel you have over your pornography viewing habits?",
        "use_as_emotional_coping": "Do you use adult content to cope with negative emotions, boredom, or stress?",
        "escalation_pattern": "Have you noticed seeking more extreme or novel material over time?",
        "negative_consequences_noticed": "Have you noticed negative impacts on your daily productivity, mood, or sleep?",
        "attempts_to_cut_down_failed": "Have you tried to reduce or stop viewing adult content and found it difficult?",
        "daily_time_on_sexual_content": "On days you view adult content, roughly how much time do you spend?",
        "masturbation_frequency": "How often do you engage in solo sexual activity / masturbation?",
        "masturbation_frequency_change": "Has your frequency of solo sexual activity changed significantly recently?",
        "masturbation_control": "Do you feel able to moderate your solo sexual behavior comfortably?",
        "masturbation_functional_impact": "Does your solo sexual activity interfere with work, sleep, or daily responsibilities?",
        "masturbation_physical_discomfort": "Do you experience physical pain, soreness, or skin irritation from solo behavior?",
        "masturbation_emotional_coping": "Do you use solo sexual activity primarily to cope with stress or negative emotions?",
        "anticipatory_anxiety_before_sex": "Do you experience nervousness or performance anxiety before partnered intimacy?",
        "primary_fear_type": "What is your primary concern or worry regarding partnered sexual intimacy?",
        "sexual_avoidance_due_to_fear": "Have you ever avoided partnered intimacy due to anxiety about performance?",
        "partner_comparison_porn_vs_reality": "Do you compare real-life intimacy to standards portrayed in digital adult media?",
        "cognitive_self_monitoring_during_sex": "Do you find yourself observing or evaluating your performance during intimacy?",
        "history_of_unexpected_sexual_difficulty": "Have you experienced sudden, unexpected difficulty with erections or arousal?",
        "pornography_driven_performance_standard": "Do you feel pressure to match unrealistic physical or duration standards?",
        "partnered_sexual_history": "How would you describe your overall history of partnered sexual experiences?",
        "recent_partnered_sex": "Have you engaged in partnered sexual intimacy in the past 6 months?",
        "partnered_sexual_difficulty": "Do you regularly experience difficulty with erection, stamina, or climax with a partner?",
        "general_body_satisfaction": "Overall, how satisfied are you with your body and physical appearance?",
        "physique_muscularity_pressure": "Do you feel pressure or anxiety about being sufficiently muscular or lean?",
        "genital_self_image_concern": "Do you experience concern or dissatisfaction with your genital appearance or size?",
        "social_media_body_comparison_frequency": "How often do you compare your physique to individuals on social media?",
        "relationship_satisfaction": "How satisfied are you with your primary emotional/romantic relationship?",
        "perceived_loneliness_ucla3": "How often do you feel a lack of companionship, left out, or isolated from others?",
        "family_communication_comfort": "How comfortable do you feel discussing personal or health matters with family?",
        "peer_pressure_sexual_behavior": "Do you experience peer pressure or social comparison regarding sexual experience?",
        "primary_stress_coping_method": "What is your primary method for managing stress or difficult emotions?",
        "emotional_regulation_ability": "How easily are you able to process and recover from emotionally stressful events?",
        "sleep_as_escape": "Do you use sleep as a way to avoid dealing with daytime stress or problems?",
        "substance_use_under_stress": "Does your use of caffeine, nicotine, alcohol, or other substances increase under stress?",
        "mindfulness_or_meditation_practice": "Do you engage in regular mindfulness, meditation, or breathing exercises?",
    }

    # Extract all question blocks
    for match in pattern.finditer(text):
        q_num = int(match.group(1))
        q_id = match.group(2).strip()
        grade_str = match.group(3).strip()
        body = match.group(4)

        # Normalize grade
        evidence_level = "B"
        if "🟢 A" in grade_str or "🟢 A/B" in grade_str:
            evidence_level = "A"
        elif "🟢 B" in grade_str:
            evidence_level = "B"
        elif "🟡 C" in grade_str or "🟡 B/C" in grade_str:
            evidence_level = "C"
        elif "🟠 D" in grade_str:
            evidence_level = "D"
        elif "🔴" in grade_str:
            evidence_level = "E"

        # Determine block based on question number ranges
        if q_num <= 7:
            block_id = 1
        elif q_num <= 14:
            block_id = 2
        elif q_num <= 20:
            block_id = 3
        elif q_num <= 27:
            block_id = 4
        elif q_num <= 32:
            block_id = 5
        elif q_num <= 37:
            block_id = 6
        elif q_num <= 44:
            block_id = 7
        elif q_num <= 50:
            block_id = 8
        elif q_num <= 63:
            block_id = 9
        elif q_num <= 73:
            block_id = 10
        elif q_num <= 77:
            block_id = 11
        elif q_num <= 81:
            block_id = 12
        else:
            block_id = 13

        block_name, default_construct = block_info[block_id]

        # Specific construct overrides per new.md Section 3
        construct = default_construct
        if q_id in ["libido_changes", "ejaculation_concerns"]:
            construct = "sexual"
        elif q_id in ["anabolic_steroid_use", "finasteride_use", "antidepressant_use_ssri", "chemotherapy_history"]:
            construct = "reproductive"
        elif q_id in ["hours_sitting_per_day", "sleep_duration", "irregular_sleep"]:
            construct = "reproductive" if q_id == "hours_sitting_per_day" else "behavioral"

        # Find reference citation brackets like ([PubMed][9]) or ([Uroweb][6])
        ref_indices = re.findall(r'\[(\d+)\]', body)
        primary_ref = ""
        pmid = ""
        doi = ""
        ev_type = "Observational"
        if ref_indices:
            first_idx = ref_indices[0]
            if first_idx in ref_map:
                ref_data = ref_map[first_idx]
                primary_ref = ref_data["title"]
                pmid = ref_data["pmid"]
                doi = ref_data["doi"]
                if "meta-analysis" in primary_ref.lower():
                    ev_type = "Meta-analysis"
                elif "systematic review" in primary_ref.lower():
                    ev_type = "Systematic review"
                elif "guideline" in primary_ref.lower():
                    ev_type = "Clinical guideline"
                elif "scale" in primary_ref.lower() or "instrument" in primary_ref.lower():
                    ev_type = "Validated instrument"

        # Determine target outcome
        if construct == "reproductive":
            target_outcome = "Semen parameters / reproductive function"
        elif construct == "sexual":
            target_outcome = "Psychosexual health / sexual function"
        else:
            target_outcome = "Mental / behavioral wellness"

        # Determine relationship
        if evidence_level in ("A", "B"):
            relationship = "Associated with target health domain"
        elif evidence_level == "C":
            relationship = "Contextual modifier / wellness factor"
        elif evidence_level == "D":
            relationship = "Inconsistent or uncertain association"
        else:
            relationship = "Unsupported as independent predictor"

        # Governance columns per new.md section 5
        causal_claim_allowed = "No"  # Invariant: Never allow causal claims
        risk_score_allowed = "Yes" if evidence_level in ("A", "B") and construct == "reproductive" else "No"
        clinical_review_required = "Yes" if evidence_level in ("A", "B") or q_id in ["phq9_score", "gad7_score", "known_varicocele", "childhood_disease_mumps"] else "No"
        expert_validation_required = "Yes"

        # Question text
        clean_q_id = "perceived_stress_rating" if q_id == "perceived_stress_pss10" else q_id
        q_text = q_text_map.get(clean_q_id, q_id.replace("_", " ").capitalize())

        rows.append({
            "question_id": clean_q_id,
            "question": q_text,
            "block": block_name,
            "construct": construct,
            "target_outcome": target_outcome,
            "evidence_level": evidence_level,
            "evidence_type": ev_type,
            "primary_reference": primary_ref,
            "pmid": pmid,
            "doi": doi,
            "relationship": relationship,
            "causal_claim_allowed": causal_claim_allowed,
            "risk_score_allowed": risk_score_allowed,
            "clinical_review_required": clinical_review_required,
            "expert_validation_required": expert_validation_required,
        })

    return rows


def export_matrix():
    if not NEW_MD_PATH.exists():
        print(f"Error: {NEW_MD_PATH} not found.", file=sys.stderr)
        sys.exit(1)

    text = NEW_MD_PATH.read_text(encoding="utf-8")
    ref_map = parse_references(text)
    rows = parse_question_sections(text, ref_map)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "question_id",
        "question",
        "block",
        "construct",
        "target_outcome",
        "evidence_level",
        "evidence_type",
        "primary_reference",
        "pmid",
        "doi",
        "relationship",
        "causal_claim_allowed",
        "risk_score_allowed",
        "clinical_review_required",
        "expert_validation_required"
    ]

    with open(OUTPUT_CSV_PATH, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Successfully exported {len(rows)} evidence matrix rows to {OUTPUT_CSV_PATH}")


if __name__ == "__main__":
    export_matrix()
