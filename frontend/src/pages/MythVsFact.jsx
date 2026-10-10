import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '../components/layout/AppShell';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';

// Default initial question suggestions matching the visual reference
const SUGGESTED_QUESTIONS = [
  "Does masturbation cause infertility?",
  "Is tight underwear bad for sperm?",
  "Can laptop use reduce fertility?",
  "Does porn cause erectile dysfunction?",
  "Does eating eggs increase testosterone?",
];

const MORE_QUESTIONS = [
  "Does cold shower increase sperm count?",
  "Do fertility supplements actually work?",
  "Can anxiety cause erection problems?",
  "Does smoking tobacco harm sperm motility?",
  "Can an AI diagnose infertility from answers?",
  "Is semen analysis the only test needed?",
];

// Topic Categories for Browse by Topic (matching visual reference layout & icons)
const BROWSE_TOPICS = [
  {
    id: 'reproductive_health',
    title: 'Fertility & Reproductive Health',
    defaultCount: 18,
    iconBg: 'bg-[#EBF5EE] text-[#1E3A2B]',
    domainQuery: 'reproductive_health',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'masturbation',
    title: 'Masturbation & Ejaculation',
    defaultCount: 12,
    iconBg: 'bg-[#FCE7F3] text-[#BE185D]',
    domainQuery: 'sexual_health',
    searchHint: 'masturbation ejaculation abstinence',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: 'hormones',
    title: 'Testosterone & Hormones',
    defaultCount: 10,
    iconBg: 'bg-[#EDE9FE] text-[#6D28D9]',
    domainQuery: 'hormones',
    searchHint: 'testosterone steroids hormones',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    id: 'sexual_health',
    title: 'Sexual Health & Performance',
    defaultCount: 12,
    iconBg: 'bg-[#FFEDD5] text-[#C2410C]',
    domainQuery: 'sexual_health',
    searchHint: 'erectile anxiety performance',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: 'digital_habits',
    title: 'Porn & Digital Habits',
    defaultCount: 8,
    iconBg: 'bg-[#DCFCE7] text-[#15803D]',
    domainQuery: 'mental_behavioral',
    searchHint: 'porn screen digital habits',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'environment_heat',
    title: 'Heat & Environment',
    defaultCount: 9,
    iconBg: 'bg-[#FFE4E6] text-[#E11D48]',
    domainQuery: 'environment_heat',
    searchHint: 'heat sauna laptop bath temperature',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  {
    id: 'diet_nutrition',
    title: 'Diet & Nutrition',
    defaultCount: 12,
    iconBg: 'bg-[#F3E8FF] text-[#7E22CE]',
    domainQuery: 'diet_nutrition',
    searchHint: 'diet nutrition supplements food',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle (Exercise, Sleep, Stress)',
    defaultCount: 14,
    iconBg: 'bg-[#FEF3C7] text-[#B45309]',
    domainQuery: 'lifestyle',
    searchHint: 'lifestyle sleep exercise stress',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'stis_safety',
    title: 'STIs & Sexual Safety',
    defaultCount: 8,
    iconBg: 'bg-[#FCE7F3] text-[#BE123C]',
    domainQuery: 'sexual_health',
    searchHint: 'sti condom infection symptoms',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

// Helper to format relative timestamps
function formatRelativeTime(dateString) {
  if (!dateString) return 'Recently';
  try {
    const diffSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;
    return `${Math.floor(diffSeconds / 604800)} wk ago`;
  } catch {
    return 'Recently';
  }
}

// Format Domain Name cleanly
function formatDomainName(rawDomain) {
  if (!rawDomain) return 'General Health';
  const clean = rawDomain.replace(/_/g, ' ');
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Determine Evidence Strength Level
function getEvidenceStrength(result) {
  if (!result) return { label: 'Moderate', bars: 3 };
  if (result.classification === 'INSUFFICIENT_EVIDENCE') {
    return { label: 'Insufficient', bars: 1 };
  }
  const sourceCount = (result.sources?.length || 0) + (result.guideline_evidence?.length || 0);
  if (sourceCount >= 3 || result.is_verified) {
    return { label: 'High (Established Guidelines)', bars: 5 };
  }
  if (sourceCount >= 2) {
    return { label: 'Moderate', bars: 3 };
  }
  return { label: 'Limited / Contextual', bars: 2 };
}

// Extract Key Takeaways from response
function deriveKeyTakeaways(result) {
  if (!result) return [];
  const takeaways = [];
  const exp = result.explanation || '';

  // Extract clean takeaways based on result content
  if (result.classification === 'MYTH') {
    takeaways.push(`Current authoritative medical consensus contradicts this common misconception.`);
    takeaways.push(`Scientific guidelines distinguish clinical etiology from harmless routine behavior.`);
  } else if (result.classification === 'MISLEADING') {
    takeaways.push(`While certain biological factors are involved, universal causal claims are unsupported.`);
    takeaways.push(`Ejaculation frequency or routine habits do not equate to clinical diagnosis.`);
  } else if (result.classification === 'FACT') {
    takeaways.push(`Fully supported by global clinical practice guidelines and peer-reviewed consensus.`);
    takeaways.push(`Consult a qualified healthcare provider for personalized medical evaluation.`);
  } else if (result.classification === 'CONTEXT_DEPENDENT') {
    takeaways.push(`Biological impact depends heavily on exposure intensity, duration, and individual context.`);
    takeaways.push(`Routine intermittent daily habits carry different outcomes than chronic high exposures.`);
  } else {
    takeaways.push(`Current indexed guidelines lack sufficient specific data to establish a definitive rule.`);
    takeaways.push(`Individual laboratory testing and physician consultation are recommended.`);
  }

  if (result.limitations && result.limitations.length > 0) {
    takeaways.push(result.limitations[0]);
  } else {
    takeaways.push(`Overall reproductive health depends on multiple interrelated lifestyle and clinical factors.`);
  }

  return takeaways.slice(0, 3);
}

// Derive Bottom Line text
function deriveBottomLine(result) {
  if (!result) return '';
  if (result.classification === 'MYTH') {
    return `The evidence does not support this claim as a cause of reproductive or sexual impairment.`;
  }
  if (result.classification === 'MISLEADING') {
    return `${result.canonical_claim || result.query}, by itself, does not establish a medical condition.`;
  }
  if (result.classification === 'FACT') {
    return `Established clinical guidance confirms this physiological relationship.`;
  }
  if (result.classification === 'CONTEXT_DEPENDENT') {
    return `Context matters: duration, temperature, and individual health factors determine the effect.`;
  }
  return `Evidence is currently insufficient to establish a definitive universal answer.`;
}

export default function MythVsFact({ onNavigateHome }) {
  const { isAuthenticated } = useAuth();

  // Primary State
  const [searchQuery, setSearchQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Suggested Questions toggle
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);

  // Data State
  const [topicStats, setTopicStats] = useState({});
  const [recentHistory, setRecentHistory] = useState([]);
  const [allSourcesList, setAllSourcesList] = useState([]);

  // Modals & UI helpers
  const [copiedToast, setCopiedToast] = useState(false);
  const [showAllTopicsModal, setShowAllTopicsModal] = useState(false);
  const [showAllSourcesModal, setShowAllSourcesModal] = useState(false);
  const [selectedTopicClaims, setSelectedTopicClaims] = useState(null);
  const [loadingTopicClaims, setLoadingTopicClaims] = useState(false);

  // ── 1. Execute Myth vs Fact Query ─────────────────────────────────────────
  const handleExecuteQuery = useCallback(async (textToQuery) => {
    const q = (textToQuery || searchQuery).trim();
    if (!q) return;

    try {
      setIsLoading(true);
      setError(null);
      setSearchQuery(q);

      const response = await apiRequest('/api/v1/myth-fact/query', {
        method: 'POST',
        body: JSON.stringify({ query: q, save_history: true }),
      });

      setQueryResult(response);

      // Refresh recent history list if authenticated
      if (isAuthenticated) {
        try {
          const historyData = await apiRequest('/api/v1/myth-fact/history?limit=6');
          if (Array.isArray(historyData)) {
            setRecentHistory(historyData);
          }
        } catch {
          // ignore history refresh error
        }
      }
    } catch (err) {
      console.error('Myth vs Fact Query error:', err);
      setError(err.message || 'Unable to evaluate this claim right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, isAuthenticated]);

  // ── 2. Initial Setup: Load Default Evaluation & Stats ────────────────────
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      // 1. Fetch initial stats & sources
      try {
        const [statsData, sourcesData] = await Promise.all([
          apiRequest('/api/v1/myth-fact/stats').catch(() => null),
          apiRequest('/api/v1/myth-fact/sources').catch(() => []),
        ]);

        if (!isMounted) return;

        if (statsData && statsData.by_domain) {
          const domainMap = {};
          statsData.by_domain.forEach((d) => {
            domainMap[d.domain] = d.count;
          });
          setTopicStats(domainMap);
        }

        if (Array.isArray(sourcesData)) {
          setAllSourcesList(sourcesData);
        }
      } catch (err) {
        console.warn('Could not load initial stats or sources:', err);
      }

      // 2. Fetch authenticated query history if user is logged in
      if (isAuthenticated) {
        try {
          const historyData = await apiRequest('/api/v1/myth-fact/history?limit=6');
          if (isMounted && Array.isArray(historyData)) {
            setRecentHistory(historyData);
          }
        } catch {
          // unauthenticated or history error
        }
      }

      // 3. Load default initial featured answer matching reference
      try {
        setIsLoading(true);
        const defaultClaim = await apiRequest('/api/v1/myth-fact/query', {
          method: 'POST',
          body: JSON.stringify({ query: 'Does masturbation cause infertility?' }),
        });
        if (isMounted) {
          setQueryResult(defaultClaim);
          setSearchQuery('Does masturbation cause infertility?');
        }
      } catch (err) {
        console.warn('Initial claim evaluation fallback:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // ── 3. Handle Topic Click ────────────────────────────────────────────────
  const handleSelectTopic = async (topic) => {
    try {
      setLoadingTopicClaims(true);
      setSelectedTopicClaims(topic);
      const claims = await apiRequest(`/api/v1/myth-fact/claims?domain=${topic.domainQuery}&limit=10`);
      if (Array.isArray(claims) && claims.length > 0) {
        setSelectedTopicClaims({ ...topic, claims });
      }
    } catch (err) {
      console.warn('Topic claims fetch error:', err);
      // Fallback search with hint
      handleExecuteQuery(topic.searchHint || topic.title);
    } finally {
      setLoadingTopicClaims(false);
    }
  };

  // ── 4. Copy / Share Link ─────────────────────────────────────────────────
  const handleCopyLink = () => {
    if (!queryResult) return;
    try {
      const shareUrl = `${window.location.origin}/#myth-fact?q=${encodeURIComponent(queryResult.query)}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  const strength = getEvidenceStrength(queryResult);
  const takeaways = deriveKeyTakeaways(queryResult);
  const bottomLine = deriveBottomLine(queryResult);

  return (
    <AppShell currentTab="myth-fact" onNavigateHome={onNavigateHome}>
      <div className="space-y-6 pb-12">

        {/* ── 1. PAGE HEADER INTRO BANNER ─────────────────────────────────── */}
        <div className="bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl z-10">
            <div className="flex items-center gap-2 mb-2.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight font-serif flex items-center gap-2.5">
                <span>Myth vs Fact Engine</span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EBF5EE] text-[#1E3A2B] shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                  </svg>
                </span>
              </h1>
            </div>
            <p className="text-[15px] sm:text-base text-[#57534E] leading-relaxed">
              Get clear, evidence-based answers to common men's health questions and myths.
            </p>
          </div>

          {/* Thinking Character Illustration Vector matching visual design */}
          <div className="relative shrink-0 flex items-center justify-center select-none">
            {/* Thought Bubbles */}
            <div className="absolute -top-3 left-0 bg-[#FCE7F3] text-[#BE185D] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs animate-bounce" style={{ animationDuration: '3s' }}>
              MYTH?
            </div>
            <div className="absolute -top-1 right-0 bg-[#DCFCE7] text-[#15803D] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs animate-bounce" style={{ animationDuration: '3.5s' }}>
              FACT?
            </div>

            {/* Stylized Thinking Avatar SVG */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 160 160" fill="none">
                <circle cx="80" cy="80" r="70" fill="#F4FAF5" />
                {/* Character face & body */}
                <path d="M50 145c0-20 15-32 30-32s30 12 30 32" fill="#1E3A2B" />
                <rect x="68" y="98" width="24" height="20" rx="6" fill="#F8CBA6" />
                <circle cx="80" cy="75" r="28" fill="#FBD3B6" />
                {/* Hair */}
                <path d="M54 70c0-16 12-28 26-28 16 0 28 10 28 24 0 4-4 7-8 7-8-10-18-8-28 0-6 5-18 2-18-3z" fill="#292524" />
                {/* Eyes & Smile */}
                <circle cx="73" cy="72" r="2.5" fill="#1C1917" />
                <circle cx="89" cy="72" r="2.5" fill="#1C1917" />
                <path d="M76 83c2 2 6 2 8 0" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" />
                {/* Hand on chin (thinking pose) */}
                <path d="M85 88c2 4 4 10 10 12 4 1 6-2 4-5-2-3-4-8-7-10l-7 3z" fill="#F8CBA6" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── 2. SEARCH SECTION WITH CHIPS ─────────────────────────────────── */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteQuery(searchQuery);
            }}
            className="relative flex items-center shadow-xs"
          >
            <div className="absolute left-4.5 text-[#78716C] pointer-events-none flex items-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask a question or type a myth..."
              className="w-full bg-white border border-[#E8E5DF] focus:border-[#1E3A2B] focus:ring-2 focus:ring-[#1E3A2B]/15 rounded-2xl pl-12 pr-32 py-3.5 sm:py-4 text-[15px] sm:text-base text-[#1C1917] placeholder-[#A8A29E] transition-all outline-none"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-28 text-[#A8A29E] hover:text-[#57534E] p-1.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="absolute right-2 bg-[#1E3A2B] hover:bg-[#2D5A3C] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <span className="text-base leading-none">→</span>
                </>
              )}
            </button>
          </form>

          {/* Suggested Questions Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-[13px] text-[#57534E]">
            <span className="font-semibold text-[#1C1917] mr-1">Try these questions:</span>
            {SUGGESTED_QUESTIONS.map((qText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExecuteQuery(qText)}
                className="bg-white hover:bg-[#F3EFEA] border border-[#E8E5DF] hover:border-[#D0CBC0] text-[#44403C] px-3.5 py-1.5 rounded-full transition-all cursor-pointer truncate max-w-[280px] sm:max-w-none text-left"
              >
                {qText}
              </button>
            ))}

            {showMoreSuggestions &&
              MORE_QUESTIONS.map((qText, idx) => (
                <button
                  key={`more-${idx}`}
                  type="button"
                  onClick={() => handleExecuteQuery(qText)}
                  className="bg-white hover:bg-[#F3EFEA] border border-[#E8E5DF] hover:border-[#D0CBC0] text-[#44403C] px-3.5 py-1.5 rounded-full transition-all cursor-pointer truncate max-w-[280px] sm:max-w-none text-left animate-fade-in"
                >
                  {qText}
                </button>
              ))}

            <button
              type="button"
              onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
              className="text-[#1E3A2B] hover:text-[#2D5A3C] font-semibold flex items-center gap-1 px-2 py-1 rounded-md hover:underline cursor-pointer"
            >
              <span>{showMoreSuggestions ? 'Show less' : 'Show more'}</span>
              <span>{showMoreSuggestions ? '↑' : '→'}</span>
            </button>
          </div>
        </div>

        {/* ── 3. TWO-COLUMN MAIN GRID: ANSWER CARD + SIDEBAR ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT COLUMN: MAIN EVALUATION RESULT (8 COLS) ─────────────── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Loading State */}
            {isLoading && !queryResult && (
              <div className="bg-white border border-[#E8E5DF] rounded-3xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-3 border-[#1E3A2B] border-t-transparent animate-spin mx-auto" />
                <div className="text-base font-bold text-[#1C1917]">Evaluating Claim with Clinical Evidence...</div>
                <p className="text-xs text-[#78716C] max-w-sm mx-auto">
                  Searching canonical reviewed claims, cross-referencing WHO/EAU/AUA guidelines, and verifying evidence citations.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-5 flex items-start gap-3">
                <svg className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 text-sm text-[#991B1B]">
                  <div className="font-bold">Evaluation Notice</div>
                  <div>{error}</div>
                  <button
                    type="button"
                    onClick={() => handleExecuteQuery(searchQuery)}
                    className="mt-2 text-xs font-bold text-[#DC2626] underline hover:no-underline cursor-pointer"
                  >
                    Retry Query
                  </button>
                </div>
              </div>
            )}

            {/* ── RESULT CARD ─────────────────────────────────────────────── */}
            {queryResult && (
              <div className="bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in relative">
                
                {/* Copied Toast */}
                {copiedToast && (
                  <div className="absolute top-4 right-14 bg-[#1C1917] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                    Link copied to clipboard!
                  </div>
                )}

                {/* Card Top: Classification Badge + Share Button */}
                <div className="flex items-center justify-between gap-4">
                  {/* Classification Badge */}
                  {queryResult.classification === 'FACT' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      FACT
                    </span>
                  ) : queryResult.classification === 'MYTH' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      MYTH
                    </span>
                  ) : queryResult.classification === 'MISLEADING' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FEF3E6] text-[#C05621] border border-[#FBD38D]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      MISLEADING
                    </span>
                  ) : queryResult.classification === 'CONTEXT_DEPENDENT' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      CONTEXT DEPENDENT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 10-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      INSUFFICIENT EVIDENCE
                    </span>
                  )}

                  {/* Share / Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2 text-[#78716C] hover:text-[#1C1917] rounded-xl hover:bg-[#F3EFEA] transition-colors cursor-pointer"
                    title="Share this claim"
                    aria-label="Share this claim"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>

                {/* Question / Claim Heading + Hand Holding Lightbulb Graphic */}
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] font-serif leading-tight">
                      {queryResult.canonical_claim || queryResult.query}
                    </h2>
                  </div>

                  {/* Lightbulb in hand illustration SVG matching visual reference */}
                  <div className="hidden sm:flex shrink-0 w-24 h-24 rounded-full bg-[#FEF8EC] border border-[#FDE68A] items-center justify-center p-3 select-none">
                    <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
                      {/* Radiating lines */}
                      <path d="M32 4v6M12 12l5 5M52 12l-5 5M4 32h6M54 32h6" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Bulb */}
                      <path d="M32 10a16 16 0 00-12 26.6c2.4 2.8 4 6 4 9.4h16c0-3.4 1.6-6.6 4-9.4A16 16 0 0032 10z" fill="#FFFBEB" stroke="#D97706" strokeWidth="2.5" />
                      <path d="M28 46h8v4h-8z" fill="#D97706" />
                      <path d="M30 50h4v2h-4z" fill="#B45309" />
                      {/* Hand holding base */}
                      <path d="M20 54c3 0 6 3 12 3s9-3 12-3c1 5-4 7-12 7s-13-2-12-7z" fill="#F8CBA6" stroke="#1E3A2B" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Highlight Callout Box */}
                <div className="bg-[#FFF9EB] border border-[#FDE68A] rounded-2xl p-4 sm:p-5">
                  <div className="text-[15px] sm:text-base font-bold text-[#1C1917] leading-snug">
                    {queryResult.classification === 'MYTH'
                      ? `No, this claim is contradicted by clinical evidence.`
                      : queryResult.classification === 'MISLEADING'
                      ? `No, ${queryResult.canonical_claim || queryResult.query.toLowerCase()} is not directly supported as claimed.`
                      : queryResult.classification === 'FACT'
                      ? `Yes, this is supported by clinical consensus.`
                      : queryResult.classification === 'CONTEXT_DEPENDENT'
                      ? `The answer is context-dependent based on intensity, duration, and individual factors.`
                      : `Current clinical evidence is insufficient to confirm or deny this claim.`}
                  </div>
                </div>

                {/* Explanation Paragraph */}
                <p className="text-[15px] sm:text-base text-[#44403C] leading-relaxed">
                  {queryResult.explanation}
                </p>

                {/* 3-Column Metadata Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  {/* Evidence Strength Card */}
                  <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">Evidence Strength</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-[#1C1917] truncate">{strength.label}</span>
                        {/* 5-Bar Meter */}
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((bar) => (
                            <div
                              key={bar}
                              className={`w-2.5 h-1.5 rounded-full ${
                                bar <= strength.bars ? 'bg-[#D97706]' : 'bg-[#E8E5DF]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Domain Card */}
                  <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">Domain</div>
                      <div className="text-xs font-bold text-[#1C1917] truncate mt-0.5">
                        {formatDomainName(queryResult.domain)}
                      </div>
                    </div>
                  </div>

                  {/* Review Status Card */}
                  <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">Review Status</div>
                      <div className="text-xs font-bold text-[#1C1917] truncate mt-0.5" title={queryResult.review_status}>
                        {queryResult.is_verified ? (
                          <span className="text-[#15803D]">Verified (Clinician)</span>
                        ) : queryResult.review_status?.includes('DRAFT') ? (
                          <span>Draft <span className="font-normal text-[#78716C]">(Requires Expert Review)</span></span>
                        ) : (
                          <span>AI Synthesized <span className="font-normal text-[#78716C]">(Unreviewed)</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two-Column Insights Cards: Key Takeaways & Bottom Line */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Key Takeaways */}
                  <div className="bg-[#F4FAF5] border border-[#DCEEE0] rounded-2xl p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A2B]">
                      <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Key Takeaways</span>
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-[13px] text-[#292524] leading-relaxed">
                      {takeaways.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#1E3A2B] font-bold mt-0.5">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom Line */}
                  <div className="bg-[#F4FAF5] border border-[#DCEEE0] rounded-2xl p-4 sm:p-5 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A2B] mb-2">
                        <svg className="w-4 h-4 text-[#1E3A2B]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Bottom Line</span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#292524] leading-relaxed font-medium">
                        {bottomLine}
                      </p>
                    </div>

                    <div className="pt-2 text-[11px] text-[#78716C] border-t border-[#E2EFE5]">
                      Educational clarification only. Not a medical consultation.
                    </div>
                  </div>
                </div>

                {/* Evidence & Sources Section */}
                <div className="pt-4 border-t border-[#E8E5DF] space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1C1917]">Evidence & Sources</h3>
                        <p className="text-xs text-[#78716C]">
                          This answer is based on trusted medical guidelines and peer-reviewed research.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAllSourcesModal(true)}
                      className="text-xs font-semibold text-[#1E3A2B] hover:text-[#2D5A3C] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>View All Sources</span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* Sources Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {queryResult.sources && queryResult.sources.length > 0 ? (
                      queryResult.sources.map((src, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-[#E8E5DF] hover:border-[#C8C3BA] rounded-2xl p-4 space-y-2.5 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-bold text-[#1C1917] truncate" title={src.source_title}>
                                {src.source_title.split('—')[0].split(':')[0]}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#78716C] line-clamp-2">
                              {src.source_title}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#F3EFEA]">
                            <span className="bg-[#F3EFEA] text-[#44403C] text-[10px] font-semibold px-2 py-0.5 rounded">
                              {src.source_id.split('_')[0]}
                            </span>
                            <a
                              href={src.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-[#1E3A2B] hover:underline flex items-center gap-1"
                            >
                              <span>View Source</span>
                              <span className="text-[11px]">↗</span>
                            </a>
                          </div>
                        </div>
                      ))
                    ) : queryResult.guideline_evidence && queryResult.guideline_evidence.length > 0 ? (
                      queryResult.guideline_evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-[#E8E5DF] hover:border-[#C8C3BA] rounded-2xl p-4 space-y-2.5 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-bold text-[#1C1917] truncate" title={ev.title}>
                                {ev.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#78716C] line-clamp-2">
                              {ev.source} {ev.publication_year ? `(${ev.publication_year})` : ''}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#F3EFEA]">
                            <span className="bg-[#F3EFEA] text-[#44403C] text-[10px] font-semibold px-2 py-0.5 rounded">
                              {ev.source}
                            </span>
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-[#1E3A2B] hover:underline flex items-center gap-1"
                            >
                              <span>View Source</span>
                              <span className="text-[11px]">↗</span>
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-4 bg-[#FAF9F6] rounded-2xl text-xs text-[#78716C]">
                        No individual guideline excerpts were mapped to this specific inquiry.
                      </div>
                    )}
                  </div>
                </div>

                {/* Disclaimer Footnote */}
                <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-[#78716C] leading-snug">
                  <svg className="w-4 h-4 text-[#78716C] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    {queryResult.disclaimer ||
                      'MantraAI Myth vs Fact Engine is an evidence-informed educational tool. Content is curated for general health awareness and does not provide clinical diagnoses, fertility predictions, or individualized treatment plans. Always consult a qualified healthcare provider.'}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN: BROWSE BY TOPIC + RECENT QUESTIONS (4 COLS) ─── */}
          <div className="lg:col-span-4 space-y-6">

            {/* 1. BROWSE BY TOPIC CARD */}
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#1C1917]">
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1C1917]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">Browse by Topic</h3>
              </div>

              {/* Topics List */}
              <div className="divide-y divide-[#F3EFEA]">
                {BROWSE_TOPICS.map((topic) => {
                  const count = topicStats[topic.domainQuery] || topic.defaultCount;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectTopic(topic)}
                      className="w-full py-2.5 flex items-center justify-between group text-left hover:bg-[#FAF9F6] px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${topic.iconBg} flex items-center justify-center shrink-0`}>
                          {topic.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] truncate transition-colors">
                            {topic.title}
                          </div>
                          <div className="text-[11px] text-[#A8A29E]">
                            {count} topics
                          </div>
                        </div>
                      </div>

                      <span className="text-[#A8A29E] group-hover:text-[#1E3A2B] text-sm font-semibold transition-colors">
                        ›
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* View All Topics Button */}
              <button
                type="button"
                onClick={() => setShowAllTopicsModal(true)}
                className="w-full text-center text-xs font-bold text-[#1E3A2B] hover:text-[#2D5A3C] py-2.5 rounded-xl hover:bg-[#FAF9F6] transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-t border-[#F3EFEA]"
              >
                <span>View All Topics</span>
                <span>→</span>
              </button>
            </div>

            {/* 2. RECENT QUESTIONS CARD */}
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#1C1917]">
                <svg className="w-5 h-5 text-[#1C1917]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-base font-bold text-[#1C1917]">Recent Questions</h3>
              </div>

              {recentHistory.length > 0 ? (
                <div className="divide-y divide-[#F3EFEA]">
                  {recentHistory.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      type="button"
                      onClick={() => handleExecuteQuery(item.query_text)}
                      className="w-full py-3 flex items-center justify-between text-left group hover:bg-[#FAF9F6] px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] truncate transition-colors">
                          {item.query_text}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.classification === 'FACT'
                                ? 'bg-[#E6F4EA] text-[#137333]'
                                : item.classification === 'MYTH'
                                ? 'bg-[#FEE2E2] text-[#DC2626]'
                                : item.classification === 'MISLEADING'
                                ? 'bg-[#FEF3E6] text-[#C05621]'
                                : item.classification === 'CONTEXT_DEPENDENT'
                                ? 'bg-[#E8F0FE] text-[#1A73E8]'
                                : 'bg-[#F1F3F4] text-[#5F6368]'
                            }`}
                          >
                            {item.classification.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-[#A8A29E]">
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                      </div>

                      <span className="text-[#A8A29E] group-hover:text-[#1E3A2B] text-sm font-semibold transition-colors">
                        ›
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Fallback Starter Questions if history is empty */
                <div className="divide-y divide-[#F3EFEA]">
                  {[
                    { text: 'Is tight underwear bad for sperm?', tag: 'CONTEXT DEPENDENT', tagClass: 'bg-[#E8F0FE] text-[#1A73E8]', time: '2 days ago' },
                    { text: 'Can laptop use reduce fertility?', tag: 'INSUFFICIENT EVIDENCE', tagClass: 'bg-[#F1F3F4] text-[#5F6368]', time: '4 days ago' },
                    { text: 'Does porn cause erectile dysfunction?', tag: 'MISLEADING', tagClass: 'bg-[#FEF3E6] text-[#C05621]', time: '5 days ago' },
                    { text: 'Does eating eggs increase testosterone?', tag: 'MISLEADING', tagClass: 'bg-[#FEF3E6] text-[#C05621]', time: '1 week ago' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleExecuteQuery(item.text)}
                      className="w-full py-3 flex items-center justify-between text-left group hover:bg-[#FAF9F6] px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] truncate transition-colors">
                          {item.text}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.tagClass}`}>
                            {item.tag}
                          </span>
                          <span className="text-[11px] text-[#A8A29E]">{item.time}</span>
                        </div>
                      </div>

                      <span className="text-[#A8A29E] group-hover:text-[#1E3A2B] text-sm font-semibold transition-colors">
                        ›
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* View All History Button */}
              <button
                type="button"
                onClick={() => {
                  if (recentHistory.length > 0) {
                    handleExecuteQuery(recentHistory[0].query_text);
                  }
                }}
                className="w-full text-center text-xs font-bold text-[#1E3A2B] hover:text-[#2D5A3C] py-2.5 rounded-xl hover:bg-[#FAF9F6] transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-t border-[#F3EFEA]"
              >
                <span>View All History</span>
                <span>→</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ── MODAL 1: VIEW ALL SOURCES ─────────────────────────────────────── */}
      {showAllSourcesModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E5DF] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-[#E8E5DF] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1C1917]">Authoritative Evidence Sources</h3>
                  <p className="text-xs text-[#78716C]">Registered medical guidelines supporting MantraAI Myth vs Fact Engine</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllSourcesModal(false)}
                className="p-2 text-[#78716C] hover:text-[#1C1917] rounded-full hover:bg-[#F3EFEA] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {allSourcesList.map((s, idx) => (
                <div key={idx} className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1C1917] truncate">{s.source_title}</div>
                    <div className="text-[11px] text-[#78716C] mt-0.5">{s.source_id}</div>
                  </div>
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-white border border-[#E8E5DF] hover:border-[#1E3A2B] text-[#1E3A2B] px-3 py-1.5 rounded-lg text-xs font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>View Guideline</span>
                    <span>↗</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: BROWSE TOPIC CLAIMS ──────────────────────────────────── */}
      {selectedTopicClaims && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E5DF] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-[#E8E5DF] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${selectedTopicClaims.iconBg} flex items-center justify-center`}>
                  {selectedTopicClaims.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1C1917]">{selectedTopicClaims.title}</h3>
                  <p className="text-xs text-[#78716C]">Select a canonical claim to evaluate its evidence</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicClaims(null)}
                className="p-2 text-[#78716C] hover:text-[#1C1917] rounded-full hover:bg-[#F3EFEA] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {loadingTopicClaims ? (
                <div className="text-center py-8 text-sm text-[#78716C]">Loading topic claims...</div>
              ) : selectedTopicClaims.claims && selectedTopicClaims.claims.length > 0 ? (
                selectedTopicClaims.claims.map((claim, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedTopicClaims(null);
                      handleExecuteQuery(claim.canonical_claim);
                    }}
                    className="w-full bg-[#FAF9F6] hover:bg-[#F3EFEA] border border-[#E8E5DF] hover:border-[#D0CBC0] rounded-2xl p-4 text-left space-y-1 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1917] group-hover:text-[#1E3A2B]">
                        {claim.canonical_claim}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          claim.classification === 'FACT'
                            ? 'bg-[#E6F4EA] text-[#137333]'
                            : claim.classification === 'MYTH'
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : claim.classification === 'MISLEADING'
                            ? 'bg-[#FEF3E6] text-[#C05621]'
                            : claim.classification === 'CONTEXT_DEPENDENT'
                            ? 'bg-[#E8F0FE] text-[#1A73E8]'
                            : 'bg-[#F1F3F4] text-[#5F6368]'
                        }`}
                      >
                        {claim.classification}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78716C] line-clamp-2">{claim.explanation}</p>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-[#78716C]">No direct claims indexed for this specific domain yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      const hint = selectedTopicClaims.searchHint || selectedTopicClaims.title;
                      setSelectedTopicClaims(null);
                      handleExecuteQuery(hint);
                    }}
                    className="bg-[#1E3A2B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#2D5A3C] cursor-pointer"
                  >
                    Search Guidelines on this Topic
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
