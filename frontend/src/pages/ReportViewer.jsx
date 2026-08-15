import React, { useEffect, useState } from 'react';
import { apiRequest } from '../config/api';
import MicroscopicField from '../components/landing/MicroscopicField';

export default function ReportViewer({ onNavigateHome }) {
  const [report, setReport] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Extract session ID from hash query parameters
  const getSessionId = () => {
    try {
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const queryStr = hash.split('?')[1];
        const params = new URLSearchParams(queryStr);
        return params.get('id');
      }
    } catch (_) {}
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
        const reportData = await apiRequest(`/api/v1/assessments/${sessId}/report`);
        const resultData = await apiRequest(`/api/v1/assessments/${sessId}/results`);
        setReport(reportData);
        setResult(resultData);
      } catch (err) {
        setError('Failed to fetch the requested report details.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [sessId]);

  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-between transition-colors duration-500 relative">
      
      {/* Header bar */}
      <header className="relative z-20 w-full flex justify-between items-center border-b border-border-light dark:border-border-dark px-6 py-4 md:px-16 bg-cream/90 dark:bg-night-dark/90 backdrop-blur-xs select-none">
        <div onClick={onNavigateHome} className="flex items-center gap-2.5 cursor-pointer">
          <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-1.5 py-0.5 font-medium tracking-widest rounded-sm">मंत्र</span>
          <span className="font-grotesk font-bold text-xl tracking-wider text-night-blue dark:text-cream">MANTRA<span className="text-marigold">.AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.hash = '#history'} 
            className="px-4 py-2 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold rounded-sm hover:border-marigold transition-colors"
          >
            History
          </button>
          <button 
            onClick={onNavigateHome} 
            className="px-4 py-2 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold rounded-sm hover:border-marigold transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      {/* Background biological animation */}
      <div className="absolute inset-0 pointer-events-none opacity-10 z-0">
        <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
      </div>

      <main className="flex-grow w-full py-12 px-6 md:px-16 relative z-10 max-w-3xl mx-auto">
        
        {loading ? (
          <div className="text-center py-20 text-xs font-semibold uppercase tracking-widest text-marigold animate-pulse">
            Compiling report components...
          </div>
        ) : error ? (
          <div className="border border-red-500/20 bg-red-500/[0.03] text-red-500 text-xs px-4 py-3 rounded-sm text-center">
            {error}
          </div>
        ) : !report ? (
          <div className="text-center text-xs text-night-blue/50 dark:text-cream/50">Report data could not be found.</div>
        ) : (
          <div className="space-y-8">
            
            {/* Header / Meta */}
            <div className="border-b border-border-light dark:border-border-dark pb-6 select-none">
              <span className="text-marigold text-xs font-semibold tracking-widest uppercase block mb-2">
                Assessment Report Summary
              </span>
              <h2 className="font-serif text-3.5xl md:text-5xl font-normal leading-tight tracking-tight mb-4">
                {report.summary?.headline || 'Wellness Analysis'}
              </h2>
              <div className="flex items-center gap-4 text-xs font-semibold text-night-blue/60 dark:text-cream/50">
                <span>STATUS: <span className="text-marigold font-bold">{result?.overall_category || 'Stable'}</span></span>
                <span>•</span>
                <span>MODEL: {report.model_name || 'Llama 3.3'}</span>
              </div>
            </div>

            {/* Overall Overview */}
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-normal text-night-blue dark:text-cream">Overview</h3>
              <p className="font-grotesk text-sm md:text-base font-light leading-relaxed text-night-blue/80 dark:text-cream/70">
                {report.summary?.overview}
              </p>
            </div>

            {/* Key Findings */}
            {report.key_findings && report.key_findings.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-border-light dark:border-border-dark">
                <h3 className="font-serif text-2xl font-normal text-night-blue dark:text-cream">Key Observations</h3>
                <div className="space-y-4">
                  {report.key_findings.map((item, idx) => (
                    <div key={idx} className="border border-border-light dark:border-border-dark p-5 bg-cream-dark/20 dark:bg-night-blue/20 rounded-sm">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-serif text-base font-normal text-night-blue dark:text-cream">{item.title}</h4>
                        <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold border ${
                          item.severity === 'notable' 
                            ? 'bg-red-500/10 border-red-500/25 text-red-500' 
                            : 'bg-marigold/10 border-marigold/25 text-marigold'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="font-grotesk text-xs leading-relaxed text-night-blue/80 dark:text-cream/70 mb-3 font-light">
                        {item.explanation}
                      </p>
                      {item.evidence && item.evidence.length > 0 && (
                        <div className="pt-2 border-t border-border-light dark:border-border-dark/50">
                          <span className="text-[9px] uppercase tracking-wider text-night-blue/40 dark:text-cream/40 font-bold block mb-1">Observed inputs:</span>
                          <ul className="list-disc list-inside text-[10px] text-night-blue/60 dark:text-cream/50 space-y-0.5">
                            {item.evidence.map((ev, i) => <li key={i} className="font-light">{ev}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Domain Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border-light dark:border-border-dark">
              {report.reproductive_health && (
                <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm">
                  <span className="text-[9px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2 mb-3">
                    Reproductive Biology Parameters
                  </span>
                  <p className="text-xs font-light text-night-blue/80 dark:text-cream/70 leading-relaxed">
                    {report.reproductive_health.summary}
                  </p>
                </div>
              )}
              {report.sexual_health && (
                <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm">
                  <span className="text-[9px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2 mb-3">
                    Sexual Well-being Profile
                  </span>
                  <p className="text-xs font-light text-night-blue/80 dark:text-cream/70 leading-relaxed">
                    {report.sexual_health.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Action Items */}
            {report.priority_actions && report.priority_actions.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-border-light dark:border-border-dark">
                <h3 className="font-serif text-2xl font-normal text-night-blue dark:text-cream">Priority Wellness Actions</h3>
                <div className="space-y-4">
                  {report.priority_actions.map((act, idx) => (
                    <div key={idx} className="border border-border-light dark:border-border-dark p-5 bg-cream dark:bg-night-blue rounded-sm flex gap-4 items-start">
                      <span className="font-serif text-3xl font-light text-marigold leading-none">
                        {String(act.priority || idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h4 className="font-grotesk text-xs font-bold uppercase tracking-wider text-night-blue dark:text-cream mb-1">
                          {act.area}
                        </h4>
                        <p className="text-xs font-semibold text-night-blue/90 dark:text-cream/90 mb-1">
                          {act.action}
                        </p>
                        <p className="text-xs font-light text-night-blue/60 dark:text-cream/50 leading-relaxed">
                          {act.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="border-t border-border-light dark:border-border-dark pt-6 mt-8">
              <p className="text-[10px] text-night-blue/50 dark:text-cream/40 italic leading-relaxed text-center">
                {report.disclaimer || 'MantraAI is an educational pre-clinical utility. It does not replace medical diagnostics.'}
              </p>
            </div>

          </div>
        )}

      </main>

      <footer className="py-6 border-t border-border-light dark:border-border-dark text-[10px] text-center text-night-blue/40 dark:text-cream/30 px-6">
        MANTRA.AI — Private health intelligence for India. Shielded by design.
      </footer>

    </div>
  );
}
