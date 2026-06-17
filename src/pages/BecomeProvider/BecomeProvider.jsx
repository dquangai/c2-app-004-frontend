import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, Shield, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { getDisplayName } from '../../utils/userDisplay';
import { getMyProviderApplication, submitProviderApplication, uploadProviderCredential } from '../../services/providerService';
import './BecomeProvider.css';

const EMPTY_FORM = {
  name: '',
  category: '',
  profession: '',
  skills: '',
  availability: '',
  response_time: '',
  zone: '',
  short_bio: '',
  tags: '',
  experience_years: '',
  capability_proof: '',
  credentials_note: '',
};

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function BecomeProvider() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [credentialFiles, setCredentialFiles] = useState([]);
  const [uploadingCredentials, setUploadingCredentials] = useState(false);

  const uploadCredentials = async () => {
    if (!credentialFiles.length) return;
    setUploadingCredentials(true);
    setError(null);
    try {
      for (const file of credentialFiles) {
        await uploadProviderCredential(file);
      }
      setCredentialFiles([]);
      await loadApplication();
      setMessage('Đã upload chứng chỉ. Chỉ admin xem được file này.');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingCredentials(false);
    }
  };

  const loadApplication = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProviderApplication();
      setApplication(data);
      if (data?.payload) {
        setForm((prev) => ({
          ...prev,
          name: data.payload.name || '',
          category: data.payload.category || '',
          profession: data.payload.profession || '',
          skills: (data.payload.skills || []).join(', '),
          availability: data.payload.availability || '',
          response_time: data.payload.response_time || '',
          zone: data.payload.zone || '',
          short_bio: data.payload.short_bio || '',
          tags: (data.payload.tags || []).join(', '),
        }));
      } else if (user) {
        setForm((prev) => ({
          ...prev,
          name: user.full_name || getDisplayName(user),
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  useEffect(() => {
    if (application?.status === 'approved' && user?.role !== 'member') {
      refreshUser();
    }
  }, [application?.status, user?.role, refreshUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const skills = splitList(form.skills);
      if (skills.length === 0) {
        throw new Error('Vui lòng nhập ít nhất một kỹ năng (phân cách bằng dấu phẩy).');
      }
      if ((form.capability_proof || '').trim().length < 20) {
        throw new Error('Mô tả bằng chứng năng lực cần ít nhất 20 ký tự.');
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
        experience_years: Number(form.experience_years) || 0,
        capability_proof: form.capability_proof.trim(),
        credentials_note: form.credentials_note.trim() || null,
      };
      const created = await submitProviderApplication(payload);
      setApplication(created);
      if (credentialFiles.length) {
        setUploadingCredentials(true);
        try {
          for (const file of credentialFiles) {
            await uploadProviderCredential(file);
          }
          setCredentialFiles([]);
          const refreshed = await getMyProviderApplication();
          setApplication(refreshed);
        } finally {
          setUploadingCredentials(false);
        }
      }
      setMessage('Đã gửi đơn. Admin sẽ xác minh năng lực trước khi công bố hồ sơ.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="become-provider">
        <p>Đang tải…</p>
      </div>
    );
  }

  if (user?.role === 'member' && user?.member_id) {
    return (
      <div className="become-provider">
        <div className="become-provider__hero">
          <CheckCircle size={40} className="become-provider__icon become-provider__icon--ok" />
          <h1>{t('provider.alreadyMember.title')}</h1>
          <p>{t('provider.alreadyMember.body')}</p>
          <div className="become-provider__actions">
            <Link to="/chat" className="become-provider__btn">Mở tin nhắn</Link>
            <Link to={`/profile/${user.member_id}`} className="become-provider__btn become-provider__btn--secondary">
              Xem hồ sơ công khai
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (application?.status === 'pending') {
    return (
      <div className="become-provider">
        <div className="become-provider__hero">
          <Clock size={40} className="become-provider__icon become-provider__icon--pending" />
          <h1>{t('provider.pending.title')}</h1>
          <p>{t('provider.pending.body')}</p>
          <p className="become-provider__meta">Gửi lúc: {new Date(application.submitted_at).toLocaleString('vi-VN')}</p>
          <p className="become-provider__meta">
            Đã upload {application.credential_count || 0} file chứng chỉ (admin only)
          </p>
          <div className="become-provider__upload">
            <label className="become-provider__upload-label">
              Thêm ảnh/PDF chứng chỉ (tối đa 5 file, 5MB/file)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                onChange={(e) => setCredentialFiles(Array.from(e.target.files || []))}
              />
            </label>
            {credentialFiles.length > 0 && (
              <button
                type="button"
                className="become-provider__btn become-provider__btn--secondary"
                onClick={uploadCredentials}
                disabled={uploadingCredentials}
              >
                {uploadingCredentials ? 'Đang upload…' : `Upload ${credentialFiles.length} file`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (application?.status === 'approved' && user?.role !== 'member') {
    return (
      <div className="become-provider">
        <div className="become-provider__hero">
          <CheckCircle size={40} className="become-provider__icon become-provider__icon--ok" />
          <h1>{t('provider.approved.title')}</h1>
          <p>{t('provider.approved.body')}</p>
          <button
            type="button"
            className="become-provider__btn"
            onClick={async () => {
              await refreshUser();
              window.location.reload();
            }}
          >
            Cập nhật tài khoản
          </button>
        </div>
      </div>
    );
  }

  const showRejected = application?.status === 'rejected';

  return (
    <div className="become-provider">
      <header className="become-provider__header">
        <Briefcase size={28} />
        <div>
          <h1>{t('provider.form.title')}</h1>
          <p>{t('provider.form.subtitle')}</p>
        </div>
      </header>

      <div className="become-provider__privacy">
        <Shield size={18} />
        <div>
          <strong>Quyền riêng tư</strong>
          <p>
            Không ghi SĐT, email hay địa chỉ chi tiết trong hồ sơ công khai. Cư dân liên hệ qua chat trong app.
            Phần bằng chứng năng lực bên dưới chỉ admin xem để xác minh.
          </p>
        </div>
      </div>

      {showRejected && (
        <div className="become-provider__alert become-provider__alert--error">
          <XCircle size={18} />
          <div>
            <strong>{t('provider.rejected.title')}:</strong> {application.rejection_reason}
            <br />
            Bạn có thể gửi lại đơn mới bên dưới.
          </div>
        </div>
      )}

      {error && <div className="become-provider__alert become-provider__alert--error">{error}</div>}
      {message && <div className="become-provider__alert become-provider__alert--ok">{message}</div>}

      <form className="become-provider__form" onSubmit={handleSubmit}>
        <h2 className="become-provider__section-title">Hồ sơ công khai (sau khi duyệt)</h2>
        <div className="become-provider__grid">
          <label>
            Họ tên hiển thị
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Danh mục
            <input name="category" value={form.category} onChange={handleChange} placeholder="Gia sư, Sửa chữa…" required />
          </label>
          <label>
            Nghề / dịch vụ
            <input name="profession" value={form.profession} onChange={handleChange} required />
          </label>
          <label>
            Khu vực phục vụ
            <input
              name="zone"
              value={form.zone}
              onChange={handleChange}
              placeholder="VD: Ocean Park 1 (không ghi số nhà)"
              required
            />
          </label>
          <label>
            Lịch rảnh
            <input name="availability" value={form.availability} onChange={handleChange} required />
          </label>
          <label>
            Thời gian phản hồi
            <input name="response_time" value={form.response_time} onChange={handleChange} placeholder="Trong 2 giờ" required />
          </label>
          <label className="become-provider__full">
            Kỹ năng (phân cách bằng dấu phẩy)
            <input name="skills" value={form.skills} onChange={handleChange} required />
          </label>
          <label className="become-provider__full">
            Tags (phân cách bằng dấu phẩy)
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="gia_su, toan" />
          </label>
          <label className="become-provider__full">
            Giới thiệu ngắn (không ghi SĐT/email)
            <textarea name="short_bio" value={form.short_bio} onChange={handleChange} rows={3} required />
          </label>
        </div>

        <h2 className="become-provider__section-title">Xác minh năng lực (chỉ admin xem)</h2>
        <div className="become-provider__grid">
          <label>
            Số năm kinh nghiệm
            <input
              name="experience_years"
              type="number"
              min="0"
              max="60"
              value={form.experience_years}
              onChange={handleChange}
              required
            />
          </label>
          <label className="become-provider__full">
            Bằng chứng năng lực
            <textarea
              name="capability_proof"
              value={form.capability_proof}
              onChange={handleChange}
              rows={4}
              placeholder="Mô tả chứng chỉ, bằng cấp, kinh nghiệm thực tế, nơi từng làm việc… Admin dùng để xác minh, không hiển thị công khai."
              required
            />
          </label>
          <label className="become-provider__full">
            Ghi chú thêm cho admin (tuỳ chọn)
            <textarea
              name="credentials_note"
              value={form.credentials_note}
              onChange={handleChange}
              rows={2}
              placeholder="Link portfolio, mã cư dân Vinhomes… (tuỳ chọn)"
            />
          </label>
        </div>

        <h2 className="become-provider__section-title">Chứng chỉ (tuỳ chọn — chỉ admin xem)</h2>
        <div className="become-provider__upload become-provider__full">
          <label className="become-provider__upload-label">
            Ảnh JPG/PNG hoặc PDF (tối đa 5 file)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={(e) => setCredentialFiles(Array.from(e.target.files || []))}
            />
          </label>
          {credentialFiles.length > 0 && (
            <p className="become-provider__meta">Đã chọn {credentialFiles.length} file — upload sau khi gửi đơn.</p>
          )}
        </div>

        <button type="submit" disabled={submitting || uploadingCredentials} className="become-provider__btn">
          {submitting || uploadingCredentials ? t('provider.form.submitting') : t('provider.form.submit')}
        </button>
      </form>
    </div>
  );
}

export default BecomeProvider;
