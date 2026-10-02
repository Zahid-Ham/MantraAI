import React, { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { apiRequest } from '../config/api';

export default function History({ onNavigateHome }) {
  const [sessions, setSessions] = useState([]);
  const [reportsMap, setReportsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfToast, setPdfToast] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchReportsHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiRequest('/api/v1/assessments');
        
        if (!isMounted) return;

        if (Array.isArray(data)) {
          // Sort newest to oldest
          const sorted = [...data].sort((a, b) => {
            const dateA = new Date(a.completed_at || a.started_at || 0).getTime();
            const dateB = new Date(b.completed_at || b.started_at || 0).getTime();
            return dateB - dateA;
          });
          setSessions(sorted);

          const completed = sorted.filter((s) => s.status === 'COMPLETED');
          
          // Fetch report content in parallel for all completed sessions
          const reportsObj = {};
          await Promise.all(
            completed.map(async (sess) => {
              try {
                const rep = await apiRequest(`/api/v1/assessments/${sess.id}/report`);
                reportsObj[sess.id] = rep;
              } catch (err) {
                // If detailed report is not yet generated or fails, keep fallback
                console.warn(`Report fetch failed for session ${sess.id}:`, err);
              }
            })
          );

          if (isMounted) {
            setReportsMap(reportsObj);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch assessment history. Please check your connection and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReportsHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewReport = (sessId) => {
    window.location.hash = `#report?id=${sessId}`;
  };

  const handleTakeNewAssessment = () => {
    window.location.hash = '#assess';
  };

  const handleViewProgress = () => {
    window.location.hash = '#progress';
  };

  const handleDownloadPdf = (sessId) => {
    setPdfToast('Opening print view. Select "Save as PDF" to download your report.');
    setTimeout(() => {
      window.print();
    }, 300);
    setTimeout(() => {
      setPdfToast('');
    }, 4500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getReportMetrics = (rep) => {
    if (!rep) {
      return {
        priorityCount: 0,
        positiveCount: 0,
        actionsCount: 0,
        evidenceCount: 0,
        headline: 'Reproductive Health & Wellness Report',
        overview: 'Your personalized report with evidence-based insights on your reproductive health, lifestyle factors, and actionable recommendations.',
      };
    }

    const priorityCount =
      rep.priority_factors?.length ||
      rep.key_findings?.length ||
      rep.structured_findings?.length ||
      0;

    const positiveCount =
      rep.positive_factors?.length ||
      (rep.lifestyle_wellness?.relevant_factors?.length || 0) ||
      0;

    const actionsCount =
      rep.personalized_action_plan?.length ||
      rep.priority_actions?.length ||
      0;

    const evidenceCount =
      rep.evidence?.length ||
      (rep.reproductive_health?.evidence_refs?.length || 0) +
        (rep.sexual_health?.evidence_refs?.length || 0);

    const headline =
      rep.executive_summary?.headline ||
      rep.summary?.headline ||
      'Reproductive Health & Wellness Report';

    const overview =
      rep.executive_summary?.overview ||
      rep.summary?.overview ||
      'Your personalized report with evidence-based insights on your reproductive health, lifestyle factors, and actionable recommendations.';

    return {
      priorityCount,
      positiveCount,
      actionsCount,
      evidenceCount,
      headline,
      overview,
    };
  };

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const latestSession = completedSessions[0] || null;
  const latestReport = latestSession ? reportsMap[latestSession.id] : null;
  const latestMetrics = getReportMetrics(latestReport);

  const previousSessions = completedSessions.slice(1);

  return (
    <AppShell currentTab="reports" onNavigateHome={onNavigateHome}>
      <div className="w-full space-y-8 pb-12 font-sans">
        
        {/* PDF Toast Notification */}
        {pdfToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1E3A2B] text-white px-5 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-3 animate-fade-in">
            <svg className="w-4 h-4 text-[#A7F3D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{pdfToast}</span>
          </div>
        )}

        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
              My Reports
            </h1>
            <p className="text-base sm:text-lg text-[#57534E] font-medium mt-1">
              Your reproductive health and wellness assessments over time
            </p>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1.5">
              Track your progress, revisit your personalized insights, and take new assessments when you’re ready.
            </p>
          </div>

          <button
            onClick={handleTakeNewAssessment}
            className="inline-flex items-center justify-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all shrink-0 cursor-pointer self-start"
            aria-label="Take New Assessment"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Take New Assessment</span>
          </button>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading reports">
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-8 h-80 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-28 h-6 bg-[#F3EFEA] rounded-lg" />
                <div className="w-3/4 h-8 bg-[#F3EFEA] rounded-lg" />
                <div className="w-1/2 h-4 bg-[#F3EFEA] rounded-lg" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-[#F3EFEA] rounded-xl" />
                ))}
              </div>
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

        {/* Empty State */}
        {!loading && !error && completedSessions.length === 0 && (
          <div className="bg-white border border-[#E8E5DF] rounded-3xl p-10 sm:p-16 text-center space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#EBF5EE] text-[#1E3A2B] mx-auto flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-bold text-[#1C1917]">No Completed Reports Yet</h2>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Take your first comprehensive health assessment to receive evidence-based insights, actionable lifestyle guidance, and personalized recommendations.
              </p>
            </div>
            <button
              onClick={handleTakeNewAssessment}
              className="inline-flex items-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Take Assessment</span>
            </button>
          </div>
        )}

        {/* 2. Latest Report Featured Section */}
        {!loading && !error && latestSession && (
          <section aria-labelledby="latest-report-heading">
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col lg:flex-row justify-between gap-8 items-stretch">
              
              {/* Left Column: Report Details & Metrics */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F7F3EB] text-[#786D5F] text-xs font-semibold select-none mb-3">
                    <svg className="w-3.5 h-3.5 fill-[#786D5F]" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Latest Report</span>
                  </div>

                  {/* Title */}
                  <h2 id="latest-report-heading" className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
                    Reproductive Health &amp; Wellness Report
                  </h2>

                  {/* Date & Completed Badge */}
                  <div className="flex items-center gap-3 mt-2.5 mb-3 flex-wrap">
                    <span className="text-xs sm:text-sm font-medium text-[#57534E] flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(latestSession.completed_at || latestSession.started_at)}</span>
                    </span>
                    <span className="bg-[#E2F5EA] text-[#15803D] border border-[#C6EBCE] px-2.5 py-0.5 rounded-md text-xs font-bold">
                      Completed
                    </span>
                  </div>

                  {/* Summary Overview */}
                  <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed line-clamp-2 max-w-2xl">
                    {latestMetrics.overview}
                  </p>
                </div>

                {/* 4 Metric Blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
                  
                  {/* Metric 1: Priority Factors */}
                  <div className="border border-[#F2EFE9] bg-[#FAF9F7] p-3.5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-[#1C1917]">
                        {latestMetrics.priorityCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1C1917] leading-tight">Priority Factors</div>
                      <div className="text-[10.5px] text-[#78716C] mt-0.5">Areas to focus on</div>
                    </div>
                  </div>

                  {/* Metric 2: Positive Factors */}
                  <div className="border border-[#F2EFE9] bg-[#FAF9F7] p-3.5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-[#1C1917]">
                        {latestMetrics.positiveCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1C1917] leading-tight">Positive Factors</div>
                      <div className="text-[10.5px] text-[#78716C] mt-0.5">Strengths to maintain</div>
                    </div>
                  </div>

                  {/* Metric 3: Key Actions */}
                  <div className="border border-[#F2EFE9] bg-[#FAF9F7] p-3.5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-[#1C1917]">
                        {latestMetrics.actionsCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1C1917] leading-tight">Key Actions</div>
                      <div className="text-[10.5px] text-[#78716C] mt-0.5">Personalized steps</div>
                    </div>
                  </div>

                  {/* Metric 4: Evidence References */}
                  <div className="border border-[#F2EFE9] bg-[#FAF9F7] p-3.5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-[#0D9488] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-[#1C1917]">
                        {latestMetrics.evidenceCount}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1C1917] leading-tight">Evidence References</div>
                      <div className="text-[10.5px] text-[#78716C] mt-0.5">Trusted sources</div>
                    </div>
                  </div>

                </div>

                {/* CTA Action Buttons */}
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    onClick={() => handleViewReport(latestSession.id)}
                    className="inline-flex items-center justify-center gap-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white px-6 py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex-1 sm:flex-initial"
                  >
                    <span>View Full Report</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(latestSession.id)}
                    className="inline-flex items-center justify-center gap-2 bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#9CA3AF] px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer flex-1 sm:flex-initial"
                  >
                    <svg className="w-4 h-4 text-[#57534E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download PDF</span>
                  </button>
                </div>

              </div>

              {/* Right Column: Serene Botanical / Mountain Nature Visual */}
              <div className="lg:w-80 xl:w-96 rounded-2xl overflow-hidden relative bg-[#EBF3ED] flex items-center justify-center min-h-[220px] lg:min-h-full border border-[#DDECE1]">
                
                {/* Visual Graphic Representation */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#203D2E]/80 via-transparent to-transparent z-10" />
                
                <svg className="w-full h-full object-cover absolute inset-0 text-[#2D5A3C]" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" fill="none">
                  {/* Sky & Sun */}
                  <rect width="400" height="300" fill="#E8F4EC" />
                  <circle cx="280" cy="110" r="55" fill="#FEF3C7" opacity="0.8" />
                  <circle cx="280" cy="110" r="75" fill="#FEF3C7" opacity="0.3" />
                  
                  {/* Background Mountains */}
                  <path d="M0 200 L120 120 L240 190 L340 110 L400 160 L400 300 L0 300 Z" fill="#BFDBC6" opacity="0.6" />
                  <path d="M60 210 L180 140 L300 200 L400 130 L400 300 L0 300 Z" fill="#99C7A5" opacity="0.7" />

                  {/* Calm Water Lake */}
                  <path d="M0 210 Q200 195 400 210 L400 300 L0 300 Z" fill="#80B890" opacity="0.85" />
                  
                  {/* Peaceful Figure on Rock */}
                  <path d="M260 230 Q290 200 330 220 Q350 240 370 270 Q310 290 260 270 Z" fill="#4B6B57" />
                  
                  {/* Seated Meditative Silhouette */}
                  <circle cx="315" cy="182" r="8" fill="#1C3829" />
                  <path d="M308 190 C308 190 315 190 322 190 C326 195 328 208 328 215 L302 215 C302 208 304 195 308 190 Z" fill="#1C3829" />
                  <path d="M298 215 C298 210 332 210 332 215 C332 222 298 222 298 215 Z" fill="#1C3829" />

                  {/* Foreground Botanical Leaves */}
                  <path d="M-10 280 Q40 220 70 200 Q50 260 20 300 Z" fill="#1E3A2B" opacity="0.9" />
                  <path d="M20 290 Q80 230 110 210 Q90 270 50 310 Z" fill="#2A523C" opacity="0.8" />
                  <path d="M350 300 Q380 240 410 220 Q400 280 370 310 Z" fill="#1E3A2B" opacity="0.9" />
                </svg>

                {/* Subtle overlay quote / badge */}
                <div className="relative z-20 text-center p-6 mt-auto">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-white/90 drop-shadow-xs">
                    Holistic &bull; Grounded &bull; Proven
                  </span>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* 3. Previous Reports Grid Section */}
        {!loading && !error && previousSessions.length > 0 && (
          <section aria-labelledby="previous-reports-heading" className="space-y-4 pt-4">
            <div>
              <h2 id="previous-reports-heading" className="text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
                Previous Reports
              </h2>
              <p className="text-xs sm:text-sm text-[#78716C] mt-0.5">
                Your assessment history in chronological order
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {previousSessions.map((sess) => {
                const rep = reportsMap[sess.id];
                const metrics = getReportMetrics(rep);

                return (
                  <div
                    key={sess.id}
                    className="bg-white border border-[#E8E5DF] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#D0CBC0] transition-all space-y-4"
                  >
                    <div>
                      {/* Header Row: Date & Status */}
                      <div className="flex items-center justify-between gap-2 pb-2">
                        <span className="text-xs font-medium text-[#57534E] flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(sess.completed_at || sess.started_at)}</span>
                        </span>
                        <span className="bg-[#E2F5EA] text-[#15803D] border border-[#C6EBCE] px-2 py-0.5 rounded-md text-[10.5px] font-bold">
                          Completed
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-[#1C1917] mt-1 leading-snug">
                        Reproductive Health &amp; Wellness Report
                      </h3>

                      {/* Short Summary */}
                      <p className="text-xs text-[#57534E] mt-1.5 line-clamp-2 leading-relaxed">
                        Comprehensive insights into your reproductive health and wellness factors.
                      </p>
                    </div>

                    {/* 3 Metric Pills */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-[#F2EFE9]">
                      
                      {/* Priority */}
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#FAF9F7]">
                        <div className="w-5 h-5 rounded-md bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1C1917] leading-none">{metrics.priorityCount}</div>
                          <div className="text-[9.5px] text-[#78716C] leading-none mt-0.5">Priority</div>
                        </div>
                      </div>

                      {/* Positive */}
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#FAF9F7]">
                        <div className="w-5 h-5 rounded-md bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1C1917] leading-none">{metrics.positiveCount}</div>
                          <div className="text-[9.5px] text-[#78716C] leading-none mt-0.5">Positive</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#FAF9F7]">
                        <div className="w-5 h-5 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1C1917] leading-none">{metrics.actionsCount}</div>
                          <div className="text-[9.5px] text-[#78716C] leading-none mt-0.5">Actions</div>
                        </div>
                      </div>

                    </div>

                    {/* View Report Button */}
                    <button
                      onClick={() => handleViewReport(sess.id)}
                      className="w-full py-2.5 px-4 bg-white border border-[#E8E5DF] hover:border-[#1E3A2B] hover:bg-[#F9FAFB] text-[#1C1917] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View Report</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>

                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Progress Callout Banner */}
        <section aria-labelledby="progress-callout-heading">
          <div className="bg-[#EAF6ED] border border-[#D0EBD8] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Icon and Text */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D1F0DA] text-[#1E7E4E] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 id="progress-callout-heading" className="text-base font-bold text-[#1C1917]">
                  Want to see how you’re progressing?
                </h3>
                <p className="text-xs sm:text-sm text-[#57534E] mt-0.5">
                  Check out your progress over time with trends and comparisons.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleViewProgress}
              className="bg-white border border-[#C5EBCE] hover:border-[#1E7E4E] text-[#1E3A2B] px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <span>View My Progress</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

          </div>
        </section>

      </div>
    </AppShell>
  );
}
