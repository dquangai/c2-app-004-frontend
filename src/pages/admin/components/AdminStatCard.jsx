import { Link } from 'react-router-dom';

export default function AdminStatCard({ icon: Icon, label, value, hint, to, accent }) {
  const content = (
    <div className={`admin-stat-card${accent ? ` admin-stat-card--${accent}` : ''}`}>
      <div className="admin-stat-card__icon">
        <Icon size={22} />
      </div>
      <div className="admin-stat-card__body">
        <span className="admin-stat-card__label">{label}</span>
        <strong className="admin-stat-card__value">{value}</strong>
        {hint && <span className="admin-stat-card__hint">{hint}</span>}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="admin-stat-card-link">
        {content}
      </Link>
    );
  }
  return content;
}
