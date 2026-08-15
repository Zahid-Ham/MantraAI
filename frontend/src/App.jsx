import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { Login, Signup, ForgotPassword } from './pages/AuthPages';
import Profile from './pages/Profile';
import History from './pages/History';
import ReportViewer from './pages/ReportViewer';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState('landing');
  const [topicSlug, setTopicSlug] = useState(null);
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    if (loading) return;

    const handleHashChange = () => {
      const hash = window.location.hash;
      const cleanHash = hash.split('?')[0];

      // Define routes requiring authentication
      const protectedHashes = ['#assess', '#profile', '#history', '#report'];
      const isProtected = protectedHashes.some(h => cleanHash.startsWith(h));

      if (isProtected && !isAuthenticated) {
        sessionStorage.setItem('mantra_auth_redirect', hash);
        window.location.hash = '#login';
        return;
      }

      if (hash === '#assess') {
        setPage('assess');
      } else if (hash.startsWith('#awareness')) {
        setPage('awareness');
        const parts = hash.replace('#awareness/', '').split('?')[0].split('/');
        setTopicSlug(parts[0] || null);
      } else if (hash === '#login') {
        if (isAuthenticated) {
          window.location.hash = '#assess';
        } else {
          setPage('login');
        }
      } else if (hash === '#signup') {
        if (isAuthenticated) {
          window.location.hash = '#assess';
        } else {
          setPage('signup');
        }
      } else if (hash === '#forgot-password') {
        setPage('forgot-password');
      } else if (hash === '#profile') {
        setPage('profile');
      } else if (hash === '#history') {
        setPage('history');
      } else if (hash.startsWith('#report')) {
        setPage('report');
      } else {
        setPage('landing');
      }
      window.scrollTo(0, 0);
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated, loading]);

  const handleNavigateHome = () => { window.location.hash = ''; };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  if (loading) {
    return (
      <div className="bg-cream dark:bg-night-dark min-h-screen flex flex-col items-center justify-center font-grotesk text-marigold uppercase tracking-widest text-xs font-bold animate-pulse">
        <span>MantraAI Secure Gateway...</span>
      </div>
    );
  }

  // If directly visiting #assess or #awareness, skip the loader
  const showLoader = page === 'landing' && !loaderDone;

  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk antialiased transition-colors duration-500">
      {/* Custom bioluminescent pointer */}
      <CustomCursor />

      {/* Page entry loader (only on first landing page visit) */}
      {showLoader && (
        <PageLoader onComplete={() => setLoaderDone(true)} />
      )}

      {page === 'assess' ? (
        <SymptomAssessment onNavigateHome={handleNavigateHome} />
      ) : page === 'awareness' ? (
        <Awareness topicSlug={topicSlug} onNavigateHome={handleNavigateHome} />
      ) : page === 'login' ? (
        <Login />
      ) : page === 'signup' ? (
        <Signup />
      ) : page === 'forgot-password' ? (
        <ForgotPassword />
      ) : page === 'profile' ? (
        <Profile onNavigateHome={handleNavigateHome} />
      ) : page === 'history' ? (
        <History onNavigateHome={handleNavigateHome} />
      ) : page === 'report' ? (
        <ReportViewer onNavigateHome={handleNavigateHome} />
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
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
