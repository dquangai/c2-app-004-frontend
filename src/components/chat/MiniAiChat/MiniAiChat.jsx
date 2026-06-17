import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, X, Maximize2, Trash2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth/useAuth';
import { matchWithAi, recordUserAction } from '../../../services/matchingService';
import { deleteConversation } from '../../../services/chatService';
import { persistChatSession, normalizeChatMessagesForStorage, clearAllRecentSessions, formatMessageTime, resolveMessageTimestamp } from '../../../utils/chatSessionStorage';
import ProfileDrawer from '../../profile/ProfileDrawer/ProfileDrawer';
import BookingModal from '../../booking/BookingModal/BookingModal';
import MascotPet from './MascotPet';
import ViniGateRefusalCard from '../ViniGateRefusalCard';
import CommunityLinksPanel from '../CommunityLinksPanel/CommunityLinksPanel';
import { useViniWaitingMessage } from '../viniWaitingMessages';
import { useChatPromptSuggestions } from '../chatPromptSuggestions';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';
import './MiniAiChat.css';

const ROUTE_DIALOGUE_KEYS = {
  '/': 'home',
  '/directory': 'directory',
  '/groups': 'groups',
  '/social': 'social',
  '/chat': 'chat',
  '/history': 'history',
  '/calendar': 'calendar',
  '/settings': 'settings',
  '/become-provider': 'becomeProvider',
};

