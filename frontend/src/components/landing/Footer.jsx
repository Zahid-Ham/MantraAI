import React, { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';

// Tiny animated biological particle near the logo
function LogoParticle() {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  return (
    <svg
      className="inline-block ml-2 align-middle"
      width="24" height="12" viewBox="0 0 24 12"
      fill="none"
      aria-hidden="true"
    >
      {/* Head */}
      <motion.ellipse
        cx="4" cy="6" rx="3" ry="2.2"
        fill="#d97706"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Tail — simple sinusoidal path */}
      <motion.path
        d="M 7 6 C 10 4, 13 8, 16 6 C 18 4.5, 20 7, 23 5.5"
        stroke="#d97706"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
    </svg>
  );
}

export default function Footer() {
  const { language } = useLanguage();

  const content = {
    en: {
      desc: 'Clinical-grade digital wellness and risk screening, built for the lifestyle profiles of modern Indian men.',
      col1: 'Platform',
      col1_l1: 'Symptom Risk Assessment',
      col1_l2: 'Knowledge Hub',
      col1_l3: 'Semen analysis glossary',
      col2: 'Protocol',
      col2_l1: 'Zero-PII Policy',
      col2_l2: 'Clinical Standards',
      col2_l3: 'Medical Disclaimer',
      disclaimer: 'Disclaimer: MantraAI is a digital pre-clinical wellness, risk assessment, and education platform. It does not replace professional medical advice, diagnosis, or treatment. Always consult a registered medical practitioner (RMP) in India for clinical concerns.',
      rights: 'All rights reserved.',
    },
    hi: {
      desc: 'क्लीनिकल-ग्रेड डिजिटल स्वास्थ्य और जोखिम जांच प्रणाली, आधुनिक भारतीय पुरुषों की जीवनशैली और स्वास्थ्य मापदंडों के लिए निर्मित।',
      col1: 'प्लेटफॉर्म',
      col1_l1: 'लक्षण जोखिम मूल्यांकन',
      col1_l2: 'ज्ञान केंद्र (Knowledge Hub)',
      col1_l3: 'वीर्य विश्लेषण शब्दावली',
      col2: 'प्रोटोकॉल',
      col2_l1: 'शून्य-PII नीति',
      col2_l2: 'क्लीनिकल मानक',
      col2_l3: 'चिकित्सा अस्वीकरण',
      disclaimer: 'अस्वीकरण: मंत्रएआई (MantraAI) एक डिजिटल प्री-क्लीनिकल स्वास्थ्य, जोखिम मूल्यांकन और शिक्षा मंच है। यह पेशेवर चिकित्सा सलाह, निदान या उपचार का स्थान नहीं लेता है।',
      rights: 'सर्वाधिकार सुरक्षित।',
    },
  }[language];

  return (
    <footer
      id="footer"
      className="bg-cream-dark dark:bg-night-dark text-night-blue/60 dark:text-cream/50 py-16 px-6 md:px-16 border-t border-border-light dark:border-border-dark relative z-10 font-grotesk text-xs transition-colors duration-500 overflow-hidden"
    >
      {/* Subtle bottom biological particle layer */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 w-1 h-1 rounded-full bg-marigold animate-drift"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${5 + i}s`,
              opacity: 0.3 + (i % 3) * 0.15,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-12">

        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-12 border-b border-border-light dark:border-border-dark">
          <div>
            {/* Logo with tiny biological particle */}
            <div className="flex items-center font-bold text-base text-night-blue dark:text-cream tracking-wider mb-3">
              MANTRA<span className="text-marigold">.AI</span>
              <LogoParticle />
            </div>

            {/* Tagline */}
            <p className="max-w-xs leading-relaxed text-night-blue/70 dark:text-cream/40 font-light mb-3">
              {content.desc}
            </p>

            {/* Microcopy tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['PRIVATE BY DEFAULT', 'INDIA-FIRST', 'EVIDENCE-BASED'].map((tag) => (
                <span
                  key={tag}
                  className="text-[8px] font-grotesk tracking-[0.2em] uppercase text-marigold/60 border border-marigold/15 px-2 py-0.5 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div className="flex gap-16">
            <div>
              <h4 className="text-night-blue dark:text-cream uppercase tracking-widest font-semibold mb-4">{content.col1}</h4>
              <ul className="space-y-2 font-light text-night-blue/80 dark:text-cream/80">
                <li><a href="#assess" className="hover:text-marigold transition-colors">{content.col1_l1}</a></li>
                <li><a href="#awareness" className="hover:text-marigold transition-colors">{content.col1_l2}</a></li>
                <li><a href="#awareness/semen-analysis-intro" className="hover:text-marigold transition-colors">{content.col1_l3}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-night-blue dark:text-cream uppercase tracking-widest font-semibold mb-4">{content.col2}</h4>
              <ul className="space-y-2 font-light text-night-blue/80 dark:text-cream/80">
                <li><a href="#privacy" className="hover:text-marigold transition-colors">{content.col2_l1}</a></li>
                <li><a href="#evidence" className="hover:text-marigold transition-colors">{content.col2_l2}</a></li>
                <li><a href="#terms" className="hover:text-marigold transition-colors">{content.col2_l3}</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footnote & disclaimer */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-[10px] tracking-wider text-night-blue/50 dark:text-cream/30 uppercase">
          <div className="max-w-xl leading-relaxed">
            {content.disclaimer}
          </div>
          <div className="text-right shrink-0">
            <div className="text-night-blue/40 dark:text-cream/25 mb-1">SHIELDED BY DESIGN / SECURE</div>
            <div>© {new Date().getFullYear()} MantraAI. {content.rights}</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
