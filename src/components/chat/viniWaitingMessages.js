import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { getViniWaitingMessages } from '../../i18n/localizedConfig';

function pickNextMessage(messages, previous) {
  if (messages.length === 0) return '';
  if (messages.length === 1) return messages[0];
  let next = previous;
  while (next === previous) {
    next = messages[Math.floor(Math.random() * messages.length)];
  }
  return next;
}

/** Rotating fun line while Vini is composing a reply. */
export function useViniWaitingMessage(active, intervalMs = 3500) {
  const { locale } = useLanguage();
  const messages = useMemo(() => getViniWaitingMessages(locale), [locale]);
  const [message, setMessage] = useState(() => pickNextMessage(messages, ''));

  useEffect(() => {
    setMessage(pickNextMessage(messages, ''));
  }, [messages]);

  useEffect(() => {
    if (!active) return undefined;
    setMessage((prev) => pickNextMessage(messages, prev));
    const timer = window.setInterval(() => {
      setMessage((prev) => pickNextMessage(messages, prev));
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [active, intervalMs, messages]);

  return message;
}
