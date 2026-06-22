import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  ShieldCheck,
  Star,
  Clock,
  Plus,
  Trash2,
  SquarePen,
  Search,
  Menu,
  MoreVertical,
  Mic,
  MessageCircle,
  Settings,
  HelpCircle,
  Square,
} from 'lucide-react';
import BookingModal from '../../components/booking/BookingModal/BookingModal';
import SidebarToggleIcon from '../../components/chat/SidebarToggleIcon/SidebarToggleIcon';
import MascotPet from '../../components/chat/MiniAiChat/MascotPet';
import ProfileDrawer from '../../components/profile/ProfileDrawer/ProfileDrawer';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { matchWithAiStream, recordUserAction } from '../../services/matchingService';
import {
  isFallbackRetrievalFlow,
  mapFlowSteps,
  patchQueryWithUserMessage,
} from '../../constants/retrievalFlowSteps';
import { useHomePromptSuggestions } from '../../components/chat/chatPromptSuggestions';
import PipelineFlowPanel from '../../components/chat/PipelineFlowPanel/PipelineFlowPanel';
import CommunityLinksPanel from '../../components/chat/CommunityLinksPanel/CommunityLinksPanel';
import ViniGateRefusalCard from '../../components/chat/ViniGateRefusalCard';
import { useViniWaitingMessage } from '../../components/chat/viniWaitingMessages';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { translate } from '../../i18n/translate';
import { deleteConversation, clearAllConversations } from '../../services/chatService';
import {
  loadRecentSessions,
  saveRecentSession,
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  removeRecentSession,
  clearAllRecentSessions,
  titleFromMessages,
  normalizeChatMessagesForStorage,
  formatMessageTime,
  formatConversationTime,
  resolveMessageTimestamp,
} from '../../utils/chatSessionStorage';
import './AiAssistant.css';

const getDisplayName = (user) => {
  const name = user?.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }
  const emailPrefix = user?.email?.split('@')[0]?.trim();
  if (emailPrefix && !emailPrefix.includes('.') && emailPrefix.length <= 16) {
    return emailPrefix;
  }
  return null;
};

