import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  LOCALE_STORAGE_KEY,
  applyDocumentLocale,
  getStoredLocale,
  translate,
} from '../../i18n/translate';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    applyDocumentLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next) => {
    setLocaleState(next === 'en' ? 'en' : 'vi');
  }, []);

  const t = useCallback((key, vars) => translate(locale, key, vars), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isEnglish: locale === 'en',
    }),
    [locale, setLocale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
