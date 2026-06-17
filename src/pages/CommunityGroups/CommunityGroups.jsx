import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Activity, Sparkles, TrendingUp } from 'lucide-react';
import { fetchGroups } from '../../services/catalogService';
import GroupJoinModal, { loadJoinedGroupIds } from '../../components/community/GroupJoinModal/GroupJoinModal';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { localizeGroup } from '../../i18n/catalogContent';
import './CommunityGroups.css';

const TOPIC_ICONS = [
  { match: ['chạy bộ', 'running', 'thể dục', 'pickleball', 'yoga'], icon: '🏃‍♂️', colorClass: 'community-bg-green-100' },
  { match: ['phụ huynh', 'parenting', 'gia đình', 'trẻ em'], icon: '👨‍👩‍👧‍👦', colorClass: 'community-bg-pink-100' },
  { match: ['tennis', 'thể thao'], icon: '🎾', colorClass: 'community-bg-orange-100' },
  { match: ['lập trình', 'startup', 'công nghệ', 'python', 'product'], icon: '💻', colorClass: 'community-bg-blue-100' },
  { match: ['board', 'cờ', 'game'], icon: '🎲', colorClass: 'community-bg-purple-100' },
  { match: ['thú cưng', 'pet', 'chó', 'mèo'], icon: '🐕', colorClass: 'community-bg-yellow-100' },
  { match: ['sửa chữa', 'điện nước', 'dịch vụ'], icon: '🔧', colorClass: 'community-bg-blue-100' },
  { match: ['networking', 'cà phê', 'làm quen', 'hàng xóm'], icon: '☕', colorClass: 'community-bg-orange-100' },
];

function presentationForGroup(group, index) {
  const haystack = `${group.name} ${group.description} ${(group.topics || []).join(' ')}`.toLowerCase();
  const found = TOPIC_ICONS.find((item) => item.match.some((kw) => haystack.includes(kw)));
  if (found) return found;
  const fallbacks = [
    { icon: '🏃‍♂️', colorClass: 'community-bg-green-100' },
    { icon: '👨‍👩‍👧‍👦', colorClass: 'community-bg-pink-100' },
    { icon: '💻', colorClass: 'community-bg-blue-100' },
    { icon: '🎾', colorClass: 'community-bg-orange-100' },
    { icon: '☕', colorClass: 'community-bg-purple-100' },
  ];
  return fallbacks[index % fallbacks.length];
}

function activityLabel(memberCount, t) {
  if (memberCount >= 900) return { text: t('groups.activity.veryActive'), hot: true };
  if (memberCount >= 500) return { text: t('groups.activity.active'), hot: false };
  if (memberCount >= 200) return { text: t('groups.activity.stable'), hot: false };
  return { text: t('groups.activity.new'), hot: false };
}

function mapGroup(group, index, t, locale) {
  const localized = localizeGroup(group, locale);
  const visual = presentationForGroup(localized, index);
  const activity = activityLabel(localized.member_count || 0, t);
  const memberCount = localized.member_count || 0;
  return {
    id: localized.id,
    name: localized.name,
    description: localized.description,
    zone: localized.residential_zone,
    topics: localized.topics || [],
    zaloLink: localized.zalo_link || '',
    joinNote: localized.join_note || '',
    needCategory: localized.need_category,
    memberCount,
    members: memberCount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN'),
    activity: activity.text,
    activityHot: activity.hot,
    image: visual.icon,
    colorClass: visual.colorClass,
  };
}

