import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [direction, setDirection] = useState(1);

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

  const goTo = (target) => {
    hapticLight();
    setDirection(target > phase ? 1 : -1);
    setPhase(target);
  };

  const phase1Complete = formData.name.trim() && formData.email.trim() && formData.phone.trim();
  const phase2Complete = !!formData.service;
  const phase3Complete = !!formData.date && !!formData.time;
  const today = new Date().toISOString().split('T')[0];

  const selectedServiceObj = translatedServices.find(s => String(s.id) === String(formData.service));
  const selectedEmployeeObj = employees.find(e => String(e.id) === String(formData.employee));

  const formatPrice = (s) => s.price_max
    ? `$${parseFloat(s.price).toFixed(2)}–$${parseFloat(s.price_max).toFixed(2)}`
    : `$${parseFloat(s.price).toFixed(2)}`;

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir * -32, scale: 0.97 }),
  };

  return (
    <div className={styles.pageContainer}>
      <nav className={styles.apptNavbar}>
        <div className={styles.apptNavbarInner}>
          <img
            src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
            alt="New Flow"
            className={styles.apptNavLogo}
          />
          <div className="d-flex align-items-center gap-1">
            <button
              className={styles.apptNavBtn}
              onClick={() => { hapticLight(); navigate('/'); }}
            >
              Home
            </button>
            <div style={{ transform: 'scale(0.78)', transformOrigin: 'right center', flexShrink: 0 }}>
              <LanguageToggle darkText />
            </div>
          </div>
        </div>
      </nav>

      <div className={styles.contentWrapper}>
        <AnimatePresence mode="wait" custom={direction}>
          {phase === 1 && !success && (
            <motion.div
              key="phase1"
              className={styles.formCard}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>{t('yourDetails')}</h1>
                <p className={styles.cardSubtitle}>{t('step')} 1 / 3</p>
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
                  onClick={() => goTo(2)}
                >
                  {t('continue')}
                </button>
              </div>
            </motion.div>
          )}

          {phase === 2 && !success && (
            <motion.div
              key="phase2"
              className={styles.formCard}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>{t('chooseService')}</h1>
                <p className={styles.cardSubtitle}>{t('step')} 2 / 3</p>
              </div>
              <div className={styles.cardBody}>
                {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                <div className={styles.formGroup}>
                  <label htmlFor="service" className={styles.formLabel}>
                    {t('service')}<span className={styles.required}>*</span>
                  </label>
                  <select id="service" name="service" className={styles.formSelect} value={formData.service} onChange={handleChange} autoComplete="off">
                    <option value="">{t('selectService')}</option>
                    {translatedServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {formatPrice(s)}
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

                <div className={styles.phaseNav}>
                  <button type="button" className={styles.backButton} onClick={() => goTo(1)}>
                    {t('back')}
                  </button>
                  <button
                    type="button"
                    className={styles.submitButton}
                    disabled={!phase2Complete}
                    onClick={() => goTo(3)}
                    style={{ flex: 1 }}
                  >
                    {t('continue')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 3 && !success && (
            <motion.div
              key="phase3"
              className={styles.formCard}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>{t('pickTime')}</h1>
                <p className={styles.cardSubtitle}>{t('step')} 3 / 3</p>
              </div>
              <div className={styles.cardBody}>
                {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

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

                <div className={styles.phaseNav}>
                  <button type="button" className={styles.backButton} onClick={() => goTo(2)}>
                    {t('back')}
                  </button>
                  <button
                    type="button"
                    className={styles.submitButton}
                    disabled={!phase3Complete}
                    onClick={() => goTo(4)}
                    style={{ flex: 1 }}
                  >
                    {t('reviewBooking')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 4 && !success && (
            <motion.div
              key="review"
              className={styles.formCard}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>{t('reviewRequest')}</h1>
                <p className={styles.cardSubtitle}>{t('confirmDetails')}</p>
              </div>
              <div className={styles.cardBody}>
                {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                <div className={styles.reviewSection}>
                  <div className={styles.reviewBlock}>
                    <div className={styles.reviewBlockHeader}>
                      <span className={styles.reviewLabel}>{t('yourDetails')}</span>
                      <button type="button" className={styles.recapEdit} onClick={() => goTo(1)}>{t('edit')}</button>
                    </div>
                    <div className={styles.reviewValue}>{formData.name}</div>
                    <div className={styles.reviewValueSub}>{formData.email}</div>
                    <div className={styles.reviewValueSub}>{formData.phone}</div>
                  </div>

                  <div className={styles.reviewBlock}>
                    <div className={styles.reviewBlockHeader}>
                      <span className={styles.reviewLabel}>{t('service')}</span>
                      <button type="button" className={styles.recapEdit} onClick={() => goTo(2)}>{t('edit')}</button>
                    </div>
                    <div className={styles.reviewValue}>
                      {selectedServiceObj?.name}{selectedServiceObj && ` — ${formatPrice(selectedServiceObj)}`}
                    </div>
                    <div className={styles.reviewValueSub}>
                      {selectedEmployeeObj ? selectedEmployeeObj.name : t('noPreference')}
                    </div>
                  </div>

                  <div className={styles.reviewBlock}>
                    <div className={styles.reviewBlockHeader}>
                      <span className={styles.reviewLabel}>{t('dateTime')}</span>
                      <button type="button" className={styles.recapEdit} onClick={() => goTo(3)}>{t('edit')}</button>
                    </div>
                    <div className={styles.reviewValue}>
                      {new Date(formData.date + 'T12:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className={styles.reviewValueSub}>{formData.time}</div>
                  </div>

                  {formData.notes && (
                    <div className={styles.reviewBlock}>
                      <div className={styles.reviewBlockHeader}>
                        <span className={styles.reviewLabel}>{t('notes')}</span>
                        <button type="button" className={styles.recapEdit} onClick={() => goTo(3)}>{t('edit')}</button>
                      </div>
                      <div className={styles.reviewValueSub}>{formData.notes}</div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit}>
                  <div className={styles.phaseNav}>
                    <button type="button" className={styles.backButton} onClick={() => goTo(3)}>
                      {t('back')}
                    </button>
                    <button type="submit" className={styles.submitButton} style={{ flex: 1 }}>
                      {t('submitRequest')}
                    </button>
                  </div>
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
