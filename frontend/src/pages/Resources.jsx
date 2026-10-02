import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppShell from '../components/layout/AppShell';
import { apiRequest } from '../config/api';

// Canonical topic filters mapping to backend taxonomy domains
const TOPIC_FILTERS = [
  { id: 'all', label: 'All Topics', domain: null },
  { id: 'reproductive', label: 'Reproductive Health', domain: 'reproductive_health' },
  { id: 'sexual', label: 'Sexual Health', domain: 'sexual_health' },
  { id: 'mental', label: 'Mental & Behavioral', domain: 'mental_behavioral_wellness' },
  { id: 'lifestyle', label: 'Lifestyle & Nutrition', domain: 'lifestyle_wellness' },
  { id: 'environmental', label: 'Environmental Exposure', domain: 'environmental_heat' },
  { id: 'substance', label: 'Substance & Medication', domain: 'substance_medication' },
];

// Popular topic shortcuts for right sidebar
const POPULAR_TOPICS = [
  { label: 'Fertility & Sperm Health', filterId: 'reproductive', query: 'semen fertility' },
  { label: 'Sleep & Hormones', filterId: 'lifestyle', query: 'sleep circadian' },
  { label: 'Stress & Mental Health', filterId: 'mental', query: 'stress anxiety' },
  { label: 'Exercise & Physical Activity', filterId: 'lifestyle', query: 'exercise physical activity' },
  { label: 'Nutrition & Supplements', filterId: 'lifestyle', query: 'nutrition antioxidants' },
  { label: 'Environmental Exposures', filterId: 'environmental', query: 'heat toxins bpa' },
  { label: 'Sexual Function', filterId: 'sexual', query: 'sexual function spectatoring' },
  { label: 'Substance Use & Fertility', filterId: 'substance', query: 'steroids tobacco alcohol' },
];

