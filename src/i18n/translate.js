import vi from './vi';
import en from './en';

export const LOCALE_STORAGE_KEY = 'vconnect_locale';

const dictionaries = { vi, en };

export function getStoredLocale() {
  if (typeof window === 'undefined') return 'vi';
  return window.localStorage.getItem(LOCALE_STORAGE_KEY) === 'en' ? 'en' : 'vi';
}

function lookup(dict, path) {
  return path.split('.').reduce((obj, part) => (obj == null ? undefined : obj[part]), dict);
}

export function translate(locale, key, vars) {
  const active = locale === 'en' ? 'en' : 'vi';
  let text = lookup(dictionaries[active], key) ?? lookup(dictionaries.vi, key) ?? key;
  if (vars) {
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value ?? ''));
    });
  }
  return text;
}

export function applyDocumentLocale(locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale === 'en' ? 'en' : 'vi';
}
