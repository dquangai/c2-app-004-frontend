import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  FilePenLine,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { AdminProvider, useAdmin } from './AdminContext';
import { fetchBackendHealth } from '../../utils/backendHealth';
import './AdminLayout.css';
import './admin.css';

const NAV_ROUTES = [
  { to: '/admin/overview', key: 'overview', icon: LayoutDashboard, end: false },
  { to: '/admin/members', key: 'members', icon: Users, end: false },
  { to: '/admin/applications', key: 'applications', icon: ClipboardList, end: false },
  { to: '/admin/profile-updates', key: 'profileUpdates', icon: FilePenLine, end: false },
  { to: '/admin/settings', key: 'settings', icon: Settings, end: false },
];

const PAGE_TITLE_KEYS = {
  '/admin/overview': 'overview',
  '/admin/members': 'members',
  '/admin/applications': 'applications',
  '/admin/profile-updates': 'profileUpdates',
  '/admin/settings': 'settings',
};

function AdminLayoutInner() {
  const { t } = useLanguage();
  const location = useLocation();
  const { apiKey, toast, clearToast } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendOk, setBackendOk] = useState(true);
  const [backendHint, setBackendHint] = useState('');

  const navItems = useMemo(
    () =>
      NAV_ROUTES.map(({ to, key, icon, end }) => ({
        to,
        label: t(`admin.nav.${key}`),
        icon,
        end,
      })),
    [t],
  );

  const titleKey = PAGE_TITLE_KEYS[location.pathname];
  const pageTitle = titleKey ? t(`admin.titles.${titleKey}`) : 'Admin';
  const hasApiKey = Boolean(apiKey?.trim());

  useEffect(() => {
    let cancelled = false;
    fetchBackendHealth()
      .then((data) => {
        if (cancelled) return;
        const features = data?.features || [];
        const hasProfileReview = features.includes('profile_update_review');
        const hasProvider = features.includes('provider_onboarding');
        if (!hasProfileReview || !hasProvider) {
          setBackendOk(false);
          setBackendHint(t('admin.common.backendOld'));
        } else {
          setBackendOk(true);
          setBackendHint('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendOk(false);
          setBackendHint(t('admin.common.backendDown'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname, t]);

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label={t('admin.common.closeMenu')}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`admin-sidebar${mobileOpen ? ' admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">
            <Shield size={20} />
          </div>
          <div className="admin-sidebar__brand-text">
            <strong>V-Connect Admin</strong>
            <span>Ban quản trị</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <Link to="/" className="admin-sidebar__back">
            <ArrowLeft size={16} />
            Về trang cư dân
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="admin-topbar__breadcrumb">
              Admin / <strong>{pageTitle}</strong>
            </div>
          </div>
          <div className="admin-topbar__meta">
            <span
              className={`admin-topbar__key-dot${hasApiKey ? ' admin-topbar__key-dot--ok' : ''}`}
              title={hasApiKey ? t('admin.common.apiKeyConfigured') : t('admin.common.apiKeyNotConfigured')}
            />
            {hasApiKey ? t('admin.common.apiKeyOk') : t('admin.common.apiKeyMissing')}
          </div>
        </header>

        <main className="admin-content">
          {!backendOk && backendHint && (
            <div className="admin-alert admin-alert--error" style={{ marginBottom: '1rem' }}>
              <span>{backendHint}</span>
            </div>
          )}
          {toast && (
            <div className={`admin-alert admin-alert--${toast.type === 'error' ? 'error' : 'ok'}`}>
              <span>{toast.text}</span>
              <button type="button" className="admin-alert__close" onClick={clearToast} aria-label={t('admin.common.close')}>
                ×
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminProvider>
      <AdminLayoutInner />
    </AdminProvider>
  );
}
