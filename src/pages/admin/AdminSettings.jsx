import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { useAdmin } from './AdminContext';
import AdminPageHeader from './components/AdminPageHeader';

export default function AdminSettings() {
  const { t } = useLanguage();
  const { apiKey, setApiKey, showSuccess } = useAdmin();
  const [draft, setDraft] = useState(apiKey);

  useEffect(() => {
    setDraft(apiKey);
  }, [apiKey]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setApiKey(draft);
    showSuccess('Đã lưu Admin API key.');
  };

  return (
    <>
      <AdminPageHeader
        title={t('admin.settings.title')}
        description="Cấu hình X-Admin-API-Key để gọi các API quản trị (duyệt đơn, cập nhật catalog)."
      />

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>{t('admin.settings.apiKeyLabel')}</h2>
        </div>
        <div className="admin-panel__body">
          <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              X-Admin-API-Key
              <input
                id="admin-api-key"
                type="password"
                className="admin-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nhập key từ biến môi trường ADMIN_API_KEY"
                autoComplete="off"
              />
            </label>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
              {t('admin.settings.apiKeyHint')} Key được lưu cục bộ trên trình duyệt. Có thể đặt sẵn qua biến{' '}
              <code>VITE_ADMIN_API_KEY</code> khi build.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="admin-btn admin-btn--primary">
                {t('admin.settings.saveKey')}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
