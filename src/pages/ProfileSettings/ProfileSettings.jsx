import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Bell, Lock, Sparkles, Clock, Save, Camera, Briefcase } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth/useAuth';
import { useLanguage } from '../../context/LanguageContext/LanguageContext';
import { getDisplayName } from '../../utils/userDisplay';
import { avatarFor, onAvatarError } from '../../utils/memberMapper';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import './ProfileSettings.css';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

function isAllowedAvatarFile(file) {
  const type = (file.type || '').toLowerCase();
  if (AVATAR_TYPES.includes(type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return AVATAR_EXTENSIONS.includes(ext || '');
}

const ProfileSettings = () => {
  const { user, updateProfile, uploadAvatar, changePassword } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('account');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [avatarMessage, setAvatarMessage] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name || getDisplayName(user));
    setBio(user?.bio || '');
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const displayAvatar = avatarPreview
    || resolveMediaUrl(user?.avatar_url)
    || avatarFor(fullName || getDisplayName(user), user?.id);

  const handleAvatarPick = () => {
    setAvatarError(null);
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isAllowedAvatarFile(file)) {
      setAvatarError('Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('Ảnh tối đa 5MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setAvatarError(null);
    setAvatarMessage(null);
    setIsUploadingAvatar(true);

    try {
      await uploadAvatar(file);
      setAvatarMessage('Đã cập nhật ảnh đại diện.');
      setAvatarPreview(null);
    } catch (err) {
      setAvatarError(err.message);
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim() || null,
      });
      setSaveMessage('Đã lưu hồ sơ.');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu mới tối thiểu 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setIsChangingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage('Mật khẩu đã được cập nhật.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const tabs = [
    { id: 'account', name: t('settings.tabs.account'), icon: User },
    { id: 'notifications', name: t('settings.tabs.notifications'), icon: Bell },
    { id: 'privacy', name: t('settings.tabs.privacy'), icon: Lock },
    { id: 'ai', name: t('settings.tabs.ai'), icon: Sparkles },
    { id: 'availability', name: t('settings.tabs.availability'), icon: Clock },
  ];

  return (
    <div className="profile-settings-container">
      <div className="profile-settings-header">
        <h1 className="profile-settings-title">{t('settings.page.title')}</h1>
        <p className="profile-settings-subtitle">{t('settings.page.subtitle')}</p>
      </div>

      <div className="profile-settings-main-card">
        {/* Sidebar */}
        <div className="profile-settings-sidebar">
          <nav className="profile-settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`profile-settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={18} className={`profile-settings-tab-icon ${activeTab === tab.id ? 'active' : ''}`} />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="profile-settings-content">
          {activeTab === 'account' && (
            <div className="profile-settings-section-container">
              <h2 className="profile-settings-section-title">{t('settings.tabs.account')}</h2>
              
              <div className="profile-settings-avatar-section">
                <div className="profile-settings-avatar-wrap">
                  <img
                    src={displayAvatar}
                    alt="Avatar"
                    className="profile-settings-avatar"
                    onError={(e) => onAvatarError(e, fullName || getDisplayName(user), user?.id)}
                  />
                  {isUploadingAvatar && <span className="profile-settings-avatar-loading">Đang tải...</span>}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                    className="profile-settings-avatar-input"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    className="profile-settings-btn-outline profile-settings-avatar-btn"
                    onClick={handleAvatarPick}
                    disabled={isUploadingAvatar}
                  >
                    <Camera size={16} />
                    {isUploadingAvatar ? 'Đang tải lên...' : 'Chọn ảnh từ máy'}
                  </button>
                  <p className="profile-settings-help-text">JPG, PNG, WebP hoặc GIF. Tối đa 5MB.</p>
                  {avatarMessage && (
                    <p className="profile-settings-help-text profile-settings-help-text--success">{avatarMessage}</p>
                  )}
                  {avatarError && (
                    <p className="profile-settings-help-text profile-settings-help-text--error">{avatarError}</p>
                  )}
                </div>
              </div>

              <div className="profile-settings-form-group">
                <label className="profile-settings-label">{t('settings.account.fullName')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="profile-settings-input"
                />
              </div>

              <div className="profile-settings-form-group">
                <label className="profile-settings-label">{t('settings.account.email')}</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="profile-settings-input"
                  readOnly
                />
                {!user?.email_verified && (
                  <p className="profile-settings-help-text" style={{ color: '#f59e0b' }}>
                    Email chưa xác minh. Kiểm tra hộp thư hoặc{' '}
                    <a href={`/verify-email?email=${encodeURIComponent(user?.email || '')}`}>
                      gửi lại
                    </a>
                    .
                  </p>
                )}
              </div>

              <div className="profile-settings-form-group">
                <label className="profile-settings-label">Giới thiệu / Chức danh</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Thành viên cộng đồng"
                  className="profile-settings-input"
                />
              </div>

              {saveMessage && <p className="profile-settings-help-text" style={{ color: '#10b981' }}>{saveMessage}</p>}
              {saveError && <p className="profile-settings-help-text" style={{ color: '#ef4444' }}>{saveError}</p>}

              <div className="profile-settings-form-actions">
                <button
                  type="button"
                  className="profile-settings-btn-primary"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  <Save size={18} /> {isSaving ? t('settings.account.saving') : t('settings.account.save')}
                </button>
              </div>

              {user?.role === 'user' && (
                <div className="profile-settings-provider-card">
                  <div className="profile-settings-provider-card__icon">
                    <Briefcase size={22} />
                  </div>
                  <div className="profile-settings-provider-card__body">
                    <h3 className="profile-settings-provider-card__title">Đăng ký cung cấp dịch vụ</h3>
                    <p className="profile-settings-provider-card__desc">
                      Chia sẻ kỹ năng với cư dân trong khu — gia sư, sửa chữa, tư vấn… Admin duyệt hồ sơ trước khi hiển thị công khai.
                    </p>
                    <Link to="/become-provider" className="profile-settings-btn-outline profile-settings-provider-card__link">
                      Bắt đầu đăng ký
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="profile-settings-section-container">
              <h2 className="profile-settings-section-title">{t('settings.tabs.notifications')}</h2>
              
              <div className="profile-settings-list">
                <div className="profile-settings-list-item">
                  <div>
                    <h3 className="profile-settings-item-title">{t('settings.notifications.push')}</h3>
                    <p className="profile-settings-item-desc">Receive alerts on your device for messages and bookings.</p>
                  </div>
                  <label className="profile-settings-toggle-label">
                    <input type="checkbox" className="profile-settings-toggle-input" defaultChecked />
                    <div className="profile-settings-toggle-bg"></div>
                  </label>
                </div>
                
                <div className="profile-settings-list-item">
                  <div>
                    <h3 className="profile-settings-item-title">{t('settings.notifications.email')}</h3>
                    <p className="profile-settings-item-desc">Receive daily summaries and important updates via email.</p>
                  </div>
                  <label className="profile-settings-toggle-label">
                    <input type="checkbox" className="profile-settings-toggle-input" defaultChecked />
                    <div className="profile-settings-toggle-bg"></div>
                  </label>
                </div>
                
                <div className="profile-settings-list-item">
                  <div>
                    <h3 className="profile-settings-item-title">Community Announcements</h3>
                    <p className="profile-settings-item-desc">Updates from Vinhomes management and local groups.</p>
                  </div>
                  <label className="profile-settings-toggle-label">
                    <input type="checkbox" className="profile-settings-toggle-input" />
                    <div className="profile-settings-toggle-bg"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="profile-settings-section-container">
              <h2 className="profile-settings-section-title">{t('settings.tabs.privacy')}</h2>
              <p className="profile-settings-section-subtitle">Control who can see your profile and contact you.</p>
              
              <div className="profile-settings-radio-list">
                <label className="profile-settings-radio-label">
                  <input type="radio" name="privacy" className="profile-settings-radio-input" defaultChecked />
                  <div>
                    <h4 className="profile-settings-item-title">Public (All Residents)</h4>
                    <p className="profile-settings-item-desc">Anyone in the Vinhomes network can view your profile and send booking requests.</p>
                  </div>
                </label>
                
                <label className="profile-settings-radio-label">
                  <input type="radio" name="privacy" className="profile-settings-radio-input" />
                  <div>
                    <h4 className="profile-settings-item-title">Private (Connections Only)</h4>
                    <p className="profile-settings-item-desc">Only people you have accepted can view your full details and book you.</p>
                  </div>
                </label>
              </div>
              
              <div className="profile-settings-password-section">
                <h3 className="profile-settings-password-title">{t('settings.privacy.changePassword')}</h3>
                {!showPasswordForm ? (
                  <button
                    type="button"
                    className="profile-settings-btn-outline"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Cập nhật mật khẩu
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="profile-settings-form-group">
                    <input
                      type="password"
                      placeholder={t('settings.privacy.currentPassword')}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="profile-settings-input"
                      required
                    />
                    <input
                      type="password"
                      placeholder={t('settings.privacy.newPassword')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="profile-settings-input"
                      required
                      minLength={8}
                    />
                    <input
                      type="password"
                      placeholder="Xác nhận mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="profile-settings-input"
                      required
                      minLength={8}
                    />
                    {passwordMessage && (
                      <p className="profile-settings-help-text" style={{ color: '#10b981' }}>{passwordMessage}</p>
                    )}
                    {passwordError && (
                      <p className="profile-settings-help-text" style={{ color: '#ef4444' }}>{passwordError}</p>
                    )}
                    <div className="profile-settings-form-actions">
                      <button
                        type="submit"
                        className="profile-settings-btn-primary"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Đang lưu...' : 'Lưu mật khẩu'}
                      </button>
                      <button
                        type="button"
                        className="profile-settings-btn-outline"
                        onClick={() => setShowPasswordForm(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'ai' && (
            <div className="profile-settings-section-container">
              <div className="profile-settings-ai-header">
                <div className="profile-settings-ai-icon-bg">
                  <Sparkles size={20} />
                </div>
                <h2 className="profile-settings-section-title" style={{marginBottom: 0}}>{t('settings.tabs.ai')}</h2>
              </div>
              
              <p className="profile-settings-ai-desc">
                V-Connect uses AI to suggest the best community groups, professionals, and activities for you based on your interests and past interactions.
              </p>
              
              <div className="profile-settings-form-group">
                <h3 className="profile-settings-interests-title">{t('settings.ai.interests')}</h3>
                <div className="profile-settings-interests-list">
                  {['Technology', 'Running', 'Parenting', 'Board Games', 'Dogs'].map(tag => (
                    <span key={tag} className="profile-settings-interest-tag">
                      {tag} &times;
                    </span>
                  ))}
                  <button className="profile-settings-interest-add">
                    {t('settings.ai.addInterest')}
                  </button>
                </div>
              </div>
              
              <div className="profile-settings-list-item">
                <div>
                  <h3 className="profile-settings-item-title">Enable Smart Suggestions</h3>
                  <p className="profile-settings-item-desc">Allow AI to read your public profile to suggest matches.</p>
                </div>
                <label className="profile-settings-toggle-label">
                  <input type="checkbox" className="profile-settings-toggle-input" defaultChecked />
                  <div className="profile-settings-toggle-bg"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="profile-settings-section-container">
              <h2 className="profile-settings-section-title">{t('settings.tabs.availability')}</h2>
              <p className="profile-settings-section-subtitle">Set your schedule so neighbors know when they can book your services.</p>
              
              <div className="profile-settings-availability-list">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} className="profile-settings-day-row">
                    <div className="profile-settings-day-name">{day}</div>
                    <div className="profile-settings-time-inputs">
                      <select className="profile-settings-time-select">
                        <option>09:00 AM</option>
                        <option>10:00 AM</option>
                      </select>
                      <span className="profile-settings-time-separator">-</span>
                      <select className="profile-settings-time-select">
                        <option>05:00 PM</option>
                        <option>06:00 PM</option>
                      </select>
                    </div>
                  </div>
                ))}
                
                {['Saturday', 'Sunday'].map(day => (
                  <div key={day} className="profile-settings-day-row">
                    <div className="profile-settings-day-name">{day}</div>
                    <div className="profile-settings-unavailable-badge">{t('settings.availability.unavailable')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
