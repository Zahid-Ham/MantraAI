import React, { useEffect, useState, useMemo, useRef } from 'react';
import { apiRequest } from '../config/api';
import AppShell from '../components/layout/AppShell';

export const FIELD_LABEL_MAP = {
  // Reproductive History & Symptoms
  known_varicocele: 'Varicocele history',
  ejaculation_concerns: 'Ejaculation concern',
  prior_sti_history: 'Previous STI history',
  scrotal_or_groin_injury: 'Previous groin/scrotal injury',
  childhood_disease_mumps: 'History of childhood mumps',
  libido_changes: 'Libido & desire level',
  sexual_abstinence_period_days: 'Abstinence window',

  // Sexual & Psychosexual Wellbeing
  masturbation_control: 'Control over masturbation habits',
  spectatoring_self_monitoring: 'Performance self-monitoring',
  partnered_sexual_difficulty: 'Sexual difficulty reported',
  genital_self_image_concern: 'Genital self-image concern',
  pornography_driven_performance_standard: 'Pornography-related performance expectations',
  pornography_use_frequency: 'Pornography viewing frequency',
  pornography_frequency_weekly: 'Pornography viewing frequency',
  perceived_control_over_use: 'Perceived control over pornography use',
  use_as_emotional_coping: 'Pornography use as emotional coping',
  escalation_pattern: 'Content escalation pattern',
  negative_consequences_noticed: 'Negative consequences noticed',
  attempts_to_cut_down_failed: 'Attempts to reduce use',
  daily_time_on_sexual_content: 'Daily time on digital content',
  masturbation_frequency: 'Masturbation frequency',
  masturbation_frequency_weekly: 'Masturbation frequency',
  masturbation_frequency_change: 'Masturbation frequency change',
  masturbation_functional_impact: 'Daily functional impact',
  masturbation_physical_discomfort: 'Physical discomfort reported',
  masturbation_emotional_coping: 'Masturbation as emotional coping',
  anticipatory_anxiety_before_sex: 'Anticipatory anxiety before intimacy',
  primary_fear_type: 'Primary intimacy concern',
  sexual_avoidance_due_to_fear: 'Intimacy avoidance due to anxiety',
  partner_comparison_porn_vs_reality: 'Partner comparison with media',
  cognitive_self_monitoring_during_sex: 'Performance self-monitoring during intimacy',
  history_of_unexpected_sexual_difficulty: 'History of unexpected sexual difficulty',
  partnered_sexual_history: 'Partnered sexual history',
  recent_partnered_sex: 'Recent partnered intimacy',

  // Mental Health & Stress Proxies
  daily_work_hours: 'Daily work duration',
  perceived_stress_pss10: 'Brief perceived stress proxy indicator',
  gad7_score: 'Brief anxiety questionnaire proxy indicator',
  phq9_score: 'Brief depression questionnaire proxy indicator',
  sleep_quality_psqi_proxy: 'Sleep quality indicator',
  sleep_quality: 'Sleep quality',
  sleep_duration_hours: 'Daily sleep duration',
  sleep_duration: 'Daily sleep duration',
  irregular_sleep: 'Sleep regularity',
  primary_stress_coping_method: 'Primary stress coping method',
  emotional_regulation_ability: 'Emotional regulation ability',
  sleep_as_escape: 'Sleep as coping mechanism',
  substance_use_under_stress: 'Substance use under stress',
  mindfulness_or_meditation_practice: 'Mindfulness / meditation practice',
  relationship_satisfaction: 'Relationship satisfaction',
  perceived_loneliness_ucla3: 'Social connection / Loneliness indicator',
  family_communication_comfort: 'Family communication comfort',
  peer_pressure_sexual_behavior: 'Peer pressure regarding intimacy',
  general_body_satisfaction: 'General body satisfaction',
  physique_muscularity_pressure: 'Muscularity pressure',
  social_media_body_comparison_frequency: 'Social media body comparison',

  // Lifestyle & Nutrition
  sitting_duration_hours: 'Daily sitting duration',
  hours_sitting_per_day: 'Daily sitting duration',
  physical_activity_level: 'Physical activity level',
  diet_type: 'Dietary pattern',
  dietary_pattern: 'Dietary pattern',
  fruit_veg_intake: 'Fruit & vegetable intake',
  processed_food_frequency: 'Processed food frequency',
  fried_food_frequency: 'Fried food frequency',
  soy_phytoestrogen_intake: 'Soy / phytoestrogen intake',
  water_intake: 'Daily water intake',
  daily_water_intake_liters: 'Daily water intake',
  supplement_use: 'Dietary supplement use',

  // Heat & Environmental Exposures
  laptop_on_lap_usage: 'Laptop placement habits',
  laptop_on_lap: 'Laptop placement habits',
  mobile_phone_placement: 'Mobile phone carrying placement',
  tight_underwear_usage: 'Underwear fit / heat retention',
  underwear_type: 'Underwear fit / heat retention',
  hot_bath_sauna_frequency: 'Heat exposure (hot baths / saunas)',
  hot_bath_frequency: 'Heat exposure (hot baths)',
  working_in_hot_conditions: 'Occupational heat conditions',
  cycling_hours_per_week: 'Weekly cycling duration',
  proximity_to_industrial_or_traffic: 'Industrial / traffic exposure proximity',
  pesticide_occupational_exposure: 'Pesticide / agrochemical exposure',
  heavy_metal_occupational_exposure: 'Heavy metal / welding exposure',
  plastic_use_hot_food_water: 'Plastic usage with hot food/beverages',
  emf_radiation_at_work: 'Workplace EMF / RF exposure',

  // Substance & Medication Use
  smoking_status: 'Smoking status',
  alcohol_frequency: 'Alcohol consumption',
  recreational_drug_use: 'Recreational substance use',
  anabolic_steroid_use: 'Anabolic steroid history',
  finasteride_use: 'Finasteride / 5-ARI history',
  antidepressant_use_ssri: 'SSRI medication history',
  antihypertensive_use: 'Blood pressure medication history',
  chemotherapy_history: 'Chemotherapy / radiation history',
  other_long_term_medication: 'Other long-term medications',

  // Demographics
  age_years: 'Age',
  bmi: 'Body Mass Index (BMI)',
  bmi_category: 'BMI category',
  city_region: 'Location / Region',
  residential_area_type: 'Residential environment',
  occupation_type: 'Occupation type',
  education_level: 'Education level',
  relationship_status: 'Relationship status',
};

