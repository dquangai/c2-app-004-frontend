import { Navigate } from 'react-router-dom';

/** @deprecated Use /admin/overview — kept for backward compatibility */
export default function AdminDashboard() {
  return <Navigate to="/admin/overview" replace />;
}
