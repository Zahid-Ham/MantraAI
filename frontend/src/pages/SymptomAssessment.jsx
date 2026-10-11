import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { assessmentSchema } from '../data/assessmentSchema';
import { apiRequest } from '../config/api';
import AppShell from '../components/layout/AppShell';
import AssessmentWelcome from '../components/assessment/AssessmentWelcome';
import AssessmentHeader from '../components/assessment/AssessmentHeader';
import AssessmentSectionNavigator from '../components/assessment/AssessmentSectionNavigator';
import QuestionCard from '../components/assessment/QuestionCard';
import AssessmentNavigation from '../components/assessment/AssessmentNavigation';

export default function SymptomAssessment({ onNavigateHome }) {
  const { language } = useLanguage();

  // Wizard state machine with browser-level storage persistence
  const [step, setStep] = useState(() => {
    try {
      const savedStep = localStorage.getItem('mantra_assessment_step');
      return savedStep && savedStep !== 'loading_report' ? savedStep : 'intro';
    } catch {
      return 'intro';
    }
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    try {
      const savedIdx = localStorage.getItem('mantra_assessment_question_idx');
      return savedIdx ? parseInt(savedIdx, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [answers, setAnswers] = useState(() => {
    try {
      const savedAns = localStorage.getItem('mantra_assessment_answers');
      return savedAns ? JSON.parse(savedAns) : {};
    } catch {
      return {};
    }
  });

  const [maxReachedBlockId, setMaxReachedBlockId] = useState(1);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showCrisisInterstitial, setShowCrisisInterstitial] = useState(false);
  const [recoverySession, setRecoverySession] = useState(null);

  // Red-flag triage state
  const [triageAnswers, setTriageAnswers] = useState({});
  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  const { questions, blocks } = assessmentSchema;

  // Sync state variables to browser storage (as backup/scratchpad)
  useEffect(() => {
    try {
      localStorage.setItem('mantra_assessment_step', step);
    } catch {}
  }, [step]);

  useEffect(() => {
    try {
      localStorage.setItem('mantra_assessment_question_idx', String(currentQuestionIndex));
    } catch {}
  }, [currentQuestionIndex]);

  useEffect(() => {
    try {
      localStorage.setItem('mantra_assessment_answers', JSON.stringify(answers));
    } catch {}
  }, [answers]);

  // Session Recovery & Initialization Lifecycle
  useEffect(() => {
    const checkActiveSession = async () => {
      const activeId = localStorage.getItem('mantra_active_assessment_id');
      if (activeId && activeId !== 'offline_session_fallback') {
        try {
          const data = await apiRequest(`/api/v1/assessments/${activeId}/responses`);
          if (data && data.responses) {
            setAnswers(data.responses);
            const unansweredIdx = questions.findIndex(q => data.responses[q.id] === undefined && !shouldSkipQuestion(q, data.responses));
            if (unansweredIdx !== -1) {
              setCurrentQuestionIndex(unansweredIdx);
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
        if (Array.isArray(activeSessions)) {
          const inProgress = activeSessions.find(s => s.status === 'IN_PROGRESS');
          if (inProgress) {
            setRecoverySession(inProgress);
            setShowResumePrompt(true);
          } else {
            await startNewSession();
          }
        } else {
          await startNewSession();
        }
      } catch (err) {
        console.error("Failed to fetch sessions from server:", err);
        localStorage.setItem('mantra_active_assessment_id', 'offline_session_fallback');
      }
    };

    checkActiveSession();
  }, []);

  const startNewSession = async () => {
    try {
      const sess = await apiRequest('/api/v1/assessments', {
        method: "POST",
        body: JSON.stringify({ assessment_version: "2.0" })
      });
      localStorage.setItem('mantra_active_assessment_id', sess.id);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setMaxReachedBlockId(1);
      setStep('intro');
    } catch (e) {
      console.error("Failed to start new session on server:", e);
      localStorage.setItem('mantra_active_assessment_id', 'offline_session_fallback');
    }
  };

  const resumeSession = async (sessId) => {
    localStorage.setItem('mantra_active_assessment_id', sessId);
    try {
      const data = await apiRequest(`/api/v1/assessments/${sessId}/responses`);
      if (data && data.responses) {
        setAnswers(data.responses);
        const unansweredIdx = questions.findIndex(q => data.responses[q.id] === undefined && !shouldSkipQuestion(q, data.responses));
        const resumeIdx = unansweredIdx !== -1 ? unansweredIdx : 0;
        setCurrentQuestionIndex(resumeIdx);
        if (questions[resumeIdx]) {
          setMaxReachedBlockId(questions[resumeIdx].block);
        }
      }
      setStep('questions');
    } catch (e) {
      console.error("Failed to resume session answers:", e);
    } finally {
      setShowResumePrompt(false);
    }
  };

  const handleStart = () => {
    setTriageAnswers({});
    setTriageResult(null);
    setStep('triage');
  };

  const handleTriageToggle = (qId) => {
    setTriageAnswers(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleTriageNone = async () => {
    try {
      setTriageLoading(true);
      await apiRequest('/api/v1/triage', {
        method: 'POST',
        body: JSON.stringify({ answers: {} })
      });
    } catch (err) {
      console.warn("Triage background record:", err);
    } finally {
      setTriageLoading(false);
      setStep('questions');
    }
  };

  const handleTriageSubmit = async () => {
    try {
      setTriageLoading(true);
      const res = await apiRequest('/api/v1/triage', {
        method: 'POST',
        body: JSON.stringify({ answers: triageAnswers })
      });
      if (res && res.tier === 'routine') {
        setStep('questions');
      } else {
        setTriageResult(res);
      }
    } catch (err) {
      console.error("Triage evaluation error:", err);
      setStep('questions');
    } finally {
      setTriageLoading(false);
    }
  };

  // Clean persistent memory when navigating home or finishing
  const handleHomeClear = () => {
    try {
      localStorage.removeItem('mantra_assessment_step');
      localStorage.removeItem('mantra_assessment_question_idx');
      localStorage.removeItem('mantra_assessment_answers');
      localStorage.removeItem('mantra_active_assessment_id');
    } catch {}
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.hash = '#dashboard';
    }
  };

  const [reportError, setReportError] = useState(null);
  const [loadingStage, setLoadingStage] = useState(0);

  const processingSteps = [
    {
      title: "Processing your assessment responses",
      description: "Organizing and analyzing your information...",
    },
    {
      title: "Finding relevant scientific evidence",
      description: "Retrieving latest research and guidelines...",
    },
    {
      title: "Generating personalized insights",
      description: "Creating your detailed report...",
    },
    {
      title: "Finalizing your report",
      description: "Almost ready...",
    },
  ];

  const handleSubmitAnswers = async () => {
    setStep('loading_report');
    setReportError(null);
    setLoadingStage(0);
    
    const stageInterval = setInterval(() => {
      setLoadingStage(prev => {
        if (prev < processingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 2400);

    const activeId = localStorage.getItem('mantra_active_assessment_id');

    try {
      if (activeId && activeId !== 'offline_session_fallback') {
        // 1. Submit final responses to database
        await apiRequest(`/api/v1/assessments/${activeId}/responses`, {
          method: "POST",
          body: JSON.stringify({ responses: answers })
        });

        // 2. Complete session & generate report
        await apiRequest(`/api/v1/assessments/${activeId}/complete`, {
          method: "POST"
        });

        clearInterval(stageInterval);
        
        // Clear wizard keys on completion
        try {
          localStorage.removeItem('mantra_active_assessment_id');
          localStorage.removeItem('mantra_assessment_step');
          localStorage.removeItem('mantra_assessment_question_idx');
          localStorage.removeItem('mantra_assessment_answers');
        } catch {}
        
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

  // Keep track of maximum reached block id for the section navigator
  useEffect(() => {
    if (currentQuestion && currentQuestion.block > maxReachedBlockId) {
      setMaxReachedBlockId(currentQuestion.block);
    }
  }, [currentQuestion, maxReachedBlockId]);

  // Track dynamic estimated remaining time (approx 10s per question)
  const estTimeRemaining = Math.max(1, Math.ceil((questions.length - currentQuestionIndex) * 0.15));

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

  // Auto-skip conditional questions
  useEffect(() => {
    if (step === 'questions' && currentQuestion && shouldSkipQuestion(currentQuestion, answers)) {
      let nextIdx = currentQuestionIndex + 1;
      while (nextIdx < questions.length && shouldSkipQuestion(questions[nextIdx], answers)) {
        nextIdx++;
      }
      if (nextIdx < questions.length) {
        setCurrentQuestionIndex(nextIdx);
      } else {
        handleSubmitAnswers();
      }
    }
  }, [currentQuestionIndex, answers, step]);

  // Answer change handler
  const handleAnswerChange = (val) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: val
    }));

    if (currentQuestion && currentQuestion.id === 'phq9_item_9') {
      const numVal = parseInt(val, 10);
      if (!isNaN(numVal) && numVal > 0) {
        setShowCrisisInterstitial(true);
      }
    }
  };

  const handleNext = async () => {
    // Progressive save answers before moving forward
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
        setCurrentQuestionIndex(nextIdx);
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

  const handleSelectBlock = (blockId) => {
    const targetIdx = questions.findIndex(q => q.block === blockId && !shouldSkipQuestion(q, answers));
    if (targetIdx !== -1) {
      setCurrentQuestionIndex(targetIdx);
    }
  };

  // Questions in active block for counter
  const questionsInCurrentBlock = currentQuestion
    ? questions.filter(q => q.block === currentQuestion.block && !shouldSkipQuestion(q, answers))
    : [];
  const questionIndexInBlock = currentQuestion
    ? questionsInCurrentBlock.findIndex(q => q.id === currentQuestion.id) + 1
    : 1;
  const totalQuestionsInBlock = questionsInCurrentBlock.length || 1;

  return (
    <AppShell currentTab="assess" onNavigateHome={onNavigateHome}>
      
      {/* Session Recovery Prompter Modal */}
      {showResumePrompt && recoverySession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#E8E5DF] p-6 sm:p-8 rounded-3xl space-y-5 shadow-lg relative font-sans text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF0E6] text-[#D25619] border border-[#FAD8C3] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#D25619] uppercase tracking-widest bg-[#FEF0E6] px-2.5 py-0.5 rounded-full">
                Session Recovery
              </span>
              <h2 className="font-serif text-2xl font-normal text-[#1C1917] tracking-tight">
                Resume Incomplete Assessment?
              </h2>
              <p className="text-xs text-[#57534E] leading-relaxed">
                We found an active in-progress assessment session on your profile. Would you like to pick up where you left off?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => resumeSession(recoverySession.id)}
                className="flex-1 py-3 bg-[#1E3A2B] hover:bg-[#14281D] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Resume Progress
              </button>
              <button
                onClick={async () => {
                  setShowResumePrompt(false);
                  await startNewSession();
                }}
                className="flex-1 py-3 border border-[#D1D5DB] text-[#57534E] hover:text-[#1C1917] hover:bg-[#F9FAFB] text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
        
        {/* Step 1: Welcome / Intro */}
        {step === 'intro' && (
          <AssessmentWelcome onStart={handleStart} />
        )}

        {/* Step 1.5: Red-Flag Triage Safety Check */}
        {step === 'triage' && (
          <div className="max-w-2xl mx-auto font-sans bg-white border border-[#EAE5DD] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {!triageResult ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1C1917]">
                      Pre-Assessment Safety Check
                    </h2>
                    <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                      Before beginning the questionnaire, please let us know if you are currently experiencing any of the following acute symptoms.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { id: "sudden_severe_pain", text: "Sudden, severe testicular or scrotal pain (especially with nausea or vomiting)" },
                    { id: "swollen_scrotum_fever", text: "Painful, swollen, red or hot scrotum accompanied by fever or chills" },
                    { id: "testicular_lump", text: "A new lump, firmness, or hardness in a testicle" },
                    { id: "blood_in_fluid", text: "Visible blood in semen (hematospermia) or blood in urine (hematuria)" },
                    { id: "severe_pain_injury", text: "Rapid swelling or severe pain following physical trauma or injury to the groin" },
                    { id: "chronic_pain_weeks", text: "Testicular, pelvic, or groin pain persisting for more than 2 to 3 weeks" },
                    { id: "self_harm_thoughts", text: "Thoughts of hurting yourself or that you would be better off dead" },
                  ].map((q) => {
                    const isChecked = Boolean(triageAnswers[q.id]);
                    return (
                      <label
                        key={q.id}
                        onClick={() => handleTriageToggle(q.id)}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                          isChecked
                            ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B] font-medium"
                            : "bg-[#FAFAF9] border-[#E7E5E4] text-[#44403C] hover:bg-[#F5F5F4]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#DC2626] focus:ring-0 cursor-pointer"
                        />
                        <span className="leading-snug">{q.text}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#F5F5F4] flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTriageNone}
                    disabled={triageLoading}
                    className="w-full sm:w-auto px-6 py-3 bg-[#1E3A2B] hover:bg-[#14281D] text-white font-semibold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {triageLoading ? "Recording..." : "None of these apply — Continue"}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  {Object.values(triageAnswers).some(Boolean) && (
                    <button
                      type="button"
                      onClick={handleTriageSubmit}
                      disabled={triageLoading}
                      className="w-full sm:w-auto px-5 py-3 border border-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
                    >
                      {triageLoading ? "Evaluating..." : "Check Reported Symptoms"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    triageResult.tier === 'emergency' || triageResult.tier === 'crisis'
                      ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
                      : 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                  }`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#374151]">
                      Urgency: {triageResult.tier}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-[#1C1917] mt-1">
                      {triageResult.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAF9] border border-[#E7E5E4] text-xs sm:text-sm text-[#44403C] leading-relaxed space-y-2">
                  <p>{triageResult.message}</p>
                  {triageResult.helpline && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-[#D1D5DB] font-medium text-[#111827]">
                      📞 {triageResult.helpline}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-[#78716C] italic">
                  Note: This safety check is not a clinical diagnosis or emergency dispatch. If in doubt, visit an emergency facility immediately.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTriageResult(null);
                      setStep('questions');
                    }}
                    className="flex-1 px-5 py-3 bg-[#1E3A2B] hover:bg-[#14281D] text-white font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors text-center"
                  >
                    I understand — Continue to Assessment
                  </button>
                  <button
                    type="button"
                    onClick={handleHomeClear}
                    className="px-5 py-3 border border-[#D1D5DB] text-[#4B5563] hover:bg-[#F9FAFB] font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors text-center"
                  >
                    Exit Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Interactive Questions */}
        {step === 'questions' && currentQuestion && (
          <div className="space-y-4">
            {/* Header with Title and Estimated Time */}
            <AssessmentHeader estTimeRemaining={estTimeRemaining} />

            {/* Assessment Layout: Section Navigator Sidebar + Question Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: 13-Block Section Navigator */}
              <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-[#EAE5DD] rounded-2xl p-4 shadow-xs hidden lg:block">
                <div className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-3 px-1">
                  ASSESSMENT SECTIONS
                </div>
                <AssessmentSectionNavigator
                  blocks={blocks}
                  questions={questions}
                  activeBlockId={activeBlock?.id || 1}
                  maxReachedBlockId={maxReachedBlockId}
                  onSelectBlock={handleSelectBlock}
                />
              </aside>

              {/* Right Column: Core Question Card & Navigation */}
              <div className="lg:col-span-8 xl:col-span-9 flex flex-col items-center">
                <QuestionCard
                  questionData={currentQuestion}
                  currentAnswer={answers[currentQuestion.id]}
                  onAnswerChange={handleAnswerChange}
                  onAutoAdvance={handleNext}
                  questionIndexInBlock={questionIndexInBlock}
                  totalQuestionsInBlock={totalQuestionsInBlock}
                />
                {(currentQuestion.group === 'phq9' || currentQuestion.group === 'gad7') && (
                  <div className="mt-4 text-xs text-gray-500 text-center max-w-lg">
                    {language === 'en' ? "PHQ-9 and GAD-7 are screening tools, not a diagnosis." : "PHQ-9 और GAD-7 स्क्रीनिंग उपकरण हैं, निदान नहीं।"}
                  </div>
                )}

                <AssessmentNavigation
                  onBack={handleBack}
                  onNext={handleNext}
                  canGoBack={true}
                  canGoNext={answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== ""}
                  isLast={currentQuestionIndex === questions.length - 1}
                  isOptional={currentQuestion.sensitivity}
                />
              </div>

            </div>
          </div>
        )}

        {/* Step 3: Post-Submission Processing Screen */}
        {step === 'loading_report' && (
          <div className="w-full max-w-xl mx-auto py-6 sm:py-10 px-4 font-sans text-[#1C1917]">
            
            {/* Serene Botanical / Nature Hero Visual */}
            <div className="w-full h-44 sm:h-52 rounded-3xl overflow-hidden relative bg-[#EBF3ED] mb-8 border border-[#DDECE1] shadow-xs">
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent z-10" />
              <svg className="w-full h-full object-cover text-[#2D5A3C]" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none">
                <rect width="400" height="240" fill="#E8F4EC" />
                <circle cx="200" cy="90" r="50" fill="#FEF3C7" opacity="0.8" />
                <circle cx="200" cy="90" r="70" fill="#FEF3C7" opacity="0.3" />
                <path d="M0 160 L100 90 L200 150 L300 80 L400 130 L400 240 L0 240 Z" fill="#BFDBC6" opacity="0.6" />
                <path d="M40 170 L150 110 L260 165 L360 100 L400 150 L400 240 L0 240 Z" fill="#99C7A5" opacity="0.7" />
                <path d="M0 175 Q200 160 400 175 L400 240 L0 240 Z" fill="#80B890" opacity="0.85" />
                <path d="M160 190 Q190 165 230 180 Q250 200 265 230 Q210 245 160 230 Z" fill="#4B6B57" />
                <circle cx="215" cy="148" r="7" fill="#1C3829" />
                <path d="M208 155 C208 155 215 155 222 155 C226 160 227 172 227 178 L203 178 C203 172 204 160 208 155 Z" fill="#1C3829" />
                <path d="M200 178 C200 173 230 173 230 178 C230 184 200 184 200 178 Z" fill="#1C3829" />
                <path d="M-10 220 Q40 170 65 150 Q45 200 20 240 Z" fill="#1E3A2B" opacity="0.9" />
                <path d="M350 230 Q375 180 405 160 Q395 210 370 240 Z" fill="#1E3A2B" opacity="0.9" />
              </svg>
            </div>

            {/* Headings */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-3.5xl font-serif text-[#1C1917] tracking-tight font-normal">
                Generating Your Personalized Report
              </h1>
              <p className="text-xs sm:text-sm text-[#57534E] max-w-md mx-auto leading-relaxed">
                Our AI is analyzing your responses, applying evidence-based insights, and creating your personalized health report.
              </p>
            </div>

            {/* Vertical Progress Steps */}
            <div className="bg-white border border-[#E8E5DF] rounded-3xl p-6 sm:p-7 shadow-xs mb-6 max-w-md mx-auto">
              <div className="space-y-6 relative">
                {processingSteps.map((s, idx) => {
                  const isCompleted = idx < loadingStage;
                  const isActive = idx === loadingStage;

                  return (
                    <div key={idx} className="flex items-start gap-4 relative">
                      {/* Connecting Vertical Line */}
                      {idx < processingSteps.length - 1 && (
                        <div 
                          className={`absolute left-3.5 top-7 w-0.5 h-11 transition-colors duration-500 ${
                            isCompleted ? 'bg-[#1E3A2B]' : 'bg-[#E8E5DF]'
                          }`} 
                        />
                      )}

                      {/* Step Indicator Icon */}
                      <div className="relative z-10 shrink-0">
                        {isCompleted ? (
                          <div className="w-7 h-7 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center shadow-xs">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : isActive ? (
                          <div className="w-7 h-7 rounded-full border-2 border-[#1E3A2B] bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center animate-pulse">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A2B]" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full border-2 border-[#D1D5DB] bg-white flex items-center justify-center" />
                        )}
                      </div>

                      {/* Step Text Content */}
                      <div className="min-w-0 pt-0.5">
                        <h4 className={`text-xs sm:text-[13.5px] font-bold leading-tight ${
                          isActive || isCompleted ? 'text-[#1C1917]' : 'text-[#9CA3AF]'
                        }`}>
                          {s.title}
                        </h4>
                        <p className={`text-[11px] sm:text-xs mt-0.5 ${
                          isActive ? 'text-[#57534E]' : 'text-[#9CA3AF]'
                        }`}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* "Did you know?" Informational Callout */}
            <div className="bg-[#F7F4EE] border border-[#EAE5DD] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 max-w-md mx-auto mb-6">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-[#1C1917]">Did you know?</div>
                <div className="text-[11px] sm:text-xs text-[#57534E] mt-0.5 leading-relaxed">
                  We analyze your responses against the latest scientific research and clinical guidelines to provide evidence-informed insights.
                </div>
              </div>
            </div>

            {/* Time Expectation Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#78716C] select-none">
              <svg className="w-4 h-4 animate-spin text-[#1E3A2B]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="4 4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>This usually takes 1–2 minutes</span>
            </div>

          </div>
        )}

        {/* Step 4: Error Recovery Screen */}
        {step === 'error' && (
          <div className="max-w-md mx-auto text-center py-8 px-6 font-sans bg-white border border-[#E8E5DF] rounded-3xl p-8 shadow-xs my-8">
            <div className="w-14 h-14 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1C1917] mb-2">
              Generation Interrupted
            </h3>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-6">
              {reportError || "We encountered an issue compiling your health analysis report. Your responses have been saved securely."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleSubmitAnswers}
                className="px-6 py-3 bg-[#1E3A2B] hover:bg-[#14281D] text-white font-semibold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Retry Generation
              </button>
              <button 
                onClick={handleHomeClear}
                className="px-6 py-3 border border-[#D1D5DB] text-[#374151] hover:bg-[#F9FAFB] font-semibold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        )}

        {/* PHQ-9 Item 9 Crisis Support Interstitial */}
        {showCrisisInterstitial && (
          <div className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E8E5DF] shadow-lg space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F4] text-[#44403C] flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#1C1917]">Support Is Always Available</h3>
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                  Thank you for sharing your feelings honestly. If you are going through a difficult or painful time, please remember that you do not have to carry this alone. Free, confidential support is available 24/7 across India.
                </p>
              </div>

              <div className="bg-[#FAF9F5] border border-[#E7E5E0] rounded-2xl p-4 space-y-3">
                <div className="text-xs font-semibold text-[#1C1917] tracking-wider uppercase">Verified National Helplines</div>
                <div className="space-y-2 text-xs text-[#292524]">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E7E5E0]">
                    <div>
                      <div className="font-semibold text-[#1C1917]">Tele-MANAS (Govt. of India)</div>
                      <div className="text-[11px] text-[#78716C]">24/7 National Tele Mental Health Programme</div>
                    </div>
                    <a href="tel:14416" className="font-mono font-bold text-[#1E3A2B] hover:underline shrink-0">14416 / 1800-891-4416</a>
                  </div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E7E5E0]">
                    <div>
                      <div className="font-semibold text-[#1C1917]">KIRAN Mental Health Helpline</div>
                      <div className="text-[11px] text-[#78716C]">24/7 Support by Ministry of Social Justice</div>
                    </div>
                    <a href="tel:18005990019" className="font-mono font-bold text-[#1E3A2B] hover:underline shrink-0">1800-599-0019</a>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[#1C1917]">National Emergency</div>
                      <div className="text-[11px] text-[#78716C]">Immediate Police & Medical Assistance</div>
                    </div>
                    <a href="tel:112" className="font-mono font-bold text-[#1E3A2B] hover:underline shrink-0">112</a>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCrisisInterstitial(false)}
                  className="w-full py-3 px-5 rounded-xl bg-[#1E3A2B] hover:bg-[#14281D] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Continue Assessment
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </AppShell>
  );
}
