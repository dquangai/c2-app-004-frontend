import React, { useEffect, useState } from 'react';
import {
  fetchApplicationCredentialBlob,
  updateApplicationChecklist,
} from '../../services/adminService';
import './ProviderApplicationReview.css';

const CHECKLIST_ITEMS = [
  { key: 'skills_match_proof', label: 'Kỹ năng khớp bằng chứng / kinh nghiệm' },
  { key: 'credentials_reviewed', label: 'Đã xem ảnh/PDF chứng chỉ (nếu có)' },
  { key: 'public_profile_clean', label: 'Hồ sơ công khai không lộ SĐT/email' },
  { key: 'identity_consistent', label: 'Tên & thông tin khớp tài khoản đăng ký' },
];

function ProviderApplicationReview({ application, apiKey, onUpdated, onApprove, onReject }) {
  const [checklist, setChecklist] = useState(application.checklist || {});
  const [adminNotes, setAdminNotes] = useState(application.checklist?.admin_notes || '');
  const [saving, setSaving] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setChecklist(application.checklist || {});
    setAdminNotes(application.checklist?.admin_notes || '');
  }, [application]);

  useEffect(() => {
    let active = true;
    const urls = [];

    async function loadPreviews() {
      if (!apiKey?.trim() || !application.credentials?.length) {
        setPreviewUrls([]);
        return;
      }
      try {
        const loaded = await Promise.all(
          application.credentials.map(async (file) => {
            const blob = await fetchApplicationCredentialBlob(application.id, file.id, apiKey.trim());
            const url = URL.createObjectURL(blob);
            urls.push(url);
            return { ...file, url, isImage: file.content_type.startsWith('image/') };
          }),
        );
        if (active) setPreviewUrls(loaded);
      } catch (err) {
        if (active) setError(err.message);
      }
    }

    loadPreviews();
    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [application, apiKey]);

  const checklistComplete = CHECKLIST_ITEMS.every((item) => checklist[item.key]);

  const handleSaveChecklist = async () => {
    if (!apiKey?.trim()) {
      setError('Nhập Admin API key trước.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateApplicationChecklist(
        application.id,
        {
          skills_match_proof: Boolean(checklist.skills_match_proof),
          credentials_reviewed: Boolean(checklist.credentials_reviewed),
          public_profile_clean: Boolean(checklist.public_profile_clean),
          identity_consistent: Boolean(checklist.identity_consistent),
          admin_notes: adminNotes.trim() || null,
        },
        apiKey.trim(),
      );
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCheck = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="provider-review">
      <h3>Xác minh: {application.payload.name}</h3>
      <p className="provider-review__sub">
        {application.user_email} · {application.payload.profession} · {application.payload.zone}
      </p>

      {application.verification && (
        <div className="provider-review__block">
          <h4>Bằng chứng năng lực (admin only)</h4>
          <p><strong>{application.verification.experience_years}</strong> năm kinh nghiệm</p>
          <p className="provider-review__proof">{application.verification.capability_proof}</p>
          {application.verification.credentials_note && (
            <p className="provider-review__note">Ghi chú: {application.verification.credentials_note}</p>
          )}
        </div>
      )}

      <div className="provider-review__block">
        <h4>Ảnh / PDF chứng chỉ ({application.credentials?.length || 0})</h4>
        {previewUrls.length === 0 ? (
          <p className="provider-review__empty">Chưa có file upload hoặc đang tải…</p>
        ) : (
          <div className="provider-review__credentials">
            {previewUrls.map((file) => (
              <div key={file.id} className="provider-review__credential">
                {file.isImage ? (
                  <img src={file.url} alt={file.original_name} />
                ) : (
                  <a href={file.url} download={file.original_name} target="_blank" rel="noreferrer">
                    PDF: {file.original_name}
                  </a>
                )}
                <span>{file.original_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="provider-review__block">
        <h4>Checklist xác minh</h4>
        <ul className="provider-review__checklist">
          {CHECKLIST_ITEMS.map((item) => (
            <li key={item.key}>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item.key])}
                  onChange={() => toggleCheck(item.key)}
                />
                {item.label}
              </label>
            </li>
          ))}
        </ul>
        <label className="provider-review__notes">
          Ghi chú admin
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={2}
            placeholder="Ghi chú nội bộ — không hiển thị công khai"
          />
        </label>
        <button type="button" onClick={handleSaveChecklist} disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu checklist'}
        </button>
        {!checklistComplete && (
          <p className="provider-review__hint">
            Hoàn thành checklist trước khi gắn badge Verified.
          </p>
        )}
      </div>

      {error && <p className="provider-review__error">{error}</p>}

      {application.status === 'pending' && (
        <div className="provider-review__actions">
          <button type="button" onClick={() => onApprove(application, checklistComplete)}>
            Approve
          </button>
          <button type="button" className="provider-review__reject" onClick={() => onReject(application)}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default ProviderApplicationReview;
