import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  FilePenLine,
  MessageSquare,
  MousePointerClick,
  PieChart,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  fetchDashboardStats,
  listProfileUpdates,
  listProviderApplications,
} from '../../services/adminService';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { useAdmin } from './AdminContext';
import AdminPageHeader from './components/AdminPageHeader';

const EMPTY_DASHBOARD = {
  catalog_counts: { members: 0, groups: 0, events: 0, posts: 0 },
  user_growth: { total_active: 0, by_week: [], by_month: [] },
  chat_totals: {
    conversations: 0,
    messages: 0,
    converted_conversations: 0,
    conversion_rate: 0,
  },
  chat_categories: [],
  connection_actions: [],
  connections_over_time: [],
  booking_status: { accepted: 0, pending: 0, cancelled: 0, none: 0, other: 0, total: 0 },
};

const NEED_LABELS = {
  toi_dang_co_con: 'Tìm gia sư / hỗ trợ con',
  toi_can_ho_tro_cuoc_song: 'Hỗ trợ cuộc sống',
  toi_muon_hoc_ky_nang_moi: 'Học kỹ năng mới',
  toi_muon_mo_rong_moi_quan_he: 'Mở rộng quan hệ',
  toi_can_thao_luan_nghe_nghiep: 'Thảo luận nghề nghiệp',
  toi_muon_tham_gia_cong_dong: 'Tham gia cộng đồng',
  toi_can_dich_vu_gap: 'Dịch vụ gấp',
  toi_muon_cham_soc_suc_khoe: 'Chăm sóc sức khỏe',
  khac: 'Khác',
};

const ACTION_LABELS = {
  VIEW_PROFILE: 'Xem hồ sơ',
  BOOK_MEMBER: 'Đặt lịch',
  JOIN_GROUP: 'Tham gia nhóm',
  REGISTER_EVENT: 'Đăng ký sự kiện',
};

const ACTION_COLORS = {
  VIEW_PROFILE: '#0f766e',
  BOOK_MEMBER: '#2563eb',
  JOIN_GROUP: '#f59e0b',
  REGISTER_EVENT: '#dc2626',
};

const PIE_COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function periodLabel(period) {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-');
    return `${month}/${year.slice(2)}`;
  }
  return period;
}

function needLabel(key) {
  return NEED_LABELS[key] || String(key || '').replaceAll('_', ' ');
}

function actionCount(stats, type) {
  return stats.connection_actions?.find((item) => item.type === type)?.count || 0;
}

function MetricCard({ icon: Icon, label, value, hint, tone = 'teal', to }) {
  const content = (
    <div className={`admin-kpi-card admin-kpi-card--${tone}`}>
      <div className="admin-kpi-card__icon">
        <Icon size={22} />
      </div>
      <div className="admin-kpi-card__body">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="admin-kpi-card-link">
        {content}
      </Link>
    );
  }
  return content;
}

function EmptyChart({ text }) {
  return <div className="admin-chart-empty">{text}</div>;
}

