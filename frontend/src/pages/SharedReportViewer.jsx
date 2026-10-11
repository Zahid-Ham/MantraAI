import React, { useState, useEffect } from 'react';
import { apiRequest } from '../config/api';

export default function SharedReportViewer({ token, onNavigateHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiRequest(`/api/v1/shared/${token}`);
        setData(res);
      } catch (err) {
        setError(err.message || 'Report link not found or has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedReport();
    } else {
      setError('Invalid share link.');
      setLoading(false);
    }
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-3 border-[#1E3A2B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#57534E] uppercase tracking-wider">
          Retrieving Clinician Summary...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E8E5DF] rounded-3xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1C1917] mb-2">Link Expired or Inactive</h2>
          <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-6">
            This clinical summary link is no longer available. Shared links expire automatically after 72 hours, after 10 views, or upon patient revocation.
          </p>
          <button
            onClick={() => { if (onNavigateHome) onNavigateHome(); else window.location.hash = ''; }}
            className="px-6 py-2.5 bg-[#1E3A2B] hover:bg-[#14281D] text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4 sm:px-6 font-sans text-[#1C1917] print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Actions Bar (hidden when printing) */}
        <div className="flex items-center justify-between bg-white border border-[#EAE5DD] rounded-2xl p-4 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-[#57534E]">
              Clinician Summary View (Single Session)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#1E3A2B] hover:bg-[#14281D] text-white font-medium text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-2 shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save as PDF
            </button>
            <button
              onClick={() => { if (onNavigateHome) onNavigateHome(); else window.location.hash = ''; }}
              className="px-3.5 py-2 border border-[#D1D5DB] text-[#4B5563] hover:bg-[#F9FAFB] font-medium text-xs rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable One-Pager Document */}
        <div className="bg-white border border-[#EAE5DD] rounded-3xl p-8 sm:p-10 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
          
          {/* Header */}
          <div className="border-b border-[#EAE5DD] pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="text-[11px] font-bold text-[#D25619] tracking-widest uppercase mb-1">
                MANTRA.AI CLINICAL DECISION SUPPORT
              </div>
              <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">
                Patient-Authorized Assessment Summary
              </h1>
              <p className="text-xs text-[#78716C] mt-1">
                Self-Reported Health Screener &amp; Lifestyle Risk Assessment
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-[#57534E]">
              <div><strong className="font-semibold text-[#1C1917]">Date Completed:</strong> {data.assessment_date}</div>
              {data.overall_status && (
                <div className="mt-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
                    Status: {data.overall_status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Clinical Follow-up Flags */}
          {data.clinical_follow_up_flags && data.clinical_follow_up_flags.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#991B1B] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                Primary Clinical Considerations &amp; Follow-Up Items
              </h2>
              <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-4 space-y-2">
                {data.clinical_follow_up_flags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#991B1B]">
                    <span className="font-bold">•</span>
                    <span className="leading-relaxed font-medium">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Reported Factors & Symptoms */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
              Reported Symptoms &amp; Evaluated Factors
            </h2>
            <div className="divide-y divide-[#F5F5F4] border border-[#EAE5DD] rounded-2xl overflow-hidden text-xs">
              {data.reported_symptoms_and_factors.length > 0 ? (
                data.reported_symptoms_and_factors.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAFAF9]">
                    <div>
                      <div className="font-semibold text-[#1C1917]">{item.name}</div>
                      {item.notes && <div className="text-[11px] text-[#78716C] mt-0.5">{item.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]">
                        Grade {item.evidence_grade}
                      </span>
                      <span className="capitalize text-[11px] text-[#44403C] font-medium">
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[#78716C] italic text-xs">
                  No modifiable risk factors flagged during this evaluation.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Medications & Substances */}
          {data.medications_and_substances && data.medications_and_substances.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Reported Medications &amp; Substance Exposures
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.medications_and_substances.map((sub, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] font-medium text-xs">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Suggested Clinician Discussion Prompts */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
              Suggested Discussion Prompts for Consultation
            </h2>
            <div className="bg-[#FAFAF9] border border-[#EAE5DD] rounded-2xl p-4 space-y-2 text-xs text-[#44403C]">
              {data.questions_for_clinician.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-[#1E3A2B]">{idx + 1}.</span>
                  <span className="leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations and Legal Disclaimer */}
          <div className="border-t border-[#EAE5DD] pt-6 space-y-2 text-[11px] text-[#78716C] leading-relaxed">
            <div className="font-semibold text-[#57534E] uppercase tracking-wider text-[10px]">
              Clinical Disclaimer &amp; Limitations
            </div>
            <p>{data.limitations_and_disclaimer}</p>
            <p className="italic">
              Generated by MantraAI Decision Support Engine. For questions or technical verification, contact support@mantraai.com.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
