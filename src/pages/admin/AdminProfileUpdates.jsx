import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  approveProfileUpdate,
  listProfileUpdates,
  rejectProfileUpdate,
} from '../../services/adminService';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { useAdmin } from './AdminContext';
import AdminPageHeader from './components/AdminPageHeader';
import AdminStatusBadge from './components/AdminStatusBadge';
import { formatAdminApiError } from './adminApiError';

const FILTER_KEYS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
};

export default function AdminProfileUpdates() {
  const { t, locale } = useLanguage();
  const { apiKey, showError, showSuccess } = useAdmin();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);

  const filterLabel = (value) => t(`admin.common.${FILTER_KEYS[value] || value}`);
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';

  const loadUpdates = useCallback(async () => {
    const key = apiKey.trim();
    if (!key) {
      setUpdates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listProfileUpdates(filter, key);
      setUpdates(data);
      setSelected((prev) => {
        if (!prev) return null;
        return data.find((item) => item.id === prev.id) || null;
      });
    } catch (err) {
      showError(formatAdminApiError(err.message, 'profile-updates'));
    } finally {
      setLoading(false);
    }
  }, [apiKey, filter, showError]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const handleApprove = async (update) => {
    if (!apiKey.trim()) {
      showError(t('admin.common.configureApiKey'));
      return;
    }
    if (!window.confirm(`Duyệt cập nhật hồ sơ "${update.payload.name}" (${update.member_id})?`)) return;
    try {
      await approveProfileUpdate(update.id, apiKey.trim());
      showSuccess(`Đã duyệt cập nhật của ${update.user_email}`);
      setSelected(null);
      await loadUpdates();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleReject = async (update) => {
    if (!apiKey.trim()) {
      showError(t('admin.common.configureApiKey'));
      return;
    }
    const reason = window.prompt(t('admin.profileUpdates.rejectReason'), t('admin.profileUpdates.defaultRejectReason'));
    if (!reason?.trim()) return;
    try {
      await rejectProfileUpdate(update.id, reason.trim(), apiKey.trim());
      showSuccess(`Đã từ chối cập nhật của ${update.user_email}`);
      setSelected(null);
      await loadUpdates();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <>
      <AdminPageHeader
        title={t('admin.profileUpdates.title')}
        description={t('admin.profileUpdates.description')}
        actions={
          <button type="button" className="admin-btn admin-btn--secondary" onClick={loadUpdates} disabled={loading}>
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
            <h2>Yêu cầu</h2>
            <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="pending">{t('admin.common.pending')}</option>
              <option value="approved">{t('admin.common.approved')}</option>
              <option value="rejected">{t('admin.common.rejected')}</option>
            </select>
          </div>
          <div className="admin-panel__body admin-panel__body--flush">
            {loading ? (
              <div className="admin-loading">{t('admin.common.loading')}</div>
            ) : updates.length === 0 ? (
              <div className="admin-table__empty">{t('admin.profileUpdates.empty', { filter: filterLabel(filter) })}</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cư dân</th>
                      <th>Hồ sơ mới</th>
                      <th>Member ID</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updates.map((update) => (
                      <tr
                        key={update.id}
                        className={selected?.id === update.id ? 'admin-table__row--selected' : ''}
                      >
                        <td>
                          <strong>{update.user_email}</strong>
                          <span className="admin-table__sub">{update.user_full_name}</span>
                        </td>
                        <td>
                          <strong>{update.payload.name}</strong>
                          <span className="admin-table__sub">{update.payload.profession}</span>
                        </td>
                        <td><code style={{ fontSize: '0.8125rem' }}>{update.member_id}</code></td>
                        <td><AdminStatusBadge status={update.status} /></td>
                        <td className="admin-table__actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => setSelected(update)}
                          >
                            Chi tiết
                          </button>
                          {update.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--primary admin-btn--sm"
                                onClick={() => handleApprove(update)}
                              >
                                {t('admin.common.approve')}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger admin-btn--sm"
                                onClick={() => handleReject(update)}
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
          <section className="admin-panel">
            <div className="admin-panel__head">
              <h2>Chi tiết thay đổi</h2>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(null)}>
                {t('admin.common.close')}
              </button>
            </div>
            <div className="admin-panel__body">
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                {t('admin.profileUpdates.submittedAt', {
                  date: new Date(selected.submitted_at).toLocaleString(dateLocale),
                })}
              </p>
              <dl style={{ margin: 0, fontSize: '0.875rem' }}>
                <dt style={{ fontWeight: 600, marginTop: '0.5rem' }}>{t('admin.profileUpdates.fullName')}</dt>
                <dd style={{ margin: '0.15rem 0 0', color: '#334155' }}>{selected.payload.name}</dd>
                <dt style={{ fontWeight: 600, marginTop: '0.5rem' }}>{t('admin.profileUpdates.category')}</dt>
                <dd style={{ margin: '0.15rem 0 0', color: '#334155' }}>{selected.payload.category} — {selected.payload.profession}</dd>
                <dt style={{ fontWeight: 600, marginTop: '0.5rem' }}>{t('admin.profileUpdates.area')}</dt>
                <dd style={{ margin: '0.15rem 0 0', color: '#334155' }}>{selected.payload.zone}</dd>
                <dt style={{ fontWeight: 600, marginTop: '0.5rem' }}>Kỹ năng</dt>
                <dd style={{ margin: '0.15rem 0 0', color: '#334155' }}>{(selected.payload.skills || []).join(', ')}</dd>
                <dt style={{ fontWeight: 600, marginTop: '0.5rem' }}>Giới thiệu</dt>
                <dd style={{ margin: '0.15rem 0 0', color: '#334155' }}>{selected.payload.short_bio}</dd>
              </dl>
              {selected.status === 'pending' && (
                <div className="admin-member-form__actions" style={{ borderTop: 'none', paddingTop: '1rem' }}>
                  <button type="button" className="admin-btn admin-btn--primary" onClick={() => handleApprove(selected)}>
                    {t('admin.common.approve')}
                  </button>
                  <button type="button" className="admin-btn admin-btn--danger" onClick={() => handleReject(selected)}>
                    {t('admin.common.reject')}
                  </button>
                </div>
              )}
              {selected.rejection_reason && (
                <p style={{ marginTop: '1rem', color: '#b91c1c', fontSize: '0.875rem' }}>
                  {t('admin.profileUpdates.rejectReason')} {selected.rejection_reason}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
