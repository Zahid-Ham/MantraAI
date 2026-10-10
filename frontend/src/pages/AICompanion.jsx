import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '../components/layout/AppShell';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/common/MarkdownRenderer';

// Default initial question suggestions
const SUGGESTED_QUESTIONS = [
  "How can I improve my sleep routine?",
  "What does a semen analysis measure?",
  "Can stress affect sexual health?",
  "What should I ask a doctor about a health concern?",
];

const MORE_EXPLORE_QUESTIONS = [
  "How does testicular heat exposure affect sperm?",
  "What lifestyle changes support healthy testosterone?",
  "Is performance anxiety common in young men?",
  "What are normal fluctuations in sexual desire?",
];

export default function AICompanion({ onNavigateHome }) {
  const { isAuthenticated } = useAuth();

  // Active conversation state
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [includeHealthContext, setIncludeHealthContext] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // History / Sidebar state
  const [conversationsList, setConversationsList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Auto-scroll anchor
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── 1. Fetch Conversations List for Authenticated Users ───────────────────
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingHistory(true);
      const data = await apiRequest('/api/v1/companion/conversations');
      if (Array.isArray(data)) {
        setConversationsList(data);
      }
    } catch (err) {
      console.warn('Could not load companion conversation history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── 2. Load Selected Conversation ─────────────────────────────────────────
  const handleSelectConversation = async (conversationId) => {
    if (activeConversationId === conversationId || isSending) return;
    try {
      setError(null);
      setIsSending(true);
      const detail = await apiRequest(`/api/v1/companion/conversations/${conversationId}`);
      setActiveConversationId(detail.id);
      setMessages(detail.messages || []);
    } catch (err) {
      console.error('Failed to load conversation detail:', err);
      setError('Could not load this conversation. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ── 3. Start New Conversation ─────────────────────────────────────────────
  const handleStartNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
    setError(null);
    inputRef.current?.focus();
  };

  // ── 4. Delete Conversation ────────────────────────────────────────────────
  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      setDeletingId(conversationId);
      await apiRequest(`/api/v1/companion/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      setConversationsList((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        handleStartNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Could not delete conversation: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  // ── 5. Send Message ───────────────────────────────────────────────────────
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setError(null);
    setInputText('');

    // Optimistic user message turn
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const payload = {
        message: text,
        conversation_id: activeConversationId || undefined,
        include_health_context: includeHealthContext,
      };

      const response = await apiRequest('/api/v1/companion/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Update active conversation ID if newly created
      if (!activeConversationId && response.conversation_id) {
        setActiveConversationId(response.conversation_id);
      }

      // Assistant message turn from backend
      const asstMsg = {
        id: response.message_id,
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        evidence_sufficiency: response.evidence_sufficiency || 'sufficient',
        review_status: response.review_status || 'AI_SYNTHESIZED_UNREVIEWED',
        domain: response.domain || 'general_health',
        is_escalation: response.is_escalation || false,
        escalation_reason: response.escalation_reason,
        disclaimer: response.disclaimer,
        suggested_followups: response.suggested_followups || [],
        created_at: response.created_at || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, asstMsg]);
      fetchConversations();
    } catch (err) {
      console.error('Chat turn error:', err);
      setError(err.message || 'Unable to connect to the AI Health Companion. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppShell currentTab="companion" onNavigateHome={onNavigateHome}>
      <div className="flex-1 flex flex-col min-h-screen bg-[#FAF9F6]">
        
        {/* Top Header / Context Banner */}
        <header className="border-b border-[#E8E5DF] bg-[#FAF9F6] px-4 md:px-8 py-5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                  AI Health Companion
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF5EE] text-[#1E3A2B] border border-[#D5EADB]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  Evidence-Grounded
                </span>
              </div>
              <p className="text-sm md:text-[15px] text-[#57534E]">
                Private, compassionate health education for men. Grounded in authoritative clinical guidelines.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Optional Health Context Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs md:text-sm font-medium text-[#57534E] bg-white border border-[#E8E5DF] px-3 py-1.5 rounded-xl hover:bg-[#F3EFEA] transition-colors shadow-2xs">
                <input
                  type="checkbox"
                  checked={includeHealthContext}
                  onChange={(e) => setIncludeHealthContext(e.target.checked)}
                  className="rounded text-[#1E3A2B] focus:ring-[#1E3A2B] cursor-pointer"
                />
                <span>Include Assessment Context</span>
              </label>

              {/* New Chat Button */}
              <button
                type="button"
                onClick={handleStartNewConversation}
                disabled={isSending}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-xl bg-[#1E3A2B] text-white hover:bg-[#162C20] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>
            </div>
          </div>
        </header>

        {/* Safety & Educational Disclosure Strip */}
        <div className="bg-[#F6F4EE] border-b border-[#E8E5DF] px-4 md:px-8 py-2 text-xs text-[#78716C] flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D97706] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Educational Tool:</strong> MantraAI does not provide medical diagnoses, calculate fertility probabilities, or replace in-person consultation with a physician.
            </span>
          </div>
        </div>

        {/* Main Workspace: Chat Stream + Right Sidebar */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Chat Column (8 cols on lg) */}
          <section className="lg:col-span-8 flex flex-col bg-white border border-[#E8E5DF] rounded-2xl shadow-xs overflow-hidden min-h-[640px] max-h-[calc(100vh-210px)]">
            
            {/* Scrollable Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              
              {/* Empty State / Welcome Screen */}
              {messages.length === 0 && (
                <div className="py-6 flex flex-col items-center text-center max-w-xl mx-auto space-y-6">
                  
                  {/* Decorative Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center shadow-xs">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-bold text-[#1C1917]">
                      How can I support your health today?
                    </h2>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      Ask any question about male reproductive health, sleep, hormones, physical activity, or sexual wellness. Answers are grounded in clinical guidelines from the WHO, EAU, and AUA.
                    </p>
                  </div>

                  {/* 3 Core Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E5DF] text-xs">
                      <div className="font-semibold text-[#1C1917] mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1E3A2B]" />
                        Evidence-Grounded
                      </div>
                      <p className="text-[#78716C]">
                        Grounded in peer-reviewed clinical guidelines, never hallucinated citations.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E5DF] text-xs">
                      <div className="font-semibold text-[#1C1917] mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                        Non-Diagnostic
                      </div>
                      <p className="text-[#78716C]">
                        Provides educational clarity, with guidance on when to seek in-person care.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E5DF] text-xs">
                      <div className="font-semibold text-[#1C1917] mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                        Zero Judgment
                      </div>
                      <p className="text-[#78716C]">
                        Compassionate, confidential, and respectful support for sensitive topics.
                      </p>
                    </div>
                  </div>

                  {/* Suggested Question Chips */}
                  <div className="w-full pt-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                      Suggested Questions to Explore
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {SUGGESTED_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(q)}
                          className="text-xs md:text-sm px-3.5 py-2 rounded-xl bg-white border border-[#E8E5DF] text-[#1C1917] hover:border-[#1E3A2B] hover:bg-[#EBF5EE] hover:text-[#1E3A2B] transition-all text-left shadow-2xs cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Message List */}
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';

                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                  >
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl p-4 md:p-5.5 transition-all ${
                        isUser
                          ? 'max-w-[85%] md:max-w-[75%] bg-[#1E3A2B] text-white rounded-tr-xs shadow-xs ml-auto'
                          : 'w-full max-w-[96%] md:max-w-[92%] bg-[#FAF9F6] text-[#1C1917] border border-[#E8E5DF] rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {/* Assistant Header if applicable */}
                      {!isUser && (
                        <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-[#E8E5DF]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center font-bold text-xs">
                              M
                            </div>
                            <span className="text-xs font-bold text-[#1C1917]">MantraAI Health Companion</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {msg.review_status && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                msg.is_escalation
                                  ? 'bg-[#FEE2E2] text-[#B91C1C]'
                                  : 'bg-[#F3EFEA] text-[#78716C]'
                              }`}>
                                {msg.is_escalation ? 'Safety Escalation' : 'AI Synthesized (Unreviewed)'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Urgent Safety Escalation Alert Banner */}
                      {msg.is_escalation && (
                        <div className="mb-4 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs leading-relaxed flex items-start gap-2.5">
                          <svg className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <div className="font-bold text-sm mb-0.5">Clinical Safety Escalation</div>
                            <div>Sudden or acute symptoms require urgent in-person medical evaluation. Do not delay care.</div>
                          </div>
                        </div>
                      )}

                      {/* Main Message Content with Markdown Parsing */}
                      <MarkdownRenderer content={msg.content} isUser={isUser} />

                      {/* Evidence & Sources Section for Assistant */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#E8E5DF] space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Authoritative Retrieved Guidelines ({msg.sources.length})
                          </div>

                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {msg.sources.map((src, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2.5 rounded-lg bg-white border border-[#E8E5DF] text-xs space-y-1 hover:border-[#D0CBC0] transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-[#1C1917] truncate">
                                    {src.title}
                                  </span>
                                  {src.organization && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EBF5EE] text-[#1E3A2B] shrink-0">
                                      {src.organization}
                                    </span>
                                  )}
                                </div>
                                {src.relevance_excerpt && (
                                  <p className="text-[#57534E] text-[11px] line-clamp-2 italic">
                                    "{src.relevance_excerpt}"
                                  </p>
                                )}
                                {src.url && (
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E3A2B] hover:underline pt-0.5"
                                  >
                                    View Guideline
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Insufficient Evidence Notice */}
                      {!isUser && msg.evidence_sufficiency === 'insufficient' && (
                        <div className="mt-3 p-2.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E]">
                          <strong>Limited Guideline Coverage:</strong> Current indexed medical consensus lacks specific data on this topic. Cautious general health advice applied.
                        </div>
                      )}

                      {/* Suggested Follow-up Chips */}
                      {!isUser && msg.suggested_followups && msg.suggested_followups.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#E8E5DF] space-y-2">
                          <span className="text-[11px] font-semibold text-[#78716C]">
                            Suggested Follow-ups:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggested_followups.map((fQ, fIdx) => (
                              <button
                                key={fIdx}
                                type="button"
                                onClick={() => handleSendMessage(fQ)}
                                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#E8E5DF] text-[#1E3A2B] hover:bg-[#EBF5EE] hover:border-[#1E3A2B] transition-colors cursor-pointer text-left"
                              >
                                {fQ}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Disclaimer footer */}
                      {!isUser && msg.disclaimer && (
                        <div className="mt-3 text-[10px] text-[#A8A29E] leading-normal">
                          {msg.disclaimer}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {/* Typing / Loading Indicator */}
              {isSending && (
                <div className="flex items-start space-y-2">
                  <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl rounded-tl-xs p-4 shadow-2xs max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md bg-[#EBF5EE] text-[#1E3A2B] flex items-center justify-center font-bold text-[10px]">
                        M
                      </div>
                      <span className="text-xs font-semibold text-[#57534E]">Searching clinical guidelines & analyzing...</span>
                    </div>
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-2 h-2 rounded-full bg-[#1E3A2B] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#1E3A2B] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#1E3A2B] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message with Retry */}
              {error && (
                <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className="px-2.5 py-1 rounded bg-[#DC2626] text-white font-semibold text-xs hover:bg-[#B91C1C] transition-colors cursor-pointer shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-[#E8E5DF] bg-[#FAF9F6] p-3 md:p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="space-y-2"
              >
                <div className="relative flex items-end bg-white border border-[#D0CBC0] rounded-xl shadow-2xs focus-within:ring-2 focus-within:ring-[#1E3A2B] focus-within:border-transparent transition-all">
                  <textarea
                    ref={inputRef}
                    rows={2}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    placeholder="Ask about symptoms, lifestyle, guidelines, or men's health..."
                    className="flex-1 bg-transparent border-0 px-3.5 py-2.5 text-sm md:text-[15px] text-[#1C1917] placeholder-[#A8A29E] focus:outline-none resize-none min-h-[50px] max-h-[140px]"
                  />
                  
                  <div className="p-2">
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSending}
                      className="w-9 h-9 rounded-lg bg-[#1E3A2B] text-white flex items-center justify-center hover:bg-[#162C20] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                      title="Send question (Enter)"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#78716C] px-1">
                  <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for newline</span>
                  {includeHealthContext && (
                    <span className="text-[#1E3A2B] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2B]" />
                      Assessment Context Included
                    </span>
                  )}
                </div>
              </form>
            </div>

          </section>

          {/* Right Column: History & Guidance (4 cols on lg) */}
          <aside className="lg:col-span-4 space-y-4">
            
            {/* Conversation History Card */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 md:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1C1917] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#1E3A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your Discussions
                </h3>
                <span className="text-xs text-[#78716C]">
                  {conversationsList.length} saved
                </span>
              </div>

              {!isAuthenticated ? (
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E5DF] text-xs text-[#78716C] space-y-2">
                  <p>Sign in to save and review past AI Companion discussions.</p>
                  <a
                    href="#login"
                    className="inline-block font-semibold text-[#1E3A2B] hover:underline"
                  >
                    Sign In →
                  </a>
                </div>
              ) : isLoadingHistory ? (
                <div className="py-4 text-center text-xs text-[#78716C]">
                  Loading conversations...
                </div>
              ) : conversationsList.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#78716C] space-y-1">
                  <p>No past conversations yet.</p>
                  <p className="text-[11px] text-[#A8A29E]">Your chats will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {conversationsList.map((conv) => {
                    const isSelected = activeConversationId === conv.id;
                    const isDeleting = deletingId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`group p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#EBF5EE] border-[#1E3A2B] text-[#1E3A2B]'
                            : 'bg-white border-[#E8E5DF] hover:bg-[#FAF9F6] text-[#1C1917]'
                        }`}
                      >
                        <div className="truncate flex-1">
                          <div className="font-semibold text-xs truncate">
                            {conv.title}
                          </div>
                          {conv.last_message_preview && (
                            <div className="text-[11px] text-[#78716C] truncate">
                              {conv.last_message_preview}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          disabled={isDeleting}
                          title="Delete discussion"
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#A8A29E] hover:text-[#DC2626] transition-all cursor-pointer rounded"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Explore Topics Card */}
            <div className="bg-white border border-[#E8E5DF] rounded-2xl p-4 md:p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#78716C]">
                Explore Health Topics
              </h4>
              <div className="space-y-1.5">
                {MORE_EXPLORE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    disabled={isSending}
                    className="w-full text-left text-xs p-2 rounded-lg bg-[#FAF9F6] border border-[#E8E5DF] text-[#1C1917] hover:border-[#1E3A2B] hover:bg-[#EBF5EE] hover:text-[#1E3A2B] transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency & Support Helplines Card */}
            <div className="bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl p-4 md:p-5 shadow-xs space-y-2.5 text-xs">
              <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Emergency Helplines (India)
              </div>
              <p className="text-[#57534E] leading-relaxed">
                If you are experiencing acute physical distress or a mental health crisis:
              </p>
              <ul className="space-y-1 text-[#78716C]">
                <li>• <strong>Tele-MANAS:</strong> 14416 (24/7 National Mental Health)</li>
                <li>• <strong>Vandrevala:</strong> +91 9999 666 555</li>
                <li>• <strong>Emergency Medical:</strong> 112 / 108</li>
              </ul>
            </div>

          </aside>

        </div>

      </div>
    </AppShell>
  );
}
