import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, FormInput } from './Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { serviceService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { useTranslateItems } from '../hooks/useTranslateItems.js';

const THEME_COLOR = 'rgb(5, 45, 63)';

export const ServiceManager = () => {
  const { t, language } = useTranslation();
  const [services, setServices] = useState([]);
  const [translatedServices] = useTranslateItems(services, ['name', 'description'], language);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [isPriceRange, setIsPriceRange] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await serviceService.getAll();
      setServices(response?.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const { formData, setFormData, handleChange, handleSubmit: handleFormSubmit, error, setError, resetForm } = useForm(
    {
      name: '',
      description: '',
      price: '',
      price_max: ''
    },
    async (data) => {
      try {
        // Validate required fields
        if (!data.name || !data.description || !data.price) {
          throw new Error(t('pleaseFillRequired'));
        }

        // Validate price is a valid number
        const priceNum = parseFloat(data.price);
        if (isNaN(priceNum) || priceNum < 0) {
          throw new Error(t('invalidPrice'));
        }

        // Validate price_max if provided
        if (data.price_max) {
          const priceMaxNum = parseFloat(data.price_max);
          if (isNaN(priceMaxNum) || priceMaxNum < 0) {
            throw new Error(t('invalidMaxPrice') || 'Invalid maximum price value');
          }
          if (priceMaxNum <= priceNum) {
            throw new Error(t('maxPriceMustBeGreater') || 'Maximum price must be greater than minimum price');
          }
        }

        if (editingService) {
          // Update existing service
          if (!editingService.id) {
            throw new Error(t('serviceIdMissing'));
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
        setIsPriceRange(false);
      } catch (err) {
        console.error('Error saving service:', err);
        throw err; // Re-throw to be handled by useForm
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(null);
    handleFormSubmit(e);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setShowForm(true);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      price_max: service.price_max || '',
    });
    setIsPriceRange(!!service.price_max);
    setSuccess(null);
    setTimeout(() => {
      if (formRef.current && window.innerWidth < 992) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    resetForm();
    setIsPriceRange(false);
    setSuccess(null);
  };

  const handlePriceRangeToggle = (e) => {
    setIsPriceRange(e.target.checked);
    if (!e.target.checked) {
      setFormData(prev => ({ ...prev, price_max: '' }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteService') || 'Are you sure you want to delete this service?')) return;
    try {
      await serviceService.delete(id);
      setServices(services.filter(s => s.id !== id));
      setSuccess(t('serviceDeleted') || 'Service deleted successfully!');
    } catch (error) {
      const msg = error?.response?.data?.message || t('deleteServiceFailed') || 'Failed to delete service';
      alert(msg);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatPriceDisplay = (price, priceMax) => {
    if (priceMax && priceMax !== '' && priceMax !== null) {
      return `$${formatPrice(price)} - $${formatPrice(priceMax)}`;
    }
    return `$${formatPrice(price)}`;
  };

  return (
    <div className="service-manager">
      <div className="container py-4">
        <div className="row">
          {/* Service Form */}
          <div className="col-lg-4 mb-4" ref={formRef}>
            <div className="card post-update-card shadow-sm border-0">
              <div
                className="card-header d-flex justify-content-between align-items-center collapsible-header"
                style={{
                  backgroundColor: THEME_COLOR,
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.75rem 1rem'
                }}
                onClick={() => setShowForm(!showForm)}
              >
                <h5 className="mb-0" style={{ fontSize: '1rem' }}>
                  {editingService ? t('editService') : t('addService')}
                </h5>
                <span className="d-lg-none" style={{ fontSize: '1.2rem' }}>
                  {showForm ? '\u2212' : '+'}
                </span>
              </div>
              <div className={`d-lg-block ${showForm ? 'd-block' : 'd-none'}`}>
              <div className="card-body p-4">

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
                    onClose={() => setError('')}
                  />
                )}

                <form onSubmit={handleSubmit} noValidate>
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
                    <label htmlFor="price" className="form-label">
                      {isPriceRange ? (t('minPrice') || 'Minimum Price') : t('price')}
                    </label>
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
                        placeholder={isPriceRange ? (t('minPricePlaceholder') || '20.00') : t('pricePlaceholder')}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        id="priceRangeCheckbox"
                        type="checkbox"
                        className="form-check-input"
                        checked={isPriceRange}
                        onChange={handlePriceRangeToggle}
                        style={{ cursor: 'pointer' }}
                      />
                      <label
                        htmlFor="priceRangeCheckbox"
                        className="form-check-label"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        {t('usePriceRange') || 'Use price range'}
                      </label>
                    </div>
                  </div>

                  {isPriceRange && (
                    <div className="mb-3">
                      <label htmlFor="price_max" className="form-label">
                        {t('maxPrice') || 'Maximum Price'}
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          id="price_max"
                          name="price_max"
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={formData.price_max}
                          onChange={handleChange}
                          placeholder={t('maxPricePlaceholder') || '40.00'}
                          required={isPriceRange}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  )}

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
                            <td>{formatPriceDisplay(service?.price, service?.price_max)}</td>
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
