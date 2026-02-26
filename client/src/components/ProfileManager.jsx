/**
 * ProfileManager Component
 * Allows employees to view and edit their profile
 *
 * Features:
 * - Account Login card: Edit name, email, password
 * - About Me card: Upload profile image and write bio
 * - Forgot password functionality
 * - Form validation
 * - Auto-update JWT token after profile changes
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Alert } from './Common/index.jsx';
import { authService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { setToken } from '../utils/tokenUtils.js';

const THEME_COLOR = 'rgb(5, 45, 63)';
const SECONDARY_COLOR = '#46a1a1';

export const ProfileManager = ({ onLogout }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  // State
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

  // Fetch profile on mount
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

  // Account Login handlers
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

    // Validation
    if (!loginFormData.currentPassword) {
      setAlerts({ error: t('currentPasswordRequired'), success: null });
      return;
    }

    if (loginFormData.newPassword && loginFormData.newPassword !== loginFormData.confirmPassword) {
      setAlerts({ error: t('passwordMismatch'), success: null });
      return;
    }

    if (loginFormData.newPassword && loginFormData.newPassword.length < 6) {
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

      // Update token with new user data
      if (response.data.token) {
        setToken(response.data.token);
      }

      setProfile(prev => ({
        ...prev,
        name: response.data.user.name,
        email: response.data.user.email
      }));

      setAlerts({ error: null, success: t('profileUpdatedSuccess') });
      setIsEditingLogin(false);

      // Reset password fields
      setLoginFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('failedToUpdateProfile');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setLoading(false);
    }
  };

  // About Me handlers
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
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setAlerts({ error: t('onlyImageFilesAllowed'), success: null });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setAlerts({ error: t('imageSizeTooLarge'), success: null });
        return;
      }

      setSelectedFile(file);

      // Create preview
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

    // Upload image if a new one was selected
    if (selectedFile) {
      await handleImageUpload();
    }

    // Update bio
    setLoading(true);
    try {
      await authService.updateProfile({
        bio: aboutMeData.bio.trim()
      });

      setProfile(prev => ({
        ...prev,
        bio: aboutMeData.bio.trim()
      }));

      setAlerts({ error: null, success: t('aboutMeUpdatedSuccess') });
      setIsEditingAboutMe(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('failedToUpdateAboutMe');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handlers
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setAlerts({ error: t('emailRequired'), success: null });
      return;
    }

    setResetLoading(true);
    try {
      await authService.forgotPassword({ email: resetEmail });
      setAlerts({ error: null, success: t('resetLinkSent') });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      setAlerts({ error: t('failedToSendResetLink'), success: null });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Alerts */}
          {alerts.error && (
            <Alert
              type="error"
              message={alerts.error}
              onClose={() => setAlerts({ ...alerts, error: null })}
            />
          )}
          {alerts.success && (
            <Alert
              type="success"
              message={alerts.success}
              onClose={() => setAlerts({ ...alerts, success: null })}
            />
          )}

          {/* About Me Card */}
          <div className="card post-update-card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="card-title mb-0 create-employee-title">{t('aboutMe')}</h3>
                {!isEditingAboutMe && (
                  <button
                    onClick={handleEditAboutMe}
                    className="post-update-btn"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    {t('editAboutMe')}
                  </button>
                )}
              </div>

              {/* Display Mode */}
              {!isEditingAboutMe && (
                <div>
                  {/* Profile Image */}
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('profileImageAlt')}
                        style={{
                          width: '200px',
                          height: '200px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `4px solid ${SECONDARY_COLOR}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '200px',
                          height: '200px',
                          borderRadius: '50%',
                          backgroundColor: '#f0f0f0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `4px solid ${SECONDARY_COLOR}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <span style={{ fontSize: '3rem', color: '#ccc' }}>👤</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.75rem',
                      display: 'block'
                    }}>
                      {t('aboutMe')}
                    </label>
                    <div style={{
                      fontSize: '1rem',
                      color: THEME_COLOR,
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {profile.bio || t('noProfileImage')}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {isEditingAboutMe && (
                <form onSubmit={handleAboutMeSubmit}>
                  {/* Profile Image Upload */}
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                    />

                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('profileImageAlt')}
                        style={{
                          width: '200px',
                          height: '200px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `4px solid ${SECONDARY_COLOR}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          marginBottom: '1rem'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '200px',
                          height: '200px',
                          borderRadius: '50%',
                          backgroundColor: '#f0f0f0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `4px solid ${SECONDARY_COLOR}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          marginBottom: '1rem'
                        }}
                      >
                        <span style={{ fontSize: '3rem', color: '#ccc' }}>👤</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn"
                        disabled={uploadingImage}
                        style={{
                          backgroundColor: SECONDARY_COLOR,
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        {imagePreview ? t('changeProfileImage') : t('uploadProfileImage')}
                      </button>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="btn btn-outline-danger"
                          disabled={uploadingImage}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          {t('removeProfileImage')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bio Textarea */}
                  <div className="mb-3">
                    <label htmlFor="bio" className="form-label">{t('aboutMe')}</label>
                    <textarea
                      id="bio"
                      name="bio"
                      className="form-control"
                      rows="8"
                      value={aboutMeData.bio}
                      onChange={handleBioChange}
                      placeholder={t('bioPlaceholder')}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="post-update-btn"
                      disabled={loading || uploadingImage}
                      style={{ flex: 1 }}
                    >
                      {loading || uploadingImage ? t('updating') : t('save')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAboutMe}
                      className="btn btn-secondary"
                      disabled={loading || uploadingImage}
                      style={{ flex: 1 }}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Account Login Card */}
          <div className="card post-update-card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="card-title mb-0 create-employee-title">{t('accountLogin')}</h3>
                {!isEditingLogin && (
                  <button
                    onClick={handleEditLogin}
                    className="post-update-btn"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    {t('editLogin')}
                  </button>
                )}
              </div>

              {/* Display Mode */}
              {!isEditingLogin && (
                <div style={{ padding: '0 0 1rem 0' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {t('name')}
                      </label>
                      <div style={{
                        fontSize: '1.1rem',
                        color: THEME_COLOR,
                        marginTop: '0.5rem',
                        fontWeight: '500'
                      }}>
                        {profile.name}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {t('email')}
                      </label>
                      <div style={{
                        fontSize: '1.1rem',
                        color: THEME_COLOR,
                        marginTop: '0.5rem',
                        fontWeight: '500'
                      }}>
                        {profile.email}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: THEME_COLOR,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '0.9rem'
                    }}
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
              )}

              {/* Edit Mode */}
              {isEditingLogin && (
                <form onSubmit={handleLoginSubmit}>
                  <div className="alert alert-info" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {t('verifyIdentity')}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">{t('currentPassword')} *</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      className="form-control"
                      value={loginFormData.currentPassword}
                      onChange={handleLoginChange}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <hr style={{ margin: '1.5rem 0' }} />

                  <h5 style={{ color: THEME_COLOR, marginBottom: '1rem' }}>{t('accountInfo')}</h5>

                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">{t('name')} *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      value={loginFormData.name}
                      onChange={handleLoginChange}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">{t('email')} *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={loginFormData.email}
                      onChange={handleLoginChange}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <hr style={{ margin: '1.5rem 0' }} />

                  <h5 style={{ color: THEME_COLOR, marginBottom: '0.5rem' }}>{t('changePassword')}</h5>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                    {t('leaveBlankToKeepPassword')}
                  </p>

                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">{t('newPassword')}</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      className="form-control"
                      value={loginFormData.newPassword}
                      onChange={handleLoginChange}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">{t('confirmPassword')}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className="form-control"
                      value={loginFormData.confirmPassword}
                      onChange={handleLoginChange}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="post-update-btn"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {loading ? t('updating') : t('save')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelLogin}
                      className="btn btn-secondary"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}
              onClick={() => setShowForgotPassword(false)}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '10px',
                  maxWidth: '500px',
                  width: '90%',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h4 style={{ color: THEME_COLOR, marginBottom: '1rem' }}>{t('forgotPassword')}</h4>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                  {t('forgotPasswordDescription')}
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div className="mb-3">
                    <label htmlFor="resetEmail" className="form-label">{t('email')}</label>
                    <input
                      type="email"
                      id="resetEmail"
                      className="form-control"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="post-update-btn"
                      disabled={resetLoading}
                      style={{ flex: 1 }}
                    >
                      {resetLoading ? t('sending') : t('sendResetLink')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="btn btn-secondary"
                      disabled={resetLoading}
                      style={{ flex: 1 }}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {onLogout && (
            <div className="text-center mt-5 pt-4" style={{ borderTop: '2px solid rgba(70, 161, 161, 0.2)' }}>
              <button
                onClick={() => {
                  if (window.confirm(t('logoutConfirm'))) {
                    onLogout();
                  }
                }}
                className="btn btn-lg"
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 3rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(220, 53, 69, 0.5), 0 0 20px rgba(220, 53, 69, 0.4), 0 0 40px rgba(220, 53, 69, 0.3), 0 0 60px rgba(220, 53, 69, 0.15)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#c82333';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.6), 0 0 30px rgba(220, 53, 69, 0.55), 0 0 60px rgba(220, 53, 69, 0.4), 0 0 90px rgba(220, 53, 69, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.5), 0 0 20px rgba(220, 53, 69, 0.4), 0 0 40px rgba(220, 53, 69, 0.3), 0 0 60px rgba(220, 53, 69, 0.15)';
                }}
              >
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ProfileManager.propTypes = {
  onLogout: PropTypes.func,
};
