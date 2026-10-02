import os
import sys
import json
sys.path.insert(0, os.path.abspath("."))

from app.database import SessionLocal
from app.models.assessment import AssessmentResponse
from app.services.normalizer import normalize_assessment_responses, NormalizedAssessment
from app.services.context_engine import build_health_context, HealthContext
from app.services.evidence_retriever import retrieve_evidence_for_health_context, EvidenceContext
from app.schemas.report import (
    MantraAIReport, ReportMetadata, PriorityFactorReportItem, PositiveFactorReportItem,
    PersonalizedAction, ClinicianDiscussionQuestion, ProfessionalHelpGuidance, EvidenceReference,
    ExecutiveSummary, ReproductiveHealthReportSection, SexualHealthReportSection,
    MentalBehavioralWellnessReportSection, LifestyleWellnessReportSection,
    EnvironmentalExposureReportSection, SubstanceMedicationReportSection,
    ReportLimitations, new_report_to_legacy_view
)
from app.services.report_generator import (
    humanize_factor_title, humanize_factor_description,
    humanize_positive_title, humanize_positive_description,
    normalize_report_domain
)

def enrich_and_complete_report(
    report: MantraAIReport,
    health_context: HealthContext,
    evidence_context: EvidenceContext,
    normalized_assessment: NormalizedAssessment,
) -> MantraAIReport:
    valid_ev_ids = [e.evidence_id for e in evidence_context.items]
    first_ev_id = [valid_ev_ids[0]] if valid_ev_ids else []

    # 1. Evidence: ensure all retrieved evidence items are present
    existing_ev_ids = {e.evidence_id for e in report.evidence}
    enriched_evidence = list(report.evidence)
    for e in evidence_context.items:
        if e.evidence_id not in existing_ev_ids:
            enriched_evidence.append(
                EvidenceReference(
                    evidence_id=e.evidence_id,
                    title=e.title,
                    source=e.source,
                    year=e.publication_year,
                    url=e.url,
                    source_identifier=e.source_identifier,
                    relevance=e.relevance_reason,
                )
            )
            existing_ev_ids.add(e.evidence_id)

    # 2. Positive Factors: enrich if fewer than 2 items
    enriched_positive = list(report.positive_factors)
    if len(enriched_positive) < 2 and health_context.positive_factors:
        existing_pos_ids = {p.id for p in enriched_positive}
        for idx, p in enumerate(health_context.positive_factors):
            if p.id not in existing_pos_ids:
                source_q_ids = [q for q in p.source_question_ids if q in ["age_years", "physical_activity_level"] or q] or ["age_years"]
                # Match relevant evidence refs if available
                p_refs = [e.evidence_id for e in evidence_context.items if any(t in p.domain for t in e.matched_tags)] or first_ev_id
                enriched_positive.append(
                    PositiveFactorReportItem(
                        id=f"pos_{len(enriched_positive) + 1}",
                        domain=normalize_report_domain(p.domain),
                        title=humanize_positive_title(p.id),
                        description=humanize_positive_description(p),
                        source_question_ids=source_q_ids,
                        evidence_refs=p_refs[:2],
                    )
                )
                existing_pos_ids.add(p.id)
                if len(enriched_positive) >= 5:
                    break

    if not enriched_positive:
        enriched_positive.append(
            PositiveFactorReportItem(
                id="pos_baseline",
                domain="lifestyle_wellness",
                title="Proactive Health Engagement",
                description="Taking the time to complete this comprehensive screening demonstrates proactive engagement with personal wellness.",
                source_question_ids=["age_years"],
                evidence_refs=first_ev_id,
            )
        )

    # 3. Priority Factors: enrich if fewer than 2 items and modifiable factors exist
    enriched_priority = list(report.priority_factors)
    if len(enriched_priority) < 2 and health_context.modifiable_factors:
        existing_mod_ids = {f.id for f in enriched_priority}
        for idx, f in enumerate(health_context.modifiable_factors):
            if f.id not in existing_mod_ids:
                source_q_ids = [q for q in f.source_question_ids if q in ["age_years", "physical_activity_level"] or q] or ["physical_activity_level"]
                f_refs = [e.evidence_id for e in evidence_context.items if any(t in f.domain for t in e.matched_tags)] or first_ev_id
                enriched_priority.append(
                    PriorityFactorReportItem(
                        id=f"pf_{len(enriched_priority) + 1}",
                        domain=normalize_report_domain(f.domain),
                        title=humanize_factor_title(f.id),
                        description=humanize_factor_description(f),
                        source_question_ids=source_q_ids,
                        evidence_refs=f_refs[:2],
                        actionable=True,
                        severity="moderate",
                    )
                )
                existing_mod_ids.add(f.id)
                if len(enriched_priority) >= 5:
                    break

    if not enriched_priority:
        enriched_priority.append(
            PriorityFactorReportItem(
                id="pf_baseline",
                domain="lifestyle_wellness",
                title="Routine Health Maintenance",
                description="Continue balanced lifestyle habits, good daily hydration, and regular physical activity to support your baseline wellness.",
                source_question_ids=["physical_activity_level"],
                evidence_refs=first_ev_id,
                actionable=True,
                severity="low",
            )
        )

    # 4. Action Plan: enrich if fewer than 2 items
    enriched_actions = list(report.personalized_action_plan)
    if len(enriched_actions) < 2:
        action_templates = [
            ("Take Daily Movement Breaks", "Incorporate 5-minute walking or stretching breaks every hour during prolonged desk work to stimulate circulation.", "lifestyle_wellness", "Regular movement promotes pelvic blood flow and metabolic health.", "Start this week", "lifestyle"),
            ("Maintain a Consistent Sleep Schedule", "Aim to sleep and wake at similar times each day and limit bright screens 30 minutes before bed.", "lifestyle_wellness", "Consistent sleep schedules promote restorative rest and endocrine balance.", "Next 2-4 weeks", "lifestyle"),
            ("Avoid Direct Groin Heat Exposure", "Avoid resting warm laptops or heating devices directly on your lap or groin area.", "environmental_exposure", "Keeping the scrotal area at normal resting temperature supports optimal tissue function.", "Ongoing", "lifestyle"),
            ("Mindful Stress Reduction", "Incorporate 10-15 minutes of quiet breathing, outdoor walks, or relaxation into your daily evening routine.", "mental_behavioral_wellness", "Lowering sympathetic nervous stress supports autonomic nervous balance.", "1-2 weeks", "self_monitoring"),
        ]
        existing_act_titles = {a.title.lower() for a in enriched_actions}
        for tmpl in action_templates:
            if tmpl[0].lower() not in existing_act_titles:
                act_refs = [e.evidence_id for e in evidence_context.items if any(t in tmpl[2] for t in e.matched_tags)] or first_ev_id
                enriched_actions.append(
                    PersonalizedAction(
                        id=f"act_{len(enriched_actions) + 1}",
                        title=tmpl[0],
                        description=tmpl[1],
                        domain=tmpl[2],
                        rationale=tmpl[3],
                        evidence_refs=act_refs[:2],
                        timeframe=tmpl[4],
                        action_type=tmpl[5],
                        priority=len(enriched_actions) + 1,
                    )
                )
                if len(enriched_actions) >= 4:
                    break

    # 5. Clinician Discussion Questions: enrich if fewer than 2 items
    enriched_questions = list(report.questions_to_discuss_with_clinician)
    if len(enriched_questions) < 2:
        existing_q_texts = {q.question.lower() for q in enriched_questions}
        for flag in health_context.follow_up_flags:
            q_text = f"What preventive evaluations or lifestyle recommendations do you suggest regarding {flag.reason.lower()}?"
            if q_text.lower() not in existing_q_texts:
                enriched_questions.append(
                    ClinicianDiscussionQuestion(
                        id=f"cq_{len(enriched_questions) + 1}",
                        question=q_text,
                        domain=normalize_report_domain(flag.domain),
                        reason=f"Identified from reported history: {flag.reason}",
                    )
                )
                existing_q_texts.add(q_text.lower())

        if len(enriched_questions) < 2:
            default_qs = [
                ("What routine preventive health screenings or blood tests are appropriate for my age group and lifestyle?", "reproductive_health", "Routine wellness maintenance."),
                ("How might my daily work hours and stress levels be affecting my overall vitality and rest?", "mental_behavioral_wellness", "Stress and recovery review."),
            ]
            for q_t, q_d, q_r in default_qs:
                if q_t.lower() not in existing_q_texts:
                    enriched_questions.append(
                        ClinicianDiscussionQuestion(
                            id=f"cq_{len(enriched_questions) + 1}",
                            question=q_t,
                            domain=q_d,
                            reason=q_r,
                        )
                    )
                    existing_q_texts.add(q_t.lower())
                    if len(enriched_questions) >= 3:
                        break

    # 6. When to Seek Professional Help: enrich if fewer than 2 items
    enriched_help = list(report.when_to_seek_professional_help)
    if len(enriched_help) < 2:
        existing_triggers = {h.trigger.lower() for h in enriched_help}
        for flag in health_context.follow_up_flags:
            trig = f"Persistent {flag.id.replace('_', ' ')} or related discomfort"
            if trig.lower() not in existing_triggers:
                enriched_help.append(
                    ProfessionalHelpGuidance(
                        trigger=trig,
                        explanation=f"A formal clinical evaluation is advised to review {flag.reason.lower()}.",
                        urgency="timely",
                    )
                )
                existing_triggers.add(trig.lower())

        if len(enriched_help) < 2:
            default_helps = [
                ("Persistent discomfort, pain, or palpable changes in the groin area", "Schedule an in-person physical examination with a physician or urologist.", "timely"),
                ("Planning a family or experiencing prolonged difficulties with intimacy or rest", "A qualified reproductive specialist can conduct appropriate baseline diagnostic assessments.", "routine"),
            ]
            for h_t, h_e, h_u in default_helps:
                if h_t.lower() not in existing_triggers:
                    enriched_help.append(
                        ProfessionalHelpGuidance(
                            trigger=h_t,
                            explanation=h_e,
                            urgency=h_u,
                        )
                    )
                    existing_triggers.add(h_t.lower())
                    if len(enriched_help) >= 3:
                        break

    # 7. Domain sections: verify relevant_factors, reported_context, evidence_refs
    rep = report.reproductive_health
    rep_factors = rep.relevant_factors or [f.reason for f in health_context.modifiable_factors if "repro" in f.domain]
    rep_context = rep.reported_context or [f.reason for f in health_context.context_flags if "repro" in f.domain]
    rep_refs = rep.evidence_refs or first_ev_id
    rep_summary = rep.summary if rep.summary and len(rep.summary) > 20 else (
        "No specific reproductive concerns were identified from the answers provided in this area."
        if not rep_factors and not rep_context else
        "A review of your self-reported history indicates overall stable baseline parameters with opportunities for routine health maintenance."
    )

    sex = report.sexual_health
    sex_factors = sex.relevant_factors or [f.reason for f in health_context.modifiable_factors if "sex" in f.domain]
    sex_context = sex.reported_context or [f.reason for f in health_context.context_flags if "sex" in f.domain]
    sex_refs = sex.evidence_refs or first_ev_id
    sex_summary = sex.summary if sex.summary and len(sex.summary) > 20 else (
        "No specific psychosexual concerns were identified from your assessment responses."
        if not sex_factors and not sex_context else
        "Your responses reflect normal psychosexual awareness. Energy and intimacy naturally fluctuate with daily stress, fatigue, and recovery."
    )

    men = report.mental_behavioral_wellness
    men_factors = men.relevant_factors or [f.reason for f in health_context.modifiable_factors if "mental" in f.domain or "stress" in f.domain or "psych" in f.domain]
    men_context = men.reported_context or [f.reason for f in health_context.context_flags if "mental" in f.domain or "stress" in f.domain]
    men_refs = men.evidence_refs or first_ev_id
    men_summary = men.summary if men.summary and len(men.summary) > 20 else (
        "No elevated stress or sleep challenges were reported in this screening."
        if not men_factors and not men_context else
        "Managing everyday stress, balancing screen habits, and protecting regular sleep routines are central to your overall wellbeing."
    )

    life = report.lifestyle_wellness
    life_factors = life.relevant_factors or [f.reason for f in health_context.modifiable_factors if "lifestyle" in f.domain or "sleep" in f.domain or "diet" in f.domain]
    life_refs = life.evidence_refs or first_ev_id
    life_summary = life.summary if life.summary and len(life.summary) > 20 else (
        "Your responses indicate solid baseline daily lifestyle habits."
        if not life_factors else
        "Daily physical movement, balanced nutrition, and consistent hydration form the core pillars of physical vitality."
    )

    env = report.environmental_exposure
    env_factors = env.relevant_factors or [f.reason for f in health_context.modifiable_factors if "env" in f.domain or "heat" in f.domain]
    env_refs = env.evidence_refs or first_ev_id
    env_summary = env.summary if env.summary and len(env.summary) > 20 else (
        "No significant environmental heat or chemical exposures were identified."
        if not env_factors else
        "Minimizing direct heat around the groin and maintaining good ergonomic desk habits support long-term physical comfort."
    )

    sub = report.substance_medication
    sub_factors = sub.relevant_factors or [f.reason for f in health_context.modifiable_factors if "substance" in f.domain or "med" in f.domain or "alcohol" in f.domain or "tobacco" in f.domain]
    sub_refs = sub.evidence_refs or first_ev_id
    sub_summary = sub.summary if sub.summary and len(sub.summary) > 20 else (
        "No tobacco, alcohol escalation, or unmonitored substance exposures were reported."
        if not sub_factors else
        "Maintaining a smoke-free lifestyle and moderating substance exposure protect vascular elasticity and circulation."
    )

    # 8. Executive summary themes and attention areas
    exec_s = report.executive_summary
    themes = exec_s.key_themes or ["Daily Movement & Rest", "Protective Baseline Habits", "Evidence-Informed Next Steps"]
    areas = exec_s.areas_for_attention or [p.title for p in enriched_priority[:3]]
    pos_ctx = exec_s.positive_context or [p.title for p in enriched_positive[:3]]

    enriched_report = MantraAIReport(
        report_metadata=report.report_metadata,
        executive_summary=ExecutiveSummary(
            headline=exec_s.headline,
            overview=exec_s.overview,
            key_themes=themes,
            areas_for_attention=areas,
            positive_context=pos_ctx,
            overall_wellness_status=exec_s.overall_wellness_status,
        ),
        reproductive_health=ReproductiveHealthReportSection(
            summary=rep_summary,
            reported_context=rep_context,
            relevant_factors=rep_factors,
            evidence_refs=rep_refs,
            limitations=rep.limitations or ["Questionnaire screening context only."],
        ),
        sexual_health=SexualHealthReportSection(
            summary=sex_summary,
            reported_context=sex_context,
            relevant_factors=sex_factors,
            evidence_refs=sex_refs,
            limitations=sex.limitations or ["Psychosexual wellness reflects subjective self-reported context."],
        ),
        mental_behavioral_wellness=MentalBehavioralWellnessReportSection(
            summary=men_summary,
            reported_context=men_context,
            relevant_factors=men_factors,
            evidence_refs=men_refs,
            limitations=men.limitations or ["Screening indicators do not constitute psychiatric evaluation."],
        ),
        lifestyle_wellness=LifestyleWellnessReportSection(
            summary=life_summary,
            relevant_factors=life_factors,
            evidence_refs=life_refs,
            limitations=life.limitations or ["Self-reported daily lifestyle estimates."],
        ),
        environmental_exposure=EnvironmentalExposureReportSection(
            summary=env_summary,
            relevant_factors=env_factors,
            evidence_refs=env_refs,
            limitations=env.limitations or ["Observational associations only."],
        ),
        substance_medication=SubstanceMedicationReportSection(
            summary=sub_summary,
            relevant_factors=sub_factors,
            evidence_refs=sub_refs,
            limitations=sub.limitations or ["Always consult prescribing doctors regarding medications."],
        ),
        priority_factors=enriched_priority,
        positive_factors=enriched_positive,
        personalized_action_plan=enriched_actions,
        questions_to_discuss_with_clinician=enriched_questions,
        when_to_seek_professional_help=enriched_help,
        evidence=enriched_evidence,
        limitations=report.limitations,
        disclaimer=report.disclaimer,
    )

    return enriched_report

