/**
 * AvailabilityManager Component Module
 * Manages employee recurring availability schedules and blocked dates
 * 
 * Features:
 * - Add/Edit/Delete recurring weekly availability
 * - Group availability by day of week
 * - Admin view with employee filtering
 * - Integrated blocked dates management
 * - Responsive collapsible mobile UI
 * - Time validation (end time after start time)
 * - Multi-day selection for availability
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from './Common/index.jsx';
import { availabilityService, dataService, blockedDateService } from '../services/api.js';
import { decodeToken, getToken } from '../utils/tokenUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { BlockedDatesManager } from './BlockedDatesManager.jsx';

// Constants
const DEFAULT_FORM_DATA = {
  selectedDays: [],
  startTime: '08:00',
  endTime: '21:00'
};

const MOBILE_BREAKPOINT = 768;
const THEME_COLOR = 'rgb(5, 45, 63)';
const FILTER_ALL_VALUE = 'all';
const TIME_FORMAT_OPTIONS = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
};

/**
 * Availability Management Component for Employees
 * Allows employees to set recurring weekly availability and block specific dates
 */
export const AvailabilityManager = () => {
  const { t } = useTranslation();
  
  // Days of week configuration with translated labels
  const DAYS_OF_WEEK = useMemo(() => [
    { value: 0, label: t('sundays') || 'Sundays' },
    { value: 1, label: t('mondays') || 'Mondays' },
    { value: 2, label: t('tuesdays') || 'Tuesdays' },
    { value: 3, label: t('wednesdays') || 'Wednesdays' },
    { value: 4, label: t('thursdays') || 'Thursdays' },
    { value: 5, label: t('fridays') || 'Fridays' },
    { value: 6, label: t('saturdays') || 'Saturdays' },
  ], [t]);
  
  // State management
  const [availabilities, setAvailabilities] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ startTime: '', endTime: '' });
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(FILTER_ALL_VALUE);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [showBlockedDates, setShowBlockedDates] = useState(false);

  /**
   * Handle window resize to update mobile state
   */
  useEffect(() => {
    const handleResize = () => {
      try {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      } catch (error) {
        console.error('Error handling resize:', error);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Fetch all employees (admin only)
   */
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await dataService.getEmployees();
      setEmployees(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    }
  }, []);

  /**
   * Fetch all availabilities
   */
  const fetchAvailabilities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getAll();
      setAvailabilities(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching availabilities:', err);
      setError('Failed to fetch availabilities');
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all blocked dates
   */
  const fetchBlockedDates = useCallback(async () => {
    try {
      const response = await blockedDateService.getAll();
      setBlockedDates(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching blocked dates:', err);
      setBlockedDates([]);
    }
  }, []);

  /**
   * Initialize component - check admin status and fetch data
   */
  useEffect(() => {
    try {
      const token = getToken();
      
      if (token) {
        const decoded = decodeToken(token);
        const adminEmail = import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
        const adminStatus = decoded?.email === adminEmail;
        setIsAdmin(adminStatus);
        
        // If admin, fetch all employees for filtering
        if (adminStatus) {
          fetchEmployees();
        }
      }
      
      fetchAvailabilities();
      fetchBlockedDates();
    } catch (error) {
      console.error('Error initializing AvailabilityManager:', error);
      setError('An error occurred');
    }
  }, [fetchEmployees, fetchAvailabilities, fetchBlockedDates]);

  /**
   * Handle form input changes (checkboxes and text inputs)
   * @param {Event} e - Input change event
   */
  const handleChange = useCallback((e) => {
    try {
      if (!e || !e.target) {
        console.error('Invalid event in handleChange');
        return;
      }

      const { name, value, type, checked } = e.target;
      
      if (type === 'checkbox') {
        const dayValue = parseInt(value, 10);
        
        if (isNaN(dayValue)) {
          console.error('Invalid day value');
          return;
        }

        setFormData(prev => ({
          ...prev,
          selectedDays: checked 
            ? [...prev.selectedDays, dayValue]
            : prev.selectedDays.filter(d => d !== dayValue)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } catch (error) {
      console.error('Error handling change:', error);
    }
  }, []);

  /**
   * Validate availability form data
   * @param {Object} data - Form data to validate
   * @returns {Object} { valid: boolean, error: string }
   */
  const validateAvailability = useCallback((data) => {
    try {
      if (!data || typeof data !== 'object') {
        return { valid: false, error: t('error') || 'Invalid data' };
      }

      // Check if at least one day is selected
      if (!data.selectedDays || data.selectedDays.length === 0) {
        return { valid: false, error: t('selectOneDay') || 'Select at least one day' };
      }

      // Validate that end time is after start time
      if (data.startTime >= data.endTime) {
        return { valid: false, error: t('endTimeAfterStart') || 'End time must be after start time' };
      }

      return { valid: true, error: null };
    } catch (error) {
      console.error('Error validating availability:', error);
      return { valid: false, error: t('error') || 'Validation error' };
    }
  }, [t]);

  /**
   * Handle availability form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = useCallback(async (e) => {
    try {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      setSuccess(null);
      setError(null);

      // Validate form data
      const validation = validateAvailability(formData);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      // Create availability for each selected day
      const createPromises = formData.selectedDays.map(dayOfWeek =>
        availabilityService.create({
          dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
        })
      );

      await Promise.all(createPromises);
      
      setSuccess(t('availabilityAdded') || 'Availability added successfully');
      setFormData(DEFAULT_FORM_DATA);
      await fetchAvailabilities();
    } catch (err) {
      console.error('Error creating availability:', err);
      setError(err?.response?.data?.error || t('error') || 'Failed to add availability');
    }
  }, [formData, validateAvailability, fetchAvailabilities, t]);

  /**
   * Handle deleting an availability entry
   * @param {number} id - Availability ID to delete
   */
  const handleDelete = useCallback(async (id) => {
    try {
      if (!id) {
        console.error('No ID provided for deletion');
        return;
      }

      const confirmMessage = t('confirmDeleteAvailability') || 'Are you sure you want to delete this availability?';
      if (!window.confirm(confirmMessage)) {
        return;
      }

      await availabilityService.delete(id);
      setSuccess(t('availabilityDeleted') || 'Availability deleted successfully');
      await fetchAvailabilities();
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError(t('error') || 'Failed to delete availability');
    }
  }, [fetchAvailabilities, t]);

  /**
   * Start editing an availability entry
   * @param {Object} avail - Availability object to edit
   */
  const handleEdit = useCallback((avail) => {
    try {
      if (!avail || !avail.id) {
        console.error('Invalid availability object for editing');
        return;
      }

      setEditingId(avail.id);
      setEditFormData({
        startTime: avail.startTime?.substring(0, 5) || '',
        endTime: avail.endTime?.substring(0, 5) || ''
      });
    } catch (error) {
      console.error('Error starting edit:', error);
    }
  }, []);

  /**
   * Cancel editing mode
   */
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditFormData({ startTime: '', endTime: '' });
  }, []);

  /**
   * Submit availability update
   * @param {number} id - Availability ID to update
   */
  const handleUpdateSubmit = useCallback(async (id) => {
    try {
      if (!id) {
        console.error('No ID provided for update');
        return;
      }

      // Validate edit form data
      if (editFormData.startTime >= editFormData.endTime) {
        setError(t('endTimeAfterStart') || 'End time must be after start time');
        return;
      }

      await availabilityService.update(id, editFormData);
      setSuccess(t('availabilityUpdated') || 'Availability updated successfully');
      setEditingId(null);
      setEditFormData({ startTime: '', endTime: '' });
      await fetchAvailabilities();
    } catch (err) {
      console.error('Error updating availability:', err);
      setError(t('error') || 'Failed to update availability');
    }
  }, [editFormData, fetchAvailabilities, t]);

  /**
   * Filter and group availabilities by day of week
   * Applies employee filter if admin
   */
  const groupedAvailabilities = useMemo(() => {
    try {
      // Filter by employee if admin and filter is set
      const filteredAvailabilities = (isAdmin && selectedEmployeeFilter !== FILTER_ALL_VALUE)
        ? availabilities.filter(a => a?.user?.id === selectedEmployeeFilter)
        : availabilities;
      
      // Group by day of week
      return filteredAvailabilities.reduce((acc, avail) => {
        if (!avail || typeof avail.dayOfWeek !== 'number') {
          return acc;
        }

        const day = avail.dayOfWeek;
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(avail);
        return acc;
      }, {});
    } catch (error) {
      console.error('Error grouping availabilities:', error);
      return {};
    }
  }, [availabilities, isAdmin, selectedEmployeeFilter]);

  /**
   * Format time string to 12-hour format
   * @param {string} timeString - Time in HH:MM:SS format
   * @returns {string} Formatted time
   */
  const formatTime = useCallback((timeString) => {
    try {
      if (!timeString) return '';
      
      const date = new Date(`2000-01-01T${timeString}`);
      
      if (isNaN(date.getTime())) {
        return timeString;
      }

      return date.toLocaleTimeString('en-US', TIME_FORMAT_OPTIONS);
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  }, []);

  return (
    <div className="availability-manager">
      <div className="container py-4">
        <div className="row">
          {/* Left Column: Add Availability and Block Dates */}
          <div className="col-lg-4">
            {/* Availability Form */}
            <div className="mb-4">
              <div className="card post-update-card shadow-sm border-0">
                <div 
                  className="card-header d-flex justify-content-between align-items-center d-md-none"
                  style={{ 
                    backgroundColor: THEME_COLOR, 
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.75rem 1rem'
                  }}
                  onClick={() => setShowAddAvailability(!showAddAvailability)}
                >
                  <h5 className="mb-0" style={{ fontSize: '1rem' }}>{t('addAvailability')}</h5>
                  <span style={{ fontSize: '1.2rem' }}>
                    {showAddAvailability ? '−' : '+'}
                  </span>
                </div>
                <div className={`d-md-block ${showAddAvailability ? 'd-block' : 'd-none'}`}>
                  <div className="card-body p-4">
                    <h5 className="card-title mb-4 d-none d-md-block" style={{ color: '#fff', textShadow: '0 5px 24px rgba(5,45,63,0.85), 0 3px 8px rgba(0,0,0,0.65)' }}>{t('addAvailability')}</h5>

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
                    <div className="mb-3">
                      <div className="form-label fw-semibold days-of-week-header">{t('daysOfWeek')} *</div>
                      <div className="border rounded p-3">
                        <div className="row row-cols-1 row-cols-md-2 g-2">
                          {DAYS_OF_WEEK.map(day => (
                            <div key={day.value} className="col">
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`day-${day.value}`}
                                  name={`day-${day.value}`}
                                  value={day.value}
                                  checked={formData.selectedDays.includes(day.value)}
                                  onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor={`day-${day.value}`}>
                                  {day.label}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <small className="text-muted">{t('selectDays')}</small>
                    </div>

                    <div className="row mb-3">
                      <div className="col-6">
                        <label htmlFor="startTime" className="form-label">{t('startTime')} *</label>
                        <input
                          id="startTime"
                          type="time"
                          name="startTime"
                          className="form-control"
                          value={formData.startTime}
                          onChange={handleChange}
                          required
                          autoComplete="off"
                        />
                      </div>
                      <div className="col-6">
                        <label htmlFor="endTime" className="form-label">{t('endTime')} *</label>
                        <input
                          id="endTime"
                          type="time"
                          name="endTime"
                          className="form-control"
                          value={formData.endTime}
                          onChange={handleChange}
                          required
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-lg w-100"
                      style={{ 
                        backgroundColor: THEME_COLOR, 
                        color: 'white', 
                        border: 'none', 
                        fontWeight: '300' 
                      }}
                    >
                      {t('addAvailability')}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

            {/* Blocked Dates Section */}
            <div className="mb-4">
              <div className="card post-update-card shadow-sm border-0">
                <div 
                  className="card-header d-flex justify-content-between align-items-center d-md-none"
                  style={{ 
                    backgroundColor: THEME_COLOR, 
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.75rem 1rem'
                  }}
                  onClick={() => setShowBlockedDates(!showBlockedDates)}
                >
                  <h5 className="mb-0" style={{ fontSize: '1rem' }}>{t('blockSpecificDates')}</h5>
                  <span style={{ fontSize: '1.2rem' }}>
                    {showBlockedDates ? '−' : '+'}
                  </span>
                </div>
                <div className={`d-md-block ${showBlockedDates ? 'd-block' : 'd-none'}`}>
                  <div className="card-body p-4">
                    <h5 className="card-title mb-4 d-none d-md-block" style={{ color: '#fff', textShadow: '0 5px 24px rgba(5,45,63,0.85), 0 3px 8px rgba(0,0,0,0.65)' }}>
                      {t('blockSpecificDates')}
                    </h5>
                    <BlockedDatesManager 
                    blockedDates={blockedDates}
                    onBlockedDateChange={fetchBlockedDates}
                    isAdmin={isAdmin}
                    employees={employees}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Right Column: Availability List */}
          <div className="col-lg-8">
            <div className="card post-update-card shadow-sm border-0">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0" style={{ color: '#fff', textShadow: '0 5px 24px rgba(5,45,63,0.85), 0 3px 8px rgba(0,0,0,0.65)' }}>{isAdmin ? t('allAvailability') : t('yourAvailability')}</h5>
                  
                  {/* Admin Employee Filter */}
                  {isAdmin && employees.length > 0 && (
                    <select
                      id="availabilityEmployeeFilter"
                      name="availabilityEmployeeFilter"
                      className="form-select"
                      style={{ width: 'auto', minWidth: '200px' }}
                      value={selectedEmployeeFilter}
                      onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                      autoComplete="off"
                    >
                      <option value="all">{t('allEmployees')}</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                {loading ? (
                  <div className="text-center py-4">
                    <p>{t('loading')}</p>
                  </div>
                ) : availabilities.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">{t('noAvailability')}</p>
                  </div>
                ) : (
                  <div>
                    {Object.keys(groupedAvailabilities)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(dayNum => {
                        const dayName = DAYS_OF_WEEK.find(d => d.value === parseInt(dayNum))?.label || 'Unknown';
                        return (
                          <div key={dayNum} className="mb-4">
                            <h6 className="fw-bold mb-3" style={{ color: '#000', fontSize: '1.1rem' }}>{dayName}</h6>
                            
                            {/* Desktop Table View */}
                            {!isMobile ? (
                              <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="table table-hover align-middle" style={{ tableLayout: 'auto', width: '100%' }}>
                                  <thead>
                                    <tr style={{ borderBottom: `2px solid ${THEME_COLOR}` }}>
                                      {isAdmin && <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px' }}>{t('employee')}</th>}
                                      <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px' }}>{t('startTime')}</th>
                                      <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px' }}>{t('endTime')}</th>
                                      <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px' }}>{t('actions')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupedAvailabilities[dayNum]
                                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                      .map(avail => (
                                        <tr key={avail.id}>
                                          {isAdmin && <td className="fw-bold" style={{ color: THEME_COLOR, padding: '8px' }}>{avail?.user?.name || 'Unknown'}</td>}
                                          <td style={{ padding: '8px' }}>
                                            {editingId === avail.id ? (
                                              <input
                                                id={`edit-start-${avail.id}`}
                                                name={`edit-start-${avail.id}`}
                                                type="time"
                                                className="form-control form-control-sm"
                                                value={editFormData.startTime}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                                autoComplete="off"
                                              />
                                            ) : (
                                              formatTime(avail.startTime)
                                            )}
                                          </td>
                                          <td style={{ padding: '8px' }}>
                                            {editingId === avail.id ? (
                                              <input
                                                id={`edit-end-${avail.id}`}
                                                name={`edit-end-${avail.id}`}
                                                type="time"
                                                className="form-control form-control-sm"
                                                value={editFormData.endTime}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                                autoComplete="off"
                                              />
                                            ) : (
                                              formatTime(avail.endTime)
                                            )}
                                          </td>
                                          <td style={{ padding: '8px' }}>
                                            {editingId === avail.id ? (
                                              <div className="btn-group btn-group-sm">
                                                <button
                                                  className="btn btn-outline-primary"
                                                  style={{ color: THEME_COLOR, borderColor: THEME_COLOR }}
                                                  onClick={() => handleUpdateSubmit(avail.id)}
                                                >
                                                  {t('save')}
                                                </button>
                                                <button
                                                  className="btn btn-outline-secondary"
                                                  onClick={handleCancelEdit}
                                                >
                                                  {t('cancel')}
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="btn-group btn-group-sm align-items-center">
                                                <button
                                                  className="btn btn-outline-primary"
                                                  style={{ color: '#fff', borderColor: THEME_COLOR, backgroundColor: THEME_COLOR }}
                                                  onClick={() => handleEdit(avail)}
                                                >
                                                  {t('edit')}
                                                </button>
                                                <span style={{
                                                  display: 'inline-block',
                                                  width: '2px',
                                                  height: '24px',
                                                  background: '#cfd8dc',
                                                  margin: '0 8px',
                                                  borderRadius: '1px'
                                                }}></span>
                                                <button
                                                  className="btn btn-outline-danger"
                                                  onClick={() => handleDelete(avail.id)}
                                                >
                                                  {t('delete')}
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              /* Mobile Card View */
                              <div>
                                {groupedAvailabilities[dayNum]
                                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                  .map(avail => (
                                    <div key={avail.id} className="card mb-3" style={{ border: '2px solid #5188b6' }}>
                                      <div className="card-body p-3">
                                        {isAdmin && (
                                          <div className="mb-2">
                                            <small className="text-muted d-block">{t('employee')}</small>
                                            <strong style={{ color: THEME_COLOR }}>{avail?.user?.name || 'Unknown'}</strong>
                                          </div>
                                        )}
                                        
                                        {editingId === avail.id ? (
                                          /* Edit Mode */
                                          <div>
                                            <div className="mb-3">
                                              <label htmlFor={`mobile-edit-start-${avail.id}`} className="form-label small text-muted mb-1">{t('startTime')}</label>
                                              <input
                                                id={`mobile-edit-start-${avail.id}`}
                                                name={`mobile-edit-start-${avail.id}`}
                                                type="time"
                                                className="form-control"
                                                value={editFormData.startTime}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                                autoComplete="off"
                                              />
                                            </div>
                                            <div className="mb-3">
                                              <label htmlFor={`mobile-edit-end-${avail.id}`} className="form-label small text-muted mb-1">{t('endTime')}</label>
                                              <input
                                                id={`mobile-edit-end-${avail.id}`}
                                                name={`mobile-edit-end-${avail.id}`}
                                                type="time"
                                                className="form-control"
                                                value={editFormData.endTime}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                                autoComplete="off"
                                              />
                                            </div>
                                            <div className="d-grid gap-2">
                                              <button
                                                className="btn btn-primary"
                                                style={{ backgroundColor: THEME_COLOR, borderColor: THEME_COLOR }}
                                                onClick={() => handleUpdateSubmit(avail.id)}
                                              >
                                                {t('save')}
                                              </button>
                                              <button
                                                className="btn btn-outline-secondary"
                                                onClick={handleCancelEdit}
                                              >
                                                {t('cancel')}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          /* View Mode */
                                          <div>
                                            <div className="d-flex align-items-center mb-2">
                                              <div className="me-3">
                                                <small className="text-muted d-block">{t('startTime')}</small>
                                                <strong>{formatTime(avail.startTime)}</strong>
                                              </div>
                                              <div className="me-3">
                                                <small className="text-muted d-block">{t('endTime')}</small>
                                                <strong>{formatTime(avail.endTime)}</strong>
                                              </div>
                                              <div className="d-flex align-items-center ms-auto">
                                                <button
                                                  className="btn btn-outline-primary btn-sm"
                                                  style={{
                                                    color: '#fff',
                                                    borderColor: THEME_COLOR,
                                                    backgroundColor: THEME_COLOR,
                                                    fontWeight: 600,
                                                    borderTopRightRadius: 0,
                                                    borderBottomRightRadius: 0
                                                  }}
                                                  onClick={() => handleEdit(avail)}
                                                >
                                                  {t('edit')}
                                                </button>
                                                <span style={{
                                                  display: 'inline-block',
                                                  width: '2px',
                                                  height: '24px',
                                                  background: '#cfd8dc',
                                                  margin: '0 8px',
                                                  borderRadius: '1px'
                                                }}></span>
                                                <button
                                                  className="btn btn-outline-danger btn-sm"
                                                  style={{
                                                    borderColor: THEME_COLOR,
                                                    borderTopLeftRadius: 0,
                                                    borderBottomLeftRadius: 0
                                                  }}
                                                  onClick={() => handleDelete(avail.id)}
                                                >
                                                  {t('delete')}
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
