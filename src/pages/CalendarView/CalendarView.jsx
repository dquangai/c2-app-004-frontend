import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { translate } from '../../i18n/translate';
import './CalendarView.css';

import { fetchEvents } from '../../services/catalogService';

const EventDetailsModal = ({ event, onClose, t }) => {
  if (!event) return null;
  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal-content" onClick={e => e.stopPropagation()}>
        <button className="calendar-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="calendar-modal-header">
          <img src={event.avatar} alt={event.person} className="calendar-modal-avatar" />
          <div>
            <h3 className="calendar-modal-title">{event.title}</h3>
            <p className="calendar-modal-person">{event.person}</p>
          </div>
        </div>
        <p className="calendar-modal-desc">{event.description}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button className="calendar-modal-btn-primary">{t('calendar.modal.message')}</button>
          <button className="calendar-modal-btn-outline">{t('calendar.modal.cancel')}</button>
        </div>
      </div>
    </div>
  );
};

const VIEW_KEYS = ['day', 'week', 'month'];

const CalendarView = () => {
  const { locale, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const highlightEventId = searchParams.get('event');
  const [view, setView] = useState('week');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const weekdays = useMemo(() => {
    const labels = translate(locale, 'calendar.weekdays');
    return Array.isArray(labels) ? labels : [];
  }, [locale]);

  React.useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        if (data && Array.isArray(data)) {
          const mapped = data.map((evt, idx) => {
            const dayIdx = idx % 7;
            const startH = 8 + (idx % 10);
            return {
              id: evt.id,
              type: idx % 2 === 0 ? 'pink' : 'blue',
              day: dayIdx,
              date: dayIdx + 2,
              startHour: startH,
              duration: 1 + (idx % 2),
              title: evt.name,
              person: evt.host,
              avatar: `https://i.pravatar.cc/150?img=${(idx % 70) + 1}`,
              description: evt.description,
              timeString: evt.time,
            };
          });
          setEvents(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    if (!highlightEventId || !events.length) return;
    const match = events.find((evt) => evt.id === highlightEventId);
    if (match) setSelectedEvent(match);
  }, [highlightEventId, events]);

  const daysOfWeek = ['Mon 2', 'Tue 3', 'Wed 4', 'Thu 5', 'Fri 6', 'Sat 7', 'Sun 8'];
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const renderEventBlock = (evt) => {
    const topPx = (evt.startHour - 8) * 64;
    const heightPx = evt.duration * 64;
    return (
      <div 
        key={evt.id} 
        className={`calendar-view-event ${evt.type}`} 
        style={{ top: `${topPx}px`, height: `${heightPx}px` }}
        onClick={() => setSelectedEvent(evt)}
      >
        <img src={evt.avatar} className="calendar-view-event-avatar" alt="" />
        <div className="calendar-view-event-info">
          <div className="calendar-view-event-title">{evt.title}</div>
          <div className="calendar-view-event-person">{evt.person}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-view-container">
      <div className="calendar-view-header">
        <div>
          <h1 className="calendar-view-title">{t('calendar.page.title')}</h1>
          <div className="calendar-view-nav">
            <button className="calendar-view-nav-btn"><ChevronLeft size={16} /></button>
            <span className="calendar-view-nav-date">December 2026</span>
            <button className="calendar-view-nav-btn"><ChevronRight size={16} /></button>
          </div>
        </div>
        
        <div className="calendar-view-controls">
          <div className="calendar-view-tabs">
            {VIEW_KEYS.map((viewKey) => (
              <button 
                key={viewKey}
                onClick={() => setView(viewKey)}
                className={`calendar-view-tab-btn ${view === viewKey ? 'active' : ''}`}
              >
                {t(`calendar.views.${viewKey}`)}
              </button>
            ))}
          </div>
          
          <div className="calendar-view-filters">
            <label className="calendar-view-filter-label">
              <input type="checkbox" defaultChecked className="calendar-view-checkbox blue" />
              <span>{t('calendar.filters.bookedMe')}</span>
            </label>
            <label className="calendar-view-filter-label">
              <input type="checkbox" defaultChecked className="calendar-view-checkbox pink" />
              <span>{t('calendar.filters.booked')}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="calendar-view-main-card">
        {view === 'month' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="calendar-view-grid-header">
              {weekdays.map((day) => (
                <div key={day} className="calendar-view-day-header">{day}</div>
              ))}
            </div>
            <div className="calendar-month-grid">
              {Array.from({ length: 35 }).map((_, i) => {
                const dateNum = i - 0;
                const isCurrentMonth = dateNum >= 1 && dateNum <= 31;
                const displayDate = isCurrentMonth ? dateNum : (dateNum < 1 ? 30 + dateNum : dateNum - 31);
                
                const dayEvents = isCurrentMonth ? events.filter(e => e.date === dateNum) : [];

                return (
                  <div key={i} className="calendar-month-cell">
                    <div className={`calendar-month-date ${!isCurrentMonth ? 'other-month' : ''}`}>
                      {displayDate}
                    </div>
                    {dayEvents.map(evt => (
                      <div 
                        key={evt.id} 
                        className={`calendar-month-event ${evt.type}`}
                        onClick={() => setSelectedEvent(evt)}
                      >
                        {evt.startHour}:00 - {evt.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'week' && (
          <>
            <div className="calendar-view-grid-header">
              <div className="calendar-view-time-col-header"></div>
              {daysOfWeek.map(day => (
                <div key={day} className="calendar-view-day-header">{day}</div>
              ))}
            </div>
            <div className="calendar-view-grid-body">
              <div className="calendar-view-grid-row">
                <div className="calendar-view-time-col">
                  {hours.map(hour => (
                    <div key={hour} className="calendar-view-time-slot-label">
                      <span className="calendar-view-time-text">{hour}:00</span>
                    </div>
                  ))}
                </div>
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <div key={day} className="calendar-view-day-col">
                    {hours.map(hour => (
                      <div key={hour} className="calendar-view-time-slot"></div>
                    ))}
                    {events.filter(e => e.day === day).map(renderEventBlock)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'day' && (
          <>
            <div className="calendar-view-grid-header">
              <div className="calendar-view-time-col-header"></div>
              <div className="calendar-view-day-header">Mon 2 ({t('calendar.today')})</div>
            </div>
            <div className="calendar-view-grid-body">
              <div className="calendar-view-grid-row">
                <div className="calendar-view-time-col">
                  {hours.map(hour => (
                    <div key={hour} className="calendar-view-time-slot-label">
                      <span className="calendar-view-time-text">{hour}:00</span>
                    </div>
                  ))}
                </div>
                <div className="calendar-view-day-col" style={{ flex: 1 }}>
                  {hours.map(hour => (
                    <div key={hour} className="calendar-view-time-slot"></div>
                  ))}
                  {events.filter(e => e.day === 0).map(renderEventBlock)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} t={t} />
    </div>
  );
};

export default CalendarView;
