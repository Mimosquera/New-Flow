import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, FormInput } from '../components/Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { serviceService, availabilityService, appointmentService, dataService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { translateObject } from '../services/translationService.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';

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

  // Translate services when language changes
  useEffect(() => {
    const translateServices = async () => {
      if (services.length === 0) {
        setTranslatedServices([]);
        return;
      }

      if (language === 'en') {
        setTranslatedServices(services);
      } else {
        const translated = await Promise.all(
          services.map(async (service) => {
            const translatedService = await translateObject(service, ['name'], language);
            return translatedService;
          })
        );
        setTranslatedServices(translated);
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
    <div className="appointments-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(5, 45, 63) 100%)' }}>
      <div className="container py-5">
        <div className="text-center mb-4">
          <h1 className="fw-bold text-white mb-0">{t('bookAppointment')}</h1>
        </div>
        
        <div className="row justify-content-center">
          {/* Booking Form */}
          <div className="col-11 col-sm-10 col-md-8 col-lg-6 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body p-3 p-md-4">
                <h5 className="card-title mb-4">{t('appointmentDetails')}</h5>
                
                {success && (
                  <Alert 
                    message={success} 
                    type="success"
                    onClose={() => setSuccess(null)}
                  />
                )}
                
                {error && (
                  <Alert 
                    message={error} 
                    type="danger"
                    onClose={() => setError(null)}
                  />
                )}

                <form onSubmit={handleSubmit}>
                  <FormInput
                    label={`${t('name')} *`}
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autocomplete="name"
                  />

                  <FormInput
                    label={`${t('email')} *`}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autocomplete="email"
                  />

                  <FormInput
                    label={`${t('phone')} *`}
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    autocomplete="tel"
                  />

                  <div className="mb-3">
                    <label htmlFor="service" className="form-label">{t('service')} *</label>
                    <select
                      id="service"
                      name="service"
                      className="form-select"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                    >
                      <option value="">{t('selectService')}</option>
                      {translatedServices.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - ${parseFloat(s.price).toFixed(2)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="employee" className="form-label">{t('barberStylist')}</label>
                    <select
                      id="employee"
                      name="employee"
                      className="form-select"
                      value={formData.employee}
                      onChange={handleChange}
                      autoComplete="off"
                    >
                      <option value="">{t('noPreference')}</option>
                      {employees.filter(emp => emp.name !== 'Admin').map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                    <small className="text-muted">
                      {t('noPreferenceNote')}
                    </small>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="date" className="form-label">{t('date')} *</label>
                        <input
                          id="date"
                          type="date"
                          name="date"
                          className="form-control"
                          value={formData.date}
                          onChange={handleChange}
                          min={today}
                          required
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="time" className="form-label">{t('time')} *</label>
                        <select
                          id="time"
                          name="time"
                          className="form-select"
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
                          <small className="text-muted d-block mt-1">
                            {t('noAvailabilityForDate')}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">{t('notes')}</label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows="2"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder={t('notesPlaceholder')}
                      autoComplete="off"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-lg w-100"
                    style={{ backgroundColor: 'rgb(5, 45, 63)', color: 'white', border: 'none', fontWeight: '300' }}
                  >
                    {t('submitRequest')}
                  </button>
                </form>
              </div>
            </div>
            
            <div className="text-center mt-3">
              <div className="d-flex justify-content-center align-items-center gap-2">
                <button 
                  className="btn btn-sm"
                  style={{ backgroundColor: 'white', color: 'rgb(5, 45, 63)', border: '1px solid rgb(5, 45, 63)' }}
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                  }}
                >
                  ⌂ {t('backToHome')}
                </button>
                <LanguageToggle inverse />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center" style={{ marginTop: '4rem', paddingTop: '3rem', paddingBottom: '2rem' }}>
          <img 
            src={new URL('../assets/images/full-logo-transparent-nobuffer.png', import.meta.url).href}
            alt="New Flow Logo"
            style={{ maxWidth: '300px', width: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
};
