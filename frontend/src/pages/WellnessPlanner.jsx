import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '../components/layout/AppShell';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function WellnessPlanner({ onNavigateHome }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history' | 'paused'
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'sleep' | 'activity' | 'stress' | 'nutrition'
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState(null);
  const [noteModalAction, setNoteModalAction] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/api/v1/wellness-plan/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load wellness planner dashboard:', err);
      setError('Unable to load your wellness plan. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle logging progress (completed, skipped, postponed)
  const handleLogProgress = async (actionId, status, notes = null) => {
    try {
      setActionInProgressId(actionId);
      await apiRequest(`/api/v1/wellness-plan/actions/${actionId}/log`, {
        method: 'POST',
        body: JSON.stringify({ status, notes }),
      });
      showToast(
        status === 'completed'
          ? 'Action marked as completed!'
          : status === 'skipped'
          ? 'Action marked as skipped.'
          : 'Action postponed for later today.'
      );
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to update action log:', err);
      showToast('Could not save progress. Please try again.');
    } finally {
      setActionInProgressId(null);
      setNoteModalAction(null);
      setNoteText('');
    }
  };

  // Handle action lifecycle changes (pause, resume, dismiss)
  const handleUpdateState = async (actionId, newStatus) => {
    try {
      setActionInProgressId(actionId);
      await apiRequest(`/api/v1/wellness-plan/actions/${actionId}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(
        newStatus === 'paused'
          ? 'Action paused.'
          : newStatus === 'active'
          ? 'Action resumed in your daily plan.'
          : 'Action dismissed.'
      );
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to update action state:', err);
      showToast('Could not update action. Please try again.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Force regenerate or generate from assessment
  const handleRegeneratePlan = async () => {
    try {
      setLoading(true);
      await apiRequest('/api/v1/wellness-plan/generate', { method: 'POST' });
      showToast('Wellness plan updated with latest evidence.');
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to regenerate plan:', err);
      setError('Unable to update your wellness plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDomainBadge = (domain) => {
    const d = (domain || '').toLowerCase();
    if (d.includes('sleep')) {
      return { label: 'Sleep Routine', bg: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]' };
    }
    if (d.includes('phys') || d.includes('activ') || d.includes('movement')) {
      return { label: 'Physical Activity', bg: 'bg-[#EBF5EE] text-[#1E3A2B] border-[#D1E7D8]' };
    }
    if (d.includes('stress') || d.includes('mental')) {
      return { label: 'Stress Management', bg: 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]' };
    }
    if (d.includes('diet') || d.includes('nutri') || d.includes('hydrat')) {
      return { label: 'Diet & Hydration', bg: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' };
    }
    if (d.includes('environ') || d.includes('heat')) {
      return { label: 'Environmental Factor', bg: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]' };
    }
    return { label: 'Lifestyle Wellness', bg: 'bg-[#F5F4F0] text-[#57534E] border-[#E7E5E4]' };
  };

  const filterActions = (actions) => {
    if (!actions) return [];
    if (selectedFilter === 'all') return actions;
    return actions.filter((act) => {
      const d = (act.domain || '').toLowerCase();
      if (selectedFilter === 'sleep') return d.includes('sleep');
      if (selectedFilter === 'activity') return d.includes('phys') || d.includes('activ') || d.includes('movement');
      if (selectedFilter === 'stress') return d.includes('stress') || d.includes('mental');
      if (selectedFilter === 'nutrition') return d.includes('diet') || d.includes('nutri') || d.includes('hydrat');
      return true;
    });
  };

  const todayActions = filterActions(dashboardData?.today_actions || []);
  const pausedActions = dashboardData?.paused_or_dismissed_actions || [];
  const weeklyStats = dashboardData?.weekly_stats || {
    completion_rate_pct: 0,
    streak_days: 0,
    completed_count: 0,
    skipped_count: 0,
    postponed_count: 0,
  };

  return (
    <AppShell currentTab="planner" onNavigateHome={onNavigateHome}>
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1E3A2B] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all">
            <svg className="w-5 h-5 text-[#86EFAC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF5EE] text-[#1E3A2B] border border-[#D1E7D8]">
                Phase 1 Wellness Engine
              </span>
              {dashboardData?.has_assessment ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                  Grounded in Assessment Report
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  Evidence-Informed Starter Plan
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1C1917]">
              Personalized Wellness Planner
            </h1>
            <p className="text-sm text-[#78716C] mt-1 max-w-2xl">
              Track daily evidence-informed wellness habits and adaptive movement targets. Adherence scores reflect self-reported routine consistency, not a clinical fertility or health score.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRegeneratePlan}
              disabled={loading}
              className="px-4 py-2 text-xs md:text-sm font-medium rounded-xl border border-[#E8E5DF] bg-white text-[#1C1917] hover:bg-[#F5F4F0] transition flex items-center gap-2 shadow-sm"
            >
              <svg className={`w-4 h-4 text-[#57534E] ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Plan
            </button>
            <a
              href="#assess"
              className="px-4 py-2 text-xs md:text-sm font-medium rounded-xl bg-[#1E3A2B] text-white hover:bg-[#2D5A43] transition flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {dashboardData?.has_assessment ? 'Retake Assessment' : 'Take Assessment'}
            </a>
          </div>
        </div>

        {/* Safety & Clinical Transparency Banner */}
        <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-4 md:p-5 mb-8 flex flex-col sm:flex-row gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs md:text-sm text-[#57534E] leading-relaxed">
            <p className="font-semibold text-[#1C1917] mb-0.5">
              Educational Habit Guidance & Clinical Safeguards
            </p>
            <p>
              MantraAI wellness actions are evidence-informed lifestyle suggestions based on authoritative clinical guidelines (WHO, EAU, AUA/ASRM). They are <strong>strictly non-diagnostic</strong> and do not guarantee fertility outcomes or substitute for professional medical care.
            </p>
            <p className="text-xs text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5">
              <span>⚠️ Emergency Note:</span> Acute testicular pain, trauma, rapid swelling, or fever must never be managed through a wellness plan. Seek prompt professional care.
            </p>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && !dashboardData && (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E5DF] shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A2B] mb-3"></div>
            <p className="text-sm font-medium text-[#78716C]">Loading your personalized wellness plan...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center bg-white rounded-2xl border border-red-200 shadow-sm mb-8">
            <p className="text-sm font-medium text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1E3A2B] text-white hover:bg-[#2D5A43] transition"
            >
              Try Again
            </button>
          </div>
        )}

        {dashboardData && (
          <>
            {/* Weekly Adherence & Stats Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Card 1: 7-Day Completion Rate */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#78716C] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">7-Day Adherence</span>
                  <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#1C1917]">
                    {weeklyStats.completion_rate_pct}%
                  </div>
                  <div className="w-full bg-[#E8E5DF] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-[#1E3A2B] h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, weeklyStats.completion_rate_pct)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-[11px] text-[#A8A29E] mt-2">Self-reported routine consistency</p>
              </div>

              {/* Card 2: Streak */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#78716C] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Active Streak</span>
                  <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.527.82-1.144 2.08-1.55 3.32-.416 1.27-.61 2.37-.61 2.92 0 .42.06.77.16 1.08a4.99 4.99 0 01-.76-.32 4.99 4.99 0 01-1.61-1.62c-.22-.32-.57-.5-.95-.49-.38.01-.72.22-.9.55a6.04 6.04 0 00-.77 2.99c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.42-1.43-4.52-3.5-5.5a5.53 5.53 0 00-1.2-5.42z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-[#1C1917]">
                  {weeklyStats.streak_days}{' '}
                  <span className="text-sm font-medium text-[#78716C]">
                    {weeklyStats.streak_days === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-[11px] text-[#A8A29E] mt-2">Consecutive days active</p>
              </div>

              {/* Card 3: Actions Logged */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#78716C] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Weekly Logged</span>
                  <div className="w-7 h-7 rounded-lg bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-[#1C1917]">
                  {weeklyStats.completed_count}{' '}
                  <span className="text-sm font-normal text-[#78716C]">
                    / {weeklyStats.total_scheduled_actions || 0}
                  </span>
                </div>
                <p className="text-[11px] text-[#A8A29E] mt-2">
                  {weeklyStats.skipped_count} skipped • {weeklyStats.postponed_count} postponed
                </p>
              </div>

              {/* Card 4: Focus Areas */}
              <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#78716C] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Focus Domains</span>
                  <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#1C1917]">
                  {dashboardData?.plan?.focus_areas?.length || 4}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(dashboardData?.plan?.focus_areas || []).slice(0, 2).map((fa, idx) => (
                    <span key={idx} className="text-[10px] bg-[#F5F4F0] px-2 py-0.5 rounded-full text-[#57534E]">
                      {fa}
                    </span>
                  ))}
                  {(dashboardData?.plan?.focus_areas || []).length > 2 && (
                    <span className="text-[10px] text-[#A8A29E]">+{dashboardData.plan.focus_areas.length - 2} more</span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Today's Plan, Paused / Dismissed) */}
            <div className="flex items-center justify-between border-b border-[#E8E5DF] mb-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`pb-3 text-sm font-semibold relative transition ${
                    activeTab === 'today' ? 'text-[#1E3A2B]' : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  Today's Actions ({dashboardData.today_actions.length})
                  {activeTab === 'today' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E3A2B]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('paused')}
                  className={`pb-3 text-sm font-semibold relative transition ${
                    activeTab === 'paused' ? 'text-[#1E3A2B]' : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  Paused / Dismissed ({pausedActions.length})
                  {activeTab === 'paused' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E3A2B]" />
                  )}
                </button>
              </div>

              {/* Domain Filter Pills */}
              {activeTab === 'today' && (
                <div className="hidden sm:flex items-center gap-1.5 pb-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'sleep', label: 'Sleep' },
                    { id: 'activity', label: 'Movement' },
                    { id: 'stress', label: 'Stress' },
                    { id: 'nutrition', label: 'Nutrition' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className={`px-3 py-1 text-xs rounded-full border transition ${
                        selectedFilter === f.id
                          ? 'bg-[#1E3A2B] text-white border-[#1E3A2B]'
                          : 'bg-white text-[#57534E] border-[#E8E5DF] hover:bg-[#F5F4F0]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TAB 1: TODAY'S ACTIONS */}
            {activeTab === 'today' && (
              <div className="space-y-8">
                {/* Section A: Personalized Evidence-Grounded Actions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                      <span>Daily Wellness Habits</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E3A2B] font-medium">
                        {todayActions.length} scheduled
                      </span>
                    </h2>
                    <span className="text-xs text-[#78716C]">Self-reported tracking</span>
                  </div>

                  {todayActions.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[#E8E5DF]">
                      <p className="text-sm font-medium text-[#78716C]">No actions matching this category filter.</p>
                      <button
                        onClick={() => setSelectedFilter('all')}
                        className="mt-2 text-xs text-[#1E3A2B] font-semibold underline"
                      >
                        Show all actions
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {todayActions.map((action) => {
                        const badge = getDomainBadge(action.domain);
                        const isDone = action.today_status === 'completed';
                        const isSkipped = action.today_status === 'skipped';
                        const isPostponed = action.today_status === 'postponed';

                        return (
                          <div
                            key={action.id}
                            className={`bg-white border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                              isDone
                                ? 'border-[#86EFAC] bg-[#F7FDF9]'
                                : isSkipped
                                ? 'border-[#E8E5DF] opacity-75'
                                : 'border-[#E8E5DF] hover:border-[#D6D3CD]'
                            }`}
                          >
                            <div>
                              {/* Domain badge and Evidence link */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                {action.evidence_sources && action.evidence_sources.length > 0 && (
                                  <button
                                    onClick={() => setSelectedEvidenceModal(action)}
                                    className="text-[11px] text-[#1E3A2B] hover:underline flex items-center gap-1 font-medium"
                                  >
                                    <svg className="w-3.5 h-3.5 text-[#2D5A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span>{action.evidence_sources[0].source} Evidence</span>
                                  </button>
                                )}
                              </div>

                              <h3 className={`text-base font-bold text-[#1C1917] mb-1.5 ${isDone ? 'line-through text-[#57534E]' : ''}`}>
                                {action.title}
                              </h3>

                              <p className="text-xs text-[#57534E] leading-relaxed mb-4">
                                {action.explanation}
                              </p>
                            </div>

                            <div>
                              {/* Targets and Frequency */}
                              <div className="flex items-center gap-3 text-xs text-[#78716C] mb-4 pt-3 border-t border-[#F5F4F0]">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-[#A8A29E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {action.frequency === 'daily' ? 'Daily habit' : '3x per week'}
                                </span>
                                {action.target_value && (
                                  <span className="flex items-center gap-1 font-medium text-[#1C1917]">
                                    🎯 Target: {action.target_value} {action.target_unit || ''}
                                  </span>
                                )}
                              </div>

                              {/* Interactive Action Controls */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleLogProgress(action.id, isDone ? 'postponed' : 'completed')}
                                    disabled={actionInProgressId === action.id}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                                      isDone
                                        ? 'bg-[#1E3A2B] text-white hover:bg-[#2D5A43]'
                                        : 'bg-[#EBF5EE] text-[#1E3A2B] hover:bg-[#D1E7D8] border border-[#D1E7D8]'
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {isDone ? 'Completed' : 'Mark Done'}
                                  </button>

                                  <button
                                    onClick={() => handleLogProgress(action.id, 'skipped')}
                                    disabled={actionInProgressId === action.id}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                                      isSkipped
                                        ? 'bg-stone-200 text-stone-800'
                                        : 'text-[#78716C] hover:bg-[#F5F4F0]'
                                    }`}
                                  >
                                    Skip
                                  </button>

                                  <button
                                    onClick={() => handleLogProgress(action.id, 'postponed')}
                                    disabled={actionInProgressId === action.id}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                                      isPostponed
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'text-[#78716C] hover:bg-[#F5F4F0]'
                                    }`}
                                  >
                                    Postpone
                                  </button>
                                </div>

                                {/* Context Menu: Note and Pause action */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setNoteModalAction(action);
                                      setNoteText(action.today_log?.notes || '');
                                    }}
                                    title="Add reflection note"
                                    className="p-1.5 text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F5F4F0] rounded-lg transition"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleUpdateState(action.id, 'paused')}
                                    title="Pause action"
                                    className="p-1.5 text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F5F4F0] rounded-lg transition"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section B: Integrated Adaptive Movement & Sleep Goals (Reused from AdaptiveGoalEngine) */}
                <div className="pt-6 border-t border-[#E8E5DF]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                        <span>Today's Adaptive Movement & Sleep Goals</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] font-medium border border-[#BAE6FD]">
                          Health-Device Synced
                        </span>
                      </h2>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        Deterministic daily targets calculated by MantraAI's Adaptive Goal Engine from your passive health data.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(dashboardData?.adaptive_goals || []).map((goal) => {
                      const isComplete = goal.status === 'completed';
                      const pct = goal.target_value ? Math.min(100, Math.round(((goal.progress_value || 0) / goal.target_value) * 100)) : 0;

                      return (
                        <div
                          key={goal.id}
                          className="bg-white border border-[#E8E5DF] rounded-2xl p-4 shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-[#1C1917] capitalize">
                                {goal.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isComplete
                                    ? 'bg-[#EBF5EE] text-[#1E3A2B]'
                                    : 'bg-[#F5F4F0] text-[#78716C]'
                                }`}
                              >
                                {isComplete ? 'Goal Met' : `${pct}%`}
                              </span>
                            </div>

                            <p className="text-xs text-[#78716C] mb-3 line-clamp-2">
                              {goal.rationale}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs font-medium text-[#1C1917] mb-1.5">
                              <span>
                                {Math.round(goal.progress_value || 0).toLocaleString()} {goal.unit}
                              </span>
                              <span className="text-[#78716C]">
                                Target: {Math.round(goal.target_value || 0).toLocaleString()} {goal.unit}
                              </span>
                            </div>

                            <div className="w-full bg-[#E8E5DF] h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  isComplete ? 'bg-[#1E3A2B]' : 'bg-[#3B82F6]'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAUSED OR DISMISSED ACTIONS */}
            {activeTab === 'paused' && (
              <div>
                <h2 className="text-base font-bold text-[#1C1917] mb-2">
                  Paused or Dismissed Actions
                </h2>
                <p className="text-xs text-[#78716C] mb-6">
                  Actions you have put on hold. You can resume any habit back into your daily active plan at any time.
                </p>

                {pausedActions.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-2xl border border-[#E8E5DF]">
                    <div className="w-12 h-12 rounded-full bg-[#EBF5EE] text-[#1E3A2B] mx-auto flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[#1C1917]">No paused actions</p>
                    <p className="text-xs text-[#78716C] mt-1">All your wellness actions are currently active in today's plan.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pausedActions.map((action) => (
                      <div
                        key={action.id}
                        className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E] bg-[#F5F4F0] px-2 py-0.5 rounded">
                            {action.status}
                          </span>
                          <h3 className="text-sm font-bold text-[#1C1917] mt-1.5">{action.title}</h3>
                          <p className="text-xs text-[#78716C] line-clamp-1 mt-0.5">{action.explanation}</p>
                        </div>
                        <button
                          onClick={() => handleUpdateState(action.id, 'active')}
                          disabled={actionInProgressId === action.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EBF5EE] text-[#1E3A2B] hover:bg-[#D1E7D8] transition shrink-0 ml-4 border border-[#D1E7D8]"
                        >
                          Resume
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* EVIDENCE CITATION PROVENANCE MODAL */}
        {selectedEvidenceModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E8E5DF] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DF] mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1E3A2B] bg-[#EBF5EE] px-2.5 py-0.5 rounded-full">
                    Clinical Provenance
                  </span>
                  <h3 className="text-lg font-bold text-[#1C1917] mt-1">
                    {selectedEvidenceModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEvidenceModal(null)}
                  className="p-1 rounded-lg text-[#78716C] hover:bg-[#F5F4F0]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#78716C] uppercase tracking-wider mb-1">
                    Guideline Rationale
                  </h4>
                  <p className="text-sm text-[#1C1917] leading-relaxed">
                    {selectedEvidenceModal.explanation}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#78716C] uppercase tracking-wider mb-2">
                    Referenced Clinical Guidelines & Sources
                  </h4>
                  <div className="space-y-2.5">
                    {selectedEvidenceModal.evidence_sources?.map((src, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E5DF]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1E3A2B]">{src.source} ({src.year || 'Current'})</span>
                          <span className="text-[10px] text-[#A8A29E]">{src.source_identifier}</span>
                        </div>
                        <p className="text-xs font-medium text-[#1C1917] mt-1">{src.title}</p>
                        <p className="text-xs text-[#78716C] mt-1">{src.relevance}</p>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#2563EB] hover:underline mt-2 inline-flex items-center gap-1 font-medium"
                          >
                            <span>Official guideline publication</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8E5DF] text-xs text-[#78716C]">
                  Clinical note: Population-level guideline recommendations inform optimal baseline habits. Individual responses vary, and recommendations do not replace direct medical assessment.
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedEvidenceModal(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1E3A2B] text-white hover:bg-[#2D5A43] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REFLECTION NOTE MODAL */}
        {noteModalAction && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8E5DF]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DF] mb-4">
                <h3 className="text-base font-bold text-[#1C1917]">
                  Personal Reflection Note
                </h3>
                <button
                  onClick={() => setNoteModalAction(null)}
                  className="p-1 rounded-lg text-[#78716C] hover:bg-[#F5F4F0]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-[#78716C] mb-3">
                {noteModalAction.title}
              </p>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="How did this routine go today? Add any observations or context..."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-[#E8E5DF] focus:outline-none focus:border-[#1E3A2B] bg-[#FAF9F6]"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setNoteModalAction(null)}
                  className="px-3 py-1.5 text-xs text-[#78716C] hover:bg-[#F5F4F0] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLogProgress(noteModalAction.id, noteModalAction.today_status || 'completed', noteText)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#1E3A2B] text-white hover:bg-[#2D5A43]"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
