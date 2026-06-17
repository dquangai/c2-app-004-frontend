import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  approveProviderApplication,
  listProviderApplications,
  rejectProviderApplication,
} from '../../services/adminService';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import ProviderApplicationReview from '../AdminDashboard/ProviderApplicationReview';
import { useAdmin } from './AdminContext';
import AdminPageHeader from './components/AdminPageHeader';
import AdminStatusBadge from './components/AdminStatusBadge';
import { formatAdminApiError } from './adminApiError';

const FILTER_KEYS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
};

export default function AdminApplications() {
  const { t } = useLanguage();
  const { apiKey, showError, showSuccess } = useAdmin();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);

  const filterLabel = (value) => t(`admin.common.${FILTER_KEYS[value] || value}`);

  const loadApplications = useCallback(async () => {
    const key = apiKey.trim();
    if (!key) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listProviderApplications(filter, key);
      setApplications(data);
      setSelected((prev) => {
        if (!prev) return null;
        return data.find((item) => item.id === prev.id) || null;
      });
    } catch (err) {
      showError(formatAdminApiError(err.message, 'applications'));
    } finally {
      setLoading(false);
    }
  }, [apiKey, filter, showError]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = async (application, checklistComplete = false) => {
    if (!apiKey.trim()) {
      showError(t('admin.common.configureApiKey'));
      return;
    }
    let markVerified = false;
    if (checklistComplete) {
      markVerified = window.confirm(
        `Duyệt ${application.payload.name} với badge Verified?\n\nChecklist đã đủ — hồ sơ hiển thị uy tín đầy đủ.`,
      );
    } else {
      const proceed = window.confirm(
        `Duyệt ${application.payload.name} nhưng CHƯA verified?\n\nChỉ cấp quyền member, chưa gắn badge uy tín.`,
      );
      if (!proceed) return;
    }
    try {
      const result = await approveProviderApplication(
        application.id,
        { rating: 4.0, mark_verified: markVerified },
        apiKey.trim(),
      );
      showSuccess(
        `Đã duyệt ${application.user_email} → ${result.member_id}`
        + (result.verified ? ' (verified)' : ''),
      );
      setSelected(null);
      await loadApplications();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleReject = async (application) => {
    if (!apiKey.trim()) {
      showError(t('admin.common.configureApiKey'));
      return;
    }
    const reason = window.prompt('Lý do từ chối:', 'Thiếu thông tin xác minh.');
    if (!reason?.trim()) return;
    try {
      await rejectProviderApplication(application.id, reason.trim(), apiKey.trim());
      showSuccess(`Đã từ chối đơn của ${application.user_email}`);
      setSelected(null);
      await loadApplications();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <>
      <AdminPageHeader
        title={t('admin.applications.title')}
        description={t('admin.applications.description')}
        actions={
          <button type="button" className="admin-btn admin-btn--secondary" onClick={loadApplications} disabled={loading}>
            <RefreshCw size={16} />
            Làm mới
          </button>
        }
      />

      {!apiKey.trim() && (
        <div className="admin-alert admin-alert--error" style={{ marginBottom: '1rem' }}>
          {t('admin.common.configureApiKey')}
        </div>
      )}

      <div className={`admin-split${selected ? ' admin-split--review' : ''}`}>
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Hàng đợi</h2>
            <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="pending">{t('admin.common.pending')}</option>
              <option value="approved">{t('admin.common.approved')}</option>
              <option value="rejected">{t('admin.common.rejected')}</option>
            </select>
          </div>
          <div className="admin-panel__body admin-panel__body--flush">
            {loading ? (
              <div className="admin-loading">{t('admin.common.loading')}</div>
            ) : applications.length === 0 ? (
              <div className="admin-table__empty">{t('admin.applications.empty', { filter: filterLabel(filter) })}</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cư dân</th>
                      <th>Hồ sơ</th>
                      <th>Khu vực</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        className={selected?.id === app.id ? 'admin-table__row--selected' : ''}
                      >
                        <td>
                          <strong>{app.user_email}</strong>
                          <span className="admin-table__sub">{app.user_full_name}</span>
                        </td>
                        <td>
                          <strong>{app.payload.name}</strong>
                          <span className="admin-table__sub">{app.payload.profession}</span>
                        </td>
                        <td>{app.payload.zone}</td>
                        <td>
                          <AdminStatusBadge status={app.status} />
                          {app.member_id && (
                            <span className="admin-table__sub">{app.member_id}</span>
                          )}
                        </td>
                        <td className="admin-table__actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => setSelected(app)}
                          >
                            Xem
                          </button>
                          {app.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--primary admin-btn--sm"
                                onClick={() => handleApprove(app)}
                              >
                                {t('admin.common.approve')}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger admin-btn--sm"
                                onClick={() => handleReject(app)}
                              >
                                {t('admin.common.reject')}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {selected && (
          <ProviderApplicationReview
            application={selected}
            apiKey={apiKey}
            onUpdated={(updated) => {
              setSelected(updated);
              setApplications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            }}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>
    </>
  );
}
