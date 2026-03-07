import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert } from '../components/Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { serviceService, availabilityService, appointmentService, dataService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { useTranslateItems } from '../hooks/useTranslateItems.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import { ScrollToTop } from '../components/ScrollToTop.jsx';
import styles from './AppointmentsPage.module.css';
import { hapticSuccess, hapticWarning } from '../utils/haptics.js';

export const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();

  // State
  const [success, setSuccess] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const [translatedServices] = useTranslateItems(services, ['name', 'description'], language);

  // Get pre-selected service from navigation state (if coming from homepage)
  const selectedService = location.state?.selectedService;

  useEffect(() => {
    window.scrollTo(0, 0);
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

  // Form handling with pre-selected service (if applicable)
  const { formData, handleChange: originalHandleChange, handleSubmit: handleFormSubmit, error, setError } = useForm(
    {
      name: '',
      email: '',
      phone: '',
      service: selectedService?.id || '',
      employee: '', // empty = no preference/any
      date: '',
      time: '',
      notes: ''
    },
    async (data) => {
      // Validate required fields
      if (!data.name || !data.email || !data.phone || !data.service || !data.date || !data.time) {
        hapticWarning();
        throw new Error(t('pleaseFillRequired'));
      }

      // Validate that selected time is available
      if (!availableTimes.includes(data.time)) {
        hapticWarning();
        throw new Error(t('timeNotAvailable'));
      }

      // Convert 12-hour time to 24-hour format for database
      const time24hr = convertTo24Hour(data.time);

      // Create appointment request
      await appointmentService.create({
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        serviceId: parseInt(data.service),
        employeeId: data.employee || null, // null = no preference
        date: data.date,
        time: time24hr,
        customerNotes: data.notes || null,
      });

      // Show success message
      hapticSuccess();
      setSuccess(t('appointmentRequested'));
      
      // Scroll to top so user can see the success modal
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours}:${minutes}:00`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(null);
    handleFormSubmit(e);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Form Card */}
        <div className={styles.formCard}>
          {/* Card Header */}
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>{t('bookAppointment')}</h1>
            <p className={styles.cardSubtitle}>{t('appointmentDetails')}</p>
          </div>

          <div className={styles.cardBody}>
            {success && (
              <div className={styles.successMessage}>
                {success}
              </div>
            )}

            {error && (
              <Alert
                message={error}
                type="danger"
                onClose={() => setError(null)}
              />
            )}

            <form onSubmit={handleSubmit}>
              {/* Name and Email Row */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>
                    {t('name')}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={styles.formControl}
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    placeholder={t('name')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    {t('email')}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={styles.formControl}
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder={t('email')}
                  />
                </div>
              </div>

              {/* Phone and Service Row */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.formLabel}>
                    {t('phone')}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={styles.formControl}
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder={t('phone')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="service" className={styles.formLabel}>
                    {t('service')}
                    <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="service"
                    name="service"
                    className={styles.formSelect}
                    value={formData.service}
                    onChange={handleChange}
                    autoComplete="off"
                  >
                    <option value="">{t('selectService')}</option>
                    {translatedServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.price_max
                          ? `$${parseFloat(s.price).toFixed(2)} - $${parseFloat(s.price_max).toFixed(2)}`
                          : `$${parseFloat(s.price).toFixed(2)}`
                        }
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employee */}
              <div className={styles.formGroup}>
                <label htmlFor="employee" className={styles.formLabel}>
                  {t('barberStylist')}
                </label>
                <select
                  id="employee"
                  name="employee"
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
                <small className={styles.helpText}>
                  {t('noPreferenceNote')}
                </small>
              </div>

              {/* Date and Time Row */}
              <div className={styles.formGroup}>
                <div className={styles.dateTimeRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="date" className={styles.formLabel}>
                      {t('date')}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="date"
                      type="date"
                      name="date"
                      className={styles.formControl}
                      value={formData.date}
                      onChange={handleChange}
                      min={today}
                      autoComplete="off"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="time" className={styles.formLabel}>
                      {t('time')}
                      <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="time"
                      name="time"
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
                  <small className={styles.alertInfo}>
                    {t('noAvailabilityForDate')}
                  </small>
                )}
              </div>

              {/* Notes */}
              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.formLabel}>
                  {t('notes')}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className={`${styles.formControl} ${styles.textarea}`}
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t('notesPlaceholder')}
                  autoComplete="off"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitButton}
              >
                {t('submitRequest')}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <div className={styles.actionButtons}>
            <button
              className={styles.backButton}
              onClick={() => {
                navigate('/');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
              }}
            >
              <span>⌂</span>
              {t('backToHome')}
            </button>
            <LanguageToggle inverse />
          </div>
        </div>

        {/* Logo */}
        <div className={styles.logoContainer}>
          <img
            src={new URL('../assets/images/full-logo-transparent-nobuffer.png', import.meta.url).href}
            alt="New Flow Logo"
            className={styles.logo}
          />
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};