const MiniAiChat = () => {
  const { user } = useAuth();
  const { locale, t } = useLanguage();

  const getRouteDialogue = useCallback(
    (pathname) => {
      if (pathname.startsWith('/profile/')) {
        return t('components.miniChat.profileRoute');
      }
      const routeKey = ROUTE_DIALOGUE_KEYS[pathname];
      return routeKey ? t(`components.miniChat.routes.${routeKey}`) : undefined;
    },
    [t],
  );

  const welcomeMessage = useCallback(() => {
    const now = Date.now();
    return {
      id: now,
      type: 'ai',
      text: t('components.miniChat.welcome'),
      createdAt: now,
    };
  }, [t]);
  useChatPromptSuggestions(); // locale-aware suggestions for future UI
  const userId = user?.id;
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mascotMood, setMascotMood] = useState('idle');
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState(() => t('components.miniChat.hint'));
  const [dialogueMood, setDialogueMood] = useState(null);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [quickReplies, setQuickReplies] = useState([]);
  const [chatHistory, setChatHistory] = useState(() => [welcomeMessage()]);
  const [isTyping, setIsTyping] = useState(false);
  const waitingMessage = useViniWaitingMessage(isTyping);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const chatAreaRef = useRef(null);
  const hintTimeoutRef = useRef(null);
  const lastRouteDialogueRef = useRef(null);
  const previousOpenRef = useRef(false);
  const suppressCloseDialogueRef = useRef(false);

  const hiddenOnPage = location.pathname === '/ai-assistant';

  const speak = useCallback(
    (message, { mood = 'happy', duration = 5200 } = {}) => {
      if (!message || hiddenOnPage || isOpen) return;
      window.clearTimeout(hintTimeoutRef.current);
      setHintText(message);
      setShowHint(true);
      setDialogueMood(mood);
      hintTimeoutRef.current = window.setTimeout(() => {
        setShowHint(false);
        setDialogueMood(null);
      }, duration);
    },
    [hiddenOnPage, isOpen],
  );

  const scrollToBottom = useCallback(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [chatHistory, isTyping, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isTyping) {
      setMascotMood('thinking');
      return;
    }
    if (isOpen) {
      setMascotMood('open');
      return;
    }
    if (isHovered) {
      setMascotMood('hover');
      return;
    }
    if (dialogueMood) {
      setMascotMood(dialogueMood);
      return;
    }
    setMascotMood('idle');
  }, [dialogueMood, isTyping, isOpen, isHovered]);

  useEffect(() => {
    if (hiddenOnPage || isOpen) return undefined;
    const routeDialogue = getRouteDialogue(location.pathname);
    if (!routeDialogue || lastRouteDialogueRef.current === location.pathname) return undefined;
    lastRouteDialogueRef.current = location.pathname;
    window.clearTimeout(hintTimeoutRef.current);
    setHintText(routeDialogue);
    setShowHint(true);
    setDialogueMood('happy');
    hintTimeoutRef.current = window.setTimeout(() => {
      setShowHint(false);
      setDialogueMood(null);
    }, 5600);
    return undefined;
  }, [getRouteDialogue, hiddenOnPage, isOpen, location.pathname]);

  useEffect(() => {
    const handleViniSay = (event) => {
      const message = event.detail?.message;
      if (typeof message !== 'string') return;
      speak(message, {
        mood: event.detail?.mood || 'happy',
        duration: event.detail?.duration || 4800,
      });
    };
    window.addEventListener('vini:say', handleViniSay);
    return () => window.removeEventListener('vini:say', handleViniSay);
  }, [speak]);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = isOpen;
    if (!wasOpen || isOpen || hiddenOnPage) return undefined;
    if (suppressCloseDialogueRef.current) {
      suppressCloseDialogueRef.current = false;
      return undefined;
    }
    const timer = window.setTimeout(() => {
      speak(t('components.miniChat.closeDialogue'), { mood: 'idle', duration: 3600 });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [hiddenOnPage, isOpen, speak, t]);

  useEffect(() => {
    return () => {
      window.clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  const toggleOpen = () => {
    setIsOpen((open) => {
      if (!open) {
        setMascotMood('happy');
        setShowHint(false);
        setTimeout(() => setMascotMood('open'), 520);
      }
      return !open;
    });
  };

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
      setChatHistory((prev) => [...prev, { id: now, type: 'user', text: query, createdAt: now }]);
      setInputText('');
      setQuickReplies([]);
      setIsTyping(true);

      try {
        const result = await matchWithAi({ message: query, conversationId });
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

        const aiAt = Date.now();
        setQuickReplies(result.quickReplies || []);
        setChatHistory((prev) => {
          const next = [
            ...prev,
            {
              id: aiAt,
              type: 'ai',
              text: result.gateRefusal ? '' : assistantText,
              hasResults: result.gateRefusal
                ? false
                : Boolean(
                    result.results?.length ||
                      result.relatedPosts?.length ||
                      result.relatedGroups?.length ||
                      result.relatedEvents?.length,
                  ),
              results: result.results,
              relatedPosts: result.relatedPosts || [],
              relatedGroups: result.relatedGroups || [],
              relatedEvents: result.relatedEvents || [],
              gateRefusal: result.gateRefusal || null,
              createdAt: aiAt,
            },
          ];
          persistChatSession(userId, {
            conversationId: result.conversation_id,
            messages: next,
            quickReplies: result.quickReplies || [],
          });
          return next;
        });
      } catch (err) {
        setError(err.message);
        const failedAt = Date.now();
        setChatHistory((prev) => [
          ...prev,
          {
            id: failedAt,
            type: 'ai',
            text: err.message || t('ai.errors.connection'),
            createdAt: failedAt,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [conversationId, inputText, isTyping, userId, t]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearChatHistory = useCallback(async () => {
    if (!userId) return;
    const hasUserMessages = chatHistory.some((m) => m.type === 'user');
    if (!hasUserMessages) {
      setChatHistory([welcomeMessage()]);
      setConversationId(null);
      setQuickReplies([]);
      setError(null);
      return;
    }
    const confirmed = window.confirm(t('ai.mini.clearConfirm'));
    if (!confirmed) return;
    if (conversationId) {
      try {
        await deleteConversation(conversationId);
      } catch {
        /* local clear even if backend already gone */
      }
    }
    clearAllRecentSessions(userId);
    setConversationId(null);
    setChatHistory([welcomeMessage()]);
    setQuickReplies([]);
    setError(null);
    setInputText('');
  }, [chatHistory, conversationId, userId, t, welcomeMessage]);

  const openFullAssistant = () => {
    const normalized = normalizeChatMessagesForStorage(chatHistory);
    if (userId && conversationId && normalized.some((m) => m.type === 'user')) {
      persistChatSession(userId, {
        conversationId,
        messages: normalized,
        quickReplies,
      });
    }
    suppressCloseDialogueRef.current = true;
    setIsOpen(false);
    navigate('/ai-assistant', {
      state: {
        fromMiniChat: true,
        conversationId,
        messages: normalized,
        quickReplies,
      },
    });
  };

  if (hiddenOnPage) return null;

  const isFreshChat = !chatHistory.some((m) => m.type === 'user');
  const conversationStartedAt = chatHistory.find((m) => m.type === 'user')?.createdAt;

  return (
    <div className="mini-ai-chat" aria-live="polite">
      {isOpen && (
        <div className="mini-ai-chat__panel" role="dialog" aria-label={t('ai.mini.title')}>
          <header className="mini-ai-chat__header">
            <div className="mini-ai-chat__header-info">
              <span className="mini-ai-chat__avatar">
                <MascotPet mood={isTyping ? 'thinking' : 'open'} size="header" />
              </span>
              <div>
                <h3 className="mini-ai-chat__title">{t('ai.mini.title')}</h3>
                <p className="mini-ai-chat__subtitle">
                  {isTyping
                    ? t('ai.mini.thinking')
                    : conversationStartedAt
                      ? `${t('ai.mini.started')} ${formatMessageTime(conversationStartedAt, locale)}`
                      : t('ai.mini.hint')}
                </p>
              </div>
            </div>
            <div className="mini-ai-chat__header-actions">
              {chatHistory.some((m) => m.type === 'user') && (
                <button
                  type="button"
                  className="mini-ai-chat__icon-btn"
                  onClick={clearChatHistory}
                  aria-label={t('ai.mini.clearHistory')}
                  title={t('ai.mini.clearHistory')}
                >
                  <Trash2 size={17} />
                </button>
              )}
              <button
                type="button"
                className="mini-ai-chat__icon-btn"
                onClick={openFullAssistant}
                aria-label={t('ai.mini.expand')}
                title={t('ai.mini.expand')}
              >
                <Maximize2 size={18} />
              </button>
              <button
                type="button"
                className="mini-ai-chat__icon-btn"
                onClick={() => setIsOpen(false)}
                aria-label={t('ai.mini.close')}
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="mini-ai-chat__body" ref={chatAreaRef}>
            {chatHistory.map((msg) => {
              const msgTime = resolveMessageTimestamp(msg);
              return (
              <div key={msg.id} className={`mini-ai-chat__row mini-ai-chat__row--${msg.type}`}>
                {msg.type === 'ai' && (
                  <span className="mini-ai-chat__bubble-avatar">
                    <MascotPet mood="idle" size="bubble" />
                  </span>
                )}
                <div className="mini-ai-chat__bubble-wrap">
                <div
                  className={`mini-ai-chat__bubble mini-ai-chat__bubble--${msg.type}${
                    msg.gateRefusal ? ' mini-ai-chat__bubble--gate' : ''
                  }`}
                >
                  {msg.gateRefusal ? (
                    <ViniGateRefusalCard
                      card={msg.gateRefusal}
                      onSuggestionClick={handleSearch}
                      disabled={isTyping}
                      compact
                    />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  {!msg.gateRefusal && msg.results?.length > 0 && (
                    <ul className="mini-ai-chat__results">
                      {msg.results.slice(0, 3).map((res) => (
                        <li key={res.id}>
                          <button
                            type="button"
                            className="mini-ai-btn-secondary"
                            onClick={() => {
                              setSelectedProfileId(res.id);
                            }}
                          >
                            {res.name} · {res.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!msg.gateRefusal &&
                  (msg.relatedPosts?.length || msg.relatedEvents?.length || msg.relatedGroups?.length) ? (
                    <CommunityLinksPanel
                      posts={msg.relatedPosts}
                      events={msg.relatedEvents}
                      groups={msg.relatedGroups}
                    />
                  ) : null}
                </div>
                <time
                  className="mini-ai-chat__time"
                  dateTime={new Date(msgTime).toISOString()}
                >
                  {formatMessageTime(msgTime, locale)}
                </time>
                </div>
              </div>
            );})}

            {isTyping && (
              <div className="mini-ai-chat__row mini-ai-chat__row--ai mini-ai-chat__row--waiting">
                <span className="mini-ai-chat__bubble-avatar">
                  <MascotPet mood="thinking" size="bubble" />
                </span>
                <div className="mini-ai-chat__waiting">
                  <p className="mini-ai-chat__waiting-role">{t('ai.thread.vini')}</p>
                  <p className="mini-ai-chat__waiting-text" aria-live="polite">
                    {waitingMessage}
                  </p>
                </div>
              </div>
            )}
          </div>

          {quickReplies.length > 0 && (
            <div className="mini-ai-chat__quick-replies">
              {quickReplies.map((reply) => (
                <button
                  key={reply.value || reply.label}
                  type="button"
                  className="mini-ai-chat__quick-btn"
                  onClick={() => handleSearch(reply.value || reply.label)}
                >
                  {reply.label}
                </button>
              ))}
            </div>
          )}

          {error && <p className="mini-ai-chat__error">{error}</p>}

          <footer className="mini-ai-chat__footer">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai.mini.placeholder')}
              className="mini-ai-chat__input"
              rows={1}
            />
            <button
              type="button"
              className="mini-ai-chat__send"
              onClick={() => handleSearch()}
              disabled={!inputText.trim() || isTyping}
              aria-label={t('ai.composer.send')}
            >
              <Send size={16} />
            </button>
          </footer>
        </div>
      )}

      {!isOpen && showHint && (
        <div className="mini-ai-chat__hint" role="status">
          {hintText}
        </div>
      )}

      <button
        type="button"
        className={`mini-ai-chat__mascot-btn${isOpen ? ' mini-ai-chat__mascot-btn--open' : ''}`}
        onClick={toggleOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={isOpen ? t('components.miniChat.collapse') : t('components.miniChat.open')}
        aria-expanded={isOpen}
      >
        <MascotPet mood={mascotMood} size="fab" />
      </button>

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

export default MiniAiChat;
