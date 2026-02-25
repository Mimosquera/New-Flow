/**
 * ProfileManager Component
 * Allows employees to view and edit their profile (name, email, password)
 *
 * Features:
 * - Display current profile information
 * - Edit mode with current password verification
 * - Optional password change
 * - Forgot password functionality
 * - Form validation
 * - Auto-update JWT token after profile changes
 */

import { useState, useEffect } from 'react';
import { Alert } from './Common/index.jsx';
import { authService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { decodeToken, getToken, setToken } from '../utils/tokenUtils.js';

const THEME_COLOR = 'rgb(5, 45, 63)';

export const ProfileManager = () => {
  const { t } = useTranslation();

  // State
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [alerts, setAlerts] = useState({ error: null, success: null });
  const [loading, setLoading] = useState(false);
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
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        email: response.data.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setAlerts({ error: t('failedToLoadProfile'), success: null });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setAlerts({ error: null, success: null });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: profile.name,
      email: profile.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAlerts({ error: null, success: null });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setAlerts({ error: null, success: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerts({ error: null, success: null });

    // Validation
    if (!formData.currentPassword) {
      setAlerts({ error: t('currentPasswordRequired'), success: null });
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setAlerts({ error: t('passwordMismatch'), success: null });
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setAlerts({ error: t('passwordMinLength'), success: null });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        currentPassword: formData.currentPassword
      };

      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
      }

      const response = await authService.updateProfile(updateData);

      // Update token with new user data
      if (response.data.token) {
        setToken(response.data.token);
      }

      setProfile({
        name: response.data.user.name,
        email: response.data.user.email
      });

      setAlerts({ error: null, success: t('profileUpdatedSuccess') });
      setIsEditing(false);

      // Reset password fields
      setFormData(prev => ({
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
          <div className="card post-update-card shadow-sm">
            <div className="card-body">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="card-title mb-0 create-employee-title">{t('myProfile')}</h3>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="post-update-btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
              }}
            >
              {t('editProfile')}
            </button>
          )}
        </div>

        {/* Alerts */}
        {alerts.error && <Alert type="error" message={alerts.error} onClose={() => setAlerts({ ...alerts, error: null })} />}
        {alerts.success && <Alert type="success" message={alerts.success} onClose={() => setAlerts({ ...alerts, success: null })} />}

        {/* Display Mode */}
        {!isEditing && (
          <div style={{ padding: '0 0 1rem 0' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('name')}</label>
                <div style={{ fontSize: '1.1rem', color: THEME_COLOR, marginTop: '0.5rem', fontWeight: '500' }}>{profile.name}</div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('email')}</label>
                <div style={{ fontSize: '1.1rem', color: THEME_COLOR, marginTop: '0.5rem', fontWeight: '500' }}>{profile.email}</div>
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
        {isEditing && (
          <form onSubmit={handleSubmit}>
            {/* Current Password Verification */}
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
                value={formData.currentPassword}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <hr style={{ margin: '1.5rem 0' }} />

            {/* Account Information */}
            <h5 style={{ color: THEME_COLOR, marginBottom: '1rem' }}>{t('accountInfo')}</h5>

            <div className="mb-3">
              <label htmlFor="name" className="form-label">{t('name')} *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <hr style={{ margin: '1.5rem 0' }} />

            {/* Change Password (Optional) */}
            <h5 style={{ color: THEME_COLOR, marginBottom: '0.5rem' }}>{t('changePassword')}</h5>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>{t('leaveBlankToKeepPassword')}</p>

            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">{t('newPassword')}</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="form-control"
                value={formData.newPassword}
                onChange={handleChange}
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
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            {/* Action Buttons */}
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
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

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
                Enter your email address and we'll send you a link to reset your password.
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
