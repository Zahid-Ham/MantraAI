import React, { useEffect, useState } from 'react';
import { apiRequest } from '../config/api';
import MicroscopicField from '../components/landing/MicroscopicField';

export default function History({ onNavigateHome }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiRequest('/api/v1/assessments');
        setSessions(data);
      } catch (err) {
        setError('Failed to fetch assessment history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleResume = (sessId) => {
    localStorage.setItem('mantra_active_assessment_id', sessId);
    // Clear out standard wizard items to force sync from DB
    localStorage.removeItem('mantra_assessment_step');
    localStorage.removeItem('mantra_assessment_question_idx');
    localStorage.removeItem('mantra_assessment_answers');
    window.location.hash = '#assess';
  };

  const handleViewReport = (sessId) => {
    window.location.hash = `#report?id=${sessId}`;
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return dateStr;
    }
  };

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
            onClick={() => window.location.hash = '#profile'} 
            className="px-4 py-2 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold rounded-sm hover:border-marigold transition-colors"
          >
            Profile
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
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
      </div>

      <main className="flex-grow w-full py-12 px-6 md:px-16 relative z-10 max-w-2xl mx-auto">
        
        <div className="space-y-6">
          <div className="text-center md:text-left space-y-2 select-none mb-8">
            <span className="font-sans text-[9px] text-marigold bg-marigold/10 border border-marigold/20 px-2 py-0.5 font-bold tracking-[0.2em] rounded-sm uppercase inline-block">
              History
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-night-blue dark:text-cream">
              Assessment History
            </h2>
            <p className="text-xs text-night-blue/50 dark:text-cream/50">
              Review and resume your private pre-clinical screening records.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs font-semibold uppercase tracking-widest text-marigold animate-pulse">
              Loading assessments...
            </div>
          ) : error ? (
            <div className="border border-red-500/20 bg-red-500/[0.03] text-red-500 text-xs px-4 py-3 rounded-sm text-center">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="border border-border-light dark:border-border-dark bg-cream dark:bg-night-blue p-8 rounded-sm text-center space-y-4">
              <p className="text-xs text-night-blue/60 dark:text-cream/50">You have no recorded screening assessments yet.</p>
              <button
                onClick={() => window.location.hash = '#assess'}
                className="px-6 py-2.5 bg-marigold hover:bg-marigold-light text-night-blue text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer"
              >
                Start New Assessment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((sess) => (
                <div 
                  key={sess.id} 
                  className="border border-border-light dark:border-border-dark bg-cream dark:bg-night-blue p-6 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-marigold/30 transition-all shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base text-night-blue dark:text-cream">
                        Assessment #{sess.id.slice(0, 5).toUpperCase()}
                      </span>
                      <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold border ${
                        sess.status === 'COMPLETED'
                          ? 'bg-ashoka-green/10 border-ashoka-green/20 text-ashoka-green dark:text-ashoka-green-light'
                          : 'bg-marigold/10 border-marigold/20 text-marigold'
                      }`}>
                        {sess.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <span className="text-[10px] text-night-blue/50 dark:text-cream/40 block">
                      Started on {formatDate(sess.started_at)}
                    </span>
                  </div>

                  <div>
                    {sess.status === 'COMPLETED' ? (
                      <button
                        onClick={() => handleViewReport(sess.id)}
                        className="px-4 py-2 border border-border-light dark:border-border-dark hover:border-marigold text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors text-night-blue dark:text-cream bg-cream-dark/10 dark:bg-night-dark/10 cursor-pointer"
                      >
                        View Report
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResume(sess.id)}
                        className="px-4 py-2 bg-marigold hover:bg-marigold-light text-night-blue text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                      >
                        Continue
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </main>

      <footer className="py-8 border-t border-border-light dark:border-border-dark text-[10px] text-center text-night-blue/40 dark:text-cream/30 px-6">
        Disclaimer: MantraAI is a digital pre-clinical health platform. It does not replace professional medical advice or diagnoses.
      </footer>

    </div>
  );
}
