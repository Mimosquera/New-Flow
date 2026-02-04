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

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, FormInput } from '../components/Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { authService } from '../services/api.js';
import { setToken } from '../utils/tokenUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';

// Constants
const THEME_COLOR = 'rgb(5, 45, 63)';
const MAX_FORM_WIDTH = '450px';

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

  return (
    <div className="form-container">
      <div style={{ width: '100%', maxWidth: MAX_FORM_WIDTH }}>
        <div className="form-card card">
          <div className="card-header">
            <h3 className="mb-0">{t('employeeLoginTitle')}</h3>
          </div>
          <div className="card-body">
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
              <FormInput
                label={t('email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autocomplete="email"
              />
              
              <FormInput
                label={t('password')}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                autocomplete="current-password"
              />
              
              <button 
                type="submit" 
                className="btn w-100"
                style={{ backgroundColor: THEME_COLOR, color: 'white', border: 'none' }}
                disabled={loading}
              >
                {loading ? t('loggingIn') : t('employeeLogin')}
              </button>
            </form>

            <p className="mt-3 text-center text-muted">
              <small>{t('employeeAccessOnly')}</small>
            </p>
          </div>
        </div>
        
        <div className="text-center mt-3">
          <div className="d-flex justify-content-center align-items-center gap-2">
            <button 
              className="btn btn-sm"
              style={{ backgroundColor: 'white', color: THEME_COLOR, border: '1px solid white' }}
              onClick={handleBackToHome}
            >
              ⌂ {t('backToHome')}
            </button>
            <LanguageToggle inverse />
          </div>
        </div>
      </div>
    </div>
  );
};