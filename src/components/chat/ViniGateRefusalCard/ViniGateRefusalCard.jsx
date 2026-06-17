import React from 'react';
import { ShieldAlert, Stethoscope, PawPrint, Users, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';
import './ViniGateRefusalCard.css';

function suggestionIcon(label = '') {
  const text = label.toLowerCase();
  if (text.includes('bác sĩ') || text.includes('thú y') || text.includes('nhi')) {
    return Stethoscope;
  }
  if (text.includes('thú cưng') || text.includes('chăm sóc')) {
    return PawPrint;
  }
  if (text.includes('nhóm') || text.includes('cộng đồng')) {
    return Users;
  }
  return Sparkles;
}

export default function ViniGateRefusalCard({ card, onSuggestionClick, disabled = false, compact = false }) {
  const { t } = useLanguage();
  if (!card) return null;

  const variant = card.variant === 'info' ? 'info' : 'blocked';

  return (
    <div
      className={`vini-gate-refusal vini-gate-refusal--${variant}${compact ? ' vini-gate-refusal--compact' : ''}`}
      role="region"
      aria-label={card.title}
    >
      <div className="vini-gate-refusal__main">
        <div className="vini-gate-refusal__head">
          <span className="vini-gate-refusal__icon" aria-hidden>
            <ShieldAlert size={compact ? 18 : 22} strokeWidth={2} />
          </span>
          <h4 className="vini-gate-refusal__title">{card.title}</h4>
        </div>
        <p className="vini-gate-refusal__body">{card.body}</p>
      </div>

      {card.suggestions?.length > 0 ? (
        <div className="vini-gate-refusal__suggestions">
          <p className="vini-gate-refusal__suggestions-label">{t('chat.gateRefusal.tryLabel')}</p>
          <div className="vini-gate-refusal__chips">
            {card.suggestions.map((item) => {
              const Icon = suggestionIcon(item.label);
              const value = item.value || item.label;
              return (
                <button
                  key={value}
                  type="button"
                  className="vini-gate-refusal__chip"
                  onClick={() => onSuggestionClick?.(value)}
                  disabled={disabled}
                >
                  <Icon size={14} aria-hidden />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {card.gate_tag ? (
        <p className="vini-gate-refusal__tag">{card.gate_tag}</p>
      ) : null}
    </div>
  );
}
