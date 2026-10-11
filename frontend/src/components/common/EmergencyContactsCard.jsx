import React from 'react';
import {
  VERIFIED_EMERGENCY_CONTACTS,
  INTERNATIONAL_CRISIS_CONTACTS,
  EMERGENCY_SERVICES_DISCLAIMER,
} from '../../data/emergencyContacts';

export default function EmergencyContactsCard({
  variant = 'compact', // 'compact' | 'full' | 'inline'
  showInternational = false,
  className = '',
}) {
  const medicalContacts = VERIFIED_EMERGENCY_CONTACTS.filter(
    (c) => c.category === 'immediate_medical'
  );
  const crisisContacts = VERIFIED_EMERGENCY_CONTACTS.filter(
    (c) => c.category === 'mental_health_crisis'
  );

  if (variant === 'inline') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#991B1B]">
          {VERIFIED_EMERGENCY_CONTACTS.map((c) => (
            <a
              key={c.id}
              href={c.telUri}
              className="px-2.5 py-1 bg-white border border-[#FCA5A5] hover:border-[#DC2626] rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span className="font-bold">{c.shortName}:</span>
              <span>{c.number}</span>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-[#991B1B]/80 italic">
          {EMERGENCY_SERVICES_DISCLAIMER}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-4 md:p-5 shadow-xs space-y-3.5 text-xs ${className}`}>
      <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
        <svg className="w-4 h-4 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Emergency & Crisis Helplines (India)</span>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
          Immediate Medical Response
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {medicalContacts.map((c) => (
            <a
              key={c.id}
              href={c.telUri}
              className="p-2.5 bg-white border border-[#FECACA] hover:border-[#DC2626] hover:bg-[#FEF2F2] rounded-xl transition-all flex flex-col justify-between group"
            >
              <span className="font-bold text-[#991B1B] text-xs">{c.name}</span>
              <span className="text-sm font-extrabold text-[#DC2626] group-hover:underline mt-0.5">{c.number}</span>
              <span className="text-[10px] text-[#78716C] mt-1">{c.cost} • {c.hours}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-1 border-t border-[#E8E5DF]">
        <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
          Mental Health & Crisis Counseling
        </div>
        <div className="space-y-1.5">
          {crisisContacts.map((c) => (
            <a
              key={c.id}
              href={c.telUri}
              className="p-2 bg-white border border-[#E8E5DF] hover:border-[#3B82F6] hover:bg-[#F8FAFC] rounded-xl transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-[#1C1917] text-xs">{c.name}</div>
                <div className="text-[10px] text-[#78716C]">{c.authority}</div>
              </div>
              <span className="font-extrabold text-[#2563EB] text-xs group-hover:underline">{c.number}</span>
            </a>
          ))}
        </div>
      </div>

      {showInternational && (
        <div className="space-y-1.5 pt-1 border-t border-[#E8E5DF]">
          <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
            International Support
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px]">
            {INTERNATIONAL_CRISIS_CONTACTS.map((c) => (
              <div key={c.id} className="text-[#57534E] flex justify-between">
                <span>{c.name} ({c.region}):</span>
                <span className="font-semibold text-[#1C1917]">{c.number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[10px] text-[#92400E] leading-relaxed">
        {EMERGENCY_SERVICES_DISCLAIMER}
      </div>
    </div>
  );
}
