import React, { useState } from 'react';
import { Eye, MessageSquare, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import './BookingHistory.css';

const historyData = [
  {
    id: 1,
    name: 'Linh Nguyen',
    title: 'Math tutoring for grade 10',
    tab: 'upcoming',
    status: 'Confirmed',
    date: 'Today, 4:00 PM',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 2,
    name: 'Tuan Bui',
    title: 'Bedroom light fixture install',
    tab: 'past',
    status: 'Completed',
    date: 'Yesterday, 10:00 AM',
    avatar: 'https://i.pravatar.cc/150?img=8',
  },
  {
    id: 3,
    name: 'An Le',
    title: 'Wi-Fi mesh setup',
    tab: 'upcoming',
    status: 'Pending',
    date: 'Nov 28, 3:00 PM',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 4,
    name: 'Hoa Pham',
    title: 'Review legal document',
    tab: 'past',
    status: 'Completed',
    date: 'Oct 15, 9:00 AM',
    avatar: 'https://i.pravatar.cc/150?img=9',
  }
];

const BookingHistory = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('upcoming');

  const statusLabels = {
    Confirmed: t('booking.history.statusConfirmed'),
    Completed: t('booking.history.statusCompleted'),
    Pending: t('booking.history.statusPending'),
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Confirmed': return 'booking-history-status-confirmed';
      case 'Completed': return 'booking-history-status-completed';
      case 'Pending': return 'booking-history-status-pending';
      default: return 'booking-history-status-completed';
    }
  };

  const filteredItems = historyData.filter((h) => h.tab === activeTab);

  return (
    <div className="booking-history-container">
      <div className="booking-history-header">
        <div>
          <h1 className="booking-history-title">{t('booking.history.title')}</h1>
          <p className="booking-history-subtitle">{t('booking.history.subtitle')}</p>
        </div>
      </div>

      <div className="booking-history-card">
        <div className="booking-history-tabs-header">
          <button 
            className={`booking-history-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            {t('booking.history.tabUpcoming')}
          </button>
          <button 
            className={`booking-history-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            {t('booking.history.tabPast')}
          </button>
        </div>
        
        <div className="booking-history-list">
          {filteredItems.map((item) => (
            <div key={item.id} className="booking-history-item">
              <div className="booking-history-info-wrapper">
                <img src={item.avatar} alt={item.name} className="booking-history-avatar" />
                <div>
                  <div className="booking-history-name-row">
                    <h3 className="booking-history-name">{item.name}</h3>
                    <span className={`booking-history-status-badge ${getStatusClass(item.status)}`}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </div>
                  <p className="booking-history-item-title">{item.title}</p>
                  <p className="booking-history-item-date">{item.date}</p>
                </div>
              </div>
              
              <div className="booking-history-actions">
                <button className="booking-history-btn-view">
                  <Eye size={16} /> {t('booking.history.view')}
                </button>
                <button className="booking-history-btn-message">
                  <MessageSquare size={16} /> {t('booking.history.message')}
                </button>
                <button className="booking-history-btn-rebook">
                  <RefreshCw size={16} /> {t('booking.history.rebook')}
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="booking-history-empty">
              {t('booking.history.empty')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;
