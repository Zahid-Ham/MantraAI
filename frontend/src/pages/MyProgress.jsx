import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '../components/layout/AppShell';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  DOMAIN_DEFINITIONS,
  deriveLongitudinalData,
  deriveComparison,
} from '../utils/longitudinal';

export default function MyProgress({ onNavigateHome }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [reportsMap, setReportsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, daily_activity, trends, improvements, action_plan, timeline
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [timeframe, setTimeframe] = useState('all'); // all, 6m, 1y
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [actionStatuses, setActionStatuses] = useState({});
  const [dismissedRecommendation, setDismissedRecommendation] = useState(false);

  // Daily Health Data & Adaptive Goals state
  const [latestDailyMetric, setLatestDailyMetric] = useState(null);
  const [dailyMetricsList, setDailyMetricsList] = useState([]);
  const [todayGoals, setTodayGoals] = useState([]);
  const [healthTrends, setHealthTrends] = useState(null);
  const [selectedTrendMetric, setSelectedTrendMetric] = useState('steps'); // 'steps' | 'active_minutes' | 'sleep_duration_minutes' | 'resting_heart_rate'
  const [isSyncingHealth, setIsSyncingHealth] = useState(false);
  const [healthSyncSuccess, setHealthSyncSuccess] = useState(null);
  const [healthSyncError, setHealthSyncError] = useState(null);

  // Load user-scoped action item statuses from localStorage
  useEffect(() => {
    if (user?.uid) {
      try {
        const saved = localStorage.getItem(`mantra_action_statuses_${user.uid}`);
        if (saved) {
          setActionStatuses(JSON.parse(saved));
        }
      } catch (_e) {
        // ignore
      }
    }
  }, [user]);

  const toggleActionStatus = (actionId) => {
    setActionStatuses((prev) => {
      const next = { ...prev, [actionId]: !prev[actionId] };
      if (user?.uid) {
        try {
          localStorage.setItem(`mantra_action_statuses_${user.uid}`, JSON.stringify(next));
        } catch (_e) {
          // ignore
        }
      }
      return next;
    });
  };

  // Fetch assessments and reports
  useEffect(() => {
    let isMounted = true;

    const fetchHistoryData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiRequest('/api/v1/assessments');

        if (!isMounted) return;

        if (Array.isArray(data)) {
          // Sort newest to oldest for state storage
          const sorted = [...data].sort((a, b) => {
            const dateA = new Date(a.completed_at || a.started_at || 0).getTime();
            const dateB = new Date(b.completed_at || b.started_at || 0).getTime();
            return dateB - dateA;
          });
          setSessions(sorted);

          const completed = sorted.filter((s) => s.status === 'COMPLETED');

          // Fetch reports in parallel for completed sessions
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
          setError('Unable to load your health progress records. Please check your connection and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistoryData();
    fetchHealthData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch daily health metrics, today's adaptive goals, and trends
  const fetchHealthData = async () => {
    try {
      const [latestRes, dailyRes, goalsRes, trendsRes] = await Promise.allSettled([
        apiRequest('/api/v1/health/daily/latest'),
        apiRequest('/api/v1/health/daily'),
        apiRequest('/api/v1/goals/today'),
        apiRequest('/api/v1/health/trends'),
      ]);

      if (latestRes.status === 'fulfilled' && latestRes.value && latestRes.value.date) {
        setLatestDailyMetric(latestRes.value);
      } else {
        setLatestDailyMetric(null);
      }

      if (dailyRes.status === 'fulfilled' && Array.isArray(dailyRes.value)) {
        setDailyMetricsList(dailyRes.value);
      }

      if (goalsRes.status === 'fulfilled' && Array.isArray(goalsRes.value)) {
        setTodayGoals(goalsRes.value);
      }

      if (trendsRes.status === 'fulfilled' && trendsRes.value) {
        setHealthTrends(trendsRes.value);
      }
    } catch (err) {
      console.warn('Health data fetch skipped/failed:', err);
    }
  };

  // Sync Mock Health Data
  const handleSyncMockHealth = async () => {
    try {
      setIsSyncingHealth(true);
      setHealthSyncError(null);
      setHealthSyncSuccess(null);

      // 1. Ensure mock provider connection is active
      await apiRequest('/api/v1/health/connections/mock', {
        method: 'POST',
      });

      // 2. Trigger 7-day synchronization
      const syncRes = await apiRequest('/api/v1/health/sync', {
        method: 'POST',
        body: JSON.stringify({ source: 'mock' }),
      });

      // 3. Refresh health data and today's adaptive goals
      await fetchHealthData();
      setHealthSyncSuccess(`Successfully synced ${syncRes.records_received || 7} days of demo activity data.`);
      setTimeout(() => setHealthSyncSuccess(null), 4000);
    } catch (err) {
      setHealthSyncError(err.message || 'Failed to sync demo health data.');
    } finally {
      setIsSyncingHealth(false);
    }
  };

  // Toggle or update adaptive goal status
  const handleToggleGoal = async (goal) => {
    const isCompleted = goal.status === 'completed';
    const newStatus = isCompleted ? 'in_progress' : 'completed';
    const newProgress = !isCompleted && goal.target_value ? goal.target_value : (goal.progress_value || 0);

    // Optimistic UI update
    setTodayGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, status: newStatus, progress_value: newProgress } : g))
    );

    try {
      await apiRequest(`/api/v1/goals/${goal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          progress_value: newProgress,
        }),
      });
    } catch (err) {
      console.error('Failed to update goal status:', err);
      // Revert from server on failure
      fetchHealthData();
    }
  };

  // Helpers for duration & numbers
  const formatMinutes = (minutes) => {
    if (minutes === null || minutes === undefined) return '--';
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${minutes} min`;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '--';
    return Number(num).toLocaleString();
  };

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

  // Derive structured, deterministic domain factors and context indicators for each session
  const longitudinalData = useMemo(() => {
    return deriveLongitudinalData(completedSessionsChronological, reportsMap);
  }, [completedSessionsChronological, reportsMap]);

  // Baseline vs Latest longitudinal comparative analysis
  const comparison = useMemo(() => {
    return deriveComparison(longitudinalData);
  }, [longitudinalData]);

  // Extract action plan items from latest report
  const latestReport = longitudinalData.length > 0 ? longitudinalData[longitudinalData.length - 1].report : null;
  const actionPlanItems = useMemo(() => {
    if (!latestReport) return [];

    const sessionId = latestReport.report_metadata?.assessment_session_id || 'latest';

    if (Array.isArray(latestReport.personalized_action_plan) && latestReport.personalized_action_plan.length > 0) {
      return latestReport.personalized_action_plan.map((item, idx) => {
        if (typeof item === 'string') {
          return {
            id: `action_${sessionId}_${idx}`,
            title: item,
            description: 'Actionable lifestyle and wellness guidance derived from your structured assessment responses.',
            category: 'Lifestyle Wellness',
            timeframe: 'Ongoing daily habit',
          };
        }
        return {
          id: `action_${sessionId}_${idx}`,
          title: item.title || item.action || `Action Step ${idx + 1}`,
          description: item.description || item.rationale || 'Self-care & health context optimization step.',
          category: item.category || item.impact_area || 'Health Context',
          timeframe: item.timeframe || 'Next 2–4 weeks',
        };
      });
    }

    if (Array.isArray(latestReport.priority_factors) && latestReport.priority_factors.length > 0) {
      return latestReport.priority_factors.slice(0, 5).map((pf, idx) => ({
        id: `action_pf_${sessionId}_${idx}`,
        title: pf.recommendation || `Optimize ${pf.title}`,
        description: pf.description || 'Targeted recommendation based on reported contextual factors.',
        category: pf.domain ? pf.domain.replace(/_/g, ' ') : 'General Wellness',
        timeframe: 'Recommended focus area',
      }));
    }

    return [];
  }, [latestReport]);

  // Key Milestones generated from real chronological history
  const keyMilestones = useMemo(() => {
    if (longitudinalData.length === 0) return [];

    const list = [];
    const first = longitudinalData[0];
    const latest = longitudinalData[longitudinalData.length - 1];

    // Milestone 1: Baseline assessment
    const d1 = new Date(first.timestamp);
    list.push({
      id: 'm1',
      month: d1.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d1.getDate(),
      title: 'Initial Health Baseline Established',
      description: 'Completed comprehensive self-reported questionnaire across all 6 wellness domains.',
      badge: 'Baseline',
      badgeColor: 'bg-[#EBF5EE] text-[#1E3A2B] border-[#C8E6D2]',
    });

    // Milestone 2: If multiple sessions exist
    if (longitudinalData.length >= 2) {
      const dLatest = new Date(latest.timestamp);
      list.push({
        id: 'm_latest',
        month: dLatest.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: dLatest.getDate(),
        title: 'Longitudinal Comparison Unlocked',
        description: `Tracked changes across ${comparison.areasWithChange} domain${comparison.areasWithChange === 1 ? '' : 's'} between baseline and follow-up.`,
        badge: 'Trend Active',
        badgeColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
      });
    }

    // Milestone 3: Report & action plan generation
    if (latestReport) {
      const dRep = new Date(latest.timestamp);
      list.push({
        id: 'm_action',
        month: dRep.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: dRep.getDate(),
        title: 'Personalized Action Guidance Compiled',
        description: 'Evidence-informed recommendations and guidance integrated into active dashboard.',
        badge: 'Personalized',
        badgeColor: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      });
    }

    return list;
  }, [longitudinalData, comparison, latestReport]);

  const handleTakeNewAssessment = () => {
    window.location.hash = '#assess';
  };

  const handleViewReport = (sessionId) => {
    window.location.hash = `#report?id=${sessionId}`;
  };

  return (
    <AppShell currentTab="progress" onNavigateHome={onNavigateHome}>
      <div className="w-full space-y-6 pb-12 font-sans">
        
        {/* ========================================================================= */}
        {/* 1. PAGE HEADER                                                            */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1917] tracking-tight">
              My Progress
            </h1>
            <p className="text-sm sm:text-[14.5px] text-[#57534E] mt-1">
              Track your health journey over time and see how your efforts are making a difference.
            </p>
          </div>

          <button
            onClick={handleTakeNewAssessment}
            className="inline-flex items-center justify-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all shrink-0 cursor-pointer self-start sm:self-auto"
            aria-label="Take New Assessment"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Take New Assessment</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. PROGRESS NAVIGATION TABS (5 Functional Tabs)                           */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#E8E5DF] rounded-2xl p-1.5 shadow-2xs overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 min-w-max">
            
            {/* Tab 1: Progress Overview */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#1E3A2B] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Progress Overview</span>
            </button>

            {/* Tab 2: Daily Health Activity & Goals */}
            <button
              type="button"
              onClick={() => setActiveTab('daily_activity')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'daily_activity'
                  ? 'bg-[#1E3A2B] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Daily Health Activity</span>
            </button>

            {/* Tab 3: Trend Analysis */}
            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'trends'
                  ? 'bg-[#1E3A2B] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Trend Analysis</span>
            </button>

            {/* Tab 4: Key Improvements */}
            <button
              type="button"
              onClick={() => setActiveTab('improvements')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'improvements'
                  ? 'bg-[#1E3A2B] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>Key Improvements</span>
            </button>

            {/* Tab 5: Action Plan Tracking */}
            <button
              type="button"
              onClick={() => setActiveTab('action_plan')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'action_plan'
                  ? 'bg-[#1E3A2B] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Action Plan Tracking</span>
            </button>

            {/* Tab 6: Health Timeline */}
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-[#1E3A2B] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Health Timeline</span>
            </button>

          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse" aria-busy="true">
            <div className="h-32 bg-[#EAE5DD] rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-[#EAE5DD] rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-80 bg-[#EAE5DD] rounded-2xl" />
              <div className="h-80 bg-[#EAE5DD] rounded-2xl" />
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
              className="px-4 py-1.5 text-xs font-semibold bg-white border border-red-200 rounded-lg hover:bg-red-50 text-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Zero Assessment State */}
        {!loading && !error && completedSessionsChronological.length === 0 && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-10 sm:p-14 text-center space-y-6 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF5EE] text-[#1E3A2B] mx-auto flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl font-serif font-bold text-[#1C1917]">
                  Start Your Health Journey
                </h2>
                <p className="text-sm text-[#57534E]">
                  Complete your first assessment to begin tracking your reported health indicators and wellness patterns over time.
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

            {/* Daily Health Activity is also available for testing demo metrics without an assessment */}
            <div className="border-t border-[#E8E5DF] pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1C1917]">
                    Daily Health Activity & Goals
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Preview passive health tracking and adaptive goals using demo data.
                  </p>
                </div>
                <button
                  onClick={handleSyncMockHealth}
                  disabled={isSyncingHealth}
                  className="inline-flex items-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] disabled:opacity-60 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  {isSyncingHealth ? 'Syncing...' : 'Sync Demo Health Data'}
                </button>
              </div>

              {/* 5 Today's Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4">
                  <span className="text-[11px] font-semibold text-[#78716C]">Steps</span>
                  <div className="text-xl font-bold text-[#1C1917] mt-2">{formatNumber(latestDailyMetric?.steps)}</div>
                  <div className="text-[10px] text-[#78716C]">Daily Steps</div>
                </div>
                <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4">
                  <span className="text-[11px] font-semibold text-[#78716C]">Active</span>
                  <div className="text-xl font-bold text-[#1C1917] mt-2">{formatMinutes(latestDailyMetric?.active_minutes)}</div>
                  <div className="text-[10px] text-[#78716C]">Moderate Activity</div>
                </div>
                <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4">
                  <span className="text-[11px] font-semibold text-[#78716C]">Workout</span>
                  <div className="text-xl font-bold text-[#1C1917] mt-2">{formatMinutes(latestDailyMetric?.workout_minutes)}</div>
                  <div className="text-[10px] text-[#78716C]">Vigorous Session</div>
                </div>
                <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4">
                  <span className="text-[11px] font-semibold text-[#78716C]">Sleep</span>
                  <div className="text-xl font-bold text-[#1C1917] mt-2">{formatMinutes(latestDailyMetric?.sleep_duration_minutes)}</div>
                  <div className="text-[10px] text-[#78716C]">Last Night</div>
                </div>
                <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold text-[#78716C]">Resting HR</span>
                  <div className="text-xl font-bold text-[#1C1917] mt-2">{latestDailyMetric?.resting_heart_rate ? `${latestDailyMetric.resting_heart_rate} bpm` : '--'}</div>
                  <div className="text-[10px] text-[#78716C]">Basal Pulse</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN BODY (When Assessments Exist)                                       */}
        {/* ========================================================================= */}
        {!loading && !error && completedSessionsChronological.length > 0 && (
          <>
            {/* ===================================================================== */}
            {/* 3. HEALTH JOURNEY BANNER (Matching Visual Reference)                  */}
            {/* ===================================================================== */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#EBF5EE] via-[#F2F8F4] to-[#E5EFE7] border border-[#D4E8DC] rounded-2xl p-5 sm:p-6 shadow-2xs">
              <div className="relative z-10 max-w-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/90 text-[#1E3A2B] shadow-xs flex items-center justify-center shrink-0 border border-[#D4E8DC]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1C1917] tracking-tight">
                    Your Health Journey
                  </h2>
                  <p className="text-xs sm:text-[13.5px] text-[#44403C] mt-1 leading-relaxed">
                    This dashboard tracks how your self-reported health indicators have changed over time. Regular assessments help you observe trends, track lifestyle adjustments, and stay informed on your wellness journey.
                  </p>
                </div>
              </div>

              {/* Decorative Subtle Leaf / Sun Art on Right */}
              <div className="hidden md:block absolute right-0 top-0 bottom-0 w-80 pointer-events-none opacity-85 select-none">
                <svg className="w-full h-full" viewBox="0 0 320 120" preserveAspectRatio="none" fill="none">
                  {/* Warm Sun */}
                  <circle cx="260" cy="35" r="22" fill="#FDE68A" fillOpacity="0.7" />
                  {/* Undulating Soft Sage Hills */}
                  <path d="M0 120 Q 80 80, 180 95 T 320 60 L 320 120 Z" fill="#99F6E4" fillOpacity="0.25" />
                  <path d="M40 120 Q 140 70, 240 85 T 320 50 L 320 120 Z" fill="#A7F3D0" fillOpacity="0.4" />
                  <path d="M100 120 Q 200 65, 270 75 T 320 40 L 320 120 Z" fill="#34D399" fillOpacity="0.25" />
                  {/* Decorative Leaves */}
                  <path d="M290 85 C 275 65, 295 50, 310 65 C 315 80, 295 90, 290 85 Z" fill="#2D5A3C" fillOpacity="0.3" />
                  <path d="M275 95 C 265 80, 280 70, 290 80 C 295 90, 280 100, 275 95 Z" fill="#1E3A2B" fillOpacity="0.2" />
                </svg>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* 4. FOUR SUMMARY CARDS (With Clean Factual Data)                       */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                    {comparison.totalCompleted}
                  </div>
                  <div className="text-xs text-[#78716C] mt-1 truncate">
                    First assessment: {comparison.baselineDate || 'Recorded'}
                  </div>
                </div>
              </div>

              {/* Card 2: Comparative Progress */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#78716C]">
                    Overall Progress
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#E6F4F2] text-[#0D9488] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl sm:text-2xl font-bold text-[#1C1917] truncate">
                    {comparison.hasComparison ? (
                      comparison.improvedCount > 0 ? (
                        <span className="text-[#059669]">
                          +{comparison.improvedCount} Favorable
                        </span>
                      ) : (
                        <span className="text-[#1E3A2B]">
                          Stable Context
                        </span>
                      )
                    ) : (
                      <span className="text-[#1E3A2B]">
                        Baseline
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#78716C] mt-1 truncate">
                    {comparison.hasComparison
                      ? `${comparison.improvedCount} of 6 domains showing positive shifts`
                      : 'Comparison unlocks on 2nd assessment'}
                  </div>
                </div>
              </div>

              {/* Card 3: Tracked Focus Areas / Changes */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#78716C]">
                    {comparison.hasComparison ? 'Changed Domains' : 'Tracked Focus Areas'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                    {comparison.hasComparison ? comparison.areasWithChange : comparison.totalModifiable}
                  </div>
                  <div className="text-xs text-[#78716C] mt-1 truncate">
                    {comparison.hasComparison
                      ? `${comparison.improvedCount} favorable, ${comparison.attentionCount} new factors`
                      : 'Across 6 evaluated domains'}
                  </div>
                </div>
              </div>

              {/* Card 4: Current Status */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#78716C]">
                    Current Status
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-lg sm:text-xl font-bold text-[#059669] truncate">
                    {comparison.snapshotStatus}
                  </div>
                  <div className="text-xs text-[#78716C] mt-1 truncate">
                    Keep up the positive habits!
                  </div>
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* TAB VIEW: DAILY HEALTH ACTIVITY & GOALS (Deep-dive or featured in overview)*/}
            {/* ========================================================================= */}
            {(activeTab === 'daily_activity' || activeTab === 'overview') && (
              <div className="space-y-6">
                
                {/* Notification banners for sync */}
                {healthSyncSuccess && (
                  <div className="border border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{healthSyncSuccess}</span>
                    </div>
                  </div>
                )}

                {healthSyncError && (
                  <div className="border border-red-500/20 bg-red-500/[0.05] text-red-800 px-5 py-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{healthSyncError}</span>
                    </div>
                  </div>
                )}

                {/* Section Header with Demo Controls */}
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3EFEA] pb-4">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-[#1C1917]">
                          Daily Health Activity
                        </h2>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE5DD] text-[#57534E] border border-[#D0CBC0]">
                          Source: Mock Health Data
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#78716C] mt-1">
                        Passive movement, activity, and recovery metrics. Demo data for software validation and non-clinical goal tracking.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        onClick={handleSyncMockHealth}
                        disabled={isSyncingHealth}
                        className="inline-flex items-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] disabled:opacity-60 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        title="Synchronize 7-day realistic deterministic mock data for testing"
                      >
                        {isSyncingHealth ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Syncing Demo...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Sync Demo Data</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 5 Today's Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-1">
                    
                    {/* Metric 1: Steps */}
                    <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#78716C]">
                          Steps
                        </span>
                        <div className="w-6 h-6 rounded-md bg-[#EBF5EE] text-[#059669] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xl sm:text-2xl font-bold text-[#1C1917]">
                          {formatNumber(latestDailyMetric?.steps)}
                        </div>
                        <div className="text-[10px] text-[#78716C] mt-0.5">
                          Daily Steps
                        </div>
                      </div>
                    </div>

                    {/* Metric 2: Active Minutes */}
                    <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#78716C]">
                          Active
                        </span>
                        <div className="w-6 h-6 rounded-md bg-[#E6F4F2] text-[#0D9488] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xl sm:text-2xl font-bold text-[#1C1917]">
                          {formatMinutes(latestDailyMetric?.active_minutes)}
                        </div>
                        <div className="text-[10px] text-[#78716C] mt-0.5">
                          Moderate Activity
                        </div>
                      </div>
                    </div>

                    {/* Metric 3: Workout Minutes */}
                    <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#78716C]">
                          Workout
                        </span>
                        <div className="w-6 h-6 rounded-md bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xl sm:text-2xl font-bold text-[#1C1917]">
                          {formatMinutes(latestDailyMetric?.workout_minutes)}
                        </div>
                        <div className="text-[10px] text-[#78716C] mt-0.5">
                          Vigorous Session
                        </div>
                      </div>
                    </div>

                    {/* Metric 4: Sleep Duration */}
                    <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#78716C]">
                          Sleep
                        </span>
                        <div className="w-6 h-6 rounded-md bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xl sm:text-2xl font-bold text-[#1C1917]">
                          {formatMinutes(latestDailyMetric?.sleep_duration_minutes)}
                        </div>
                        <div className="text-[10px] text-[#78716C] mt-0.5">
                          Last Night
                        </div>
                      </div>
                    </div>

                    {/* Metric 5: Resting Heart Rate */}
                    <div className="bg-[#FAF8F5] border border-[#E8E5DF] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#78716C]">
                          Resting HR
                        </span>
                        <div className="w-6 h-6 rounded-md bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="text-xl sm:text-2xl font-bold text-[#1C1917]">
                          {latestDailyMetric?.resting_heart_rate ? `${latestDailyMetric.resting_heart_rate} bpm` : '--'}
                        </div>
                        <div className="text-[10px] text-[#78716C] mt-0.5">
                          Basal Pulse
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] sm:text-[11px] text-[#A8A29E] pt-2 border-t border-[#F3EFEA] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>Observational passive health data. Demo health data — not real wearable data.</span>
                    {latestDailyMetric?.synced_at && (
                      <span>Last synced: {new Date(latestDailyMetric.synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>

                {/* 2-Column Subgrid: Today's Personalized Goals (Left) & 7-Day Trend (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column (6 cols): Today's Personalized Goals */}
                  <div className="lg:col-span-6 bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#F3EFEA] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <h3 className="text-base font-bold text-[#1C1917]">
                            Today's Personalized Goals
                          </h3>
                        </div>
                        <p className="text-xs text-[#78716C] mt-0.5">
                          Deterministic adaptive goals derived from your recent baseline.
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#1E3A2B] bg-[#EBF5EE] border border-[#C8E6D2] px-2.5 py-1 rounded-lg">
                        {todayGoals.filter((g) => g.status === 'completed').length} / {todayGoals.length} Done
                      </span>
                    </div>

                    {todayGoals.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#78716C] bg-[#FAF9F6] rounded-xl border border-[#E8E5DF] space-y-2">
                        <p>No active goals generated for today yet.</p>
                        <button
                          onClick={handleSyncMockHealth}
                          className="text-xs font-semibold text-[#1E3A2B] underline hover:text-[#14281D] cursor-pointer"
                        >
                          Sync demo activity data to generate goals
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {todayGoals.map((goal) => {
                          const isDone = goal.status === 'completed';
                          const hasTarget = goal.target_value && goal.target_value > 0;
                          const progress = goal.progress_value || 0;
                          const percent = hasTarget ? Math.min(100, Math.round((progress / goal.target_value) * 100)) : (isDone ? 100 : 0);

                          return (
                            <div
                              key={goal.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isDone
                                  ? 'bg-[#F4F9F5] border-[#C8E6D2]'
                                  : 'bg-[#FAF8F5] border-[#E8E5DF] hover:border-[#D0CBC0]'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Interactive Completion Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleGoal(goal)}
                                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                    isDone
                                      ? 'bg-[#059669] border-[#059669] text-white shadow-2xs'
                                      : 'border-[#A8A29E] hover:border-[#1E3A2B] bg-white'
                                  }`}
                                  aria-label={isDone ? 'Mark in progress' : 'Mark completed'}
                                >
                                  {isDone && (
                                    <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>

                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={`text-xs sm:text-[13px] font-bold ${isDone ? 'text-[#065F46] line-through' : 'text-[#1C1917]'}`}>
                                      {goal.title}
                                    </h4>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                        isDone
                                          ? 'bg-[#EBF5EE] text-[#059669] border-[#C8E6D2]'
                                          : goal.status === 'in_progress'
                                          ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                                          : 'bg-white text-[#78716C] border-[#E8E5DF]'
                                      }`}
                                    >
                                      {isDone ? 'Completed' : goal.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                    </span>
                                  </div>

                                  {/* Progress bar if numerical goal */}
                                  {hasTarget && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-[#57534E]">
                                        <span>
                                          {formatNumber(progress)} / {formatNumber(goal.target_value)} {goal.unit}
                                        </span>
                                        <span className="font-semibold text-[#1C1917]">{percent}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-[#EAE5DD] rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-300 ${
                                            isDone ? 'bg-[#059669]' : 'bg-[#1E3A2B]'
                                          }`}
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {goal.rationale && (
                                    <p className="text-[11px] text-[#78716C] leading-snug">
                                      {goal.rationale}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column (6 cols): 7-Day Activity Trend */}
                  <div className="lg:col-span-6 bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3EFEA] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <h3 className="text-base font-bold text-[#1C1917]">
                            Recent Activity Trend
                          </h3>
                        </div>
                        <p className="text-xs text-[#78716C] mt-0.5">
                          Observational 7-day pattern from passive health data.
                        </p>
                      </div>

                      {/* Metric Toggle Selector */}
                      <select
                        value={selectedTrendMetric}
                        onChange={(e) => setSelectedTrendMetric(e.target.value)}
                        className="text-xs font-semibold bg-[#FAF9F6] border border-[#E8E5DF] rounded-lg px-2.5 py-1.5 text-[#57534E] hover:border-[#D0CBC0] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E3A2B] self-start sm:self-auto"
                      >
                        <option value="steps">Steps</option>
                        <option value="active_minutes">Active Minutes</option>
                        <option value="sleep_duration_minutes">Sleep Duration</option>
                        <option value="resting_heart_rate">Resting HR</option>
                      </select>
                    </div>

                    {/* Check if insufficient data (< 3 days) */}
                    {dailyMetricsList.length < 3 ? (
                      <div className="p-8 text-center bg-[#FAF8F5] rounded-xl border border-[#E8E5DF] space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EAE5DD] text-[#78716C] mx-auto flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#1C1917]">
                            Not enough data yet
                          </h4>
                          <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto">
                            At least 3 valid days of health records are needed to calculate a reliable observational trend.
                          </p>
                        </div>
                        <button
                          onClick={handleSyncMockHealth}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2B] bg-white border border-[#D0CBC0] hover:bg-[#F3EFEA] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>Sync 7-Day Demo Data</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {/* Trend Summary Header */}
                        {(() => {
                          const trendItem = healthTrends ? healthTrends[selectedTrendMetric] : null;
                          const dir = trendItem?.direction || 'insufficient_data';
                          const dirBadge =
                            dir === 'improving'
                              ? { text: 'Improving', bg: 'bg-[#EBF5EE] text-[#059669] border-[#C8E6D2]' }
                              : dir === 'stable'
                              ? { text: 'Consistent', bg: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' }
                              : dir === 'declining'
                              ? { text: 'Lower recently', bg: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]' }
                              : { text: 'Variable', bg: 'bg-[#FAF8F5] text-[#78716C] border-[#E8E5DF]' };

                          return (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DF]">
                              <div className="text-xs">
                                <span className="font-bold text-[#1C1917]">7-Day Pattern: </span>
                                <span className="text-[#57534E]">{trendItem?.summary || 'Observational passive trend'}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dirBadge.bg}`}>
                                • {dirBadge.text}
                              </span>
                            </div>
                          );
                        })()}

                        {/* 7-Day Bar Visualization */}
                        <div className="pt-2">
                          <div className="h-44 flex items-end justify-between gap-2 px-1">
                            {dailyMetricsList.slice(-7).map((metric, idx) => {
                              const val = metric[selectedTrendMetric] || 0;
                              const maxVal = Math.max(...dailyMetricsList.slice(-7).map((m) => m[selectedTrendMetric] || 0), 1);
                              const heightPct = Math.max(12, Math.round((val / maxVal) * 100));
                              const dateObj = new Date(metric.date);
                              const dayName = idx === dailyMetricsList.slice(-7).length - 1 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                              return (
                                <div key={metric.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                  <div className="text-[10px] font-bold text-[#57534E] opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                    {selectedTrendMetric.includes('minutes') ? `${val}m` : formatNumber(val)}
                                  </div>
                                  <div className="w-full max-w-[32px] bg-[#FAF8F5] rounded-t-lg overflow-hidden h-32 flex items-end border border-[#E8E5DF] group-hover:border-[#1E3A2B] transition-all">
                                    <div
                                      className="w-full bg-[#1E3A2B] group-hover:bg-[#059669] transition-all rounded-t-sm"
                                      style={{ height: `${heightPct}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] font-semibold text-[#78716C] group-hover:text-[#1C1917] transition-colors">
                                    {dayName}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <p className="text-[10px] text-[#A8A29E] leading-tight italic pt-1 border-t border-[#F3EFEA]">
                          Non-clinical observational activity trend. Targets reflect general wellness guidelines and personal baseline, not medical diagnosis.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB VIEW 1: PROGRESS OVERVIEW                                         */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 2-Column Section: Trends Chart (Left) & Domain Change Summary (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column (7 cols): Health Domain Trends */}
                  <div className="lg:col-span-7 bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3EFEA] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <h2 className="text-base sm:text-[17px] font-bold text-[#1C1917]">
                            Health Domain Trends
                          </h2>
                        </div>
                        <p className="text-xs text-[#78716C] mt-0.5">
                          Reported Context Indicator (0–100) reflecting self-reported protective factors vs. modifiable focus areas.
                        </p>
                      </div>

                      {/* Time Filter Select */}
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="text-xs font-semibold bg-[#FAF9F6] border border-[#E8E5DF] rounded-lg px-2.5 py-1.5 text-[#57534E] hover:border-[#D0CBC0] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E3A2B] self-start sm:self-auto"
                      >
                        <option value="all">All Assessments</option>
                        <option value="6m">Last 6 Months</option>
                        <option value="1y">Last Year</option>
                      </select>
                    </div>

                    {/* Interactive SVG Chart Container */}
                    <div className="pt-2">
                      <div className="relative w-full h-64 sm:h-72 select-none">
                        
                        {/* Chart Y-Axis Guide Labels */}
                        <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[11px] font-medium text-[#A8A29E] text-right pr-2 select-none">
                          <span>100</span>
                          <span>80</span>
                          <span>60</span>
                          <span>40</span>
                          <span>20</span>
                          <span>0</span>
                        </div>

                        {/* Chart SVG Canvas */}
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

                            {/* Lines for each domain */}
                            {DOMAIN_DEFINITIONS.map((dom) => {
                              if (selectedDomain !== 'all' && selectedDomain !== dom.key) return null;

                              const points = longitudinalData
                                .map((d, idx) => {
                                  const score = d.domainScores[dom.key];
                                  if (score === null || score === undefined) return null;
                                  const totalPoints = Math.max(1, longitudinalData.length);
                                  const x = totalPoints === 1 ? 200 : (idx / (totalPoints - 1)) * 380 + 10;
                                  // Convert 0-100 score to SVG Y (0 is 200, 100 is 10)
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
                                  {/* Line (if >= 2 points) */}
                                  {points.length > 1 && (
                                    <path
                                      d={pathD}
                                      fill="none"
                                      stroke={dom.color}
                                      strokeWidth="2.4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  )}

                                  {/* Markers */}
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

                          {/* Hover Tooltip Overlay */}
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

                        {/* X-Axis Date Labels */}
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
                        <div className="mt-3 p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl flex items-center gap-2 text-xs text-[#57534E]">
                          <svg className="w-4 h-4 text-[#1E3A2B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            <strong>Baseline Established:</strong> Single-session baseline recorded. Complete your next quarterly check-in to generate multi-point comparative trend lines.
                          </span>
                        </div>
                      )}

                      {/* Domain Legend / Filter Pills */}
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-[#F3EFEA] mt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDomain('all')}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                            selectedDomain === 'all'
                              ? 'bg-[#1E3A2B] text-white shadow-2xs'
                              : 'bg-[#F3EFEA] text-[#78716C] hover:text-[#1C1917]'
                          }`}
                        >
                          All Domains
                        </button>

                        {DOMAIN_DEFINITIONS.map((dom) => {
                          const isSelected = selectedDomain === dom.key;
                          return (
                            <button
                              key={dom.key}
                              type="button"
                              onClick={() => setSelectedDomain(isSelected ? 'all' : dom.key)}
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                                isSelected
                                  ? 'ring-2 ring-offset-1 text-white shadow-2xs'
                                  : 'bg-[#FAF9F6] text-[#57534E] hover:bg-[#F3EFEA] border border-[#E8E5DF]'
                              }`}
                              style={{
                                backgroundColor: isSelected ? dom.color : undefined,
                                ringColor: isSelected ? dom.color : undefined,
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: isSelected ? '#FFFFFF' : dom.color }}
                              />
                              <span>{dom.shortTitle}</span>
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[10px] text-[#A8A29E] text-center italic pt-2">
                        A non-clinical visualization of self-reported contextual factors. It is not a medical score or diagnosis.
                      </p>

                    </div>
                  </div>

                  {/* Right Column (5 cols): Domain Change Summary */}
                  <div className="lg:col-span-5 bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="border-b border-[#F3EFEA] pb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h2 className="text-base sm:text-[17px] font-bold text-[#1C1917]">
                          Domain Change Summary
                        </h2>
                      </div>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        Comparison between your baseline and most recent assessment.
                      </p>
                    </div>

                    {/* 6 Domain Rows Matching Visual Reference */}
                    <div className="space-y-3.5 pt-1">
                      {DOMAIN_DEFINITIONS.map((dom) => {
                        const comp = comparison.domains[dom.key] || {
                          latestScore: null,
                          statusText: 'Baseline recorded',
                          changeLabel: 'Baseline',
                          trendType: 'neutral',
                        };

                        return (
                          <div key={dom.key} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              
                              {/* Left: Icon & Domain Name */}
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: dom.bgLight, color: dom.color }}
                                >
                                  {dom.icon}
                                </div>
                                <span className="font-semibold text-[#1C1917] truncate">
                                  {dom.title}
                                </span>
                              </div>

                              {/* Right: Change Indicator Badge */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`font-bold text-[11px] ${
                                    comp.trendType === 'positive'
                                      ? 'text-[#059669]'
                                      : comp.trendType === 'attention'
                                      ? 'text-[#D97706]'
                                      : 'text-[#78716C]'
                                  }`}
                                >
                                  {comp.changeLabel}
                                </span>
                                
                                {/* Trend Arrow */}
                                {comp.trendType === 'positive' ? (
                                  <svg className="w-3.5 h-3.5 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7m0 0H7m10 0v10" />
                                  </svg>
                                ) : comp.trendType === 'attention' ? (
                                  <svg className="w-3.5 h-3.5 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l10 10m0 0H7m10 0V7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5 text-[#A8A29E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* Horizontal Progress Context Bar */}
                            <div className="w-full h-2 bg-[#F3EFEA] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${comp.latestScore !== null ? Math.max(10, comp.latestScore) : 0}%`,
                                  backgroundColor: dom.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* 2-Column Section: Key Milestones (Left) & Personalized Recommendations (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column (6 cols): Key Milestones */}
                  <div className="lg:col-span-6 bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="border-b border-[#F3EFEA] pb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                        <h2 className="text-base sm:text-[17px] font-bold text-[#1C1917]">
                          Key Milestones
                        </h2>
                      </div>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        Important achievements in your health journey.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {keyMilestones.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-start justify-between gap-3.5 p-3.5 rounded-xl border border-[#F5F2EB] bg-[#FAF8F5] hover:border-[#EAE5DD] transition-all"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Date Badge */}
                            <div className="w-11 h-11 rounded-xl bg-white border border-[#E8E5DF] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                              <span className="text-[9px] font-bold text-[#78716C] leading-none">
                                {m.month}
                              </span>
                              <span className="text-sm font-bold text-[#1C1917] leading-none mt-0.5">
                                {m.day}
                              </span>
                            </div>

                            {/* Milestone Text */}
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-[#1C1917] truncate">
                                {m.title}
                              </h3>
                              <p className="text-xs text-[#57534E] mt-0.5 leading-snug">
                                {m.description}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${m.badgeColor}`}>
                            {m.badge}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column (6 cols): Personalized Recommendations */}
                  <div className="lg:col-span-6 bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="border-b border-[#F3EFEA] pb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h2 className="text-base sm:text-[17px] font-bold text-[#1C1917]">
                          Personalized Recommendations
                        </h2>
                      </div>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        Based on your progress and recent reported context.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      
                      {/* Rec 1: Continue Tracking / Maintain Progress */}
                      {!dismissedRecommendation && (
                        <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-[#D4E8DC] bg-[#EBF5EE]/70 relative">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white text-[#1E3A2B] border border-[#D4E8DC] flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-[#1C1917]">
                                Continue Your Progress
                              </h3>
                              <p className="text-xs text-[#44403C] mt-0.5 leading-snug">
                                {comparison.hasComparison
                                  ? 'You have recorded multiple assessments. Keep maintaining consistent sleep, physical activity, and thermal moderation habits.'
                                  : 'Complete follow-up check-ins every 3–6 months to monitor changes in your lifestyle and health context.'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDismissedRecommendation(true)}
                            className="text-[#78716C] hover:text-[#1C1917] p-1 rounded-md cursor-pointer"
                            aria-label="Dismiss recommendation"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Rec 2: Action Plan Integration */}
                      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#F5F2EB] bg-[#FAF8F5]">
                        <div className="w-8 h-8 rounded-lg bg-white text-[#2563EB] border border-[#E8E5DF] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-[#1C1917]">
                            Review Your Action Plan
                          </h3>
                          <p className="text-xs text-[#57534E] mt-0.5 leading-snug">
                            Revisit the personalized actions from your latest assessment and track your daily habits in the Action Plan tab.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('action_plan')}
                            className="mt-2 text-xs font-semibold text-[#1E3A2B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Action Plan Tracking →</span>
                          </button>
                        </div>
                      </div>

                      {/* Rec 3: Clinical Professional Consultation */}
                      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#F5F2EB] bg-[#FAF8F5]">
                        <div className="w-8 h-8 rounded-lg bg-white text-[#D97706] border border-[#E8E5DF] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-[#1C1917]">
                            Discuss With a Healthcare Professional
                          </h3>
                          <p className="text-xs text-[#57534E] mt-0.5 leading-snug">
                            If a new, severe, or persistent symptom is reported, consider sharing your downloadable structured report with an andrologist or physician.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB VIEW 2: TREND ANALYSIS (Detailed Domain Drilldowns)                */}
            {/* ===================================================================== */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 shadow-2xs space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-[#1C1917]">
                      Domain Trajectory & Factor Analysis
                    </h2>
                    <p className="text-xs sm:text-sm text-[#57534E] mt-1">
                      Detailed breakdown of reported indicators and modifiable context across all 6 evaluated wellness domains.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {DOMAIN_DEFINITIONS.map((dom) => {
                      const comp = comparison.domains[dom.key] || {
                        latestScore: null,
                        statusText: 'Baseline recorded',
                        basePriority: 0,
                        latestPriority: 0,
                        latestPositive: 0,
                      };

                      return (
                        <div
                          key={dom.key}
                          className="p-5 rounded-2xl border border-[#E8E5DF] bg-white hover:border-[#D0CBC0] transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: dom.bgLight, color: dom.color }}
                              >
                                {dom.icon}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-[#1C1917]">
                                  {dom.title}
                                </h3>
                                <div className="text-[11px] text-[#78716C]">
                                  {dom.description}
                                </div>
                              </div>
                            </div>
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: dom.bgLight, color: dom.color }}
                            >
                              {comp.latestScore !== null ? `${comp.latestScore}%` : 'No data'}
                            </span>
                          </div>

                          <div className="bg-[#FAF9F6] border border-[#F3EFEA] rounded-xl p-3 text-xs space-y-1.5">
                            <div className="flex justify-between text-[#57534E]">
                              <span>Reported Status:</span>
                              <span className="font-semibold text-[#1C1917]">{comp.statusText}</span>
                            </div>
                            <div className="flex justify-between text-[#57534E]">
                              <span>Modifiable Focus Areas:</span>
                              <span className="font-semibold text-[#1C1917]">{comp.latestPriority}</span>
                            </div>
                            <div className="flex justify-between text-[#57534E]">
                              <span>Positive Protective Factors:</span>
                              <span className="font-semibold text-[#059669]">{comp.latestPositive}</span>
                            </div>
                          </div>

                          <div className="w-full h-2 bg-[#F3EFEA] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${comp.latestScore !== null ? comp.latestScore : 0}%`, backgroundColor: dom.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB VIEW 3: KEY IMPROVEMENTS                                          */}
            {/* ===================================================================== */}
            {activeTab === 'improvements' && (
              <div className="space-y-6">
                
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 shadow-2xs space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-[#1C1917]">
                      Domain Improvements & Context Evolution
                    </h2>
                    <p className="text-xs sm:text-sm text-[#57534E] mt-1">
                      Comparison between your initial baseline assessment and current self-reported status.
                    </p>
                  </div>

                  {!comparison.hasComparison ? (
                    <div className="p-8 text-center bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-[#EBF5EE] text-[#1E3A2B] mx-auto flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-[#1C1917]">
                        Comparative Tracking Requires 2 Assessments
                      </h3>
                      <p className="text-xs text-[#57534E] max-w-md mx-auto">
                        You have established an initial health baseline. After taking your next assessment, this section will automatically highlight domains where reported indicators have improved.
                      </p>
                      <button
                        onClick={handleTakeNewAssessment}
                        className="inline-flex items-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Take Follow-Up Assessment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {DOMAIN_DEFINITIONS.map((dom) => {
                        const comp = comparison.domains[dom.key];
                        if (!comp) return null;

                        return (
                          <div
                            key={dom.key}
                            className="p-4 rounded-xl border border-[#E8E5DF] bg-[#FAF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: dom.bgLight, color: dom.color }}
                              >
                                {dom.icon}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[#1C1917] truncate">
                                  {dom.title}
                                </h4>
                                <p className="text-xs text-[#78716C] truncate">
                                  {comp.statusText}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <div className="text-xs text-[#78716C]">Baseline → Latest</div>
                                <div className="text-xs font-bold text-[#1C1917]">
                                  {comp.baseScore !== null ? `${comp.baseScore}%` : '—'} → {comp.latestScore !== null ? `${comp.latestScore}%` : '—'}
                                </div>
                              </div>
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  comp.trendType === 'positive'
                                    ? 'bg-[#EBF5EE] text-[#059669]'
                                    : comp.trendType === 'attention'
                                    ? 'bg-[#FEF3C7] text-[#D97706]'
                                    : 'bg-[#F3EFEA] text-[#78716C]'
                                }`}
                              >
                                {comp.changeLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB VIEW 4: ACTION PLAN TRACKING                                      */}
            {/* ===================================================================== */}
            {activeTab === 'action_plan' && (
              <div className="space-y-6">
                
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3EFEA] pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#1C1917]">
                        Action Plan Tracking
                      </h2>
                      <p className="text-xs sm:text-sm text-[#57534E] mt-1">
                        Personalized lifestyle and health guidance derived from your latest report.
                      </p>
                    </div>

                    <div className="text-xs font-semibold text-[#1E3A2B] bg-[#EBF5EE] px-3 py-1.5 rounded-lg shrink-0">
                      {Object.values(actionStatuses).filter(Boolean).length} of {actionPlanItems.length} Completed
                    </div>
                  </div>

                  {actionPlanItems.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-[#EBF5EE] text-[#1E3A2B] mx-auto flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-bold text-[#1C1917]">
                        No Action Plan Generated Yet
                      </h3>
                      <p className="text-xs text-[#57534E] max-w-md mx-auto">
                        Action items are compiled automatically when you complete a health assessment and generate your report.
                      </p>
                      <button
                        onClick={handleTakeNewAssessment}
                        className="inline-flex items-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Take Assessment Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl text-xs text-[#78716C] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#1E3A2B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Action-plan progress is stored client-side on this device and updated as you complete each wellness habit.</span>
                      </div>

                      <div className="space-y-3">
                        {actionPlanItems.map((item) => {
                          const isDone = !!actionStatuses[item.id];
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleActionStatus(item.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                                isDone
                                  ? 'bg-[#FAF8F5] border-[#D4E8DC] opacity-75'
                                  : 'bg-white border-[#E8E5DF] hover:border-[#D0CBC0]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => toggleActionStatus(item.id)}
                                className="w-4 h-4 rounded border-[#D0CBC0] text-[#1E3A2B] focus:ring-[#1E3A2B] mt-1 shrink-0 cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4
                                    className={`text-xs sm:text-sm font-bold ${
                                      isDone ? 'line-through text-[#78716C]' : 'text-[#1C1917]'
                                    }`}
                                  >
                                    {item.title}
                                  </h4>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F3EFEA] text-[#57534E]">
                                    {item.category}
                                  </span>
                                </div>
                                <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                                <div className="text-[11px] text-[#78716C] mt-2">
                                  Timeframe: <span className="font-semibold text-[#1C1917]">{item.timeframe}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB VIEW 5: HEALTH TIMELINE                                           */}
            {/* ===================================================================== */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                
                <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 shadow-2xs space-y-5">
                  <div className="border-b border-[#F3EFEA] pb-3">
                    <h2 className="text-lg font-bold text-[#1C1917]">
                      Assessment & Report Timeline
                    </h2>
                    <p className="text-xs sm:text-sm text-[#57534E] mt-1">
                      Chronological history of all completed assessments and generated reports.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    {completedSessionsNewestFirst.map((sess, idx) => {
                      const rep = reportsMap[sess.id] || null;
                      const d = new Date(sess.completed_at || sess.started_at);

                      return (
                        <div
                          key={sess.id}
                          className="p-5 rounded-2xl border border-[#E8E5DF] bg-[#FAF9F6] hover:border-[#D0CBC0] transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#1E3A2B] text-white">
                                  Assessment #{completedSessionsNewestFirst.length - idx}
                                </span>
                                <span className="text-xs text-[#78716C]">
                                  {d.toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-[#1C1917] mt-1">
                                {rep?.executive_summary?.headline || 'Reproductive Health & Wellness Assessment'}
                              </h3>
                            </div>

                            {rep ? (
                              <button
                                onClick={() => handleViewReport(sess.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1E3A2B] bg-white border border-[#D4E8DC] hover:bg-[#EBF5EE] rounded-xl transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
                              >
                                <span>View Full Report</span>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-xs text-[#78716C] bg-white px-3 py-1.5 rounded-lg border border-[#E8E5DF]">
                                Report unavailable
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                            {rep?.executive_summary?.overview ||
                              'Comprehensive multi-domain self-assessment including reproductive health history, lifestyle factors, and evidence-informed recommendations.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8E5DF]/60 text-[11px] text-[#78716C]">
                            <span className="font-semibold text-[#1C1917]">Domains Assessed:</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E8E5DF]">Reproductive</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E8E5DF]">Sexual Health</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E8E5DF]">Mental Wellness</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E8E5DF]">Lifestyle</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E8E5DF]">Environment</span>
                            <span className="bg-white px-2 py-0.5 rounded border border-[#E8E5DF]">Substances</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </>
        )}

      </div>
    </AppShell>
  );
}