const AiAssistant = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const homePromptSuggestions = useHomePromptSuggestions();

  const welcomeMessage = useCallback(() => {
    const now = Date.now();
    return {
      id: now,
      type: 'ai',
      text: t('ai.welcome'),
      hasResults: false,
      createdAt: now,
    };
  }, [t]);

  const homeGreeting = useMemo(() => {
    const name = getDisplayName(user);
    const guest = locale === 'en' ? 'there' : 'bạn';
    const displayName = name || guest;
    const hour = new Date().getHours();
    if (hour < 12) return t('ai.greetingMorning', { name: displayName });
    if (hour < 18) return t('ai.greetingAfternoon', { name: displayName });
    return t('ai.greetingEvening', { name: displayName });
  }, [user, t, locale]);

  const helpTips = useMemo(() => {
    const tips = translate(locale, 'ai.help.tips');
    return Array.isArray(tips) ? tips : [];
  }, [locale]);
  const userId = user?.id;
  const initialQuery = location.state?.query || '';
  const miniSession = location.state?.fromMiniChat
    ? {
        conversationId: location.state.conversationId ?? null,
        messages: location.state.messages,
        quickReplies: location.state.quickReplies ?? [],
      }
    : null;
  const restored =
    !initialQuery && userId
      ? miniSession?.messages?.length
        ? miniSession
        : loadActiveSession(userId)
      : null;
  const initialMessages = restored?.messages?.length
    ? normalizeChatMessagesForStorage(restored.messages)
    : null;

  const [inputText, setInputText] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [conversationId, setConversationId] = useState(restored?.conversationId ?? null);
  const [quickReplies, setQuickReplies] = useState(restored?.quickReplies ?? []);
  const [chatHistory, setChatHistory] = useState(
    initialMessages?.length ? initialMessages : [welcomeMessage()],
  );
  const [recentSessions, setRecentSessions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const waitingMessage = useViniWaitingMessage(isTyping);
  const [error, setError] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const chatAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const scrollHideTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [scrollbarVisible, setScrollbarVisible] = useState(false);

  const isFreshChat = !chatHistory.some((m) => m.type === 'user');
  const hasInput = Boolean(inputText.trim());

  const filteredRecentSessions = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return recentSessions;
    return recentSessions.filter((s) => s.title?.toLowerCase().includes(q));
  }, [recentSessions, historySearch]);

  const conversationTimes = useMemo(() => {
    const userMessages = chatHistory.filter((m) => m.type === 'user');
    const startedAt = userMessages[0]?.createdAt ?? userMessages[0]?.id;
    const lastMsg = chatHistory[chatHistory.length - 1];
    const updatedAt = lastMsg ? resolveMessageTimestamp(lastMsg) : null;
    return { startedAt, updatedAt };
  }, [chatHistory]);

  useEffect(() => {
    return () => {
      if (scrollHideTimerRef.current) {
        clearTimeout(scrollHideTimerRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  const revealScrollbar = useCallback(() => {
    setScrollbarVisible(true);
    if (scrollHideTimerRef.current) {
      clearTimeout(scrollHideTimerRef.current);
    }
    scrollHideTimerRef.current = setTimeout(() => {
      setScrollbarVisible(false);
    }, 2500);
  }, []);

  const openSidebarSearch = useCallback(() => {
    setSidebarCollapsed(false);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

  useEffect(() => {
    setRecentSessions(loadRecentSessions(userId));
  }, [userId]);

  useEffect(() => {
    if (!location.state?.fromMiniChat) return;
    navigate('/ai-assistant', { replace: true, state: null });
  }, [location.state, navigate]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const persistCurrentSession = useCallback(
    (history, convId, replies = []) => {
      if (!convId || !history.some((m) => m.type === 'user')) return;
      const existing = loadRecentSessions(userId).find((s) => s.id === convId);
      const firstUser = history.find((m) => m.type === 'user');
      saveRecentSession(userId, {
        id: convId,
        title: titleFromMessages(history),
        createdAt: existing?.createdAt ?? firstUser?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        messages: history,
      });
      saveActiveSession(userId, {
        conversationId: convId,
        messages: history,
        quickReplies: replies,
      });
      setRecentSessions(loadRecentSessions(userId));
    },
    [userId],
  );

  const resetChatUi = useCallback(() => {
    clearActiveSession(userId);
    setConversationId(null);
    setChatHistory([welcomeMessage()]);
    setQuickReplies([]);
    setError(null);
    setInputText('');
    setOpenMenuId(null);
  }, [userId, welcomeMessage]);

  const startNewChat = useCallback(() => {
    if (conversationId && chatHistory.some((m) => m.type === 'user')) {
      persistCurrentSession(chatHistory, conversationId, quickReplies);
    }
    resetChatUi();
    setSidebarOpen(false);
  }, [chatHistory, conversationId, quickReplies, persistCurrentSession, resetChatUi]);

  const handleDeleteSession = useCallback(
    async (sessionId, event) => {
      event?.stopPropagation();
      if (!sessionId || !userId) return;
      try {
        await deleteConversation(sessionId);
      } catch (err) {
        if (err?.message && !/not found|404/i.test(err.message)) {
          setError(err.message);
          return;
        }
      }
      removeRecentSession(userId, sessionId);
      setRecentSessions(loadRecentSessions(userId));
      setOpenMenuId(null);
      if (conversationId === sessionId) {
        resetChatUi();
      }
    },
    [conversationId, resetChatUi, userId],
  );

  const handleClearAllHistory = useCallback(async () => {
    if (!userId) return;
    const confirmed = window.confirm(t('ai.sidebar.clearConfirm'));
    if (!confirmed) return;
    try {
      await clearAllConversations({ trimQueryMemory: true });
    } catch (err) {
      setError(err.message);
      return;
    }
    clearAllRecentSessions(userId);
    setRecentSessions([]);
    resetChatUi();
  }, [resetChatUi, userId, t]);

  const openRecentSession = useCallback(
    (session) => {
      if (conversationId && conversationId !== session.id && chatHistory.some((m) => m.type === 'user')) {
        persistCurrentSession(chatHistory, conversationId, quickReplies);
      }
      const messages = session.messages?.length
        ? normalizeChatMessagesForStorage(session.messages)
        : [welcomeMessage()];
      setConversationId(session.id);
      setChatHistory(messages);
      setQuickReplies([]);
      setError(null);
      setInputText('');
      setOpenMenuId(null);
      saveActiveSession(userId, {
        conversationId: session.id,
        messages,
        quickReplies: [],
      });
      setSidebarOpen(false);
    },
    [chatHistory, conversationId, quickReplies, persistCurrentSession, userId, welcomeMessage],
  );

  useEffect(() => {
    return () => {
      if (conversationId && chatHistory.some((m) => m.type === 'user')) {
        saveActiveSession(userId, {
          conversationId,
          messages: chatHistory,
          quickReplies,
        });
      }
    };
  }, [conversationId, chatHistory, quickReplies, userId]);

  const scrollToBottom = () => {
    const chatArea = chatAreaRef.current;
    if (!chatArea) return;
    chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatHistory.length > 1 || isTyping) {
      scrollToBottom();
    }
  }, [chatHistory, isTyping]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputText]);

  const handleSearch = useCallback(
    async (text) => {
      const query = (text ?? inputText).trim();
      if (!query || isTyping) return;

      if (!userId) {
        setError(t('ai.errors.loginRequired'));
        return;
      }

      setError(null);
      const now = Date.now();
      const userMsgId = now;
      const aiMsgId = now + 1;
      setChatHistory((prev) => [...prev, { id: userMsgId, type: 'user', text: query, createdAt: now }]);
      setInputText('');
      setQuickReplies([]);
      setIsTyping(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setChatHistory((prev) => [
        ...prev,
        {
          id: aiMsgId,
          type: 'ai',
          text: '',
          streaming: true,
          hasResults: false,
          results: [],
          needGroups: [],
          relatedGroups: [],
          relatedEvents: [],
          createdAt: now,
        },
      ]);

      try {
        const result = await matchWithAiStream({
          message: query,
          conversationId,
          signal: controller.signal,
          onDelta: (_chunk, streamedText) => {
            setChatHistory((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, text: streamedText, streaming: true } : msg,
              ),
            );
          },
          onMetadata: (partial, streamRetrievalFlow, _streamTraceId, userMessage) => {
            const raw = mapFlowSteps(streamRetrievalFlow);
            const fromStream =
              raw.length && !isFallbackRetrievalFlow(raw)
                ? patchQueryWithUserMessage(raw, userMessage || query)
                : null;
            const fromPartial =
              partial?.retrievalFlow?.length && !isFallbackRetrievalFlow(partial.retrievalFlow)
                ? partial.retrievalFlow
                : null;
            const previewFlow = fromStream || fromPartial;
            if (!previewFlow?.length) return;
            setChatHistory((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, retrievalFlow: previewFlow } : msg,
              ),
            );
          },
        });

        setConversationId(result.conversation_id);

        const assistantText =
          result.assistant_message ||
          result.clarifyingQuestion ||
          result.conversation_progress?.clarifying_question ||
          result.response?.assistant_message ||
          result.response?.conversation_progress?.clarifying_question ||
          (result.results?.length > 0
            ? `${t('ai.errors.fallbackResults')} (${result.results.length})`
            : null) ||
          t('ai.errors.fallbackAck');

        const hasResults =
          !result.gateRefusal &&
          (result.results?.length > 0 ||
            result.needGroups?.length > 0 ||
            result.relatedPosts?.length > 0 ||
            result.relatedGroups?.length > 0 ||
            result.relatedEvents?.length > 0);
        const replies = result.quickReplies || [];
        setQuickReplies(replies);

        setChatHistory((prev) => {
          const next = prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  type: 'ai',
                  text: result.gateRefusal ? '' : assistantText,
                  streaming: false,
                  hasResults,
                  results: result.results,
                  needGroups: result.needGroups || [],
                  relatedPosts: result.relatedPosts || [],
                  relatedGroups: result.relatedGroups || [],
                  relatedEvents: result.relatedEvents || [],
                  retrievalFlow: result.retrievalFlow || [],
                  gateRefusal: result.gateRefusal || null,
                  intent: result.intent || result.response?.intent || null,
                }
              : msg,
          );
          persistCurrentSession(next, result.conversation_id, replies);
          return next;
        });
      } catch (err) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          setChatHistory((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    text: msg.text?.trim() ? msg.text : t('ai.errors.fallbackAck'),
                    hasResults: false,
                    streaming: false,
                    stopped: true,
                  }
                : msg,
            ),
          );
          return;
        }
        setError(err.message);
        setChatHistory((prev) => {
          const withoutPlaceholder = prev.filter((msg) => msg.id !== aiMsgId);
          const failedAt = Date.now();
          return [
            ...withoutPlaceholder,
            {
              id: aiMsgId,
              type: 'ai',
              text: err.message || t('ai.errors.connection'),
              hasResults: false,
              streaming: false,
              createdAt: failedAt,
            },
          ];
        });
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsTyping(false);
      }
    },
    [conversationId, inputText, isTyping, userId, persistCurrentSession, t],
  );

  const handleStopResponse = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!initialQuery) return;
    handleSearch(initialQuery);
    navigate('/ai-assistant', { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleBookingClick = async (member) => {
    setSelectedProvider(member);
    setIsBookingModalOpen(true);
    try {
      await recordUserAction({
        actionType: 'BOOK_MEMBER',
        targetId: member.id,
        conversationId,
      });
    } catch {
      /* non-blocking */
    }
  };

  const handleQuickReply = (value) => {
    handleSearch(value);
  };

  const renderComposer = (variant = 'thread') => (
    <div className={`ai-assistant-composer ai-assistant-composer--${variant}`}>
      <div className="ai-assistant-composer-inner">
        {quickReplies.length > 0 && (
          <div className="ai-assistant-quick-chips">
            {quickReplies.map((reply) => (
              <button
                key={reply.value || reply.label}
                type="button"
                className="ai-assistant-quick-chip"
                onClick={() => handleQuickReply(reply.value || reply.label)}
                disabled={isTyping}
              >
                {reply.label}
              </button>
            ))}
          </div>
        )}

        {error && <p className="ai-assistant-error-banner">{error}</p>}

        <div className="ai-assistant-composer-pill">
          <button type="button" className="ai-assistant-composer-plus" aria-label={t('ai.aria.attach')} disabled>
            <Plus size={20} strokeWidth={1.75} />
          </button>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.composer.placeholder')}
            className="ai-assistant-textarea"
            rows={1}
          />
          <div className="ai-assistant-composer-actions">
            <button type="button" className="ai-assistant-mic-btn" aria-label={t('ai.aria.mic')} disabled>
              <Mic size={20} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={isTyping ? handleStopResponse : () => handleSearch()}
              disabled={!isTyping && !hasInput}
              className={`ai-assistant-send-btn${isTyping ? ' ai-assistant-send-btn--stop' : ''}`}
              aria-label={isTyping ? 'Dừng trả lời' : t('ai.composer.send')}
              title={isTyping ? 'Dừng trả lời' : t('ai.composer.send')}
            >
              {isTyping ? <Square size={14} fill="currentColor" strokeWidth={2.5} /> : <Send size={18} strokeWidth={2} />}
            </button>
          </div>
        </div>
        <p className="ai-assistant-disclaimer">{t('ai.composer.disclaimer')}</p>
      </div>
    </div>
  );

  const renderResultCard = (res) => (
    <>
      <div className="ai-assistant-result-header">
        <img src={res.avatar} alt={res.name} className="ai-assistant-result-avatar" />
        <div className="ai-assistant-result-info">
          <h4 className="ai-assistant-result-name">
            {res.name}{' '}
            {res.verified && <ShieldCheck size={14} className="ai-assistant-verified" />}
          </h4>
          <p className="ai-assistant-result-title">{res.title}</p>
          <div className="ai-assistant-result-stats">
            <span className="ai-assistant-result-rating">
              <Star size={12} className="ai-assistant-rating-icon" fill="currentColor" /> {res.rating}
            </span>
            <span className="ai-assistant-result-dot">•</span>
            <span>{t('ai.results.trust')} {res.trust}</span>
          </div>
        </div>
      </div>

      <div className="ai-assistant-result-status">
        {res.availableNow ? (
          <span className="ai-assistant-status-available">
            <span className="ai-assistant-status-dot available" /> {t('ai.results.available')}
          </span>
        ) : (
          <span className="ai-assistant-status-unavailable">
            <span className="ai-assistant-status-dot unavailable" /> {t('ai.results.book')}
          </span>
        )}
        <span className="ai-assistant-response-time">
          <Clock size={12} /> {res.responseTime}
        </span>
      </div>

      {res.reason && (
        <div className="ai-assistant-result-reason">
          <Sparkles size={14} className="ai-assistant-reason-icon" />
          <p className="ai-assistant-reason-text">{res.reason}</p>
        </div>
      )}

      <div className="ai-assistant-result-actions">
        <button
          type="button"
          onClick={() => setSelectedProfileId(res.id)}
          className="ai-assistant-btn-secondary"
        >
          {t('ai.results.viewProfile')}
        </button>
        <button type="button" onClick={() => handleBookingClick(res)} className="ai-assistant-btn-primary">
          {t('ai.results.bookNow')}
        </button>
      </div>
    </>
  );

  const renderMessageTurn = (msg) => {
    const isEmptyStreaming =
      msg.type === 'ai' && msg.streaming && !(msg.text || '').trim() && !msg.gateRefusal;
    const showGateCard = msg.type === 'ai' && msg.gateRefusal;
    const msgTime = resolveMessageTimestamp(msg);
    const showTime = !isEmptyStreaming;

    return (
    <article key={msg.id} className={`ai-assistant-turn ai-assistant-turn--${msg.type}`}>
      <div className="ai-assistant-turn-inner">
        {msg.type === 'ai' && (
          <div className="ai-assistant-turn-avatar" aria-hidden>
            <MascotPet mood={msg.streaming ? 'thinking' : 'idle'} size="bubble" />
          </div>
        )}
        <div className="ai-assistant-turn-body">
          {msg.type === 'ai' && <p className="ai-assistant-turn-role">{t('ai.thread.vini')}</p>}
          {isEmptyStreaming ? (
            <p className="ai-assistant-waiting-message" aria-live="polite">
              {waitingMessage}
            </p>
          ) : showGateCard ? (
            <ViniGateRefusalCard
              card={msg.gateRefusal}
              onSuggestionClick={handleQuickReply}
              disabled={isTyping}
            />
          ) : (
            <div className="ai-assistant-turn-text">{msg.text}</div>
          )}

          {!showGateCard && msg.needGroups?.length > 0 ? (
            <div className="ai-assistant-need-groups">
              {msg.needGroups.map((group) => (
                <section key={group.key} className="ai-assistant-need-group">
                  <header className="ai-assistant-need-group-head">
                    <h4 className="ai-assistant-need-group-title">{group.label}</h4>
                    <blockquote className="ai-assistant-need-group-quote">
                      &ldquo;{group.userQuote}&rdquo;
                    </blockquote>
                    {group.hint ? (
                      <p className="ai-assistant-need-group-hint">{group.hint}</p>
                    ) : null}
                  </header>
                  {group.results?.length > 0 ? (
                    <div className="ai-assistant-results-grid">
                      {group.results.map((res) => (
                        <div key={`${group.key}-${res.id}`} className="ai-assistant-result-card">
                          {renderResultCard(res)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ai-assistant-need-group-empty">{t('ai.results.emptyGroup')}</p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            !showGateCard &&
            msg.hasResults &&
            msg.results?.length > 0 && (
              <div className="ai-assistant-results-grid">
                {msg.results.map((res) => (
                  <div key={res.id} className="ai-assistant-result-card">
                    {renderResultCard(res)}
                  </div>
                ))}
              </div>
            )
          )}

          {!showGateCard &&
          (msg.relatedPosts?.length || msg.relatedEvents?.length || msg.relatedGroups?.length) ? (
            <CommunityLinksPanel
              posts={msg.relatedPosts}
              events={msg.relatedEvents}
              groups={msg.relatedGroups}
              intent={msg.intent}
            />
          ) : null}

          {msg.type === 'ai' && !msg.streaming && !showGateCard && msg.retrievalFlow?.length > 0 ? (
            <PipelineFlowPanel
              steps={msg.retrievalFlow}
              title={t('ai.thread.pipeline')}
              defaultOpen
            />
          ) : null}

          {showTime ? (
            <time
              className="ai-assistant-turn-time"
              dateTime={new Date(msgTime).toISOString()}
              title={new Date(msgTime).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')}
            >
              {formatMessageTime(msgTime, locale)}
            </time>
          ) : null}
        </div>
      </div>
    </article>
    );
  };

  return (
    <div className="ai-assistant-container">
      {sidebarOpen && (
        <button
          type="button"
          className="ai-assistant-sidebar-backdrop"
          aria-label={t('ai.aria.closeMenu')}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`ai-assistant-sidebar${sidebarOpen ? ' is-open' : ''}${sidebarCollapsed ? ' is-collapsed' : ''}`}
      >
        <div className="ai-assistant-sidebar-head">
          {!sidebarCollapsed && (
            <span className="ai-assistant-sidebar-title">
              V-Connect <span className="ai-assistant-sidebar-title-accent">AI</span>
            </span>
          )}
          <button
            type="button"
            className="ai-assistant-collapse-btn"
            aria-label={sidebarCollapsed ? t('ai.aria.expandSidebar') : t('ai.aria.collapseSidebar')}
            onClick={() => setSidebarCollapsed((v) => !v)}
          >
            <SidebarToggleIcon size={20} />
          </button>
        </div>

        <div className="ai-assistant-sidebar-body">
          <button
            type="button"
            className="ai-assistant-sidebar-new"
            onClick={startNewChat}
            title={t('ai.sidebar.newChat')}
          >
            <SquarePen size={18} strokeWidth={1.75} />
            {!sidebarCollapsed && <span>{t('ai.sidebar.newChat')}</span>}
          </button>

          {sidebarCollapsed ? (
            <button
              type="button"
              className="ai-assistant-sidebar-rail-btn"
              title={t('ai.sidebar.search')}
              aria-label={t('ai.sidebar.search')}
              onClick={openSidebarSearch}
            >
              <Search size={20} strokeWidth={1.75} />
            </button>
          ) : (
            <label className="ai-assistant-sidebar-search ai-assistant-sidebar-search--box">
              <Search size={18} strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="search"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={t('ai.sidebar.search')}
                aria-label={t('ai.sidebar.search')}
              />
            </label>
          )}

          {!sidebarCollapsed && (
            <div className="ai-assistant-recent">
              <h4 className="ai-assistant-recent-title">{t('ai.sidebar.recent')}</h4>
              {filteredRecentSessions.length === 0 ? (
                <p className="ai-assistant-recent-empty">
                  {historySearch.trim() ? t('ai.sidebar.emptySearch') : t('ai.sidebar.emptyRecent')}
                </p>
              ) : (
                <ul className="ai-assistant-recent-list">
                  {filteredRecentSessions.map((session) => (
                    <li key={session.id} className="ai-assistant-recent-row">
                      <button
                        type="button"
                        className={`ai-assistant-recent-item${conversationId === session.id ? ' is-active' : ''}`}
                        onClick={() => openRecentSession(session)}
                      >
                        <span className="ai-assistant-recent-icon" aria-hidden>
                          <MessageCircle size={16} strokeWidth={1.75} />
                        </span>
                        <span className="ai-assistant-recent-meta">
                          <span className="ai-assistant-recent-label">{session.title}</span>
                          <span className="ai-assistant-recent-time">
                            {formatConversationTime(session.updatedAt || session.createdAt || Date.now(), locale)}
                          </span>
                        </span>
                      </button>
                      <div className="ai-assistant-recent-menu-wrap" ref={openMenuId === session.id ? menuRef : null}>
                        <button
                          type="button"
                          className="ai-assistant-recent-menu-btn"
                          aria-label={t('ai.aria.threadOptions')}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId((id) => (id === session.id ? null : session.id));
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === session.id && (
                          <div className="ai-assistant-session-menu">
                            <button type="button" onClick={(e) => handleDeleteSession(session.id, e)}>
                              <Trash2 size={14} />
                              {t('ai.sidebar.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {recentSessions.length > 0 && (
                <button type="button" className="ai-assistant-clear-history" onClick={handleClearAllHistory}>
                  {t('ai.sidebar.clearAll')}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="ai-assistant-sidebar-foot">
          {!sidebarCollapsed ? (
            <>
              <div className="ai-assistant-sidebar-foot-divider" aria-hidden />
              <button
                type="button"
                className="ai-assistant-sidebar-foot-link"
                title={t('ai.sidebar.settings')}
                onClick={() => navigate('/settings')}
              >
                <Settings size={18} strokeWidth={1.75} />
                <span>{t('ai.sidebar.settings')}</span>
              </button>
              <button
                type="button"
                className="ai-assistant-sidebar-foot-link"
                title={t('ai.sidebar.help')}
                onClick={() => setHelpOpen(true)}
              >
                <HelpCircle size={18} strokeWidth={1.75} />
                <span>{t('ai.sidebar.help')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="ai-assistant-sidebar-rail-btn"
                title={t('ai.sidebar.settings')}
                aria-label={t('ai.sidebar.settings')}
                onClick={() => navigate('/settings')}
              >
                <Settings size={20} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className="ai-assistant-sidebar-rail-btn"
                title={t('ai.sidebar.help')}
                aria-label={t('ai.sidebar.help')}
                onClick={() => setHelpOpen(true)}
              >
                <HelpCircle size={20} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
      </aside>

      {helpOpen && (
        <div className="ai-assistant-help-backdrop" role="presentation" onClick={() => setHelpOpen(false)}>
          <div
            className="ai-assistant-help-panel"
            role="dialog"
            aria-labelledby="ai-assistant-help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ai-assistant-help-title" className="ai-assistant-help-title">
              {t('ai.help.title')}
            </h2>
            <ul className="ai-assistant-help-list">
              {helpTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <button type="button" className="ai-assistant-help-close" onClick={() => setHelpOpen(false)}>
              {t('ai.help.close')}
            </button>
          </div>
        </div>
      )}

      <div className="ai-assistant-main">
        <header className="ai-assistant-main-bar">
          <button
            type="button"
            className="ai-assistant-mobile-open"
            aria-label={t('ai.aria.openHistory')}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
        </header>

        <div className="ai-assistant-chat-area" ref={chatAreaRef}>
          {isFreshChat ? (
            <div className="ai-assistant-home">
              <h1 className="ai-assistant-home-greeting">{homeGreeting}</h1>
              <div className="ai-assistant-home-suggestions">
                {homePromptSuggestions.map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    className="ai-assistant-home-chip"
                    onClick={() => handleSearch(item.text)}
                    disabled={isTyping}
                  >
                    <span className="ai-assistant-home-chip-icon" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="ai-assistant-home-chip-label">{item.label}</span>
                  </button>
                ))}
              </div>
              {renderComposer('home')}
            </div>
          ) : (
            <>
              <div
                className={`ai-assistant-scroll-viewport${scrollbarVisible ? ' is-scrollbar-visible' : ''}`}
                ref={chatAreaRef}
                onMouseDown={revealScrollbar}
                onScroll={revealScrollbar}
                onWheel={revealScrollbar}
                tabIndex={-1}
                onFocus={revealScrollbar}
              >
                <div className="ai-assistant-thread">
                  {!isFreshChat && conversationTimes.startedAt ? (
                    <p className="ai-assistant-thread-meta">
                      {t('ai.thread.started')} {formatMessageTime(conversationTimes.startedAt, locale)}
                      {conversationTimes.updatedAt &&
                      conversationTimes.updatedAt !== conversationTimes.startedAt ? (
                        <>
                          {' '}
                          · {t('ai.thread.updated')} {formatMessageTime(conversationTimes.updatedAt, locale)}
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  {chatHistory
                    .filter((msg, index) => !(index === 0 && msg.type === 'ai'))
                    .map((msg) => renderMessageTurn(msg))}
                </div>
              </div>
              {renderComposer('thread')}
            </>
          )}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider={selectedProvider}
      />

      <ProfileDrawer
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        profileId={selectedProfileId}
      />
    </div>
  );
};

export default AiAssistant;
