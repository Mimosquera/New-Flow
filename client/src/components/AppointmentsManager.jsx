/**
 * AppointmentsManager Component Module
 * Manages appointment requests with accept/decline/cancel functionality
 * 
 * Features:
 * - View all appointments with status filtering
 * - Accept/Decline pending requests
 * - Cancel accepted appointments (by accepting employee or admin)
 * - Expandable appointment details
 * - Auto-translation support for Spanish
 * - Badge status indicators (pending, accepted, upcoming, declined, cancelled)
 * - Employee note/reason input for actions
 * - Admin view showing all employee appointments
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Alert } from './Common/index.jsx';
import { appointmentService } from '../services/api.js';
import { decodeToken, getToken } from '../utils/tokenUtils.js';
import { isAppointmentUpcoming, formatDateDisplay, formatTimeDisplay } from '../utils/dateUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { translateObject } from '../services/translationService.js';

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

/**
 * AppointmentsManager Component
 * Displays appointment requests for employees with accept/decline functionality
 * @param {Object} props - Component props
 * @param {string} props.filter - External filter value (optional)
 * @param {Function} props.setFilter - External filter setter (optional)
 */
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

  /**
   * Fetch appointments from API
   * @param {string|null} filterParam - Optional filter parameter for server-side filtering
   */
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
      setError('Failed to load appointments');
      setAppointments([]);
      setTranslatedAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize component - get user info and fetch appointments
   */
  useEffect(() => {
    try {
      const token = getToken();
      if (token) {
        const decoded = decodeToken(token);
        setCurrentUser(decoded);
        const adminEmail = import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
        setIsAdmin(decoded?.email === adminEmail);
      }
      fetchAppointments();
    } catch (error) {
      console.error('Error initializing AppointmentsManager:', error);
      setError('Initialization error');
    }
  }, [fetchAppointments]);

  /**
   * Re-fetch when filter changes to 'upcoming' for server-side filtering
   */
  useEffect(() => {
    try {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      
      if (filter === FILTER_UPCOMING) {
        fetchAppointments(FILTER_UPCOMING);
      } else {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error in filter effect:', error);
    }
  }, [filter, fetchAppointments]);

  /**
   * Translate appointments when language changes
   */
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

  /**
   * Open modal to accept an appointment
   * @param {Object} appointment - Appointment to accept
   */
  const handleAccept = useCallback((appointment) => {
    try {
      if (!appointment || !appointment.id) {
        console.error('Invalid appointment for accept');
        return;
      }
      setCurrentAppointment(appointment);
      setModalAction(ACTION_ACCEPT);
      setEmployeeNote('');
      setShowNoteModal(true);
    } catch (error) {
      console.error('Error opening accept modal:', error);
    }
  }, []);

  /**
   * Open modal to decline an appointment
   * @param {Object} appointment - Appointment to decline
   */
  const handleDecline = useCallback((appointment) => {
    try {
      if (!appointment || !appointment.id) {
        console.error('Invalid appointment for decline');
        return;
      }
      setCurrentAppointment(appointment);
      setModalAction(ACTION_DECLINE);
      setEmployeeNote('');
      setShowNoteModal(true);
    } catch (error) {
      console.error('Error opening decline modal:', error);
    }
  }, []);

  /**
   * Open modal to cancel an appointment
   * @param {Object} appointment - Appointment to cancel
   */
  const handleCancel = useCallback((appointment) => {
    try {
      if (!appointment || !appointment.id) {
        console.error('Invalid appointment for cancel');
        return;
      }
      setCurrentAppointment(appointment);
      setModalAction(ACTION_CANCEL);
      setEmployeeNote('');
      setShowNoteModal(true);
    } catch (error) {
      console.error('Error opening cancel modal:', error);
    }
  }, []);

  /**
   * Submit appointment action (accept/decline/cancel) with optional note
   */
  const handleSubmitNote = useCallback(async () => {
    try {
      if (!currentAppointment || !currentAppointment.id) {
        console.error('No appointment selected');
        return;
      }

      if (modalAction === ACTION_DECLINE && !employeeNote.trim()) {
        setError(t('noteRequiredForDecline') || 'A note is required when declining an appointment');
        return;
      }

      const noteValue = employeeNote.trim() || null;

      if (modalAction === ACTION_ACCEPT) {
        await appointmentService.accept(currentAppointment.id, noteValue);
        setSuccess(t('appointmentAcceptedSuccess') || 'Appointment accepted successfully');
      } else if (modalAction === ACTION_DECLINE) {
        await appointmentService.decline(currentAppointment.id, noteValue);
        setSuccess(t('appointmentDeclinedSuccess') || 'Appointment declined');
      } else if (modalAction === ACTION_CANCEL) {
        await appointmentService.cancelByEmployee(currentAppointment.id, noteValue);
        setSuccess(t('appointmentCancelledSuccess') || 'Appointment cancelled');
      }

      setShowNoteModal(false);
      setCurrentAppointment(null);
      setEmployeeNote('');
      await fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err?.response?.data?.message || t('failedToUpdateAppointment') || 'Failed to update appointment');
    }
  }, [currentAppointment, modalAction, employeeNote, fetchAppointments, t]);

  /**
   * Toggle expanded details for an appointment
   * @param {string} id - Appointment ID
   */
  const toggleExpand = useCallback((id) => {
    try {
      if (!id) {
        console.error('No ID provided for toggle');
        return;
      }
      setExpandedIds(prev => {
        const newExpanded = new Set(prev);
        if (newExpanded.has(id)) {
          newExpanded.delete(id);
        } else {
          newExpanded.add(id);
        }
        return newExpanded;
      });
    } catch (error) {
      console.error('Error toggling expand:', error);
    }
  }, []);

  /**
   * Check if appointment is upcoming (accepted and in the future)
   * @param {Object} apt - Appointment object
   * @returns {boolean} True if upcoming
   */
  const isUpcoming = useCallback((apt) => {
    try {
      if (!apt || apt.status !== STATUS_ACCEPTED) {
        return false;
      }
      return isAppointmentUpcoming(apt.date, apt.time);
    } catch (error) {
      console.error('Error checking if upcoming:', error);
      return false;
    }
  }, []);

  /**
   * Get Bootstrap badge class based on appointment status
   * @param {Object} apt - Appointment object
   * @returns {string} Bootstrap class name
   */
  const getStatusBadgeClass = useCallback((apt) => {
    try {
      if (!apt || !apt.status) {
        return 'bg-secondary';
      }

      const status = apt.status;
      switch (status) {
        case STATUS_PENDING: return 'bg-warning text-dark';
        case STATUS_ACCEPTED: return isUpcoming(apt) ? 'bg-primary' : 'bg-success';
        case STATUS_DECLINED: return 'bg-danger';
        case STATUS_CANCELLED: return 'bg-secondary';
        default: return 'bg-secondary';
      }
    } catch (error) {
      console.error('Error getting badge class:', error);
      return 'bg-secondary';
    }
  }, [isUpcoming]);

  /**
   * Get badge text based on appointment status and context
   * @param {Object} apt - Appointment object
   * @returns {string} Badge text
   */
  const getStatusBadgeText = useCallback((apt) => {
    try {
      if (!apt || !apt.status) {
        return 'Unknown';
      }

      if (apt.status === STATUS_ACCEPTED && apt.acceptedBy) {
        const upcoming = isUpcoming(apt);
        
        if (upcoming) {
          return isAdmin || apt.acceptedBy.id !== currentUser?.id
            ? `${t('upcomingFor')} ${apt.acceptedBy.name}`
            : t('upcomingBadge');
        } else {
          return isAdmin || apt.acceptedBy.id !== currentUser?.id
            ? `${t('completedBy')} ${apt.acceptedBy.name}`
            : t('completed');
        }
      }
      
      if (apt.status === STATUS_PENDING) return t('pendingBadge') || 'Pending';
      if (apt.status === STATUS_DECLINED) return t('declinedBadge') || 'Declined';
      if (apt.status === STATUS_CANCELLED) return t('cancelledBadge') || 'Cancelled';
      
      return apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
    } catch (error) {
      console.error('Error getting badge text:', error);
      return apt?.status || 'Unknown';
    }
  }, [isUpcoming, isAdmin, currentUser, t]);

  /**
   * Filter appointments based on selected filter
   */
  const filteredAppointments = useMemo(() => {
    try {
      if (filter === FILTER_UPCOMING || filter === FILTER_ALL) {
        return translatedAppointments;
      }
      return translatedAppointments.filter(apt => apt?.status === filter);
    } catch (error) {
      console.error('Error filtering appointments:', error);
      return translatedAppointments;
    }
  }, [filter, translatedAppointments]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t('loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
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

      {/* Filter Dropdown - Mobile only (desktop version is in header) */}
      <div className="mb-3 d-md-none">
        <label htmlFor="statusFilter" className="form-label me-2">{t('filter')}:</label>
        <select
          id="statusFilter"
          className="form-select d-inline-block w-auto"
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

      {filteredAppointments.length === 0 ? (
        <div className="alert alert-info">
          {filter === 'all' ? t('noAppointments') : `${t('no')} ${t(filter)} ${t('appointments').toLowerCase()}.`}
        </div>
      ) : (
        <div className="row g-3 justify-content-center">
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="col-12 col-lg-10 col-xl-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="card-title mb-1">{apt.customerName}</h5>
                      <span className={`badge ${getStatusBadgeClass(apt)}`}>
                        {getStatusBadgeText(apt)}
                      </span>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => toggleExpand(apt.id)}
                    >
                      {expandedIds.has(apt.id) ? `▲ ${t('less')}` : `▼ ${t('more')}`}
                    </button>
                  </div>

                  <div className="mb-2">
                    <strong>{t('service')}:</strong> {apt.service?.name || 'N/A'}<br />
                    <strong>{t('date')}:</strong> {formatDateDisplay(apt.date, language === 'es' ? 'es-ES' : 'en-US')}<br />
                    <strong>{t('time')}:</strong> {formatTimeDisplay(apt.time)}
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
                            <strong>{t('cancelledBy')}:</strong> {apt.acceptedBy ? (isAdmin || apt.acceptedBy.id !== currentUser?.id ? apt.acceptedBy.name : t('you')) : t('unknown')}<br />
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
                          className="btn btn-outline-success"
                          style={{ color: THEME_COLOR, borderColor: THEME_COLOR }}
                          onClick={() => handleAccept(apt)}
                        >
                          {t('accept')}
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDecline(apt)}
                        >
                          {t('decline')}
                        </button>
                      </div>
                    </div>
                  )}

                  {apt.status === 'accepted' && (isAdmin || apt.acceptedBy?.id === currentUser?.id) && (
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleCancel(apt)}
                      >
                        {t('cancelAppointment')}
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
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalAction === 'accept' ? t('acceptAppointment') : modalAction === 'decline' ? t('declineAppointment') : t('cancelAppointment')}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
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
                  className="btn btn-secondary" 
                  onClick={() => setShowNoteModal(false)}
                >
                  {t('close')}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  style={{ backgroundColor: modalAction === ACTION_ACCEPT ? THEME_COLOR : DANGER_COLOR, color: 'white', border: 'none', fontWeight: '300' }}
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
