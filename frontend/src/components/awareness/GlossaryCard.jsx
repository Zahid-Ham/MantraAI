import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function GlossaryCard({ glossaryData }) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState(glossaryData[0]?.id || '');
  const prefersReducedMotion = useReducedMotion();

  if (!glossaryData || glossaryData.length === 0) return null;

  const currentItem = glossaryData.find(item => item.id === activeTab) || glossaryData[0];

  const content = {
    en: {
      definition: "What it means",
      whyMeasured: "Why it is measured",
      whatItDoesNotTell: "What it does NOT tell you"
    },
    hi: {
      definition: "इसका क्या मतलब है",
      whyMeasured: "यह क्यों मापा जाता है",
      whatItDoesNotTell: "यह क्या नहीं दर्शाता है"
    }
  }[language];

  return (
    <div className="w-full max-w-4xl mx-auto bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark p-6 rounded-sm shadow-sm flex flex-col md:flex-row gap-8">
      {/* Sidebar Tabs */}
      <div className="md:w-1/3 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark pb-6 md:pb-0 md:pr-6">
        {glossaryData.map(item => {
          const isActive = item.id === activeTab;
          const label = item.term[language] || item.term.en;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-300 border focus:outline-none rounded-sm cursor-pointer ${
                isActive
                  ? "bg-marigold text-night-blue border-marigold font-bold"
                  : "bg-cream-dark/20 dark:bg-night-dark/20 text-night-blue/80 dark:text-cream/80 border-border-light dark:border-border-dark hover:border-marigold"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Details Area */}
      <div className="md:w-2/3 min-h-[250px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Term Headline */}
            <h4 className="font-serif text-2xl font-normal text-marigold leading-none">
              {currentItem.term[language] || currentItem.term.en}
            </h4>

            {/* Definition */}
            <div>
              <span className="text-[10px] uppercase tracking-widest text-night-blue/40 dark:text-cream/40 font-bold block mb-1">
                {content.definition}
              </span>
              <p className="font-grotesk text-sm font-light text-night-blue/90 dark:text-cream/90 leading-relaxed">
                {currentItem.definition[language] || currentItem.definition.en}
              </p>
            </div>

            {/* Why Measured */}
            <div>
              <span className="text-[10px] uppercase tracking-widest text-night-blue/40 dark:text-cream/40 font-bold block mb-1">
                {content.whyMeasured}
              </span>
              <p className="font-grotesk text-xs leading-relaxed text-night-blue/70 dark:text-cream/70 font-light">
                {currentItem.whyMeasured[language] || currentItem.whyMeasured.en}
              </p>
            </div>

            {/* What it does not tell */}
            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xs border-l-2 border-l-red-500/40">
              <span className="text-[10px] uppercase tracking-widest text-red-500/80 font-bold block mb-1 select-none">
                {content.whatItDoesNotTell}
              </span>
              <p className="font-grotesk text-xs leading-relaxed text-night-blue/70 dark:text-cream/70 font-light">
                {currentItem.whatItDoesNotTell[language] || currentItem.whatItDoesNotTell.en}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
