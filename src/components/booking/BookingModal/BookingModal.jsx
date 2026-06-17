import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, X, CheckCircle2, ShieldCheck, Star, Send } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth/useAuth';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';
import { createThread } from '../../../services/messageService';
import { useNavigate } from 'react-router-dom';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, provider }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(11);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setStep(1);
    setNotes('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSendRequest = async () => {
    if (!user) {
      onClose();
      navigate('/login');
      return;
    }
    if (!provider?.id) {
      setError(t('booking.modal.memberNotFound'));
      return;
    }

    const bookingNote = [
      `${String(selectedDate).padStart(2, '0')}/06/2026 ${selectedTime}`,
      notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join(' — ');

    setSubmitting(true);
    setError(null);
    try {
      await createThread({
        memberId: provider.id,
        bookingNote,
      });
      setStep(2);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message || t('booking.modal.sendFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysInMonth = () => {
    const days = [
      { date: 31, isPrevMonth: true },
      { date: 1 }, { date: 2 }, { date: 3 }, { date: 4 }, { date: 5 }, { date: 6 },
      { date: 7 }, { date: 8 }, { date: 9 }, { date: 10 }, { date: 11 }, { date: 12 }, { date: 13 },
      { date: 14 }, { date: 15 }, { date: 16 }, { date: 17 }, { date: 18 }, { date: 19 }, { date: 20 },
      { date: 21 }, { date: 22 }, { date: 23 }, { date: 24 }, { date: 25 }, { date: 26 }, { date: 27 },
      { date: 28 }, { date: 29 }, { date: 30 }, { date: 1, isNextMonth: true }, { date: 2, isNextMonth: true }, { date: 3, isNextMonth: true }, { date: 4, isNextMonth: true }
    ];
    return days;
  };

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal-container">
        
        {step === 1 && (
          <div className="booking-modal-content">
            <div className="booking-modal-left">
              <div className="booking-modal-avatar-container">
                <img src={provider?.avatar || "https://i.pravatar.cc/150"} alt={provider?.name} className="booking-modal-avatar" />
              </div>
              
              <h3 className="booking-modal-title">
                {provider?.name || 'Linh Nguyen'} <ShieldCheck size={18} className="text-green-500" />
              </h3>
              
              <p className="booking-modal-subtitle">{provider?.title || 'Math & Physics Tutor'}</p>
              
              <div className="booking-modal-rating">
                <Star size={16} className="text-yellow-400 fill-yellow-400" /> 
                {provider?.rating || '4.9'} <span className="text-gray-400 font-normal">({provider?.reviews || '124'})</span>
              </div>
              
              <div className="booking-modal-area-badge">
                {provider?.area || 'The Origami S2'}
              </div>
              
              <div className="booking-modal-response-time">
                <span>{t('booking.modal.responseTime')} <span className="font-bold text-gray-900">{provider?.responseTime || '~15 min'}</span></span>
              </div>
            </div>

            <div className="booking-modal-right">
              <button 
                onClick={handleClose}
                className="booking-modal-close-btn"
              >
                <X size={16} />
              </button>

              <div className="booking-modal-form-container">
                <h4 className="booking-modal-section-title">{t('booking.modal.selectDate')}</h4>
                
                <div className="booking-modal-calendar-container">
                  <div className="booking-modal-calendar-header">
                    <button type="button" className="booking-modal-calendar-nav-btn"><ChevronLeftIcon /></button>
                    <span className="booking-modal-calendar-month">June 2026</span>
                    <button type="button" className="booking-modal-calendar-nav-btn"><ChevronRightIcon /></button>
                  </div>
                  
                  <div className="booking-modal-calendar-days">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="booking-modal-calendar-day-label">{day}</div>
                    ))}
                  </div>
                  
                  <div className="booking-modal-calendar-grid">
                    {getDaysInMonth().map((dayObj, index) => {
                      const isSelected = selectedDate === dayObj.date && !dayObj.isPrevMonth && !dayObj.isNextMonth;
                      const isOtherMonth = dayObj.isPrevMonth || dayObj.isNextMonth;
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => !isOtherMonth && setSelectedDate(dayObj.date)}
                          className={`
                            booking-modal-date-btn
                            ${isSelected ? 'booking-modal-date-btn--selected' : ''}
                            ${!isSelected && !isOtherMonth ? 'booking-modal-date-btn--default' : ''}
                            ${isOtherMonth ? 'booking-modal-date-btn--disabled' : ''}
                          `}
                        >
                          {dayObj.date}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <h4 className="booking-modal-section-title">{t('booking.modal.timeSlot')}</h4>
                <div className="booking-modal-time-grid">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`
                        booking-modal-time-btn
                        ${selectedTime === time 
                          ? 'booking-modal-time-btn--selected' 
                          : 'booking-modal-time-btn--default'
                        }
                      `}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                <h4 className="booking-modal-section-title">{t('booking.modal.notes')}</h4>
                <div className="booking-modal-notes-container">
                  <textarea 
                    placeholder="Tell them briefly what you need..." 
                    className="booking-modal-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {error && <p className="booking-modal-error">{error}</p>}

                <button 
                  type="button"
                  onClick={handleSendRequest}
                  className="booking-modal-submit-btn"
                  disabled={submitting}
                >
                  {user ? (
                    <><Send size={16} /> {submitting ? t('booking.modal.sending') : t('booking.modal.sendRequest')}</>
                  ) : (
                    <>{t('booking.modal.loginRequired')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="booking-modal-success-container">
            <div className="booking-modal-success-icon-bg">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h3 className="booking-modal-success-title">{t('booking.modal.successTitle')}</h3>
            <p className="booking-modal-success-desc">{t('booking.modal.successBody')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
);

export default BookingModal;
