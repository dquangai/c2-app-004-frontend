const STATUS_MAP = {
  pending: { label: 'Chờ duyệt', className: 'admin-badge--pending' },
  approved: { label: 'Đã duyệt', className: 'admin-badge--approved' },
  rejected: { label: 'Từ chối', className: 'admin-badge--rejected' },
};

export default function AdminStatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status, className: 'admin-badge--neutral' };
  return <span className={`admin-badge ${config.className}`}>{config.label}</span>;
}
