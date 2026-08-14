import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function LearningModule({ moduleData }) {
  const { language } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  if (!moduleData) return null;

  const steps = moduleData.steps;
  const currentStep = steps[activeStep];
  const stepLabel = currentStep.label[language] || currentStep.label.en;
  const stepDesc = currentStep.desc[language] || currentStep.desc.en;

  const content = {
    en: {
      next: "Next Step",
      restart: "Restart Journey",
      step: "Step"
    },
    hi: {
      next: "अगला चरण",
      restart: "फिर से शुरू करें",
      step: "चरण"
    }
  }[language];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      setActiveStep(0);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark p-6 md:p-8 rounded-sm shadow-sm">
      {/* Module Title */}
      <h3 className="font-serif text-2xl font-normal text-night-blue dark:text-cream mb-6 border-b border-border-light dark:border-border-dark pb-4 select-none">
        {moduleData.title[language] || moduleData.title.en}
      </h3>

      {/* Progress indicators */}
      <div className="flex gap-2 mb-8 select-none">
        {steps.map((_, i) => (
          <div
            key={i}
            onClick={() => setActiveStep(i)}
            className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
              i === activeStep
                ? "bg-marigold shadow-[0_0_8px_rgba(217,119,6,0.3)]"
                : i < activeStep
                  ? "bg-ashoka-green/60"
                  : "bg-night-blue/10 dark:bg-cream/10"
            }`}
          />
        ))}
      </div>

      {/* Animated Step Container */}
      <div className="min-h-[140px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <span className="font-grotesk text-[10px] uppercase tracking-widest text-marigold font-semibold block mb-2">
              {content.step} {activeStep + 1} / {steps.length}
            </span>
            <h4 className="font-serif text-xl font-normal text-night-blue dark:text-cream mb-3 leading-snug">
              {stepLabel}
            </h4>
            <p className="font-grotesk text-sm font-light leading-relaxed text-night-blue/80 dark:text-cream/70">
              {stepDesc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Action */}
        <div className="flex justify-end mt-8 border-t border-border-light dark:border-border-dark pt-4">
          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-marigold hover:bg-marigold-light text-night-blue text-xs font-semibold uppercase tracking-wider transition-colors duration-300 rounded-sm cursor-pointer shadow-md shadow-marigold/5"
          >
            {activeStep === steps.length - 1 ? content.restart : content.next}
          </button>
        </div>
      </div>
    </div>
  );
}
