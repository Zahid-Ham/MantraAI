import re

def update_context_engine():
    with open('backend/app/services/context_engine.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update CANONICAL_QUESTION_COUNT
    content = content.replace(
        "CANONICAL_QUESTION_COUNT = 86",
        "from backend.app.services.normalizer import QUESTION_DOMAIN_MAP\nCANONICAL_QUESTION_COUNT = len(QUESTION_DOMAIN_MAP)"
    )

    # 2. Rewrite _evaluate_mental_behavioral_wellness logic
    
    old_logic = r'    pss = m_stress.get\("perceived_stress_pss10"\)\n    gad7 = m_stress.get\("gad7_score"\)\n    phq9 = m_stress.get\("phq9_score"\)'
    new_logic = r'    pss = m_stress.get("perceived_stress_rating")\n    gad7 = m_stress.get("gad7_score")\n    phq9 = m_stress.get("phq9_score")'
    content = re.sub(old_logic, new_logic, content)

    # Now replace the blocks for PSS, GAD7, PHQ9
    pss_old_pattern = r'    # PSS-10 Perceived Stress[\s\S]*?    # GAD-7 Anxiety Screening Proxy'
    pss_new = """    # Perceived Stress Rating (slider: 0-10)
    if isinstance(pss, (int, float)):
        ctx.source_question_ids.append("perceived_stress_rating")
        if pss >= 7:
            ctx.stress_context = f"Severe perceived stress (score: {int(pss)}/10)"
            ctx.evidence_tags.extend(["stress", "cortisol", "hpa_axis"])
            flag_pss = FactorItem(
                id="severe_perceived_stress",
                domain="mental_behavioral_wellness",
                type="context",
                status="flagged",
                source_question_ids=["perceived_stress_rating"],
                reason=f"High perceived stress screening score ({int(pss)}/10) indicating substantial psychological strain.",
                evidence_tags=["stress", "cortisol", "hpa_axis"]
            )
            modifiable.append(flag_pss)
            flags.append(flag_pss)
        elif pss >= 4:
            ctx.stress_context = f"Moderate perceived stress (score: {int(pss)}/10)"
            ctx.evidence_tags.extend(["stress", "cortisol"])
            modifiable.append(FactorItem(
                id="elevated_perceived_stress",
                domain="mental_behavioral_wellness",
                type="modifiable",
                status="flagged",
                source_question_ids=["perceived_stress_rating"],
                reason=f"Moderate perceived stress screening score ({int(pss)}/10).",
                evidence_tags=["stress", "cortisol"]
            ))
        elif pss <= 3:
            ctx.stress_context = f"Low perceived stress (score: {int(pss)}/10)"
            positive.append(FactorItem(
                id="low_perceived_stress",
                domain="mental_behavioral_wellness",
                type="positive",
                status="optimal",
                source_question_ids=["perceived_stress_rating"],
                reason="Low perceived stress score on screening indicator.",
                evidence_tags=["stress_resilience"]
            ))

    # GAD-7 Anxiety Screening Proxy"""
    content = re.sub(pss_old_pattern, pss_new, content)

    gad7_old_pattern = r'    # GAD-7 Anxiety Screening Proxy.*?    # PHQ-9 Mood Screening Proxy'
    gad7_new = """    # GAD-7 Anxiety Screening Proxy (0-21)
    if isinstance(gad7, (int, float)):
        # Include the items as source if needed, but score is used here
        ctx.source_question_ids.extend([f"gad7_item_{i}" for i in range(1, 8)])
        if gad7 >= 10:
            ctx.mood_anxiety_context = f"Elevated anxiety proxy score ({int(gad7)}/21)"
            ctx.evidence_tags.extend(["anxiety", "autonomic_regulation", "sympathetic_tone"])
            fu_gad = FactorItem(
                id="elevated_anxiety_screening_proxy",
                domain="mental_behavioral_wellness",
                type="follow_up",
                status="flagged",
                source_question_ids=[f"gad7_item_{i}" for i in range(1, 8)],
                reason=f"Elevated anxiety screening proxy score ({int(gad7)}/21) — screening score in a range where speaking with a professional is suggested; this is not a diagnosis.",
                evidence_tags=["anxiety", "autonomic_regulation", "sympathetic_tone"]
            )
            flags.append(fu_gad)
            follow_ups.append(fu_gad)

    # PHQ-9 Mood Screening Proxy"""
    content = re.sub(gad7_old_pattern, gad7_new, content, flags=re.DOTALL)

    phq9_old_pattern = r'    # PHQ-9 Mood Screening Proxy.*?    # Sleep Quality \(PSQI proxy\)'
    phq9_new = """    # PHQ-9 Mood Screening Proxy (0-27)
    if isinstance(phq9, (int, float)):
        ctx.source_question_ids.extend([f"phq9_item_{i}" for i in range(1, 10)])
        if phq9 >= 10:
            ctx.mood_anxiety_context = f"Elevated mood screening proxy score ({int(phq9)}/27)"
            ctx.evidence_tags.extend(["mood_screening", "somatic_strain", "psychological_wellbeing"])
            fu_phq = FactorItem(
                id="elevated_mood_screening_proxy",
                domain="mental_behavioral_wellness",
                type="follow_up",
                status="flagged",
                source_question_ids=[f"phq9_item_{i}" for i in range(1, 10)],
                reason=f"Elevated mood screening proxy score ({int(phq9)}/27) — screening score in a range where speaking with a professional is suggested; this is not a diagnosis.",
                evidence_tags=["mood_screening", "somatic_strain", "psychological_wellbeing"]
            )
            flags.append(fu_phq)
            follow_ups.append(fu_phq)

    # Sleep quality screening"""
    content = re.sub(phq9_old_pattern, phq9_new, content, flags=re.DOTALL)
    
    # Also fix Sleep Quality (PSQI proxy) -> Sleep quality screening
    content = content.replace("Sleep Quality (PSQI proxy)", "Sleep quality screening")
    
    with open('backend/app/services/context_engine.py', 'w', encoding='utf-8') as f:
        f.write(content)

update_context_engine()
