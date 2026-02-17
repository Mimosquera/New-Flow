import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, FormInput } from '../components/Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { serviceService, availabilityService, appointmentService, dataService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { translateObject } from '../services/translationService.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import styles from './AppointmentsPage.module.css';

/**
 * Appointments Page
 */
export const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();

  // State
  const [success, setSuccess] = useState(null);
  const [services, setServices] = useState([]);
  const [translatedServices, setTranslatedServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // Get pre-selected service from navigation state (if coming from homepage)
  const selectedService = location.state?.selectedService;

  // Fetch services and employees on mount
  useEffect(() => {
    window.scrollTo(0, 0);

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY <= 50) {
        document.body.style.background = '#000000';
      } else {
        document.body.style.background = 'rgb(5, 42, 58)';
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.background = 'rgb(3, 35, 50)';
    };
  }, []);

  // Translate services when language changes
  useEffect(() => {
    // Simple language detection (checks for Spanish characters/words)
    const detectLang = (text) => {
      if (!text) return 'en';
      const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'los', 'del', 'se', 'por', 'un', 'una', 'con', 'para', 'es', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'esos', 'esas', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'esté', 'estés', 'estemos', 'estéis', 'estén', 'estaré', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos', 'estaríais', 'estarían', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron', 'estuviera', 'estuvieras', 'estuviéramos', 'estuvierais', 'estuvieran', 'estuviese', 'estuvieses', 'estuviésemos', 'estuvieseis', 'estuviesen', 'estando', 'estado', 'estada', 'estados', 'estadas', 'estad'];
      const lower = text.toLowerCase();
      let score = 0;
      spanishWords.forEach(word => {
        if (lower.includes(word)) score++;
      });
      if (/[áéíóúñü¿¡]/.test(lower)) score += 2;
      return score > 2 ? 'es' : 'en';
    };

    const translateServices = async () => {
      if (services.length === 0) {
        setTranslatedServices([]);
        return;
      }
      try {
        const translated = await Promise.all(
          services.map(service => {
            const sourceLang = service.language || detectLang((service.name || '') + ' ' + (service.description || ''));
            const targetLang = language === 'es' ? 'es' : 'en';
            if (sourceLang !== targetLang) {
              return translateObject(service, ['name', 'description'], targetLang, sourceLang);
            } else {
              return Promise.resolve(service);
            }
          })
        );
        setTranslatedServices(await Promise.all(translated));
      } catch (error) {
        console.error('Error translating services:', error);
        setTranslatedServices(services);
      }
    };
    translateServices();
  }, [services, language]);

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
        throw new Error(t('pleaseFillRequired'));
      }

      // Validate that selected time is available
      if (!availableTimes.includes(data.time)) {
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
      setSuccess(t('appointmentRequested'));
      
      // Scroll to top so user can see the success modal
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  );

  // Custom handle change to fetch availability when date or employee changes
  const handleChange = async (e) => {
    originalHandleChange(e);
    
    const { name, value } = e.target;
    
    if (name === 'date') {
      const selectedDate = value;
      if (selectedDate) {
        await fetchAvailabilityForDate(selectedDate, formData.employee);
      } else {
        setAvailableTimes([]);
      }
    } else if (name === 'employee') {
      // If date is already selected, refetch availability for the new employee
      if (formData.date) {
        await fetchAvailabilityForDate(formData.date, value);
      }
    }
  };

  // Fetch available times for a specific date, considering accepted appointments
  const fetchAvailabilityForDate = async (date, employeeId = '') => {
    try {
      setLoadingTimes(true);
      const response = await availabilityService.getAvailableTimes(date, employeeId || null);
      
      const timeSlots = response.data.data || [];
      
      // Convert 24-hour format to 12-hour format for display
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

  // Convert 12-hour time format to 24-hour format
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

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(null);
    handleFormSubmit(e);
  };

  // Get minimum date (today) for date picker
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>{t('bookAppointment')}</h1>
          <p className={styles.subtitle}>{t('appointmentDetails')}</p>
        </div>

        {/* Form Card */}
        <div className={styles.formCard}>
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
                    <span className={styles.labelIcon}>👤</span>
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
                    required
                    autoComplete="name"
                    placeholder={t('name')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    <span className={styles.labelIcon}>✉️</span>
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
                    required
                    autoComplete="email"
                    placeholder={t('email')}
                  />
                </div>
              </div>

              {/* Phone and Service Row */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.formLabel}>
                    <span className={styles.labelIcon}>📱</span>
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
                    required
                    autoComplete="tel"
                    placeholder={t('phone')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="service" className={styles.formLabel}>
                    <span className={styles.labelIcon}>✂️</span>
                    {t('service')}
                    <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="service"
                    name="service"
                    className={styles.formSelect}
                    value={formData.service}
                    onChange={handleChange}
                    required
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
                  <span className={styles.labelIcon}>💈</span>
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
              <div className={styles.dateTimeRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="date" className={styles.formLabel}>
                    <span className={styles.labelIcon}>📅</span>
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
                    required
                    autoComplete="off"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="time" className={styles.formLabel}>
                    <span className={styles.labelIcon}>🕐</span>
                    {t('time')}
                    <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="time"
                    name="time"
                    className={`${styles.formSelect} ${loadingTimes ? styles.loadingSelect : ''}`}
                    value={formData.time}
                    onChange={handleChange}
                    required
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
                  {formData.date && !loadingTimes && availableTimes.length === 0 && (
                    <small className={styles.alertInfo}>
                      {t('noAvailabilityForDate')}
                    </small>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.formLabel}>
                  <span className={styles.labelIcon}>📝</span>
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
    </div>
  );
};