export default function Resources({ onNavigateHome: _onNavigateHome }) {
  const [evidenceList, setEvidenceList] = useState([]);
  const [stats, setStats] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters, search & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevant'); // relevant | newest | type | source

  // Modals
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showHowWeChoose, setShowHowWeChoose] = useState(false);

  // ── 1. Fetch Evidence Corpus & Assessment Data ───────────────────────
  const fetchCorpusData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch evidence corpus and stats in parallel
      const [docsData, statsData] = await Promise.all([
        apiRequest('/api/v1/evidence'),
        apiRequest('/api/v1/evidence/stats').catch(() => null),
      ]);

      setEvidenceList(Array.isArray(docsData) ? docsData : []);
      if (statsData) setStats(statsData);

      // Attempt to load latest completed assessment report for personalized recommendations
      try {
        const sessions = await apiRequest('/api/v1/assessments');
        if (Array.isArray(sessions)) {
          const completed = sessions.filter((s) => s.status === 'COMPLETED');
          if (completed.length > 0) {
            const latest = completed[0];
            const reportData = await apiRequest(`/api/v1/assessments/${latest.id}/report`);
            setLatestReport(reportData);
          }
        }
      } catch (_e) {
        // User might not be logged in or have assessments yet; this is expected
        setLatestReport(null);
      }
    } catch (err) {
      console.error('Failed to load evidence library:', err);
      setError('We couldn\'t load the evidence library. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCorpusData();
  }, [fetchCorpusData]);

  // ── 2. Handle Deep Linking (#resources?id=<evidence_id>) ─────────────
  useEffect(() => {
    const handleHashQuery = () => {
      try {
        const hash = window.location.hash;
        if (hash.includes('?')) {
          const queryStr = hash.split('?')[1];
          const params = new URLSearchParams(queryStr);
          const docId = params.get('id');
          if (docId && evidenceList.length > 0) {
            const matched = evidenceList.find(
              (d) => d.id.toLowerCase() === docId.toLowerCase()
            );
            if (matched) {
              setSelectedDoc(matched);
            }
          }
        }
      } catch (_e) {
        // ignore
      }
    };

    handleHashQuery();
    window.addEventListener('hashchange', handleHashQuery);
    return () => window.removeEventListener('hashchange', handleHashQuery);
  }, [evidenceList]);

  // ── 3. Dynamic Evidence Source Counts for "Start Here" Cards ─────────
  const startHereCounts = useMemo(() => {
    const counts = {
      reproductive_health: 0,
      sexual_health: 0,
      mental_behavioral_wellness: 0,
      lifestyle_wellness: 0,
    };

    if (stats?.domain_counts) {
      for (const item of stats.domain_counts) {
        if (counts[item.domain_id] !== undefined) {
          // Use total chunks + docs count or doc count
          counts[item.domain_id] = item.document_count + item.chunk_count;
        }
      }
    } else if (evidenceList.length > 0) {
      for (const doc of evidenceList) {
        for (const dom of doc.domains || []) {
          if (counts[dom] !== undefined) {
            counts[dom] += 1 + (doc.chunk_count || 0);
          }
        }
      }
    }

    return counts;
  }, [stats, evidenceList]);

  // ── 4. Personalized Recommendations ──────────────────────────────────
  const recommendedResources = useMemo(() => {
    if (!latestReport || evidenceList.length === 0) return [];

    const recs = [];
    const citedRefs = Array.isArray(latestReport.evidence) ? latestReport.evidence : [];
    const citedIds = new Set(citedRefs.map((r) => (r.evidence_id || r.id || '').toLowerCase()));

    // 1. Add explicitly cited documents from user's report
    for (const doc of evidenceList) {
      if (citedIds.has(doc.id.toLowerCase())) {
        recs.push({
          doc,
          badge: doc.evidence_type || 'Clinical Guideline',
          reason: 'Cited in your latest clinical wellness summary',
          iconType: doc.primary_domain || 'reproductive',
        });
      }
    }

    // 2. Add domain-matching documents based on priority factors
    const priorityFactors = Array.isArray(latestReport.priority_factors) ? latestReport.priority_factors : [];
    const priorityDomains = new Set(priorityFactors.map((f) => f.domain).filter(Boolean));

    for (const doc of evidenceList) {
      if (recs.some((r) => r.doc.id === doc.id)) continue;
      if (doc.domains.some((d) => priorityDomains.has(d))) {
        recs.push({
          doc,
          badge: doc.evidence_type || 'Systematic Review',
          reason: 'Relevant to your current focus areas',
          iconType: doc.primary_domain || 'lifestyle',
        });
      }
    }

    // 3. Fallback to top authoritative guidelines if fewer than 4
    if (recs.length < 4) {
      for (const doc of evidenceList) {
        if (recs.some((r) => r.doc.id === doc.id)) continue;
        recs.push({
          doc,
          badge: doc.evidence_type || 'Evidence Review',
          reason: 'Foundational clinical guidance',
          iconType: doc.primary_domain || 'reproductive',
        });
        if (recs.length >= 4) break;
      }
    }

    return recs.slice(0, 4);
  }, [latestReport, evidenceList]);

  // ── 5. Filtering & Sorting Evidence Library ──────────────────────────
  const filteredLibrary = useMemo(() => {
    let list = [...evidenceList];

    // Filter by Topic Pill
    if (activeFilter !== 'all') {
      const activeObj = TOPIC_FILTERS.find((f) => f.id === activeFilter);
      if (activeObj?.domain) {
        list = list.filter(
          (doc) =>
            doc.domains.includes(activeObj.domain) ||
            doc.primary_domain === activeObj.domain ||
            doc.evidence_tags.some((t) => t.includes(activeObj.id))
        );
      }
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const terms = q.split(/\s+/);
      list = list.filter((doc) => {
        const fullText = [
          doc.title,
          doc.organization,
          doc.source,
          doc.source_identifier,
          doc.summary,
          doc.evidence_type,
          ...(doc.evidence_tags || []),
          ...(doc.chunks || []).map((c) => `${c.topic} ${c.text}`),
        ]
          .join(' ')
          .toLowerCase();

        return terms.every((term) => fullText.includes(term));
      });
    }

    // Sort
    if (sortBy === 'newest') {
      list.sort((a, b) => b.publication_year - a.publication_year);
    } else if (sortBy === 'type') {
      list.sort((a, b) => a.evidence_type.localeCompare(b.evidence_type));
    } else if (sortBy === 'source') {
      list.sort((a, b) => a.organization.localeCompare(b.organization));
    }
    // 'relevant' retains default curated clinical hierarchy

    return list;
  }, [evidenceList, activeFilter, searchQuery, sortBy]);

  // Quick action from popular topics
  const handlePopularTopicClick = (topic) => {
    setActiveFilter(topic.filterId);
    setSearchQuery('');
    const el = document.getElementById('evidence-library-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartHereExplore = (domainId, filterId) => {
    setActiveFilter(filterId);
    setSearchQuery('');
    const el = document.getElementById('evidence-library-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper for badge color styling
  const getBadgeStyle = (evidenceType) => {
    const t = (evidenceType || '').toLowerCase();
    if (t.includes('guideline')) {
      return 'bg-[#EBF5EE] text-[#1E3A2B] border-[#D1E7DD]';
    }
    if (t.includes('systematic')) {
      return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]';
    }
    if (t.includes('research') || t.includes('study')) {
      return 'bg-[#FAF5FF] text-[#7E22CE] border-[#F3E8FF]';
    }
    return 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]';
  };

  // Helper for domain icon
  const renderDomainIcon = (domainOrType) => {
    const d = (domainOrType || '').toLowerCase();
    if (d.includes('sleep') || d.includes('rest')) {
      return (
        <svg className="w-5 h-5 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    }
    if (d.includes('exercise') || d.includes('activity') || d.includes('lifestyle')) {
      return (
        <svg className="w-5 h-5 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    if (d.includes('env') || d.includes('heat')) {
      return (
        <svg className="w-5 h-5 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    if (d.includes('mental') || d.includes('stress') || d.includes('psych')) {
      return (
        <svg className="w-5 h-5 text-[#7E22CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    }
    // Default reproductive biology icon
    return (
      <svg className="w-5 h-5 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  };

  return (
    <AppShell currentTab="resources">
      <div className="space-y-8 pb-16">
        
        {/* ── 1. PAGE HEADER WITH NATURE DECORATION & QUOTE ───────────────── */}
        <div className="relative bg-[#F9F7F2] border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xs">
          {/* Nature decorative illustration in top right */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none hidden md:block overflow-hidden opacity-90">
            <svg
              className="absolute right-0 top-0 h-full w-full object-cover"
              viewBox="0 0 400 200"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Soft warm sky circle */}
              <circle cx="280" cy="55" r="32" fill="#FCE794" opacity="0.6" />
              {/* Rolling hills */}
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
            {/* Header Title with Book Icon */}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight">
                Resources
              </h1>
              <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            <p className="text-sm sm:text-[15px] text-[#57534E] leading-relaxed">
              Evidence-backed information to help you understand your health, ask better questions, and make informed decisions.
            </p>

            {/* Motivational Quote Banner */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#E8E5DF] text-xs text-[#1E3A2B] font-medium shadow-2xs">
              <span className="text-[#5A9A74] font-serif text-sm">“</span>
              <span>Knowledge is a powerful step toward better health.</span>
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
              placeholder="Search men's health topics (e.g., fertility, sleep, stress, lifestyle...)"
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

        {/* ── 3. HORIZONTAL TOPIC FILTERS ──────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none" role="tablist">
          {TOPIC_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[#EBF5EE] text-[#1E3A2B] border-[#1E3A2B] shadow-2xs'
                    : 'bg-white text-[#57534E] border-[#E8E5DF] hover:border-[#D0CBC0] hover:text-[#1C1917]'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* ── 4. TWO-COLUMN GRID: MAIN CONTENT + RIGHT SIDEBAR ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT MAIN CONTENT STREAM (8 cols) ── */}
          <div className="lg:col-span-8 space-y-10 min-w-0">
            
            {/* ── SECTION: START HERE ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#D97706]">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                      Start Here
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Key topics to help you build a stronger foundation for your health.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    document.getElementById('evidence-library-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 4 Topic Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Reproductive Health */}
                <div className="bg-white border border-[#E8E5DF] hover:border-[#5A9A74] rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <circle cx="8" cy="12" r="4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c3 0 5-2 8-2" />
                      </svg>
                    </div>

                    <h3 className="text-sm font-bold text-[#1C1917] leading-snug">
                      Understanding Male Reproductive Health
                    </h3>

                    <p className="text-xs text-[#57534E] leading-relaxed">
                      Learn about key factors that influence sperm health, fertility, and overall reproductive vitality.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#1E3A2B] bg-[#EBF5EE] px-2 py-0.5 rounded-full">
                        Reproductive Health
                      </span>
                      <div className="text-[10px] text-[#78716C] mt-1">
                        {startHereCounts.reproductive_health || 4} evidence sources
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartHereExplore('reproductive_health', 'reproductive')}
                      className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Topic</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 2. Sexual Health */}
                <div className="bg-white border border-[#E8E5DF] hover:border-[#5A9A74] rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>

                    <h3 className="text-sm font-bold text-[#1C1917] leading-snug">
                      Sexual Health & Wellbeing
                    </h3>

                    <p className="text-xs text-[#57534E] leading-relaxed">
                      Understand sexual function, libido, and factors that can support a healthy sex life.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#9D174D] bg-[#FCE7F3] px-2 py-0.5 rounded-full">
                        Sexual Health
                      </span>
                      <div className="text-[10px] text-[#78716C] mt-1">
                        {startHereCounts.sexual_health || 3} evidence sources
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartHereExplore('sexual_health', 'sexual')}
                      className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Topic</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 3. Stress, Mood & Behavioral Wellness */}
                <div className="bg-white border border-[#E8E5DF] hover:border-[#5A9A74] rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>

                    <h3 className="text-sm font-bold text-[#1C1917] leading-snug">
                      Stress, Mood & Behavioral Wellness
                    </h3>

                    <p className="text-xs text-[#57534E] leading-relaxed">
                      Explore how mental health, stress, sleep, and behavior can impact men's reproductive and overall health.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#6D28D9] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                        Mental & Behavioral
                      </span>
                      <div className="text-[10px] text-[#78716C] mt-1">
                        {startHereCounts.mental_behavioral_wellness || 3} evidence sources
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartHereExplore('mental_behavioral_wellness', 'mental')}
                      className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Topic</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 4. Lifestyle Factors */}
                <div className="bg-white border border-[#E8E5DF] hover:border-[#5A9A74] rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>

                    <h3 className="text-sm font-bold text-[#1C1917] leading-snug">
                      Lifestyle Factors & Men's Health
                    </h3>

                    <p className="text-xs text-[#57534E] leading-relaxed">
                      Learn how sleep, physical activity, nutrition, and daily habits can support your long-term health.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                        Lifestyle & Nutrition
                      </span>
                      <div className="text-[10px] text-[#78716C] mt-1">
                        {startHereCounts.lifestyle_wellness || 4} evidence sources
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartHereExplore('lifestyle_wellness', 'lifestyle')}
                      className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Topic</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ── SECTION: RECOMMENDED FOR YOU ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#5A9A74]">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                      Recommended for You
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      {latestReport
                        ? 'Based on your latest assessment and current focus areas.'
                        : 'Explore resources relevant to foundational men\'s health.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    document.getElementById('evidence-library-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Personalized Cards or Non-Assessed State */}
              {latestReport && recommendedResources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedResources.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedDoc(item.doc)}
                      className="bg-white border border-[#E8E5DF] hover:border-[#1E3A2B]/40 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-start gap-3.5 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F5F2EB] flex items-center justify-center shrink-0 group-hover:bg-[#EBF5EE] transition-colors">
                        {renderDomainIcon(item.doc.primary_domain || item.iconType)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors leading-snug line-clamp-1">
                          {item.doc.title}
                        </h3>

                        <p className="text-[11px] text-[#57534E] line-clamp-2 leading-relaxed">
                          {item.doc.summary}
                        </p>

                        <div className="pt-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                          <span className={`font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(item.badge)}`}>
                            {item.badge}
                          </span>
                          <span className="text-[#78716C]">
                            {item.doc.organization.split('/')[0].trim()} • {item.doc.publication_year}
                          </span>
                        </div>
                      </div>

                      <div className="text-[#A8A29E] group-hover:text-[#1E3A2B] transition-colors pt-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-sm font-bold text-[#1C1917]">
                      Discover Tailored Evidence Recommendations
                    </h3>
                    <p className="text-xs text-[#57534E] leading-relaxed">
                      Complete your confidential health questionnaire to receive evidence references matched directly to your reported lifestyle, environment, and wellness context.
                    </p>
                  </div>
                  <div>
                    <a
                      href="#assess"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A2B] hover:bg-[#162C20] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                    >
                      <span>Take Assessment</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION: EVIDENCE LIBRARY ── */}
            <div id="evidence-library-section" className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 text-[#1E3A2B]">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                      Evidence Library
                    </h2>
                    <p className="text-xs text-[#78716C]">
                      Browse our complete collection of evidence-based resources.
                    </p>
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-[#78716C] font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs font-semibold bg-white border border-[#E8E5DF] text-[#1C1917] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A2B] cursor-pointer"
                  >
                    <option value="relevant">Most Relevant</option>
                    <option value="newest">Newest</option>
                    <option value="type">Evidence Type</option>
                    <option value="source">Source</option>
                  </select>
                </div>
              </div>

              {/* Library Cards Grid */}
              {loading ? (
                /* Loading Skeleton */
                <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-white border border-[#E8E5DF] rounded-2xl p-5 space-y-3 animate-pulse">
                      <div className="w-24 h-4 bg-[#F0ECE6] rounded-full" />
                      <div className="w-3/4 h-5 bg-[#E8E5DF] rounded" />
                      <div className="w-full h-12 bg-[#F5F2EB] rounded" />
                      <div className="w-1/2 h-4 bg-[#F0ECE6] rounded" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                /* Error State */
                <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-6 text-center space-y-3">
                  <p className="text-xs font-medium text-[#991B1B]">{error}</p>
                  <button
                    type="button"
                    onClick={fetchCorpusData}
                    className="px-4 py-2 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#162C20] cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredLibrary.length === 0 ? (
                /* Empty State */
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-8 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#FAF9F6] text-[#A8A29E] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#1C1917]">No resources found</h3>
                  <p className="text-xs text-[#78716C] max-w-sm mx-auto">
                    No resources matched your search term. Try another topic or reset your filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#1E3A2B] bg-[#EBF5EE] hover:bg-[#D8EBDD] rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                /* Evidence Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLibrary.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-[#E8E5DF] hover:border-[#1E3A2B]/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        {/* Evidence Type Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(doc.evidence_type)}`}>
                            {doc.evidence_type}
                          </span>
                          {doc.chunk_count > 0 && (
                            <span className="text-[10px] text-[#78716C] font-mono">
                              {doc.chunk_count} topics
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-[#1C1917] leading-snug">
                          {doc.title}
                        </h3>

                        {/* Summary */}
                        <p className="text-xs text-[#57534E] leading-relaxed line-clamp-3">
                          {doc.summary}
                        </p>
                      </div>

                      {/* Footer Metadata & Actions */}
                      <div className="space-y-3 pt-3 border-t border-[#F5F2EB]">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#78716C]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#1C1917]">
                              {doc.organization.split('/')[0].trim()}
                            </span>
                            <span>•</span>
                            <span>{doc.publication_year}</span>
                          </div>

                          {doc.source_identifier && (
                            <span className="text-[10px] font-mono text-[#78716C] truncate max-w-[170px]" title={doc.source_identifier}>
                              {doc.source_identifier}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Source</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-xs text-[#A8A29E]">Source unavailable</span>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedDoc(doc)}
                            className="text-xs font-semibold text-[#1E3A2B] bg-[#EBF5EE] hover:bg-[#D8EBDD] px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Read Summary</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT SIDEBAR (4 cols) ── */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Popular Topics Panel */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#EA580C]">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 23c6.075 0 11-4.925 11-11 0-4.004-2.146-7.509-5.367-9.458-.456-.276-1.049.034-1.096.565-.138 1.57-.798 3.011-1.854 4.067-.584.584-1.312.986-2.107 1.189-.48.123-.844-.343-.699-.813.568-1.838.337-3.902-.74-5.548C10.279.71 9.07 0 7.822 0c-.398 0-.742.274-.834.662-.485 2.052-1.637 3.864-3.267 5.143C1.405 7.632 0 9.697 0 12c0 6.075 4.925 11 11 11h1z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
                  Popular Topics
                </h3>
              </div>

              <div className="space-y-1">
                {POPULAR_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePopularTopicClick(topic)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF9F6] transition-colors group cursor-pointer text-left"
                  >
                    <span className="group-hover:font-semibold transition-all">
                      {topic.label}
                    </span>
                    <svg className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#1E3A2B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. How We Choose Resources Panel */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#059669]">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
                  How We Choose Resources
                </h3>
              </div>

              <div className="space-y-2 text-xs text-[#57534E] leading-relaxed">
                <p>
                  MantraAI prioritizes clinical guidelines, systematic reviews, and established scientific sources when selecting health information.
                </p>
                <p>
                  All resources are reviewed for scientific credibility and are presented in clear, plain language with direct links to the original publications.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHowWeChoose(true)}
                className="text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>Learn More</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            {/* 3. Educational Purpose Only Panel */}
            <div className="bg-[#EBF5EE] border border-[#D1E7DD] rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-[#1E3A2B]">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-[#1E3A2B] uppercase tracking-wider">
                  Educational Purpose Only
                </h3>
              </div>

              <p className="text-xs text-[#2D5A3C] leading-relaxed">
                The information in this resource hub is for educational purposes and does not replace professional medical advice. Always consult a qualified healthcare professional for personalized guidance.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ── RESOURCE DETAIL MODAL ────────────────────────────────────────── */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white border border-[#E8E5DF] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8E5DF]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(selectedDoc.evidence_type)}`}>
                    {selectedDoc.evidence_type}
                  </span>
                  {selectedDoc.source_identifier && (
                    <span className="text-[10px] font-mono text-[#78716C] bg-[#F5F2EB] px-2 py-0.5 rounded-full">
                      {selectedDoc.source_identifier}
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-[#1C1917] leading-snug">
                  {selectedDoc.title}
                </h2>

                <div className="text-xs text-[#78716C]">
                  {selectedDoc.organization} • {selectedDoc.publication_year}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F3EFEA] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5">
              
              {/* Plain Language Summary */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                  Plain-Language Summary
                </h4>
                <p className="text-xs sm:text-[13px] text-[#57534E] leading-relaxed bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl p-4">
                  {selectedDoc.summary}
                </p>
              </div>

              {/* Population / Context */}
              {selectedDoc.population_context && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                    Scope & Population
                  </h4>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    {selectedDoc.population_context}
                  </p>
                </div>
              )}

              {/* Granular Topics / Chunks */}
              {selectedDoc.chunks && selectedDoc.chunks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                    Key Topics & Clinical Context
                  </h4>
                  <div className="space-y-3">
                    {selectedDoc.chunks.map((chunk, idx) => (
                      <div key={idx} className="bg-white border border-[#E8E5DF] rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-bold text-[#1E3A2B]">
                            {chunk.topic}
                          </h5>
                          {chunk.clinical_significance && (
                            <span className="text-[10px] text-[#059669] bg-[#EBF5EE] px-2 py-0.5 rounded-full font-medium">
                              Guideline Insight
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#57534E] leading-relaxed">
                          {chunk.text}
                        </p>
                        {chunk.limitations && chunk.limitations.length > 0 && (
                          <div className="pt-2 border-t border-[#F5F2EB] text-[11px] text-[#78716C] italic">
                            <span className="font-semibold not-italic text-[#57534E]">Context Note:</span> {chunk.limitations.join(' ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations */}
              {selectedDoc.limitations && selectedDoc.limitations.length > 0 && (
                <div className="space-y-2 bg-[#FEF2F2]/40 border border-[#FEE2E2] rounded-xl p-4">
                  <h4 className="text-xs font-bold text-[#991B1B] uppercase tracking-wider">
                    Source Limitations & Clinical Boundary
                  </h4>
                  <ul className="space-y-1">
                    {selectedDoc.limitations.map((lim, i) => (
                      <li key={i} className="text-xs text-[#7F1D1D] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mt-1.5 shrink-0" />
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#E8E5DF] flex flex-wrap items-center justify-between gap-3">
              {selectedDoc.url ? (
                <a
                  href={selectedDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#1E3A2B] hover:bg-[#162C20] text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open Original Source</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border border-[#E8E5DF] text-xs font-semibold text-[#57534E] hover:text-[#1C1917] rounded-xl hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── HOW WE CHOOSE RESOURCES MODAL ────────────────────────────────── */}
      {showHowWeChoose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowHowWeChoose(false)}
        >
          <div
            className="bg-white border border-[#E8E5DF] rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">
                  How We Choose Resources
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowHowWeChoose(false)}
                className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F3EFEA] text-[#78716C] hover:text-[#1C1917] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#57534E] leading-relaxed">
              <p>
                MantraAI connects users with authoritative, peer-reviewed medical and scientific literature. We adhere to a structured hierarchy of evidence:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1E3A2B]" />
                    <span>1. Clinical Guidelines</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">
                    Practice committee documents and guidelines from global medical societies (WHO, AUA/ASRM, EAU).
                  </p>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <span>2. Systematic Reviews & Meta-Analyses</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">
                    High-level syntheses of multiple clinical trials and epidemiological studies from indexed journals (PubMed, PMC).
                  </p>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl space-y-1">
                  <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>3. Peer-Reviewed Observational Studies</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">
                    High-quality cohort and physiological studies examining specific modifiable factors.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-[#78716C] italic border-t border-[#F5F2EB] pt-2">
                All summaries are written in plain language while preserving standard digital object identifiers (DOIs), PubMed IDs (PMIDs), and direct links to original sources.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHowWeChoose(false)}
                className="px-4 py-2 bg-[#1E3A2B] text-white text-xs font-semibold rounded-xl hover:bg-[#162C20] cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
