import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, FormInput } from '../../components/Common/index.jsx';
import { authService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { LanguageToggle } from '../../components/LanguageToggle.jsx';

const THEME_COLOR = 'rgb(5, 60, 82)';
const MAX_FORM_WIDTH = '450px';

export const PasswordResetPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isValidToken, setIsValidToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [alerts, setAlerts] = useState({ error: null, success: null });

  useEffect(() => {
    verifyToken();
  }, [token]);

  useEffect(() => {
    document.body.style.background = '#000000';
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authService.verifyResetToken(token);
      setIsValidToken(response.data.valid);
    } catch (error) {
      setIsValidToken(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setAlerts({ error: null, success: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerts({ error: null, success: null });

    if (!formData.newPassword || !formData.confirmPassword) {
      setAlerts({ error: t('pleaseFillRequired'), success: null });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setAlerts({ error: t('passwordMismatch'), success: null });
      return;
    }

    if (formData.newPassword.length < 6) {
      setAlerts({ error: t('passwordMinLength'), success: null });
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword({
        token,
        newPassword: formData.newPassword
      });

      setAlerts({ error: null, success: t('passwordResetSuccess') });

      setTimeout(() => {
        navigate('/employee-login');
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('failedToResetPassword');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/employee-login');
  };

  const handleRequestNewLink = () => {
    navigate('/employee-login');
  };

  return (
    <div className="form-container" style={{ background: 'linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(5, 60, 82) 100%)' }}>
      <div style={{ width: '100%', maxWidth: MAX_FORM_WIDTH }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src={new URL('../../assets/images/logo-transparent.png', import.meta.url).href}
            alt="New Flow Logo"
            style={{ maxWidth: '200px', height: 'auto' }}
          />
        </div>

        <div className="form-card card">
          <div className="card-header">
            <h3 className="mb-0">{t('resetPassword')}</h3>
          </div>
          <div className="card-body">
            {alerts.error && (
              <Alert
                message={alerts.error}
                type="danger"
                onClose={() => setAlerts({ ...alerts, error: null })}
              />
            )}
            {alerts.success && (
              <Alert
                message={alerts.success}
                type="success"
                onClose={() => setAlerts({ ...alerts, success: null })}
              />
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p style={{ marginTop: '1rem', color: '#666' }}>Verifying reset link...</p>
              </div>
            )}

            {!loading && !isValidToken && (
              <div>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c2c7',
                    borderRadius: '5px',
                    marginBottom: '1.5rem'
                  }}
                >
                  <h5 style={{ color: '#842029', marginBottom: '0.5rem' }}>⚠️ {t('invalidResetLink')}</h5>
                  <p style={{ color: '#721c24', marginBottom: 0, fontSize: '0.9rem' }}>
                    {t('resetLinkExpiredMessage')}
                  </p>
                </div>

                <button
                  className="btn w-100 mb-2"
                  style={{ backgroundColor: THEME_COLOR, color: 'white', border: 'none' }}
                  onClick={handleRequestNewLink}
                >
                  {t('requestNewResetLink')}
                </button>

                <button
                  className="btn w-100"
                  style={{ backgroundColor: 'white', color: THEME_COLOR, border: `1px solid ${THEME_COLOR}` }}
                  onClick={handleBackToLogin}
                >
                  {t('backToLogin')}
                </button>
              </div>
            )}

            {!loading && isValidToken && !alerts.success && (
              <form onSubmit={handleSubmit}>
                <FormInput
                  label={t('enterNewPassword')}
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  autocomplete="new-password"
                />

                <FormInput
                  label={t('confirmPassword')}
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autocomplete="new-password"
                />

                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                  {t('passwordMinLength')}
                </p>

                <button
                  type="submit"
                  className="btn w-100"
                  style={{ backgroundColor: THEME_COLOR, color: 'white', border: 'none' }}
                  disabled={submitting}
                >
                  {submitting ? t('updating') : t('resetPassword')}
                </button>
              </form>
            )}

            {!loading && isValidToken && alerts.success && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ color: '#155724', marginBottom: 0 }}>
                  Redirecting to login...
                </p>
              </div>
            )}
          </div>
        </div>

        {!alerts.success && (
          <div className="text-center mt-3">
            <div className="d-flex justify-content-center align-items-center gap-2">
              <button
                className="btn btn-sm"
                style={{ backgroundColor: 'white', color: THEME_COLOR, border: '1px solid white' }}
                onClick={handleBackToLogin}
              >
                ← {t('backToLogin')}
              </button>
              <LanguageToggle inverse />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
