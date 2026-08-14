import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Hero from './components/landing/Hero';
import ProblemSection from './components/landing/ProblemSection';
import ModulePreview from './components/landing/ModulePreview';
import TrustSection from './components/landing/TrustSection';
import ResearchSection from './components/landing/ResearchSection';
import Footer from './components/landing/Footer';
import CustomCursor from './components/landing/CustomCursor';
import ScrollNarrative from './components/landing/ScrollNarrative';
import PageLoader from './components/landing/PageLoader';
import SymptomAssessment from './pages/SymptomAssessment';
import Awareness from './pages/Awareness';

function AppContent() {
  // Sync page state and subpath topic slugs with URL hash
  const [page, setPage] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#assess') return 'assess';
    if (hash.startsWith('#awareness')) return 'awareness';
    return 'landing';
  });

  const [topicSlug, setTopicSlug] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#awareness/')) {
      const parts = hash.replace('#awareness/', '').split('?')[0].split('/');
      return parts[0] || null;
    }
    return null;
  });

  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#assess') {
        setPage('assess');
      } else if (hash.startsWith('#awareness')) {
        setPage('awareness');
        const parts = hash.replace('#awareness/', '').split('?')[0].split('/');
        setTopicSlug(parts[0] || null);
      } else {
        setPage('landing');
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigateHome = () => { window.location.hash = ''; };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // If directly visiting #assess or #awareness, skip the loader
  const showLoader = page === 'landing' && !loaderDone;

  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk antialiased transition-colors duration-500">
      {/* Custom bioluminescent sperm pointer */}
      <CustomCursor />

      {/* Page entry loader (only on first landing page visit) */}
      {showLoader && (
        <PageLoader onComplete={() => setLoaderDone(true)} />
      )}

      {page === 'assess' ? (
        <SymptomAssessment onNavigateHome={handleNavigateHome} />
      ) : page === 'awareness' ? (
        <Awareness topicSlug={topicSlug} onNavigateHome={handleNavigateHome} />
      ) : (
        <>
          {/* Saffron top scroll-progress bar */}
          <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] bg-marigold z-50 origin-left"
            style={{ scaleX }}
          />

          {/* Biological journey scroll narrative — right side */}
          <ScrollNarrative />

          <Hero />
          <ProblemSection />
          <ModulePreview />
          <TrustSection />
          <ResearchSection />
          <Footer />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
