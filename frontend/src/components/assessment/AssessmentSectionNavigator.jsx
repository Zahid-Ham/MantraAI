import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AssessmentSectionNavigator({
  blocks = [],
  questions = [],
  activeBlockId = 1,
  maxReachedBlockId = 1,
  onSelectBlock,
}) {
  const { language } = useLanguage();

  const getQuestionCountForBlock = (blockId) => {
    return questions.filter((q) => q.block === blockId).length;
  };

  return (
    <nav aria-label="Assessment sections" className="w-full max-w-[260px] font-sans select-none">
      <div className="relative space-y-1">
        
        {/* Continuous vertical connecting line */}
        <div
          className="absolute left-[11px] top-3 bottom-3 w-[1.5px] bg-[#EAE5DD] z-0 pointer-events-none"
          aria-hidden="true"
        />

        {blocks.map((block) => {
          const isActive = block.id === activeBlockId;
          const isCompleted = block.id < activeBlockId;
          const isAccessible = block.id <= maxReachedBlockId;
          const questionCount = getQuestionCountForBlock(block.id);
          const blockTitle = block.name[language] || block.name.en;
          const formattedNumber = String(block.id).padStart(2, '0');

          return (
            <button
              key={block.id}
              type="button"
              disabled={!isAccessible}
              onClick={() => isAccessible && onSelectBlock && onSelectBlock(block.id)}
              title={
                !isAccessible
                  ? (language === 'en' ? 'Complete previous sections to access' : 'पहुंचने के लिए पिछले अनुभाग पूरे करें')
                  : (language === 'en' ? `Jump to ${blockTitle}` : `${blockTitle} पर जाएं`)
              }
              className={`w-full text-left relative z-10 flex items-center gap-2.5 transition-all duration-150 rounded-lg p-0.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] ${
                isAccessible ? 'cursor-pointer hover:bg-[#FEF0E6]/30' : 'cursor-not-allowed opacity-75'
              }`}
            >
              {/* Circular Number Indicator */}
              <div
                className={`w-[23px] h-[23px] rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 transition-all duration-150 ${
                  isActive
                    ? 'bg-[#D25619] text-white shadow-xs'
                    : isCompleted
                    ? 'bg-[#FFF2EB] text-[#D25619] border border-[#FAD8C3] group-hover:border-[#D25619]'
                    : isAccessible
                    ? 'bg-white border border-[#D25619]/40 text-[#D25619] group-hover:bg-[#FFF2EB]'
                    : 'bg-white border border-[#EAE5DD] text-[#78716C]'
                }`}
              >
                {formattedNumber}
              </div>

              {/* Title & Question Count Content */}
              <div
                className={`flex-1 min-w-0 transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FEF0E6] px-2.5 py-1 rounded-lg border border-[#FAD8C3]'
                    : isAccessible
                    ? 'px-1 py-0.5 group-hover:translate-x-0.5'
                    : 'px-1 py-0.5'
                }`}
              >
                <div
                  className={`text-[12.5px] truncate font-medium leading-tight ${
                    isActive
                      ? 'font-semibold text-[#D25619]'
                      : isAccessible
                      ? 'text-[#1C1917] group-hover:text-[#D25619]'
                      : 'text-[#78716C]'
                  }`}
                >
                  {blockTitle}
                </div>
                <div
                  className={`text-[10.5px] leading-tight ${
                    isActive
                      ? 'text-[#D25619]/80 font-medium'
                      : isAccessible
                      ? 'text-[#78716C] group-hover:text-[#D25619]/70'
                      : 'text-[#A8A29E]'
                  }`}
                >
                  {questionCount} questions
                </div>
              </div>
            </button>
          );
        })}

      </div>
    </nav>
  );
}
