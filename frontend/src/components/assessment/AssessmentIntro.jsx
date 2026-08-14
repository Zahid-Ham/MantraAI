import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function AssessmentIntro({ onStart }) {
  const { language } = useLanguage();

  const content = {
    en: {
      badge: "Shielded Environment",
      title: "Private health screening",
      desc: "A few questions about your health, lifestyle, and reproductive wellbeing. Your answers help us understand patterns that may be worth paying attention to.",
      disclaimer: "This assessment is for screening and educational guidance. It does not diagnose infertility or replace professional medical evaluation.",
      cta: "Begin assessment",
      disclaimerBadge: "Medical Disclaimer"
    },
    hi: {
      badge: "सुरक्षित वातावरण",
      title: "निजी स्वास्थ्य जांच",
      desc: "आपके स्वास्थ्य, जीवनशैली और प्रजनन कल्याण के बारे में कुछ प्रश्न। आपके उत्तर हमें उन पैटर्नों को समझने में मदद करते हैं जिन पर ध्यान देने की आवश्यकता हो सकती है।",
      disclaimer: "यह मूल्यांकन केवल स्क्रीनिंग और शैक्षिक मार्गदर्शन के लिए है। यह बांझपन (infertility) का निदान नहीं करता है या पेशेवर चिकित्सा मूल्यांकन को प्रतिस्थापित नहीं करता है।",
      cta: "मूल्यांकन शुरू करें",
      disclaimerBadge: "चिकित्सा अस्वीकरण"
    }
  }[language];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-xl mx-auto text-center py-16 px-6"
    >
      <span className="text-marigold font-grotesk text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
        {content.badge}
      </span>
      
      <h1 className="font-serif text-4xl md:text-6xl font-normal leading-tight text-night-blue dark:text-cream mb-6 tracking-tight">
        {content.title}
      </h1>

      <p className="font-grotesk text-night-blue/70 dark:text-cream/70 text-base md:text-lg font-light leading-relaxed mb-10">
        {content.desc}
      </p>

      {/* Warning/Disclaimer Card */}
      <div className="bg-cream-dark/50 dark:bg-night-blue/30 border border-border-light dark:border-border-dark p-6 mb-10 text-left font-grotesk text-xs text-night-blue/60 dark:text-cream/50 leading-relaxed rounded-sm">
        <span className="text-marigold uppercase tracking-wider font-semibold block mb-2">
          {content.disclaimerBadge}
        </span>
        {content.disclaimer}
      </div>

      <button 
        onClick={onStart}
        className="w-full sm:w-auto px-10 py-4 bg-marigold hover:bg-marigold-light text-night-blue font-grotesk font-semibold text-sm uppercase tracking-wider transition-colors duration-300 shadow-lg shadow-marigold/10 cursor-pointer"
      >
        {content.cta}
      </button>
    </motion.div>
  );
}
