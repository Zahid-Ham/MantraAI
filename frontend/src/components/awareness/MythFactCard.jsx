import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function MythFactCard({ mythItem }) {
  const { language } = useLanguage();
  const [flipped, setFlipped] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const content = {
    en: {
      mythTitle: "Myth",
      factTitle: "Fact / Science",
      clickReveal: "Click to reveal the fact",
      clickBack: "Click to flip back"
    },
    hi: {
      mythTitle: "भ्रम",
      factTitle: "तथ्य / विज्ञान",
      clickReveal: "सच्चाई जानने के लिए क्लिक करें",
      clickBack: "वापस पलटने के लिए क्लिक करें"
    }
  }[language];

  const mythText = mythItem.myth[language] || mythItem.myth.en;
  const factText = mythItem.fact[language] || mythItem.fact.en;

  const cardVariants = {
    front: { rotateY: 0 },
    back: { rotateY: 180 }
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  // For accessibility, support KeyPress triggers
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    }
  };

  if (prefersReducedMotion) {
    return (
      <div 
        className="w-full bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark p-6 rounded-sm space-y-4"
      >
        <div>
          <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold block mb-1">
            {content.mythTitle}
          </span>
          <p className="font-serif text-lg text-night-blue dark:text-cream leading-snug">
            "{mythText}"
          </p>
        </div>
        <div className="border-t border-border-light dark:border-border-dark pt-4">
          <span className="text-[10px] uppercase tracking-widest text-ashoka-green dark:text-ashoka-green-light font-bold block mb-1">
            {content.factTitle}
          </span>
          <p className="font-grotesk text-sm text-night-blue/80 dark:text-cream/85 leading-relaxed">
            {factText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="perspective-1000 w-full min-h-[220px] cursor-pointer focus:outline-none"
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Myth Card: ${mythText}`}
    >
      <motion.div
        className="relative w-full h-full transform-style-3d duration-600 flex min-h-[220px]"
        animate={flipped ? "back" : "front"}
        variants={cardVariants}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front Face: Myth */}
        <div className="absolute inset-0 backface-hidden bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark p-6 flex flex-col justify-between rounded-sm shadow-sm hover:border-marigold/40 transition-colors">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-red-500 font-semibold mb-3 block">
              {content.mythTitle}
            </span>
            <h4 className="font-serif text-xl font-normal leading-snug text-night-blue dark:text-cream">
              "{mythText}"
            </h4>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-marigold/60 font-semibold block text-right mt-4">
            {content.clickReveal} →
          </span>
        </div>

        {/* Back Face: Fact */}
        <div className="absolute inset-0 backface-hidden bg-cream-dark/20 dark:bg-night-dark/30 border border-marigold/30 p-6 flex flex-col justify-between rounded-sm shadow-inner rotate-y-180">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-ashoka-green dark:text-ashoka-green-light font-semibold mb-3 block">
              {content.factTitle}
            </span>
            <p className="font-grotesk text-sm font-light leading-relaxed text-night-blue/90 dark:text-cream/90">
              {factText}
            </p>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-night-blue/30 dark:text-cream/30 font-semibold block text-right mt-4">
            ← {content.clickBack}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
