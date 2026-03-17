import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Scissors, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, FormInput } from '../../components/Common/index.jsx';
import { useForm } from '../../hooks/useForm.js';
import { serviceService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { useTranslateItems } from '../../hooks/useTranslateItems.js';
import { hapticSuccess, hapticWarning } from '../../utils/haptics.js';

const THEME_COLOR = 'rgb(5, 60, 82)';

export const ServiceManager = () => {
  const { t, language } = useTranslation();
  const [services, setServices] = useState([]);
  const [translatedServices] = useTranslateItems(services, ['name', 'description'], language);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [isPriceRange, setIsPriceRange] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
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

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { formData, setFormData, handleChange, handleSubmit: handleFormSubmit, error, setError, resetForm } = useForm(
    {
      name: '',
      description: '',
      price: '',
      price_max: ''
    },
    async (data) => {
      try {
        if (!data.name || !data.description || !data.price) {
          throw new Error(t('pleaseFillRequired'));
        }

        const priceNum = parseFloat(data.price);
        if (isNaN(priceNum) || priceNum < 0) {
          throw new Error(t('invalidPrice'));
        }

        if (data.price_max) {
          const priceMaxNum = parseFloat(data.price_max);
          if (isNaN(priceMaxNum) || priceMaxNum < 0) {
            throw new Error(t('invalidMaxPrice'));
          }
          if (priceMaxNum <= priceNum) {
            throw new Error(t('maxPriceMustBeGreater'));
          }
        }

        if (editingService) {
          if (!editingService.id) {
            throw new Error(t('serviceIdMissing'));
          }

          const response = await serviceService.update(editingService.id, data);
          setServices(services.map(s => s.id === editingService.id ? response.data : s));
          hapticSuccess();
          setSuccess(t('serviceUpdated'));
          setEditingService(null);
        } else {
          const response = await serviceService.create(data);
          setServices([...services, response.data]);
          hapticSuccess();
          setSuccess(t('serviceAdded'));
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
    if (!window.confirm(t('confirmDeleteService'))) return;
    try {
      await serviceService.delete(id);
      setServices(services.filter(s => s.id !== id));
      hapticSuccess();
      setSuccess(t('serviceDeleted'));
    } catch (error) {
      hapticWarning();
      const msg = error?.response?.data?.message || t('deleteServiceFailed');
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
                  background: 'rgba(3, 25, 38, 0.45)',
                  borderBottom: '1px solid rgba(70,161,161,0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.75rem 1rem',
                  borderRadius: (isDesktop || showForm) ? '0.75rem 0.75rem 0 0' : '0.75rem',
                }}
                onClick={() => setShowForm(!showForm)}
              >
                <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
                  {editingService ? <Pencil size={15} /> : <Plus size={15} />}
                  {editingService ? t('editService') : t('addService')}
                </h5>
                <span className="d-lg-none">
                  {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>
              <AnimatePresence initial={false}>
                {(isDesktop || showForm) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
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
                      {isPriceRange ? t('minPrice') : t('price')}
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
                        placeholder={isPriceRange ? t('minPricePlaceholder') : t('pricePlaceholder')}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        id="priceRangeCheckbox"
                        name="priceRangeCheckbox"
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
                        {t('usePriceRange')}
                      </label>
                    </div>
                  </div>

                  {isPriceRange && (
                    <div className="mb-3">
                      <label htmlFor="price_max" className="form-label">
                        {t('maxPrice')}
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
                          placeholder={t('maxPricePlaceholder')}
                          required={isPriceRange}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      type="submit"
                      className="btn post-update-btn"
                    >
                      {editingService ? t('updateService') : t('addService')}
                    </button>
                    {editingService && (
                      <button
                        type="button"
                        className="btn"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontWeight: '500', fontSize: '0.88rem' }}
                        onClick={handleCancelEdit}
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </form>
              </div>
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Services List */}
          <div className="col-lg-8">
            <div className="card post-update-card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title mb-4 d-flex align-items-center gap-2" style={{ color: '#fff' }}>
                  <Scissors size={17} />
                  {t('currentServices')}
                </h5>
                {loading ? (
                  <div className="table-responsive">
                    <table className="table current-services-table">
                      <thead>
                        <tr>
                          <th>{t('name')}</th>
                          <th className="d-none d-md-table-cell">{t('description')}</th>
                          <th>{t('price')}</th>
                          <th style={{ minWidth: '130px' }}>{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                            <td><span className="sk" style={{ height: '14px', width: '80%', animationDelay: `${i * 0.1}s` }} /></td>
                            <td className="d-none d-md-table-cell"><span className="sk" style={{ height: '14px', width: '90%', animationDelay: `${i * 0.1}s` }} /></td>
                            <td><span className="sk" style={{ height: '14px', width: '50px', animationDelay: `${i * 0.1}s` }} /></td>
                            <td>
                              <div className="d-flex gap-1">
                                <span className="sk" style={{ height: '28px', width: '52px', borderRadius: '6px', animationDelay: `${i * 0.1}s` }} />
                                <span className="sk" style={{ height: '28px', width: '52px', borderRadius: '6px', animationDelay: `${i * 0.1}s` }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                                  className="btn btn-outline-primary d-flex align-items-center gap-1"
                                  style={{ color: '#fff', background: THEME_COLOR, borderColor: THEME_COLOR, fontWeight: 600, position: 'relative', zIndex: 1 }}
                                  onClick={() => handleEdit(service)}
                                  disabled={!service?.id}
                                >
                                  <Pencil size={12} />
                                  {t('edit')}
                                </button>
                                <span style={{ display: 'inline-block', width: '1px', height: '24px', background: 'rgba(70,161,161,0.3)', margin: '0 0.5rem', verticalAlign: 'middle' }}></span>
                                <button
                                  className="btn btn-sm d-flex align-items-center gap-1"
                                  style={{ background: 'rgba(220,53,69,0.15)', color: '#ff7b7b', border: '1px solid rgba(220,53,69,0.35)', borderRadius: '6px', fontWeight: '600' }}
                                  onClick={() => handleDelete(service?.id)}
                                  disabled={!service?.id}
                                >
                                  <Trash2 size={12} />
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
