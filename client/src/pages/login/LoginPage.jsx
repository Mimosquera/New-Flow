import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert } from '../../components/Common/index.jsx';
import { useForm } from '../../hooks/useForm.js';
import { authService } from '../../services/api.js';
import { setToken } from '../../utils/tokenUtils.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { LanguageToggle } from '../../components/LanguageToggle.jsx';
import styles from '../../styles/pages/LoginPage.module.css';
import { hapticSuccess, hapticWarning, hapticLight } from '../../utils/haptics.js';

const slideIn = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 } };
const slideBack = { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 24 } };

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotError(null);
    setForgotLoading(true);
    try {
      await authService.forgotPassword({ email: forgotEmail });
      hapticSuccess();
      setForgotSent(true);
    } catch {
      hapticWarning();
      setForgotError(t('failedToSendResetLink'));
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgot = () => { hapticLight(); setShowForgot(true); setForgotSent(false); setForgotError(null); setForgotEmail(''); };
  const closeForgot = () => { hapticLight(); setShowForgot(false); };

  useEffect(() => {
    document.body.style.background = '#000000';
  }, []);

  const transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <AnimatePresence mode="wait">
          {!showForgot ? (
            <motion.div
              key="login"
              className={styles.formCard}
              initial={slideBack.initial}
              animate={slideBack.animate}
              exit={slideBack.exit}
              transition={transition}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{t('employeeLoginTitle')}</h3>
              </div>
              <div className={styles.cardBody}>
                {error && (
                  <Alert message={error} type="danger" onClose={() => setError(null)} />
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

                <button type="button" className={styles.forgotLink} onClick={openForgot}>
                  {t('forgotPassword')}
                </button>

                <p className={styles.footerText}>
                  {t('employeeAccessOnly')}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="forgot"
              className={styles.formCard}
              initial={slideIn.initial}
              animate={slideIn.animate}
              exit={slideIn.exit}
              transition={transition}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{t('resetPassword')}</h3>
              </div>
              <div className={styles.cardBody}>
                {forgotError && (
                  <Alert message={forgotError} type="danger" onClose={() => setForgotError(null)} />
                )}

                {forgotSent ? (
                  <p className={styles.resetSentMsg}>{t('resetLinkSent')}</p>
                ) : (
                  <form onSubmit={handleForgotSubmit}>
                    <div className={styles.formGroup}>
                      <label htmlFor="forgot-email" className={styles.formLabel}>
                        {t('email')}
                      </label>
                      <input
                        id="forgot-email"
                        name="forgot-email"
                        type="email"
                        className={styles.formInput}
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder={t('email')}
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={forgotLoading || !forgotEmail.trim()}
                    >
                      {forgotLoading ? t('loading') : t('sendResetLink')}
                    </button>
                  </form>
                )}

                <button type="button" className={styles.forgotLink} onClick={closeForgot}>
                  ← {t('backToLogin')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className={styles.pageControls}>
          <div style={{ transform: 'scale(0.78)', transformOrigin: 'center' }}>
            <LanguageToggle darkText />
          </div>
          <button
            className={styles.homeBtn}
            onClick={() => { hapticLight(); navigate('/'); }}
            aria-label={t('backToHome')}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
