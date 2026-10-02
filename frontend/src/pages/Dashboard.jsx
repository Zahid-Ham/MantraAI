import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '../components/layout/AppShell';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  DOMAIN_DEFINITIONS,
  deriveLongitudinalData,
  deriveComparison,
} from '../utils/longitudinal';

export default function Dashboard({ onNavigateHome }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [reportsMap, setReportsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('all'); // all, 6m, 1y
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiRequest('/api/v1/assessments');

        if (!isMounted) return;

        if (Array.isArray(data)) {
          // Sort newest to oldest for session storage
          const sorted = [...data].sort((a, b) => {
            const dateA = new Date(a.completed_at || a.started_at || 0).getTime();
            const dateB = new Date(b.completed_at || b.started_at || 0).getTime();
            return dateB - dateA;
          });
          setSessions(sorted);

          const completed = sorted.filter((s) => s.status === 'COMPLETED');

          // Fetch reports for completed sessions
          const repMap = {};
          await Promise.all(
            completed.map(async (sess) => {
              try {
                const rep = await apiRequest(`/api/v1/assessments/${sess.id}/report`);
                repMap[sess.id] = rep;
              } catch (err) {
                console.warn(`Report fetch skipped for session ${sess.id}:`, err);
              }
            })
          );

          if (isMounted) {
            setReportsMap(repMap);
          }
        }
      } catch (_err) {
        if (isMounted) {
          setError('Unable to load your dashboard records. Please check your connection and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter completed sessions strictly chronologically by timestamp (Oldest -> Newest)
  const completedSessionsChronological = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'COMPLETED')
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.completed_at || a.started_at || 0).getTime();
        const dateB = new Date(b.completed_at || b.started_at || 0).getTime();
        return dateA - dateB;
      });
  }, [sessions]);

  // Completed sessions strictly chronologically (Newest -> Oldest)
  const completedSessionsNewestFirst = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'COMPLETED')
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.completed_at || a.started_at || 0).getTime();
        const dateB = new Date(b.completed_at || b.started_at || 0).getTime();
        return dateB - dateA;
      });
  }, [sessions]);

  // Derive structured longitudinal data & comparison
  const longitudinalData = useMemo(() => {
    return deriveLongitudinalData(completedSessionsChronological, reportsMap);
  }, [completedSessionsChronological, reportsMap]);

  const comparison = useMemo(() => {
    return deriveComparison(longitudinalData);
  }, [longitudinalData]);

  // Latest session & report
  const latestSession = completedSessionsNewestFirst[0] || null;
  const latestReport = latestSession ? reportsMap[latestSession.id] : null;

  // Derive firstName for clean welcome header
  const rawDisplayName = user?.displayName || (user?.email ? user.email.split('@')[0] : '');
  const firstName = rawDisplayName ? rawDisplayName.split(' ')[0] : 'there';

  // Calculate elapsed time since first assessment
  const timeSinceFirstAssessment = useMemo(() => {
    if (longitudinalData.length === 0) return '';
    const firstTimestamp = longitudinalData[0].timestamp;
    const latestTimestamp = longitudinalData[longitudinalData.length - 1].timestamp;
    const diffMonths = Math.max(0, Math.round((latestTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24 * 30.4)));
    if (diffMonths === 0) {
      return 'Initial baseline assessment';
    }
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} since your first assessment`;
  }, [longitudinalData]);

  // Latest report priority & positive counts
  const latestPriorityCount = useMemo(() => {
    if (!latestReport) return comparison.totalModifiable;
    if (Array.isArray(latestReport.priority_factors)) {
      return latestReport.priority_factors.length;
    }
    return comparison.totalModifiable;
  }, [latestReport, comparison.totalModifiable]);

  const latestPositiveCount = useMemo(() => {
    if (!latestReport) return comparison.totalPositive;
    if (Array.isArray(latestReport.positive_factors)) {
      return latestReport.positive_factors.length;
    }
    return comparison.totalPositive;
  }, [latestReport, comparison.totalPositive]);

  // Navigation handlers
  const handleTakeNewAssessment = () => {
    window.location.hash = '#assess';
  };

  const handleViewMyProgress = () => {
    window.location.hash = '#progress';
  };

  const handleExploreResources = () => {
    window.location.hash = '#resources';
  };

  const handleViewAllHistory = () => {
    window.location.hash = '#history';
  };

  const handleViewReport = (sessionId) => {
    window.location.hash = `#report?id=${sessionId}`;
  };

  return (
    <AppShell currentTab="dashboard" onNavigateHome={onNavigateHome}>
      <div className="w-full space-y-6 pb-12 font-sans">
        
        {/* ========================================================================= */}
        {/* 1. WELCOME HEADER (Matching Visual Reference)                             */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-7 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-[#1C1917] tracking-tight">
                Welcome back, {firstName}
              </h1>
              {/* Natural Leaf Icon SVG */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                </svg>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#57534E] mt-1.5 leading-relaxed">
              Here's an overview of your health journey with MantraAI.
            </p>
          </div>

          {/* Inspirational Quote Card on Right with Nature Backdrop */}
          <div className="relative z-10 hidden sm:flex items-center gap-3 bg-[#FAF8F5] border border-[#EAE5DD] rounded-xl px-4 py-3 shadow-2xs self-start md:self-auto max-w-xs">
            <span className="text-[#1E3A2B] text-lg font-serif">“</span>
            <p className="text-xs text-[#44403C] font-medium leading-snug">
              Small, consistent steps create meaningful change.
            </p>
            <span className="text-[#1E3A2B] text-lg font-serif">”</span>
          </div>

          {/* Decorative Natural Art Backdrop on Header Right */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-80 pointer-events-none opacity-75 select-none">
            <svg className="w-full h-full" viewBox="0 0 320 120" preserveAspectRatio="none" fill="none">
              <circle cx="250" cy="30" r="22" fill="#FDE68A" fillOpacity="0.65" />
              <path d="M40 120 Q 140 70, 240 85 T 320 50 L 320 120 Z" fill="#A7F3D0" fillOpacity="0.35" />
              <path d="M100 120 Q 200 65, 270 75 T 320 40 L 320 120 Z" fill="#34D399" fillOpacity="0.25" />
              <path d="M285 85 C 270 65, 290 50, 305 65 C 310 80, 290 90, 285 85 Z" fill="#2D5A3C" fillOpacity="0.25" />
            </svg>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse" aria-busy="true">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-[#EAE5DD] rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-80 bg-[#EAE5DD] rounded-2xl" />
              <div className="lg:col-span-4 h-80 bg-[#EAE5DD] rounded-2xl" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="border border-red-500/20 bg-red-500/[0.04] text-red-700 px-6 py-5 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 text-xs font-semibold bg-white border border-red-200 rounded-lg hover:bg-red-50 text-red-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ZERO ASSESSMENTS STATE                                                    */}
        {/* ========================================================================= */}
        {!loading && !error && completedSessionsChronological.length === 0 && (
          <div className="bg-white border border-[#E8E5DF] rounded-3xl p-10 sm:p-14 text-center space-y-6 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#EBF5EE] text-[#1E3A2B] mx-auto flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917]">
                Start Your Health Journey
              </h2>
              <p className="text-sm text-[#57534E]">
                Complete your first assessment to establish your personalized health context and unlock your dashboard analytics.
              </p>
            </div>
            <button
              onClick={handleTakeNewAssessment}
              className="inline-flex items-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all cursor-pointer"
            >
              <span>Take Your First Assessment</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN BODY (When Assessments Exist)                                       */}
        {/* ========================================================================= */}
        {!loading && !error && completedSessionsChronological.length > 0 && (
          <>
            {/* ===================================================================== */}
            {/* 2. FOUR SUMMARY CARDS (Matching Visual Reference)                     */}
            {/* ===================================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Assessments */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#78716C]">
                    Total Assessments
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#059669] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                    {comparison.totalCompleted}
                  </div>
                  <div className="text-xs text-[#78716C] mt-1 truncate">
                    Your health journey so far
                  </div>
                </div>
              </div>

              {/* Card 2: Last Assessment */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#78716C]">
                    Last Assessment
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-base sm:text-lg font-bold text-[#1C1917] flex items-center gap-2 flex-wrap">
                    <span>{comparison.latestDate || 'Recorded'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#059669] border border-[#C8E6D2]">
                      • Completed
                    </span>
                  </div>
                  <div className="text-xs text-[#78716C] mt-1 truncate">
                    {timeSinceFirstAssessment}
                  </div>
                </div>
              </div>

              {/* Card 3: Key Focus Areas */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#78716C]">
                    Key Focus Areas
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                    {latestPriorityCount}
                  </div>
                  <div className="text-xs text-[#78716C] mt-1 truncate">
                    Areas to work on
                  </div>
                </div>
              </div>

              {/* Card 4: Positive Factors */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#78716C]">
                    Positive Factors
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold text-[#059669]">
                    {latestPositiveCount}
                  </div>
                  <div className="text-xs text-[#78716C] mt-1 truncate">
                    Strengths to maintain
                  </div>
                </div>
              </div>

            </div>

            {/* ===================================================================== */}
            {/* 3. MIDDLE SECTION: CHART (Left) & LATEST REPORT SUMMARY (Right)       */}
            {/* ===================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (7 cols): Health Domains at a Glance */}
              <div className="lg:col-span-7 bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3EFEA] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <h2 className="text-base sm:text-[17px] font-bold text-[#1C1917]">
                        Your Health Domains at Glance
                      </h2>
                    </div>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Compare your self-reported health context across assessments.
                    </p>
                  </div>

                  {/* Time Filter Select */}
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="text-xs font-semibold bg-[#FAF9F6] border border-[#E8E5DF] rounded-lg px-2.5 py-1.5 text-[#57534E] hover:border-[#D0CBC0] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E3A2B] self-start sm:self-auto"
                  >
                    <option value="all">Last 6 Months</option>
                    <option value="6m">All Assessments</option>
                  </select>
                </div>

                {/* SVG Line Chart Canvas */}
                <div className="pt-2">
                  <div className="relative w-full h-60 sm:h-64 select-none">
                    
                    {/* Y-Axis Labels */}
                    <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[11px] font-medium text-[#A8A29E] text-right pr-2 select-none">
                      <span>100</span>
                      <span>80</span>
                      <span>60</span>
                      <span>40</span>
                      <span>20</span>
                      <span>0</span>
                    </div>

                    {/* Chart Canvas */}
                    <div className="ml-9 mr-2 h-[calc(100%-24px)] relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
                        {/* Horizontal Gridlines */}
                        {[0, 40, 80, 120, 160, 200].map((yVal, idx) => (
                          <line
                            key={idx}
                            x1="0"
                            y1={yVal}
                            x2="400"
                            y2={yVal}
                            stroke="#F3EFEA"
                            strokeWidth="1"
                            strokeDasharray={idx === 5 ? 'none' : '3 3'}
                          />
                        ))}

                        {/* Lines for each canonical domain */}
                        {DOMAIN_DEFINITIONS.map((dom) => {
                          const points = longitudinalData
                            .map((d, idx) => {
                              const score = d.domainScores[dom.key];
                              if (score === null || score === undefined) return null;
                              const totalPoints = Math.max(1, longitudinalData.length);
                              const x = totalPoints === 1 ? 200 : (idx / (totalPoints - 1)) * 380 + 10;
                              const y = 200 - (score / 100) * 180 - 10;
                              return { x, y, score, date: d.dateLabel, d };
                            })
                            .filter(Boolean);

                          if (points.length === 0) return null;

                          let pathD = `M ${points[0].x} ${points[0].y}`;
                          for (let i = 1; i < points.length; i++) {
                            const prev = points[i - 1];
                            const curr = points[i];
                            const cp1x = prev.x + (curr.x - prev.x) / 2;
                            const cp1y = prev.y;
                            const cp2x = prev.x + (curr.x - prev.x) / 2;
                            const cp2y = curr.y;
                            pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
                          }

                          return (
                            <g key={dom.key}>
                              {points.length > 1 && (
                                <path
                                  d={pathD}
                                  fill="none"
                                  stroke={dom.color}
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              )}

                              {points.map((pt, pIdx) => (
                                <g key={pIdx}>
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="4.5"
                                    fill={dom.color}
                                    stroke="#FFFFFF"
                                    strokeWidth="2"
                                    className="cursor-pointer hover:r-6 transition-all"
                                    onMouseEnter={() =>
                                      setHoveredPoint({
                                        domain: dom,
                                        score: pt.score,
                                        date: pt.d.fullDateLabel,
                                        factors: pt.d.domainFactors[dom.key],
                                        x: pt.x,
                                        y: pt.y,
                                      })
                                    }
                                    onMouseLeave={() => setHoveredPoint(null)}
                                  />
                                </g>
                              ))}
                            </g>
                          );
                        })}
                      </svg>

                      {/* Tooltip Overlay */}
                      {hoveredPoint && (
                        <div
                          className="absolute z-30 bg-[#1C1917] text-white p-3 rounded-xl shadow-lg text-xs pointer-events-none transition-all max-w-[240px]"
                          style={{
                            left: `${(hoveredPoint.x / 400) * 100}%`,
                            top: `${Math.max(0, (hoveredPoint.y / 200) * 100 - 30)}%`,
                            transform: 'translate(-50%, -100%)',
                          }}
                        >
                          <div className="font-bold flex items-center gap-1.5" style={{ color: hoveredPoint.domain.color }}>
                            <span>{hoveredPoint.domain.title}</span>
                          </div>
                          <div className="text-[11px] text-[#D6D3D1] mt-1">
                            {hoveredPoint.date}
                          </div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            Reported Context Indicator: <span className="font-bold">{hoveredPoint.score}%</span>
                          </div>
                          <div className="text-[11px] text-[#A8A29E] mt-1 flex items-center gap-2">
                            <span>Focus: <strong className="text-white">{hoveredPoint.factors?.priorityCount ?? 0}</strong></span>
                            <span>•</span>
                            <span>Positive: <strong className="text-[#34D399]">{hoveredPoint.factors?.positiveCount ?? 0}</strong></span>
                          </div>
                          <div className="text-[9.5px] text-[#A8A29E]/80 mt-1.5 pt-1.5 border-t border-white/10 leading-tight italic">
                            Non-clinical visualization derived from self-reported context. Not a medical score.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="ml-9 mr-2 h-6 flex justify-between items-center text-[11px] font-medium text-[#78716C] pt-1 border-t border-[#E8E5DF]">
                      {longitudinalData.length === 1 ? (
                        <div className="w-full text-center">
                          {longitudinalData[0].dateLabel} (Baseline)
                        </div>
                      ) : (
                        longitudinalData.map((d, i) => (
                          <span key={i} className="truncate">
                            {d.dateLabel}
                          </span>
                        ))
                      )}
                    </div>

                  </div>

                  {/* Single Assessment Note */}
                  {longitudinalData.length === 1 && (
                    <div className="mt-2 p-2.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl flex items-center gap-2 text-xs text-[#57534E]">
                      <svg className="w-4 h-4 text-[#1E3A2B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        <strong>Baseline established:</strong> Complete another assessment later to compare changes over time.
                      </span>
                    </div>
                  )}

                  {/* Chart Domain Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-[#F3EFEA] mt-2">
                    {DOMAIN_DEFINITIONS.map((dom) => (
                      <div key={dom.key} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#57534E]">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dom.color }} />
                        <span>{dom.shortTitle}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-[#A8A29E] text-center italic pt-1">
                    A non-clinical visualization of self-reported contextual factors. It is not a medical score or diagnosis.
                  </p>

                </div>
              </div>

              {/* Right Column (5 cols): Latest Assessment Summary */}
              <div className="lg:col-span-5 bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="border-b border-[#F3EFEA] pb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="text-base sm:text-[17px] font-bold text-[#1C1917]">
                      Latest Assessment Summary
                    </h2>
                  </div>
                </div>

                {latestSession ? (
                  <div className="space-y-4 pt-1">
                    <div
                      onClick={() => handleViewReport(latestSession.id)}
                      className="p-4 rounded-xl border border-[#E8E5DF] bg-[#FAF8F5] hover:border-[#D0CBC0] transition-all cursor-pointer space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors leading-snug">
                          {latestReport?.executive_summary?.headline || 'Reproductive Health & Wellness Report'}
                        </h3>
                        <svg className="w-4 h-4 text-[#78716C] group-hover:text-[#1E3A2B] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#78716C]">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{comparison.latestDate || 'Recent'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#059669] border border-[#C8E6D2]">
                          • Completed
                        </span>
                      </div>

                      <p className="text-xs text-[#57534E] leading-relaxed line-clamp-3">
                        {latestReport?.executive_summary?.overview ||
                          'Good habits in place, with clear opportunities to boost overall wellbeing. You are doing well in several areas and there are practical steps you can take.'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleViewReport(latestSession.id)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Full Report</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#78716C] bg-[#FAF9F6] rounded-xl border border-[#E8E5DF]">
                    No completed assessment report recorded yet.
                  </div>
                )}
              </div>

            </div>

            {/* ===================================================================== */}
            {/* 4. BOTTOM 3-COLUMN SECTION (Matching Visual Reference)                */}
            {/* ===================================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              
              {/* Column 1: Quick Actions */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="border-b border-[#F3EFEA] pb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h2 className="text-base font-bold text-[#1C1917]">
                      Quick Actions
                    </h2>
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Common things you can do next.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  
                  {/* Action 1: Take New Assessment */}
                  <button
                    onClick={handleTakeNewAssessment}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8E5DF] bg-[#FAF8F5] hover:border-[#D0CBC0] hover:bg-white transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#059669] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                          Take New Assessment
                        </h4>
                        <p className="text-[11px] text-[#78716C]">
                          Track your progress
                        </p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1E3A2B] group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Action 2: View My Progress */}
                  <button
                    onClick={handleViewMyProgress}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8E5DF] bg-[#FAF8F5] hover:border-[#D0CBC0] hover:bg-white transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#E6F4F2] text-[#0D9488] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                          View My Progress
                        </h4>
                        <p className="text-[11px] text-[#78716C]">
                          See trends over time
                        </p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1E3A2B] group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Action 3: Explore Resources */}
                  <button
                    onClick={handleExploreResources}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8E5DF] bg-[#FAF8F5] hover:border-[#D0CBC0] hover:bg-white transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors">
                          Explore Resources
                        </h4>
                        <p className="text-[11px] text-[#78716C]">
                          Learn and stay informed
                        </p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1E3A2B] group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Action 4: Chat with AI (Coming Soon) */}
                  <div className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8E5DF] bg-[#FAF8F5] opacity-80 cursor-default">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917]">
                            Chat with AI
                          </h4>
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#EAE5DD] text-[#78716C]">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-[11px] text-[#78716C]">
                          Get personalized guidance
                        </p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-[#A8A29E] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                </div>
              </div>

              {/* Column 2: Recent Activity */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F3EFEA] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-base font-bold text-[#1C1917]">
                        Recent Activity
                      </h2>
                    </div>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Your latest assessments and updates.
                    </p>
                  </div>

                  <button
                    onClick={handleViewAllHistory}
                    className="text-xs font-semibold text-[#1E3A2B] bg-[#FAF9F6] border border-[#E8E5DF] hover:bg-[#F3EFEA] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3 pt-1">
                  {completedSessionsNewestFirst.slice(0, 3).map((sess, idx) => {
                    const d = new Date(sess.completed_at || sess.started_at);
                    const isFirst = idx === completedSessionsNewestFirst.length - 1;
                    const dateFormatted = d.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleViewReport(sess.id)}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[#F5F2EB] bg-[#FAF8F5] hover:border-[#EAE5DD] hover:bg-white transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              idx === 0 ? 'bg-[#059669]' : 'bg-[#2563EB]'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-[#78716C]">
                              {dateFormatted}
                            </div>
                            <div className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors truncate">
                              {isFirst ? 'First assessment' : 'Assessment completed'}
                            </div>
                            <div className="text-[11px] text-[#57534E] truncate">
                              Reproductive Health & Wellness Report
                            </div>
                          </div>
                        </div>

                        <svg className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1E3A2B] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Personalized Recommendations */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="border-b border-[#F3EFEA] pb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h2 className="text-base font-bold text-[#1C1917]">
                      Personalized Recommendations
                    </h2>
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Based on your latest assessment and progress.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  
                  {/* Rec 1: Action Plan */}
                  <div
                    onClick={handleViewMyProgress}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[#F5F2EB] bg-[#FAF8F5] hover:border-[#EAE5DD] hover:bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors leading-snug">
                          Continue Your Action Plan
                        </h4>
                        <p className="text-[11px] text-[#57534E] mt-0.5 leading-snug">
                          Work on your current action items and track your progress in My Progress.
                        </p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1E3A2B] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Rec 2: Focus on Lifestyle Habits */}
                  <div
                    onClick={handleViewMyProgress}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[#F5F2EB] bg-[#FAF8F5] hover:border-[#EAE5DD] hover:bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors leading-snug">
                          Focus on Lifestyle Habits
                        </h4>
                        <p className="text-[11px] text-[#57534E] mt-0.5 leading-snug">
                          Small, consistent changes in activity, sleep and diet can make a real difference.
                        </p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1E3A2B] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Rec 3: Clinical Professional Consultation */}
                  <div
                    onClick={handleViewMyProgress}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[#F5F2EB] bg-[#FAF8F5] hover:border-[#EAE5DD] hover:bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#E6F4F2] text-[#0D9488] flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1917] group-hover:text-[#1E3A2B] transition-colors leading-snug">
                          Discuss With a Healthcare Professional
                        </h4>
                        <p className="text-[11px] text-[#57534E] mt-0.5 leading-snug">
                          Consider discussing your concerns and progress with a qualified healthcare provider.
                        </p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#1E3A2B] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                </div>
              </div>

            </div>

          </>
        )}

      </div>
    </AppShell>
  );
}
