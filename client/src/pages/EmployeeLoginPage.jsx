import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { authService } from '../services/api.js';
import { setToken } from '../utils/tokenUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import styles from './EmployeeLoginPage.module.css';
import { hapticSuccess, hapticWarning, hapticLight } from '../utils/haptics.js';

export const EmployeeLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { formData, handleChange, handleSubmit: handleFormSubmit, error, setError } = useForm(
    { email: '', password: '' },
    async (data) => {
      try {
        if (!data.email || !data.password) {
          throw new Error(t('pleaseFillRequired'));
        }

        setLoading(true);
        const response = await authService.employeeLogin(data);

        if (!response || !response.data) {
          throw new Error(t('somethingWentWrong'));
        }

        if (response.data.token) {
          setToken(response.data.token);
          hapticSuccess();
          navigate('/employee-dashboard');
        } else {
          throw new Error(response.data?.message || t('loginError'));
        }
      } catch (err) {
        hapticWarning();
        console.error('Employee login error:', err);
        const errorMessage = err?.response?.data?.message || err?.message || t('loginError');
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  );

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    handleFormSubmit(e);
  }, [handleFormSubmit]);

  useEffect(() => {
    document.body.style.background = '#000000';
  }, []);

  return (
    <div className={styles.pageContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navbarInner}>
          <button
            className={styles.navLogoBtn}
            onClick={() => { hapticLight(); navigate('/'); }}
            aria-label={t('backToHome')}
          >
            <img
              src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
              alt="New Flow"
              className={styles.navLogo}
            />
          </button>
          <div style={{ transform: 'scale(0.78)', transformOrigin: 'right center', flexShrink: 0 }}>
            <LanguageToggle darkText />
          </div>
        </div>
      </nav>

      <div className={styles.contentWrapper}>
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{t('employeeLoginTitle')}</h3>
          </div>
          <div className={styles.cardBody}>
            {error && (
              <Alert
                message={error}
                type="danger"
                onClose={() => setError(null)}
              />
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                  {t('email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.formInput}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder={t('email')}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>
                  {t('password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={styles.formInput}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder={t('password')}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? t('loggingIn') : t('login')}
              </button>
            </form>

            <p className={styles.footerText}>
              {t('employeeAccessOnly')}
            </p>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <img
          src={new URL('../assets/images/full-logo-transparent-nobuffer.png', import.meta.url).href}
          alt="New Flow"
          className={styles.footerLogo}
        />
      </footer>
    </div>
  );
};
