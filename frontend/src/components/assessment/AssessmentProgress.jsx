import React from 'react';

export default function AssessmentProgress({
  currentBlock = 1,
  totalBlocks = 13,
  currentQuestionIndex = 0,
  totalQuestions = 75,
}) {
  const percentage = Math.max(1, Math.min(100, Math.round((currentQuestionIndex / totalQuestions) * 100)));

  return (
    <div className="w-full mb-2.5 select-none font-sans">
      <div className="flex justify-between items-center mb-1 text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
        <span>
          BLOCK {currentBlock} OF {totalBlocks}
        </span>
        <span>
          {percentage}% COMPLETE
        </span>
      </div>

      {/* Progress Track & Fill */}
      <div className="w-full h-1.5 bg-[#EAE5DD] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#D25619] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
