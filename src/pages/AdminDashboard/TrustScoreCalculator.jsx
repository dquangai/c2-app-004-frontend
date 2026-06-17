import React from 'react';
import { FACTOR_LABELS } from '../../services/trustScoreService';
import './TrustScoreCalculator.css';

function TrustScoreCalculator({ result, loading, error, onCalculate }) {
  const score = result?.trust_score ?? null;
  const breakdown = result?.breakdown ?? null;
  const explanation = result?.explanation ?? [];
  const metadata = result?.metadata ?? null;

  let scoreClass = 'trust-calc__score-value';
  if (score !== null) {
    if (score >= 80) scoreClass += ' trust-calc__score-value--high';
    else if (score >= 60) scoreClass += ' trust-calc__score-value--mid';
    else scoreClass += ' trust-calc__score-value--low';
  }

  return (
    <div className="trust-calc">
      <div className="trust-calc__header">
        <div>
          <h3>Công cụ chấm điểm uy tín</h3>
          <p>Điểm tự động, đa yếu tố — không nhập tay.</p>
        </div>
        <button type="button" onClick={onCalculate} disabled={loading}>
          {loading ? 'Đang chấm…' : 'Tính lại'}
        </button>
      </div>

      <div className="trust-calc__score">
        <span className="trust-calc__score-label">Trust score</span>
        <span className={scoreClass}>{score !== null ? score : '—'}</span>
        <span className="trust-calc__score-max">/ 100</span>
      </div>

      {metadata && (
        <div className="trust-calc__meta">
          {metadata.is_new_user && <span className="trust-calc__badge">Thành viên mới</span>}
          {metadata.used_bootstrap && <span className="trust-calc__badge">Bootstrap scoring</span>}
          {metadata.decay_applied && (
            <span className="trust-calc__badge trust-calc__badge--warn">
              Decay −{metadata.decay_penalty}
            </span>
          )}
        </div>
      )}

      {error && <p className="trust-calc__error">{error}</p>}

      {explanation.length > 0 && (
        <div className="trust-calc__explanation">
          <strong>
            Score: {score} because:
          </strong>
          <ul>
            {explanation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {breakdown && (
        <table className="trust-calc__table">
          <thead>
            <tr>
              <th>Nhóm yếu tố</th>
              <th>Điểm</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(breakdown).map(([key, value]) => (
              <tr key={key}>
                <td>{FACTOR_LABELS[key] || key}</td>
                <td>{Math.round(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TrustScoreCalculator;
