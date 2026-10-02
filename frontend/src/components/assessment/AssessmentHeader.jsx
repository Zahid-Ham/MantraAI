import React from 'react';

export default function AssessmentHeader({ estTimeRemaining = 10 }) {
  return (
    <div className="w-full pb-2.5 mb-3.5 border-b border-[#EAE5DD] flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none font-sans">
      <div>
        <h1 className="font-serif text-2xl lg:text-[26px] font-normal text-[#1C1917] tracking-tight leading-tight">
          Private Assessment
        </h1>
        <p className="text-[13px] text-[#78716C] mt-0.5 font-normal">
          Take your time. Your responses are private.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-center">
        <div className="w-7 h-7 rounded-full bg-[#FEF0E6] text-[#D25619] border border-[#FAD8C3] flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-left">
          <span className="text-[10.5px] text-[#78716C] block leading-tight">
            Estimated time remaining
          </span>
          <span className="font-semibold text-[13px] text-[#1C1917] block leading-tight">
            ~ {estTimeRemaining} minutes
          </span>
        </div>
      </div>
    </div>
  );
}
