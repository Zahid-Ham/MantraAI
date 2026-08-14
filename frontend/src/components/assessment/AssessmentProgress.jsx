import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AssessmentProgress({ currentBlock, totalBlocks = 13 }) {
  const { language } = useLanguage();
  const percentage = Math.round(((currentBlock - 1) / totalBlocks) * 100);

  const content = {
    en: {
      block: "Block",
      of: "of",
      complete: "Complete"
    },
    hi: {
      block: "खंड",
      of: "का",
      complete: "पूरा"
    }
  }[language];

  return (
    <div className="w-full max-w-2xl mx-auto mb-3 px-4 select-none">
      {/* Percentage details */}
      <div className="flex justify-between items-baseline mb-2 font-grotesk text-xs uppercase tracking-wider text-night-blue/50 dark:text-cream/50">
        <span>
          {content.block} {currentBlock} {content.of} {totalBlocks}
        </span>
        <span className="font-semibold text-marigold">
          {percentage}% {content.complete}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-[4px] bg-cream-dark dark:bg-night-blue/50 rounded-full overflow-hidden border border-border-light dark:border-border-dark mb-2">
        <div 
          className="absolute top-0 left-0 h-full bg-marigold transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Block indicators grid for desktop (Visual index signal) */}
      <div className="hidden sm:flex justify-between items-center gap-1.5">
        {Array.from({ length: totalBlocks }).map((_, idx) => {
          const blockNumber = idx + 1;
          const isVisited = blockNumber < currentBlock;
          const isActive = blockNumber === currentBlock;
          
          return (
            <div 
              key={blockNumber}
              className={`flex-1 h-[2px] transition-colors duration-300 ${
                isActive 
                  ? "bg-marigold" 
                  : isVisited 
                    ? "bg-ashoka-green-light dark:bg-ashoka-green" 
                    : "bg-cream-dark dark:bg-night-blue/40"
              }`}
              title={`${content.block} ${blockNumber}`}
            />
          );
        })}
      </div>
    </div>
  );
}
