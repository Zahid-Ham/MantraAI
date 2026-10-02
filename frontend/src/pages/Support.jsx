import React, { useState, useMemo } from 'react';
import AppShell from '../components/layout/AppShell';

// Canonical category filters
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'account', label: 'Account & Login' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'reports', label: 'Reports' },
  { id: 'progress', label: 'My Progress' },
  { id: 'resources', label: 'Resources' },
  { id: 'privacy', label: 'Data & Privacy' },
  { id: 'technical', label: 'Technical Support' },
  { id: 'general', label: 'General' },
];

// Quick Help Guides content
const QUICK_HELP_GUIDES = {
  report: {
    id: 'report',
    title: 'Understanding Your Report',
    category: 'Reports',
    summary: 'Learn how to read and make the most of your personalized report.',
    sections: [
      {
        heading: 'Executive Summary & Themes',
        content: 'Your report begins with an executive summary that synthesizes key findings into clear themes, highlights proactive areas for attention, and celebrates existing healthy baseline habits.',
      },
      {
        heading: 'Health Domain Breakdown',
        content: 'Findings are categorized into six canonical wellness domains: Reproductive Health, Sexual Health, Mental & Behavioral Wellbeing, Lifestyle & Nutrition, Environmental Exposures, and Substances & Medications.',
      },
      {
        heading: 'Priority Recommendations & Action Plan',
        content: 'Actionable steps are organized by timeframe (immediate, short-term, ongoing) with transparent scientific rationale to help you discuss relevant factors with your doctor.',
      },
      {
        heading: 'Evidence Citations & Provenance',
        content: 'Every contextual recommendation is linked directly to authoritative clinical guidelines (WHO, AUA/ASRM, EAU) and peer-reviewed literature in the Evidence Hub.',
      },
      {
        heading: 'Methodology Boundaries & Limitations',
        content: 'Reports reflect self-reported questionnaire context only. They do not calculate artificial probability percentages, diagnose diseases, or replace laboratory semen analysis.',
      },
    ],
    actionLink: '#history',
    actionText: 'View My Reports',
  },
  assessment: {
    id: 'assessment',
    title: 'Taking an Assessment',
    category: 'Assessments',
    summary: 'Step-by-step guidance on completing your confidential health questionnaire.',
    sections: [
      {
        heading: 'Purpose of the Questionnaire',
        content: 'The assessment collects structured information across 13 core modules to build a comprehensive wellness and lifestyle context for non-diagnostic educational guidance.',
      },
      {
        heading: 'Progressive Auto-Saving',
        content: 'Your responses are saved as you advance through each question. If you need to step away, you can resume your in-progress session whenever you return.',
      },
      {
        heading: 'Question Navigation & Skipping',
        content: 'You can navigate freely between previous and upcoming sections. Questions adapt conditionally to your specific history and responses.',
      },
      {
        heading: 'Report Compilation',
        content: 'Upon completing all sections, the platform applies deterministic health-context logic, matches authoritative medical guidelines, and compiles your AI-assisted report in seconds.',
      },
    ],
    actionLink: '#assess',
    actionText: 'Take an Assessment',
  },
  progress: {
    id: 'progress',
    title: 'Using My Progress',
    category: 'My Progress',
    summary: 'Learn how your health trends and modifiable factors are tracked over time.',
    sections: [
      {
        heading: 'Baseline vs. Longitudinal Assessments',
        content: 'Your first completed assessment establishes your baseline profile. Successive assessments allow the platform to measure longitudinal changes across your reported wellness factors.',
      },
      {
        heading: 'Contextual Indicators, Not Diagnostic Scores',
        content: 'My Progress displays positive habits and modifiable areas under active attention. It does not calculate arbitrary clinical scores or artificial fertility percentages.',
      },
      {
        heading: 'Action Tracking & Habit Progress',
        content: 'Mark recommended lifestyle habits and focus areas as in progress or completed to monitor your everyday wellness commitments over time.',
      },
    ],
    actionLink: '#progress',
    actionText: 'Go to My Progress',
  },
};

