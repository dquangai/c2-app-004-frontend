import { translate } from './translate';

const CHAT_PROMPT_KEYS = [
  { icon: '📚', key: 'englishTutor' },
  { icon: '🔢', key: 'mathTutor' },
  { icon: '❄️', key: 'acRepair' },
  { icon: '🚿', key: 'plumber' },
  { icon: '💻', key: 'homeIt' },
  { icon: '🩺', key: 'pediatrician' },
  { icon: '🐕', key: 'vet' },
  { icon: '🧘', key: 'yoga' },
  { icon: '🏃', key: 'communityGroup' },
  { icon: '🎉', key: 'events' },
  { icon: '👨‍💼', key: 'itMentor' },
  { icon: '🍳', key: 'chef' },
];

const HOME_PROMPT_KEYS = [
  { icon: '🔢', key: 'mathTutor' },
  { icon: '🚿', key: 'plumber' },
  { icon: '👨‍💼', key: 'itMentor' },
  { icon: '🏃', key: 'communityGroup' },
];

export function getChatPromptSuggestions(locale) {
  return CHAT_PROMPT_KEYS.map(({ icon, key }) => ({
    icon,
    label: translate(locale, `chat.prompts.${key}.label`),
    text: translate(locale, `chat.prompts.${key}.text`),
  }));
}

export function getHomePromptSuggestions(locale) {
  return HOME_PROMPT_KEYS.map(({ icon, key }) => ({
    icon,
    label: translate(locale, `chat.homePrompts.${key}.label`),
    text: translate(locale, `chat.homePrompts.${key}.text`),
  }));
}

export function getViniWaitingMessages(locale) {
  const messages = translate(locale, 'chat.waitingMessages');
  return Array.isArray(messages) ? messages : [];
}

export function getRankingHelp(locale) {
  return {
    title: translate(locale, 'directory.rankingHelp.title'),
    intro: translate(locale, 'directory.rankingHelp.intro'),
    criteria: translate(locale, 'directory.rankingHelp.criteria'),
    notes: translate(locale, 'directory.rankingHelp.notes'),
  };
}

export function getRankingPeriodLabels(locale, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const nextReset = new Date(year, month + 1, 1);
  const resetDay = nextReset.getDate().toString().padStart(2, '0');
  const resetMonth = (nextReset.getMonth() + 1).toString().padStart(2, '0');
  const daysUntilReset = Math.max(
    0,
    Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    key: `${year}-${String(month + 1).padStart(2, '0')}`,
    monthLabel: translate(locale, 'directory.period.monthLabel', {
      month: month + 1,
      year,
    }),
    resetLabel: `${resetDay}/${resetMonth}/${nextReset.getFullYear()}`,
    daysUntilReset,
    daysLeft: translate(locale, 'directory.period.daysLeft', { count: daysUntilReset }),
    resetAt: translate(locale, 'directory.period.resetAt', {
      date: `${resetDay}/${resetMonth}/${nextReset.getFullYear()}`,
    }),
  };
}

export function localizeDirectoryNeed(need, locale) {
  const id = need.id;
  return {
    ...need,
    label: translate(locale, `directory.needs.${id}.label`),
    rankGroupLabel: need.rankGroupLabel
      ? translate(locale, `directory.needs.${id}.rankGroupLabel`)
      : undefined,
  };
}
