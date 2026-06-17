import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, FilePenLine, Users } from 'lucide-react';
import {
  listMembers,
  listProfileUpdates,
  listProviderApplications,
} from '../../services/adminService';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { useAdmin } from './AdminContext';
import AdminPageHeader from './components/AdminPageHeader';
import AdminStatCard from './components/AdminStatCard';

export default function AdminOverview() {
  const { t } = useLanguage();
  const { apiKey, showError } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    members: 0,
    pendingApplications: 0,
    pendingUpdates: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const key = apiKey.trim();
        const [members, pendingApps, pendingUpdates] = await Promise.all([
          listMembers(),
          key ? listProviderApplications('pending', key).catch(() => []) : Promise.resolve([]),
          key ? listProfileUpdates('pending', key).catch(() => []) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setStats({
            members: members.length,
            pendingApplications: pendingApps.length,
            pendingUpdates: pendingUpdates.length,
          });
        }
      } catch (err) {
        if (!cancelled) showError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [apiKey, showError]);

  return (
    <>
      <AdminPageHeader
        title={t('admin.overview.title')}
        description="Theo dõi hàng đợi duyệt và quản lý catalog thành viên V-Connect."
      />

      <div className="admin-stat-grid">
        <AdminStatCard
          icon={Users}
          label={t('admin.overview.members')}
          value={loading ? '…' : stats.members}
          hint="Hồ sơ công khai trong hệ thống"
          to="/admin/members"
        />
        <AdminStatCard
          icon={ClipboardList}
          label={t('admin.overview.applications')}
          value={loading ? '…' : stats.pendingApplications}
          hint="Đăng ký cung cấp dịch vụ mới"
          to="/admin/applications"
          accent="warn"
        />
        <AdminStatCard
          icon={FilePenLine}
          label={t('admin.overview.profileUpdates')}
          value={loading ? '…' : stats.pendingUpdates}
          hint="Member chỉnh sửa hồ sơ công khai"
          to="/admin/profile-updates"
          accent="info"
        />
      </div>

      {!apiKey.trim() && (
        <div className="admin-panel" style={{ marginBottom: '1.25rem' }}>
          <div className="admin-panel__body">
            <strong>{t('admin.common.apiKeyMissing')}</strong>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
              {t('admin.common.configureApiKey')}
            </p>
          </div>
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Tác vụ nhanh</h2>
        </div>
        <div className="admin-panel__body">
          <div className="admin-quick-links">
            <Link to="/admin/applications" className="admin-quick-link">
              <ClipboardList size={20} />
              <div>
                Duyệt đơn đăng ký
                <span>Xác minh năng lực & cấp quyền member</span>
              </div>
            </Link>
            <Link to="/admin/profile-updates" className="admin-quick-link">
              <FilePenLine size={20} />
              <div>
                Duyệt cập nhật hồ sơ
                <span>Áp dụng thay đổi hồ sơ công khai</span>
              </div>
            </Link>
            <Link to="/admin/members" className="admin-quick-link">
              <Users size={20} />
              <div>
                Quản lý thành viên
                <span>Thêm, sửa, xóa catalog member</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
