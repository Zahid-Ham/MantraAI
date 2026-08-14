import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { categories } from '../data/awareness/categories';
import { topics } from '../data/awareness/topics';
import { myths } from '../data/awareness/myths';
import { glossary } from '../data/awareness/glossary';
import { learningModules } from '../data/awareness/learningModules';

import WhyItMatters from '../components/awareness/WhyItMatters';
import MythFactCard from '../components/awareness/MythFactCard';
import LearningModule from '../components/awareness/LearningModule';
import GlossaryCard from '../components/awareness/GlossaryCard';
import MicroscopicField from '../components/landing/MicroscopicField';

// Interactive concept visualizer component (Illustrative only)
function ConceptVisualizer({ type }) {
  const [density, setDensity] = useState('normal'); // 'low' | 'normal'
  const containerRef = useRef(null);

  // Generate dots representing sperm concentration
  const dotsCount = density === 'normal' ? 32 : 12;

  return (
    <div className="border border-border-light dark:border-border-dark p-6 rounded-sm bg-cream-dark/20 dark:bg-night-blue/30 select-none">
      <span className="text-[9px] uppercase tracking-widest text-night-blue/40 dark:text-cream/40 font-bold block mb-2">
        Illustrative Concept Visualizer
      </span>
      <h4 className="font-serif text-lg font-normal text-night-blue dark:text-cream mb-4">
        {type === 'sperm-concentration' ? 'Visualizing Concentration Density' : 'Visualizing Sperm Quality Concept'}
      </h4>

      {/* Grid preview box */}
      <div 
        ref={containerRef}
        className="w-full h-36 bg-cream dark:bg-night-dark border border-border-light dark:border-border-dark rounded-sm relative overflow-hidden flex items-center justify-center mb-4"
      >
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 p-4 gap-2 opacity-85">
          {[...Array(dotsCount)].map((_, i) => (
            <motion.div
              key={i}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.7 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              className="w-2.5 h-2.5 rounded-full bg-marigold shadow-[0_0_8px_rgba(217,119,6,0.5)] mx-auto my-auto"
            />
          ))}
        </div>
        <span className="absolute bottom-2 right-2 text-[8px] uppercase tracking-widest text-night-blue/30 dark:text-cream/35">
          {density === 'normal' ? 'Normal Baseline' : 'Low Concentration'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setDensity('low')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border rounded-sm transition-all cursor-pointer ${
            density === 'low'
              ? 'bg-marigold border-marigold text-night-blue'
              : 'border-border-light dark:border-border-dark text-night-blue/70 dark:text-cream/70 hover:border-marigold'
          }`}
        >
          Low Density
        </button>
        <button
          onClick={() => setDensity('normal')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border rounded-sm transition-all cursor-pointer ${
            density === 'normal'
              ? 'bg-marigold border-marigold text-night-blue'
              : 'border-border-light dark:border-border-dark text-night-blue/70 dark:text-cream/70 hover:border-marigold'
          }`}
        >
          Normal Baseline
        </button>
      </div>
    </div>
  );
}

// Interactive factor selector component
function FactorSelector({ language }) {
  const [activeFactor, setActiveFactor] = useState('sleep');

  const factors = {
    sleep: {
      label: { en: "Sleep & Circadian Rhythm", hi: "नींद व सर्कडियन रिदम" },
      desc: {
        en: "Sleep is associated with testosterone production; irregular circadian cycles may temporarily influence semen and hormone levels.",
        hi: "नींद टेस्टोस्टेरोन उत्पादन से जुड़ी है; अनियमित नींद चक्र वीर्य और हार्मोन के स्तर को प्रभावित कर सकते हैं।"
      }
    },
    smoking: {
      label: { en: "Toxins & Smoking", hi: "विषाक्त पदार्थ और धूम्रपान" },
      desc: {
        en: "Tobacco use has been associated with increased oxidative stress, which may influence genetic integrity (DNA fragmentation).",
        hi: "तंबाकू का सेवन ऑक्सीडेटिव तनाव से जुड़ा है, जो आनुवंशिक अखंडता (DNA Fragmentation) को प्रभावित कर सकता है।"
      }
    },
    heat: {
      label: { en: "Scrotal Heat Exposure", hi: "अंडकोश का बढ़ता तापमान" },
      desc: {
        en: "Keeping laptops directly on the lap or hot sauna baths can elevate scrotal temperature, temporarily slowing down sperm production.",
        hi: "लैपटॉप को गोद में रखना या गर्म सौना स्नान अंडकोश का तापमान बढ़ा सकते हैं, जिससे शुक्राणु उत्पादन अस्थायी रूप से धीमा हो जाता है।"
      }
    },
    alcohol: {
      label: { en: "Alcohol Intake", hi: "शराब का सेवन" },
      desc: {
        en: "High alcohol consumption has been associated with lowered testosterone synthesis, while moderate levels show low correlation.",
        hi: "शराब के अधिक सेवन का संबंध कम टेस्टोस्टेरोन स्तर से देखा गया है, जबकि मध्यम सेवन का प्रभाव नगण्य है।"
      }
    }
  };

  return (
    <div className="border border-border-light dark:border-border-dark p-6 rounded-sm bg-cream dark:bg-night-blue select-none space-y-4">
      <span className="text-[9px] uppercase tracking-widest text-marigold font-bold block">
        Interact: What Can Influence Sperm Parameters?
      </span>
      
      {/* Clickable tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(factors).map(key => {
          const isActive = key === activeFactor;
          return (
            <button
              key={key}
              onClick={() => setActiveFactor(key)}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider border rounded-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-marigold border-marigold text-night-blue font-bold'
                  : 'bg-cream-dark/20 dark:bg-night-dark/20 border-border-light dark:border-border-dark text-night-blue/80 dark:text-cream/80 hover:border-marigold'
              }`}
            >
              {factors[key].label[language] || factors[key].label.en}
            </button>
          );
        })}
      </div>

      {/* Active Description Box */}
      <div className="bg-cream-dark/20 dark:bg-night-dark/20 p-4 border-l border-marigold text-xs font-light leading-relaxed text-night-blue/80 dark:text-cream/70 min-h-[50px] transition-all">
        {factors[activeFactor].desc[language] || factors[activeFactor].desc.en}
      </div>
    </div>
  );
}

