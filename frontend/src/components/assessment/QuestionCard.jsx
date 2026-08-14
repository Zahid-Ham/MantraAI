import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import QuestionOptions from './QuestionOptions';

export default function QuestionCard({ 
  questionData, 
  currentAnswer, 
  onAnswerChange, 
  index, 
  totalQuestions, 
  onWhyAskClick 
}) {
  const { language } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  if (!questionData) return null;

  const questionText = questionData.question[language] || questionData.question.en;

  const content = {
    en: {
      questionLabel: "Question",
      of: "of",
      whyBtn: "Why are we asking?"
    },
    hi: {
      questionLabel: "प्रश्न",
      of: "का",
      whyBtn: "हम यह क्यों पूछ रहे हैं?"
    }
  }[language];

  const yOffset = prefersReducedMotion ? 0 : 15;

  return (
    <motion.div
      key={questionData.id}
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -yOffset }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark p-5 md:p-7 shadow-sm transition-colors duration-500 rounded-sm"
    >
      {/* Question Index Label */}
      <div className="flex justify-between items-center mb-4 font-grotesk text-xs uppercase tracking-wider text-night-blue/40 dark:text-cream/40 select-none">
        <span>
          {content.questionLabel} {index} {content.of} {totalQuestions}
        </span>
        {questionData.sensitivity ? (
          <span className="text-[10px] text-ashoka-green dark:text-ashoka-green-light font-semibold tracking-wider bg-ashoka-green/5 border border-ashoka-green/10 px-2 py-0.5 rounded-sm">
            {language === 'en' ? "Private response" : "व्यक्तिगत प्रतिक्रिया"}
          </span>
        ) : questionData.required ? (
          <span className="text-marigold font-medium">*</span>
        ) : null}
      </div>

      {/* Main Question Text */}
      <h3 className="font-serif text-xl md:text-2xl font-normal leading-snug text-night-blue dark:text-cream mb-5 tracking-tight">
        {questionText}
      </h3>

      {/* Answer Input Controls */}
      <div className="mb-4">
        <QuestionOptions 
          questionData={questionData} 
          currentAnswer={currentAnswer} 
          onAnswerChange={onAnswerChange} 
        />
      </div>

      {/* Secondary Action: Why we ask */}
      <div className="flex justify-between items-center border-t border-border-light dark:border-border-dark pt-3.5 select-none">
        <button
          onClick={onWhyAskClick}
          className="flex items-center gap-1.5 font-grotesk text-xs font-medium text-night-blue/50 dark:text-cream/50 hover:text-marigold dark:hover:text-marigold transition-colors duration-300 cursor-pointer"
        >
          <span>ⓘ</span> {content.whyBtn}
        </button>
      </div>
    </motion.div>
  );
}
