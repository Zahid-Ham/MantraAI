import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AssessmentNavigation({ 
  onBack, 
  onNext, 
  canGoBack, 
  canGoNext, 
  isLast,
  isOptional,
  autoAdvanceTypes = [],
  questionType
}) {
  const { language } = useLanguage();

  const content = {
    en: {
      back: "Back",
      continue: "Continue",
      complete: "Complete Assessment",
      skip: "Skip Question"
    },
    hi: {
      back: "पीछे जाएं",
      continue: "आगे बढ़ें",
      complete: "मूल्यांकन पूरा करें",
      skip: "प्रश्न छोड़ें"
    }
  }[language];

  const isAutoAdvancing = autoAdvanceTypes.includes(questionType);

  return (
    <div className="w-full max-w-2xl mx-auto flex justify-between items-center gap-4 mt-8 font-grotesk select-none">
      {/* Back button */}
      <div>
        {canGoBack && (
          <button
            onClick={onBack}
            className="px-6 py-3.5 border border-border-light dark:border-border-dark hover:border-marigold text-xs font-semibold uppercase tracking-wider transition-colors duration-300 rounded-sm cursor-pointer text-night-blue dark:text-cream focus:outline-none focus:ring-2 focus:ring-marigold"
          >
            {content.back}
          </button>
        )}
      </div>

      {/* Next/Skip/Complete button */}
      <div>
        {(!isAutoAdvancing || isLast || (!canGoNext && isOptional)) && (
          <button
            onClick={onNext}
            disabled={!canGoNext && !isOptional}
            className={`px-8 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-marigold ${
              canGoNext || isOptional
                ? "bg-marigold text-night-blue hover:bg-marigold-light cursor-pointer shadow-md shadow-marigold/5"
                : "bg-cream-dark dark:bg-night-blue/50 text-night-blue/30 dark:text-cream/20 border border-border-light dark:border-border-dark cursor-not-allowed"
            }`}
          >
            {isLast 
              ? content.complete 
              : (!canGoNext && isOptional) 
                ? content.skip 
                : content.continue
            }
          </button>
        )}
      </div>
    </div>
  );
}
