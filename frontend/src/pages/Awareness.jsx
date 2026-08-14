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

  // Auto-scroll to top when a topic is selected
  useEffect(() => {
    window.scrollTo(0, 0);
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

    // Fallbacks to default topics if no triggers matched
    if (recs.length === 0) {
      return ['sperm-production', 'sleep-sperm-health', 'semen-analysis-intro'];
    }

    return Array.from(new Set(recs));
  };

  const recommendedSlugs = getRecommendations();
  const recommendedTopics = topics.filter(t => recommendedSlugs.includes(t.slug));

  // Filter and Search logic
  const filteredTopics = topics.filter(topic => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const titleText = (topic.title[language] || topic.title.en).toLowerCase();
    const descText = (topic.shortDescription[language] || topic.shortDescription.en).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = titleText.includes(searchLower) || descText.includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  // Calculate learning score (progress based on bookmarked or read counts)
  // Let's track read topics locally
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
      readMark: "Mark as Read",
      alreadyRead: "Completed",
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
      readMark: "पूरा चिह्नित करें",
      alreadyRead: "पढ़ा हुआ",
      learningProgress: "आपकी सीखने की प्रगति",
      topicsExplored: "विषय पूरे हुए",
      indiaSectionTitle: "प्रजनन स्वास्थ्य, बिना किसी संकोच के।",
      indiaSectionDesc: "भारत में, सामाजिक संकोच के कारण अक्सर प्रजनन स्वास्थ्य पर चर्चा नहीं की जाती है। हमारा लक्ष्य वस्तुनिष्ठ और सांस्कृतिक रूप से सम्मानजनक नैदानिक तथ्य प्रदान करना है।"
    }
  }[language];

  // Render Topic Reader View if topicSlug is active
  if (topicSlug) {
    const topic = topics.find(t => t.slug === topicSlug);
    if (topic) {
      markAsRead(topic.slug);
      const isBookmarked = bookmarks.includes(topic.slug);
      const isCompleted = readTopics.includes(topic.slug);

      const nextTopic = topics[topics.indexOf(topic) + 1] || topics[0];
      const prevTopic = topics[topics.indexOf(topic) - 1] || topics[topics.length - 1];

      return (
        <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-between transition-colors duration-500 overflow-x-hidden relative">
          
          {/* Header navigation bar */}
          <header className="relative z-20 w-full flex justify-between items-center border-b border-border-light dark:border-border-dark px-6 py-4 md:px-16 bg-cream/90 dark:bg-night-dark/90 backdrop-blur-xs select-none">
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

          {/* Microscopic backdrop inside article view */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
              <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
            </div>
          )}

          <main className="flex-grow w-full py-12 px-6 md:px-16 relative z-10 max-w-4xl mx-auto">
            
            {/* Action Bar: Bookmark & Status */}
            <div className="flex justify-between items-center mb-6 text-xs select-none">
              <span className="text-marigold tracking-widest font-semibold uppercase">
                {categories.find(c => c.id === topic.category)?.name[language] || topic.category}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBookmarkToggle(topic.slug)}
                  className={`px-3 py-1.5 border rounded-sm transition-colors text-[10px] font-semibold uppercase tracking-wider ${
                    isBookmarked
                      ? 'bg-marigold/10 border-marigold text-marigold'
                      : 'border-border-light dark:border-border-dark text-night-blue/60 dark:text-cream/50 hover:border-marigold'
                  }`}
                >
                  {isBookmarked ? `✓ ${content.bookmarkSaved}` : `+ ${content.bookmarkSave}`}
                </button>
                <span className="bg-cream-dark dark:bg-night-blue border border-border-light dark:border-border-dark px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-sm text-night-blue/50 dark:text-cream/40">
                  {topic.readTime} / {topic.difficulty}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-serif text-4xl md:text-5xl font-normal leading-tight tracking-tight text-night-blue dark:text-cream mb-6">
              {topic.title[language] || topic.title.en}
            </h1>

            {/* Why This Matters reusable component */}
            <WhyItMatters text={topic.whyItMatters} />

            {/* Sections Mapping */}
            <div className="space-y-8 my-10">
              {topic.sections.map((sec, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="font-serif text-2xl font-normal text-night-blue dark:text-cream tracking-tight">
                    {sec.heading[language] || sec.heading.en}
                  </h3>
                  <p className="font-grotesk text-sm md:text-base font-light leading-relaxed text-night-blue/80 dark:text-cream/70">
                    {sec.content[language] || sec.content.en}
                  </p>
                </div>
              ))}
            </div>

            {/* Takeaways */}
            <div className="border border-border-light dark:border-border-dark p-6 bg-cream-dark/20 dark:bg-night-blue/20 rounded-sm my-8">
              <span className="text-[10px] uppercase tracking-widest text-marigold font-bold block mb-4 border-b border-border-light dark:border-border-dark pb-2">
                {content.takeaways}
              </span>
              <ul className="list-disc list-inside text-xs font-light text-night-blue/80 dark:text-cream/80 space-y-2">
                {topic.keyTakeaways.map((take, idx) => (
                  <li key={idx}><span className="font-grotesk">{take[language] || take.en}</span></li>
                ))}
              </ul>
            </div>

            {/* Related Topics */}
            {topic.relatedTopics && topic.relatedTopics.length > 0 && (
              <div className="my-8">
                <span className="text-[10px] uppercase tracking-widest text-night-blue/40 dark:text-cream/40 font-bold block mb-3">
                  {content.related}
                </span>
                <div className="flex flex-wrap gap-3">
                  {topic.relatedTopics.map(relSlug => {
                    const relTopic = topics.find(t => t.slug === relSlug);
                    if (!relTopic) return null;
                    return (
                      <button
                        key={relSlug}
                        onClick={() => window.location.hash = `#awareness/${relSlug}`}
                        className="px-4 py-2 border border-border-light dark:border-border-dark hover:border-marigold text-xs font-semibold rounded-sm transition-colors text-night-blue dark:text-cream cursor-pointer bg-cream-dark/10 dark:bg-night-blue/10"
                      >
                        {relTopic.title[language] || relTopic.title.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sources & Citations */}
            <div className="border-t border-border-light dark:border-border-dark pt-8 my-8 text-[11px] font-light text-night-blue/50 dark:text-cream/40 leading-relaxed">
              <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-marigold/60 block mb-3">
                {content.sources}
              </span>
              <ul className="list-decimal list-inside space-y-1">
                {topic.sources.map((src, idx) => (
                  <li key={idx}>
                    {src.title} ({src.year})
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation buttons: Prev / Next */}
            <div className="flex justify-between items-center border-t border-border-light dark:border-border-dark pt-6 mt-12">
              <button
                onClick={() => window.location.hash = `#awareness/${prevTopic.slug}`}
                className="text-xs uppercase tracking-wider font-semibold text-night-blue/60 dark:text-cream/50 hover:text-marigold transition-colors"
              >
                ← {prevTopic.title[language] || prevTopic.title.en}
              </button>
              <button
                onClick={() => window.location.hash = `#awareness/${nextTopic.slug}`}
                className="text-xs uppercase tracking-wider font-semibold text-night-blue/60 dark:text-cream/50 hover:text-marigold transition-colors"
              >
                {nextTopic.title[language] || nextTopic.title.en} →
              </button>
            </div>
          </main>

          {/* Footer bar */}
          <footer className="py-6 border-t border-border-light dark:border-border-dark text-[10px] text-center text-night-blue/40 dark:text-cream/30 px-6">
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
