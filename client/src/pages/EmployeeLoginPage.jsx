/**
 * EmployeeLoginPage Component Module
 * Provides authentication interface for employees to access the dashboard
 * 
 * Features:
 * - Email and password authentication
 * - JWT token storage on successful login
 * - Error handling with user feedback
 * - Loading state during authentication
 * - Language toggle support
 * - Navigation back to home page
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { authService } from '../services/api.js';
import { setToken } from '../utils/tokenUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import styles from './EmployeeLoginPage.module.css';

/**
 * Employee Login Page Component
 * Handles employee authentication and redirects to dashboard on success
 */
export const EmployeeLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Form handling with authentication logic
   */
  const { formData, handleChange, handleSubmit: handleFormSubmit, error, setError } = useForm(
    { email: '', password: '' },
    async (data) => {
      try {
        if (!data.email || !data.password) {
          throw new Error(t('fillAllFields') || 'Please fill in all fields');
        }

        setLoading(true);
        const response = await authService.employeeLogin(data);
        
        if (!response || !response.data) {
          throw new Error(t('invalidResponse') || 'Invalid server response');
        }

        if (response.data.token) {
          const tokenSet = setToken(response.data.token);
          if (!tokenSet) {
            throw new Error(t('tokenStorageError') || 'Failed to store authentication token');
          }
          navigate('/employee-dashboard');
        } else {
          throw new Error(response.data?.message || t('loginFailed') || 'Login failed');
        }
      } catch (err) {
        console.error('Employee login error:', err);
        const errorMessage = err?.response?.data?.message || err?.message || t('loginError') || 'Employee login failed';
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  );

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = useCallback((e) => {
    try {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      setGlobalError(null);
      handleFormSubmit(e);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setGlobalError(t('unexpectedError') || 'An unexpected error occurred');
    }
  }, [handleFormSubmit, t]);

  /**
   * Navigate back to home page
   */
  const handleBackToHome = useCallback(() => {
    try {
      navigate('/');
    } catch (error) {
      console.error('Error navigating home:', error);
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY <= 1) {
        document.body.style.background = '#000000';
      } else {
        document.body.style.background = '#000000';
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.background = '#000000';
    };
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{t('employeeLoginTitle')}</h3>
          </div>
          <div className={styles.cardBody}>
            {(globalError || error) && (
              <Alert
                message={globalError || error}
                type="danger"
                onClose={() => {
                  setGlobalError(null);
                  setError(null);
                }}
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
                {loading ? t('loggingIn') : t('employeeLogin')}
              </button>
            </form>

            <p className={styles.footerText}>
              {t('employeeAccessOnly')}
            </p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.backButton}
            onClick={handleBackToHome}
          >
            <span>⌂</span>
            {t('backToHome')}
          </button>
          <LanguageToggle inverse />
        </div>
      </div>
    </div>
  );
};