export default function Awareness({ topicSlug, onNavigateHome }) {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isDark = theme === 'dark';

  // State management for hub
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('mantra_awareness_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  // Load user assessment answers for personalization triggers
  const [assessmentAnswers, setAssessmentAnswers] = useState(() => {
    const saved = localStorage.getItem('mantra_assessment_answers');
    return saved ? JSON.parse(saved) : null;
  });

  // Active section tracking inside reader (ScrollSpy ToC)
  const [activeSection, setActiveSection] = useState('what-is-it');
  const [mobileToCOpen, setMobileToCOpen] = useState(false);

  const sectionsList = [
    { id: 'what-is-it', num: '01', label: { en: 'What is it?', hi: 'यह क्या है?' } },
    { id: 'why-it-matters', num: '02', label: { en: 'Why does it matter?', hi: 'यह क्यों महत्वपूर्ण है?' } },
    { id: 'reference-values', num: '03', label: { en: 'Reference values', hi: 'संदर्भ मान (Reference)' } },
    { id: 'what-can-influence', num: '04', label: { en: 'What can influence it?', hi: 'क्या प्रभावित कर सकता है?' } },
    { id: 'key-takeaways', num: '05', label: { en: 'Key takeaways', hi: 'मुख्य निष्कर्ष' } },
    { id: 'myth-vs-fact', num: '06', label: { en: 'Myth vs Fact', hi: 'भ्रम बनाम तथ्य' } },
    { id: 'sources', num: '07', label: { en: 'Sources & Evidence', hi: 'स्रोत और साक्ष्य' } }
  ];

  // Auto-scroll to top when a topic changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileToCOpen(false);
  }, [topicSlug]);

  // ScrollSpy listener
  useEffect(() => {
    if (!topicSlug) return;
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220; // offset value
      for (const section of sectionsList) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [topicSlug]);

  const handleBookmarkToggle = (slug) => {
    let updated;
    if (bookmarks.includes(slug)) {
      updated = bookmarks.filter(s => s !== slug);
    } else {
      updated = [...bookmarks, slug];
    }
    setBookmarks(updated);
    localStorage.setItem('mantra_awareness_bookmarks', JSON.stringify(updated));
  };

  const getRecommendations = () => {
    if (!assessmentAnswers) return [];
    const recs = [];
    
    // Trigger logic
    if (assessmentAnswers['stress_level'] && (assessmentAnswers['stress_level'] === 'High' || assessmentAnswers['stress_level'] === 'Moderate')) {
      recs.push('stress-wellbeing');
    }
    if (assessmentAnswers['sleep_hours'] && parseInt(assessmentAnswers['sleep_hours'], 10) < 7) {
      recs.push('sleep-sperm-health');
    }
    if (assessmentAnswers['smoking_status'] && assessmentAnswers['smoking_status'] === 'Yes') {
      recs.push('smoking-sperm-health');
    }
    if (assessmentAnswers['alcohol_intake'] && (assessmentAnswers['alcohol_intake'] === 'Daily' || assessmentAnswers['alcohol_intake'] === 'Weekly')) {
      recs.push('alcohol-sperm-health');
    }
    if (assessmentAnswers['scrotal_heat_exposure'] === 'Yes') {
      recs.push('heat-exposure-sperm-health');
    }
    if (assessmentAnswers['sedentary_routine'] === 'Yes') {
      recs.push('sedentary-lifestyle');
    }
    if (assessmentAnswers['relationship_status'] === 'Married' || assessmentAnswers['trying_duration']) {
      recs.push('professional-evaluation');
    }

    if (recs.length === 0) {
      return ['sperm-production', 'sleep-sperm-health', 'semen-analysis-intro'];
    }

    return Array.from(new Set(recs));
  };

  const recommendedSlugs = getRecommendations();
  const recommendedTopics = topics.filter(t => recommendedSlugs.includes(t.slug));

  // Search & Filter topics index
  const filteredTopics = topics.filter(topic => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const titleText = (topic.title[language] || topic.title.en).toLowerCase();
    const descText = (topic.shortDescription[language] || topic.shortDescription.en).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return matchesCategory && (titleText.includes(searchLower) || descText.includes(searchLower));
  });

  const [readTopics, setReadTopics] = useState(() => {
    const saved = localStorage.getItem('mantra_read_topics');
    return saved ? JSON.parse(saved) : [];
  });

  const markAsRead = (slug) => {
    if (!readTopics.includes(slug)) {
      const updated = [...readTopics, slug];
      setReadTopics(updated);
      localStorage.setItem('mantra_read_topics', JSON.stringify(updated));
    }
  };

  const content = {
    en: {
      tag: "AWARENESS / KNOWLEDGE",
      title: "Understand the biology behind your reproductive health.",
      desc: "Clear, private and evidence-aware information about sperm health, fertility, sexual health, lifestyle, and the factors that influence reproductive wellbeing.",
      exploreBtn: "EXPLORE TOPICS",
      assessBtn: "TAKE THE ASSESSMENT",
      searchPlaceholder: "Search reproductive health topics...",
      allCategories: "All Topics",
      recommended: "Recommended For You",
      recommendedSubtitle: "Based on your anonymous assessment parameters",
      mythsTitle: "Myths vs Facts",
      mythsSubtitle: "Interactive myth-busting around common misconceptions",
      glossaryTitle: "Interpret Semen Parameters",
      glossarySubtitle: "Interactive glossary of terminology found in lab reports",
      profTitle: "When should you talk to a professional?",
      profSubtitle: "Taking control of your health means knowing when to seek clinical guidance.",
      profDesc: "It is typical and normal to seek guidance from a qualified Urologist or Andrologist if you experience persistent symptoms, localized discomfort, or are facing challenges in your journey to conception.",
      profCta: "Understand Your Next Step",
      hubReturn: "Return to Knowledge Hub",
      takeaways: "Key Takeaways",
      related: "Related Topics",
      sources: "Sources & Evidence Reference",
      disclaimer: "Disclaimer: MantraAI provides pre-clinical educational information. It does not replace professional medical advice, diagnosis, or clinical evaluation. Always consult an RMP or specialist for health concerns.",
      readingProgress: "Reading Progress",
      bookmarkSaved: "Bookmarked",
      bookmarkSave: "Bookmark Topic",
      learningProgress: "Your Learning Progress",
      topicsExplored: "topics completed",
      indiaSectionTitle: "Reproductive health, without the silence.",
      indiaSectionDesc: "In India, conversations around reproductive wellbeing are often hidden due to stigma and discomfort. We aim to break the silence by providing direct, objective, and culturally respectful clinical facts."
    },
    hi: {
      tag: "जागरूकता / ज्ञान केंद्र",
      title: "अपने प्रजनन स्वास्थ्य के पीछे के विज्ञान को समझें।",
      desc: "शुक्राणु स्वास्थ्य, प्रजनन क्षमता, यौन स्वास्थ्य, जीवनशैली और प्रजनन कल्याण को प्रभावित करने वाले कारकों के बारे में स्पष्ट, निजी और साक्ष्य-आधारित जानकारी।",
      exploreBtn: "विषयों का अन्वेषण करें",
      assessBtn: "मूल्यांकन शुरू करें",
      searchPlaceholder: "प्रजनन स्वास्थ्य विषयों की खोज करें...",
      allCategories: "सभी विषय",
      recommended: "आपके लिए अनुशंसित",
      recommendedSubtitle: "आपके अनाम मूल्यांकन मापदंडों के आधार पर",
      mythsTitle: "भ्रम बनाम तथ्य",
      mythsSubtitle: "आम भ्रांतियों के बारे में इंटरैक्टिव जानकारी",
      glossaryTitle: "वीर्य विश्लेषण शब्दावली",
      glossarySubtitle: "प्रयोगशाला रिपोर्टों में पाए जाने वाले शब्दों को समझें",
      profTitle: "आपको किसी विशेषज्ञ से कब बात करनी चाहिए?",
      profSubtitle: "अपने स्वास्थ्य की देखभाल करने का मतलब है यह जानना कि कब चिकित्सकीय सलाह लेनी है।",
      profDesc: "यदि आप लगातार लक्षणों, स्थानीयकृत असुविधा का अनुभव करते हैं, या गर्भधारण में चुनौतियों का सामना कर रहे हैं, तो किसी विशेषज्ञ से परामर्श करना सामान्य है।",
      profCta: "अपना अगला कदम समझें",
      hubReturn: "ज्ञान केंद्र पर लौटें",
      takeaways: "मुख्य निष्कर्ष",
      related: "संबंधित विषय",
      sources: "साक्ष्य और संदर्भ स्रोत",
      disclaimer: "अस्वीकरण: मंत्रएआई पूर्व-नैदानिक ​​शैक्षिक जानकारी प्रदान करता है। यह नैदानिक निदान का स्थान नहीं लेता है।",
      readingProgress: "पठन प्रगति",
      bookmarkSaved: "बुकमार्क किया गया",
      bookmarkSave: "बुकमार्क करें",
      learningProgress: "आपकी सीखने की प्रगति",
      topicsExplored: "विषय पूरे हुए",
      indiaSectionTitle: "प्रजनन स्वास्थ्य, बिना किसी संकोच के।",
      indiaSectionDesc: "भारत में, सामाजिक संकोच के कारण अक्सर प्रजनन स्वास्थ्य पर चर्चा नहीं की जाती है। हमारा लक्ष्य वस्तुनिष्ठ और सांस्कृतिक रूप से सम्मानजनक नैदानिक तथ्य प्रदान करना है।"
    }
  }[language];

  // ─────────────── TOPIC READER VIEW ───────────────
  if (topicSlug) {
    const topic = topics.find(t => t.slug === topicSlug);
    if (topic) {
      markAsRead(topic.slug);
      const isBookmarked = bookmarks.includes(topic.slug);

      const nextTopic = topics[topics.indexOf(topic) + 1] || topics[0];
      const prevTopic = topics[topics.indexOf(topic) - 1] || topics[topics.length - 1];

      // Custom clinical details based on active topic
      const getsReferenceCard = ['sperm-concentration', 'sperm-motility', 'sperm-morphology'].includes(topic.slug);

      return (
        <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-between transition-colors duration-500 relative">
          
          {/* Header navigation bar */}
          <header className="relative z-30 w-full flex justify-between items-center border-b border-border-light dark:border-border-dark px-6 py-4 md:px-16 bg-cream/90 dark:bg-night-dark/90 backdrop-blur-xs select-none">
            <div onClick={() => window.location.hash = '#awareness'} className="flex items-center gap-2.5 cursor-pointer">
              <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-1.5 py-0.5 font-medium tracking-widest rounded-sm">मंत्र</span>
              <span className="font-grotesk font-bold text-xl tracking-wider text-night-blue dark:text-cream">MANTRA<span className="text-marigold">.AI</span></span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleLanguage} className="px-2.5 py-1.5 text-[11px] border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 rounded-sm font-semibold text-night-blue dark:text-cream">{language === 'en' ? 'हिन्दी' : 'EN'}</button>
              <button onClick={toggleTheme} className="p-2 border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 rounded-sm">{theme === 'dark' ? '☀️' : '🌙'}</button>
              <button onClick={() => window.location.hash = '#awareness'} className="px-4 py-2 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold rounded-sm hover:border-marigold transition-colors">{content.hubReturn}</button>
            </div>
          </header>

          {/* Microscopic backdrop inside article view (subtle) */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
              <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
            </div>
          )}

          {/* ── NEW EDITORIAL HERO SECTION ── */}
          <section className="relative z-10 w-full border-b border-border-light dark:border-border-dark py-12 px-6 md:px-16 bg-cream-dark/10 dark:bg-night-blue/10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Hero content */}
              <div className="lg:col-span-8 space-y-4">
                <span className="text-marigold text-xs font-semibold tracking-[0.25em] uppercase block">
                  {categories.find(c => c.id === topic.category)?.name[language] || topic.category}
                </span>
                <h1 className="font-serif text-3xl md:text-6xl font-normal leading-[1.1] text-night-blue dark:text-cream tracking-tight">
                  {topic.title[language] || topic.title.en}
                </h1>
                
                <p className="font-grotesk text-sm md:text-base font-light leading-relaxed text-night-blue/70 dark:text-cream/70 max-w-2xl">
                  {topic.shortDescription[language] || topic.shortDescription.en}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 select-none">
                  <button
                    onClick={() => handleBookmarkToggle(topic.slug)}
                    className={`px-4 py-2 border rounded-sm transition-colors text-[10px] font-semibold uppercase tracking-wider cursor-pointer ${
                      isBookmarked
                        ? 'bg-marigold/10 border-marigold text-marigold font-bold'
                        : 'border-border-light dark:border-border-dark text-night-blue/60 dark:text-cream/50 hover:border-marigold'
                    }`}
                  >
                    {isBookmarked ? `✓ ${content.bookmarkSaved}` : `+ ${content.bookmarkSave}`}
                  </button>
                  <span className="bg-cream dark:bg-night-dark border border-border-light dark:border-border-dark px-4 py-2 text-[10px] uppercase font-bold tracking-widest rounded-sm text-night-blue/50 dark:text-cream/40">
                    {topic.readTime} / {topic.difficulty}
                  </span>
                </div>
              </div>

              {/* Hero preview microscopic element */}
              <div className="lg:col-span-4 hidden lg:block h-44 border border-border-light dark:border-border-dark relative rounded-sm overflow-hidden select-none bg-cream dark:bg-night-dark/40 opacity-90">
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={false} />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-marigold font-bold mb-1">MANTRA CLINICAL LABS</span>
                  <span className="font-grotesk text-[10px] text-night-blue/40 dark:text-cream/35">Interactive Pre-clinical Resource v1.0</span>
                </div>
              </div>

            </div>
          </section>

          {/* ── MOBILE TOC NAVIGATION DROPDOWN ── */}
          <div className="lg:hidden w-full bg-cream-dark/30 dark:bg-night-blue/40 border-b border-border-light dark:border-border-dark px-6 py-3 select-none relative z-20">
            <button
              onClick={() => setMobileToCOpen(!mobileToCOpen)}
              className="w-full flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-night-blue/70 dark:text-cream/70"
            >
              <span>On This Page ↓</span>
              <span>{mobileToCOpen ? 'Hide' : 'Show'}</span>
            </button>
            <AnimatePresence>
              {mobileToCOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3 space-y-2.5 pt-2"
                >
                  {sectionsList.map(sec => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={() => setMobileToCOpen(false)}
                      className={`block text-[11px] font-semibold uppercase tracking-wider ${
                        activeSection === sec.id ? 'text-marigold' : 'text-night-blue/60 dark:text-cream/50'
                      }`}
                    >
                      {sec.num} / {sec.label[language] || sec.label.en}
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── NEW RESPONSIVE 3-COLUMN DESKTOP LAYOUT ── */}
          <div className="max-w-7xl mx-auto w-full px-6 md:px-16 py-12 flex gap-10 items-start relative z-10 flex-grow">
            
            {/* COLUMN 1: Sticky Left ToC (desktop only) */}
            <aside className="w-56 shrink-0 sticky top-24 hidden lg:block select-none">
              <span className="text-[10px] uppercase tracking-[0.25em] text-night-blue/40 dark:text-cream/40 font-bold block mb-4">
                ON THIS PAGE
              </span>
              <nav className="space-y-3 font-grotesk text-[11px] uppercase tracking-wider font-semibold">
                {sectionsList.map(sec => {
                  const isActive = activeSection === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className={`flex items-center gap-3 py-1.5 transition-all duration-300 ${
                        isActive
                          ? 'text-marigold font-bold border-l-2 border-l-marigold pl-3'
                          : 'text-night-blue/40 dark:text-cream/30 hover:text-marigold pl-3'
                      }`}
                    >
                      <span>{sec.num}</span>
                      <span>{sec.label[language] || sec.label.en}</span>
                    </a>
                  );
                })}
              </nav>
            </aside>

            {/* COLUMN 2: Main Content stream */}
            <main className="flex-1 max-w-3xl space-y-16 overflow-y-visible">
              
              {/* Section 1: What is it? */}
              <section id="what-is-it" className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-marigold font-bold text-xs uppercase tracking-widest">
                  <span>01</span>
                  <span>/</span>
                  <span>{language === 'en' ? 'Biology Focus' : 'जीवविज्ञान विवरण'}</span>
                </div>
                <h2 className="font-serif text-3xl md:text-4.5xl font-normal leading-tight text-night-blue dark:text-cream tracking-tight">
                  {topic.sections[0]?.heading[language] || topic.sections[0]?.heading.en}
                </h2>
                <p className="font-grotesk text-base md:text-lg font-light leading-relaxed text-night-blue/80 dark:text-cream/70">
                  {topic.sections[0]?.content[language] || topic.sections[0]?.content.en}
                </p>
              </section>

              {/* Section 2: Why it matters */}
              <section id="why-it-matters" className="space-y-4">
                <div className="flex items-center gap-2 text-marigold font-bold text-xs uppercase tracking-widest">
                  <span>02</span>
                  <span>/</span>
                  <span>Why it matters</span>
                </div>
                <h3 className="font-serif text-2.5xl font-normal text-night-blue dark:text-cream tracking-tight">
                  {language === 'en' ? 'Clinical Significance' : 'नैदानिक ​​महत्व'}
                </h3>
                
                {/* Visual Why This Matters card */}
                <WhyItMatters text={topic.whyItMatters} />
                
                {topic.sections[1] && (
                  <p className="font-grotesk text-sm md:text-base font-light leading-relaxed text-night-blue/70 dark:text-cream/65 pt-2">
                    {topic.sections[1]?.content[language] || topic.sections[1]?.content.en}
                  </p>
                )}
              </section>

              {/* Section 3: Reference Values */}
              <section id="reference-values" className="space-y-6">
                <div className="flex items-center gap-2 text-marigold font-bold text-xs uppercase tracking-widest">
                  <span>03</span>
                  <span>/</span>
                  <span>{language === 'en' ? 'Reference Values & Context' : 'संदर्भ मान विवरण'}</span>
                </div>

                {getsReferenceCard ? (
                  /* Custom WHO data block display */
                  <div className="bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark p-8 rounded-sm select-none shadow-sm">
                    <span className="text-[10px] tracking-widest text-night-blue/40 dark:text-cream/40 uppercase font-bold block mb-4">
                      {language === 'en' ? 'Standard parameters threshold' : 'मानक मापदंड दहलीज'}
                    </span>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-serif text-6xl md:text-7xl font-semibold text-marigold">
                        {topic.slug === 'sperm-concentration' ? '15' : topic.slug === 'sperm-motility' ? '40%' : '4%'}
                      </span>
                      <span className="font-grotesk text-xl font-bold uppercase text-night-blue/80 dark:text-cream/80">
                        {topic.slug === 'sperm-concentration' ? 'million / mL' : topic.slug === 'sperm-motility' ? 'motility limit' : 'normal morphology'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-night-blue/60 dark:text-cream/50 block mb-4">
                      WHO Laboratory Guidelines Lower Reference Limit
                    </span>
                    <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-3 text-xs font-light text-night-blue/70 dark:text-cream/65 leading-relaxed">
                      <p>
                        <strong>What does this metric tell you?</strong> It is the 5th percentile baseline calculated from semen profiles of couples with typical conception timelines. 
                      </p>
                      <p className="border-l border-marigold/30 pl-3 italic">
                        <strong>Important:</strong> Reference limits are not standalone cutoffs for fertility or infertility. They represent a reference range for diagnostic assessment.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Qualitative baseline card fallback for lifestyle/anxiety */
                  <div className="bg-cream-dark/20 dark:bg-night-blue/20 border border-border-light dark:border-border-dark p-6 rounded-sm">
                    <h5 className="font-serif text-lg text-night-blue dark:text-cream mb-2">
                      {language === 'en' ? 'Prevalence & Evaluation Context' : 'व्यापकता और मूल्यांकन संदर्भ'}
                    </h5>
                    <p className="font-grotesk text-xs leading-relaxed text-night-blue/70 dark:text-cream/70 font-light">
                      {language === 'en'
                        ? "Clinical parameters are highly fluid and responsive to physical habits. Evaluating indicators requires looking at the overall lifestyle profile over a 2.5-month span."
                        : "नैदानिक ​​​​मापदंड अत्यधिक परिवर्तनशील होते हैं। मापदंडों का मूल्यांकन करने के लिए 2.5 महीने की अवधि में समग्र जीवनशैली प्रोफ़ाइल को देखने की आवश्यकता होती है।"}
                    </p>
                  </div>
                )}

                {/* What it tells vs what it doesn't paired comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="border border-ashoka-green/20 bg-ashoka-green/[0.02] p-6 rounded-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-ashoka-green dark:text-ashoka-green-light font-bold block mb-3">
                        {language === 'en' ? 'What It Tells You' : 'यह क्या बताता है'}
                      </span>
                      <p className="font-grotesk text-xs font-light text-night-blue/80 dark:text-cream/70 leading-relaxed">
                        {topic.slug === 'sperm-concentration'
                          ? "Concentration gives information about total sperm production and fluid balance per milliliter."
                          : topic.slug === 'sperm-motility'
                            ? "Motility shows the percentage of actively swimming cells required to travel through pelvic pathways."
                            : "This parameter reflects structural cellular characteristics and baseline shapes."}
                      </p>
                    </div>
                  </div>
                  <div className="border border-red-500/20 bg-red-500/[0.02] p-6 rounded-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold block mb-3">
                        {language === 'en' ? "What It Doesn't Tell" : 'यह क्या नहीं बताता है'}
                      </span>
                      <p className="font-grotesk text-xs font-light text-night-blue/80 dark:text-cream/70 leading-relaxed">
                        {language === 'en'
                          ? "It does not independently establish fertility or evaluate egg variables or other biological factors."
                          : "यह अपने आप में प्रजनन क्षमता स्थापित नहीं करता है और न ही अंडे के मापदंडों का मूल्यांकन करता है।"}
                      </p>
                    </div>
                  </div>
                </div>

              </section>

              {/* Section 4: What can influence it? */}
              <section id="what-can-influence" className="space-y-4">
                <div className="flex items-center gap-2 text-marigold font-bold text-xs uppercase tracking-widest">
                  <span>04</span>
                  <span>/</span>
                  <span>What can influence it?</span>
                </div>
                <h3 className="font-serif text-2.5xl font-normal text-night-blue dark:text-cream tracking-tight">
                  {language === 'en' ? 'Interactive Factors' : 'पारस्परिक कारक'}
                </h3>
                
                {/* Interactive Factor Selector widget */}
                <FactorSelector language={language} />
              </section>

              {/* Section 5: Interactive Micro-Visualization (Density toggler) */}
              {getsReferenceCard && (
                <section id="concept-illustration" className="space-y-4">
                  <div className="flex items-center gap-2 text-marigold font-bold text-xs uppercase tracking-widest">
                    <span>05</span>
                    <span>/</span>
                    <span>Interactive Micro-Visualizer</span>
                  </div>
                  <ConceptVisualizer type={topic.slug} />
                </section>
              )}

              {/* Section 6: Key Takeaways */}
              <section id="key-takeaways" className="space-y-4">
                <div className="flex items-center gap-2 text-marigold font-bold text-xs uppercase tracking-widest">
                  <span>06</span>
                  <span>/</span>
                  <span>Takeaways</span>
                </div>
                <h3 className="font-serif text-2.5xl font-normal text-night-blue dark:text-cream tracking-tight mb-4">
                  {content.takeaways}
                </h3>
                
                {/* Replaced bullet points with numbered editorial blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topic.keyTakeaways.map((take, idx) => (
                    <div key={idx} className="border border-border-light dark:border-border-dark p-5 bg-cream dark:bg-night-blue rounded-sm">
                      <span className="font-serif text-2xl font-light text-marigold block mb-2">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <p className="font-grotesk text-xs leading-relaxed text-night-blue/80 dark:text-cream/70 font-light">
                        {take[language] || take.en}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 7: Myth vs Fact (1-of-5 carousel widget) */}
              <section id="myth-vs-fact" className="space-y-6">
                <div className="flex items-center gap-2 text-marigold font-bold text-xs uppercase tracking-widest">
                  <span>07</span>
                  <span>/</span>
                  <span>Myth vs Fact Toggler</span>
                </div>
                <h3 className="font-serif text-2.5xl font-normal text-night-blue dark:text-cream tracking-tight">
                  {content.mythsTitle}
                </h3>
                <div className="max-w-xl">
                  <MythFactCard mythItem={myths[topics.indexOf(topic) % myths.length]} />
                </div>
              </section>

              {/* Section 8: Sources & Evidence table */}
              <section id="sources" className="space-y-6">
                <div className="flex items-center gap-2 text-marigold font-bold text-xs uppercase tracking-widest">
                  <span>08</span>
                  <span>/</span>
                  <span>Sources</span>
                </div>
                <h3 className="font-serif text-2.5xl font-normal text-night-blue dark:text-cream tracking-tight">
                  {content.sources}
                </h3>
                <div className="border border-border-light dark:border-border-dark rounded-sm overflow-hidden select-none bg-cream dark:bg-night-blue/20">
                  <table className="w-full text-left text-xs font-grotesk border-collapse">
                    <thead>
                      <tr className="border-b border-border-light dark:border-border-dark bg-cream-dark/25 dark:bg-night-blue/50">
                        <th className="p-4 font-bold uppercase tracking-wider">Clinical Reference</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Year</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topic.sources.map((src, i) => (
                        <tr key={i} className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-cream-dark/10 dark:hover:bg-night-blue/30 transition-colors">
                          <td className="p-4 font-light text-night-blue/90 dark:text-cream/90">{src.title}</td>
                          <td className="p-4 text-night-blue/60 dark:text-cream/50">{src.year}</td>
                          <td className="p-4">
                            <span className="bg-marigold/10 border border-marigold/20 text-marigold text-[9px] font-bold px-2 py-0.5 rounded-sm">
                              CLINICAL
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 60-Second Learning Module Card row */}
              <div className="border-t border-border-light dark:border-border-dark pt-12 space-y-6">
                <h4 className="font-serif text-xl font-normal text-night-blue dark:text-cream">
                  {language === 'en' ? 'Quick Reference Cards' : 'त्वरित संदर्भ पत्रक'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {topics.slice(0, 3).map(t => (
                    <div
                      key={t.id}
                      onClick={() => window.location.hash = `#awareness/${t.slug}`}
                      className="border border-border-light dark:border-border-dark p-4 bg-cream dark:bg-night-blue hover:border-marigold transition-all cursor-pointer rounded-sm"
                    >
                      <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block mb-1">03 MIN READ</span>
                      <h5 className="font-serif text-sm text-night-blue dark:text-cream leading-tight">{t.title[language] || t.title.en}</h5>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related topics editorial card grid */}
              {topic.relatedTopics && topic.relatedTopics.length > 0 && (
                <div className="border-t border-border-light dark:border-border-dark pt-12">
                  <span className="text-[9px] uppercase tracking-widest text-night-blue/40 dark:text-cream/40 font-bold block mb-6">
                    {content.related}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {topic.relatedTopics.map(relSlug => {
                      const relTopic = topics.find(t => t.slug === relSlug);
                      if (!relTopic) return null;
                      return (
                        <div
                          key={relSlug}
                          onClick={() => window.location.hash = `#awareness/${relSlug}`}
                          className="bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark p-6 rounded-sm cursor-pointer hover:border-marigold transition-all group flex flex-col justify-between min-h-[120px]"
                        >
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block mb-2">NEXT TOPIC</span>
                            <h4 className="font-serif text-lg font-normal text-night-blue dark:text-cream group-hover:text-marigold transition-colors leading-snug">
                              {relTopic.title[language] || relTopic.title.en}
                            </h4>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider text-night-blue/40 dark:text-cream/40 group-hover:text-marigold transition-colors pt-2">
                            READ TOPICS →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation buttons: Prev / Next */}
              <div className="flex justify-between items-center border-t border-border-light dark:border-border-dark pt-8 mt-12">
                <button
                  onClick={() => window.location.hash = `#awareness/${prevTopic.slug}`}
                  className="text-xs uppercase tracking-wider font-semibold text-night-blue/60 dark:text-cream/50 hover:text-marigold transition-colors cursor-pointer"
                >
                  ← {prevTopic.title[language] || prevTopic.title.en}
                </button>
                <button
                  onClick={() => window.location.hash = `#awareness/${nextTopic.slug}`}
                  className="text-xs uppercase tracking-wider font-semibold text-night-blue/60 dark:text-cream/50 hover:text-marigold transition-colors cursor-pointer"
                >
                  {nextTopic.title[language] || nextTopic.title.en} →
                </button>
              </div>

            </main>

            {/* COLUMN 3: Right contextual panel (desktop only) */}
            <aside className="w-64 shrink-0 sticky top-24 hidden xl:block space-y-6 select-none">
              
              {/* Assessment loop card */}
              <div className="border border-marigold/30 p-5 bg-marigold/[0.01] rounded-sm space-y-4">
                <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block">
                  Interactive Screening
                </span>
                <h5 className="font-serif text-base text-night-blue dark:text-cream leading-tight">
                  Want a personalized learning path?
                </h5>
                <p className="font-grotesk text-[11px] leading-relaxed text-night-blue/60 dark:text-cream/50 font-light">
                  Complete our 5-minute pre-clinical assessment to mapping key reproductive wellness factors.
                </p>
                <button
                  onClick={() => window.location.hash = '#assess'}
                  className="w-full py-2.5 bg-marigold hover:bg-marigold-light text-night-blue text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm cursor-pointer"
                >
                  Start Assessment
                </button>
              </div>

              {/* Disclaimer guidelines */}
              <div className="border border-border-light dark:border-border-dark p-5 rounded-sm bg-cream-dark/20 dark:bg-night-blue/30 space-y-2">
                <span className="text-[8px] uppercase tracking-widest text-night-blue/40 dark:text-cream/40 font-bold block">
                  Clinical Standards
                </span>
                <p className="font-grotesk text-[10px] leading-relaxed text-night-blue/60 dark:text-cream/55 font-light italic">
                  Information verified against established WHO guidelines. We support clinical education, not self-diagnosis.
                </p>
              </div>

            </aside>

          </div>

          {/* Footer bar */}
          <footer className="py-8 border-t border-border-light dark:border-border-dark text-[10px] text-center text-night-blue/40 dark:text-cream/30 px-6 leading-relaxed bg-cream dark:bg-night-dark relative z-10">
            {content.disclaimer}
          </footer>
        </div>
      );
    }
  }

  // ─────────────── HUB VIEW ───────────────
  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-between transition-colors duration-500 overflow-x-hidden relative">
      
      {/* Navigation Header */}
      <header className="relative z-20 w-full flex justify-between items-center border-b border-border-light dark:border-border-dark px-6 py-4 md:px-16 bg-cream/90 dark:bg-night-dark/90 backdrop-blur-xs select-none">
        <div onClick={onNavigateHome} className="flex items-center gap-2.5 cursor-pointer">
          <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-1.5 py-0.5 font-medium tracking-widest rounded-sm">मंत्र</span>
          <span className="font-grotesk font-bold text-xl tracking-wider text-night-blue dark:text-cream">MANTRA<span className="text-marigold">.AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleLanguage} className="px-2.5 py-1.5 text-[11px] border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 rounded-sm font-semibold text-night-blue dark:text-cream">{language === 'en' ? 'हिन्दी' : 'EN'}</button>
          <button onClick={toggleTheme} className="p-2 border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 rounded-sm">{theme === 'dark' ? '☀️' : '🌙'}</button>
          <button onClick={onNavigateHome} className="px-4 py-2 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold rounded-sm hover:border-marigold transition-colors">{language === 'en' ? 'Back' : 'पीछे'}</button>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative py-20 px-6 md:px-16 border-b border-border-light dark:border-border-dark text-center overflow-hidden">
        {/* Subtle Canvas biology backdrop */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
            <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
          </div>
        )}
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="text-marigold text-xs font-semibold tracking-[0.25em] uppercase mb-4 block">
            {content.tag}
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-normal leading-[1.05] tracking-tight mb-6 text-night-blue dark:text-cream">
            {content.title}
          </h1>
          <p className="font-grotesk text-sm md:text-base font-light leading-relaxed text-night-blue/70 dark:text-cream/70 max-w-xl mx-auto mb-8">
            {content.desc}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#explore-section"
              className="px-6 py-3.5 bg-marigold hover:bg-marigold-light text-night-blue text-xs font-semibold uppercase tracking-wider transition-colors duration-300 rounded-sm"
            >
              {content.exploreBtn}
            </a>
            <button
              onClick={() => window.location.hash = '#assess'}
              className="px-6 py-3.5 border border-border-light dark:border-border-dark text-xs font-semibold uppercase tracking-wider transition-colors hover:border-marigold text-night-blue dark:text-cream rounded-sm"
            >
              {content.assessBtn}
            </button>
          </div>
        </div>
      </section>

      {/* Learning Progress Section */}
      <section className="py-10 px-6 md:px-16 border-b border-border-light dark:border-border-dark bg-cream-dark/20 dark:bg-night-blue/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 select-none">
          <div>
            <h4 className="font-serif text-xl font-normal text-night-blue dark:text-cream">
              {content.learningProgress}
            </h4>
            <span className="text-xs text-night-blue/50 dark:text-cream/50">
              Explore resources anonymously. Progress is saved locally.
            </span>
          </div>
          <div className="bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark px-6 py-3 rounded-sm flex items-center gap-4 shadow-sm">
            <span className="font-serif text-3xl font-bold text-marigold">
              {readTopics.length} <span className="text-xs text-night-blue/50 dark:text-cream/50 font-grotesk font-light">/ {topics.length}</span>
            </span>
            <div className="h-6 w-px bg-border-light dark:bg-border-dark" />
            <span className="text-xs uppercase tracking-widest font-semibold text-night-blue/70 dark:text-cream/60">
              {content.topicsExplored}
            </span>
          </div>
        </div>
      </section>

      {/* Search and Filters Hub */}
      <section id="explore-section" className="py-16 px-6 md:px-16 border-b border-border-light dark:border-border-dark">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar search / filter layout */}
            <aside className="w-full lg:w-1/4 space-y-6">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={content.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-cream-dark/30 dark:bg-night-blue/50 text-night-blue dark:text-cream px-4 py-3 border border-border-light dark:border-border-dark rounded-sm focus:outline-none focus:ring-1 focus:ring-marigold text-xs font-semibold"
                />
              </div>

              {/* Categories list */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-night-blue/40 dark:text-cream/40 font-bold block mb-3">
                  Categories
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all border ${
                    selectedCategory === 'all'
                      ? 'bg-marigold text-night-blue border-marigold font-bold'
                      : 'bg-transparent border-border-light dark:border-border-dark hover:border-marigold text-night-blue/80 dark:text-cream/80'
                  }`}
                >
                  {content.allCategories}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all border ${
                      selectedCategory === cat.id
                        ? 'bg-marigold text-night-blue border-marigold font-bold'
                        : 'bg-transparent border-border-light dark:border-border-dark hover:border-marigold text-night-blue/80 dark:text-cream/80'
                    }`}
                  >
                    {cat.name[language] || cat.name.en}
                  </button>
                ))}
              </div>
            </aside>

            {/* Topics Grid layout */}
            <main className="w-full lg:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredTopics.map((topic) => {
                    const isRead = readTopics.includes(topic.slug);
                    return (
                      <motion.div
                        key={topic.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => window.location.hash = `#awareness/${topic.slug}`}
                        className="bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark p-6 rounded-sm shadow-sm flex flex-col justify-between min-h-[190px] cursor-pointer hover:border-marigold/40 transition-all group"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[8px] uppercase tracking-widest text-marigold font-semibold">
                              {categories.find(c => c.id === topic.category)?.name[language] || topic.category}
                            </span>
                            {isRead && (
                              <span className="text-[7px] uppercase tracking-widest font-bold bg-ashoka-green/10 text-ashoka-green dark:text-ashoka-green-light px-2 py-0.5 rounded-sm border border-ashoka-green/25">
                                ✓ {content.alreadyRead}
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif text-xl font-normal leading-snug text-night-blue dark:text-cream mb-2 group-hover:text-marigold transition-colors">
                            {topic.title[language] || topic.title.en}
                          </h4>
                          <p className="font-grotesk text-xs leading-relaxed text-night-blue/60 dark:text-cream/50 font-light line-clamp-3">
                            {topic.shortDescription[language] || topic.shortDescription.en}
                          </p>
                        </div>
                        <div className="flex justify-between items-center border-t border-border-light dark:border-border-dark pt-3 mt-4 text-[9px] uppercase font-bold text-night-blue/40 dark:text-cream/45">
                          <span>{topic.readTime} / {topic.difficulty}</span>
                          <span className="group-hover:text-marigold transition-colors">Read Topic →</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </main>

          </div>
        </div>
      </section>

      {/* Personalized Awareness Recommendations Section */}
      {assessmentAnswers && recommendedTopics.length > 0 && (
        <section className="py-16 px-6 md:px-16 border-b border-border-light dark:border-border-dark bg-marigold/[0.015] dark:bg-marigold/[0.005]">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10 text-center select-none">
              <span className="text-marigold text-xs font-semibold tracking-[0.25em] uppercase mb-2 block">
                {content.recommended}
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-normal text-night-blue dark:text-cream tracking-tight">
                {content.recommendedSubtitle}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedTopics.slice(0, 3).map(topic => (
                <div
                  key={topic.id}
                  onClick={() => window.location.hash = `#awareness/${topic.slug}`}
                  className="bg-cream dark:bg-night-blue border border-marigold/20 hover:border-marigold p-6 rounded-sm cursor-pointer transition-all shadow-xs"
                >
                  <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block mb-2">DYNAMIC FOCUS</span>
                  <h4 className="font-serif text-lg font-normal text-night-blue dark:text-cream mb-2 leading-snug">
                    {topic.title[language] || topic.title.en}
                  </h4>
                  <p className="font-grotesk text-xs leading-relaxed text-night-blue/60 dark:text-cream/50 font-light mb-4 line-clamp-2">
                    {topic.shortDescription[language] || topic.shortDescription.en}
                  </p>
                  <span className="text-[9px] uppercase tracking-wider text-marigold font-semibold block text-right">LEARN ABOUT THIS →</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 60-Second Learning Module Card */}
      <section className="py-16 px-6 md:px-16 border-b border-border-light dark:border-border-dark">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center select-none">
            <span className="text-marigold text-xs font-semibold tracking-[0.25em] uppercase mb-2 block">60 SECOND LEARNING</span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-night-blue dark:text-cream tracking-tight">
              Interactive maturation & lifecycle guides
            </h2>
          </div>
          <LearningModule moduleData={learningModules[0]} />
        </div>
      </section>

      {/* Myths & Facts Grid */}
      <section className="py-16 px-6 md:px-16 border-b border-border-light dark:border-border-dark bg-cream-dark/10 dark:bg-night-dark/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center select-none">
            <span className="text-marigold text-xs font-semibold tracking-[0.25em] uppercase mb-2 block">{content.mythsTitle}</span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-night-blue dark:text-cream tracking-tight">{content.mythsSubtitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myths.map(item => (
              <MythFactCard key={item.id} mythItem={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Semen Analysis Glossary Section */}
      <section className="py-16 px-6 md:px-16 border-b border-border-light dark:border-border-dark">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center select-none">
            <span className="text-marigold text-xs font-semibold tracking-[0.25em] uppercase mb-2 block">{content.glossaryTitle}</span>
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-night-blue dark:text-cream tracking-tight">{content.glossarySubtitle}</h2>
          </div>
          <GlossaryCard glossaryData={glossary} />
        </div>
      </section>

      {/* India-First context card */}
      <section className="py-16 px-6 md:px-16 border-b border-border-light dark:border-border-dark bg-ashoka-green/[0.015] dark:bg-ashoka-green/[0.005] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-ashoka-green dark:text-ashoka-green-light text-xs font-semibold tracking-[0.25em] uppercase mb-4 block">INDIA-FIRST CONTEXT</span>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-night-blue dark:text-cream tracking-tight mb-4">
            {content.indiaSectionTitle}
          </h2>
          <p className="font-grotesk text-sm md:text-base font-light leading-relaxed text-night-blue/70 dark:text-cream/70 max-w-xl mx-auto">
            {content.indiaSectionDesc}
          </p>
        </div>
      </section>

      {/* Talk to specialist guidelines */}
      <section className="py-20 px-6 md:px-16 bg-cream dark:bg-night-blue border-b border-border-light dark:border-border-dark">
        <div className="max-w-4xl mx-auto text-center select-none">
          <span className="text-marigold text-xs font-semibold tracking-[0.25em] uppercase mb-3 block">
            CLINICAL GUIDELINES
          </span>
          <h2 className="font-serif text-3xl md:text-4.5xl font-normal text-night-blue dark:text-cream tracking-tight mb-4">
            {content.profTitle}
          </h2>
          <p className="font-grotesk text-xs uppercase tracking-widest text-marigold/70 font-semibold mb-6">
            {content.profSubtitle}
          </p>
          <p className="font-grotesk text-sm font-light leading-relaxed text-night-blue/70 dark:text-cream/65 max-w-xl mx-auto mb-8">
            {content.profDesc}
          </p>
          <button
            onClick={() => window.location.hash = '#assess'}
            className="px-8 py-4 bg-marigold hover:bg-marigold-light text-night-blue font-semibold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer shadow-lg shadow-marigold/10"
          >
            {content.profCta}
          </button>
        </div>
      </section>

      {/* Footer bar */}
      <footer className="py-12 border-t border-border-light dark:border-border-dark text-[10px] text-center text-night-blue/40 dark:text-cream/30 px-6 leading-relaxed">
        {content.disclaimer}
      </footer>
    </div>
  );
}
