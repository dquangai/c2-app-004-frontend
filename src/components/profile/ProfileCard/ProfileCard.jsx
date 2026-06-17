import './ProfileCard.css';
import { MapPin, Star, Clock, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import Avatar from '../../common/Avatar';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';

const ProfileCard = ({ profile, onSelectProfile }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="profile-card">
      <div className="profile-card__content">
        {/* Header: Avatar + Info + Score */}
        <div className="profile-card__header">
          <div className="profile-card__info-group">
            <Avatar src={profile.avatar} size="lg" alt={profile.name} className="profile-card__avatar" />
            <div className="profile-card__details">
              <div className="profile-card__name-row">
                <h3 className="profile-card__name">{profile.name}</h3>
                {!profile.isUrgent && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-card__verified-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                )}
              </div>
              <p className="profile-card__title">{profile.title}</p>
            </div>
          </div>
          
          <div className="profile-card__actions">
            {profile.isUrgent && (
              <div className="profile-card__urgent-icons">
                <ShieldCheck size={18} className="profile-card__shield-icon" />
                <AlertCircle size={18} className="profile-card__alert-icon" />
              </div>
            )}
            
            {profile.trustScore && (
              <div className="profile-card__score-group">
                <span className="profile-card__score-label">UY TÍN</span>
                <span className="profile-card__score-value">{profile.trustScore}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-card__stats-grid">
          <div className="profile-card__stat-item">
            <div className="profile-card__stat-icon-wrapper">
              <MapPin size={14} />
            </div>
            <div className="profile-card__stat-content">
              <span className="profile-card__stat-label">{t('components.profileCard.distance')}</span>
              <span className="profile-card__stat-value">{profile.distance}</span>
            </div>
          </div>
          
          <div className="profile-card__stat-item">
            <div className="profile-card__stat-icon-wrapper">
              <Star size={14} />
            </div>
            <div className="profile-card__stat-content">
              <span className="profile-card__stat-label">{t('components.profileCard.rating')}</span>
              <span className="profile-card__stat-value">{profile.rating} <span className="profile-card__stat-subvalue">({profile.reviews})</span></span>
            </div>
          </div>
          
          <div className="profile-card__stat-item">
            <div className="profile-card__stat-icon-wrapper">
              <Clock size={14} />
            </div>
            <div className="profile-card__stat-content">
              <span className="profile-card__stat-label">{t('components.profileCard.response')}</span>
              <span className="profile-card__stat-value">{profile.responseTime}</span>
            </div>
          </div>
          
          <div className="profile-card__stat-item">
            <div className="profile-card__stat-icon-wrapper">
              <Calendar size={14} />
            </div>
            <div className="profile-card__stat-content">
              <span className="profile-card__stat-label">{t('components.profileCard.available')}</span>
              <span className="profile-card__stat-value">{profile.availability}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-card__buttons">
          <button 
            onClick={() => onSelectProfile ? onSelectProfile(profile.id) : navigate(`/profile/${profile.id}`)}
            className="profile-card__btn-view"
          >
            {t('components.profileCard.viewProfile')}
          </button>
          <button className="profile-card__btn-book">
            {t('components.profileCard.book')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
