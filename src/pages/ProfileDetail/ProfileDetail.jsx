import React, { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { ShieldCheck, Star, ChevronLeft, ChevronRight, MapPin, Pencil, Clock, MessageSquare, Calendar } from 'lucide-react';

import BookingModal from '../../components/booking/BookingModal/BookingModal';

import ProfileEditModal from '../../components/profile/ProfileEditModal/ProfileEditModal';

import { useAuth } from '../../hooks/useAuth/useAuth';

import { getResidentById } from '../../services/residentService';

import { fetchMemberReviews } from '../../services/catalogService';

import { getMyProfileUpdate } from '../../services/profileUpdateService';

import { memberToProfile, onAvatarError } from '../../utils/memberMapper';

import { useLanguage } from '../../context/LanguageContext/LanguageContext';

import './ProfileDetail.css';



function formatReviewDate(value, locale) {

  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';

  return date.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });

}



const ProfileDetail = ({ profileId, initialProfile, onClose, isDrawer }) => {

  const { id: routeId } = useParams();

  const id = profileId || routeId;

  const navigate = useNavigate();

  const { user } = useAuth();

  const { locale, t } = useLanguage();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [profile, setProfile] = useState(initialProfile || null);

  const [memberRaw, setMemberRaw] = useState(null);

  const [pendingUpdate, setPendingUpdate] = useState(null);

  const [loading, setLoading] = useState(!initialProfile);

  const [reviews, setReviews] = useState({ items: [], review_count: 0, average_rating: null });

  const [reviewsLoading, setReviewsLoading] = useState(false);



  const isOwnProfile = Boolean(user?.member_id && id && user.member_id === id);



  const handleBack = () => {

    if (onClose) {

      onClose();

    } else {

      navigate(-1);

    }

  };



  useEffect(() => {

    if (initialProfile) {

      setProfile(initialProfile);

      setLoading(false);

      return;

    }

    if (!id) {

      setProfile(null);

      setLoading(false);

      return;

    }

    setLoading(true);

    getResidentById(id)

      .then((member) => {

        setMemberRaw(member?.raw || null);

        setProfile(member ? memberToProfile(member) : null);

      })

      .catch(() => {

        setMemberRaw(null);

        setProfile(null);

      })

      .finally(() => setLoading(false));

  }, [id, initialProfile]);



  useEffect(() => {

    if (!isOwnProfile) {

      setPendingUpdate(null);

      return;

    }

    getMyProfileUpdate()

      .then(setPendingUpdate)

      .catch(() => setPendingUpdate(null));

  }, [isOwnProfile, isEditModalOpen]);



  useEffect(() => {

    if (!isOwnProfile || !id || memberRaw) return;

    getResidentById(id)

      .then((member) => setMemberRaw(member?.raw || null))

      .catch(() => setMemberRaw(null));

  }, [isOwnProfile, id, memberRaw]);



  useEffect(() => {

    if (!id) {

      setReviews({ items: [], review_count: 0, average_rating: null });

      return;

    }

    setReviewsLoading(true);

    fetchMemberReviews(id)

      .then((data) => setReviews(data || { items: [], review_count: 0, average_rating: null }))

      .catch(() => setReviews({ items: [], review_count: 0, average_rating: null }))

      .finally(() => setReviewsLoading(false));

  }, [id]);



  if (loading) {

    return <div className="profile-detail-container">{t('profile.page.loading')}</div>;

  }



  if (!profile) {

    return (

      <div className="profile-detail-container">

        <button onClick={handleBack} className="profile-detail-back-btn">

          <ChevronRight size={16} /> {t('profile.page.back')}

        </button>

        <p>{t('profile.page.notFound')}</p>

      </div>

    );

  }



  const hasPendingUpdate = pendingUpdate?.status === 'pending';

  const reviewItems = reviews?.items || [];

  const displayedRating = reviews?.average_rating || profile.rating;

  const displayedReviewCount = reviews?.review_count || profile.reviews;



  return (

    <div className={`profile-detail-container ${isDrawer ? 'profile-detail-is-drawer' : ''}`}>

      <div className="profile-detail-page-header">

        <button onClick={handleBack} className="profile-detail-back-btn">

          {isDrawer ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}

        </button>

        <h1 className="profile-detail-page-title">{isOwnProfile ? t('profile.page.myProfile') : t('profile.page.detail')}</h1>

      </div>



      {isOwnProfile && hasPendingUpdate && (

        <div className="profile-detail-pending-banner">

          <Clock size={18} />

          <span>{t('profile.pending.title')}</span>

        </div>

      )}



      {isOwnProfile && pendingUpdate?.status === 'rejected' && (

        <div className="profile-detail-pending-banner profile-detail-pending-banner--rejected">

          <span>

            {t('profile.pending.rejected')}

          </span>

        </div>

      )}



      <div className="profile-detail-cards-stack">

        <div className="profile-detail-header-card">

          <div className="profile-detail-header-bg-glow"></div>

          

          <div className="profile-detail-avatar">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="profile-detail-avatar-image"
                onError={(e) => onAvatarError(e, profile.name, profile.id)}
              />
            ) : (
              <div className="profile-detail-avatar-initials">
                {profile.name.split(' ').map(n => n[0]).slice(-2).join('')}
              </div>
            )}

          </div>

          

          <div className="profile-detail-header-info">

            <div className="profile-detail-name-wrapper">

              <h1 className="profile-detail-name">{profile.name}</h1>

              {profile.verified && (

                <ShieldCheck size={20} className="profile-detail-verified-icon" />

              )}

            </div>

            <p className="profile-detail-title">{profile.title}</p>

            

            <div className="profile-detail-stats-row">

              <div className="profile-detail-trust-badge">

                <ShieldCheck size={16} /> {t('profile.trust')} {profile.trust}

              </div>

              <div className="profile-detail-rating-info">

                <Star size={16} className="profile-detail-rating-icon" fill="currentColor" />

                <span>{displayedRating} ({displayedReviewCount})</span>

              </div>

            </div>



            <div className="profile-detail-area-info">

              <MapPin size={16} className="profile-detail-area-icon" />

              <span>{profile.area}</span>

            </div>

          </div>

          

          <div className="profile-detail-header-actions">

            {isOwnProfile ? (

              <button

                type="button"

                className="profile-detail-btn-primary profile-detail-btn-edit"

                onClick={() => setIsEditModalOpen(true)}

                disabled={hasPendingUpdate}

              >

                <Pencil size={18} /> {t('profile.actions.edit')}

              </button>

            ) : (

              <>

                <button type="button" className="profile-detail-btn-secondary" onClick={() => navigate('/chat')}>

                  <MessageSquare size={18} /> {t('profile.actions.message')}

                </button>

                <button 

                  type="button"

                  className="profile-detail-btn-primary"

                  onClick={() => setIsBookingModalOpen(true)}

                >

                  <Calendar size={18} /> {t('profile.actions.book')}

                </button>

              </>

            )}

          </div>

        </div>



        <div className="profile-detail-section-card">

          <h2 className="profile-detail-section-title">{t('profile.sections.about')}</h2>

          <p className="profile-detail-about-text">{profile.about}</p>

        </div>



        <div className="profile-detail-section-card">

          <h2 className="profile-detail-section-title">{t('profile.sections.skills')}</h2>

          <div className="profile-detail-skills-list">

            {profile.skills.map((skill) => (

              <span key={skill} className="profile-detail-skill-tag">{skill}</span>

            ))}

          </div>

        </div>



        <div className="profile-detail-section-card">

          <h2 className="profile-detail-section-title">{t('profile.sections.services')}</h2>

          <div className="profile-detail-services-grid">

            {profile.services.map((service) => (

              <div key={service.name} className="profile-detail-service-item">

                <span className="profile-detail-service-name">{service.name}</span>

                {!isOwnProfile && (

                  <span 

                    className="profile-detail-service-contact"

                    onClick={() => setIsBookingModalOpen(true)}

                  >

                    {t('profile.actions.contact')}

                  </span>

                )}

              </div>

            ))}

          </div>

        </div>



        <div className="profile-detail-section-card">

          <div className="profile-detail-reviews-header">

            <h2 className="profile-detail-section-title">{t('profile.sections.reviews')}</h2>

            {reviews?.average_rating && (

              <span className="profile-detail-reviews-score">

                <Star size={15} fill="currentColor" /> {reviews.average_rating}

              </span>

            )}

          </div>

          {reviewsLoading ? (

            <p className="profile-detail-reviews-empty">{t('profile.reviews.loading')}</p>

          ) : reviewItems.length ? (

            <div className="profile-detail-reviews-list">

              {reviewItems.map((review) => (

                <article key={review.id} className="profile-detail-review-item">

                  <div className="profile-detail-review-item__top">

                    <div>

                      <strong>{review.reviewer_name || t('profile.reviews.fallback')}</strong>

                      <span>{formatReviewDate(review.updated_at || review.created_at, locale)}</span>

                    </div>

                    <span className="profile-detail-review-item__rating">

                      <Star size={14} fill="currentColor" /> {review.rating}

                    </span>

                  </div>

                  <p>{review.comment}</p>

                </article>

              ))}

            </div>

          ) : (

            <p className="profile-detail-reviews-empty">{t('profile.reviews.empty')}</p>

          )}

        </div>

      </div>



      {!isOwnProfile && (

        <BookingModal 

          isOpen={isBookingModalOpen} 

          onClose={() => setIsBookingModalOpen(false)} 

          provider={profile} 

        />

      )}



      {isOwnProfile && (

        <ProfileEditModal

          isOpen={isEditModalOpen}

          onClose={() => setIsEditModalOpen(false)}

          memberRaw={memberRaw}

          onSubmitted={(update) => setPendingUpdate(update)}

        />

      )}

    </div>

  );

};



export default ProfileDetail;

