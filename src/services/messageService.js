import apiClient from './apiClient';
import { getStoredLocale, translate } from '../i18n/translate';
import {
  sessionCacheClearPrefix,
  sessionCacheFetch,
  sessionCacheGet,
  sessionCacheHas,
} from '../utils/sessionCache';

const MSG_PREFIX = 'msg:';

function pendingCacheKey({ demo = false, memberId } = {}) {
  return `${MSG_PREFIX}pending:${demo ? 'demo' : 'live'}:${memberId || 'none'}`;
}

export function invalidateMessagesCache() {
  sessionCacheClearPrefix(MSG_PREFIX);
}

export function peekBookedThreads() {
  return sessionCacheGet(`${MSG_PREFIX}booked`);
}

export function peekBookedMeThreads(memberId) {
  return sessionCacheGet(`${MSG_PREFIX}booked-me:${memberId || 'default'}`);
}

export function peekThreadDetail(threadId) {
  return sessionCacheGet(`${MSG_PREFIX}thread:${threadId}`);
}

export function hasBookedThreadsCache() {
  return sessionCacheHas(`${MSG_PREFIX}booked`);
}

export async function fetchBookedThreads({ force = false } = {}) {
  return sessionCacheFetch(
    `${MSG_PREFIX}booked`,
    async () => {
      const { data } = await apiClient.get('/api/messages/threads/booked');
      return data;
    },
    { force }
  );
}

export async function fetchBookedMeThreads(memberId, { force = false } = {}) {
  const key = `${MSG_PREFIX}booked-me:${memberId || 'default'}`;
  return sessionCacheFetch(
    key,
    async () => {
      const { data } = await apiClient.get('/api/messages/threads/booked-me', {
        params: memberId ? { member_id: memberId } : undefined,
      });
      return data;
    },
    { force }
  );
}

export async function deleteThread(threadId) {
  await apiClient.delete(`/api/messages/threads/${threadId}`);
  invalidateMessagesCache();
}

export async function createThread({ memberId, bookingNote }) {
  const { data } = await apiClient.post('/api/messages/threads', {
    member_id: memberId,
    booking_note: bookingNote || null,
  });
  invalidateMessagesCache();
  return data;
}

export async function fetchThreadDetail(threadId, { force = false } = {}) {
  return sessionCacheFetch(
    `${MSG_PREFIX}thread:${threadId}`,
    async () => {
      const { data } = await apiClient.get(`/api/messages/threads/${threadId}`);
      return data;
    },
    { force }
  );
}

export async function sendDirectMessage({ threadId, body }) {
  const { data } = await apiClient.post(`/api/messages/threads/${threadId}/messages`, {
    body,
  });
  invalidateMessagesCache();
  return data;
}

export async function reviewThreadMember({ threadId, rating, comment }) {
  const { data } = await apiClient.post(`/api/messages/threads/${threadId}/review`, {
    rating,
    comment,
  });
  return data;
}

export async function fetchPendingBookingRequests({ demo = false, memberId, force = false } = {}) {
  const key = pendingCacheKey({ demo, memberId });
  return sessionCacheFetch(
    key,
    async () => {
      const { data } = await apiClient.get('/api/messages/booking-requests', {
        params: {
          ...(demo ? { demo: true } : {}),
          ...(memberId ? { member_id: memberId } : {}),
        },
      });
      return data;
    },
    { force }
  );
}

export async function acceptBooking(threadId) {
  const { data } = await apiClient.post(`/api/messages/threads/${threadId}/booking/accept`);
  invalidateMessagesCache();
  return data;
}

export async function rejectBooking(threadId, message) {
  const { data } = await apiClient.post(`/api/messages/threads/${threadId}/booking/reject`, {
    message: message || null,
  });
  invalidateMessagesCache();
  return data;
}

let demoSeedInFlight = null;
let demoSeedInFlightUserId = null;

function demoSeedSessionKey(userId) {
  return `vconnect_demo_seeded_${userId}`;
}

/** Seed demo chats once per login session; dedupes concurrent calls. */
export async function ensureDemoConversations(userId) {
  if (!userId) return null;

  if (sessionStorage.getItem(demoSeedSessionKey(userId)) === '1') {
    return { cached: true };
  }

  if (demoSeedInFlight && demoSeedInFlightUserId === userId) {
    return demoSeedInFlight;
  }

  demoSeedInFlightUserId = userId;
  demoSeedInFlight = apiClient
    .post('/api/messages/seed-demo')
    .then(({ data }) => {
      sessionStorage.setItem(demoSeedSessionKey(userId), '1');
      if (data?.created_thread_ids?.length) {
        invalidateMessagesCache();
      }
      return data;
    })
    .finally(() => {
      demoSeedInFlight = null;
      demoSeedInFlightUserId = null;
    });

  return demoSeedInFlight;
}

export function clearDemoSeedCache() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith('vconnect_demo_seeded_'))
    .forEach((key) => sessionStorage.removeItem(key));
  demoSeedInFlight = null;
  demoSeedInFlightUserId = null;
}

export function formatRelativeTime(isoValue, locale = getStoredLocale()) {
  if (!isoValue) return '';
  const dt = new Date(isoValue);
  if (Number.isNaN(dt.getTime())) return isoValue;
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return translate(locale, 'messages.justNow');
  if (diffMin < 60) {
    return translate(locale, 'messages.minutesAgo', { count: diffMin });
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return translate(locale, 'messages.hoursAgo', { count: diffHour });
  }
  return formatMessageTime(isoValue, locale);
}

export function formatMessageTime(isoValue, locale = getStoredLocale()) {
  if (!isoValue) return '';
  const dt = new Date(isoValue);
  if (Number.isNaN(dt.getTime())) return isoValue;
  const now = new Date();
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  const sameDay =
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate();
  if (sameDay) {
    return dt.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    dt.getFullYear() === yesterday.getFullYear() &&
    dt.getMonth() === yesterday.getMonth() &&
    dt.getDate() === yesterday.getDate()
  ) {
    return translate(locale, 'messages.yesterday');
  }
  return dt.toLocaleDateString(dateLocale, { weekday: 'short' });
}