// FAQ Data
const FAQS = [
  {
    id: 'faq-1',
    category: 'general',
    categoryLabel: 'General',
    question: 'What is MantraAI and how does it work?',
    answer: 'MantraAI is an evidence-informed men\'s reproductive health and wellness intelligence platform. It combines structured self-reported assessments, deterministic health-context processing across 6 clinical domains, authoritative evidence retrieval from global medical guidelines, and AI-assisted personalized reporting. MantraAI provides pre-clinical education and care navigation; it does not diagnose medical conditions.',
  },
  {
    id: 'faq-2',
    category: 'reports',
    categoryLabel: 'Reports',
    question: 'How accurate are the reports?',
    answer: 'MantraAI reports are evidence-informed summaries grounded in clinical guidelines from the World Health Organization (WHO), American Urological Association (AUA/ASRM), and European Association of Urology (EAU). However, reports reflect self-reported questionnaire screening data and AI-assisted synthesis. They are non-diagnostic and provide transparent citations so you and your healthcare professional can verify original scientific sources.',
  },
  {
    id: 'faq-3',
    category: 'privacy',
    categoryLabel: 'Data & Privacy',
    question: 'Is my data private and secure?',
    answer: 'Yes. All assessment responses and report endpoints are strictly isolated to your authenticated account. MantraAI enforces token-based security and database user scoping. We never sell or distribute your personal health information to third-party advertisers.',
  },
  {
    id: 'faq-4',
    category: 'assessments',
    categoryLabel: 'Assessments',
    question: 'How often should I take an assessment?',
    answer: 'There is no strict medical requirement. Many users find it helpful to retake an assessment every 1 to 3 months, or after making significant lifestyle, dietary, or routine changes, to observe longitudinal trends in My Progress. For persistent or acute symptoms, consult a qualified healthcare provider promptly.',
  },
  {
    id: 'faq-5',
    category: 'assessments',
    categoryLabel: 'Assessments',
    question: 'What topics are covered in the assessment?',
    answer: 'The assessment covers 13 structured modules: demographics, physical activity and sedentary habits, scrotal heat exposures, dietary patterns, environmental/chemical exposures, stress and mood indicators, reproductive history and symptoms, substance and medication use, digital adult media habits, performance anxiety, body satisfaction, social support, and coping mechanisms.',
  },
  {
    id: 'faq-6',
    category: 'general',
    categoryLabel: 'General',
    question: 'Can MantraAI replace a doctor or medical consultation?',
    answer: 'No. MantraAI is designed strictly for health awareness, pre-clinical self-reflection, education, and care navigation. It does not provide formal medical diagnoses, write prescriptions, or replace clinical laboratory tests (such as semen analysis or hormone profiling) and physician physical examinations.',
  },
  {
    id: 'faq-7',
    category: 'resources',
    categoryLabel: 'Resources',
    question: 'How is the information in Resources selected?',
    answer: 'The Evidence Hub prioritizes consensus clinical guidelines (such as WHO 2024 and AUA/ASRM 2020), peer-reviewed systematic reviews, and indexed scientific literature (PubMed/PMC). All articles are summarized in clear, plain language with standard digital object identifiers (DOIs), PubMed IDs (PMIDs), and direct links to original publications.',
  },
  {
    id: 'faq-8',
    category: 'technical',
    categoryLabel: 'Technical Support',
    question: 'How can I connect my smartwatch or health data in the future?',
    answer: 'Wearable and biometric integration (such as sleep tracking, resting heart rate, and daily activity sync) is planned for a future milestone. When available, it will allow you to optionally combine continuous activity metrics with self-reported wellness context. It is currently in active research and development.',
  },
  {
    id: 'faq-9',
    category: 'account',
    categoryLabel: 'Account & Login',
    question: 'How do I update my profile or reset my password?',
    answer: 'You can manage your account settings, update your display name, change your password, or review notification preferences by visiting the Settings / Profile section in the sidebar navigation.',
  },
  {
    id: 'faq-10',
    category: 'technical',
    categoryLabel: 'Technical Support',
    question: 'What should I do if my report takes a while to generate?',
    answer: 'Report generation typically takes 3 to 8 seconds. If a network interruption occurs, your saved responses remain safely stored in your account. You can return to My Reports at any time to view your generated report or resume an in-progress session.',
  },
];

