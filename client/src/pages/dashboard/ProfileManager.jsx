import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { User, Lock, Camera, Trash2, LogOut, Pencil } from 'lucide-react';
import { Alert } from '../../components/Common/index.jsx';
import { authService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { setToken } from '../../utils/tokenUtils.js';
import { hapticSuccess, hapticWarning } from '../../utils/haptics.js';

const THEME_COLOR = 'rgb(5, 60, 82)';
const SECONDARY_COLOR = '#3aabdb';

export const ProfileManager = ({ onLogout }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profileImageUrl: null,
    bio: ''
  });
  const [isEditingLogin, setIsEditingLogin] = useState(false);
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [aboutMeData, setAboutMeData] = useState({
    bio: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [alerts, setAlerts] = useState({ error: null, success: null });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      const data = response.data;
      setProfile({
        name: data.name,
        email: data.email,
        profileImageUrl: data.profileImageUrl || null,
        bio: data.bio || ''
      });
      setLoginFormData({
        name: data.name,
        email: data.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setAboutMeData({
        bio: data.bio || ''
      });
      setImagePreview(data.profileImageUrl || null);
    } catch (error) {
      setAlerts({ error: t('failedToLoadProfile'), success: null });
    }
  };

  const handleEditLogin = () => {
    setIsEditingLogin(true);
    setAlerts({ error: null, success: null });
  };

  const handleCancelLogin = () => {
    setIsEditingLogin(false);
    setLoginFormData({
      name: profile.name,
      email: profile.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAlerts({ error: null, success: null });
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginFormData(prev => ({ ...prev, [name]: value }));
    setAlerts({ error: null, success: null });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAlerts({ error: null, success: null });

    if (!loginFormData.currentPassword) {
      hapticWarning();
      setAlerts({ error: t('currentPasswordRequired'), success: null });
      return;
    }

    if (loginFormData.newPassword && loginFormData.newPassword !== loginFormData.confirmPassword) {
      hapticWarning();
      setAlerts({ error: t('passwordMismatch'), success: null });
      return;
    }

    if (loginFormData.newPassword && loginFormData.newPassword.length < 6) {
      hapticWarning();
      setAlerts({ error: t('passwordMinLength'), success: null });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: loginFormData.name.trim(),
        email: loginFormData.email.trim().toLowerCase(),
        currentPassword: loginFormData.currentPassword
      };

      if (loginFormData.newPassword) {
        updateData.newPassword = loginFormData.newPassword;
      }

      const response = await authService.updateProfile(updateData);

      if (response.data.token) {
        setToken(response.data.token);
      }

      setProfile(prev => ({
        ...prev,
        name: response.data.user.name,
        email: response.data.user.email
      }));

      hapticSuccess();
      setAlerts({ error: null, success: t('profileUpdatedSuccess') });
      setIsEditingLogin(false);

      setLoginFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      hapticWarning();
      const errorMsg = error.response?.data?.message || t('failedToUpdateProfile');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAboutMe = () => {
    setIsEditingAboutMe(true);
    setAlerts({ error: null, success: null });
  };

  const handleCancelAboutMe = () => {
    setIsEditingAboutMe(false);
    setAboutMeData({
      bio: profile.bio || ''
    });
    setSelectedFile(null);
    setImagePreview(profile.profileImageUrl || null);
    setAlerts({ error: null, success: null });
  };

  const handleBioChange = (e) => {
    setAboutMeData({ bio: e.target.value });
    setAlerts({ error: null, success: null });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setAlerts({ error: t('onlyImageFilesAllowed'), success: null });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setAlerts({ error: t('imageSizeTooLarge'), success: null });
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAlerts({ error: null, success: null });
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await authService.uploadProfileImage(formData);

      setProfile(prev => ({
        ...prev,
        profileImageUrl: response.data.profileImageUrl
      }));
      setImagePreview(response.data.profileImageUrl);
      setSelectedFile(null);
      setAlerts({ error: null, success: t('imageUploadedSuccess') });
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('failedToUploadImage');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async () => {
    if (!profile.profileImageUrl) return;

    setUploadingImage(true);
    try {
      await authService.deleteProfileImage();

      setProfile(prev => ({
        ...prev,
        profileImageUrl: null
      }));
      setImagePreview(null);
      setSelectedFile(null);
      setAlerts({ error: null, success: t('imageDeletedSuccess') });
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('failedToDeleteImage');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAboutMeSubmit = async (e) => {
    e.preventDefault();
    setAlerts({ error: null, success: null });

    if (selectedFile) {
      await handleImageUpload();
    }

    setLoading(true);
    try {
      await authService.updateProfile({
        bio: aboutMeData.bio.trim()
      });

      setProfile(prev => ({
        ...prev,
        bio: aboutMeData.bio.trim()
      }));

      hapticSuccess();
      setAlerts({ error: null, success: t('aboutMeUpdatedSuccess') });
      setIsEditingAboutMe(false);
    } catch (error) {
      hapticWarning();
      const errorMsg = error.response?.data?.message || t('failedToUpdateAboutMe');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      hapticWarning();
      setAlerts({ error: t('emailRequired'), success: null });
      return;
    }

    setResetLoading(true);
    try {
      await authService.forgotPassword({ email: resetEmail });
      hapticSuccess();
      setAlerts({ error: null, success: t('resetLinkSent') });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      hapticWarning();
      setAlerts({ error: t('failedToSendResetLink'), success: null });
    } finally {
      setResetLoading(false);
    }
  };

  const profileCardStyle = {
    background: 'rgba(5, 60, 82, 0.55)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(58, 171, 219, 0.2)',
    borderRadius: '14px',
    overflow: 'hidden',
  };

  const cardHeaderStyle = {
    padding: '0.7rem 1rem',
    borderBottom: '1px solid rgba(70,161,161,0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const sectionLabelStyle = {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
    fontWeight: '600',
  };

  const sectionValueStyle = {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.9rem',
    fontWeight: '500',
  };

  return (
    <div className="container py-3">
      {(alerts.error || alerts.success) && (
        <div className="row justify-content-center mb-2">
          <div className="col-12 col-xl-10">
            {alerts.error && (
              <Alert type="error" message={alerts.error} onClose={() => setAlerts({ ...alerts, error: null })} />
            )}
            {alerts.success && (
              <Alert type="success" message={alerts.success} onClose={() => setAlerts({ ...alerts, success: null })} />
            )}
          </div>
        </div>
      )}

      <div className="row justify-content-center g-3">
        {/* About Me Card */}
        <div className="col-12 col-md-5 col-xl-4">
          <div style={profileCardStyle}>
            <div style={cardHeaderStyle}>
              <h6 style={{ margin: 0, color: '#3aabdb', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={13} />
                {t('aboutMe')}
              </h6>
              {!isEditingAboutMe && (
                <button
                  onClick={handleEditAboutMe}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(70,161,161,0.15)', color: '#3aabdb', border: '1px solid rgba(70,161,161,0.3)', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  <Pencil size={11} />
                  {t('edit')}
                </button>
              )}
            </div>

            {!isEditingAboutMe && (
              <div style={{ padding: '0.85rem 1rem' }}>
                <div className="d-flex align-items-start gap-3">
                  <div style={{ flexShrink: 0 }}>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('profileImageAlt')}
                        style={{ width: '82px', height: '82px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${SECONDARY_COLOR}` }}
                      />
                    ) : (
                      <div style={{ width: '82px', height: '82px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid rgba(70,161,161,0.4)` }}>
                        <User size={32} style={{ color: 'rgba(255,255,255,0.25)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', lineHeight: '1.55', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {profile.bio || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{t('noProfileImage')}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isEditingAboutMe && (
              <form onSubmit={handleAboutMeSubmit} style={{ padding: '1rem' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                />

                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{ flexShrink: 0 }}>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('profileImageAlt')}
                        style={{ width: '82px', height: '82px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${SECONDARY_COLOR}` }}
                      />
                    ) : (
                      <div style={{ width: '82px', height: '82px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid rgba(70,161,161,0.4)` }}>
                        <User size={32} style={{ color: 'rgba(255,255,255,0.25)' }} />
                      </div>
                    )}
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm d-flex align-items-center gap-1"
                      disabled={uploadingImage}
                      style={{ backgroundColor: SECONDARY_COLOR, color: 'white', border: 'none', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    >
                      <Camera size={12} />
                      {imagePreview ? t('changeProfileImage') : t('uploadProfileImage')}
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                        disabled={uploadingImage}
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                      >
                        <Trash2 size={12} />
                        {t('removeProfileImage')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="bio" className="form-label">{t('aboutMe')}</label>
                  <textarea
                    id="bio"
                    name="bio"
                    className="form-control"
                    rows="5"
                    value={aboutMeData.bio}
                    onChange={handleBioChange}
                    placeholder={t('bioPlaceholder')}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn post-update-btn" disabled={loading || uploadingImage}>
                    {loading || uploadingImage ? t('updating') : t('save')}
                  </button>
                  <button type="button" onClick={handleCancelAboutMe} className="btn btn-secondary btn-sm" disabled={loading || uploadingImage}>
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Account Login Card */}
        <div className="col-12 col-md-6 col-xl-4">
          <div style={profileCardStyle}>
            <div style={cardHeaderStyle}>
              <h6 style={{ margin: 0, color: '#3aabdb', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={13} />
                {t('accountLogin')}
              </h6>
              {!isEditingLogin && (
                <button
                  onClick={handleEditLogin}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(70,161,161,0.15)', color: '#3aabdb', border: '1px solid rgba(70,161,161,0.3)', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  <Pencil size={11} />
                  {t('edit')}
                </button>
              )}
            </div>

            {!isEditingLogin && (
              <div style={{ padding: '0.85rem 1rem' }}>
                <div className="row g-2 mb-3">
                  <div className="col-12 col-sm-6">
                    <div style={sectionLabelStyle}>{t('name')}</div>
                    <div style={sectionValueStyle}>{profile.name}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div style={sectionLabelStyle}>{t('email')}</div>
                    <div style={{ ...sectionValueStyle, wordBreak: 'break-all' }}>{profile.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowForgotPassword(true)}
                  style={{ background: 'none', border: 'none', color: '#3aabdb', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.82rem' }}
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            {isEditingLogin && (
              <form onSubmit={handleLoginSubmit} style={{ padding: '1rem' }}>
                <div className="alert alert-info" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {t('verifyIdentity')}
                </div>

                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">{t('currentPassword')} *</label>
                  <input type="password" id="currentPassword" name="currentPassword" className="form-control" value={loginFormData.currentPassword} onChange={handleLoginChange} required autoComplete="current-password" />
                </div>

                <hr style={{ margin: '1rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                <h6 style={{ color: '#3aabdb', marginBottom: '0.75rem' }}>{t('accountInfo')}</h6>

                <div className="row g-2 mb-2">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="name" className="form-label">{t('name')} *</label>
                    <input type="text" id="name" name="name" className="form-control" value={loginFormData.name} onChange={handleLoginChange} required autoComplete="name" />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label htmlFor="email" className="form-label">{t('email')} *</label>
                    <input type="email" id="email" name="email" className="form-control" value={loginFormData.email} onChange={handleLoginChange} required autoComplete="email" />
                  </div>
                </div>

                <hr style={{ margin: '1rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                <h6 style={{ color: '#3aabdb', marginBottom: '0.25rem' }}>{t('changePassword')}</h6>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                  {t('leaveBlankToKeepPassword')}
                </p>

                <div className="row g-2 mb-3">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="newPassword" className="form-label">{t('newPassword')}</label>
                    <input type="password" id="newPassword" name="newPassword" className="form-control" value={loginFormData.newPassword} onChange={handleLoginChange} autoComplete="new-password" />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label htmlFor="confirmPassword" className="form-label">{t('confirmPassword')}</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" className="form-control" value={loginFormData.confirmPassword} onChange={handleLoginChange} autoComplete="new-password" />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn post-update-btn" disabled={loading}>
                    {loading ? t('updating') : t('save')}
                  </button>
                  <button type="button" onClick={handleCancelLogin} className="btn btn-secondary btn-sm" disabled={loading}>
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>

      {onLogout && !isEditingLogin && (
        <div className="text-center mt-3">
          <button
            onClick={() => { if (window.confirm(t('logoutConfirm'))) onLogout(); }}
            className="btn logout-btn d-inline-flex align-items-center gap-2"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
        </div>
      )}

      {showForgotPassword && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowForgotPassword(false)}
        >
          <div
            style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ color: THEME_COLOR, marginBottom: '1rem' }}>{t('forgotPassword')}</h4>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
              {t('forgotPasswordDescription')}
            </p>
            <form onSubmit={handleForgotPassword}>
              <div className="mb-3">
                <label htmlFor="resetEmail" className="form-label">{t('email')}</label>
                <input type="email" id="resetEmail" className="form-control" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="post-update-btn" disabled={resetLoading} style={{ flex: 1 }}>
                  {resetLoading ? t('sending') : t('sendResetLink')}
                </button>
                <button type="button" onClick={() => setShowForgotPassword(false)} className="btn btn-secondary" disabled={resetLoading} style={{ flex: 1 }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ProfileManager.propTypes = {
  onLogout: PropTypes.func,
};