def run_test():
    db = SessionLocal()
    try:
        responses_list = db.query(AssessmentResponse).filter(
            AssessmentResponse.assessment_session_id == "449142a9-e6e9-4e05-b9b4-1586d72a59b0"
        ).all()
        answers = {r.question_id: r.response_value for r in responses_list}
        norm = normalize_assessment_responses(answers)
        ctx = build_health_context(norm)
        ev = retrieve_evidence_for_health_context(ctx)
        
        # Test fallback / raw report enrichment
        from app.services.report_generator import build_fallback_report
        meta = ReportMetadata(
            report_version="2.0",
            generated_at="2026-10-02T16:00:00Z",
            model_provider="groq",
            model_name="openai/gpt-oss-120b",
            questionnaire_version="1.0"
        )
        fb = build_fallback_report(norm, ctx, ev, meta)
        
        # Strip some sections to simulate LLM partial omission
        stripped = MantraAIReport(
            report_metadata=fb.report_metadata,
            executive_summary=fb.executive_summary,
            reproductive_health=fb.reproductive_health,
            sexual_health=fb.sexual_health,
            mental_behavioral_wellness=fb.mental_behavioral_wellness,
            lifestyle_wellness=fb.lifestyle_wellness,
            environmental_exposure=fb.environmental_exposure,
            substance_medication=fb.substance_medication,
            priority_factors=fb.priority_factors[:1], # only 1
            positive_factors=[], # 0
            personalized_action_plan=[], # 0
            questions_to_discuss_with_clinician=[], # 0
            when_to_seek_professional_help=[], # 0
            evidence=[], # 0
            limitations=fb.limitations,
            disclaimer=fb.disclaimer,
        )
        
        enriched = enrich_and_complete_report(stripped, ctx, ev, norm)
        print("=== ENRICHMENT TEST RESULTS ===")
        print(f"Priority Factors: {len(enriched.priority_factors)}")
        print(f"Positive Factors: {len(enriched.positive_factors)}")
        print(f"Action Plan: {len(enriched.personalized_action_plan)}")
        print(f"Clinician Questions: {len(enriched.questions_to_discuss_with_clinician)}")
        print(f"Professional Help: {len(enriched.when_to_seek_professional_help)}")
        print(f"Evidence: {len(enriched.evidence)}")
        
        # Verify schema dump
        dump = enriched.model_dump(mode="json")
        legacy = new_report_to_legacy_view(enriched)
        print("Model dump & legacy view created successfully without error.")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
