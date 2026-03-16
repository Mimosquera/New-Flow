import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Scissors, Users, User, Mail, Phone,
  CalendarDays, Clock, StickyNote, CheckCircle2,
} from 'lucide-react';
import { Alert } from '../../components/common/index.jsx';
import { useForm } from '../../hooks/useForm.js';
import { serviceService, availabilityService, appointmentService, dataService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { useTranslateItems } from '../../hooks/useTranslateItems.js';
import { ScrollToTop } from '../../components/ScrollToTop.jsx';
import { LanguageToggle } from '../../components/LanguageToggle.jsx';
import { ReviewsCarousel } from '../../components/ReviewsCarousel.jsx';
import styles from '../../styles/pages/BookingPage.module.css';
import { hapticSuccess, hapticWarning, hapticLight } from '../../utils/haptics.js';

const slideVariants = {
  enterForward:  { opacity: 0, x: 32 },
  enterBack:     { opacity: 0, x: -32 },
  center:        { opacity: 1, x: 0 },
  exitForward:   { opacity: 0, x: -32, scale: 0.97 },
  exitBack:      { opacity: 0, x: 32, scale: 0.97 },
};

const StepProgress = ({ current }) => (
  <div className={styles.stepProgress}>
    {[1, 2, 3].map((s, i) => (
      <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
        {i > 0 && (
          <div className={`${styles.stepLine} ${current > i ? styles.stepLineActive : ''}`} />
        )}
        <div className={`${styles.stepDot} ${current >= s ? styles.stepDotActive : ''}`} />
      </div>
    ))}
  </div>
);

StepProgress.propTypes = { current: PropTypes.number.isRequired };

export const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();

  const [phase, setPhase] = useState(1);
  const [direction, setDirection] = useState('forward');
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
          dataService.getEmployees(),
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
      notes: '',
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

  const goTo = (nextPhase) => {
    hapticLight();
    setDirection(nextPhase > phase ? 'forward' : 'back');
    setPhase(nextPhase);
  };

  const today = new Date().toISOString().split('T')[0];
  const phase1Complete = !!formData.service;
  const phase2Complete = formData.name.trim() && formData.email.trim() && formData.phone.trim();
  const phase3Complete = formData.date && formData.time;

  const selectedServiceObj = translatedServices.find(s => String(s.id) === String(formData.service));
  const selectedEmployeeObj = employees.find(e => String(e.id) === String(formData.employee));

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day).toLocaleDateString(
      language === 'es' ? 'es-ES' : 'en-US',
      { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  const cardMotion = {
    className: styles.formCard,
    initial: direction === 'forward' ? slideVariants.enterForward : slideVariants.enterBack,
    animate: slideVariants.center,
    exit: direction === 'forward' ? slideVariants.exitForward : slideVariants.exitBack,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <AnimatePresence mode="wait">
            {/* Phase 1 — Appointment Details */}
            {phase === 1 && !success && (
              <motion.div key="phase1" {...cardMotion}>
                <div className={styles.cardHeader}>
                  <h1 className={styles.cardTitle}>{t('appointmentDetails')}</h1>
                  <p className={styles.cardSubtitle}>{t('stepService')}</p>
                  <StepProgress current={1} />
                </div>
                <div className={styles.cardBody}>
                  {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                  <div className={styles.formGroup}>
                    <label htmlFor="service" className={styles.formLabel}>
                      <Scissors size={12} />
                      {t('service')}<span className={styles.required}>*</span>
                    </label>
                    <select
                      id="service" name="service"
                      className={styles.formSelect}
                      value={formData.service}
                      onChange={handleChange}
                      autoComplete="off"
                    >
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
                    <label htmlFor="employee" className={styles.formLabel}>
                      <Users size={12} />
                      {t('barberStylist')}
                    </label>
                    <select
                      id="employee" name="employee"
                      className={styles.formSelect}
                      value={formData.employee}
                      onChange={handleChange}
                      autoComplete="off"
                    >
                      <option value="">{t('noPreference')}</option>
                      {employees.filter(emp => emp.name !== 'Admin').map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                    <small className={styles.helpText}>{t('noPreferenceNote')}</small>
                  </div>

                  <button
                    type="button"
                    className={styles.submitButton}
                    disabled={!phase1Complete}
                    onClick={() => goTo(2)}
                  >
                    {t('continueBtn')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Phase 2 — Customer Details */}
            {phase === 2 && !success && (
              <motion.div key="phase2" {...cardMotion}>
                <div className={styles.cardHeader}>
                  <h1 className={styles.cardTitle}>{t('yourDetails')}</h1>
                  <p className={styles.cardSubtitle}>{t('stepCustomer')}</p>
                  <StepProgress current={2} />
                </div>
                <div className={styles.cardBody}>
                  {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.formLabel}>
                      <User size={12} />
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
                      <Mail size={12} />
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
                      <Phone size={12} />
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
                    disabled={!phase2Complete}
                    onClick={() => goTo(3)}
                  >
                    {t('continueBtn')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Phase 3 — Date & Time */}
            {phase === 3 && !success && (
              <motion.div key="phase3" {...cardMotion}>
                <div className={styles.cardHeader}>
                  <h1 className={styles.cardTitle}>{t('dateTimeTitle')}</h1>
                  <p className={styles.cardSubtitle}>{t('stepDateTime')}</p>
                  <StepProgress current={3} />
                </div>
                <div className={styles.cardBody}>
                  {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                  <div className={styles.formGroup}>
                    <div className={styles.dateTimeRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="date" className={styles.formLabel}>
                          <CalendarDays size={12} />
                          {t('date')}<span className={styles.required}>*</span>
                        </label>
                        <input
                          id="date" type="date" name="date"
                          className={styles.formControl}
                          value={formData.date}
                          onChange={handleChange}
                          min={today}
                          autoComplete="off"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="time" className={styles.formLabel}>
                          <Clock size={12} />
                          {t('time')}<span className={styles.required}>*</span>
                        </label>
                        <select
                          id="time" name="time"
                          className={`${styles.formSelect} ${loadingTimes ? styles.loadingSelect : ''}`}
                          value={formData.time}
                          onChange={handleChange}
                          disabled={!formData.date || loadingTimes}
                          autoComplete="off"
                        >
                          <option value="">
                            {!formData.date
                              ? t('selectDateFirst')
                              : loadingTimes
                                ? t('loading')
                                : availableTimes.length === 0
                                  ? t('noTimesAvailable')
                                  : t('selectTime')}
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
                    <label htmlFor="notes" className={styles.formLabel}>
                      <StickyNote size={12} />
                      {t('notes')}
                    </label>
                    <textarea
                      id="notes" name="notes"
                      className={`${styles.formControl} ${styles.textarea}`}
                      rows="2"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder={t('notesPlaceholder')}
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="button"
                    className={styles.submitButton}
                    disabled={!phase3Complete}
                    onClick={() => goTo(4)}
                  >
                    {t('continueBtn')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Phase 4 — Review */}
            {phase === 4 && !success && (
              <motion.div key="phase4" {...cardMotion}>
                <div className={styles.cardHeader}>
                  <h1 className={styles.cardTitle}>{t('reviewTitle')}</h1>
                  <p className={styles.cardSubtitle}>{t('reviewSubtitle')}</p>
                </div>
                <div className={styles.cardBody}>
                  {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                  {/* Service & Barber */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>
                        <Scissors size={11} />
                        {t('appointmentDetails')}
                      </span>
                      <button type="button" className={styles.reviewEdit} onClick={() => goTo(1)}>
                        {t('edit')}
                      </button>
                    </div>
                    <div className={styles.reviewRows}>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>{t('service')}</span>
                        <span className={styles.reviewValue}>
                          {selectedServiceObj
                            ? `${selectedServiceObj.name} — ${selectedServiceObj.price_max
                                ? `$${parseFloat(selectedServiceObj.price).toFixed(2)}–$${parseFloat(selectedServiceObj.price_max).toFixed(2)}`
                                : `$${parseFloat(selectedServiceObj.price).toFixed(2)}`}`
                            : '—'}
                        </span>
                      </div>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>{t('barberStylist')}</span>
                        <span className={selectedEmployeeObj ? styles.reviewValue : styles.reviewValueMuted}>
                          {selectedEmployeeObj ? selectedEmployeeObj.name : t('noPreference')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>
                        <User size={11} />
                        {t('yourDetails')}
                      </span>
                      <button type="button" className={styles.reviewEdit} onClick={() => goTo(2)}>
                        {t('edit')}
                      </button>
                    </div>
                    <div className={styles.reviewRows}>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>{t('name')}</span>
                        <span className={styles.reviewValue}>{formData.name}</span>
                      </div>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>{t('email')}</span>
                        <span className={styles.reviewValue}>{formData.email}</span>
                      </div>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>{t('phone')}</span>
                        <span className={styles.reviewValue}>{formData.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewSectionHeader}>
                      <span className={styles.reviewSectionTitle}>
                        <CalendarDays size={11} />
                        {t('dateTimeTitle')}
                      </span>
                      <button type="button" className={styles.reviewEdit} onClick={() => goTo(3)}>
                        {t('edit')}
                      </button>
                    </div>
                    <div className={styles.reviewRows}>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>{t('date')}</span>
                        <span className={styles.reviewValue}>{formatDate(formData.date)}</span>
                      </div>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>{t('time')}</span>
                        <span className={styles.reviewValue}>{formData.time}</span>
                      </div>
                      {formData.notes && (
                        <div className={styles.reviewRow}>
                          <span className={styles.reviewLabel}>{t('notes')}</span>
                          <span className={styles.reviewValue}>{formData.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" className={styles.submitButton}>
                    <CheckCircle2 size={15} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                    {t('confirmRequest')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Success */}
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
                  <button
                    type="button"
                    className={styles.submitButton}
                    onClick={() => { hapticLight(); navigate('/'); }}
                  >
                    {t('backToHome')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        <div className={styles.bottomGroup}>
          {phase > 1 && !success && (
            <button
              type="button"
              className={styles.backLink}
              onClick={() => goTo(phase - 1)}
            >
              ← {t('edit')}
            </button>
          )}
          <ReviewsCarousel mini />
        </div>
        <div className={styles.pageFooter}>
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

      <ScrollToTop />
    </div>
  );
};