export default function Support({ onNavigateHome: _onNavigateHome }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaqIndex, setOpenFaqIndex] = useState(0); // first item expanded by default

  // Modals
  const [activeGuide, setActiveGuide] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory =
        selectedCategory === 'all' || faq.category === selectedCategory;

      if (!matchesCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const terms = q.split(/\s+/);
        const searchCorpus = `${faq.question} ${faq.answer} ${faq.categoryLabel}`.toLowerCase();
        return terms.every((term) => searchCorpus.includes(term));
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <AppShell currentTab="support">
      <div className="space-y-8 pb-16">

        {/* ── 1. PAGE HEADER WITH NATURE BANNER & QUOTE ───────────────────── */}
        <div className="relative bg-[#F9F7F2] border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xs">
          {/* Nature decorative illustration in top right */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none hidden md:block overflow-hidden opacity-90">
            <svg
              className="absolute right-0 top-0 h-full w-full object-cover"
              viewBox="0 0 400 200"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Soft warm sun circle */}
              <circle cx="280" cy="55" r="32" fill="#FCE794" opacity="0.6" />
              {/* Rolling green hills */}
              <path
                d="M100 200 C 180 120, 240 160, 400 110 L 400 200 Z"
                fill="#C8E2CB"
                opacity="0.5"
              />
              <path
                d="M180 200 C 260 130, 320 150, 400 135 L 400 200 Z"
                fill="#5A9A74"
                opacity="0.65"
              />
              <path
                d="M260 200 C 310 155, 360 165, 400 160 L 400 200 Z"
                fill="#1E3A2B"
                opacity="0.85"
              />
              {/* Stylized trees */}
              <circle cx="345" cy="120" r="14" fill="#2E5A3C" opacity="0.9" />
              <line x1="345" y1="120" x2="345" y2="148" stroke="#1E3A2B" strokeWidth="2.5" />
              <circle cx="370" cy="130" r="11" fill="#3D7550" opacity="0.9" />
              <line x1="370" y1="130" x2="370" y2="152" stroke="#1E3A2B" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative z-10 max-w-2xl space-y-3">
            {/* Header Title with Chat Icon */}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight">
                How can we help?
              </h1>
              <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>

            <p className="text-sm sm:text-[15px] text-[#57534E] leading-relaxed">
              Find answers, learn how to use MantraAI, or get in touch with our team.
            </p>

            {/* Quote Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#E8E5DF] text-xs text-[#1E3A2B] font-medium shadow-2xs">
              <span className="text-[#5A9A74] font-serif text-sm">“</span>
              <span>Support for a healthier tomorrow, always.</span>
              <span className="text-[#5A9A74] font-serif text-sm">”</span>
            </div>
          </div>
        </div>

        {/* ── 2. PROMINENT SEARCH BAR ──────────────────────────────────────── */}
        <div className="bg-white border border-[#E8E5DF] rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78716C]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help (e.g., assessment, reports, privacy, data, smartwatch...)"
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-transparent border-none rounded-xl text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A8A29E] hover:text-[#1C1917]"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="button"
            className="w-full sm:w-auto px-6 py-2.5 bg-[#1E3A2B] hover:bg-[#162C20] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Search
          </button>
        </div>

        {/* ── 3. HORIZONTAL CATEGORY FILTERS ───────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none" role="tablist">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[#EBF5EE] text-[#1E3A2B] border-[#1E3A2B] shadow-2xs'
                    : 'bg-white text-[#57534E] border-[#E8E5DF] hover:border-[#D0CBC0] hover:text-[#1C1917]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── 4. TWO-COLUMN GRID: MAIN CONTENT + RIGHT SIDEBAR ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT MAIN COLUMN (8 cols) ── */}
          <div className="lg:col-span-8 space-y-10 min-w-0">
            
            {/* ── SECTION: QUICK HELP ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#1E3A2B]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                    Quick Help
                  </h2>
                  <p className="text-xs text-[#78716C]">
                    Common topics to help you get started quickly.
                  </p>
                </div>
              </div>

              {/* 4 Large Quick Help Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Understanding Your Report */}
                <div className="bg-white border border-[#E8E5DF] hover:border-[#5A9A74] rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>

                    <h3 className="text-xs sm:text-[13px] font-bold text-[#1C1917] leading-snug">
                      Understanding Your Report
                    </h3>

                    <p className="text-[11px] text-[#57534E] leading-relaxed">
                      Learn how to read and make the most of your personalized report.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB]">
                    <button
                      type="button"
                      onClick={() => setActiveGuide(QUICK_HELP_GUIDES.report)}
                      className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Guide</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Card 2: Taking an Assessment */}
                <div className="bg-white border border-[#E8E5DF] hover:border-[#5A9A74] rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>

                    <h3 className="text-xs sm:text-[13px] font-bold text-[#1C1917] leading-snug">
                      Taking an Assessment
                    </h3>

                    <p className="text-[11px] text-[#57534E] leading-relaxed">
                      Step-by-step guidance on completing your assessment.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB]">
                    <button
                      type="button"
                      onClick={() => setActiveGuide(QUICK_HELP_GUIDES.assessment)}
                      className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Guide</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Card 3: Using My Progress */}
                <div className="bg-white border border-[#E8E5DF] hover:border-[#5A9A74] rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] text-[#7E22CE] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>

                    <h3 className="text-xs sm:text-[13px] font-bold text-[#1C1917] leading-snug">
                      Using My Progress
                    </h3>

                    <p className="text-[11px] text-[#57534E] leading-relaxed">
                      Learn how your health trends are tracked over time.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB]">
                    <button
                      type="button"
                      onClick={() => setActiveGuide(QUICK_HELP_GUIDES.progress)}
                      className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Guide</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Card 4: Understanding Evidence */}
                <div className="bg-white border border-[#E8E5DF] hover:border-[#5A9A74] rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>

                    <h3 className="text-xs sm:text-[13px] font-bold text-[#1C1917] leading-snug">
                      Understanding Evidence
                    </h3>

                    <p className="text-[11px] text-[#57534E] leading-relaxed">
                      How we use scientific evidence and how to explore resources.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB]">
                    <a
                      href="#resources"
                      className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Explore Resources</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* ── SECTION: FREQUENTLY ASKED QUESTIONS ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#1E3A2B]">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                      Frequently Asked Questions
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Find quick answers to common questions about MantraAI.
                    </p>
                  </div>
                </div>

                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All FAQs</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* FAQ Accordion List */}
              {filteredFaqs.length === 0 ? (
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-8 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#FAF9F6] text-[#A8A29E] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#1C1917]">No help articles found</h3>
                  <p className="text-xs text-[#78716C] max-w-sm mx-auto">
                    Try another search term or reset your category filter to browse all articles.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-xs font-semibold text-[#1E3A2B] bg-[#EBF5EE] hover:bg-[#D8EBDD] rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Search & Filters
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-[#E8E5DF] rounded-2xl overflow-hidden shadow-2xs divide-y divide-[#F5F2EB]">
                  {filteredFaqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div key={faq.id} className="transition-colors">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => toggleFaq(index)}
                          className="w-full text-left px-5 sm:px-6 py-4 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#1C1917] hover:text-[#1E3A2B] transition-colors cursor-pointer"
                        >
                          <span className="leading-snug flex-1">{faq.question}</span>
                          <svg
                            className={`w-4 h-4 text-[#78716C] shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[#1E3A2B]' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isOpen && (
                          <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-[13px] text-[#57534E] leading-relaxed border-t border-[#FAF9F6]">
                            <p>{faq.answer}</p>
                            <div className="mt-2.5 flex items-center gap-2">
                              <span className="text-[10px] uppercase font-semibold text-[#78716C] bg-[#FAF9F6] border border-[#E8E5DF] px-2 py-0.5 rounded">
                                {faq.categoryLabel}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT SIDEBAR (4 cols) ── */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Need More Help? Card */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#1E3A2B]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
                  Need More Help?
                </h3>
              </div>

              <p className="text-xs text-[#57534E] leading-relaxed">
                Can't find what you're looking for? Our team is here to help.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="w-full py-2.5 px-4 bg-[#1E3A2B] hover:bg-[#162C20] text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Contact Support</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(true)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF9F6] border border-[#E8E5DF] text-[#1C1917] text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span>Send Feedback</span>
                </button>
              </div>
            </div>

            {/* 2. Helpful Links Card */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#2563EB]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
                  Helpful Links
                </h3>
              </div>

              <div className="space-y-1">
                <a
                  href="#assess"
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group"
                >
                  <span className="group-hover:font-semibold transition-all">Take a New Assessment</span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <a
                  href="#history"
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group"
                >
                  <span className="group-hover:font-semibold transition-all">View My Reports</span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <a
                  href="#progress"
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group"
                >
                  <span className="group-hover:font-semibold transition-all">Go to My Progress</span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <a
                  href="#resources"
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group"
                >
                  <span className="group-hover:font-semibold transition-all">Explore Resources</span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <a
                  href="#profile"
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group"
                >
                  <span className="group-hover:font-semibold transition-all">Account Settings</span>
                  <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* 3. Data & Privacy Card */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#059669]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
                  Data & Privacy
                </h3>
              </div>

              <p className="text-xs text-[#57534E] leading-relaxed">
                Learn how your data is used, stored, and protected.
              </p>

              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>Privacy Policy</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            {/* 4. Important Safety Notice Panel */}
            <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#DC2626]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#991B1B] uppercase tracking-wider">
                  Important Safety Notice
                </h3>
              </div>

              <div className="space-y-2 text-xs text-[#991B1B] leading-relaxed">
                <p>
                  MantraAI is for educational purposes only and does not provide medical advice.
                </p>
                <p className="text-[11px] text-[#B91C1C]">
                  If you are experiencing a medical emergency or are in immediate danger, please contact your local emergency services.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── QUICK HELP DETAIL MODAL ──────────────────────────────────────── */}
      {activeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setActiveGuide(null)}
        >
          <div
            className="bg-white border border-[#E8E5DF] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8E5DF]">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#1E3A2B] bg-[#EBF5EE] px-2.5 py-0.5 rounded-full">
                  {activeGuide.category} Guide
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#1C1917]">
                  {activeGuide.title}
                </h2>
                <p className="text-xs text-[#78716C]">{activeGuide.summary}</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveGuide(null)}
                className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F3EFEA] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Guide Sections */}
            <div className="space-y-4">
              {activeGuide.sections.map((sec, i) => (
                <div key={i} className="p-3.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-[#1C1917]">
                    {i + 1}. {sec.heading}
                  </h4>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#E8E5DF] flex items-center justify-between gap-3">
              {activeGuide.actionLink && (
                <a
                  href={activeGuide.actionLink}
                  className="px-4 py-2 bg-[#1E3A2B] hover:bg-[#162C20] text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <span>{activeGuide.actionText}</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              )}

              <button
                type="button"
                onClick={() => setActiveGuide(null)}
                className="px-4 py-2 border border-[#E8E5DF] text-xs font-semibold text-[#57534E] hover:text-[#1C1917] rounded-xl hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACT SUPPORT MODAL ────────────────────────────────────────── */}
      {showContactModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="bg-white border border-[#E8E5DF] rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">
                  Contact Support
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F3EFEA] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#57534E] leading-relaxed">
              <p>
                Have a question about your account, an assessment, or technical difficulties?
              </p>

              <div className="p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-2">
                <div className="font-bold text-[#1C1917]">Support Channels:</div>
                <div className="text-[11px] text-[#78716C] space-y-1">
                  <div>• Frequently Asked Questions in this Help Center</div>
                  <div>• Bug reports & feedback via the Send Feedback tool</div>
                  <div>• Direct inquiries through your registered organization portal</div>
                </div>
              </div>

              <p className="text-[11px] text-[#78716C] italic">
                Note: In-app live chat and ticketing will be integrated in an upcoming product release.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#162C20] cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEND FEEDBACK MODAL ──────────────────────────────────────────── */}
      {showFeedbackModal && (
        <SendFeedbackDialog onClose={() => setShowFeedbackModal(false)} />
      )}

      {/* ── DATA & PRIVACY MODAL ─────────────────────────────────────────── */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className="bg-white border border-[#E8E5DF] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#059669] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">
                  Data & Privacy Commitment
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F3EFEA] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#57534E] leading-relaxed">
              <p>
                MantraAI is built around transparent, responsible data principles:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1E3A2B]" />
                    <span>Authenticated User Isolation</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">
                    Your questionnaire answers and compiled reports are tied strictly to your authenticated account ID and are inaccessible to other users.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span>No Third-Party Data Monetization</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">
                    We do not sell, rent, or trade individual health survey answers to data brokers or advertising networks.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <span>Educational & Non-Diagnostic Boundary</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">
                    Collected information is used exclusively to generate personalized wellness context and reference evidence-based clinical guidelines.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#162C20] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

// Lightweight Send Feedback Component
function SendFeedbackDialog({ onClose }) {
  const [feedbackType, setFeedbackType] = useState('Suggestion');
  const [contextPage, setContextPage] = useState('General / Entire App');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E8E5DF] rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#1C1917]">
              Send Feedback
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F3EFEA] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-[#1C1917]">Feedback Note Recorded</h4>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Thank you for testing the feedback tool. The direct backend feedback ingestion pipeline is scheduled for an upcoming release. No personal data was stored externally.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#162C20] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C1917] block">
                Feedback Type
              </label>
              <div className="flex gap-2">
                {['Suggestion', 'Bug Report', 'General Feedback'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFeedbackType(type)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      feedbackType === type
                        ? 'bg-[#EBF5EE] text-[#1E3A2B] border-[#1E3A2B]'
                        : 'bg-white text-[#57534E] border-[#E8E5DF] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C1917] block">
                Page / Feature Context (Optional)
              </label>
              <select
                value={contextPage}
                onChange={(e) => setContextPage(e.target.value)}
                className="w-full p-2 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
              >
                <option value="General / Entire App">General / Entire App</option>
                <option value="Dashboard">Dashboard</option>
                <option value="Take Assessment">Take Assessment</option>
                <option value="My Reports">My Reports</option>
                <option value="My Progress">My Progress</option>
                <option value="Resources / Evidence Hub">Resources / Evidence Hub</option>
                <option value="Support & Help Center">Support & Help Center</option>
                <option value="Account Settings">Account Settings</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C1917] block">
                Your Message
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you experienced or how we can improve..."
                className="w-full p-3 text-xs bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]"
              />
            </div>

            <div className="p-2.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-[11px] text-[#78716C] leading-tight">
              Backend submission pipeline is currently in development. Submissions in this preview mode do not store data outside your browser.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E8E5DF] text-xs font-semibold text-[#57534E] hover:text-[#1C1917] rounded-xl hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1E3A2B] hover:bg-[#162C20] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
