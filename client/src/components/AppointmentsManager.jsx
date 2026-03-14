import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Calendar, Clock, Filter, Scissors, ChevronDown, ChevronUp, Check, X, Ban } from 'lucide-react';
import { Alert } from './Common/index.jsx';
import { appointmentService } from '../services/api.js';
import { decodeToken, getToken } from '../utils/tokenUtils.js';
import { isAppointmentUpcoming, formatDateDisplay, formatTimeDisplay } from '../utils/dateUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { translateObject } from '../services/translationService.js';
import { hapticSuccess, hapticWarning, hapticMedium } from '../utils/haptics.js';

// Constants
const THEME_COLOR = 'rgb(5, 45, 63)';
const DANGER_COLOR = '#dc3545';
const FILTER_ALL = 'all';
const FILTER_UPCOMING = 'upcoming';
const STATUS_PENDING = 'pending';
const STATUS_ACCEPTED = 'accepted';
const STATUS_DECLINED = 'declined';
const STATUS_CANCELLED = 'cancelled';
const ACTION_ACCEPT = 'accept';
const ACTION_DECLINE = 'decline';
const ACTION_CANCEL = 'cancel';

export const AppointmentsManager = ({ filter: externalFilter, setFilter: externalSetFilter }) => {
  const { t, language } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [translatedAppointments, setTranslatedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [modalAction, setModalAction] = useState(''); // 'accept', 'decline', or 'cancel'
  const [employeeNote, setEmployeeNote] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const isInitialMount = useRef(true);

  // Use external filter if provided, otherwise use internal state
  const [internalFilter, setInternalFilter] = useState('all');
  const filter = externalFilter !== undefined ? externalFilter : internalFilter;
  const setFilter = externalSetFilter || setInternalFilter;

  const fetchAppointments = useCallback(async (filterParam = null) => {
    try {
      setLoading(true);
      const params = filterParam ? { filter: filterParam } : {};
      const response = await appointmentService.getAll(params);
      const data = response?.data?.data || [];
      setAppointments(data);
      setTranslatedAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(t('failedToLoadAppointments'));
      setAppointments([]);
      setTranslatedAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      setCurrentUser(decoded);
      setIsAdmin(decoded?.email === import.meta.env.VITE_SEED_EMPLOYEE_EMAIL);
    }
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchAppointments(filter === FILTER_UPCOMING ? FILTER_UPCOMING : null);
  }, [filter, fetchAppointments]);


  useEffect(() => {
    const translateAppointments = async () => {
      try {
        if (appointments.length === 0) {
          return;
        }

        if (language === 'es') {
          const translated = await Promise.all(
            appointments.map(async (apt) => {
              if (apt?.service) {
                const translatedService = await translateObject(
                  apt.service,
                  ['name', 'description'],
                  'es',
                  'en'
                );
                return { ...apt, service: translatedService };
              }
              return apt;
            })
          );
          setTranslatedAppointments(translated);
        } else {
          setTranslatedAppointments(appointments);
        }
      } catch (error) {
        console.error('Error translating appointments:', error);
        setTranslatedAppointments(appointments);
      }
    };

    translateAppointments();
  }, [language, appointments]);

  const openModal = useCallback((appointment, action) => {
    setCurrentAppointment(appointment);
    setModalAction(action);
    setEmployeeNote('');
    setShowNoteModal(true);
  }, []);

  const handleAccept = useCallback((apt) => openModal(apt, ACTION_ACCEPT), [openModal]);
  const handleDecline = useCallback((apt) => openModal(apt, ACTION_DECLINE), [openModal]);
  const handleCancel = useCallback((apt) => openModal(apt, ACTION_CANCEL), [openModal]);

  const handleSubmitNote = useCallback(async () => {
    try {
      if (!currentAppointment || !currentAppointment.id) {
        console.error('No appointment selected');
        return;
      }

      if (modalAction === ACTION_DECLINE && !employeeNote.trim()) {
        hapticWarning();
        setError(t('noteRequiredForDecline'));
        return;
      }

      const noteValue = employeeNote.trim() || null;

      if (modalAction === ACTION_ACCEPT) {
        await appointmentService.accept(currentAppointment.id, noteValue);
        hapticSuccess();
        setSuccess(t('appointmentAcceptedSuccess'));
      } else if (modalAction === ACTION_DECLINE) {
        await appointmentService.decline(currentAppointment.id, noteValue);
        hapticWarning();
        setSuccess(t('appointmentDeclinedSuccess'));
      } else if (modalAction === ACTION_CANCEL) {
        await appointmentService.cancelByEmployee(currentAppointment.id, noteValue);
        hapticMedium();
        setSuccess(t('appointmentCancelledSuccess'));
      }

      setShowNoteModal(false);
      setCurrentAppointment(null);
      setEmployeeNote('');
      await fetchAppointments();
    } catch (err) {
      hapticWarning();
      console.error('Error updating appointment:', err);
      setError(err?.response?.data?.message || t('failedToUpdateAppointment'));
    }
  }, [currentAppointment, modalAction, employeeNote, fetchAppointments, t]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isUpcoming = useCallback((apt) => {
    return apt?.status === STATUS_ACCEPTED && isAppointmentUpcoming(apt.date, apt.time);
  }, []);

  const getStatusBadgeStyle = useCallback((apt) => {
    const base = { fontWeight: '500', letterSpacing: '0.3px', padding: '0.35em 0.75em', borderRadius: '8px', fontSize: '0.78rem' };
    const status = apt?.status;
    switch (status) {
      case STATUS_PENDING: return { ...base, background: 'linear-gradient(135deg, #f9a825, #fbc02d)', color: '#3e2723' };
      case STATUS_ACCEPTED: return isUpcoming(apt)
        ? { ...base, background: 'linear-gradient(135deg, #0288d1, #03a9f4)', color: '#fff' }
        : { ...base, background: 'linear-gradient(135deg, #2e7d6f, #46a1a1)', color: '#fff' };
      case STATUS_DECLINED: return { ...base, background: 'linear-gradient(135deg, #c62828, #e53935)', color: '#fff' };
      case STATUS_CANCELLED: return { ...base, background: 'linear-gradient(135deg, #546e7a, #78909c)', color: '#fff' };
      default: return { ...base, background: '#78909c', color: '#fff' };
    }
  }, [isUpcoming]);

  const getStatusBadgeText = useCallback((apt) => {
    if (apt.status === STATUS_ACCEPTED && apt.acceptedBy) {
      const upcoming = isUpcoming(apt);
      const showName = isAdmin || apt.acceptedBy.id !== currentUser?.id;
      if (upcoming) return showName ? `${t('upcomingFor')} ${apt.acceptedBy.name}` : t('upcomingBadge');
      return showName ? `${t('completedBy')} ${apt.acceptedBy.name}` : t('completed');
    }
    if (apt.status === STATUS_PENDING) return t('pendingBadge') || 'Pending';
    if (apt.status === STATUS_DECLINED) return t('declinedBadge') || 'Declined';
    if (apt.status === STATUS_CANCELLED) return t('cancelledBadge') || 'Cancelled';
    return apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
  }, [isUpcoming, isAdmin, currentUser, t]);

  const filteredAppointments = useMemo(() => {
    if (filter === FILTER_UPCOMING || filter === FILTER_ALL) return translatedAppointments;
    return translatedAppointments.filter(apt => apt?.status === filter);
  }, [filter, translatedAppointments]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sk-card mb-3 p-3" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="sk" style={{ height: '22px', width: '90px', borderRadius: '12px', animationDelay: `${i * 0.12}s` }} />
                  <span className="sk" style={{ height: '22px', width: '65px', borderRadius: '12px', animationDelay: `${i * 0.12}s` }} />
                </div>
                <span className="sk mb-2" style={{ height: '16px', width: '58%', animationDelay: `${i * 0.12}s` }} />
                <span className="sk mb-3" style={{ height: '13px', width: '42%', animationDelay: `${i * 0.12}s` }} />
                <div className="d-flex gap-2">
                  <span className="sk" style={{ height: '32px', width: '80px', borderRadius: '8px', animationDelay: `${i * 0.12}s` }} />
                  <span className="sk" style={{ height: '32px', width: '80px', borderRadius: '8px', animationDelay: `${i * 0.12}s` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-6">
          {error && (
            <Alert 
              message={error} 
              type="danger"
              onClose={() => setError(null)}
            />
          )}
          
          {success && (
            <Alert 
              message={success} 
              type="success"
              onClose={() => setSuccess(null)}
            />
          )}
        </div>
      </div>

      {/* Filter Dropdown - always above cards, aligned with card columns */}
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-6">
          <div className="mb-3">
            <label htmlFor="statusFilter" className="form-label me-2 appointments-filter-label d-inline-flex align-items-center gap-1"><Filter size={13} />{t('filter')}:</label>
            <select
              id="statusFilter"
              className="form-select d-inline-block w-auto appointments-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">{t('allAppointments')}</option>
              <option value="upcoming">{t('upcoming')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="accepted">{t('accepted')}</option>
              <option value="declined">{t('declined')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6">
            <div className="alert mb-0 no-appointments-message appointments-no-results">
              {filter === 'all' ? t('noAppointments') : `${t('no')} ${t(filter)} ${t('appointments').toLowerCase()}.`}
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-3 justify-content-center">
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="col-12 col-lg-8 col-xl-6">
              <div className="card appointment-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="card-title mb-1">{apt.customerName}</h5>
                      <span style={getStatusBadgeStyle(apt)}>
                        {getStatusBadgeText(apt)}
                      </span>
                    </div>
                    <button
                      className="btn btn-sm"
                      style={{ 
                        background: 'transparent', 
                        border: '1.5px solid #46a1a1', 
                        color: '#46a1a1', 
                        borderRadius: '8px', 
                        fontWeight: '500', 
                        fontSize: '0.8rem', 
                        padding: '0.25rem 0.6rem' 
                      }}
                      onClick={() => toggleExpand(apt.id)}
                    >
                      {expandedIds.has(apt.id)
                        ? <><ChevronUp size={13} /> {t('less')}</>
                        : <><ChevronDown size={13} /> {t('more')}</>}
                    </button>
                  </div>

                  <div className="mb-2" style={{ fontSize: '0.9rem' }}>
                    <span className="d-flex align-items-center gap-1 mb-1">
                      <Scissors size={13} style={{ color: '#46a1a1', flexShrink: 0 }} />
                      <strong>{t('service')}:</strong>&nbsp;{apt.service?.name || 'N/A'}
                    </span>
                    <span className="d-flex align-items-center gap-1 mb-1">
                      <Calendar size={13} style={{ color: '#46a1a1', flexShrink: 0 }} />
                      <strong>{t('date')}:</strong>&nbsp;{formatDateDisplay(apt.date, language === 'es' ? 'es-ES' : 'en-US')}
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <Clock size={13} style={{ color: '#46a1a1', flexShrink: 0 }} />
                      <strong>{t('time')}:</strong>&nbsp;{formatTimeDisplay(apt.time)}
                    </span>
                  </div>

                  {expandedIds.has(apt.id) && (
                    <>
                      <hr />
                      <div className="mb-2">
                        <strong>{t('email')}:</strong> {apt.customerEmail}<br />
                        <strong>{t('phone')}:</strong> {apt.customerPhone}<br />
                        <strong>{t('requestedEmployee')}</strong> {apt.employee?.name || t('noPreference')}<br />
                        {apt.customerNotes && (
                          <>
                            <strong>{t('customerNote')}:</strong> {apt.customerNotes}<br />
                          </>
                        )}
                        {apt.acceptedBy && (
                          <>
                            <strong>{t('acceptedBy')}</strong> {isAdmin || apt.acceptedBy.id !== currentUser?.id 
                              ? apt.acceptedBy.name 
                              : t('you')}<br />
                          </>
                        )}
                        {apt.status === 'cancelled' && (
                          <>
                            <strong>{t('cancelledBy')}:</strong> {(() => {
                              if (!apt.cancelledBy) return t('customer');
                              if (apt.cancelledBy === 'customer') return t('customer');
                              if (apt.cancelledBy === 'employee') return t('employee');
                              if (apt.cancelledBy === 'admin') return t('admin');
                              return apt.cancelledBy;
                            })()}<br />
                            {apt.employeeNote && (
                              <>
                                <strong>{t('cancellationReason')}:</strong> {apt.employeeNote}<br />
                              </>
                            )}
                          </>
                        )}
                        {apt.status !== 'cancelled' && apt.employeeNote && (
                          <>
                            <strong>{t('employeeNote')}:</strong> {apt.employeeNote}<br />
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {apt.status === 'pending' && (
                    <div className="d-flex gap-2 mt-3">
                      <div className="btn-group btn-group-sm" style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn d-flex align-items-center gap-1"
                          style={{
                            background: 'linear-gradient(135deg, rgb(5, 45, 63), rgb(10, 65, 90))',
                            color: '#fff',
                            border: '1.5px solid #46a1a1',
                            borderRadius: '8px',
                            fontWeight: '500',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.85rem',
                            boxShadow: '0 2px 8px rgba(70, 161, 161, 0.3)'
                          }}
                          onClick={() => handleAccept(apt)}
                        >
                          <Check size={14} /> {t('accept')}
                        </button>
                        <button
                          className="btn d-flex align-items-center gap-1"
                          style={{
                            background: 'transparent',
                            color: '#dc3545',
                            border: '1.5px solid #dc3545',
                            borderRadius: '8px',
                            fontWeight: '500',
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.85rem'
                          }}
                          onClick={() => handleDecline(apt)}
                        >
                          <X size={14} /> {t('decline')}
                        </button>
                      </div>
                    </div>
                  )}

                  {apt.status === 'accepted' && (isAdmin || apt.acceptedBy?.id === currentUser?.id) && (
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-sm"
                        style={{ 
                          background: 'transparent', 
                          color: '#dc3545', 
                          border: '1.5px solid #dc3545', 
                          borderRadius: '8px', 
                          fontWeight: '500', 
                          fontSize: '0.85rem',
                          padding: '0.3rem 0.75rem'
                        }}
                        onClick={() => handleCancel(apt)}
                      >
                        <Ban size={14} /> {t('cancelAppointment')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog appointment-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalAction === 'accept' ? t('acceptAppointment') : modalAction === 'decline' ? t('declineAppointment') : t('cancelAppointment')}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowNoteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>{currentAppointment?.customerName}</strong> - {formatDateDisplay(currentAppointment?.date, language === 'es' ? 'es-ES' : 'en-US')} {t('at')} {formatTimeDisplay(currentAppointment?.time)}
                </p>
                <div className="mb-3">
                  <label htmlFor="employeeNote" className="form-label">
                    {modalAction === 'accept' ? t('noteOptional') : modalAction === 'decline' ? t('reasonForDeclineRequired') : t('reasonOptional')}
                  </label>
                  <textarea
                    id="employeeNote"
                    className="form-control"
                    rows="3"
                    value={employeeNote}
                    onChange={(e) => setEmployeeNote(e.target.value)}
                    placeholder={modalAction === 'accept' 
                      ? t('addNotePlaceholder')
                      : modalAction === 'decline'
                      ? t('explainDeclinePlaceholder')
                      : t('reasonForCancelPlaceholder')}
                    required={modalAction === 'decline'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    backdropFilter: 'blur(10px)', 
                    color: '#b0bec5', 
                    border: '1px solid rgba(255, 255, 255, 0.15)', 
                    borderRadius: '10px', 
                    fontWeight: '500',
                    padding: '0.4rem 1rem'
                  }}
                  onClick={() => setShowNoteModal(false)}
                >
                  {t('close')}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  style={{ 
                    backgroundColor: modalAction === ACTION_ACCEPT ? '#46a1a1' : DANGER_COLOR, 
                    color: 'white', 
                    border: 'none', 
                    fontWeight: '500', 
                    borderRadius: '10px',
                    padding: '0.4rem 1rem',
                    boxShadow: modalAction === ACTION_ACCEPT 
                      ? '0 2px 12px rgba(70, 161, 161, 0.4)' 
                      : '0 2px 12px rgba(220, 53, 69, 0.3)'
                  }}
                  onClick={handleSubmitNote}
                >
                  {modalAction === ACTION_ACCEPT ? t('accept') : modalAction === ACTION_DECLINE ? t('decline') : t('cancelAppointment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AppointmentsManager.propTypes = {
  filter: PropTypes.string,
  setFilter: PropTypes.func,
};