function NeedDonutChart({ items }) {
  const positive = (items || []).filter((item) => item.count > 0);
  if (!positive.length) {
    return <EmptyChart text="Chưa có dữ liệu nhu cầu" />;
  }

  const top = positive.slice(0, 5);
  const otherCount = positive.slice(5).reduce((sum, item) => sum + item.count, 0);
  const chartItems = otherCount
    ? [...top, { key: 'other', label: 'Khác', count: otherCount }]
    : top;
  const total = chartItems.reduce((sum, item) => sum + item.count, 0);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const segments = chartItems.reduce(
    (acc, item, index) => {
      const length = (item.count / total) * circumference;
      return {
        offset: acc.offset + length,
        items: [
          ...acc.items,
          {
            item,
            index,
            length,
            offset: acc.offset,
          },
        ],
      };
    },
    { offset: 0, items: [] },
  ).items;

  return (
    <div className="admin-donut-wrap">
      <svg className="admin-donut" viewBox="0 0 140 140" role="img" aria-label="Phân bố nhu cầu cư dân">
        <circle className="admin-donut__track" cx="70" cy="70" r={radius} />
        <g transform="rotate(-90 70 70)">
          {segments.map(({ item, index, length, offset }) => (
            <circle
              key={item.key}
              className="admin-donut__segment"
              cx="70"
              cy="70"
              r={radius}
              stroke={PIE_COLORS[index % PIE_COLORS.length]}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
            />
          ))}
        </g>
        <text x="70" y="66" textAnchor="middle" className="admin-donut__value">
          {formatNumber(total)}
        </text>
        <text x="70" y="84" textAnchor="middle" className="admin-donut__label">
          nhu cầu
        </text>
      </svg>

      <div className="admin-chart-legend">
        {chartItems.map((item, index) => (
          <div className="admin-chart-legend__item" key={item.key}>
            <span
              className="admin-chart-legend__swatch"
              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
            />
            <span>{needLabel(item.key)}</span>
            <strong>{Math.round((item.count / total) * 100)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionBars({ rows }) {
  const visible = (rows || []).filter((row) => row.total > 0).slice(-8);
  if (!visible.length) {
    return <EmptyChart text="Chưa có hành động kết nối" />;
  }

  return (
    <div className="admin-bar-list">
      {visible.map((row) => (
        <div className="admin-bar-row" key={row.period}>
          <span className="admin-bar-row__period">{periodLabel(row.period)}</span>
          <div className="admin-stacked-bar" aria-label={`Kết nối ${row.period}`}>
            {Object.keys(ACTION_COLORS).map((type) => {
              const value = row[type] || 0;
              if (!value) return null;
              return (
                <span
                  key={type}
                  style={{
                    width: `${(value / row.total) * 100}%`,
                    backgroundColor: ACTION_COLORS[type],
                  }}
                  title={`${ACTION_LABELS[type]}: ${value}`}
                />
              );
            })}
          </div>
          <strong>{formatNumber(row.total)}</strong>
        </div>
      ))}
      <div className="admin-chart-legend admin-chart-legend--inline">
        {Object.entries(ACTION_COLORS).map(([type, color]) => (
          <span key={type} className="admin-chart-legend__item">
            <span className="admin-chart-legend__swatch" style={{ backgroundColor: color }} />
            {ACTION_LABELS[type]}
          </span>
        ))}
      </div>
    </div>
  );
}

function GrowthBars({ growth }) {
  const monthly = growth?.by_month || [];
  const weekly = growth?.by_week || [];
  const rows = (monthly.length ? monthly : weekly).slice(-8);
  const max = Math.max(...rows.map((row) => row.count || 0), 0);
  if (!rows.length || max === 0) {
    return <EmptyChart text="Chưa có dữ liệu đăng ký" />;
  }

  return (
    <div className="admin-growth-chart">
      {rows.map((row) => (
        <div className="admin-growth-chart__item" key={row.period}>
          <div className="admin-growth-chart__bar-wrap">
            <span
              className="admin-growth-chart__bar"
              style={{ height: `${Math.max(10, (row.count / max) * 100)}%` }}
            />
          </div>
          <strong>{formatNumber(row.count)}</strong>
          <span>{periodLabel(row.period)}</span>
        </div>
      ))}
    </div>
  );
}

function BookingStatus({ status }) {
  const items = [
    { key: 'accepted', label: 'Thành công', tone: 'ok', count: status.accepted || 0 },
    { key: 'pending', label: 'Chờ duyệt', tone: 'warn', count: status.pending || 0 },
    { key: 'cancelled', label: 'Bị hủy', tone: 'danger', count: status.cancelled || 0 },
  ];
  const total = status.total || items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="admin-booking-status">
      {items.map((item) => (
        <div className={`admin-booking-status__item admin-booking-status__item--${item.tone}`} key={item.key}>
          <span>{item.label}</span>
          <strong>{formatNumber(item.count)}</strong>
          <small>{total ? `${Math.round((item.count / total) * 100)}%` : '0%'}</small>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const { t } = useLanguage();
  const { apiKey, showError } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [reviewStats, setReviewStats] = useState({
    pendingApplications: 0,
    pendingUpdates: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const key = apiKey.trim();
        const [dashboardData, pendingApps, pendingUpdates] = await Promise.all([
          fetchDashboardStats(key),
          listProviderApplications('pending', key).catch(() => []),
          listProfileUpdates('pending', key).catch(() => []),
        ]);
        if (!cancelled) {
          setDashboard({
            ...EMPTY_DASHBOARD,
            ...dashboardData,
            catalog_counts: {
              ...EMPTY_DASHBOARD.catalog_counts,
              ...(dashboardData.catalog_counts || {}),
            },
            user_growth: {
              ...EMPTY_DASHBOARD.user_growth,
              ...(dashboardData.user_growth || {}),
            },
            chat_totals: {
              ...EMPTY_DASHBOARD.chat_totals,
              ...(dashboardData.chat_totals || {}),
            },
            booking_status: {
              ...EMPTY_DASHBOARD.booking_status,
              ...(dashboardData.booking_status || {}),
            },
          });
          setReviewStats({
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

  const stats = dashboard || EMPTY_DASHBOARD;
  const totalConnections = useMemo(
    () => (stats.connection_actions || []).reduce((sum, item) => sum + (item.count || 0), 0),
    [stats.connection_actions],
  );

  return (
    <>
      <AdminPageHeader
        title={t('admin.overview.title')}
        description="Theo dõi sức khỏe cộng đồng, hiệu quả chatbot và các kết nối thực tế trong khu đô thị."
      />

      <div className="admin-kpi-grid">
        <MetricCard
          icon={Users}
          label="Tài khoản cư dân"
          value={loading ? '…' : formatNumber(stats.user_growth.total_active)}
          hint="Không tính tài khoản admin"
          tone="teal"
        />
        <MetricCard
          icon={UserCheck}
          label="Providers / Members"
          value={loading ? '…' : formatNumber(stats.catalog_counts.members)}
          hint={`${formatNumber(stats.catalog_counts.groups)} nhóm cộng đồng`}
          tone="blue"
          to="/admin/members"
        />
        <MetricCard
          icon={MessageSquare}
          label="Cuộc hội thoại"
          value={loading ? '…' : formatNumber(stats.chat_totals.conversations)}
          hint={`${formatNumber(stats.chat_totals.messages)} tin nhắn cư dân`}
          tone="violet"
        />
        <MetricCard
          icon={TrendingUp}
          label="Conversion chat"
          value={loading ? '…' : formatPercent(stats.chat_totals.conversion_rate)}
          hint={`${formatNumber(stats.chat_totals.converted_conversations)} phiên tới đề xuất`}
          tone="amber"
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

      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Phân bố nhu cầu cư dân</h2>
            <PieChart size={18} />
          </div>
          <div className="admin-panel__body">
            <NeedDonutChart items={stats.chat_categories} />
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Kết nối theo thời gian</h2>
            <BarChart3 size={18} />
          </div>
          <div className="admin-panel__body">
            <ConnectionBars rows={stats.connections_over_time} />
          </div>
        </section>
      </div>

      <div className="admin-dashboard-grid admin-dashboard-grid--compact">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Tăng trưởng cư dân đăng ký</h2>
            <TrendingUp size={18} />
          </div>
          <div className="admin-panel__body">
            <GrowthBars growth={stats.user_growth} />
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Trạng thái đặt lịch</h2>
            <CalendarCheck size={18} />
          </div>
          <div className="admin-panel__body">
            <BookingStatus status={stats.booking_status} />
          </div>
        </section>
      </div>

      <div className="admin-stat-grid admin-stat-grid--dense">
        <MetricCard
          icon={MousePointerClick}
          label="Xem hồ sơ"
          value={loading ? '…' : formatNumber(actionCount(stats, 'VIEW_PROFILE'))}
          hint="VIEW_PROFILE"
          tone="teal"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Đặt lịch"
          value={loading ? '…' : formatNumber(actionCount(stats, 'BOOK_MEMBER'))}
          hint="BOOK_MEMBER"
          tone="blue"
        />
        <MetricCard
          icon={Users}
          label="Tham gia nhóm"
          value={loading ? '…' : formatNumber(actionCount(stats, 'JOIN_GROUP'))}
          hint="JOIN_GROUP"
          tone="amber"
        />
        <MetricCard
          icon={ClipboardList}
          label="Đăng ký sự kiện"
          value={loading ? '…' : formatNumber(actionCount(stats, 'REGISTER_EVENT'))}
          hint="REGISTER_EVENT"
          tone="rose"
        />
      </div>

      <div className="admin-dashboard-grid admin-dashboard-grid--compact">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Tổng quan catalog</h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-catalog-counts">
              <span>
                <strong>{formatNumber(stats.catalog_counts.groups)}</strong>
                Nhóm
              </span>
              <span>
                <strong>{formatNumber(stats.catalog_counts.events)}</strong>
                Sự kiện
              </span>
              <span>
                <strong>{formatNumber(stats.catalog_counts.posts)}</strong>
                Bài viết
              </span>
              <span>
                <strong>{formatNumber(totalConnections)}</strong>
                Tương tác
              </span>
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Hàng đợi quản trị</h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-queue-grid">
              <Link to="/admin/applications" className="admin-queue-card">
                <ClipboardList size={20} />
                <span>Đơn đăng ký</span>
                <strong>{loading ? '…' : formatNumber(reviewStats.pendingApplications)}</strong>
              </Link>
              <Link to="/admin/profile-updates" className="admin-queue-card">
                <FilePenLine size={20} />
                <span>Cập nhật hồ sơ</span>
                <strong>{loading ? '…' : formatNumber(reviewStats.pendingUpdates)}</strong>
              </Link>
            </div>
          </div>
        </section>
      </div>

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