export const formatReportedContextItem = (item) => {
  if (!item) return '';
  if (typeof item !== 'string') {
    if (typeof item === 'object' && item !== null) {
      const k = item.key || item.id || item.field || '';
      const v = item.value || item.response || '';
      const label = FIELD_LABEL_MAP[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return v ? `${label}: ${v}` : label;
    }
    return String(item);
  }

  const str = item.trim();

  // If item is formatted as key: value (e.g. "known_varicocele: Unsure" or "phq9_score: 4")
  if (str.includes(':')) {
    const colonIdx = str.indexOf(':');
    const rawKey = str.slice(0, colonIdx).trim();
    const rawVal = str.slice(colonIdx + 1).trim();

    // Check if rawKey is a known technical key or snake_case key
    if (FIELD_LABEL_MAP[rawKey] || /^[a-z0-9_]+$/.test(rawKey)) {
      // Special handling for proxy scores
      if (rawKey === 'phq9_score') {
        return `Brief depression questionnaire proxy indicator: ${rawVal}`;
      }
      if (rawKey === 'gad7_score') {
        return `Brief anxiety questionnaire proxy indicator: ${rawVal}`;
      }
      if (rawKey === 'perceived_stress_pss10') {
        return `Brief perceived stress questionnaire proxy indicator: ${rawVal}`;
      }

      const humanLabel = FIELD_LABEL_MAP[rawKey] || rawKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${humanLabel}: ${rawVal}`;
    }
  }

  // Replace any standalone snake_case keys embedded inside strings
  let cleanStr = str;
  for (const [key, label] of Object.entries(FIELD_LABEL_MAP)) {
    if (cleanStr.includes(key)) {
      cleanStr = cleanStr.split(key).join(label);
    }
  }

  return cleanStr;
};

export default function ReportViewer({ onNavigateHome }) {
  const [report, setReport] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('report-overview');
  const isNavigatingRef = useRef(false);

  // Extract session ID from hash query parameters (#report?id=...)
  const getSessionId = () => {
    try {
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const queryStr = hash.split('?')[1];
        const params = new URLSearchParams(queryStr);
        return params.get('id');
      }
    } catch {
      return null;
    }
    return null;
  };

  const sessId = getSessionId();

  useEffect(() => {
    if (!sessId) {
      setError('Invalid report request parameters.');
      setLoading(false);
      return;
    }

    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError('');
        const [reportData, resultData] = await Promise.all([
          apiRequest(`/api/v1/assessments/${sessId}/report`),
          apiRequest(`/api/v1/assessments/${sessId}/results`).catch(() => null),
        ]);
        setReport(reportData);
        setResult(resultData);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to fetch the requested report details. Please try again or return to My Reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [sessId]);

  // Normalized data structures consumed across all sections
  const {
    priorityFactors,
    positiveFactors,
    actionPlan,
    clinicianQuestions,
    helpItems,
    evidenceReferences,
    reproductiveHealth,
    sexualHealth,
    mentalWellness,
    lifestyleWellness,
    environmentalExposure,
    substanceMedication,
    executiveSummary,
    limitationsData,
    disclaimerText,
  } = useMemo(() => {
    if (!report) {
      return {
        priorityFactors: [],
        positiveFactors: [],
        actionPlan: [],
        clinicianQuestions: [],
        helpItems: [],
        evidenceReferences: [],
        reproductiveHealth: null,
        sexualHealth: null,
        mentalWellness: null,
        lifestyleWellness: null,
        environmentalExposure: null,
        substanceMedication: null,
        executiveSummary: null,
        limitationsData: null,
        disclaimerText: '',
      };
    }

    // Priority Factors: modern priority_factors or legacy key_findings
    const rawPriority = Array.isArray(report.priority_factors) && report.priority_factors.length > 0
      ? report.priority_factors
      : (Array.isArray(report.key_findings) ? report.key_findings : []);

    // Positive Factors: modern array of objects or legacy array of strings
    const rawPositive = Array.isArray(report.positive_factors) ? report.positive_factors : [];

    // Action Plan: modern personalized_action_plan or legacy priority_actions
    const rawActions = Array.isArray(report.personalized_action_plan) && report.personalized_action_plan.length > 0
      ? report.personalized_action_plan
      : (Array.isArray(report.priority_actions) ? report.priority_actions : []);

    // Clinician Questions: modern array of objects or array of strings
    const rawQuestions = Array.isArray(report.questions_to_discuss_with_clinician)
      ? report.questions_to_discuss_with_clinician
      : [];

    // When to seek help: modern array of objects or array of strings
    const rawHelp = Array.isArray(report.when_to_seek_professional_help)
      ? report.when_to_seek_professional_help
      : [];

    // Evidence References
    const rawEvidence = Array.isArray(report.evidence) ? report.evidence : [];

    // Domains
    const rep = report.reproductive_health || null;
    const sex = report.sexual_health || null;
    const men = report.mental_behavioral_wellness || report.mental_wellbeing || null;
    const life = report.lifestyle_wellness || report.lifestyle || null;
    const env = report.environmental_exposure || null;
    const sub = report.substance_medication || null;

    // Summary
    const exec = report.executive_summary || report.summary || null;

    // Limitations & Disclaimer
    const lim = report.limitations || null;
    const disc = report.disclaimer || 'MantraAI is an educational pre-clinical screening and health intelligence platform. It does NOT provide medical diagnoses, treatment plans, or fertility probability scores. All insights are for informational purposes to guide constructive discussion with qualified healthcare professionals.';

    return {
      priorityFactors: rawPriority,
      positiveFactors: rawPositive,
      actionPlan: rawActions,
      clinicianQuestions: rawQuestions,
      helpItems: rawHelp,
      evidenceReferences: rawEvidence,
      reproductiveHealth: rep,
      sexualHealth: sex,
      mentalWellness: men,
      lifestyleWellness: life,
      environmentalExposure: env,
      substanceMedication: sub,
      executiveSummary: exec,
      limitationsData: lim,
      disclaimerText: disc,
    };
  }, [report]);

  // Derived metrics from normalized data
  const metrics = useMemo(() => ({
    priorityCount: priorityFactors.length,
    positiveCount: positiveFactors.length,
    actionCount: actionPlan.length,
    evidenceCount: evidenceReferences.length,
  }), [priorityFactors, positiveFactors, actionPlan, evidenceReferences]);

  // Formatted report date
  const formattedDate = useMemo(() => {
    if (!report) return 'October 2, 2026';
    const rawDate = report.report_metadata?.generated_at || result?.completed_at;
    if (rawDate) {
      try {
        return new Date(rawDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        // fallback to default
      }
    }
    return 'October 2, 2026';
  }, [report, result]);

  // Model & version metadata
  const modelName = report?.report_metadata?.model_name || report?.model_name || 'openai/gpt-oss-120b';
  const reportVersion = report?.report_metadata?.report_version || '2.0';

  // Section navigation tabs
  const navTabs = [
    { id: 'report-overview', label: 'Overview' },
    { id: 'report-reproductive-health', label: 'Reproductive Health' },
    { id: 'report-sexual-health', label: 'Sexual Health' },
    { id: 'report-mental-wellness', label: 'Mental Wellness' },
    { id: 'report-lifestyle', label: 'Lifestyle' },
    { id: 'report-environment', label: 'Environment' },
    { id: 'report-substance-use', label: 'Substance Use' },
    { id: 'report-action-plan', label: 'Action Plan' },
    { id: 'report-clinician-questions', label: 'Clinician Questions' },
    { id: 'report-evidence', label: 'Evidence' },
  ];

  // Reliable scroll navigation supporting both window and inner scroll containers
  const scrollToSection = (id) => {
    setActiveTab(id);
    isNavigatingRef.current = true;
    const element = document.getElementById(id);
    if (element) {
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        // 130px accounts for top fixed/sticky headers
        const offsetPosition = elementRect.top - containerRect.top + scrollContainer.scrollTop - 130;
        scrollContainer.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      } else {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: Math.max(0, elementPosition - 130),
          behavior: 'smooth'
        });
      }
    }
    // Release navigation lock after smooth scroll completes
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 800);
  };

  // Scroll spy to update active tab smoothly based on section visibility
  useEffect(() => {
    if (loading || !report) return;

    const sectionIds = [
      'report-overview',
      'report-reproductive-health',
      'report-sexual-health',
      'report-mental-wellness',
      'report-lifestyle',
      'report-environment',
      'report-substance-use',
      'report-action-plan',
      'report-clinician-questions',
      'report-evidence',
    ];

    const scrollContainer = document.querySelector('.overflow-y-auto') || window;

    const handleScroll = () => {
      if (isNavigatingRef.current) return;

      const container = document.querySelector('.overflow-y-auto');
      if (container && (container.scrollHeight - container.scrollTop - container.clientHeight < 60)) {
        setActiveTab(sectionIds[sectionIds.length - 1]);
        return;
      }

      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 220) {
            current = id;
          }
        }
      }
      setActiveTab(current);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading, report]);

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <AppShell currentTab="reports" onNavigateHome={onNavigateHome}>
      {/* Print Styles for clean, complete multi-page PDF export */}
      <style>{`
        @media print {
          header, aside, .no-print, button, nav {
            display: none !important;
          }
          html, body, main, #root {
            background: #FFFFFF !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          .print-card {
            border: 1px solid #E5E7EB !important;
            box-shadow: none !important;
            break-inside: auto !important;
            page-break-inside: auto !important;
            overflow: visible !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .grid {
            display: block !important;
          }
          .grid > * {
            margin-bottom: 12px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 font-sans">
        
        {/* Top Breadcrumb & Navigation */}
        <div className="flex items-center justify-between no-print">
          <a
            href="#history"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '#history';
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57534E] hover:text-[#1E3A2B] transition-colors group cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#78716C] group-hover:text-[#1E3A2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to My Reports</span>
          </a>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-[#E8E5DF] rounded-3xl p-12 text-center space-y-4 shadow-xs my-8">
            <div className="w-12 h-12 rounded-full border-3 border-[#1E3A2B] border-t-transparent animate-spin mx-auto" />
            <div className="text-sm font-semibold text-[#1C1917]">
              Loading your personalized wellness report...
            </div>
            <p className="text-xs text-[#78716C]">
              Retrieving evidence synthesis and health domain analysis.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white border border-[#FEE2E2] rounded-3xl p-8 text-center space-y-4 shadow-xs my-8 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1C1917]">Report Unavailable</h3>
            <p className="text-xs text-[#57534E] leading-relaxed">{error}</p>
            <div className="flex gap-3 justify-center pt-2">
              <a
                href="#history"
                className="px-5 py-2.5 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#14281D] transition-colors"
              >
                Return to My Reports
              </a>
            </div>
          </div>
        )}

        {/* Report Content */}
        {!loading && !error && report && (
          <>
            {/* 1. Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-3.5xl font-serif text-[#1C1917] tracking-tight font-normal">
                  Reproductive Health & Wellness Report
                </h1>
                
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-[#78716C] mt-2">
                  <span className="flex items-center gap-1.5 font-medium text-[#57534E]">
                    <svg className="w-3.5 h-3.5 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formattedDate}
                  </span>
                  
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF5EE] text-[#1E3A2B] border border-[#D1E7DD]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2B]" />
                    Completed
                  </span>

                  <span className="text-[#D1D5DB]">•</span>
                  <span className="text-[11px] text-[#78716C]">
                    Model: <span className="text-[#57534E] font-medium">{modelName}</span>
                  </span>

                  <span className="text-[#D1D5DB]">•</span>
                  <span className="text-[11px] text-[#78716C]">
                    Report {reportVersion.startsWith('v') ? reportVersion : `v${reportVersion}`}
                  </span>
                </div>
              </div>

              {/* Download PDF Action */}
              <div className="shrink-0 no-print">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#F9FAFB] border border-[#D1D5DB] text-[#1C1917] text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer hover:border-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A2B]"
                >
                  <svg className="w-4 h-4 text-[#57534E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* 2. Report Navigation Tabs */}
            <div className="sticky top-0 md:top-16 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 bg-[#FAF9F6]/95 backdrop-blur-xs border-b border-[#E8E5DF] no-print">
              <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                {navTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => scrollToSection(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#1E3A2B] text-white shadow-xs font-semibold'
                          : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F0ECE4]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 3. Executive Summary Card */}
            <div id="report-overview" className="scroll-mt-32 bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 shadow-xs print-card relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Text Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1C1917]">
                      Executive Summary
                    </h2>
                  </div>

                  {executiveSummary?.headline && (
                    <h3 className="text-sm sm:text-base font-semibold text-[#1E3A2B]">
                      {executiveSummary.headline}
                    </h3>
                  )}

                  <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                    {executiveSummary?.overview || 'Your assessment suggests a structured foundation for reproductive and overall health, with specific areas identified for proactive attention.'}
                  </p>

                  {/* Themes / Areas if present */}
                  {executiveSummary?.key_themes && executiveSummary.key_themes.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {executiveSummary.key_themes.map((theme, idx) => (
                        <span key={idx} className="text-[11px] px-2.5 py-1 bg-[#F5F2EB] text-[#57534E] font-medium rounded-md border border-[#EAE5DD]">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Serene Botanical / Nature Illustration */}
                <div className="w-full sm:w-64 lg:w-72 h-36 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-b from-[#F2F7F4] to-[#E5EFE8] border border-[#E0ECE3] shrink-0 relative flex items-center justify-center select-none">
                  <svg className="w-full h-full object-cover" viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="320" height="160" fill="#EBF3ED" />
                    <circle cx="240" cy="50" r="30" fill="#FCE7D2" opacity="0.8" />
                    <path d="M0 120 Q80 80 160 105 Q240 130 320 90 L320 160 L0 160 Z" fill="#BED9C6" opacity="0.6" />
                    <path d="M0 130 Q100 95 200 125 Q270 145 320 115 L320 160 L0 160 Z" fill="#95C2A3" opacity="0.7" />
                    <path d="M0 138 Q160 130 320 138 L320 160 L0 160 Z" fill="#D3E8DC" />
                    <path d="M260 160 C270 110 290 85 320 95 L320 160 Z" fill="#2E543C" opacity="0.9" />
                    <path d="M280 160 C290 120 305 100 320 110 L320 160 Z" fill="#1E3A2B" />
                    <path d="M-10 160 C15 125 35 110 70 130 L70 160 Z" fill="#3D6B4E" opacity="0.8" />
                  </svg>
                </div>

              </div>
            </div>

            {/* 4. Key Highlights Metrics */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#1E3A2B]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">Key Highlights</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                
                {/* 1. Priority Factors */}
                <div 
                  onClick={() => scrollToSection('report-priority-factors')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      {metrics.priorityCount}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#1C1917]">Priority Factors</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5">Areas to focus on</div>
                </div>

                {/* 2. Positive Factors */}
                <div 
                  onClick={() => scrollToSection('report-positive-factors')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF5EE] text-[#1E3A2B] border border-[#D1E7DD] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      {metrics.positiveCount}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#1C1917]">Positive Factors</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5">Strengths to maintain</div>
                </div>

                {/* 3. Key Actions */}
                <div 
                  onClick={() => scrollToSection('report-action-plan')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      {metrics.actionCount}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#1C1917]">Key Actions</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5">Personalized steps</div>
                </div>

                {/* 4. Evidence References */}
                <div 
                  onClick={() => scrollToSection('report-evidence')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      {metrics.evidenceCount}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#1C1917]">Evidence References</div>
                  <div className="text-[11px] text-[#78716C] mt-0.5">Trusted sources</div>
                </div>

              </div>
            </div>

            {/* 5. "Your Health Journey Matters" Context Card */}
            <div className="bg-[#EBF5EE] border border-[#D1E7DD] rounded-2xl p-4 sm:p-5 flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-white text-[#1E3A2B] border border-[#D1E7DD] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917]">
                  Your Health Journey Matters
                </h4>
                <p className="text-[11px] sm:text-xs text-[#374151] mt-1 leading-relaxed">
                  This report provides evidence-informed insights to support your reproductive health and overall wellbeing. Use these insights to make informed decisions and discuss with your healthcare provider.
                </p>
              </div>
            </div>

            {/* 6. Detailed Analysis Grid (6 Primary Domains) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#1E3A2B]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">Detailed Analysis</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Reproductive Health */}
                <div 
                  onClick={() => scrollToSection('report-reproductive-health')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      Reproductive Health
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                      {reproductiveHealth?.summary || 'Insights on reproductive history, hormonal factors, and reproductive function.'}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-[11px] font-bold text-[#1E3A2B] group-hover:translate-x-0.5 transition-transform">
                    <span>View Section</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 2. Sexual Health */}
                <div 
                  onClick={() => scrollToSection('report-sexual-health')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      Sexual Health
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                      {sexualHealth?.summary || 'Analysis of psychosexual factors, performance comfort, and intimacy habits.'}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-[11px] font-bold text-[#1E3A2B] group-hover:translate-x-0.5 transition-transform">
                    <span>View Section</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 3. Mental & Behavioral Wellness */}
                <div 
                  onClick={() => scrollToSection('report-mental-wellness')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      Mental & Behavioral Wellness
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                      {mentalWellness?.summary || 'Assessment of stress, mood, sleep quality, and adaptive coping mechanisms.'}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-[11px] font-bold text-[#1E3A2B] group-hover:translate-x-0.5 transition-transform">
                    <span>View Section</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 4. Lifestyle Wellness */}
                <div 
                  onClick={() => scrollToSection('report-lifestyle')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      Lifestyle Wellness
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                      {lifestyleWellness?.summary || 'Physical activity, nutrition, dietary habits, and hydration routines.'}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-[11px] font-bold text-[#1E3A2B] group-hover:translate-x-0.5 transition-transform">
                    <span>View Section</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 5. Environmental Exposure */}
                <div 
                  onClick={() => scrollToSection('report-environment')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      Environmental Exposure
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                      {environmentalExposure?.summary || 'Thermal, occupational, electronic, and ambient chemical exposures.'}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-[11px] font-bold text-[#1E3A2B] group-hover:translate-x-0.5 transition-transform">
                    <span>View Section</span>
                    <span>→</span>
                  </div>
                </div>

                {/* 6. Substance & Medication Use */}
                <div 
                  onClick={() => scrollToSection('report-substance-use')}
                  className="bg-white border border-[#E8E5DF] hover:border-[#D1D5DB] rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FDF2F8] text-[#DB2777] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                      Substance & Medication Use
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                      {substanceMedication?.summary || 'Analysis of tobacco, alcohol, supplements, and prescription medications.'}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-[11px] font-bold text-[#1E3A2B] group-hover:translate-x-0.5 transition-transform">
                    <span>View Section</span>
                    <span>→</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 7. Dedicated Domain Detail Sections */}
            <div className="space-y-6 pt-4">
              
              {/* Domain 1: Reproductive Health Detail */}
              <div id="report-reproductive-health" className="scroll-mt-32 bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-7 shadow-xs print-card print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917]">Reproductive Health Domain</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#78716C] bg-[#F5F2EB] px-2.5 py-0.5 rounded-full">
                    Domain 1
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                  {reproductiveHealth?.summary || 'No specific observations were generated for this domain in this assessment.'}
                </p>

                {reproductiveHealth?.reported_context && reproductiveHealth.reported_context.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Reported Context:</div>
                    <ul className="space-y-1.5">
                      {reproductiveHealth.reported_context.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78716C] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {reproductiveHealth?.relevant_factors && reproductiveHealth.relevant_factors.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Key Observations:</div>
                    <ul className="space-y-1.5">
                      {reproductiveHealth.relevant_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2B] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(factor)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {reproductiveHealth?.evidence_refs && reproductiveHealth.evidence_refs.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">Evidence:</span>
                    {reproductiveHealth.evidence_refs.map((refId, idx) => (
                      <span key={idx} className="text-[10px] bg-[#EBF5EE] text-[#1E3A2B] px-2 py-0.5 rounded font-mono font-medium">
                        {refId}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Domain 2: Sexual Health Detail */}
              <div id="report-sexual-health" className="scroll-mt-32 bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-7 shadow-xs print-card print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917]">Sexual Health Domain</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#78716C] bg-[#F5F2EB] px-2.5 py-0.5 rounded-full">
                    Domain 2
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                  {sexualHealth?.summary || 'No specific observations were generated for this domain in this assessment.'}
                </p>

                {sexualHealth?.reported_context && sexualHealth.reported_context.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Reported Context:</div>
                    <ul className="space-y-1.5">
                      {sexualHealth.reported_context.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78716C] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {sexualHealth?.relevant_factors && sexualHealth.relevant_factors.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Key Observations:</div>
                    <ul className="space-y-1.5">
                      {sexualHealth.relevant_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9333EA] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(factor)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {sexualHealth?.evidence_refs && sexualHealth.evidence_refs.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">Evidence:</span>
                    {sexualHealth.evidence_refs.map((refId, idx) => (
                      <span key={idx} className="text-[10px] bg-[#FAF5FF] text-[#9333EA] px-2 py-0.5 rounded font-mono font-medium">
                        {refId}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Domain 3: Mental & Behavioral Wellness Detail */}
              <div id="report-mental-wellness" className="scroll-mt-32 bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-7 shadow-xs print-card print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917]">Mental & Behavioral Wellness Domain</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#78716C] bg-[#F5F2EB] px-2.5 py-0.5 rounded-full">
                    Domain 3
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                  {mentalWellness?.summary || 'No specific observations were generated for this domain in this assessment.'}
                </p>

                {mentalWellness?.reported_context && mentalWellness.reported_context.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Reported Context:</div>
                    <ul className="space-y-1.5">
                      {mentalWellness.reported_context.map((item, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78716C] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {mentalWellness?.relevant_factors && mentalWellness.relevant_factors.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Key Observations:</div>
                    <ul className="space-y-1.5">
                      {mentalWellness.relevant_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(factor)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {mentalWellness?.evidence_refs && mentalWellness.evidence_refs.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">Evidence:</span>
                    {mentalWellness.evidence_refs.map((refId, idx) => (
                      <span key={idx} className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded font-mono font-medium">
                        {refId}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Domain 4: Lifestyle Wellness Detail */}
              <div id="report-lifestyle" className="scroll-mt-32 bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-7 shadow-xs print-card print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917]">Lifestyle Wellness Domain</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#78716C] bg-[#F5F2EB] px-2.5 py-0.5 rounded-full">
                    Domain 4
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                  {lifestyleWellness?.summary || 'No specific observations were generated for this domain in this assessment.'}
                </p>

                {lifestyleWellness?.relevant_factors && lifestyleWellness.relevant_factors.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Key Observations:</div>
                    <ul className="space-y-1.5">
                      {lifestyleWellness.relevant_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2B] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(factor)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lifestyleWellness?.evidence_refs && lifestyleWellness.evidence_refs.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">Evidence:</span>
                    {lifestyleWellness.evidence_refs.map((refId, idx) => (
                      <span key={idx} className="text-[10px] bg-[#EBF5EE] text-[#1E3A2B] px-2 py-0.5 rounded font-mono font-medium">
                        {refId}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Domain 5: Environmental Exposure Detail */}
              <div id="report-environment" className="scroll-mt-32 bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-7 shadow-xs print-card print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917]">Environmental Exposure Domain</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#78716C] bg-[#F5F2EB] px-2.5 py-0.5 rounded-full">
                    Domain 5
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                  {environmentalExposure?.summary || 'No specific observations were generated for this domain in this assessment.'}
                </p>

                {environmentalExposure?.relevant_factors && environmentalExposure.relevant_factors.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Key Observations:</div>
                    <ul className="space-y-1.5">
                      {environmentalExposure.relevant_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(factor)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {environmentalExposure?.evidence_refs && environmentalExposure.evidence_refs.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">Evidence:</span>
                    {environmentalExposure.evidence_refs.map((refId, idx) => (
                      <span key={idx} className="text-[10px] bg-[#FFFBEB] text-[#D97706] px-2 py-0.5 rounded font-mono font-medium">
                        {refId}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Domain 6: Substance & Medication Detail */}
              <div id="report-substance-use" className="scroll-mt-32 bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-7 shadow-xs print-card print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FDF2F8] text-[#DB2777] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917]">Substance & Medication Use Domain</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#78716C] bg-[#F5F2EB] px-2.5 py-0.5 rounded-full">
                    Domain 6
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                  {substanceMedication?.summary || 'No specific observations were generated for this domain in this assessment.'}
                </p>

                {substanceMedication?.relevant_factors && substanceMedication.relevant_factors.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-[#1C1917]">Key Observations:</div>
                    <ul className="space-y-1.5">
                      {substanceMedication.relevant_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-[#57534E] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DB2777] mt-1.5 shrink-0" />
                          <span>{formatReportedContextItem(factor)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {substanceMedication?.evidence_refs && substanceMedication.evidence_refs.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">Evidence:</span>
                    {substanceMedication.evidence_refs.map((refId, idx) => (
                      <span key={idx} className="text-[10px] bg-[#FDF2F8] text-[#DB2777] px-2 py-0.5 rounded font-mono font-medium">
                        {refId}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 8. Priority Factors Section */}
            <div id="report-priority-factors" className="scroll-mt-32 space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#DC2626]">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">Priority Factors</h3>
                </div>
                <span className="text-xs font-semibold text-[#78716C]">
                  {priorityFactors.length} {priorityFactors.length === 1 ? 'factor' : 'factors'} identified
                </span>
              </div>

              {priorityFactors.length > 0 ? (
                <div className="space-y-3">
                  {priorityFactors.map((factor, idx) => {
                    const isObj = typeof factor === 'object' && factor !== null;
                    const title = isObj ? (factor.title || factor.name || 'Priority Factor') : String(factor || 'Priority Factor');
                    const desc = isObj ? (factor.description || factor.explanation || '') : '';
                    const domain = isObj ? (factor.domain || '') : '';
                    const severity = isObj ? (factor.severity || 'moderate') : 'moderate';
                    const evidenceRefs = isObj ? (factor.evidence_refs || (Array.isArray(factor.evidence) ? factor.evidence : [])) : [];

                    return (
                      <div key={idx} className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-xs print-card print-avoid-break space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#1C1917]">
                            {formatReportedContextItem(title)}
                          </h4>
                          <div className="flex items-center gap-2">
                            {domain && (
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#57534E] bg-[#F5F2EB] px-2.5 py-0.5 rounded-md border border-[#EAE5DD]">
                                {domain.replace(/_/g, ' ')}
                              </span>
                            )}
                            {severity && (
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${
                                severity === 'notable'
                                  ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#DC2626]'
                                  : severity === 'moderate'
                                  ? 'bg-[#FFFBEB] border-[#FEF3C7] text-[#D97706]'
                                  : 'bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]'
                              }`}>
                                {severity}
                              </span>
                            )}
                          </div>
                        </div>

                        {desc && (
                          <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                            {formatReportedContextItem(desc)}
                          </p>
                        )}

                        {evidenceRefs && evidenceRefs.length > 0 && (
                          <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-[#F5F2EB]">
                            <span className="text-[10px] text-[#78716C] font-semibold">Evidence / Source:</span>
                            {evidenceRefs.map((refId, i) => (
                              <span key={i} className="text-[10px] font-mono bg-[#EBF5EE] text-[#1E3A2B] px-1.5 py-0.5 rounded">
                                {refId}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 text-xs text-[#78716C] italic">
                  No priority clinical or lifestyle risks were identified from your assessment inputs.
                </div>
              )}
            </div>

            {/* 9. Positive Factors Section */}
            <div id="report-positive-factors" className="scroll-mt-32 space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#1E3A2B]">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">Positive Factors & Strengths</h3>
                </div>
                <span className="text-xs font-semibold text-[#78716C]">
                  {positiveFactors.length} {positiveFactors.length === 1 ? 'strength' : 'strengths'} identified
                </span>
              </div>

              {positiveFactors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {positiveFactors.map((factor, idx) => {
                    const isObj = typeof factor === 'object' && factor !== null;
                    const title = isObj ? (factor.title || factor.name || '') : '';
                    const desc = isObj ? (factor.description || factor.explanation || '') : String(factor || '');
                    const domain = isObj ? (factor.domain || '') : '';
                    const evidenceRefs = isObj ? (factor.evidence_refs || []) : [];

                    if (!title && !desc) return null;

                    return (
                      <div key={idx} className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-xs print-card print-avoid-break space-y-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1 space-y-1">
                            {title ? (
                              <>
                                <h4 className="text-xs sm:text-sm font-bold text-[#1C1917]">
                                  {formatReportedContextItem(title)}
                                </h4>
                                {desc && (
                                  <p className="text-xs text-[#57534E] leading-relaxed">
                                    {formatReportedContextItem(desc)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs sm:text-[13px] text-[#1C1917] font-medium leading-relaxed">
                                {formatReportedContextItem(desc)}
                              </p>
                            )}
                          </div>
                        </div>

                        {(domain || (evidenceRefs && evidenceRefs.length > 0)) && (
                          <div className="pt-2 flex items-center justify-between text-[10px] text-[#78716C] border-t border-[#F5F2EB]">
                            {domain ? (
                              <span className="font-semibold uppercase tracking-wider text-[#57534E]">{domain.replace(/_/g, ' ')}</span>
                            ) : <span />}
                            {evidenceRefs && evidenceRefs.length > 0 && (
                              <span className="font-mono text-[#1E3A2B] bg-[#EBF5EE] px-1.5 py-0.5 rounded font-medium">{evidenceRefs[0]}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 text-xs text-[#78716C] italic">
                  Positive protective factors and baseline strengths will appear here as your profile develops.
                </div>
              )}
            </div>

            {/* 10. Personalized Action Plan */}
            <div id="report-action-plan" className="scroll-mt-32 space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#2563EB]">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">Personalized Action Plan</h3>
                </div>
                <span className="text-xs font-semibold text-[#78716C]">
                  {actionPlan.length} evidence-informed steps
                </span>
              </div>

              {actionPlan.length > 0 ? (
                <div className="space-y-3">
                  {actionPlan.map((act, idx) => {
                    const isObj = typeof act === 'object' && act !== null;
                    const title = isObj ? (act.title || act.action || 'Recommended Action') : String(act || 'Recommended Action');
                    const desc = isObj ? (act.description || act.action || '') : '';
                    const domain = isObj ? (act.domain || act.area || '') : '';
                    const rationale = isObj ? (act.rationale || act.reason || '') : '';
                    const timeframe = isObj ? (act.timeframe || '') : '';
                    const actionType = isObj ? (act.action_type || '') : '';
                    const priorityNum = isObj ? (act.priority || idx + 1) : idx + 1;
                    const evidenceRefs = isObj ? (act.evidence_refs || []) : [];

                    return (
                      <div key={idx} className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-xs print-card print-avoid-break flex items-start gap-4">
                        {/* Step Number */}
                        <div className="w-9 h-9 rounded-xl bg-[#F5F2EB] border border-[#EAE5DD] text-[#1E3A2B] flex items-center justify-center shrink-0 font-bold text-sm">
                          {String(priorityNum).padStart(2, '0')}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-[#1C1917]">
                              {formatReportedContextItem(title)}
                            </h4>
                            <div className="flex items-center gap-1.5">
                              {timeframe && (
                                <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] px-2.5 py-0.5 rounded-full">
                                  {timeframe}
                                </span>
                              )}
                              {(actionType || domain) && (
                                <span className="text-[10px] font-semibold text-[#57534E] bg-[#F5F2EB] px-2.5 py-0.5 rounded-full capitalize">
                                  {actionType || domain.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </div>

                          {desc && desc !== title && (
                            <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed">
                              {formatReportedContextItem(desc)}
                            </p>
                          )}

                          {rationale && (
                            <div className="pt-2 text-[11px] text-[#78716C] border-t border-[#F5F2EB] flex items-start gap-1.5">
                              <span className="font-bold text-[#1C1917] shrink-0">Rationale:</span>
                              <span className="leading-relaxed">{formatReportedContextItem(rationale)}</span>
                            </div>
                          )}

                          {evidenceRefs && evidenceRefs.length > 0 && (
                            <div className="pt-1.5 flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-[#78716C] font-semibold">Evidence:</span>
                              {evidenceRefs.map((refId, i) => (
                                <span key={i} className="text-[10px] font-mono bg-[#EBF5EE] text-[#1E3A2B] px-1.5 py-0.5 rounded">
                                  {refId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 text-xs text-[#78716C] italic">
                  No specific action items were generated for this assessment profile.
                </div>
              )}
            </div>

            {/* 11. Questions to Discuss With Your Clinician */}
            <div id="report-clinician-questions" className="scroll-mt-32 space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#1E3A2B]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">
                  Questions to Discuss With Your Clinician
                </h3>
              </div>

              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-xs print-card print-avoid-break space-y-4">
                <p className="text-xs text-[#57534E]">
                  Take these structured discussion prompts to your next consultation with a physician or reproductive specialist:
                </p>

                {clinicianQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {clinicianQuestions.map((q, idx) => {
                      const isObj = typeof q === 'object' && q !== null;
                      const questionText = isObj ? (q.question || q.text || q.title || '') : String(q || '');
                      const domain = isObj ? (q.domain || '') : '';
                      const reason = isObj ? (q.reason || q.context || '') : '';

                      if (!questionText) return null;

                      return (
                        <div key={idx} className="bg-[#FAF9F6] border border-[#EAE5DD] rounded-xl p-4 space-y-1.5 print-avoid-break">
                          <div className="flex items-start gap-2.5">
                            <span className="text-[#1E3A2B] font-bold text-xs mt-0.5">Q{idx + 1}.</span>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917] leading-snug">
                                  {formatReportedContextItem(questionText)}
                                </h4>
                                {domain && (
                                  <span className="text-[10px] uppercase font-medium text-[#78716C] bg-[#F5F2EB] px-2 py-0.5 rounded">
                                    {domain.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                              {reason && (
                                <p className="text-[11px] text-[#78716C] mt-1 leading-relaxed">
                                  <span className="font-semibold text-[#57534E]">Context:</span> {formatReportedContextItem(reason)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#78716C] italic">
                    No specific physician questions generated for this profile.
                  </p>
                )}
              </div>
            </div>

            {/* 12. When to Seek Professional Help */}
            {helpItems.length > 0 && (
              <div id="report-professional-help" className="scroll-mt-32 space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#DC2626]">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">
                    When to Seek Professional Evaluation
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {helpItems.map((item, idx) => {
                    const isObj = typeof item === 'object' && item !== null;
                    const trigger = isObj ? (item.trigger || item.title || item.condition || '') : '';
                    const explanation = isObj ? (item.explanation || item.description || item.guidance || '') : String(item || '');
                    const urgency = isObj ? (item.urgency || 'routine').toLowerCase() : 'routine';

                    if (!trigger && !explanation) return null;

                    return (
                      <div key={idx} className="bg-[#FEF2F2]/40 border border-[#FEE2E2] rounded-2xl p-4 space-y-1.5 print-avoid-break">
                        <div className="flex items-center justify-between gap-2">
                          {trigger ? (
                            <h4 className="text-xs font-bold text-[#991B1B]">
                              {formatReportedContextItem(trigger)}
                            </h4>
                          ) : (
                            <h4 className="text-xs font-bold text-[#991B1B]">
                              Consultation Indicator {idx + 1}
                            </h4>
                          )}
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            urgency === 'prompt'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]'
                              : urgency === 'timely'
                              ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
                              : 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
                          }`}>
                            {urgency}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7F1D1D] leading-relaxed">
                          {formatReportedContextItem(explanation)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 13. Evidence & References */}
            <div id="report-evidence" className="scroll-mt-32 space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#0D9488]">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1C1917]">Evidence & References</h3>
                </div>
                <span className="text-xs font-semibold text-[#78716C]">
                  {evidenceReferences.length} {evidenceReferences.length === 1 ? 'source' : 'sources'} cited
                </span>
              </div>

              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-xs print-card space-y-4">
                {evidenceReferences.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {evidenceReferences.map((ref, idx) => {
                      const isObj = typeof ref === 'object' && ref !== null;
                      const title = isObj ? (ref.title || ref.name || 'Clinical Guideline') : String(ref || 'Clinical Reference');
                      const evidenceId = isObj ? (ref.evidence_id || ref.id || '') : '';
                      const source = isObj ? (ref.source || ref.organization || '') : '';
                      const year = isObj ? (ref.year || '') : '';
                      const sourceIdentifier = isObj ? (ref.source_identifier || ref.identifier || ref.doi || ref.pmid || '') : '';
                      const relevance = isObj ? (ref.relevance || ref.description || '') : '';
                      const url = isObj ? (ref.url || '') : '';

                      return (
                        <div key={idx} className="bg-[#FAF9F6] border border-[#EAE5DD] rounded-xl p-3.5 space-y-2 print-avoid-break">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-[#1C1917] leading-snug">
                              {title}
                            </h4>
                            {evidenceId && (
                              <span className="text-[10px] font-mono font-bold text-[#1E3A2B] bg-[#EBF5EE] px-1.5 py-0.5 rounded shrink-0">
                                {evidenceId}
                              </span>
                            )}
                          </div>

                          {(source || year || sourceIdentifier) && (
                            <div className="text-[11px] text-[#57534E]">
                              {source && <span className="font-semibold">{source}</span>}
                              {year && <span> ({year})</span>}
                              {sourceIdentifier && (
                                <span className="text-[#78716C]"> • {sourceIdentifier}</span>
                              )}
                            </div>
                          )}

                          {relevance && (
                            <p className="text-[11px] text-[#78716C] leading-relaxed italic">
                              {relevance}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {evidenceId && (
                              <a
                                href={`#resources?id=${evidenceId}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E3A2B] hover:underline"
                              >
                                <span>Evidence Hub Summary</span>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </a>
                            )}
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#78716C] hover:text-[#1C1917] hover:underline"
                              >
                                <span>Original Source</span>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#78716C] italic">
                    Authoritative clinical references and guideline provenance from WHO, AUA/ASRM, and EAU guidelines are dynamically linked throughout your report domains and priority recommendations.
                  </p>
                )}
              </div>
            </div>

            {/* 14. Report Limitations */}
            {limitationsData && (
              <div className="bg-[#FAF9F6] border border-[#EAE5DD] rounded-2xl p-5 shadow-xs print-card print-avoid-break space-y-2.5">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                    Methodology & Screening Limitations
                  </h4>
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  {limitationsData.summary || 'This report is based on self-reported questionnaire data and evidence-informed clinical guidelines. It does not replace clinical evaluation, physical examination, laboratory testing, or semen analysis.'}
                </p>
                {limitationsData.items && limitationsData.items.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {limitationsData.items.map((lim, i) => (
                      <li key={i} className="text-[11px] text-[#78716C] flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#78716C] mt-1.5 shrink-0" />
                        <span>{formatReportedContextItem(lim)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 15. Disclaimer */}
            <div className="bg-[#FAF9F6] border border-[#EAE5DD] rounded-2xl p-5 text-center space-y-1.5 print-card print-avoid-break">
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#78716C]">
                Clinical Notice
              </div>
              <p className="text-[11px] text-[#78716C] leading-relaxed max-w-3xl mx-auto">
                {disclaimerText}
              </p>
            </div>

          </>
        )}

      </div>
    </AppShell>
  );
}
