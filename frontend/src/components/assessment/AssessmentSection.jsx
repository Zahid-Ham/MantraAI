import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AssessmentSection({ blockData }) {
  const { language } = useLanguage();

  if (!blockData) return null;

  const name = blockData.name[language] || blockData.name.en;
  const description = blockData.description[language] || blockData.description.en;

  return (
    <div className="w-full mb-3 select-none font-sans text-left">
      <span className="text-[10.5px] font-bold tracking-[0.14em] text-[#D25619] uppercase block mb-0.5">
        ACTIVE SECTION {blockData.id}
      </span>
      <h2 className="text-2xl sm:text-[26px] font-serif font-normal text-[#1C1917] tracking-tight leading-snug mb-0.5">
        {name}
      </h2>
      <p className="text-[13px] text-[#78716C] leading-normal font-normal max-w-2xl">
        {description}
      </p>
    </div>
  );
}
