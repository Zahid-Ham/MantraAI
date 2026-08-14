import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import MicroscopicField from './MicroscopicField';
import MagneticButton from './MagneticButton';

export default function Hero() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const isDark = theme === 'dark';
  const [isTabActive, setIsTabActive] = useState(true);
  const [ctaHovered, setCtaHovered] = useState(false);
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;


  // Translations
  const content = {
    en: {
      initiative: 'An India-First Wellness Initiative',
      headline: <>Private, evidence-based <br />men's health for India.</>,
      desc: 'MantraAI provides anonymous, clinical-grade symptom evaluation, AI wellness support, and fertility risk screening designed specifically for the modern Indian man.',
      cta: 'Start Symptom Assessment',
      shielded: 'SHIELDED BY DESIGN / ANONYMOUS',
      platform: 'MANTRA CLINICAL PLATFORM v1.0.0',
      clinical: 'IN / CLINICAL',
      makeInIndia: 'MADE IN INDIA',
    },
    hi: {
      initiative: 'भारत-प्रथम स्वास्थ्य एवं कल्याण पहल',
      headline: <>भारत के लिए निजी, <br />साक्ष्य-आधारित पुरुष स्वास्थ्य।</>,
      desc: 'मंत्रएआई (MantraAI) विशेष रूप से आधुनिक भारतीय पुरुषों के लिए तैयार की गई अज्ञात, क्लीनिकल-श्रेणी लक्षण जांच, एआई स्वास्थ्य सहायता और प्रजनन क्षमता जोखिम स्क्रीनिंग प्रदान करता है।',
      cta: 'लक्षण मूल्यांकन शुरू करें',
      shielded: 'सुरक्षित डिजाइन / पूर्णतः अज्ञात',
      platform: 'मंत्र क्लीनिकल प्लेटफॉर्म v1.0.0',
      clinical: 'भारत / नैदानिक',
      makeInIndia: 'मेक इन इंडिया',
    },
  }[language];

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 55, damping: 14 } },
  };

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-[95vh] w-full flex flex-col justify-between bg-cream dark:bg-night-blue text-night-blue dark:text-cream overflow-hidden px-6 py-8 md:px-16 md:py-12 border-b border-border-light dark:border-border-dark transition-colors duration-500"
    >
      {/* ── Living Microscopic Backdrop ───────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        {/* Particle field — mouse-reactive */}
        {!prefersReducedMotion && isTabActive && (
          <MicroscopicField
            mouseReactive={!isMobile}
            density={isMobile ? 'low' : isDark ? 'high' : 'medium'}
            mode="drift"
            bioForms={!isMobile}
          />
        )}

        {/* Mandala-inspired concentric orbital rings */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="w-[700px] h-[700px] text-night-blue dark:text-marigold opacity-[0.028] dark:opacity-[0.04]"
              viewBox="0 0 700 700"
              fill="none"
            >
              {/* Concentric rings */}
              {[120, 180, 240, 310, 390].map((r, i) => (
                <circle
                  key={i}
                  cx="350"
                  cy="350"
                  r={r}
                  stroke="currentColor"
                  strokeWidth={i === 0 ? 1.5 : 0.75}
                  strokeDasharray={i % 2 === 0 ? '4 6' : '1 8'}
                />
              ))}
              {/* Geometric spokes — 8-fold symmetry (Ashoka-inspired) */}
              {Array.from({ length: 8 }, (_, i) => {
                const angle = (i * Math.PI * 2) / 8;
                const x1 = 350 + Math.cos(angle) * 110;
                const y1 = 350 + Math.sin(angle) * 110;
                const x2 = 350 + Math.cos(angle) * 370;
                const y2 = 350 + Math.sin(angle) * 370;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" />;
              })}
              {/* Outer arc segments */}
              {Array.from({ length: 16 }, (_, i) => {
                const a = (i * Math.PI * 2) / 16;
                const next = ((i + 0.6) * Math.PI * 2) / 16;
                const r = 390;
                const x1 = 350 + Math.cos(a) * r;
                const y1 = 350 + Math.sin(a) * r;
                const x2 = 350 + Math.cos(next) * r;
                const y2 = 350 + Math.sin(next) * r;
                return (
                  <path key={i} d={`M${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2}`}
                    stroke="currentColor" strokeWidth="1" fill="none" />
                );
              })}
            </svg>
          </div>
        )}

        {/* Microscopic lens glow behind headline */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer large glow — dark mode gets prominent warm amber */}
          <div
            className={`w-[600px] h-[600px] rounded-full blur-3xl animate-lens pointer-events-none ${
              isDark ? 'bg-marigold/10' : 'bg-marigold/4'
            }`}
            style={{ maxWidth: '90vw', maxHeight: '90vw' }}
          />
          {/* Inner concentrated core (dark mode only) */}
          {isDark && (
            <div
              className="absolute w-[240px] h-[240px] rounded-full blur-2xl bg-marigold/8 pointer-events-none"
            />
          )}
        </div>

        {/* Dark mode radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cream dark:from-night-blue via-transparent to-cream-dark/20 dark:to-night-dark/20" />
      </div>


      {/* ── Navigation Header ────────────────────── */}
      <header className="relative z-10 w-full flex justify-between items-center border-b border-border-light dark:border-border-dark pb-4">
        <div className="flex items-center gap-2.5">
          <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-1.5 py-0.5 font-medium tracking-widest rounded-sm">मंत्र</span>
          <span className="font-grotesk font-bold text-xl tracking-wider text-night-blue dark:text-cream">
            MANTRA<span className="text-marigold">.AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {/* Made in India badge */}
          <span className="text-[10px] border border-ashoka-green-light dark:border-ashoka-green text-ashoka-green dark:text-ashoka-green-light bg-ashoka-green/5 font-semibold px-2 py-0.5 font-grotesk tracking-widest uppercase rounded-sm">
            {content.makeInIndia}
          </span>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 text-[11px] border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 bg-cream-dark/40 dark:bg-night-blue/50 rounded-sm font-grotesk font-semibold tracking-wider cursor-pointer text-night-blue dark:text-cream"
            aria-label="Toggle language"
          >
            {language === 'en' ? 'हिन्दी' : 'EN'}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 bg-cream-dark/40 dark:bg-night-blue/50 rounded-sm cursor-pointer"
            aria-label="Toggle visual theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -10, opacity: 0, rotate: -45 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 10, opacity: 0, rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 text-marigold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-night-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </motion.div>
            </AnimatePresence>
          </button>

          <div className="text-xs uppercase tracking-widest text-night-blue/60 dark:text-cream/60 font-semibold font-grotesk hidden sm:block">
            {content.clinical}
          </div>
        </div>
      </header>

      {/* ── Hero Content ─────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto text-center my-auto flex flex-col items-center justify-center pt-16 pb-12"
      >
        <motion.span
          variants={itemVariants}
          className="text-marigold font-grotesk text-sm font-semibold tracking-[0.25em] uppercase mb-4"
        >
          {content.initiative}
        </motion.span>

        <motion.h1
          variants={itemVariants}
          className="font-serif text-5xl md:text-8xl font-normal leading-[0.95] tracking-tight text-night-blue dark:text-cream mb-8"
        >
          {content.headline}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="font-grotesk text-base md:text-lg text-night-blue/70 dark:text-cream/70 max-w-2xl mx-auto leading-relaxed mb-10 font-light"
        >
          {content.desc}
        </motion.p>

        {/* CTA — Magnetic + particle-aware */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <MagneticButton href="#assess" strength={6} id="hero-cta">
            <span
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
              className={`
                relative inline-flex items-center gap-3 px-8 py-4
                bg-marigold text-night-blue font-grotesk font-semibold text-sm uppercase tracking-wider
                transition-all duration-300 shadow-lg shadow-marigold/20
                hover:bg-marigold-light hover:shadow-marigold/40 hover:shadow-xl
                group
              `}
            >
              {/* Subtle sweep line on hover */}
              <span className="absolute bottom-0 left-0 h-[2px] bg-night-blue/20 transition-all duration-500 w-0 group-hover:w-full" />
              
              {/* Icon */}
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {content.cta}
            </span>
          </MagneticButton>

          {/* Secondary: Private by default badge */}
          <span className="font-grotesk text-[10px] tracking-[0.25em] uppercase text-night-blue/40 dark:text-cream/35 border border-border-light dark:border-border-dark px-4 py-2">
            PRIVATE BY DEFAULT
          </span>
        </motion.div>

        {/* Micro stats row */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-6 mt-10 opacity-60"
        >
          {['Anonymous Assessment', 'Evidence-Based', 'India-First Data'].map((tag, i) => (
            <span key={i} className="font-grotesk text-[10px] uppercase tracking-widest text-night-blue/50 dark:text-cream/40 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-marigold inline-block" />
              {tag}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Multilingual Marquee Ticker ─────────── */}
      <div className="relative z-10 w-full overflow-hidden border-t border-b border-border-light dark:border-border-dark py-3.5 mb-6">
        <div className="animate-marquee whitespace-nowrap text-xs font-grotesk tracking-widest text-night-blue/45 dark:text-cream/45 uppercase select-none">
          <span>Hindi · हिन्दी &nbsp;&nbsp;·&nbsp;&nbsp; Marathi · मराठी &nbsp;&nbsp;·&nbsp;&nbsp; Tamil · தமிழ் &nbsp;&nbsp;·&nbsp;&nbsp; Bengali · বাংলা &nbsp;&nbsp;·&nbsp;&nbsp; Kannada · ಕನ್ನಡ &nbsp;&nbsp;·&nbsp;&nbsp; Gujarati · ગુજરાતી &nbsp;&nbsp;·&nbsp;&nbsp; Telugu · తెలుగు &nbsp;&nbsp;·&nbsp;&nbsp; Punjabi · ਪੰਜਾਬੀ &nbsp;&nbsp;·&nbsp;&nbsp; </span>
          <span>Hindi · हिन्दी &nbsp;&nbsp;·&nbsp;&nbsp; Marathi · मराठी &nbsp;&nbsp;·&nbsp;&nbsp; Tamil · தமிழ் &nbsp;&nbsp;·&nbsp;&nbsp; Bengali · বাংলা &nbsp;&nbsp;·&nbsp;&nbsp; Kannada · ಕನ್ನಡ &nbsp;&nbsp;·&nbsp;&nbsp; Gujarati · ગુજરાતી &nbsp;&nbsp;·&nbsp;&nbsp; Telugu · తెలుగు &nbsp;&nbsp;·&nbsp;&nbsp; Punjabi · ਪੰਜਾਬੀ &nbsp;&nbsp;·&nbsp;&nbsp; </span>
        </div>
      </div>

      {/* ── Bottom Editorial Details ─────────────── */}
      <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-end border-t border-border-light dark:border-border-dark pt-6 gap-4 text-xs font-grotesk tracking-widest text-night-blue/40 dark:text-cream/40 uppercase">
        <div>{content.shielded}</div>
        <div>{content.platform}</div>
      </div>
    </section>
  );
}
