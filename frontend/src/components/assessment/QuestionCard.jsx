import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import QuestionOptions from './QuestionOptions';

export default function QuestionCard({
  questionData,
  currentAnswer,
  onAnswerChange,
  onAutoAdvance,
  questionIndexInBlock = 1,
  totalQuestionsInBlock = 7,
}) {
  const { language } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [whyOpen, setWhyOpen] = useState(false);

  if (!questionData) return null;

  const questionText = questionData.question[language] || questionData.question.en;
  const whyWeAskText = questionData.whyWeAsk
    ? (questionData.whyWeAsk[language] || questionData.whyWeAsk.en)
    : null;
  const evidenceNoteText = questionData.evidenceNote
    ? (questionData.evidenceNote[language] || questionData.evidenceNote.en)
    : null;

  // Question contextual subtext/hint
  const questionHint = questionData.id === 'age_years'
    ? (language === 'en' ? 'Please enter your current age.' : 'कृपया अपनी वर्तमान आयु दर्ज करें।')
    : null;

  return (
    <motion.div
      key={questionData.id}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full bg-white border border-[#EAE5DD] rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xs font-sans text-left"
    >
      {/* Top Question Index Badge */}
      <div className="flex items-center justify-between gap-3 mb-1.5 select-none">
        <span className="text-[11px] font-bold tracking-[0.14em] text-[#78716C] uppercase">
          QUESTION {questionIndexInBlock} OF {totalQuestionsInBlock}
        </span>

        {questionData.sensitivity && (
          <span className="text-[10.5px] font-semibold tracking-wider text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md uppercase">
            {language === 'en' ? 'Private question' : 'व्यक्तिगत प्रश्न'}
          </span>
        )}
      </div>

      {/* Main Question Title */}
      <h3 className="font-serif text-xl sm:text-[22px] font-normal text-[#1C1917] leading-snug tracking-tight mb-1">
        {questionText}
      </h3>

      {/* Optional Context Subtext / Hint */}
      {questionHint && (
        <p className="text-[13px] text-[#78716C] mb-3 font-normal">
          {questionHint}
        </p>
      )}

      {/* Input Controls */}
      <div className="mt-2.5 mb-3">
        <QuestionOptions
          questionData={questionData}
          currentAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
          onAutoAdvance={onAutoAdvance}
        />
      </div>

      {/* Expandable "Why are we asking?" Section */}
      {whyWeAskText && (
        <div className="border-t border-[#F5F2EB] pt-2.5 mt-3">
          <button
            type="button"
            onClick={() => setWhyOpen(!whyOpen)}
            className="flex items-center justify-between w-full text-[12.5px] font-medium text-[#57534E] hover:text-[#D25619] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D25619] rounded cursor-pointer select-none"
            aria-expanded={whyOpen}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#78716C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{language === 'en' ? 'Why are we asking?' : 'हम यह क्यों पूछ रहे हैं?'}</span>
            </div>

            <svg
              className={`w-3.5 h-3.5 text-[#78716C] transition-transform duration-200 ${whyOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {whyOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-[#FAF8F5] border border-[#EAE5DD] rounded-xl p-3 mt-2 text-[12.5px] text-[#57534E] leading-relaxed space-y-1.5">
                  <p>{whyWeAskText}</p>
                  {evidenceNoteText && (
                    <div className="pt-1.5 border-t border-[#EAE5DD] text-[11.5px] text-[#78716C]">
                      <span className="font-semibold text-[#1C1917]">
                        {language === 'en' ? 'Clinical note: ' : 'चिकित्सीय संदर्भ: '}
                      </span>
                      {evidenceNoteText}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