const GroupCard = ({ group, highlighted, cardRef, joined, onJoinClick, t }) => {
  const activityClass = group.activityHot ? 'community-text-orange-500' : 'community-text-green-500';

  return (
    <div
      ref={cardRef}
      id={`group-${group.id}`}
      className={`community-group-card${highlighted ? ' community-group-card--highlight' : ''}`}
    >
      <div className={`community-group-image-area ${group.colorClass}`}>
        {group.image}
        <div className="community-group-members-badge">
          <Users size={12} /> {group.members}
        </div>
      </div>
      <div className="community-group-content">
        <h3 className="community-group-name">{group.name}</h3>
        <p className="community-group-desc">{group.description}</p>
        {group.zone ? <p className="community-group-zone">{group.zone}</p> : null}

        <div className="community-group-activity">
          <Activity size={14} className={activityClass} />
          <span className="community-group-activity-text">{group.activity}</span>
        </div>

        <button type="button" className="community-group-btn" onClick={() => onJoinClick(group)}>
          {joined ? t('groups.card.viewDetails') : t('groups.card.join')}
        </button>
      </div>
    </div>
  );
};

const CommunityGroups = () => {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const highlightGroupId = searchParams.get('group');
  const highlightRef = useRef(null);
  const [groups, setGroups] = useState([]);
  const [joinedIds, setJoinedIds] = useState(() => loadJoinedGroupIds(user?.id));
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setJoinedIds(loadJoinedGroupIds(user?.id));
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchGroups()
      .then((data) => {
        if (cancelled) return;
        const sorted = [...(data || [])].sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
        setGroups(sorted.map((group, index) => mapGroup(group, index, t, locale)));
      })
      .catch(() => {
        if (!cancelled) setError(t('groups.page.error'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, locale]);

  useEffect(() => {
    if (!highlightGroupId || !groups.length) return;
    const timer = window.setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [highlightGroupId, groups]);

  useEffect(() => {
    if (!highlightGroupId || !groups.length) return;
    const match = groups.find((g) => g.id === highlightGroupId);
    if (match) setSelectedGroup(match);
  }, [highlightGroupId, groups]);

  const handleJoinClick = useCallback((group) => {
    setSelectedGroup(group);
  }, []);

  const handleJoined = useCallback(
    (groupId) => {
      setJoinedIds((prev) => new Set([...prev, groupId]));
    },
    [],
  );

  const { suggested, trending } = useMemo(() => {
    if (groups.length <= 3) {
      return { suggested: groups, trending: [] };
    }
    return {
      suggested: groups.slice(0, 3),
      trending: groups.slice(3),
    };
  }, [groups]);

  const renderGrid = (items) =>
    items.map((group) => (
      <GroupCard
        key={group.id}
        group={group}
        joined={joinedIds.has(group.id)}
        highlighted={group.id === highlightGroupId}
        cardRef={group.id === highlightGroupId ? highlightRef : null}
        onJoinClick={handleJoinClick}
        t={t}
      />
    ));

  return (
    <div className="community-groups-container">
      <div className="community-groups-header">
        <h1 className="community-groups-title">{t('groups.page.title')}</h1>
        <p className="community-groups-subtitle">{t('groups.page.subtitle')}</p>
      </div>

      {isLoading && <p className="community-groups-status">{t('groups.page.loading')}</p>}

      {error && !isLoading && (
        <p className="community-groups-status community-groups-status--error">{error}</p>
      )}

      {!isLoading && !error && groups.length === 0 && (
        <p className="community-groups-status">{t('groups.page.empty')}</p>
      )}

      {!isLoading && !error && groups.length > 0 && (
        <>
          <div className="community-groups-section">
            <h2 className="community-groups-section-title">
              <Sparkles className="community-text-primary" size={20} /> {t('groups.sections.suggested')}
            </h2>
            <div className="community-groups-grid">{renderGrid(suggested)}</div>
          </div>

          {trending.length > 0 && (
            <div>
              <h2 className="community-groups-section-title">
                <TrendingUp className="community-text-orange-500" size={20} /> {t('groups.sections.featured')}
              </h2>
              <div className="community-groups-grid">{renderGrid(trending)}</div>
            </div>
          )}
        </>
      )}

      <GroupJoinModal
        isOpen={Boolean(selectedGroup)}
        group={selectedGroup}
        alreadyJoined={selectedGroup ? joinedIds.has(selectedGroup.id) : false}
        onClose={() => setSelectedGroup(null)}
        onJoined={handleJoined}
      />
    </div>
  );
};

export default CommunityGroups;
