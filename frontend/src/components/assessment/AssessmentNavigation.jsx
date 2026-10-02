import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AssessmentNavigation({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  isLast,
  isOptional,
}) {
  const { language } = useLanguage();

  const content = {
    en: {
      back: 'Back',
      continue: 'Continue',
      complete: 'Complete Assessment',
      skip: 'Skip Question',
    },
    hi: {
      back: 'पीछे जाएं',
      continue: 'आगे बढ़ें',
      complete: 'मूल्यांकन पूरा करें',
      skip: 'प्रश्न छोड़ें',
    },
  }[language];

  return (
    <div className="w-full flex items-center justify-between gap-4 mt-3.5 select-none font-sans">
      {/* Left: Back button */}
      <div>
        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-white border border-[#EAE5DD] hover:bg-[#FAF8F5] text-[#1C1917] font-semibold text-[13.5px] rounded-xl shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{content.back}</span>
          </button>
        )}
      </div>

      {/* Right: Continue / Complete / Skip button */}
      <div>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext && !isOptional}
          className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-semibold text-[14px] shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] ${
            canGoNext || isOptional
              ? 'bg-[#D25619] hover:bg-[#B84510] text-white cursor-pointer hover:shadow'
              : 'bg-[#EAE5DD] text-[#A8A29E] cursor-not-allowed border border-[#EAE5DD]'
          }`}
        >
          <span>
            {isLast
              ? content.complete
              : !canGoNext && isOptional
              ? content.skip
              : content.continue}
          </span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
