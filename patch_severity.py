import re

def update_context_engine_severity():
    with open('backend/app/services/context_engine.py', 'r', encoding='utf-8') as f:
        content = f.read()

    gad7_severity_logic = """    # GAD-7 Anxiety Screening Proxy (0-21)
    if isinstance(gad7, (int, float)):
        ctx.source_question_ids.extend([f"gad7_item_{i}" for i in range(1, 8)])
        severity = "minimal"
        if gad7 >= 15: severity = "severe"
        elif gad7 >= 10: severity = "moderate"
        elif gad7 >= 5: severity = "mild"
        
        if gad7 >= 10:
            ctx.mood_anxiety_context = f"Elevated anxiety proxy score ({int(gad7)}/21, {severity})"
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
            follow_ups.append(fu_gad)"""

    content = re.sub(r'    # GAD-7 Anxiety Screening Proxy \(0-21\).*?follow_ups\.append\(fu_gad\)', gad7_severity_logic, content, flags=re.DOTALL)

    phq9_severity_logic = """    # PHQ-9 Mood Screening Proxy (0-27)
    if isinstance(phq9, (int, float)):
        ctx.source_question_ids.extend([f"phq9_item_{i}" for i in range(1, 10)])
        severity = "minimal"
        if phq9 >= 20: severity = "severe"
        elif phq9 >= 15: severity = "moderately severe"
        elif phq9 >= 10: severity = "moderate"
        elif phq9 >= 5: severity = "mild"
        
        if phq9 >= 10:
            ctx.mood_anxiety_context = f"Elevated mood screening proxy score ({int(phq9)}/27, {severity})"
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
            follow_ups.append(fu_phq)"""

    content = re.sub(r'    # PHQ-9 Mood Screening Proxy \(0-27\).*?follow_ups\.append\(fu_phq\)', phq9_severity_logic, content, flags=re.DOTALL)
    
    with open('backend/app/services/context_engine.py', 'w', encoding='utf-8') as f:
        f.write(content)

update_context_engine_severity()
