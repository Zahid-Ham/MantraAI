import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { assessmentSchema } from '../data/assessmentSchema';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import AssessmentIntro from '../components/assessment/AssessmentIntro';
import AssessmentProgress from '../components/assessment/AssessmentProgress';
import AssessmentSection from '../components/assessment/AssessmentSection';
import QuestionCard from '../components/assessment/QuestionCard';
import AssessmentNavigation from '../components/assessment/AssessmentNavigation';
import WhyWeAsk from '../components/assessment/WhyWeAsk';

export default function SymptomAssessment({ onNavigateHome }) {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Wizard state machine with browser-level storage persistence
  const [step, setStep] = useState('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isWhyAskOpen, setIsWhyAskOpen] = useState(false);

  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [recoverySession, setRecoverySession] = useState(null);

  const { questions, blocks } = assessmentSchema;

  // Sync state variables to browser storage (as backup/scratchpad)
  useEffect(() => {
    localStorage.setItem('mantra_assessment_step', step);
  }, [step]);

  useEffect(() => {
    localStorage.setItem('mantra_assessment_question_idx', currentQuestionIndex);
  }, [currentQuestionIndex]);

  useEffect(() => {
    localStorage.setItem('mantra_assessment_answers', JSON.stringify(answers));
  }, [answers]);

  // Session Recovery & Initialization Lifecycle
  useEffect(() => {
    const checkActiveSession = async () => {
      const activeId = localStorage.getItem('mantra_active_assessment_id');
      if (activeId) {
        try {
          const data = await apiRequest(`/api/v1/assessments/${activeId}/responses`);
          if (data && data.responses) {
            setAnswers(data.responses);
            const unansweredIdx = questions.findIndex(q => data.responses[q.id] === undefined);
            if (unansweredIdx !== -1) {
              setCurrentQuestionIndex(unansweredIdx);
              setStep('questions');
            } else {
              setStep('questions');
            }
          }
          return;
        } catch (e) {
          console.error("Failed to load active session answers:", e);
        }
      }

      // Check for any in-progress sessions in backend database
      try {
        const activeSessions = await apiRequest('/api/v1/assessments');
        const inProgress = activeSessions.find(s => s.status === 'IN_PROGRESS');
        if (inProgress) {
          setRecoverySession(inProgress);
          setShowResumePrompt(true);
        } else {
          await startNewSession();
        }
      } catch (err) {
        console.error("Failed to fetch sessions from server:", err);
        // Fallback: start session locally if server is offline
        localStorage.setItem('mantra_active_assessment_id', 'offline_session_fallback');
      }
    };

    checkActiveSession();
  }, []);

  const startNewSession = async () => {
    try {
      const sess = await apiRequest('/api/v1/assessments', {
        method: "POST",
        body: JSON.stringify({ assessment_version: "1.0" })
      });
      localStorage.setItem('mantra_active_assessment_id', sess.id);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setStep('intro');
    } catch (e) {
      console.error("Failed to start new session on server:", e);
    }
  };

  const resumeSession = async (sessId) => {
    localStorage.setItem('mantra_active_assessment_id', sessId);
    try {
      const data = await apiRequest(`/api/v1/assessments/${sessId}/responses`);
      if (data && data.responses) {
        setAnswers(data.responses);
        const unansweredIdx = questions.findIndex(q => data.responses[q.id] === undefined);
        setCurrentQuestionIndex(unansweredIdx !== -1 ? unansweredIdx : 0);
      }
      setStep('questions');
    } catch (e) {
      console.error("Failed to resume session answers:", e);
    } finally {
      setShowResumePrompt(false);
    }
  };

  // Clean persistent memory when navigating home or finishing
  const handleHomeClear = () => {
    localStorage.removeItem('mantra_assessment_step');
    localStorage.removeItem('mantra_assessment_question_idx');
    localStorage.removeItem('mantra_assessment_answers');
    localStorage.removeItem('mantra_active_assessment_id');
    onNavigateHome();
  };
  
  // Section transition wizard states
  const [activeTransition, setActiveTransition] = useState(null); // null | { title, text }

  const [reportData, setReportData] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [loadingStage, setLoadingStage] = useState(0);

  const loadingStages = [
    { en: "Reviewing your responses", hi: "आपकी प्रतिक्रियाओं की समीक्षा की जा रही है" },
    { en: "Mapping wellness patterns", hi: "कल्याण पैटर्न का मानचित्रण किया जा रहा है" },
    { en: "Reviewing reproductive and sexual health factors", hi: "प्रजनन और यौन स्वास्थ्य कारकों की समीक्षा की जा रही है" },
    { en: "Preparing your personalized report", hi: "आपकी व्यक्तिगत रिपोर्ट तैयार की जा रही है" }
  ];

  const handleSubmitAnswers = async () => {
    setStep('loading_report');
    setReportError(null);
    setLoadingStage(0);
    
    const stageInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < loadingStages.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    const activeId = localStorage.getItem('mantra_active_assessment_id');

    try {
      if (activeId && activeId !== 'offline_session_fallback') {
        // 1. Submit final responses to database
        await apiRequest(`/api/v1/assessments/${activeId}/responses`, {
          method: "POST",
          body: JSON.stringify({ responses: answers })
        });

        // 2. Complete session
        await apiRequest(`/api/v1/assessments/${activeId}/complete`, {
          method: "POST"
        });

        clearInterval(stageInterval);
        
        // Clear wizard keys on completion
        localStorage.removeItem('mantra_active_assessment_id');
        localStorage.removeItem('mantra_assessment_step');
        localStorage.removeItem('mantra_assessment_question_idx');
        localStorage.removeItem('mantra_assessment_answers');
        
        // Redirect user directly to the new Report Viewer
        window.location.hash = `#report?id=${activeId}`;
      } else {
        throw new Error("No active assessment session ID set.");
      }
    } catch (err) {
      console.error("Report generation error:", err);
      setReportError(language === 'en' 
        ? "We couldn't compile your wellness analysis report. Please try again."
        : "हम आपकी रिपोर्ट संकलित नहीं कर सके। कृपया पुनः प्रयास करें।"
      );
      setStep('error');
    } finally {
      clearInterval(stageInterval);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const activeBlock = currentQuestion 
    ? blocks.find(b => b.id === currentQuestion.block)
    : null;

  // Track dynamic estimated remaining time (approx 10s per question)
  const estTimeRemaining = Math.max(1, Math.ceil((questions.length - currentQuestionIndex) * 0.15));

  // Handle section transition logic before entering specific blocks
  const checkTransition = (nextIdx) => {
    const nextQ = questions[nextIdx];
    const nextBlockId = nextQ.block;
    const currBlockId = currentQuestion.block;

    // Check boundary triggers
    if (nextBlockId !== currBlockId) {
      if (nextBlockId === 2) {
        return {
          title: { en: "LIFESTYLE", hi: "जीवनशैली आदतें" },
          text: { 
            en: "Some everyday patterns can influence reproductive wellbeing.", 
            hi: "कुछ दैनिक आदतें और जीवनशैली पैटर्न प्रजनन कल्याण को प्रभावित कर सकते हैं।" 
          }
        };
      }
      if (nextBlockId === 6) {
        return {
          title: { en: "MENTAL WELLNESS", hi: "मानसिक कल्याण" },
          text: { 
            en: "Health isn't only physical. Stress, sleep, and emotional wellbeing can interact with sexual and reproductive health.", 
            hi: "स्वास्थ्य केवल शारीरिक नहीं है। तनाव, नींद और भावनात्मक कल्याण यौन और प्रजनन स्वास्थ्य को प्रभावित कर सकते हैं।" 
          }
        };
      }
      if (nextBlockId === 7) {
        return {
          title: { en: "REPRODUCTIVE HEALTH", hi: "प्रजनन स्वास्थ्य" },
          text: { 
            en: "These questions help us understand symptoms and history that may warrant additional attention.", 
            hi: "ये प्रश्न हमें उन लक्षणों और पूर्व इतिहास को समझने में मदद करते हैं जिन पर अतिरिक्त ध्यान देने की आवश्यकता हो सकती है।" 
          }
        };
      }
    }
    return null;
  };

  // Helper to determine if a question should be bypassed conditionally
  const shouldSkipQuestion = (q, currentAnswers) => {
    if (!q) return false;
    // Skip relationship satisfaction if the user selected 'Single' as relationship_status
    if (q.id === 'relationship_satisfaction' && currentAnswers['relationship_status'] === 'Single') {
      return true;
    }
    // Skip subsequent performance anxiety questions in Block 10 if user is not sexually active
    if (q.block === 10 && q.id !== 'anticipatory_anxiety_before_sex') {
      if (currentAnswers['anticipatory_anxiety_before_sex'] === 'never_had_sex') {
        return true;
      }
    }
    // Skip masturbation detail questions if frequency is "Never"
    const masturbationDetails = [
      'masturbation_control',
      'masturbation_functional_impact',
      'masturbation_physical_discomfort',
      'masturbation_emotional_coping'
    ];
    if (masturbationDetails.includes(q.id) && currentAnswers['masturbation_frequency'] === 'Never') {
      return true;
    }
    // Skip partnered sex details if no partnered history
    const partneredSexDetails = [
      'recent_partnered_sex',
      'partnered_sexual_difficulty'
    ];
    if (partneredSexDetails.includes(q.id)) {
      const history = currentAnswers['partnered_sexual_history'];
      if (history === 'No' || history === 'prefer_not_to_say') {
        return true;
      }
    }
    return false;
  };

  // Redirect if currently landed on a skipped question
  useEffect(() => {
    if (step === 'questions' && currentQuestion && shouldSkipQuestion(currentQuestion, answers)) {
      let nextIdx = currentQuestionIndex + 1;
      while (nextIdx < questions.length && shouldSkipQuestion(questions[nextIdx], answers)) {
        nextIdx++;
      }
      if (nextIdx < questions.length) {
        setCurrentQuestionIndex(nextIdx);
      } else {
        setStep('complete');
      }
    }
  }, [currentQuestionIndex, answers, step]);

  // Answer change handler
  const handleAnswerChange = (val) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: val
    }));
  };

  const handleStart = () => {
    setStep('questions');
  };

  const handleNext = async () => {
    // Progressive save answers before moving forward to the next index
    const activeId = localStorage.getItem('mantra_active_assessment_id');
    if (activeId && activeId !== 'offline_session_fallback') {
      try {
        await apiRequest(`/api/v1/assessments/${activeId}/responses`, {
          method: "POST",
          body: JSON.stringify({ responses: answers })
        });
      } catch (err) {
        console.error("Progressive save failed:", err);
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      let nextIdx = currentQuestionIndex + 1;
      while (nextIdx < questions.length && shouldSkipQuestion(questions[nextIdx], answers)) {
        nextIdx++;
      }

      if (nextIdx < questions.length) {
        const transitionData = checkTransition(nextIdx);
        if (transitionData) {
          setActiveTransition({
            ...transitionData,
            nextIndex: nextIdx
          });
        } else {
          setCurrentQuestionIndex(nextIdx);
        }
      } else {
        handleSubmitAnswers();
      }
    } else {
      handleSubmitAnswers();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      let prevIdx = currentQuestionIndex - 1;
      while (prevIdx >= 0 && shouldSkipQuestion(questions[prevIdx], answers)) {
        prevIdx--;
      }

      if (prevIdx >= 0) {
        setCurrentQuestionIndex(prevIdx);
      } else {
        setStep('intro');
      }
    } else {
      setStep('intro');
    }
  };

  const handleProceedTransition = () => {
    if (activeTransition) {
      setCurrentQuestionIndex(activeTransition.nextIndex);
      setActiveTransition(null);
    }
  };

  // Content translations
  const content = {
    en: {
      clinical: "IN / CLINICAL",
      makeInIndia: "MADE IN INDIA",
      homeBtn: "Return to Home",
      completeTitle: "Assessment Complete",
      completeSubtitle: "Your screening inputs have been securely compiled.",
      completeDesc: "MantraAI operates in a secure sandbox. In future phases, these parameters will feed localized risk models to generate custom health trends.",
      shielded: "SHIELDED BY DESIGN / SECURE",
      platform: "MANTRA CLINICAL PLATFORM v1.0.0",
      privateAssessment: "Private Assessment",
      timeEst: "Est. remaining time",
      mins: "mins",
      proceed: "Proceed to Questions",
      discretionNote: "Take your time. Your responses are private."
    },
    hi: {
      clinical: "भारत / नैदानिक",
      makeInIndia: "मेक इन इंडिया",
      homeBtn: "मुख्य पृष्ठ पर लौटें",
      completeTitle: "मूल्यांकन पूर्ण हुआ",
      completeSubtitle: "आपके स्क्रीनिंग उत्तर सुरक्षित रूप से दर्ज कर लिए गए हैं।",
      completeDesc: "मंत्रएआई (MantraAI) एक सुरक्षित सैंडबॉक्स वातावरण में काम करता है। अगले चरणों में, इन मापदंडों का उपयोग स्थानीयकृत स्वास्थ्य प्रवृत्तियों को उत्पन्न करने के लिए किया जाएगा।",
      shielded: "सुरक्षित डिजाइन / सुरक्षित वातावरण",
      platform: "मंत्र क्लीनिकल प्लेटफॉर्म v1.0.0",
      privateAssessment: "निजी स्वास्थ्य जांच",
      timeEst: "अनुमानित शेष समय",
      mins: "मिनट",
      proceed: "प्रश्नों पर आगे बढ़ें",
      discretionNote: "समय लें। आपकी प्रतिक्रियाएं पूरी तरह से सुरक्षित हैं।"
    }
  }[language];

  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-between transition-colors duration-500 overflow-x-hidden relative">
      
      {/* Background Jali geometric screen texture inside assessment */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] text-night-blue dark:text-cream z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="jali-assessment" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 0 30 L 30 0 L 60 30 L 30 60 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#jali-assessment)" />
        </svg>
      </div>

      {/* Database Session Recovery Prompter Overlay */}
      {showResumePrompt && recoverySession && (
        <div className="fixed inset-0 bg-night-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full border border-border-light dark:border-border-dark bg-cream dark:bg-night-blue p-8 rounded-sm space-y-6 shadow-xl relative">
            <div className="text-center space-y-2 select-none">
              <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-2.5 py-0.5 font-bold tracking-[0.2em] rounded-sm uppercase inline-block">
                Session Recovery
              </span>
              <h2 className="font-serif text-2xl font-normal text-night-blue dark:text-cream">
                Incomplete Assessment
              </h2>
              <p className="text-xs text-night-blue/50 dark:text-cream/50 leading-relaxed">
                We identified a pending, incomplete assessment session on your profile. Would you like to resume it now or start a new one?
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => resumeSession(recoverySession.id)}
                className="w-full py-3 bg-marigold hover:bg-marigold-light text-night-blue text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                Resume Progress
              </button>
              <button
                onClick={async () => {
                  setShowResumePrompt(false);
                  await startNewSession();
                }}
                className="w-full py-3 border border-border-light dark:border-border-dark hover:border-marigold text-xs font-semibold uppercase tracking-wider rounded-sm transition-all bg-transparent text-night-blue dark:text-cream cursor-pointer"
              >
                Start New Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header bar - Compact py spacing */}
      <header className="relative z-10 w-full flex justify-between items-center border-b border-border-light dark:border-border-dark px-6 py-3.5 md:px-16 select-none bg-cream/95 dark:bg-night-dark/95 backdrop-blur-xs transition-colors duration-500">
        <div 
          onClick={handleHomeClear}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-1.5 py-0.5 font-medium tracking-widest rounded-sm">मंत्र</span>
          <span className="font-grotesk font-bold text-xl tracking-wider text-night-blue dark:text-cream">
            MANTRA<span className="text-marigold">.AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <span className="text-[10px] border border-ashoka-green-light dark:border-ashoka-green text-ashoka-green dark:text-ashoka-green-light bg-ashoka-green/5 font-semibold px-2 py-0.5 font-grotesk tracking-widest uppercase rounded-sm">
            {content.makeInIndia}
          </span>

          <button 
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 text-[11px] border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 bg-cream-dark/40 dark:bg-night-blue/50 rounded-sm font-grotesk font-semibold tracking-wider cursor-pointer text-night-blue dark:text-cream"
          >
            {language === 'en' ? 'हिन्दी' : 'EN'}
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2 border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 bg-cream-dark/40 dark:bg-night-blue/50 rounded-sm cursor-pointer"
            aria-label="Toggle theme"
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

          {isAuthenticated ? (
            <div className="flex items-center gap-3 border-l border-border-light dark:border-border-dark pl-4 select-none font-grotesk">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[9px] uppercase tracking-wider text-night-blue/40 dark:text-cream/40 font-bold">Logged in</span>
                <span className="text-[10px] font-semibold text-night-blue/80 dark:text-cream/80 max-w-[120px] truncate">{user?.email}</span>
              </div>
              <button 
                onClick={() => window.location.hash = '#profile'}
                className="px-2.5 py-1.5 text-[11px] border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 bg-cream-dark/40 dark:bg-night-blue/50 rounded-sm font-semibold tracking-wider cursor-pointer text-night-blue dark:text-cream"
              >
                Profile
              </button>
            </div>
          ) : (
            <button 
              onClick={() => window.location.hash = '#login'}
              className="px-2.5 py-1.5 text-[11px] border border-border-light dark:border-border-dark hover:border-marigold transition-colors duration-300 bg-cream-dark/40 dark:bg-night-blue/50 rounded-sm font-semibold tracking-wider cursor-pointer text-night-blue dark:text-cream"
            >
              Sign In
            </button>
          )}

          <div className="text-xs uppercase tracking-widest text-night-blue/60 dark:text-cream/60 font-semibold font-grotesk hidden sm:block">
            {content.clinical}
          </div>
        </div>
      </header>

      {/* Main wizard wrapper */}
      <main className="flex-grow w-full py-5 px-6 md:px-16 relative z-10">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <AssessmentIntro key="intro" onStart={handleStart} />
          )}

          {step === 'questions' && (
            <div key="questions" className="w-full max-w-6xl mx-auto">
              
              {/* Top info and dynamic timing indicators - minimal mb */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-3.5 gap-4 border-b border-border-light dark:border-border-dark pb-3.5">
                <div>
                  <h3 className="font-serif text-xl font-normal text-night-blue dark:text-cream">
                    {content.privateAssessment}
                  </h3>
                  <span className="font-grotesk text-[10px] uppercase tracking-wider text-night-blue/40 dark:text-cream/40">
                    {content.discretionNote}
                  </span>
                </div>
                <div className="text-right sm:text-right">
                  <span className="font-grotesk text-xs text-night-blue/50 dark:text-cream/50 block">
                    {content.timeEst}:
                  </span>
                  <span className="font-grotesk text-sm font-semibold text-marigold">
                    ~{estTimeRemaining} {content.mins}
                  </span>
                </div>
              </div>

              {/* Interstitial Section Transitions */}
              <AnimatePresence mode="wait">
                {activeTransition ? (
                  <motion.div
                    key="transition"
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-xl mx-auto text-center py-16 px-6 bg-cream dark:bg-night-blue border border-border-light dark:border-border-dark rounded-sm"
                  >
                    <span className="text-marigold font-grotesk text-xs font-semibold tracking-[0.25em] uppercase mb-4 block">
                      {activeTransition.title[language]}
                    </span>
                    <h2 className="font-serif text-3xl md:text-4.5xl font-normal text-night-blue dark:text-cream mb-8 tracking-tight">
                      {activeTransition.text[language]}
                    </h2>
                    <button
                      onClick={handleProceedTransition}
                      className="px-8 py-4 bg-marigold hover:bg-marigold-light text-night-blue font-grotesk font-semibold text-xs uppercase tracking-wider transition-colors duration-300 rounded-sm cursor-pointer shadow-lg shadow-marigold/5"
                    >
                      {content.proceed}
                    </button>
                  </motion.div>
                ) : (
                  /* Three-column premium wizard view */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Index sidebar - minimal padding */}
                    <aside className="lg:col-span-3 border-r border-border-light dark:border-border-dark pr-6 hidden lg:block font-grotesk text-[10px] uppercase tracking-wider select-none space-y-2 pt-1">
                      {blocks.map(b => {
                        const isActive = b.id === activeBlock?.id;
                        const isVisited = b.id < (activeBlock?.id || 1);
                        const blockName = b.name[language] || b.name.en;
                        
                        return (
                          <div 
                            key={b.id} 
                            className={`flex items-center gap-3 transition-colors duration-300 py-1 ${
                              isActive 
                                ? "text-marigold font-bold border-l-2 border-marigold pl-3" 
                                : isVisited 
                                  ? "text-ashoka-green dark:text-ashoka-green-light pl-3 opacity-80" 
                                  : "text-night-blue/30 dark:text-cream/25 pl-3"
                            }`}
                          >
                            <span className="font-mono">{String(b.id).padStart(2, '0')}</span>
                            <span className="truncate max-w-[150px]">{blockName}</span>
                          </div>
                        );
                      })}
                    </aside>

                    {/* Center Column: Core Question card */}
                    <div className="lg:col-span-9 flex flex-col items-center">
                      <AssessmentProgress currentBlock={currentQuestion.block} />
                      <AssessmentSection blockData={activeBlock} />
                      
                      <QuestionCard 
                        questionData={currentQuestion}
                        currentAnswer={answers[currentQuestion.id]}
                        onAnswerChange={handleAnswerChange}
                        onAutoAdvance={handleNext}
                        index={questions.filter(q => q.block === currentQuestion.block && !shouldSkipQuestion(q, answers)).indexOf(currentQuestion) + 1}
                        totalQuestions={questions.filter(q => q.block === currentQuestion.block && !shouldSkipQuestion(q, answers)).length}
                        onWhyAskClick={() => setIsWhyAskOpen(true)}
                      />

                      <AssessmentNavigation 
                        onBack={handleBack}
                        onNext={handleNext}
                        canGoBack={true}
                        canGoNext={answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== ""}
                        isLast={currentQuestionIndex === questions.length - 1}
                        isOptional={currentQuestion.sensitivity}
                        autoAdvanceTypes={['radio', 'segmented']}
                        questionType={currentQuestion.type}
                      />
                    </div>

                  </div>
                )}
              </AnimatePresence>

            </div>
          )}

          {step === 'loading_report' && (
            <div className="max-w-md mx-auto text-center py-16 px-6 font-grotesk">
              <div className="w-14 h-14 border-4 border-marigold border-t-transparent rounded-full animate-spin mx-auto mb-8" />
              <h3 className="font-serif text-2.5xl text-night-blue dark:text-cream mb-3">
                {language === 'en' ? "Compiling Wellness Report" : "कल्याण रिपोर्ट संकलित की जा रही है"}
              </h3>
              <p className="text-marigold font-semibold text-xs tracking-wider uppercase mb-2">
                {loadingStages[loadingStage][language]}
              </p>
              <span className="text-xs text-night-blue/50 dark:text-cream/45 italic leading-relaxed block max-w-xs mx-auto">
                {language === 'en' 
                  ? "MantraAI compiles variables privately. This is an AI-assisted screening assessment, not a clinical diagnosis."
                  : "मंत्रएआई निजी तौर पर मापदंडों का संकलन करता है। यह एक एआई-सहायता प्राप्त कल्याण रिपोर्ट है, नैदानिक ​​जांच नहीं।"}
              </span>
            </div>
          )}

          {step === 'error' && (
            <div className="max-w-md mx-auto text-center py-16 px-6 font-grotesk">
              <div className="w-16 h-16 bg-marigold/10 border border-marigold/20 text-marigold rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-serif text-2.5xl text-night-blue dark:text-cream mb-4">
                {language === 'en' ? "Generation Interrupted" : "रिपोर्ट संकलन बाधित हुआ"}
              </h3>
              <p className="text-sm text-night-blue/80 dark:text-cream/70 leading-relaxed mb-8">
                {reportError}
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={handleSubmitAnswers}
                  className="px-6 py-3.5 bg-marigold hover:bg-marigold-light text-night-blue font-grotesk font-semibold text-xs uppercase tracking-wider rounded-sm cursor-pointer shadow-lg shadow-marigold/10 transition-colors"
                >
                  {language === 'en' ? "Retry Generation" : "पुनः प्रयास करें"}
                </button>
                <button 
                  onClick={handleHomeClear}
                  className="px-6 py-3.5 border border-border-light dark:border-border-dark text-night-blue dark:text-cream hover:border-marigold font-grotesk font-semibold text-xs uppercase tracking-wider rounded-sm cursor-pointer transition-colors"
                >
                  {language === 'en' ? "Cancel & Return" : "रद्द करें और लौटें"}
                </button>
              </div>
            </div>
          )}

          {step === 'report' && reportData && (
            <motion.div 
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl mx-auto font-grotesk"
            >
              {/* Report Header */}
              <div className="border-b border-border-light dark:border-border-dark pb-8 mb-8 text-center sm:text-left select-none animate-fadeIn">
                <span className="text-marigold font-semibold text-[10px] tracking-[0.25em] uppercase block mb-3">MANTRA.AI</span>
                <h1 className="font-serif text-3.5xl md:text-5xl font-normal leading-tight text-night-blue dark:text-cream mb-2">
                  {language === 'en' ? "Your Private Wellness Report" : "आपकी व्यक्तिगत स्वास्थ्य रिपोर्ट"}
                </h1>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                  <span className="text-xs text-night-blue/50 dark:text-cream/45 uppercase tracking-wider bg-cream-dark/30 dark:bg-night-blue/40 px-3 py-1 rounded-sm">
                    {language === 'en' ? "Assessment Completed Securely" : "मूल्यांकन सुरक्षित रूप से पूर्ण"}
                  </span>
                  <button 
                    onClick={handleHomeClear}
                    className="text-xs underline font-semibold text-marigold hover:text-marigold-light transition-colors cursor-pointer"
                  >
                    {language === 'en' ? "Return to Home" : "मुख्य पृष्ठ पर लौटें"}
                  </button>
                </div>
              </div>

              {/* 1. Overview */}
              <div className="bg-cream-dark/25 dark:bg-night-blue/20 border border-border-light dark:border-border-dark p-6 md:p-8 mb-8 rounded-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 select-none">
                  <h4 className="font-serif text-2xl font-normal text-night-blue dark:text-cream">
                    {language === 'en' ? "Profile Summary" : "प्रोफ़ाइल सारांश"}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-night-blue/50 dark:text-cream/50 uppercase tracking-widest font-medium">
                      {language === 'en' ? "Overall Wellness:" : "समग्र स्वास्थ्य:"}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border ${
                      reportData.summary.overall_wellness_status === 'Stable' || reportData.summary.overall_wellness_status === 'Mostly stable'
                        ? "bg-ashoka-green/10 border-ashoka-green/20 text-ashoka-green dark:text-ashoka-green-light"
                        : reportData.summary.overall_wellness_status === 'Worth monitoring'
                          ? "bg-marigold/10 border-marigold/20 text-marigold"
                          : "bg-red-500/10 border-red-500/20 text-red-500"
                    }`}>
                      {reportData.summary.overall_wellness_status}
                    </span>
                  </div>
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-normal text-marigold mb-3 leading-snug">
                  "{reportData.summary.headline}"
                </h3>
                <p className="text-sm font-light text-night-blue/80 dark:text-cream/70 leading-relaxed">
                  {reportData.summary.overview}
                </p>
              </div>

              {/* 2. Key Findings */}
              {reportData.key_findings && reportData.key_findings.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-serif text-2.5xl font-normal text-night-blue dark:text-cream mb-6 select-none">
                    {language === 'en' ? "Key Findings" : "प्रमुख निष्कर्ष"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportData.key_findings.map((finding, idx) => (
                      <div key={idx} className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-baseline mb-3">
                            <h4 className="font-serif text-lg font-normal text-night-blue dark:text-cream">
                              {finding.title}
                            </h4>
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ${
                              finding.severity === 'notable' 
                                ? "bg-red-500/15 text-red-500"
                                : finding.severity === 'moderate'
                                  ? "bg-marigold/15 text-marigold"
                                  : "bg-ashoka-green/15 text-ashoka-green dark:text-ashoka-green-light"
                            }`}>
                              {finding.severity}
                            </span>
                          </div>
                          <p className="text-xs font-light text-night-blue/70 dark:text-cream/60 leading-relaxed mb-4">
                            {finding.explanation}
                          </p>
                        </div>
                        {finding.evidence && finding.evidence.length > 0 && (
                          <div className="border-t border-border-light dark:border-border-dark pt-3 mt-3">
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-night-blue/40 dark:text-cream/45 block mb-1">Evidence Indicators</span>
                            <ul className="list-disc list-inside text-[11px] font-medium text-night-blue/60 dark:text-cream/50 space-y-1">
                              {finding.evidence.map((ev, evIdx) => (
                                <li key={evIdx} className="truncate">{ev}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3, 4, 5. Health Pillars */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Reproductive Health */}
                <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm space-y-4">
                  <span className="text-[10px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2">
                    {language === 'en' ? "Reproductive Health" : "प्रजनन स्वास्थ्य"}
                  </span>
                  <p className="text-xs font-light text-night-blue/80 dark:text-cream/70 leading-relaxed">
                    {reportData.reproductive_health?.summary}
                  </p>
                  {reportData.reproductive_health?.areas_to_monitor && reportData.reproductive_health.areas_to_monitor.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-night-blue/40 dark:text-cream/45 block">Areas to Monitor</span>
                      <div className="flex flex-wrap gap-1.5">
                        {reportData.reproductive_health.areas_to_monitor.map((item, idx) => (
                          <span key={idx} className="text-[10px] bg-cream-dark/40 dark:bg-night-dark/30 px-2 py-0.5 rounded-xs text-night-blue/70 dark:text-cream/60">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sexual Health */}
                <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm space-y-4">
                  <span className="text-[10px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2">
                    {language === 'en' ? "Sexual Health & Wellbeing" : "यौन स्वास्थ्य व कल्याण"}
                  </span>
                  <p className="text-xs font-light text-night-blue/80 dark:text-cream/70 leading-relaxed">
                    {reportData.sexual_health?.summary}
                  </p>
                  {reportData.sexual_health?.areas_to_monitor && reportData.sexual_health.areas_to_monitor.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-night-blue/40 dark:text-cream/45 block">Areas to Monitor</span>
                      <div className="flex flex-wrap gap-1.5">
                        {reportData.sexual_health.areas_to_monitor.map((item, idx) => (
                          <span key={idx} className="text-[10px] bg-cream-dark/40 dark:bg-night-dark/30 px-2 py-0.5 rounded-xs text-night-blue/70 dark:text-cream/60">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mental Wellbeing */}
                <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm space-y-4">
                  <span className="text-[10px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2">
                    {language === 'en' ? "Mental Wellbeing" : "मानसिक स्वास्थ्य"}
                  </span>
                  <p className="text-xs font-light text-night-blue/80 dark:text-cream/70 leading-relaxed">
                    {reportData.mental_wellbeing?.summary}
                  </p>
                  {reportData.mental_wellbeing?.areas_to_monitor && reportData.mental_wellbeing.areas_to_monitor.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-night-blue/40 dark:text-cream/45 block">Areas to Monitor</span>
                      <div className="flex flex-wrap gap-1.5">
                        {reportData.mental_wellbeing.areas_to_monitor.map((item, idx) => (
                          <span key={idx} className="text-[10px] bg-cream-dark/40 dark:bg-night-dark/30 px-2 py-0.5 rounded-xs text-night-blue/70 dark:text-cream/60">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Lifestyle grid */}
              <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm mb-8">
                <span className="text-[10px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2 mb-4">
                  {language === 'en' ? "Lifestyle Parameters Profile" : "जीवनशैली आदतें प्रोफ़ाइल"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs leading-relaxed">
                  <div>
                    <span className="font-semibold text-night-blue/60 dark:text-cream/50 block mb-1">Sleep & Rest</span>
                    <p className="font-light text-night-blue/80 dark:text-cream/70">{reportData.lifestyle?.sleep}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-night-blue/60 dark:text-cream/50 block mb-1">Exercise & Movement</span>
                    <p className="font-light text-night-blue/80 dark:text-cream/70">{reportData.lifestyle?.exercise}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-night-blue/60 dark:text-cream/50 block mb-1">Diet & Nutrition</span>
                    <p className="font-light text-night-blue/80 dark:text-cream/70">{reportData.lifestyle?.diet}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-night-blue/60 dark:text-cream/50 block mb-1">Substances & Medication</span>
                    <p className="font-light text-night-blue/80 dark:text-cream/70">{reportData.lifestyle?.substance_use}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-night-blue/60 dark:text-cream/50 block mb-1">Heat Exposure</span>
                    <p className="font-light text-night-blue/80 dark:text-cream/70">{reportData.lifestyle?.heat_exposure}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-night-blue/60 dark:text-cream/50 block mb-1">Environmental Exposures</span>
                    <p className="font-light text-night-blue/80 dark:text-cream/70">{reportData.lifestyle?.environment}</p>
                  </div>
                </div>
              </div>

              {/* 7. Behavioral Patterns */}
              {reportData.behavioral_patterns && (
                <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm mb-8">
                  <span className="text-[10px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2 mb-4">
                    {language === 'en' ? "Behavioral & Coping Patterns" : "व्यवहार और तनाव प्रबंधन"}
                  </span>
                  <p className="text-xs font-light text-night-blue/80 dark:text-cream/70 mb-4 leading-relaxed">
                    {reportData.behavioral_patterns.summary}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                    {reportData.behavioral_patterns.patterns && reportData.behavioral_patterns.patterns.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-night-blue/40 dark:text-cream/45 block mb-1">Observed Patterns</span>
                        <ul className="list-disc list-inside text-night-blue/70 dark:text-cream/60 space-y-1">
                          {reportData.behavioral_patterns.patterns.map((item, idx) => <li key={idx} className="font-light">{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {reportData.behavioral_patterns.potential_triggers && reportData.behavioral_patterns.potential_triggers.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-night-blue/40 dark:text-cream/45 block mb-1">Potential Triggers</span>
                        <ul className="list-disc list-inside text-night-blue/70 dark:text-cream/60 space-y-1">
                          {reportData.behavioral_patterns.potential_triggers.map((item, idx) => <li key={idx} className="font-light">{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 8. Priority Actions */}
              {reportData.priority_actions && reportData.priority_actions.length > 0 && (
                <div className="mb-8 animate-fadeIn">
                  <h3 className="font-serif text-2.5xl font-normal text-night-blue dark:text-cream mb-6">
                    {language === 'en' ? "Priority Action Steps" : "प्राथमिकता कार्रवाई कदम"}
                  </h3>
                  <div className="space-y-4">
                    {reportData.priority_actions.map((act, idx) => (
                      <div key={idx} className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm flex gap-6 items-start">
                        <span className="font-serif text-3xl font-light text-marigold leading-none">
                          {String(act.priority || idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h4 className="font-grotesk text-sm font-semibold uppercase tracking-wider text-night-blue dark:text-cream mb-1">
                            {act.area}
                          </h4>
                          <p className="text-xs font-semibold text-night-blue/90 dark:text-cream/90 mb-2 leading-relaxed">
                            {act.action}
                          </p>
                          <p className="text-xs font-light text-night-blue/60 dark:text-cream/50 leading-relaxed">
                            {act.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. Positive Factors */}
              {reportData.positive_factors && reportData.positive_factors.length > 0 && (
                <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm mb-8">
                  <span className="text-[10px] text-ashoka-green dark:text-ashoka-green-light uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2 mb-4">
                    {language === 'en' ? "Protective & Positive Habits" : "सुरक्षात्मक और सकारात्मक आदतें"}
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-inside list-disc text-xs font-medium text-night-blue/80 dark:text-cream/70">
                    {reportData.positive_factors.map((item, idx) => (
                      <li key={idx} className="text-night-blue/80 dark:text-cream/70 font-light">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 10 & 11. Clinician guides */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Clinical Discussion questions */}
                {reportData.questions_to_discuss_with_clinician && reportData.questions_to_discuss_with_clinician.length > 0 && (
                  <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm space-y-4">
                    <span className="text-[10px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2">
                      {language === 'en' ? "Questions to Ask Your Doctor" : "अपने डॉक्टर से पूछने के लिए प्रश्न"}
                    </span>
                    <ul className="list-decimal list-inside text-xs font-light text-night-blue/80 dark:text-cream/70 space-y-3 leading-relaxed">
                      {reportData.questions_to_discuss_with_clinician.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {/* When to Seek help */}
                {reportData.when_to_seek_professional_help && reportData.when_to_seek_professional_help.length > 0 && (
                  <div className="border border-border-light dark:border-border-dark p-6 bg-cream dark:bg-night-blue rounded-sm space-y-4">
                    <span className="text-[10px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2">
                      {language === 'en' ? "When to Seek Professional Help" : "कब लें पेशेवर डॉक्टर की सलाह"}
                    </span>
                    <ul className="list-disc list-inside text-xs font-light text-night-blue/80 dark:text-cream/70 space-y-3 leading-relaxed">
                      {reportData.when_to_seek_professional_help.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommended Awareness Resources */}
              <div className="border border-marigold/30 p-6 bg-marigold/[0.015] dark:bg-marigold/[0.005] rounded-sm mb-8">
                <span className="text-[10px] text-marigold uppercase tracking-wider font-bold block border-b border-border-light dark:border-border-dark pb-2 mb-4">
                  {language === 'en' ? "Recommended Awareness Resources" : "आपके लिए अनुशंसित जागरूकता संसाधन"}
                </span>
                <p className="text-xs font-light text-night-blue/80 dark:text-cream/70 mb-4 leading-relaxed">
                  {language === 'en' 
                    ? "Based on your assessment parameters, we suggest exploring these educational topics to better understand how lifestyle and biology interact:"
                    : "आपके मूल्यांकन मापदंडों के आधार पर, हम यह समझने के लिए इन शैक्षिक विषयों को पढ़ने का सुझाव देते हैं कि जीवनशैली और जीवविज्ञान कैसे परस्पर क्रिया करते हैं:"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {answers['stress_level'] && (answers['stress_level'] === 'High' || answers['stress_level'] === 'Moderate') && (
                    <a href="#awareness/stress-wellbeing" className="border border-border-light dark:border-border-dark p-3.5 hover:border-marigold transition-colors bg-cream dark:bg-night-blue rounded-xs block">
                      <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block mb-1">Focus: Mind & Stress</span>
                      <span className="text-xs font-semibold text-night-blue dark:text-cream block">Stress & Sperm Quality →</span>
                    </a>
                  )}
                  {answers['sleep_hours'] && parseInt(answers['sleep_hours'], 10) < 7 && (
                    <a href="#awareness/sleep-sperm-health" className="border border-border-light dark:border-border-dark p-3.5 hover:border-marigold transition-colors bg-cream dark:bg-night-blue rounded-xs block">
                      <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block mb-1">Focus: Sleep</span>
                      <span className="text-xs font-semibold text-night-blue dark:text-cream block">Sleep & Sperm Quality →</span>
                    </a>
                  )}
                  {answers['smoking_status'] && answers['smoking_status'] === 'Yes' && (
                    <a href="#awareness/smoking-sperm-health" className="border border-border-light dark:border-border-dark p-3.5 hover:border-marigold transition-colors bg-cream dark:bg-night-blue rounded-xs block">
                      <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block mb-1">Focus: Lifestyle</span>
                      <span className="text-xs font-semibold text-night-blue dark:text-cream block">Smoking & Sperm Quality →</span>
                    </a>
                  )}
                  {answers['scrotal_heat_exposure'] === 'Yes' && (
                    <a href="#awareness/heat-exposure-sperm-health" className="border border-border-light dark:border-border-dark p-3.5 hover:border-marigold transition-colors bg-cream dark:bg-night-blue rounded-xs block">
                      <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block mb-1">Focus: Scrotal Heat</span>
                      <span className="text-xs font-semibold text-night-blue dark:text-cream block">Heat Exposure & Scrotal Temp →</span>
                    </a>
                  )}
                  {/* General testing link by default */}
                  <a href="#awareness/semen-analysis-intro" className="border border-border-light dark:border-border-dark p-3.5 hover:border-marigold transition-colors bg-cream dark:bg-night-blue rounded-xs block">
                    <span className="text-[8px] uppercase tracking-widest text-marigold font-bold block mb-1">Focus: Semen Analysis</span>
                    <span className="text-xs font-semibold text-night-blue dark:text-cream block">Understanding Semen Parameters →</span>
                  </a>
                </div>
              </div>

              {/* 12. Disclaimer */}
              <div className="border-t border-border-light dark:border-border-dark pt-6 mt-8 select-none">
                <p className="text-[10px] text-night-blue/50 dark:text-cream/40 italic leading-relaxed text-center">
                  {reportData.disclaimer}
                </p>
                <div className="mt-8 text-center pb-8">
                  <button 
                    onClick={handleHomeClear}
                    className="px-10 py-4 bg-marigold hover:bg-marigold-light text-night-blue font-grotesk font-semibold text-xs uppercase tracking-wider transition-colors duration-300 rounded-sm cursor-pointer shadow-lg shadow-marigold/10"
                  >
                    {language === 'en' ? "Acknowledge & Finish" : "स्वीकार करें और पूर्ण करें"}
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Explanatory slide-out side panel */}
      <WhyWeAsk 
        questionData={currentQuestion}
        isOpen={isWhyAskOpen}
        onClose={() => setIsWhyAskOpen(false)}
      />

      {/* Footer bar */}
      <footer className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-end border-t border-border-light dark:border-border-dark px-6 py-6 md:px-16 gap-4 text-xs font-grotesk tracking-widest text-night-blue/40 dark:text-cream/40 uppercase bg-cream dark:bg-night-dark transition-colors duration-500">
        <div>
          {content.shielded}
        </div>
        <div>
          {content.platform}
        </div>
      </footer>
    </div>
  );
}
