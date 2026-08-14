import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function WhyItMatters({ text }) {
  const { language } = useLanguage();

  const content = {
    en: { title: "Why This Matters" },
    hi: { title: "यह क्यों महत्वपूर्ण है" }
  }[language];

  if (!text) return null;

  const displayParagraph = text[language] || text.en || text;

  return (
    <div className="bg-cream-dark/30 dark:bg-night-blue/40 border border-marigold/20 p-5 rounded-sm my-6 select-none border-l-4 border-l-marigold">
      <h5 className="font-grotesk text-[10px] font-bold uppercase tracking-widest text-marigold mb-2">
        {content.title}
      </h5>
      <p className="font-grotesk text-xs leading-relaxed text-night-blue/70 dark:text-cream/70 font-light italic">
        "{displayParagraph}"
      </p>
    </div>
  );
}
