import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext/LanguageContext';
import { DIRECTORY_NEEDS } from '../config/directoryNeedCategories';
import { localizeDirectoryNeed, getRankingHelp, getRankingPeriodLabels } from '../i18n/localizedConfig';

export function useLocalizedDirectoryNeeds() {
  const { locale } = useLanguage();
  return useMemo(
    () => DIRECTORY_NEEDS.map((need) => localizeDirectoryNeed(need, locale)),
    [locale]
  );
}

export function useRankingHelp() {
  const { locale } = useLanguage();
  return useMemo(() => getRankingHelp(locale), [locale]);
}

export function useRankingPeriod(now = new Date()) {
  const { locale } = useLanguage();
  return useMemo(() => getRankingPeriodLabels(locale, now), [locale, now]);
}
