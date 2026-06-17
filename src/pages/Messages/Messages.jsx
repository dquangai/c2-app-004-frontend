import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  Search,
  Info,
  ImagePlus,
  Smile,
  Send,
  Star,
  ThumbsUp,
  PenSquare,
  MoreVertical,
  Trash2,
  Flag,
  UserRound,
  X,
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import ProfileDrawer from '../../components/profile/ProfileDrawer/ProfileDrawer';
import {
  deleteThread,
  fetchBookedMeThreads,
  fetchBookedThreads,
  fetchThreadDetail,
  formatMessageTime,
  ensureDemoConversations,
  peekBookedMeThreads,
  peekBookedThreads,
  peekThreadDetail,
  reviewThreadMember,
  sendDirectMessage,
} from '../../services/messageService';
import { avatarFor } from '../../utils/memberMapper';
import './Messages.css';

const PROVIDER_MEMBER_ID = import.meta.env.VITE_PROVIDER_MEMBER_ID || 'mem_001';

function friendlyApiError(message, t) {
  if (message.includes('Not authenticated') || message.includes('Invalid token')) {
    return t('messages.loginRequired');
  }
  if (message.includes('Database schema') || message.includes('Không kết nối được PostgreSQL')) {
    return message;
  }
  if (message === 'Not Found' || message.includes('404')) {
    return t('messages.backendWrong');
  }
  if (message.includes('Network Error') || message.includes('Không thể kết nối')) {
    return t('messages.networkError');
  }
  return message;
}

function formatDayLabel(isoValue, t, locale) {
  if (!isoValue) return '';
  const dt = new Date(isoValue);
  if (Number.isNaN(dt.getTime())) return '';
  const now = new Date();
  if (dt.toDateString() === now.toDateString()) return t('messages.today');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dt.toDateString() === yesterday.toDateString()) return t('messages.yesterday');
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  return dt.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'short' });
}

function groupMessagesBySender(messages) {
  if (!messages.length) return [];
  const groups = [];
  messages.forEach((msg, index) => {
    const prev = messages[index - 1];
    const sameSender = prev && prev.sender_type === msg.sender_type;
    const gapMs = prev
      ? new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()
      : Infinity;
    if (sameSender && gapMs < 120000 && groups.length) {
      groups[groups.length - 1].messages.push(msg);
    } else {
      groups.push({ senderType: msg.sender_type, messages: [msg], day: msg.created_at });
    }
  });
  return groups;
}

function formatBubbleTime(isoValue, locale) {
  if (!isoValue) return '';
  const dt = new Date(isoValue);
  if (Number.isNaN(dt.getTime())) return '';
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  return dt.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
}

function bookingStatusLabel(status, t) {
  if (status === 'pending') return { text: t('messages.bookingPending'), className: 'messenger-booking--pending' };
  if (status === 'accepted') return { text: t('messages.bookingAccepted'), className: 'messenger-booking--accepted' };
  if (status === 'cancelled') return { text: t('messages.bookingCancelled'), className: 'messenger-booking--cancelled' };
  return null;
}

