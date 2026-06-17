import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, CalendarDays, Users } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';
import { localizeGroup, localizePost, localizeEvent } from '../../../i18n/catalogContent';
import './CommunityLinksPanel.css';

const CommunityLinksPanel = ({ posts = [], events = [], groups = [] }) => {
  const navigate = useNavigate();
  const { locale, t } = useLanguage();

  if (!posts.length && !events.length && !groups.length) return null;

  return (
    <div className="community-links">
      {posts.length > 0 && (
        <section className="community-links-section">
          <h4 className="community-links-heading">
            <Newspaper size={16} aria-hidden />
            {t('chat.communityLinks.posts')}
          </h4>
          <ul className="community-links-list">
            {posts.map((post) => {
              const localized = localizePost(post, locale);
              return (
              <li key={localized.id}>
                <button
                  type="button"
                  className="community-links-card community-links-card--post"
                  onClick={() => navigate(`/social?post=${localized.id}`)}
                >
                  <span className="community-links-card-title">{localized.title}</span>
                  {localized.summary ? (
                    <span className="community-links-card-meta">{localized.summary}</span>
                  ) : null}
                  <span className="community-links-card-foot">
                    {localized.author}
                    {localized.residential_zone ? ` · ${localized.residential_zone}` : ''}
                  </span>
                </button>
              </li>
            );
            })}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <section className="community-links-section">
          <h4 className="community-links-heading">
            <CalendarDays size={16} aria-hidden />
            {t('chat.communityLinks.events')}
          </h4>
          <ul className="community-links-list">
            {events.map((event) => {
              const localized = localizeEvent(event, locale);
              return (
              <li key={localized.id}>
                <button
                  type="button"
                  className="community-links-card community-links-card--event"
                  onClick={() => navigate(`/calendar?event=${localized.id}`)}
                >
                  <span className="community-links-card-title">{localized.name}</span>
                  <span className="community-links-card-meta">
                    {[localized.time, localized.residential_zone].filter(Boolean).join(' · ')}
                  </span>
                </button>
              </li>
            );
            })}
          </ul>
        </section>
      )}

      {groups.length > 0 && (
        <section className="community-links-section">
          <h4 className="community-links-heading">
            <Users size={16} aria-hidden />
            {t('chat.communityLinks.groups')}
          </h4>
          <ul className="community-links-list">
            {groups.map((group) => {
              const localized = localizeGroup(group, locale);
              return (
              <li key={localized.id}>
                <button
                  type="button"
                  className="community-links-card community-links-card--group"
                  onClick={() => navigate(`/groups?group=${localized.id}`)}
                >
                  <span className="community-links-card-title">{localized.name}</span>
                  <span className="community-links-card-meta">
                    {localized.member_count
                      ? t('chat.communityLinks.members', {
                          count: localized.member_count.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN'),
                        })
                      : ''}
                    {localized.residential_zone ? ` · ${localized.residential_zone}` : ''}
                  </span>
                </button>
              </li>
            );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};

export default CommunityLinksPanel;
