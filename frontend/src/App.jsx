import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import TrustImpactBand from './components/landing/TrustImpactBand';
import WhatWeOffer from './components/landing/WhatWeOffer';
import HowItWorks from './components/landing/HowItWorks';
import WhyItMatters from './components/landing/WhyItMatters';
import ForInstitutions from './components/landing/ForInstitutions';
import RealImpact from './components/landing/RealImpact';
import TrustedResources from './components/landing/TrustedResources';
import TestimonialsSection from './components/landing/TestimonialsSection';
import FAQSection from './components/landing/FAQSection';
import FinalCTA from './components/landing/FinalCTA';
import Footer from './components/landing/Footer';
import SymptomAssessment from './pages/SymptomAssessment';
import Resources from './pages/Resources';
import Support from './pages/Support';
import Settings from './pages/Settings';
import { Login, Signup, ForgotPassword } from './pages/AuthPages';
import History from './pages/History';
import ReportViewer from './pages/ReportViewer';
import Dashboard from './pages/Dashboard';
import MyProgress from './pages/MyProgress';
import SharedReportViewer from './pages/SharedReportViewer';
import SemenReport from './pages/SemenReport';
import { getAuthenticatedEntryRoute } from './utils/navigation';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState('landing');
  const [sharedToken, setSharedToken] = useState(null);
  const [discreetHidden, setDiscreetHidden] = useState(false);

  useEffect(() => {
    if (loading) return;

    let isSubscribed = true;

    const handleHashChange = async () => {
      const hash = window.location.hash;
      const cleanHash = hash.split('?')[0];

      // Define routes requiring authentication
      const protectedHashes = ['#assess', '#dashboard', '#profile', '#settings', '#history', '#report', '#reports', '#progress', '#resources', '#resource', '#support', '#semen-report'];
      const isProtected = protectedHashes.some(h => cleanHash.startsWith(h));
      // Reset discreet mode on page change
      setDiscreetHidden(false);

      if (isProtected && !isAuthenticated) {
        sessionStorage.setItem('mantra_auth_redirect', hash);
        window.location.hash = '#login';
        return;
      }

      if (hash === '#dashboard') {
        setPage('dashboard');
      } else if (hash === '#assess') {
        setPage('assess');
      } else if (cleanHash === '#resources' || cleanHash.startsWith('#resources') || cleanHash === '#resource' || cleanHash.startsWith('#resource') || cleanHash.startsWith('#awareness')) {
        setPage('resources');
      } else if (cleanHash === '#support' || cleanHash.startsWith('#support')) {
        setPage('support');
      } else if (cleanHash === '#settings' || cleanHash.startsWith('#settings') || cleanHash === '#profile') {
        setPage('settings');
      } else if (hash === '#login' || hash === '#signup') {
        if (isAuthenticated) {
          const target = await getAuthenticatedEntryRoute();
          if (isSubscribed) {
            window.location.hash = target;
          }
        } else {
          setPage(hash === '#signup' ? 'signup' : 'login');
        }
      } else if (hash === '#forgot-password') {
        setPage('forgot-password');
      } else if (hash === '#history' || hash === '#reports' || hash.startsWith('#reports')) {
        setPage('history');
      } else if (hash === '#progress' || hash.startsWith('#progress')) {
        setPage('progress');
      } else if (hash === '#semen-report' || hash.startsWith('#semen-report')) {
        setPage('semen-report');
      } else if (cleanHash.startsWith('#shared')) {
        const token = hash.includes('/') ? hash.split('/')[1] : hash.replace('#shared', '');
        setSharedToken(token);
        setPage('shared');
      } else if (hash.startsWith('#report')) {
        setPage('report');
      } else {
        setPage('landing');
      }
      window.scrollTo(0, 0);
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);

    // Discreet Mode: double-Escape key to show neutral screen or custom event
    let escPresses = 0;
    let escTimer = null;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        escPresses += 1;
        clearTimeout(escTimer);
        escTimer = setTimeout(() => { escPresses = 0; }, 500);
        if (escPresses >= 2) {
          setDiscreetHidden(true);
          escPresses = 0;
        }
      }
    };
    const handleQuickHideTrigger = () => setDiscreetHidden(true);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('mantra-quick-hide', handleQuickHideTrigger);

    return () => {
      isSubscribed = false;
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('mantra-quick-hide', handleQuickHideTrigger);
      clearTimeout(escTimer);
    };
  }, [isAuthenticated, loading]);

  const handleNavigateHome = () => { window.location.hash = ''; };

  if (loading) {
    return (
      <div className="bg-[#FAF8F5] dark:bg-[#0E121A] min-h-screen flex flex-col items-center justify-center font-sans text-[#D25619] uppercase tracking-widest text-xs font-bold">
        <span>MantraAI Secure Gateway...</span>
      </div>
    );
  }

  // ── Discreet Mode Neutral Screen ──────────────────────────────────────────
  if (discreetHidden) {
    return (
      <div
        id="discreet-overlay"
        className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 select-none"
        style={{ fontFamily: 'sans-serif' }}
      >
        <h1 style={{ fontSize: 22, color: '#374151', fontWeight: 600 }}>New Tab</h1>
        <p style={{ fontSize: 13, color: '#6B7280' }}>Press any key or click below to return.</p>
        <button
          id="discreet-return-btn"
          onClick={() => setDiscreetHidden(false)}
          style={{
            marginTop: 8,
            padding: '8px 20px',
            background: '#374151',
            color: 'white',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Return to MantraAI
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#0E121A] min-h-screen text-[#1C1917] dark:text-[#F5F2EB] font-sans antialiased selection:bg-[#FCD8BE] selection:text-[#D25619] transition-colors duration-300">
      {page === 'dashboard' ? (
        <Dashboard onNavigateHome={handleNavigateHome} />
      ) : page === 'assess' ? (
        <SymptomAssessment onNavigateHome={handleNavigateHome} />
      ) : page === 'resources' ? (
        <Resources onNavigateHome={handleNavigateHome} />
      ) : page === 'support' ? (
        <Support onNavigateHome={handleNavigateHome} />
      ) : page === 'login' ? (
        <Login />
      ) : page === 'signup' ? (
        <Signup />
      ) : page === 'forgot-password' ? (
        <ForgotPassword />
      ) : page === 'settings' || page === 'profile' ? (
        <Settings onNavigateHome={handleNavigateHome} />
      ) : page === 'history' ? (
        <History onNavigateHome={handleNavigateHome} />
      ) : page === 'progress' ? (
        <MyProgress onNavigateHome={handleNavigateHome} />
      ) : page === 'semen-report' ? (
        <SemenReport onNavigateHome={handleNavigateHome} />
      ) : page === 'report' ? (
        <ReportViewer onNavigateHome={handleNavigateHome} onQuickHide={() => setDiscreetHidden(true)} />
      ) : page === 'shared' ? (
        <SharedReportViewer token={sharedToken} onNavigateHome={handleNavigateHome} />
      ) : (
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Hero />
            <TrustImpactBand />
            <HowItWorks />
            <WhatWeOffer />
            <WhyItMatters />
            <ForInstitutions />
            <RealImpact />
            <TrustedResources />
            <TestimonialsSection />
            <FAQSection />
            <FinalCTA />
          </main>
          <Footer />
        </div>
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
