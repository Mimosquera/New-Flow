/**
 * ServiceManager Component Module
 * Manages salon services CRUD operations (Create, Read, Update, Delete)
 * 
 * Features:
 * - Add/Edit/Delete services
 * - Price formatting with currency display
 * - Auto-translation for Spanish language
 * - Form validation
 * - Responsive design with mobile-optimized form scrolling
 * - Edit mode with cancel functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, FormInput } from './Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { serviceService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { translateObject } from '../services/translationService.js';

// Constants
const MOBILE_BREAKPOINT = 992;
const THEME_COLOR = 'rgb(5, 45, 63)';
const SCROLL_DELAY_MS = 100;
const DEFAULT_PRICE_PRECISION = 2;

/**
 * Service Management Component for Employees
 * Provides interface for managing salon services
 */
export const ServiceManager = () => {
  const { t, language } = useTranslation();
  
  // State management
  const [services, setServices] = useState([]);
  const [translatedServices, setTranslatedServices] = useState([]);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const formRef = useRef(null);

  /**
   * Fetch all services from API
   */
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await serviceService.getAll();
      const serviceData = response?.data || [];
      setServices(serviceData);
      setTranslatedServices(serviceData); // Initially use original data
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
      setTranslatedServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize component - fetch services
   */
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  /**
   * Auto-translate services when language changes
   */
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
      try {
        if (services.length === 0) {
          setTranslatedServices([]);
          return;
        }
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
  }, [language, services]);

  /**
   * Form handling with validation
   */
  const { formData, setFormData, handleChange, handleSubmit: handleFormSubmit, error, resetForm } = useForm(
    {
      name: '',
      description: '',
      price: ''
    },
    async (data) => {
      try {
        // Validate required fields
        if (!data.name || !data.description || !data.price) {
          throw new Error(t('fillAllFields') || 'Please fill in all fields');
        }

        // Validate price is a valid number
        const priceNum = parseFloat(data.price);
        if (isNaN(priceNum) || priceNum < 0) {
          throw new Error(t('invalidPrice') || 'Invalid price value');
        }

        if (editingService) {
          // Update existing service
          if (!editingService.id) {
            throw new Error('Service ID is missing');
          }

          const response = await serviceService.update(editingService.id, data);
          setServices(services.map(s => s.id === editingService.id ? response.data : s));
          setSuccess(t('serviceUpdated') || 'Service updated successfully!');
          setEditingService(null);
        } else {
          // Create new service
          const response = await serviceService.create(data);
          setServices([...services, response.data]);
          setSuccess(t('serviceAdded') || 'Service created successfully!');
        }
        
        resetForm();
      } catch (err) {
        console.error('Error saving service:', err);
        throw err; // Re-throw to be handled by useForm
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

      setSuccess(null);
      handleFormSubmit(e);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  }, [handleFormSubmit]);

  /**
   * Enter edit mode for a service
   * @param {Object} service - Service to edit
   */
  const handleEdit = useCallback((service) => {
    try {
      if (!service || !service.id) {
        console.error('Invalid service object for editing');
        return;
      }

      setEditingService(service);
      setFormData({
        name: service.name || '',
        description: service.description || '',
        price: service.price || '',
      });
      setSuccess(null);
      
      // Scroll to form on mobile for better UX
      setTimeout(() => {
        if (formRef.current && window.innerWidth < MOBILE_BREAKPOINT) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, SCROLL_DELAY_MS);
    } catch (error) {
      console.error('Error entering edit mode:', error);
    }
  }, [setFormData]);

  /**
   * Cancel edit mode and reset form
   */
  const handleCancelEdit = useCallback(() => {
    try {
      setEditingService(null);
      resetForm();
      setSuccess(null);
    } catch (error) {
      console.error('Error canceling edit:', error);
    }
  }, [resetForm]);

  /**
   * Delete a service with confirmation
   * @param {string} id - Service ID to delete
   */
  const handleDelete = useCallback(async (id) => {
    try {
      if (!id) {
        console.error('No ID provided for deletion');
        return;
      }

      const confirmMessage = t('confirmDeleteService') || 'Are you sure you want to delete this service?';
      if (!window.confirm(confirmMessage)) {
        return;
      }

      await serviceService.delete(id);
      setServices(services.filter(s => s.id !== id));
      setSuccess(t('serviceDeleted') || 'Service deleted successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      let errorMessage = t('deleteServiceFailed') || 'Failed to delete service';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      alert(errorMessage);
    }
  }, [services, t]);

  /**
   * Format price for display
   * @param {string|number} price - Price value
   * @returns {string} Formatted price
   */
  const formatPrice = useCallback((price) => {
    try {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum)) {
        return '0.00';
      }
      return priceNum.toFixed(DEFAULT_PRICE_PRECISION);
    } catch (error) {
      console.error('Error formatting price:', error);
      return '0.00';
    }
  }, []);

  return (
    <div className="service-manager">
      <div className="container py-4">
        <div className="row">
          {/* Service Form */}
          <div className="col-lg-4 mb-4" ref={formRef}>
            <div className="card post-update-card shadow-sm border-0">
              <div className="card-body p-4">
                <h5 className="card-title mb-4 force-black-title">
                  {editingService ? t('editService') : t('addService')}
                </h5>

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
                    onClose={() => {}}
                  />
                )}

                <form onSubmit={handleSubmit}>
                  <FormInput
                    label={t('serviceName')}
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('serviceNamePlaceholder')}
                    required
                    autocomplete="off"
                  />

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">{t('description')}</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder={t('descriptionPlaceholder')}
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="price" className="form-label">{t('price')}</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder={t('pricePlaceholder')}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      type="submit" 
                      className="btn btn-lg flex-fill post-update-btn"
                    >
                      {editingService ? t('updateService') : t('addService')}
                    </button>
                    {editingService && (
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={handleCancelEdit}
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="col-lg-8">
            <div className="card post-update-card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title mb-4" style={{ color: '#fff' }}>{t('currentServices')}</h5>
                {loading ? (
                  <p className="text-muted">{t('loading')}</p>
                ) : services.length === 0 ? (
                  <p className="text-muted">{t('noServices')}</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover current-services-table">
                      <thead>
                        <tr>
                          <th>{t('name')}</th>
                          <th className="d-none d-md-table-cell">{t('description')}</th>
                          <th>{t('price')}</th>
                          <th style={{ minWidth: '130px' }}>{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {translatedServices.map(service => (
                          <tr key={service?.id || `service-${Date.now()}`}>
                            <td className="fw-bold">{service?.name || 'N/A'}</td>
                            <td className="d-none d-md-table-cell">{service?.description || 'N/A'}</td>
                            <td>${formatPrice(service?.price)}</td>
                            <td>
                              <div className="btn-group btn-group-sm" style={{ whiteSpace: 'nowrap' }}>
                                <button
                                  className="btn btn-outline-primary"
                                  style={{ color: '#fff', background: THEME_COLOR, borderColor: THEME_COLOR, fontWeight: 600, position: 'relative', zIndex: 1 }}
                                  onClick={() => handleEdit(service)}
                                  disabled={!service?.id}
                                >
                                  {t('edit')}
                                </button>
                                <span style={{ display: 'inline-block', width: '1px', height: '24px', background: '#b0bec5', margin: '0 0.5rem', verticalAlign: 'middle' }}></span>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDelete(service?.id)}
                                  disabled={!service?.id}
                                >
                                  {t('delete')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