function MessengerBubble({ text, variant, position }) {
  return (
    <div
      className={[
        'messenger-bubble',
        variant === 'sent' ? 'messenger-bubble--sent' : 'messenger-bubble--received',
        position === 'single' && 'messenger-bubble--single',
        position === 'first' && 'messenger-bubble--first',
        position === 'middle' && 'messenger-bubble--middle',
        position === 'last' && 'messenger-bubble--last',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="messenger-bubble__text">{text}</span>
    </div>
  );
}

const Messages = () => {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const userId = user?.id;
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('booked');
  const [threads, setThreads] = useState(() => peekBookedThreads() || []);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threadDetail, setThreadDetail] = useState(null);
  const [loading, setLoading] = useState(() => !peekBookedThreads());
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [participantPanelOpen, setParticipantPanelOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewNotice, setReviewNotice] = useState(null);
  const [deletingThreadId, setDeletingThreadId] = useState(null);
  const [openThreadMenuId, setOpenThreadMenuId] = useState(null);
  const [reportNotice, setReportNotice] = useState(null);

  const threadEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  const threadMenuRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const stickToBottomRef = useRef(true);

  const scrollChatToBottom = useCallback((behavior = 'auto') => {
    const el = chatBodyRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const isChatNearBottom = useCallback(() => {
    const el = chatBodyRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  }, []);

  const loadThreads = useCallback(async ({ silent = false, force = false } = {}) => {
    if (!userId && activeTab === 'booked') {
      setThreads([]);
      if (!silent) setLoading(false);
      return;
    }

    const memberKey = user?.member_id || PROVIDER_MEMBER_ID;
    if (!force) {
      const cached =
        activeTab === 'booked' ? peekBookedThreads() : peekBookedMeThreads(memberKey);
      if (cached) {
        setThreads(cached);
        setActiveThreadId((current) => current || (cached[0]?.id ?? null));
        if (!silent) setLoading(false);
        return;
      }
    }

    if (!silent) setLoading(true);
    setError(null);
    try {
      const data =
        activeTab === 'booked'
          ? await fetchBookedThreads({ force })
          : await fetchBookedMeThreads(memberKey, { force });
      setThreads(data);
      setActiveThreadId((current) => current || (data[0]?.id ?? null));
    } catch (err) {
      setError(friendlyApiError(err.message, t));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeTab, userId, user?.member_id, t]);

  const refreshThread = useCallback(async (threadId, { force = false } = {}) => {
    if (!threadId) return;
    if (!force) {
      const cached = peekThreadDetail(threadId);
      if (cached) {
        setThreadDetail(cached);
        return;
      }
    }
    try {
      const detail = await fetchThreadDetail(threadId, { force });
      setThreadDetail(detail);
    } catch (err) {
      setError(friendlyApiError(err.message, t));
    }
  }, [t]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const onDocClick = (event) => {
      if (threadMenuRef.current && !threadMenuRef.current.contains(event.target)) {
        setOpenThreadMenuId(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!userId) return;
    ensureDemoConversations(userId)
      .then((result) => {
        if (result?.created_thread_ids?.length) {
          loadThreads({ silent: true, force: true });
        }
      })
      .catch(() => {});
  }, [userId, loadThreads]);

  useEffect(() => {
    const stateThread = location.state?.threadId;
    const queryThread = searchParams.get('thread');
    const threadId = stateThread || queryThread;
    if (location.state?.tab === 'booked_me') setActiveTab('booked_me');
    if (threadId) setActiveThreadId(threadId);
  }, [location.state, searchParams]);

  useEffect(() => {
    if (!activeThreadId) {
      setThreadDetail(null);
      lastMessageIdRef.current = null;
      return;
    }
    lastMessageIdRef.current = null;
    stickToBottomRef.current = true;
    refreshThread(activeThreadId);
  }, [activeThreadId, refreshThread]);

  useEffect(() => {
    setParticipantPanelOpen(false);
    setProfileDrawerOpen(false);
    setReviewRating(5);
    setReviewComment('');
    setReviewNotice(null);
  }, [activeThreadId, activeTab]);

  useEffect(() => {
    const el = chatBodyRef.current;
    if (!el) return undefined;
    const onScroll = () => {
      stickToBottomRef.current = isChatNearBottom();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [activeThreadId, isChatNearBottom]);

  useEffect(() => {
    const messages = threadDetail?.messages;
    if (!messages?.length) return;

    const lastId = messages[messages.length - 1]?.id;
    const prevLastId = lastMessageIdRef.current;

    if (prevLastId === null) {
      requestAnimationFrame(() => scrollChatToBottom('auto'));
    } else if (lastId !== prevLastId && stickToBottomRef.current) {
      requestAnimationFrame(() => scrollChatToBottom('smooth'));
    }

    lastMessageIdRef.current = lastId;
  }, [threadDetail?.messages, scrollChatToBottom]);

  const activeThread =
    threadDetail?.thread || threads.find((item) => item.id === activeThreadId) || null;

  const canReviewActiveMember =
    activeTab === 'booked' && activeThread?.booking_status === 'accepted';

  const filteredThreads = threads.filter((thread) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const label =
      activeTab === 'booked_me' ? thread.requester_name || '' : thread.member_name || '';
    return (
      label.toLowerCase().includes(q) ||
      (thread.last_message || '').toLowerCase().includes(q)
    );
  });

  const threadDisplayName = (thread) =>
    activeTab === 'booked_me'
      ? thread.requester_name || t('messages.resident')
      : thread.member_name || thread.member_id;

  const handleDeleteThread = async (threadId, displayName) => {
    setOpenThreadMenuId(null);
    const label = displayName || t('messages.deleteFallback');
    if (!window.confirm(t('messages.deleteConfirm', { name: label }))) {
      return;
    }

    setDeletingThreadId(threadId);
    setError(null);
    try {
      await deleteThread(threadId);
      setThreads((prev) => {
        const next = prev.filter((item) => item.id !== threadId);
        if (activeThreadId === threadId) {
          setActiveThreadId(next[0]?.id ?? null);
          setThreadDetail(null);
        }
        return next;
      });
      await loadThreads({ silent: true, force: true });
    } catch (err) {
      setError(friendlyApiError(err.message, t));
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handleReportThread = (threadId, displayName) => {
    setOpenThreadMenuId(null);
    const label = displayName || t('messages.deleteFallback');
    if (!window.confirm(t('messages.reportConfirm', { name: label }))) {
      return;
    }

    setReportNotice(t('messages.reportThanks', { name: label }));
    window.setTimeout(() => setReportNotice(null), 5000);
    window.dispatchEvent(
      new CustomEvent('vini:say', {
        detail: {
          message: t('messages.reportVini'),
          mood: 'happy',
        },
      })
    );
  };

  const threadAvatar = (thread) =>
    avatarFor(threadDisplayName(thread), thread.id || thread.member_id);

  const messageGroups = useMemo(
    () => groupMessagesBySender(threadDetail?.messages || []),
    [threadDetail?.messages]
  );

  const messagesWithDividers = useMemo(() => {
    const result = [];
    let lastDay = '';
    messageGroups.forEach((group, groupIndex) => {
      const dayLabel = formatDayLabel(group.messages[0]?.created_at, t, locale);
      if (dayLabel && dayLabel !== lastDay) {
        result.push({ type: 'day', label: dayLabel, key: `day-${dayLabel}-${groupIndex}` });
        lastDay = dayLabel;
      }
      result.push({ type: 'group', group, groupIndex, key: `group-${groupIndex}` });
    });
    return result;
  }, [messageGroups, t, locale]);

  const isMine = (senderType) => {
    if (activeTab === 'booked') return senderType === 'user';
    return senderType === 'member';
  };

  const handleSend = async (body) => {
    const text = (body ?? draft).trim();
    if (!text || !activeThread) return;
    setSending(true);
    setError(null);
    stickToBottomRef.current = true;
    try {
      await sendDirectMessage({ threadId: activeThread.id, body: text });
      setDraft('');
      await refreshThread(activeThread.id, { force: true });
      await loadThreads({ silent: true, force: true });
    } catch (err) {
      setError(friendlyApiError(err.message, t));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend();
  };

  const handleQuickLike = () => handleSend('👍');

  const switchTab = (tab) => {
    setActiveTab(tab);
    setActiveThreadId(null);
    setThreadDetail(null);
  };

  const openParticipantPanel = () => {
    if (!canReviewActiveMember) return;
    setReviewNotice(null);
    setParticipantPanelOpen((open) => !open);
  };

  const openActiveMemberProfile = () => {
    if (!canReviewActiveMember) return;
    setParticipantPanelOpen(false);
    setProfileDrawerOpen(true);
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!canReviewActiveMember || !activeThread) return;
    const comment = reviewComment.trim();
    if (comment.length < 3) {
      setReviewNotice({ type: 'error', text: t('messages.reviewMinChars') });
      return;
    }
    setReviewSubmitting(true);
    setReviewNotice(null);
    try {
      await reviewThreadMember({
        threadId: activeThread.id,
        rating: reviewRating,
        comment,
      });
      setReviewNotice({ type: 'success', text: t('messages.reviewSaved') });
      window.dispatchEvent(
        new CustomEvent('vini:say', {
          detail: {
            message: t('messages.reviewVini'),
            mood: 'happy',
          },
        })
      );
    } catch (err) {
      setReviewNotice({ type: 'error', text: friendlyApiError(err.message, t) });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const bookingBadge = activeThread ? bookingStatusLabel(activeThread.booking_status, t) : null;
  const chatLocked =
    activeThread?.booking_status === 'pending' ||
    activeThread?.booking_status === 'cancelled';
  const chatLockMessage =
    activeThread?.booking_status === 'cancelled'
      ? t('messages.chatLockedCancelled')
      : t('messages.chatLockedPending');

  return (
    <div className={`messenger${activeThreadId ? ' messenger--chat-open' : ''}`}>
      <aside className="messenger-sidebar">
        <div className="messenger-sidebar__top">
          <div className="messenger-sidebar__title-row">
            <h1 className="messenger-sidebar__title">{t('messages.title')}</h1>
            <button type="button" className="messenger-icon-btn" title={t('messages.compose')}>
              <PenSquare size={20} />
            </button>
          </div>

          <div className="messenger-search">
            <Search size={16} className="messenger-search__icon" />
            <input
              type="search"
              placeholder={t('messages.searchPlaceholder')}
              className="messenger-search__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="messenger-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'booked'}
              className={`messenger-tab${activeTab === 'booked' ? ' messenger-tab--active' : ''}`}
              onClick={() => switchTab('booked')}
            >
              {t('messages.tabBooked')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'booked_me'}
              className={`messenger-tab${activeTab === 'booked_me' ? ' messenger-tab--active' : ''}`}
              onClick={() => switchTab('booked_me')}
            >
              {t('messages.tabBookedMe')}
            </button>
          </div>
        </div>

        {error && <p className="messenger-error messenger-error--sidebar">{error}</p>}
        {reportNotice && (
          <p className="messenger-notice messenger-notice--sidebar">{reportNotice}</p>
        )}

        <div className="messenger-thread-list">
          {loading && <p className="messenger-empty">{t('messages.loading')}</p>}
          {!loading && filteredThreads.length === 0 && (
            <p className="messenger-empty">{t('messages.empty')}</p>
          )}

          {filteredThreads.map((chat) => {
            const name = threadDisplayName(chat);
            const active = activeThreadId === chat.id;
            const deleting = deletingThreadId === chat.id;
            return (
              <div
                key={chat.id}
                className={`messenger-thread-item${active ? ' messenger-thread-item--active' : ''}`}
              >
                <button
                  type="button"
                  className="messenger-thread-item__main"
                  onClick={() => setActiveThreadId(chat.id)}
                  disabled={deleting}
                >
                  <div className="messenger-thread-item__avatar-wrap">
                    <img src={threadAvatar(chat)} alt={name} className="messenger-thread-item__avatar" />
                    <span className="messenger-thread-item__online" aria-hidden />
                  </div>
                  <div className="messenger-thread-item__body">
                    <div className="messenger-thread-item__row">
                      <span className="messenger-thread-item__name">{name}</span>
                      <span className="messenger-thread-item__time">
                        {formatMessageTime(chat.last_message_at, locale)}
                      </span>
                    </div>
                    <p className="messenger-thread-item__preview">
                      {chat.last_message || t('messages.noMessages')}
                    </p>
                  </div>
                </button>
                <div
                  className="messenger-thread-item__menu-wrap"
                  ref={openThreadMenuId === chat.id ? threadMenuRef : null}
                >
                  <button
                    type="button"
                    className="messenger-thread-item__menu-btn"
                    title={t('messages.threadOptions')}
                    aria-label={t('messages.threadOptionsFor', { name })}
                    aria-expanded={openThreadMenuId === chat.id}
                    disabled={deleting}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenThreadMenuId((current) => (current === chat.id ? null : chat.id));
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openThreadMenuId === chat.id && (
                    <div className="messenger-thread-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        className="messenger-thread-menu__item"
                        onClick={() => handleReportThread(chat.id, name)}
                      >
                        <Flag size={15} />
                        {t('messages.report')}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="messenger-thread-menu__item messenger-thread-menu__item--danger"
                        disabled={deleting}
                        onClick={() => handleDeleteThread(chat.id, name)}
                      >
                        <Trash2 size={15} />
                        {t('messages.deleteChat')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="messenger-main">
        {!activeThread ? (
          <div className="messenger-placeholder">
            <div className="messenger-placeholder__icon">
              <MessageSquareIcon />
            </div>
            <h2>{t('messages.placeholderTitle')}</h2>
            <p>{t('messages.placeholderBody')}</p>
          </div>
        ) : (
          <>
            <header className="messenger-chat-header">
              <div className="messenger-chat-header__user">
                <button
                  type="button"
                  className="messenger-back-btn"
                  onClick={() => setActiveThreadId(null)}
                  aria-label={t('messages.back')}
                >
                  ←
                </button>
                {canReviewActiveMember ? (
                  <button
                    type="button"
                    className="messenger-avatar-action"
                    onClick={openParticipantPanel}
                    aria-label={`Xem hồ sơ và đánh giá ${threadDisplayName(activeThread)}`}
                  >
                    <img
                      src={threadAvatar(activeThread)}
                      alt=""
                      className="messenger-chat-header__avatar"
                    />
                  </button>
                ) : (
                  <img
                    src={threadAvatar(activeThread)}
                    alt={threadDisplayName(activeThread)}
                    className="messenger-chat-header__avatar"
                  />
                )}
                <div>
                  <h2 className="messenger-chat-header__name">
                    {threadDisplayName(activeThread)}
                  </h2>
                  <p className="messenger-chat-header__status">
                    {activeTab === 'booked_me'
                      ? activeThread.booking_note || 'Thành viên cộng đồng'
                      : activeThread.member_profession || t('messages.active')}
                  </p>
                </div>
              </div>
              <div className="messenger-chat-header__actions">
                {bookingBadge && (
                  <span className={`messenger-booking ${bookingBadge.className}`}>
                    {bookingBadge.text}
                  </span>
                )}
                <button type="button" className="messenger-icon-btn" aria-label={t('messages.info')}>
                  <Info size={20} />
                </button>
              </div>
            </header>

            {participantPanelOpen && canReviewActiveMember && (
              <div className="messenger-participant-panel" role="dialog" aria-label="Hồ sơ và đánh giá">
                <div className="messenger-participant-panel__header">
                  <img
                    src={threadAvatar(activeThread)}
                    alt=""
                    className="messenger-participant-panel__avatar"
                  />
                  <div>
                    <h3>{threadDisplayName(activeThread)}</h3>
                    <p>{activeThread.member_profession || 'Thành viên cộng đồng'}</p>
                  </div>
                  <button
                    type="button"
                    className="messenger-participant-panel__close"
                    onClick={() => setParticipantPanelOpen(false)}
                    aria-label="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  className="messenger-profile-link"
                  onClick={openActiveMemberProfile}
                >
                  <UserRound size={18} /> Xem profile
                </button>

                <form className="messenger-review-form" onSubmit={submitReview}>
                  <div className="messenger-review-form__label">{t('messages.reviewLabel')}</div>
                  <div className="messenger-review-stars" aria-label="Chọn số sao">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`messenger-review-star${value <= reviewRating ? ' messenger-review-star--active' : ''}`}
                        onClick={() => setReviewRating(value)}
                        aria-label={`${value} sao`}
                      >
                        <Star size={20} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="messenger-review-form__textarea"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Bình luận ngắn về trải nghiệm..."
                    maxLength={500}
                    rows={3}
                    disabled={reviewSubmitting}
                  />
                  {reviewNotice && (
                    <p className={`messenger-review-form__notice messenger-review-form__notice--${reviewNotice.type}`}>
                      {reviewNotice.text}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="messenger-review-form__submit"
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? t('messages.reviewSubmitting') : t('messages.reviewSubmit')}
                  </button>
                </form>
              </div>
            )}

            {error && <p className="messenger-error messenger-error--chat">{error}</p>}

            <div className="messenger-chat-body" ref={chatBodyRef}>
              {activeThread.booking_note && (
                <div className="messenger-booking-card">
                  <CalendarIcon />
                  <div>
                    <strong>Lịch hẹn</strong>
                    <p>{activeThread.booking_note}</p>
                  </div>
                </div>
              )}

              {messagesWithDividers.map((item) => {
                if (item.type === 'day') {
                  return (
                    <div key={item.key} className="messenger-day-divider">
                      <span>{item.label}</span>
                    </div>
                  );
                }

                const { group } = item;
                const mine = isMine(group.senderType);
                const variant = mine ? 'sent' : 'received';
                const count = group.messages.length;

                return (
                  <div
                    key={item.key}
                    className={`messenger-message-group${mine ? ' messenger-message-group--sent' : ' messenger-message-group--received'}`}
                  >
                    {!mine && (
                      canReviewActiveMember ? (
                        <button
                          type="button"
                          className="messenger-message-group__avatar-button"
                          onClick={openParticipantPanel}
                          aria-label={`Xem hồ sơ và đánh giá ${threadDisplayName(activeThread)}`}
                        >
                          <img
                            src={threadAvatar(activeThread)}
                            alt=""
                            className="messenger-message-group__avatar"
                          />
                        </button>
                      ) : (
                        <img
                          src={threadAvatar(activeThread)}
                          alt=""
                          className="messenger-message-group__avatar"
                        />
                      )
                    )}
                    <div className="messenger-message-group__bubbles">
                      {group.messages.map((message, msgIndex) => {
                        let position = 'middle';
                        if (count === 1) position = 'single';
                        else if (msgIndex === 0) position = 'first';
                        else if (msgIndex === count - 1) position = 'last';
                        return (
                          <MessengerBubble
                            key={message.id}
                            text={message.body}
                            variant={variant}
                            position={position}
                          />
                        );
                      })}
                      <span className="messenger-message-group__time">
                        {formatBubbleTime(group.messages[group.messages.length - 1]?.created_at, locale)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>

            {chatLocked ? (
              <div className="messenger-composer messenger-composer--locked">
                <p>{chatLockMessage}</p>
              </div>
            ) : (
            <form className="messenger-composer" onSubmit={handleSubmit}>
              <div className="messenger-composer__bar">
                <button type="button" className="messenger-composer__icon" aria-label="Thêm">
                  <ImagePlus size={22} />
                </button>
                <input
                  type="text"
                  placeholder={t('messages.inputPlaceholder')}
                  className="messenger-composer__input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                />
                <button type="button" className="messenger-composer__icon" aria-label="Emoji">
                  <Smile size={22} />
                </button>
                {draft.trim() ? (
                  <button
                    type="submit"
                    className="messenger-composer__send"
                    disabled={sending}
                    aria-label={t('messages.send')}
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="messenger-composer__like"
                    onClick={handleQuickLike}
                    disabled={sending}
                    aria-label="Thích"
                  >
                    <ThumbsUp size={22} />
                  </button>
                )}
              </div>
            </form>
            )}
          </>
        )}
      </main>

      {activeThread?.member_id && (
        <ProfileDrawer
          isOpen={profileDrawerOpen}
          onClose={() => setProfileDrawerOpen(false)}
          profileId={activeThread.member_id}
        />
      )}
    </div>
  );
};

function MessageSquareIcon() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden>
      <circle cx="48" cy="48" r="44" fill="#e7f3ff" />
      <path
        d="M32 36c0-4.4 3.6-8 8-8h24c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H44l-12 8V36z"
        fill="#0084ff"
        opacity="0.9"
      />
      <circle cx="40" cy="44" r="3" fill="#fff" />
      <circle cx="48" cy="44" r="3" fill="#fff" />
      <circle cx="56" cy="44" r="3" fill="#fff" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export default Messages;
