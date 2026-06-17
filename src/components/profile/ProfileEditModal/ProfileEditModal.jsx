import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { submitProfileUpdate } from '../../../services/profileUpdateService';
import { useLanguage } from '../../../context/LanguageContext/LanguageContext';
import './ProfileEditModal.css';

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formFromMember(raw) {
  if (!raw) {
    return {
      name: '',
      category: '',
      profession: '',
      skills: '',
      availability: '',
      response_time: '',
      zone: '',
      short_bio: '',
      tags: '',
    };
  }
  return {
    name: raw.name || '',
    category: raw.category || '',
    profession: raw.profession || '',
    skills: (raw.skills || []).join(', '),
    availability: raw.availability || '',
    response_time: raw.response_time || '',
    zone: raw.zone || raw.residential_zone || '',
    short_bio: raw.short_bio || '',
    tags: (raw.tags || []).join(', '),
  };
}

const ProfileEditModal = ({ isOpen, onClose, memberRaw, onSubmitted }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState(formFromMember(memberRaw));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(formFromMember(memberRaw));
      setError(null);
    }
  }, [isOpen, memberRaw]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const skills = splitList(form.skills);
      if (skills.length === 0) {
        throw new Error(t('components.profileEdit.skillsRequired'));
      }
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        profession: form.profession.trim(),
        skills,
        availability: form.availability.trim(),
        response_time: form.response_time.trim(),
        zone: form.zone.trim(),
        short_bio: form.short_bio.trim(),
        tags: splitList(form.tags),
      };
      const created = await submitProfileUpdate(payload);
      onSubmitted?.(created);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-edit-overlay" onClick={onClose}>
      <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
        <header className="profile-edit-header">
          <div>
            <h2>Chỉnh sửa hồ sơ công khai</h2>
            <p>Thay đổi sẽ được gửi admin duyệt trước khi cập nhật.</p>
          </div>
          <button type="button" className="profile-edit-close" onClick={onClose} aria-label={t('components.profileEdit.close')}>
            <X size={20} />
          </button>
        </header>

        {error && <div className="profile-edit-alert profile-edit-alert--error">{error}</div>}

        <form className="profile-edit-form" onSubmit={handleSubmit}>
          <div className="profile-edit-grid">
            <label>
              Họ tên hiển thị
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Danh mục
              <input name="category" value={form.category} onChange={handleChange} required />
            </label>
            <label>
              Nghề / dịch vụ
              <input name="profession" value={form.profession} onChange={handleChange} required />
            </label>
            <label>
              Khu vực phục vụ
              <input name="zone" value={form.zone} onChange={handleChange} required />
            </label>
            <label>
              Lịch rảnh
              <input name="availability" value={form.availability} onChange={handleChange} required />
            </label>
            <label>
              Thời gian phản hồi
              <input name="response_time" value={form.response_time} onChange={handleChange} required />
            </label>
            <label className="profile-edit-full">
              Kỹ năng (phân cách bằng dấu phẩy)
              <input name="skills" value={form.skills} onChange={handleChange} required />
            </label>
            <label className="profile-edit-full">
              Tags (phân cách bằng dấu phẩy)
              <input name="tags" value={form.tags} onChange={handleChange} />
            </label>
            <label className="profile-edit-full">
              Giới thiệu ngắn (không ghi SĐT/email)
              <textarea name="short_bio" value={form.short_bio} onChange={handleChange} rows={3} required />
            </label>
          </div>
          <div className="profile-edit-actions">
            <button type="button" className="profile-edit-btn profile-edit-btn--secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="profile-edit-btn" disabled={submitting}>
              {submitting ? t('components.profileEdit.submitting') : t('components.profileEdit.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
