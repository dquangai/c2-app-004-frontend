import { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { getChatPromptSuggestions, getHomePromptSuggestions } from '../../i18n/localizedConfig';

export function useChatPromptSuggestions() {
  const { locale } = useLanguage();
  return useMemo(() => getChatPromptSuggestions(locale), [locale]);
}

export function useHomePromptSuggestions() {
  const { locale } = useLanguage();
  return useMemo(() => getHomePromptSuggestions(locale), [locale]);
}
