import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { House } from 'lucide-react';
import { Alert } from '../components/Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { serviceService, availabilityService, appointmentService, dataService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { useTranslateItems } from '../hooks/useTranslateItems.js';
import { ScrollToTop } from '../components/ScrollToTop.jsx';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import styles from './AppointmentsPage.module.css';
import { hapticSuccess, hapticWarning, hapticLight } from '../utils/haptics.js';

export const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();
  const [phase, setPhase] = useState(1);

  const [success, setSuccess] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const [translatedServices] = useTranslateItems(services, ['name', 'description'], language);

  const selectedService = location.state?.selectedService;

  useEffect(() => {
    document.body.style.background = '#000000';
    const fetchData = async () => {
      try {
        const [servicesRes, employeesRes] = await Promise.all([
          serviceService.getAll(),
          dataService.getEmployees()
        ]);
        setServices(servicesRes.data);
        setEmployees(employeesRes.data.data || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchData();
  }, []);

  const { formData, handleChange: originalHandleChange, handleSubmit: handleFormSubmit, error, setError } = useForm(
    {
      name: '',
      email: '',
      phone: '',
      service: selectedService?.id || '',
      employee: '',
      date: '',
      time: '',
      notes: ''
    },
    async (data) => {
      if (!data.name || !data.email || !data.phone || !data.service || !data.date || !data.time) {
        hapticWarning();
        throw new Error(t('pleaseFillRequired'));
      }
      if (!availableTimes.includes(data.time)) {
        hapticWarning();
        throw new Error(t('timeNotAvailable'));
      }
      const time24hr = convertTo24Hour(data.time);
      await appointmentService.create({
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        serviceId: parseInt(data.service),
        employeeId: data.employee || null,
        date: data.date,
        time: time24hr,
        customerNotes: data.notes || null,
      });
      hapticSuccess();
      setSuccess(t('appointmentRequested'));
    }
  );

  const handleChange = async (e) => {
    originalHandleChange(e);
    const { name, value } = e.target;
    if (name === 'date') {
      if (value) {
        await fetchAvailabilityForDate(value, formData.employee);
      } else {
        setAvailableTimes([]);
      }
    } else if (name === 'employee' && formData.date) {
      await fetchAvailabilityForDate(formData.date, value);
    }
  };

  const fetchAvailabilityForDate = async (date, employeeId = '') => {
    try {
      setLoadingTimes(true);
      const response = await availabilityService.getAvailableTimes(date, employeeId || null);
      const timeSlots = response.data.data || [];
      const formattedSlots = timeSlots.map(time => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      });
      setAvailableTimes(formattedSlots);
    } catch {
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours}:${minutes}:00`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(null);
    handleFormSubmit(e);
  };

  const phase1Complete = formData.name.trim() && formData.email.trim() && formData.phone.trim();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.pageContainer}>
      {/* Navbar — always visible */}
      <nav className={styles.apptNavbar}>
        <div className={styles.apptNavbarInner}>
          <button
            className={styles.apptNavLogoBtn}
            onClick={() => { hapticLight(); navigate('/'); }}
            aria-label={t('backToHome')}
          >
            <img
              src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
              alt="New Flow"
              className={styles.apptNavLogo}
            />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            <button
              className={styles.apptNavHomeBtn}
              onClick={() => { hapticLight(); navigate('/'); }}
              aria-label={t('backToHome')}
            >
              <House size={18} />
            </button>
            <div style={{ transform: 'scale(0.78)', transformOrigin: 'right center', marginLeft: '-10px' }}>
              <LanguageToggle darkText />
            </div>
          </div>
        </div>
      </nav>

      {/* Centered phase content */}
      <div className={styles.contentWrapper}>
        <AnimatePresence mode="wait">
          {phase === 1 && !success && (
            <motion.div
              key="phase1"
              className={styles.formCard}
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>{t('yourDetails')}</h1>
                <p className={styles.cardSubtitle}>{t('stepPersonal')}</p>
              </div>
              <div className={styles.cardBody}>
                {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>
                    {t('name')}<span className={styles.required}>*</span>
                  </label>
                  <input
                    id="name" name="name" type="text"
                    className={styles.formControl}
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    placeholder={t('name')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    {t('email')}<span className={styles.required}>*</span>
                  </label>
                  <input
                    id="email" name="email" type="email"
                    className={styles.formControl}
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder={t('email')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.formLabel}>
                    {t('phone')}<span className={styles.required}>*</span>
                  </label>
                  <input
                    id="phone" name="phone" type="tel"
                    className={styles.formControl}
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder={t('phone')}
                  />
                </div>

                <button
                  type="button"
                  className={styles.submitButton}
                  disabled={!phase1Complete}
                  onClick={() => { hapticLight(); setPhase(2); }}
                >
                  {t('continueBtn')}
                </button>
              </div>
            </motion.div>
          )}

          {phase === 2 && !success && (
            <motion.div
              key="phase2"
              className={styles.formCard}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>{t('appointmentDetails')}</h1>
                <p className={styles.cardSubtitle}>{t('stepBooking')}</p>
              </div>
              <div className={styles.cardBody}>
                {/* Personal info recap */}
                <div className={styles.recap}>
                  <span className={styles.recapName}>{formData.name}</span>
                  <span className={styles.recapDot}>·</span>
                  <span>{formData.email}</span>
                  <span className={styles.recapDot}>·</span>
                  <span>{formData.phone}</span>
                  <button
                    type="button"
                    className={styles.recapEdit}
                    onClick={() => { hapticLight(); setPhase(1); }}
                  >
                    {t('edit')}
                  </button>
                </div>

                {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                <form onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="service" className={styles.formLabel}>
                      {t('service')}<span className={styles.required}>*</span>
                    </label>
                    <select id="service" name="service" className={styles.formSelect} value={formData.service} onChange={handleChange} autoComplete="off">
                      <option value="">{t('selectService')}</option>
                      {translatedServices.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.price_max
                            ? `$${parseFloat(s.price).toFixed(2)}–$${parseFloat(s.price_max).toFixed(2)}`
                            : `$${parseFloat(s.price).toFixed(2)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="employee" className={styles.formLabel}>{t('barberStylist')}</label>
                    <select id="employee" name="employee" className={styles.formSelect} value={formData.employee} onChange={handleChange} autoComplete="off">
                      <option value="">{t('noPreference')}</option>
                      {employees.filter(emp => emp.name !== 'Admin').map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                    <small className={styles.helpText}>{t('noPreferenceNote')}</small>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.dateTimeRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="date" className={styles.formLabel}>{t('date')}<span className={styles.required}>*</span></label>
                        <input id="date" type="date" name="date" className={styles.formControl} value={formData.date} onChange={handleChange} min={today} autoComplete="off" />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="time" className={styles.formLabel}>{t('time')}<span className={styles.required}>*</span></label>
                        <select id="time" name="time" className={`${styles.formSelect} ${loadingTimes ? styles.loadingSelect : ''}`} value={formData.time} onChange={handleChange} disabled={!formData.date || loadingTimes} autoComplete="off">
                          <option value="">
                            {!formData.date ? t('selectDateFirst') : loadingTimes ? t('loading') : availableTimes.length === 0 ? t('noTimesAvailable') : t('selectTime')}
                          </option>
                          {availableTimes.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {formData.date && !loadingTimes && availableTimes.length === 0 && (
                      <small className={styles.alertInfo}>{t('noAvailabilityForDate')}</small>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="notes" className={styles.formLabel}>{t('notes')}</label>
                    <textarea id="notes" name="notes" className={`${styles.formControl} ${styles.textarea}`} rows="2" value={formData.notes} onChange={handleChange} placeholder={t('notesPlaceholder')} autoComplete="off" />
                  </div>

                  <button type="submit" className={styles.submitButton}>{t('submitRequest')}</button>
                </form>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              key="success"
              className={styles.formCard}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>{t('allSet')}</h1>
                <p className={styles.cardSubtitle}>{success}</p>
              </div>
              <div className={styles.cardBody}>
                <button type="button" className={styles.submitButton} onClick={() => { hapticLight(); navigate('/'); }}>
                  {t('backToHome')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer logo — visual only */}
      <footer className={styles.apptFooter}>
        <img
          src={new URL('../assets/images/full-logo-transparent-nobuffer.png', import.meta.url).href}
          alt="New Flow"
          className={styles.logo}
        />
      </footer>

      <ScrollToTop />
    </div>
  );
};
