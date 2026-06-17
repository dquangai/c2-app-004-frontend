import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, MapPin, ExternalLink, CheckCircle2, MessageCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth/useAuth';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';
import { recordUserAction } from '../../../services/matchingService';
import './GroupJoinModal.css';

const joinedStorageKey = (userId) => `vconnect_joined_groups_${userId}`;

export function loadJoinedGroupIds(userId) {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(joinedStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markGroupJoined(userId, groupId) {
  if (!userId || !groupId) return;
  const set = loadJoinedGroupIds(userId);
  set.add(groupId);
  localStorage.setItem(joinedStorageKey(userId), JSON.stringify([...set]));
}

const GroupJoinModal = ({ isOpen, onClose, group, alreadyJoined = false, onJoined }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(alreadyJoined);

  useEffect(() => {
    if (!isOpen) return;
    setNote('');
    setError(null);
    setSuccess(alreadyJoined);
  }, [isOpen, group?.id, alreadyJoined]);

  if (!isOpen || !group) return null;

  const handleClose = () => {
    setNote('');
    setError(null);
    setSuccess(alreadyJoined);
    onClose();
  };

  const handleOpenZalo = () => {
    if (group.zaloLink) {
      window.open(group.zaloLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRegister = async () => {
    if (!user) {
      handleClose();
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await recordUserAction({
        actionType: 'JOIN_GROUP',
        targetId: group.id,
        metadata: {
          need_category: group.needCategory,
          residential_zone: group.zone,
          group_name: group.name,
          note: note.trim() || undefined,
        },
      });
      markGroupJoined(user.id, group.id);
      setSuccess(true);
      onJoined?.(group.id);
    } catch (err) {
      setError(err.message || t('groups.join.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="group-join-modal-overlay" role="presentation" onClick={handleClose}>
      <div
        className="group-join-modal"
        role="dialog"
        aria-labelledby="group-join-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="group-join-modal-close" onClick={handleClose} aria-label={t('groups.join.close')}>
          <X size={20} />
        </button>

        <div className={`group-join-modal-hero ${group.colorClass || ''}`}>
          <span className="group-join-modal-emoji" aria-hidden>
            {group.image || '👥'}
          </span>
        </div>

        <div className="group-join-modal-body">
          {!success ? (
            <>
              <h2 id="group-join-modal-title" className="group-join-modal-title">
                {group.name}
              </h2>
              <p className="group-join-modal-desc">{group.description}</p>

              <ul className="group-join-modal-meta">
                <li>
                  <Users size={16} aria-hidden />
                  {t('groups.card.members', { count: group.members })}
                </li>
                {group.zone ? (
                  <li>
                    <MapPin size={16} aria-hidden />
                    {group.zone}
                  </li>
                ) : null}
              </ul>

              {group.topics?.length > 0 ? (
                <div className="group-join-modal-topics">
                  {group.topics.map((topic) => (
                    <span key={topic} className="group-join-modal-topic">
                      {topic}
                    </span>
                  ))}
                </div>
              ) : null}

              {group.joinNote ? (
                <p className="group-join-modal-note">
                  <MessageCircle size={14} aria-hidden />
                  {group.joinNote}
                </p>
              ) : null}

              <label className="group-join-modal-label" htmlFor="group-join-note">
                {t('groups.join.noteLabel')}
              </label>
              <textarea
                id="group-join-note"
                className="group-join-modal-textarea"
                rows={3}
                placeholder={t('groups.join.notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              {error ? <p className="group-join-modal-error">{error}</p> : null}

              <div className="group-join-modal-actions">
                {group.zaloLink ? (
                  <button type="button" className="group-join-modal-btn-outline" onClick={handleOpenZalo}>
                    <ExternalLink size={16} />
                    {t('groups.join.joinZalo')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="group-join-modal-btn-primary"
                  onClick={handleRegister}
                  disabled={submitting}
                >
                  {submitting ? t('groups.join.registering') : t('groups.join.register')}
                </button>
              </div>
            </>
          ) : (
            <div className="group-join-modal-success">
              <CheckCircle2 size={40} className="group-join-modal-success-icon" />
              <h2 className="group-join-modal-title">{t('groups.join.successTitle')}</h2>
              <p className="group-join-modal-desc">{t('groups.join.successBody')}</p>
              <div className="group-join-modal-actions group-join-modal-actions--center">
                {group.zaloLink ? (
                  <button type="button" className="group-join-modal-btn-primary" onClick={handleOpenZalo}>
                    <ExternalLink size={16} />
                    {t('groups.join.joinZalo')}
                  </button>
                ) : null}
                <button type="button" className="group-join-modal-btn-outline" onClick={handleClose}>
                  {t('groups.join.close')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupJoinModal;
