import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Scissors, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { Alert, FormInput } from '../../components/Common/index.jsx';
import { useForm } from '../../hooks/useForm.js';
import { serviceService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { useTranslateItems } from '../../hooks/useTranslateItems.js';
import { hapticSuccess, hapticWarning } from '../../utils/haptics.js';

export const ServiceManager = () => {
  const { t, language } = useTranslation();
  const [services, setServices] = useState([]);
  const [translatedServices] = useTranslateItems(services, ['name', 'description'], language);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [isPriceRange, setIsPriceRange] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
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
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    resetForm();
    setIsPriceRange(false);
    setSuccess(null);
    setShowForm(false);
  };

  const handlePriceRangeToggle = (e) => {
    setIsPriceRange(e.target.checked);
    if (!e.target.checked) {
      setFormData(prev => ({ ...prev, price_max: '' }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await serviceService.delete(id);
      setServices(services.filter(s => s.id !== id));
      hapticSuccess();
      setSuccess(t('serviceDeleted'));
      setShowDeleteConfirm(null);
    } catch (error) {
      hapticWarning();
      const msg = error?.response?.data?.message || t('deleteServiceFailed');
      setError(msg);
      setShowDeleteConfirm(null);
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
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7" ref={formRef}>
            <div className="post-update-card" style={{ overflow: 'hidden' }}>

              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.85rem 1.15rem',
                borderBottom: '1px solid rgba(70,161,161,0.15)',
                background: 'rgba(3, 25, 38, 0.45)',
              }}>
                <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                  <Scissors size={16} />
                  {t('currentServices')}
                </h5>
                <button
                  onClick={() => {
                    if (showForm) {
                      if (editingService) handleCancelEdit(); else setShowForm(false);
                    } else {
                      setShowForm(true);
                    }
                    setError('');
                    setSuccess(null);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: showForm ? 'rgba(255,255,255,0.06)' : 'rgba(58,171,219,0.15)',
                    color: showForm ? 'rgba(255,255,255,0.6)' : '#3aabdb',
                    border: `1px solid ${showForm ? 'rgba(255,255,255,0.15)' : 'rgba(58,171,219,0.35)'}`,
                    borderRadius: '8px', padding: '0.28rem 0.7rem',
                    fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {showForm ? <X size={13} /> : <><Plus size={13} /> {t('addService')}</>}
                </button>
              </div>

              {/* Alerts */}
              <AnimatePresence>
                {(success || error) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0.75rem 1.15rem 0' }}>
                      {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}
                      {error && <Alert message={error} type="danger" onClose={() => setError('')} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline Add/Edit Form */}
              <AnimatePresence initial={false}>
                {showForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '1.15rem', borderBottom: '1px solid rgba(70,161,161,0.12)' }}>
                      <h6 style={{ margin: '0 0 0.85rem', color: '#3aabdb', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {editingService ? <><Pencil size={13} /> {t('editService')}</> : <><Plus size={13} /> {t('addService')}</>}
                      </h6>
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

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn" style={{ background: 'rgba(58,171,219,0.15)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.35)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '600' }}>
                            {editingService ? t('updateService') : t('addService')}
                          </button>
                          {editingService && (
                            <button type="button" className="btn" onClick={handleCancelEdit} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '500' }}>
                              {t('cancel')}
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Services List */}
              {loading ? (
                <div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ padding: '0.85rem 1.15rem', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <span className="sk" style={{ height: '14px', width: '40%', display: 'block', animationDelay: `${i * 0.1}s` }} />
                          <span className="sk" style={{ height: '11px', width: '60%', display: 'block', marginTop: '0.4rem', animationDelay: `${i * 0.1}s` }} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="sk" style={{ height: '14px', width: '55px', display: 'block', animationDelay: `${i * 0.1}s` }} />
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', justifyContent: 'flex-end' }}>
                            <span className="sk" style={{ height: '24px', width: '46px', borderRadius: '6px', animationDelay: `${i * 0.1}s` }} />
                            <span className="sk" style={{ height: '24px', width: '54px', borderRadius: '6px', animationDelay: `${i * 0.1}s` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                  <Scissors size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '0.6rem' }} />
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>{t('noServices')}</p>
                </div>
              ) : (
                <div>
                  {translatedServices.map((service, index) => (
                    <div key={service?.id || `service-${index}`} style={{
                      padding: '0.85rem 1.15rem',
                      borderBottom: index < translatedServices.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                        {/* Name + Description */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {service?.name || 'N/A'}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.76rem', marginTop: '0.2rem', lineHeight: 1.4, wordBreak: 'break-word' }}>
                            {service?.description || ''}
                          </div>
                        </div>
                        {/* Price + Actions */}
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <div style={{ color: '#3aabdb', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                            {formatPriceDisplay(service?.price, service?.price_max)}
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleEdit(service)}
                              disabled={!service?.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                background: 'rgba(58,171,219,0.12)', color: '#3aabdb',
                                border: '1px solid rgba(58,171,219,0.25)', borderRadius: '6px',
                                padding: '0.22rem 0.55rem', fontSize: '0.72rem', fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Pencil size={11} /> {t('edit')}
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(showDeleteConfirm === service?.id ? null : service?.id)}
                              disabled={!service?.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                background: 'rgba(220,53,69,0.1)', color: '#ff7b7b',
                                border: '1px solid rgba(220,53,69,0.25)', borderRadius: '6px',
                                padding: '0.22rem 0.55rem', fontSize: '0.72rem', fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={11} /> {t('delete')}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Delete Confirmation */}
                      <AnimatePresence initial={false}>
                        {showDeleteConfirm === service?.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{
                              marginTop: '0.65rem', padding: '0.6rem 0.8rem',
                              background: 'rgba(220,53,69,0.08)', borderRadius: '8px',
                              border: '1px solid rgba(220,53,69,0.18)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ff8585', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.45rem' }}>
                                <AlertTriangle size={14} />
                                {t('confirmDeleteService')}
                              </div>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  onClick={() => handleDelete(service.id)}
                                  style={{
                                    background: 'rgba(220,53,69,0.2)', color: '#ff7b7b',
                                    border: '1px solid rgba(220,53,69,0.35)', borderRadius: '6px',
                                    padding: '0.22rem 0.65rem', fontSize: '0.73rem', fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {t('delete')}
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  style={{
                                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
                                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px',
                                    padding: '0.22rem 0.65rem', fontSize: '0.73rem', fontWeight: 500,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {t('cancel')}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
