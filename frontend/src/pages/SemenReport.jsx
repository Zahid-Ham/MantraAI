import React, { useState, useEffect } from 'react';
import AppShell from '../components/layout/AppShell';
import { apiRequest } from '../config/api';

export default function SemenReport({ onNavigateHome }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Guided Form State
  const [formData, setFormData] = useState({
    collection_date: new Date().toISOString().split('T')[0],
    abstinence_days: '3',
    volume_ml: '',
    concentration_m_per_ml: '',
    total_count_m: '',
    total_motility_pct: '',
    progressive_motility_pct: '',
    vitality_pct: '',
    normal_morphology_pct: '',
    ph: '',
    lab_name: '',
  });

  const [notAvailable, setNotAvailable] = useState({});

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/v1/semen-reports');
      if (res && res.reports) {
        setReports(res.reports);
        if (res.reports.length > 0 && !selectedReport) {
          setSelectedReport(res.reports[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching semen reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotAvailable = (field) => {
    setNotAvailable(prev => {
      const next = { ...prev, [field]: !prev[field] };
      if (next[field]) {
        setFormData(f => ({ ...f, [field]: '' }));
      }
      return next;
    });
  };

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        collection_date: formData.collection_date,
        abstinence_days: notAvailable.abstinence_days || !formData.abstinence_days ? null : parseInt(formData.abstinence_days, 10),
        volume_ml: notAvailable.volume_ml || !formData.volume_ml ? null : parseFloat(formData.volume_ml),
        concentration_m_per_ml: notAvailable.concentration_m_per_ml || !formData.concentration_m_per_ml ? null : parseFloat(formData.concentration_m_per_ml),
        total_count_m: notAvailable.total_count_m || !formData.total_count_m ? null : parseFloat(formData.total_count_m),
        total_motility_pct: notAvailable.total_motility_pct || !formData.total_motility_pct ? null : parseFloat(formData.total_motility_pct),
        progressive_motility_pct: notAvailable.progressive_motility_pct || !formData.progressive_motility_pct ? null : parseFloat(formData.progressive_motility_pct),
        vitality_pct: notAvailable.vitality_pct || !formData.vitality_pct ? null : parseFloat(formData.vitality_pct),
        normal_morphology_pct: notAvailable.normal_morphology_pct || !formData.normal_morphology_pct ? null : parseFloat(formData.normal_morphology_pct),
        ph: notAvailable.ph || !formData.ph ? null : parseFloat(formData.ph),
        lab_name: formData.lab_name || null,
      };

      const newReport = await apiRequest('/api/v1/semen-reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSelectedReport(newReport);
      setShowForm(false);
      await fetchReports();
    } catch (err) {
      console.error('Error creating semen report:', err);
      alert('Failed to save semen report. Please verify parameter values.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this semen analysis record?')) return;
    try {
      await apiRequest(`/api/v1/semen-reports/${reportId}`, { method: 'DELETE' });
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
      await fetchReports();
    } catch (err) {
      console.error('Error deleting semen report:', err);
    }
  };

  const fieldsConfig = [
    { key: 'volume_ml', label: 'Ejaculate Volume', unit: 'mL', who: '≥ 1.4 mL', placeholder: 'e.g. 2.5' },
    { key: 'concentration_m_per_ml', label: 'Sperm Concentration', unit: 'million/mL', who: '≥ 16 M/mL', placeholder: 'e.g. 35' },
    { key: 'total_count_m', label: 'Total Sperm Count', unit: 'million/ejaculate', who: '≥ 39 M', placeholder: 'e.g. 85' },
    { key: 'total_motility_pct', label: 'Total Motility (PR + NP)', unit: '%', who: '≥ 42%', placeholder: 'e.g. 55' },
    { key: 'progressive_motility_pct', label: 'Progressive Motility (PR)', unit: '%', who: '≥ 30%', placeholder: 'e.g. 40' },
    { key: 'vitality_pct', label: 'Vitality (Live Sperm)', unit: '%', who: '≥ 54%', placeholder: 'e.g. 65' },
    { key: 'normal_morphology_pct', label: 'Normal Morphology (Strict)', unit: '%', who: '≥ 4.0%', placeholder: 'e.g. 6.0' },
    { key: 'ph', label: 'Semen pH', unit: 'pH units', who: '≥ 7.2', placeholder: 'e.g. 7.6' },
  ];

  return (
    <AppShell currentTab="semen_report" onNavigateHome={onNavigateHome}>
      <div className="max-w-5xl mx-auto space-y-6 font-sans py-4">
        
        {/* Header Bar */}
        <div className="bg-white border border-[#EAE5DD] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-[11px] font-bold text-[#D25619] uppercase tracking-wider">
              Diagnostic Decision Support
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight mt-1">
              Semen Report Interpreter
            </h1>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1">
              Deterministic parameter evaluation against WHO 6th Edition (2021) lower reference limits.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-3 bg-[#1E3A2B] hover:bg-[#14281D] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancel Entry' : 'Enter Semen Analysis'}
          </button>
        </div>

        {/* Guided Entry Form Modal/Collapsible */}
        {showForm && (
          <div className="bg-white border border-[#EAE5DD] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#F5F5F4] pb-4">
              <h2 className="text-lg font-bold text-[#1C1917]">
                Manual Semen Analysis Entry
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Enter parameters from your laboratory report. If your lab did not test a specific metric, check "I don't have this value".
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Meta information row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Sample Collection Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.collection_date}
                    onChange={e => handleInputChange('collection_date', e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#1C1917]">
                      Abstinence Period (Days)
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleNotAvailable('abstinence_days')}
                      className="text-[10px] text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                    >
                      {notAvailable.abstinence_days ? '✓ Set' : 'Unsure'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    disabled={notAvailable.abstinence_days}
                    placeholder="WHO recommends 2–7"
                    value={formData.abstinence_days}
                    onChange={e => handleInputChange('abstinence_days', e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] disabled:opacity-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Testing Lab / Clinic Name
                  </label>
                  <input
                    type="text"
                    maxLength={255}
                    placeholder="e.g. City Fertility Lab"
                    value={formData.lab_name}
                    onChange={e => handleInputChange('lab_name', e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] outline-none"
                  />
                </div>
              </div>

              {/* Lab Parameters Grid */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#57534E] uppercase tracking-wider">
                  Semen Analysis Parameters (WHO 6th Edition Reference)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fieldsConfig.map(field => {
                    const isNa = notAvailable[field.key];
                    return (
                      <div key={field.key} className="p-3.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#1C1917]">{field.label}</span>
                            <span className="text-[10px] text-[#78716C] ml-1.5 font-medium">({field.unit})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleNotAvailable(field.key)}
                            className="text-[11px] font-medium text-[#78716C] hover:text-[#1E3A2B] cursor-pointer"
                          >
                            {isNa ? 'Enter value' : "I don't have this"}
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            step="0.01"
                            disabled={isNa}
                            placeholder={isNa ? 'Not reported' : field.placeholder}
                            value={formData[field.key]}
                            onChange={e => handleInputChange(field.key, e.target.value)}
                            className="flex-1 bg-white border border-[#D1D5DB] rounded-xl px-3 py-2 text-xs text-[#1C1917] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed outline-none"
                          />
                          <span className="text-[10px] text-[#78716C] font-semibold bg-white border border-[#E5E7EB] px-2 py-1 rounded-lg shrink-0">
                            Limit: {field.who}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#1E3A2B] hover:bg-[#14281D] text-white font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  {submitting ? 'Analyzing Parameters...' : 'Save & Interpret Semen Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 border border-[#D1D5DB] text-[#57534E] hover:bg-[#F9FAFB] font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Selected Report Detailed View */}
        {selectedReport ? (
          <div className="bg-white border border-[#EAE5DD] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Report Header */}
            <div className="border-b border-[#F5F5F4] pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E3A2B]">
                  Sample Collection: {selectedReport.collection_date}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1C1917] mt-1.5">
                  WHO 6th Edition Reference Assessment
                </h2>
                {selectedReport.lab_name && (
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Laboratory: <span className="font-medium text-[#44403C]">{selectedReport.lab_name}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedReport.id)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl cursor-pointer transition-colors"
                >
                  Delete Report
                </button>
              </div>
            </div>

            {/* 90-Day Retest Banner */}
            {selectedReport.retest_due_date && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex items-start gap-3">
                <div className="text-lg">🗓️</div>
                <div>
                  <div className="text-xs font-bold text-[#92400E]">
                    Recommended Follow-Up Retest Date: {selectedReport.retest_due_date}
                  </div>
                  <div className="text-[11px] text-[#B45309] leading-relaxed mt-0.5">
                    Because spermatogenesis requires 72 to 90 days, clinical guidelines recommend waiting approximately 3 months before evaluating the impact of lifestyle modifications on a repeat semen sample.
                  </div>
                </div>
              </div>
            )}

            {/* Parameter Cards Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#57534E] uppercase tracking-wider">
                Parameter Breakdown &amp; Reference Limits
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {selectedReport.evaluation?.parameters?.map((p, idx) => {
                  const isBelow = p.status === 'below_who_limit';
                  const isAbove = p.status === 'at_or_above_who_limit';
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isBelow
                          ? 'bg-[#FEF2F2]/60 border-[#FCA5A5]'
                          : isAbove
                          ? 'bg-[#F0FDF4]/60 border-[#BBF7D0]'
                          : 'bg-[#FAFAF9] border-[#E7E5E4]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-[#1C1917]">{p.label}</div>
                          <div className="text-[11px] text-[#78716C] mt-0.5">
                            WHO limit: ≥ {p.who_lower_limit} {p.unit}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isBelow
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : isAbove
                            ? 'bg-[#DCFCE7] text-[#16A34A]'
                            : 'bg-[#F5F5F4] text-[#78716C]'
                        }`}>
                          {isBelow ? 'Below Limit' : isAbove ? 'At / Above Limit' : 'Not Tested'}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-bold font-mono text-[#1C1917]">
                          {p.value !== null ? p.value : '—'}
                        </span>
                        <span className="text-xs text-[#57534E]">{p.unit}</span>
                      </div>

                      <div className="text-[11px] text-[#57534E] mt-1 leading-snug">
                        {p.interpretation_text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Authored Clinical Caveats */}
            <div className="bg-[#FAF9F6] border border-[#EAE5DD] rounded-2xl p-5 space-y-3 text-xs text-[#57534E]">
              <div className="text-xs font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-2">
                <span>🛡️</span>
                <span>Important Clinical Caveats &amp; Guidelines</span>
              </div>
              <div className="space-y-2">
                {selectedReport.evaluation?.caveats?.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <span className="font-bold text-[#1E3A2B]">•</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#78716C] italic pt-1">
                Citation: {selectedReport.evaluation?.citation}
              </p>
            </div>

          </div>
        ) : !loading && (
          <div className="bg-white border border-[#EAE5DD] rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F4] text-[#78716C] flex items-center justify-center mx-auto text-xl">
              🔬
            </div>
            <h3 className="text-lg font-bold text-[#1C1917]">No Semen Reports Recorded Yet</h3>
            <p className="text-xs text-[#78716C] max-w-md mx-auto">
              If you have completed a clinical semen analysis, enter your laboratory results above to receive a deterministic WHO 6th edition comparison and 90-day tracking date.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-[#1E3A2B] hover:bg-[#14281D] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Enter First Semen Report
            </button>
          </div>
        )}

        {/* Historical List */}
        {reports.length > 1 && (
          <div className="bg-white border border-[#EAE5DD] rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
              Previous Semen Analyses ({reports.length})
            </h3>
            <div className="divide-y divide-[#F5F5F4] border border-[#EAE5DD] rounded-2xl overflow-hidden text-xs">
              {reports.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    selectedReport?.id === r.id ? 'bg-[#F0ECE4] font-semibold' : 'hover:bg-[#FAFAF9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs">{r.collection_date}</span>
                    {r.lab_name && <span className="text-[#78716C]">({r.lab_name})</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#57534E]">
                      {r.evaluation?.below_limit_count || 0} below WHO limits
                    </span>
                    <span className="text-xs text-[#1E3A2B]">View →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
