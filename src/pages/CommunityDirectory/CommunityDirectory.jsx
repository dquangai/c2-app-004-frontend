import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ShieldCheck, Star, Trophy, CalendarClock, HelpCircle, X } from 'lucide-react';
import BookingModal from '../../components/booking/BookingModal/BookingModal';
import ProfileDrawer from '../../components/profile/ProfileDrawer/ProfileDrawer';
import { fetchHonorLeaderboard } from '../../services/residentService';
import { memberToProfile, onAvatarError } from '../../utils/memberMapper';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import {
  useLocalizedDirectoryNeeds,
  useRankingHelp,
  useRankingPeriod,
} from '../../hooks/useLocalizedDirectory';
import { needSectionId, TOP_RANK_LIMIT } from '../../config/directoryNeedCategories';
import './CommunityDirectory.css';

const PODIUM_ORDER = [2, 1, 3];

const CommunityDirectory = () => {
  const { t } = useLanguage();
  const directoryNeeds = useLocalizedDirectoryNeeds();
  const rankingHelp = useRankingHelp();
  const localizedPeriod = useRankingPeriod();

  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeNeedId, setActiveNeedId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rankingHelpOpen, setRankingHelpOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const rankingPeriod = useMemo(
    () => ({
      ...localizedPeriod,
      key: leaderboard?.period?.key || localizedPeriod.key,
    }),
    [leaderboard?.period?.key, localizedPeriod]
  );

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchHonorLeaderboard({ refresh: true })
      .then((payload) => setLeaderboard(payload))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filterHonorees = useCallback((members) => {
    if (!searchQuery.trim()) return members;
    const lowerQuery = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(lowerQuery) ||
        member.title.toLowerCase().includes(lowerQuery) ||
        (member.category || '').toLowerCase().includes(lowerQuery) ||
        (member.area || '').toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const topRankedByNeed = useMemo(() => {
    if (!leaderboard?.topRankedByNeed) return {};
    const filtered = {};
    for (const need of directoryNeeds) {
      if (need.href) continue;
      filtered[need.id] = filterHonorees(leaderboard.topRankedByNeed[need.id] || []);
    }
    return filtered;
  }, [leaderboard, filterHonorees, directoryNeeds]);

  const scrollToNeed = useCallback((needId) => {
    const el = document.getElementById(needSectionId(needId));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleNeedClick = useCallback(
    (need) => {
      if (need.href) {
        navigate(need.href);
        return;
      }
      setActiveNeedId(need.id);
      scrollToNeed(need.id);
    },
    [navigate, scrollToNeed]
  );

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash.startsWith('directory-need-') || loading) return;
    const needId = hash.replace('directory-need-', '');
    if (!directoryNeeds.some((n) => n.id === needId)) return;
    setActiveNeedId(needId);
    const timer = window.setTimeout(() => scrollToNeed(needId), 200);
    return () => window.clearTimeout(timer);
  }, [location.hash, loading, scrollToNeed, directoryNeeds]);

  const handleBookingClick = (member) => {
    setSelectedProvider(member);
    setIsBookingModalOpen(true);
  };

  const handleViewProfile = (member) => {
    setSelectedProfile(memberToProfile(member));
    setIsProfileDrawerOpen(true);
  };

  const renderPodiumCard = (member, rank) => (
    <article
      key={member.id}
      className={`directory-podium-card is-rank-${rank}`}
      aria-label={`#${rank}: ${member.name}`}
    >
      <div className={`directory-podium-rank rank-${Math.min(rank, 3)}`}>#{rank}</div>
      <div className="directory-podium-avatar-wrap">
        <img
          src={member.avatar}
          alt={member.name}
          className="directory-podium-avatar"
          onError={(e) => onAvatarError(e, member.name, member.id)}
        />
        {member.verified ? (
          <ShieldCheck size={16} className="directory-podium-verified" aria-label={t('directory.actions.verified')} />
        ) : null}
      </div>
      <h3 className="directory-podium-name">{member.name}</h3>
      <p className="directory-podium-title">{member.title}</p>
      <div className="directory-podium-stats">
        <span>
          <Star size={13} fill="#facc15" color="#facc15" /> {member.rating}
        </span>
        <span>Trust {member.trust}</span>
        {member.honorScore != null ? (
          <span className="directory-podium-score">
            {Math.round(member.honorScore)} {t('directory.actions.points')}
          </span>
        ) : null}
      </div>
      <div className="directory-podium-actions">
        <button type="button" onClick={() => handleViewProfile(member)} className="directory-btn-ghost">
          {t('directory.actions.profile')}
        </button>
        <button type="button" onClick={() => handleBookingClick(member)} className="directory-btn-primary">
          {t('directory.actions.connect')}
        </button>
      </div>
    </article>
  );

  const renderHonoreeRow = (member, rank) => (
    <li key={member.id} className="directory-honor-row">
      <span className={`directory-honor-rank rank-${Math.min(rank, 4)}`}>{rank}</span>
      <img
        src={member.avatar}
        alt=""
        className="directory-honor-avatar"
        onError={(e) => onAvatarError(e, member.name, member.id)}
      />
      <div className="directory-honor-info">
        <span className="directory-honor-name">
          {member.name}
          {member.verified ? <ShieldCheck size={14} className="directory-verified-icon" /> : null}
        </span>
        <span className="directory-honor-title">{member.title}</span>
      </div>
      <div className="directory-honor-metrics">
        <span>
          <Star size={13} fill="#facc15" color="#facc15" /> {member.rating}
        </span>
        <span>Trust {member.trust}</span>
        {member.honorScore != null ? (
          <span>
            {Math.round(member.honorScore)} {t('directory.actions.points')}
          </span>
        ) : null}
      </div>
      <div className="directory-honor-actions">
        <button type="button" onClick={() => handleViewProfile(member)} className="directory-btn-ghost">
          {t('directory.actions.profile')}
        </button>
        <button type="button" onClick={() => handleBookingClick(member)} className="directory-btn-primary">
          {t('directory.actions.connect')}
        </button>
      </div>
    </li>
  );

  const renderHonorSection = (need, sectionMembers) => {
    const Icon = need.icon;
    const groupLabel = need.rankGroupLabel || need.label;
    const sorted = [...sectionMembers].sort((a, b) => a.honorRank - b.honorRank);
    const podiumMembers = PODIUM_ORDER.map((rank) => sorted.find((m) => m.honorRank === rank)).filter(Boolean);
    const listMembers = sorted.filter((m) => m.honorRank >= 4);

    return (
      <section
        key={need.id}
        id={needSectionId(need.id)}
        className={`directory-need-section${activeNeedId === need.id ? ' is-highlighted' : ''}`}
        aria-labelledby={`directory-need-title-${need.id}`}
      >
        <header className="directory-need-section-head">
          <div className="directory-need-section-title-wrap">
            <Icon size={22} className="directory-need-section-icon" aria-hidden="true" />
            <div className="directory-need-section-titles">
              <span className="directory-need-section-kicker">
                <Trophy size={14} aria-hidden="true" /> Top {TOP_RANK_LIMIT}
              </span>
              <h2 id={`directory-need-title-${need.id}`} className="directory-need-section-title">
                {groupLabel}
              </h2>
            </div>
          </div>
          <span className="directory-need-section-count">{rankingPeriod.monthLabel}</span>
        </header>

        {podiumMembers.length > 0 ? (
          <div className="directory-podium" aria-label={`Top 3 — ${groupLabel}`}>
            {podiumMembers.map((member) => renderPodiumCard(member, member.honorRank))}
          </div>
        ) : null}

        {listMembers.length > 0 ? (
          <ol className="directory-honor-list" start={4}>
            {listMembers.map((member) => renderHonoreeRow(member, member.honorRank))}
          </ol>
        ) : null}
      </section>
    );
  };

  const hasAnyHonorees = directoryNeeds.some(
    (need) => !need.href && (topRankedByNeed[need.id] || []).length > 0
  );

  return (
    <div className="directory-container">
      <div className="directory-header-glass">
        <div className="directory-header-content">
          <h1 className="directory-title">{t('directory.page.title')}</h1>
          <p className="directory-subtitle">
            {loading ? t('directory.page.loading') : t('directory.page.subtitle')}
          </p>

          {!loading ? (
            <div className="directory-period-banner" role="status">
              <CalendarClock size={18} aria-hidden="true" />
              <div className="directory-period-text">
                <strong>
                  {t('directory.period.banner')} {rankingPeriod.monthLabel}
                </strong>
                <span>
                  {rankingPeriod.resetAt}
                  {rankingPeriod.daysUntilReset > 0 ? ` · ${rankingPeriod.daysLeft}` : ''}
                </span>
              </div>
            </div>
          ) : null}

          <div className="directory-hero-search">
            <Search className="directory-hero-search-icon" size={22} />
            <input
              type="text"
              placeholder={t('directory.search.placeholder')}
              className="directory-hero-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="directory-need-chips" role="navigation" aria-label={t('directory.page.title')}>
            {directoryNeeds.map((need) => {
              const Icon = need.icon;
              const isActive = activeNeedId === need.id;
              return (
                <button
                  key={need.id}
                  type="button"
                  className={`directory-need-chip${isActive ? ' is-active' : ''}`}
                  onClick={() => handleNeedClick(need)}
                >
                  <Icon size={16} className="directory-need-chip-icon" aria-hidden="true" />
                  {need.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loadError && (
        <p className="directory-load-error">
          {t('directory.page.error')} {loadError}
        </p>
      )}

      <div className="directory-content">
        <div className="directory-main-content">
          {!loading ? (
            <p className="directory-results-count">
              {t('directory.rankingHelp.intro')}
              <button
                type="button"
                className="directory-results-help-link"
                aria-label={t('directory.actions.help')}
                aria-haspopup="dialog"
                onClick={() => setRankingHelpOpen(true)}
              >
                <HelpCircle size={14} aria-hidden="true" />
              </button>
            </p>
          ) : null}

          {directoryNeeds.map((need) => {
            if (need.href) return null;
            const sectionMembers = topRankedByNeed[need.id] || [];
            if (!sectionMembers.length) return null;
            return renderHonorSection(need, sectionMembers);
          })}

          {!loading && !hasAnyHonorees && (
            <p className="directory-empty">{t('directory.page.empty')}</p>
          )}
        </div>
      </div>

      {rankingHelpOpen ? (
        <div
          className="directory-ranking-help-backdrop"
          role="presentation"
          onClick={() => setRankingHelpOpen(false)}
        >
          <div
            id="directory-ranking-help"
            className="directory-ranking-help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="directory-ranking-help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="directory-ranking-help-head">
              <h2 id="directory-ranking-help-title" className="directory-ranking-help-title">
                {rankingHelp.title}
              </h2>
              <button
                type="button"
                className="directory-ranking-help-close"
                aria-label={t('directory.actions.close')}
                onClick={() => setRankingHelpOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="directory-ranking-help-intro">{rankingHelp.intro}</p>
            <ul className="directory-ranking-help-criteria">
              {rankingHelp.criteria.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </li>
              ))}
            </ul>
            <ul className="directory-ranking-help-notes">
              {rankingHelp.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <button
              type="button"
              className="directory-ranking-help-dismiss"
              onClick={() => setRankingHelpOpen(false)}
            >
              {t('directory.actions.close')}
            </button>
          </div>
        </div>
      ) : null}

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider={selectedProvider}
      />

      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        profileId={selectedProfile?.id}
        profile={selectedProfile}
      />
    </div>
  );
};

export default CommunityDirectory;
