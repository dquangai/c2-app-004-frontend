import { getStoredLocale, translate } from '../i18n/translate';

const MAX_RECENT = 12;
const storageKey = (userId) => `vconnect_recent_chats_${userId}`;
const activeKey = (userId) => `vconnect_active_chat_${userId}`;

export function loadRecentSessions(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentSession(userId, session) {
  if (!session?.id || !session?.messages?.length) return;
  const existing = loadRecentSessions(userId).find((s) => s.id === session.id);
  const now = Date.now();
  const list = loadRecentSessions(userId).filter((s) => s.id !== session.id);
  list.unshift({
    id: session.id,
    title: session.title || translate(getStoredLocale(), 'chat.session.defaultTitle'),
    createdAt: session.createdAt || existing?.createdAt || now,
    updatedAt: session.updatedAt || now,
    messages: session.messages,
  });
  localStorage.setItem(storageKey(userId), JSON.stringify(list.slice(0, MAX_RECENT)));
}

export function saveActiveSession(userId, session) {
  if (!session?.messages?.some((m) => m.type === 'user')) {
    clearActiveSession(userId);
    return;
  }
  localStorage.setItem(
    activeKey(userId),
    JSON.stringify({
      conversationId: session.conversationId ?? null,
      messages: session.messages,
      quickReplies: session.quickReplies || [],
      updatedAt: Date.now(),
    }),
  );
}

export function loadActiveSession(userId) {
  try {
    const raw = localStorage.getItem(activeKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearActiveSession(userId) {
  localStorage.removeItem(activeKey(userId));
}

export function removeRecentSession(userId, conversationId) {
  if (!userId || !conversationId) return;
  const list = loadRecentSessions(userId).filter((s) => s.id !== conversationId);
  localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export function clearAllRecentSessions(userId) {
  if (!userId) return;
  localStorage.removeItem(storageKey(userId));
  localStorage.removeItem(activeKey(userId));
}

export function formatRelativeTime(ts, locale = getStoredLocale()) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return translate(locale, 'chat.session.justNow');
  if (mins < 60) return translate(locale, 'chat.session.minutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return translate(locale, 'chat.session.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return translate(locale, 'chat.session.daysAgo', { count: days });
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  return new Date(ts).toLocaleDateString(dateLocale);
}

/** Giờ gửi tin nhắn — 14:30 hôm nay, Hôm qua 09:15, hoặc ngày đầy đủ */
export function formatMessageTime(ts, locale = getStoredLocale()) {
  if (!ts) return '';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  const time = date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return translate(locale, 'chat.session.yesterdayAt', { time });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    return date.toLocaleString(dateLocale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleString(dateLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Thời gian cuộc trò chuyện trong sidebar */
export function formatConversationTime(ts, locale = getStoredLocale()) {
  if (!ts) return '';
  const clock = formatMessageTime(ts, locale);
  const relative = formatRelativeTime(ts, locale);
  const date = new Date(ts);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `${clock} · ${relative}`;
  }
  return `${clock} · ${relative}`;
}

export function resolveMessageTimestamp(msg) {
  if (msg?.createdAt) return msg.createdAt;
  if (typeof msg?.id === 'number' && msg.id > 1_000_000_000_000) return msg.id;
  return Date.now();
}

export function stampMessage(msg) {
  return { ...msg, createdAt: resolveMessageTimestamp(msg) };
}

export function titleFromMessages(messages) {
  const firstUser = messages?.find((m) => m.type === 'user');
  if (!firstUser?.text) return 'Cuộc trò chuyện mới';
  const t = firstUser.text.trim();
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}

/** Chuẩn hóa tin nhắn mini chat → định dạng trang AI Assistant đầy đủ. */
export function normalizeChatMessagesForStorage(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((msg) => stampMessage({
    ...msg,
    ...(msg.type === 'ai'
      ? {
          hasResults: Boolean(msg.hasResults ?? msg.results?.length),
          retrievalFlow: msg.retrievalFlow || [],
          relatedGroups: msg.relatedGroups || msg.related_groups || [],
          relatedEvents: msg.relatedEvents || msg.related_events || [],
          relatedPosts: msg.relatedPosts || msg.related_posts || [],
          gateRefusal: msg.gateRefusal || null,
        }
      : {}),
  }));
}

export function persistChatSession(userId, { conversationId, messages, quickReplies = [] }) {
  if (!userId || !conversationId || !messages?.some((m) => m.type === 'user')) return;
  const normalized = normalizeChatMessagesForStorage(messages);
  saveActiveSession(userId, {
    conversationId,
    messages: normalized,
    quickReplies,
  });
  saveRecentSession(userId, {
    id: conversationId,
    title: titleFromMessages(normalized),
    createdAt: loadRecentSessions(userId).find((s) => s.id === conversationId)?.createdAt,
    updatedAt: Date.now(),
    messages: normalized,
  });
}
