import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AssessmentSection({ blockData }) {
  const { language } = useLanguage();

  if (!blockData) return null;

  const name = blockData.name[language] || blockData.name.en;
  const description = blockData.description[language] || blockData.description.en;

  const content = {
    en: {
      sectionLabel: "Active Section"
    },
    hi: {
      sectionLabel: "सक्रिय खंड"
    }
  }[language];

  return (
    <div className="w-full max-w-2xl mx-auto mb-3 text-center select-none">
      <span className="text-marigold font-grotesk text-[10px] font-semibold tracking-[0.25em] uppercase mb-1 block">
        {content.sectionLabel} {blockData.id}
      </span>
      <h2 className="font-serif text-2xl md:text-3xl font-normal leading-tight text-night-blue dark:text-cream tracking-tight mb-1">
        {name}
      </h2>
      <p className="font-grotesk text-[11px] md:text-xs text-night-blue/50 dark:text-cream/50 max-w-lg mx-auto font-light leading-relaxed">
        {description}
      </p>
    </div>
  );
}
