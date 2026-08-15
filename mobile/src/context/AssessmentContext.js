import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "../utils/storage";
import { apiRequest } from "../services/api";
import { useAuth } from "./AuthContext";
import { assessmentSchema } from "../data/assessmentSchema";

const AssessmentContext = createContext(null);

const DRAFT_ANSWERS_KEY = "mantra_assessment_answers";
const CURRENT_INDEX_KEY = "mantra_assessment_question_idx";
const ACTIVE_ID_KEY = "mantra_active_assessment_id";

export function AssessmentProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeAssessmentId, setActiveAssessmentId] = useState(null);
  const [recoverySession, setRecoverySession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  const { questions } = assessmentSchema;

  // Clear all wizard keys on completion or reset
  const clearLocalDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_ANSWERS_KEY);
      await AsyncStorage.removeItem(CURRENT_INDEX_KEY);
      await AsyncStorage.removeItem(ACTIVE_ID_KEY);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setActiveAssessmentId(null);
      setRecoverySession(null);
    } catch (e) {
      console.warn("Error clearing local draft:", e);
    }
  };

  // Check for active sessions on load/auth status changes
  useEffect(() => {
    if (!isAuthenticated) {
      clearLocalDraft();
      return;
    }

    const checkActiveSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const storedId = await AsyncStorage.getItem(ACTIVE_ID_KEY);
        if (storedId) {
          setActiveAssessmentId(storedId);
          // Load local answers
          const storedAnswers = await AsyncStorage.getItem(DRAFT_ANSWERS_KEY);
          if (storedAnswers) {
            setAnswers(JSON.parse(storedAnswers));
          }
          const storedIndex = await AsyncStorage.getItem(CURRENT_INDEX_KEY);
          if (storedIndex) {
            setCurrentQuestionIndex(parseInt(storedIndex, 10));
          }

          // Verify with server and fetch latest if available
          try {
            const data = await apiRequest(`/api/v1/assessments/${storedId}/responses`);
            if (data && data.responses) {
              const merged = { ...JSON.parse(storedAnswers || "{}"), ...data.responses };
              setAnswers(merged);
              await AsyncStorage.setItem(DRAFT_ANSWERS_KEY, JSON.stringify(merged));
            }
          } catch (e) {
            console.warn("Could not sync active session responses from server (using local draft):", e);
          }
          setLoading(false);
          return;
        }

        // No active local session ID. Check backend database for in-progress assessments
        const activeSessions = await apiRequest("/api/v1/assessments");
        const inProgress = activeSessions.find(s => s.status === "IN_PROGRESS");
        if (inProgress) {
          setRecoverySession(inProgress);
        }
      } catch (err) {
        console.error("Failed to check active sessions on server:", err);
        setError("Unable to connect to the server. Working in offline draft mode.");
      } finally {
        setLoading(false);
      }
    };

    checkActiveSession();
  }, [isAuthenticated]);

  const startNewSession = async () => {
    setLoading(true);
    setError(null);
    try {
      await clearLocalDraft();
      const sess = await apiRequest("/api/v1/assessments", {
        method: "POST",
        body: JSON.stringify({ assessment_version: "1.0" })
      });
      
      setActiveAssessmentId(sess.id);
      await AsyncStorage.setItem(ACTIVE_ID_KEY, sess.id);
      await AsyncStorage.setItem(CURRENT_INDEX_KEY, "0");
      await AsyncStorage.setItem(DRAFT_ANSWERS_KEY, JSON.stringify({}));
      
      setAnswers({});
      setCurrentQuestionIndex(0);
      setRecoverySession(null);
    } catch (e) {
      console.error("Failed to start new session on server:", e);
      // Local fallback in case server is unreachable
      const localFallbackId = `offline_${Date.now()}`;
      setActiveAssessmentId(localFallbackId);
      await AsyncStorage.setItem(ACTIVE_ID_KEY, localFallbackId);
      setAnswers({});
      setCurrentQuestionIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const resumeSession = async (sessId) => {
    setLoading(true);
    setError(null);
    try {
      setActiveAssessmentId(sessId);
      await AsyncStorage.setItem(ACTIVE_ID_KEY, sessId);
      
      const data = await apiRequest(`/api/v1/assessments/${sessId}/responses`);
      if (data && data.responses) {
        setAnswers(data.responses);
        await AsyncStorage.setItem(DRAFT_ANSWERS_KEY, JSON.stringify(data.responses));
        
        // Find first unanswered index or default to 0
        const unansweredIdx = questions.findIndex(q => data.responses[q.id] === undefined);
        const idx = unansweredIdx !== -1 ? unansweredIdx : 0;
        setCurrentQuestionIndex(idx);
        await AsyncStorage.setItem(CURRENT_INDEX_KEY, idx.toString());
      }
      setRecoverySession(null);
    } catch (e) {
      console.error("Failed to resume session answers:", e);
      setError("Unable to resume the session from the server.");
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (questionId, value) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);
    
    try {
      await AsyncStorage.setItem(DRAFT_ANSWERS_KEY, JSON.stringify(updatedAnswers));
      
      // Auto-sync answer to server in background if connected and not offline fallback
      if (activeAssessmentId && !activeAssessmentId.startsWith("offline_")) {
        syncResponses(activeAssessmentId, { [questionId]: value });
      }
    } catch (e) {
      console.warn("Error saving answer locally:", e);
    }
  };

  const updateQuestionIndex = async (index) => {
    setCurrentQuestionIndex(index);
    try {
      await AsyncStorage.setItem(CURRENT_INDEX_KEY, index.toString());
    } catch (e) {
      console.warn("Error saving question index:", e);
    }
  };

  const syncResponses = async (sessId, payloadResponses) => {
    setIsSyncing(true);
    try {
      await apiRequest(`/api/v1/assessments/${sessId}/responses`, {
        method: "POST",
        body: JSON.stringify({ responses: payloadResponses })
      });
    } catch (err) {
      console.warn("Background answer sync failed (saved locally):", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllResponses = async () => {
    if (!activeAssessmentId || activeAssessmentId.startsWith("offline_")) return;
    setIsSyncing(true);
    try {
      await apiRequest(`/api/v1/assessments/${activeAssessmentId}/responses`, {
        method: "POST",
        body: JSON.stringify({ responses: answers })
      });
      return true;
    } catch (err) {
      console.error("Failed to sync responses to server:", err);
      setError("Unable to sync answers with server. Progress is safe locally.");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const completeAssessment = async () => {
    if (!activeAssessmentId) throw new Error("No active assessment ID.");
    setLoading(true);
    setError(null);
    try {
      // 1. Final sync of all answers
      await syncAllResponses();

      // 2. Complete session on backend (triggers report scoring & Groq AI compilation)
      const result = await apiRequest(`/api/v1/assessments/${activeAssessmentId}/complete`, {
        method: "POST"
      });

      const finishedId = activeAssessmentId;
      // 3. Clear local storage draft
      await clearLocalDraft();
      
      return { success: true, assessmentId: finishedId, result };
    } catch (err) {
      console.error("Failed to complete assessment:", err);
      setError("Unable to complete assessment. Please check your internet connection and try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    answers,
    currentQuestionIndex,
    activeAssessmentId,
    recoverySession,
    loading,
    isSyncing,
    error,
    startNewSession,
    resumeSession,
    saveAnswer,
    updateQuestionIndex,
    syncAllResponses,
    completeAssessment,
    clearLocalDraft
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error("useAssessment must be used within an AssessmentProvider");
  }
  return context;
}
