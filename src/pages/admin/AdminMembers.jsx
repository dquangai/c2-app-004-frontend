import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import {
  deleteMember,
  upsertMember,
  listMembers,
} from '../../services/adminService';
import { calculateTrustScore } from '../../services/trustScoreService';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import TrustScoreCalculator from '../AdminDashboard/TrustScoreCalculator';
import { useAdmin } from './AdminContext';
import AdminPageHeader from './components/AdminPageHeader';
import {
  EMPTY_MEMBER,
  formToMember,
  formToTrustScoreInput,
  memberToForm,
} from './memberForm';

function professionGroupKey(member, otherLabel) {
  return (member.profession || member.category || otherLabel).trim();
}

function groupMembersByProfession(members, otherLabel) {
  const map = new Map();
  for (const member of members) {
    const key = professionGroupKey(member, otherLabel);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(member);
  }

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'vi'))
    .map(([label, groupMembers]) => ({
      label,
      category: groupMembers[0]?.category || label,
      members: [...groupMembers].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    }));
}

export default function AdminMembers() {
  const { t } = useLanguage();
  const { apiKey, showError, showSuccess } = useAdmin();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [trustScoreResult, setTrustScoreResult] = useState(null);
  const [trustScoreLoading, setTrustScoreLoading] = useState(false);
  const [trustScoreError, setTrustScoreError] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const groupsInitialized = useRef(false);

  const otherLabel = t('admin.common.other');

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMembers();
      setMembers(data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (loading || members.length === 0 || groupsInitialized.current) return;
    groupsInitialized.current = true;
    setCollapsedGroups(new Set(groupMembersByProfession(members, otherLabel).map((group) => group.label)));
  }, [loading, members, otherLabel]);

  const runCalculateTrustScore = useCallback(async () => {
    const key = apiKey.trim();
    if (!key) {
      setTrustScoreError(t('admin.common.configureApiKey'));
      setTrustScoreResult(null);
      return;
    }
    setTrustScoreLoading(true);
    setTrustScoreError(null);
    try {
      const result = await calculateTrustScore(formToTrustScoreInput(form), key);
      setTrustScoreResult(result);
    } catch (err) {
      setTrustScoreError(err.message);
      setTrustScoreResult(null);
    } finally {
      setTrustScoreLoading(false);
    }
  }, [apiKey, form, t]);

  useEffect(() => {
    if (!showForm) return undefined;
    const timer = setTimeout(() => {
      if (form.name || form.short_bio || form.skills) {
        runCalculateTrustScore();
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [showForm, form, runCalculateTrustScore]);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const startCreate = () => {
    setEditing(false);
    setForm({ ...EMPTY_MEMBER, id: `mem_${Date.now()}` });
    setTrustScoreResult(null);
    setTrustScoreError(null);
    setShowForm(true);
  };

  const startEdit = (member) => {
    setEditing(true);
    setForm(memberToForm(member));
    setTrustScoreResult(null);
    setTrustScoreError(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(EMPTY_MEMBER);
    setEditing(false);
    setShowForm(false);
    setTrustScoreResult(null);
    setTrustScoreError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!apiKey.trim()) {
      showError(t('admin.common.configureApiKeyBeforeSave'));
      return;
    }

    let scoreResult = trustScoreResult;
    if (!scoreResult) {
      try {
        scoreResult = await calculateTrustScore(formToTrustScoreInput(form), apiKey.trim());
        setTrustScoreResult(scoreResult);
      } catch (err) {
        showError(err.message);
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await upsertMember(formToMember(form), apiKey.trim());
      showSuccess(
        editing
          ? `Đã cập nhật ${saved.name} (trust: ${saved.trust_score})`
          : `Đã tạo ${saved.name} (trust: ${saved.trust_score})`,
      );
      cancelForm();
      await loadMembers();
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    if (!apiKey.trim()) {
      showError(t('admin.common.configureApiKey'));
      return;
    }
    if (!window.confirm(`Xóa thành viên "${member.name}" (${member.id})?`)) return;
    try {
      await deleteMember(member.id, apiKey.trim());
      showSuccess(`Đã xóa ${member.id}`);
      if (form.id === member.id) cancelForm();
      await loadMembers();
    } catch (err) {
      showError(err.message);
    }
  };

  const filtered = members.filter((member) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      member.id.toLowerCase().includes(q) ||
      member.name.toLowerCase().includes(q) ||
      (member.category || '').toLowerCase().includes(q) ||
      (member.profession || '').toLowerCase().includes(q)
    );
  });

  const professionGroups = useMemo(
    () => groupMembersByProfession(filtered, otherLabel),
    [filtered, otherLabel],
  );

  useEffect(() => {
    if (!search.trim()) return;
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      for (const group of professionGroups) {
        next.delete(group.label);
      }
      return next;
    });
  }, [search, professionGroups]);

  const toggleGroup = (label) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const expandAllGroups = () => setCollapsedGroups(new Set());
  const collapseAllGroups = () => {
    setCollapsedGroups(new Set(professionGroups.map((group) => group.label)));
  };

  const renderMemberRow = (member) => (
    <tr key={member.id}>
      <td><code style={{ fontSize: '0.8125rem' }}>{member.id}</code></td>
      <td>
        <strong>{member.name}</strong>
        <span className="admin-table__sub">{member.residential_zone || member.zone}</span>
      </td>
      <td>{member.category}</td>
      <td>{member.trust_score}</td>
      <td>{member.verified ? '✓' : '—'}</td>
      <td className="admin-table__actions">
        <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => startEdit(member)}>
          {t('admin.common.edit')}
        </button>
        <button type="button" className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleDelete(member)}>
          {t('admin.common.delete')}
        </button>
      </td>
    </tr>
  );

  return (
    <>
      <AdminPageHeader
        title={t('admin.members.title')}
        description={t('admin.members.description')}
        actions={
          <>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={loadMembers} disabled={loading}>
              <RefreshCw size={16} />
              Làm mới
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={startCreate}>
              <Plus size={16} />
              Thêm thành viên
            </button>
          </>
        }
      />

      {showForm && (
        <section className="admin-panel" style={{ marginBottom: '1.25rem' }}>
          <div className="admin-panel__head">
            <h2>{editing ? t('admin.members.editTitle') : t('admin.members.createTitle')}</h2>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={cancelForm}>
              {t('admin.common.close')}
            </button>
          </div>
          <div className="admin-panel__body">
            <form className="admin-member-form" onSubmit={handleSubmit}>
              <div className="admin-member-form__grid">
                <label>
                  ID
                  <input className="admin-input" name="id" value={form.id} onChange={handleFormChange} required disabled={editing} />
                </label>
                <label>
                  Họ tên
                  <input className="admin-input" name="name" value={form.name} onChange={handleFormChange} required />
                </label>
                <label>
                  Danh mục
                  <input className="admin-input" name="category" value={form.category} onChange={handleFormChange} required />
                </label>
                <label>
                  Nghề / dịch vụ
                  <input className="admin-input" name="profession" value={form.profession} onChange={handleFormChange} required />
                </label>
                <label>
                  Rating (0–5)
                  <input className="admin-input" name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={handleFormChange} required />
                </label>
                <label>
                  Số đánh giá
                  <input className="admin-input" name="review_count" type="number" min="0" value={form.review_count ?? 0} onChange={handleFormChange} />
                </label>
                <label>
                  Lịch rảnh
                  <input className="admin-input" name="availability" value={form.availability} onChange={handleFormChange} required />
                </label>
                <label>
                  Thời gian phản hồi
                  <input className="admin-input" name="response_time" value={form.response_time} onChange={handleFormChange} required />
                </label>
                <label>
                  Khu dân cư
                  <input className="admin-input" name="residential_zone" value={form.residential_zone} onChange={handleFormChange} required />
                </label>
                <label>
                  Khu vực phục vụ
                  <input className="admin-input" name="zone" value={form.zone} onChange={handleFormChange} required />
                </label>
                <label className="admin-member-form__full">
                  Kỹ năng (phân cách dấu phẩy)
                  <input className="admin-input" name="skills" value={form.skills} onChange={handleFormChange} />
                </label>
                <label className="admin-member-form__full">
                  Tags
                  <input className="admin-input" name="tags" value={form.tags} onChange={handleFormChange} />
                </label>
                <label className="admin-member-form__full">
                  Giới thiệu ngắn
                  <textarea className="admin-textarea" name="short_bio" value={form.short_bio} onChange={handleFormChange} rows={2} required />
                </label>
                <label className="admin-member-form__full">
                  Embedding text
                  <textarea className="admin-textarea" name="embedding_text" value={form.embedding_text} onChange={handleFormChange} rows={2} required />
                </label>
                <label className="admin-member-form__checkbox">
                  <input name="verified" type="checkbox" checked={form.verified} onChange={handleFormChange} />
                  Verified
                </label>
                <TrustScoreCalculator
                  result={trustScoreResult}
                  loading={trustScoreLoading}
                  error={trustScoreError}
                  onCalculate={runCalculateTrustScore}
                />
              </div>
              <div className="admin-member-form__actions">
                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving || trustScoreLoading}>
                  {saving ? t('admin.common.saving') : editing ? t('admin.common.update') : t('admin.common.create')}
                </button>
                <button type="button" className="admin-btn admin-btn--secondary" onClick={cancelForm}>
                  {t('admin.common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>
            Danh sách ({filtered.length})
            {!loading && filtered.length > 0 && (
              <span className="admin-member-groups__summary">
                · {professionGroups.length} nhóm nghề
              </span>
            )}
          </h2>
          <div className="admin-toolbar">
            {!loading && filtered.length > 0 && (
              <>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={expandAllGroups}>
                  Mở tất cả
                </button>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={collapseAllGroups}>
                  Thu gọn
                </button>
              </>
            )}
            <input
              type="search"
              className="admin-input admin-input--search"
              placeholder={t('admin.members.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="admin-panel__body admin-panel__body--flush">
          {loading ? (
            <div className="admin-loading">{t('admin.common.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="admin-table__empty">{t('admin.members.empty')}</div>
          ) : (
            <div className="admin-member-groups">
              {professionGroups.map((group) => {
                const collapsed = collapsedGroups.has(group.label);
                return (
                  <section key={group.label} className="admin-member-group">
                    <button
                      type="button"
                      className="admin-member-group__head"
                      onClick={() => toggleGroup(group.label)}
                      aria-expanded={!collapsed}
                    >
                      <span className="admin-member-group__toggle" aria-hidden>
                        {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </span>
                      <span className="admin-member-group__title">
                        <strong>{group.label}</strong>
                        {group.category !== group.label && (
                          <span className="admin-member-group__category">{group.category}</span>
                        )}
                      </span>
                      <span className="admin-badge admin-badge--neutral">{group.members.length}</span>
                    </button>
                    {!collapsed && (
                      <div className="admin-table-wrap">
                        <table className="admin-table admin-table--grouped">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Tên</th>
                              <th>Danh mục</th>
                              <th>Trust</th>
                              <th>Verified</th>
                              <th>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.members.map(renderMemberRow)}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
