import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, CalendarOff, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from 'lucide-react';
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
const THEME_COLOR = 'rgb(5, 60, 82)';
const FILTER_ALL_VALUE = 'all';
const TIME_FORMAT_OPTIONS = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
};

export const AvailabilityManager = () => {
  const { t } = useTranslation();

  const DAYS_OF_WEEK = useMemo(() => [
    { value: 0, label: t('sundays'), short: t('sundays')[0].toUpperCase() },
    { value: 1, label: t('mondays'), short: t('mondays')[0].toUpperCase() },
    { value: 2, label: t('tuesdays'), short: t('tuesdays')[0].toUpperCase() },
    { value: 3, label: t('wednesdays'), short: t('wednesdays')[0].toUpperCase() },
    { value: 4, label: t('thursdays'), short: t('thursdays')[0].toUpperCase() },
    { value: 5, label: t('fridays'), short: t('fridays')[0].toUpperCase() },
    { value: 6, label: t('saturdays'), short: t('saturdays')[0].toUpperCase() },
  ], [t]);

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
  const [selectedDayFilter, setSelectedDayFilter] = useState(FILTER_ALL_VALUE);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [showBlockedDates, setShowBlockedDates] = useState(false);
  const [showAvailabilityList, setShowAvailabilityList] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await dataService.getEmployees();
      setEmployees(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    }
  }, []);

  const fetchAvailabilities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getAll();
      setAvailabilities(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching availabilities:', err);
      setError(t('failedToFetchAvailabilities'));
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchBlockedDates = useCallback(async () => {
    try {
      const response = await blockedDateService.getAll();
      setBlockedDates(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching blocked dates:', err);
      setBlockedDates([]);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      const adminStatus = decoded?.email === import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
      setIsAdmin(adminStatus);
      if (adminStatus) fetchEmployees();
    }
    fetchAvailabilities();
    fetchBlockedDates();
  }, [fetchEmployees, fetchAvailabilities, fetchBlockedDates]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const dayValue = parseInt(value, 10);
      setFormData(prev => ({
        ...prev,
        selectedDays: checked
          ? [...prev.selectedDays, dayValue]
          : prev.selectedDays.filter(d => d !== dayValue)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const validateAvailability = useCallback((data) => {
    if (!data.selectedDays?.length) {
      return { valid: false, error: t('selectOneDay') };
    }
    if (data.startTime >= data.endTime) {
      return { valid: false, error: t('endTimeAfterStart') };
    }
    return { valid: true, error: null };
  }, [t]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    const validation = validateAvailability(formData);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    try {
      await Promise.all(
        formData.selectedDays.map(dayOfWeek =>
          availabilityService.create({ dayOfWeek, startTime: formData.startTime, endTime: formData.endTime })
        )
      );
      setSuccess(t('availabilityAdded'));
      setFormData(DEFAULT_FORM_DATA);
      await fetchAvailabilities();
    } catch (err) {
      setError(err?.response?.data?.error || t('error'));
    }
  }, [formData, validateAvailability, fetchAvailabilities, t]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm(t('confirmDeleteAvailability'))) return;
    try {
      await availabilityService.delete(id);
      setSuccess(t('availabilityDeleted'));
      await fetchAvailabilities();
    } catch {
      setError(t('error'));
    }
  }, [fetchAvailabilities, t]);

  const handleEdit = useCallback((avail) => {
    setEditingId(avail.id);
    setEditFormData({
      startTime: avail.startTime?.substring(0, 5) || '',
      endTime: avail.endTime?.substring(0, 5) || ''
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditFormData({ startTime: '', endTime: '' });
  }, []);

  const handleUpdateSubmit = useCallback(async (id) => {
    if (editFormData.startTime >= editFormData.endTime) {
      setError(t('endTimeAfterStart'));
      return;
    }
    try {
      await availabilityService.update(id, editFormData);
      setSuccess(t('availabilityUpdated'));
      setEditingId(null);
      setEditFormData({ startTime: '', endTime: '' });
      await fetchAvailabilities();
    } catch {
      setError(t('error'));
    }
  }, [editFormData, fetchAvailabilities, t]);

  const groupedAvailabilities = useMemo(() => {
    let filtered = availabilities;
    if (isAdmin && selectedEmployeeFilter !== FILTER_ALL_VALUE) {
      filtered = filtered.filter(a => a?.user?.id === selectedEmployeeFilter);
    }
    if (isAdmin && selectedDayFilter !== FILTER_ALL_VALUE) {
      filtered = filtered.filter(a => String(a?.dayOfWeek) === selectedDayFilter);
    }
    return filtered.reduce((acc, avail) => {
      if (typeof avail?.dayOfWeek !== 'number') return acc;
      if (!acc[avail.dayOfWeek]) acc[avail.dayOfWeek] = [];
      acc[avail.dayOfWeek].push(avail);
      return acc;
    }, {});
  }, [availabilities, isAdmin, selectedEmployeeFilter, selectedDayFilter]);

  const formatTime = useCallback((timeString) => {
    if (!timeString) return '';
    const date = new Date(`2000-01-01T${timeString}`);
    return isNaN(date.getTime()) ? timeString : date.toLocaleTimeString('en-US', TIME_FORMAT_OPTIONS);
  }, []);

  const infoBoxStyle = {
    backgroundColor: 'rgba(58, 171, 219, 0.08)',
    border: '1px solid rgba(58, 171, 219, 0.35)',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    lineHeight: '1.4'
  };

  const dayGroupCardStyle = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '16px',
    border: '1px solid rgba(58, 171, 219, 0.2)',
    padding: '1rem 1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
  };

  return (
    <div className="availability-manager">
      <div className="container py-4">
        <div className="row">

          {/* Left Column: Add Availability and Block Dates */}
          <div className="col-lg-4">

            {/* Availability Form Card */}
            <div className="mb-4">
              <div className="card post-update-card shadow-sm border-0">
                <div
                  className="card-header d-flex justify-content-between align-items-center collapsible-header"
                  style={{ background: 'rgba(3, 25, 38, 0.45)', borderBottom: '1px solid rgba(70,161,161,0.2)', color: 'white', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: showAddAvailability ? '0.75rem 0.75rem 0 0' : '0.75rem' }}
                  onClick={() => setShowAddAvailability(!showAddAvailability)}
                >
                  <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
                    <Clock size={15} />
                    {t('addAvailability')}
                  </h5>
                  {showAddAvailability ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                <AnimatePresence initial={false}>
                  {showAddAvailability && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                  <div className="card-body p-4">

                    {success && (
                      <Alert message={success} type="success" onClose={() => setSuccess(null)} />
                    )}
                    {error && (
                      <Alert message={error} type="danger" onClose={() => setError(null)} />
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                      <div className="mb-3">
                        <div className="form-label fw-semibold days-of-week-header">{t('daysOfWeek')} *</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem' }}>
                          {DAYS_OF_WEEK.map(day => {
                            const isSelected = formData.selectedDays.includes(day.value);
                            return (
                              <label
                                key={day.value}
                                htmlFor={`day-${day.value}`}
                                title={day.label}
                                style={{
                                  flex: '1 1 0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '36px',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  border: isSelected ? '2px solid #3aabdb' : '2px solid #b0bec5',
                                  background: isSelected ? 'linear-gradient(135deg, rgb(5, 60, 82) 0%, #0d5c6e 100%)' : '#f5f5f5',
                                  color: isSelected ? '#fff' : 'rgb(5, 60, 82)',
                                  boxShadow: isSelected ? '0 2px 8px rgba(58, 171, 219, 0.3)' : 'none',
                                  userSelect: 'none'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  id={`day-${day.value}`}
                                  name={`day-${day.value}`}
                                  value={day.value}
                                  checked={isSelected}
                                  onChange={handleChange}
                                  style={{ display: 'none' }}
                                />
                                {day.short}
                              </label>
                            );
                          })}
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

                      <div className="d-flex justify-content-center">
                        <button
                          type="submit"
                          className="btn"
                          style={{ backgroundColor: THEME_COLOR, color: 'white', border: 'none', fontWeight: '500', fontSize: '0.88rem' }}
                        >
                          {t('addAvailability')}
                        </button>
                      </div>
                    </form>
                  </div>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mb-4" style={infoBoxStyle}>
              {t('availabilityDescription')}
            </div>

            {/* Blocked Dates Card */}
            <div className="mb-4">
              <div className="card post-update-card shadow-sm border-0">
                <div
                  className="card-header d-flex justify-content-between align-items-center collapsible-header"
                  style={{ background: 'rgba(3, 25, 38, 0.45)', borderBottom: '1px solid rgba(70,161,161,0.2)', color: 'white', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: showBlockedDates ? '0.75rem 0.75rem 0 0' : '0.75rem' }}
                  onClick={() => setShowBlockedDates(!showBlockedDates)}
                >
                  <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
                    <CalendarOff size={15} />
                    {t('blockSpecificDates')}
                  </h5>
                  {showBlockedDates ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                <AnimatePresence initial={false}>
                  {showBlockedDates && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                  <div className="card-body p-4">
                    <BlockedDatesManager
                      blockedDates={blockedDates}
                      onBlockedDateChange={fetchBlockedDates}
                      isAdmin={isAdmin}
                      employees={employees}
                    />
                  </div>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mb-4" style={infoBoxStyle}>
              {t('blockDatesDescription')}
            </div>

          </div>
          {/* End Left Column */}

          {/* Right Column: Availability List */}
          <div className="col-lg-8">
            <div className="card post-update-card shadow-sm border-0">
              <div
                className="card-header d-flex justify-content-between align-items-center collapsible-header"
                style={{ background: 'rgba(3, 25, 38, 0.45)', borderBottom: '1px solid rgba(70,161,161,0.2)', color: 'white', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: showAvailabilityList ? '0.75rem 0.75rem 0 0' : '0.75rem' }}
                onClick={() => setShowAvailabilityList(!showAvailabilityList)}
              >
                <h5 className="mb-0" style={{ fontSize: '1rem' }}>{isAdmin ? t('allAvailability') : t('yourAvailability')}</h5>
                {showAvailabilityList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <AnimatePresence initial={false}>
                {showAvailabilityList && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                      {isAdmin && employees.length > 0 && (
                        <div className="d-flex align-items-center gap-2">
                          <label htmlFor="availabilityEmployeeFilter" className="form-label mb-0" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{t('employee')}:</label>
                          <select
                            id="availabilityEmployeeFilter"
                            name="availabilityEmployeeFilter"
                            className="form-select form-select-sm appointments-filter-select"
                            style={{ width: 'auto' }}
                            value={selectedEmployeeFilter}
                            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                            autoComplete="off"
                          >
                            <option value="all">{t('allEmployees')}</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="d-flex align-items-center gap-2">
                        <label htmlFor="availabilityDayFilter" className="form-label mb-0" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{t('day')}:</label>
                        <select
                          id="availabilityDayFilter"
                          name="availabilityDayFilter"
                          className="form-select form-select-sm appointments-filter-select"
                          style={{ width: 'auto' }}
                          value={selectedDayFilter}
                          onChange={(e) => setSelectedDayFilter(e.target.value)}
                          autoComplete="off"
                        >
                          <option value="all">{t('allDays')}</option>
                          {DAYS_OF_WEEK.map(day => (
                            <option key={day.value} value={String(day.value)}>{day.label}</option>
                          ))}
                        </select>
                      </div>
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
                            <div key={dayNum} className="mb-4" style={dayGroupCardStyle}>
                              <h6 className="fw-bold mb-3" style={{ color: '#fff', fontSize: '1.1rem' }}>{dayName}</h6>

                              {!isMobile ? (
                                <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                  <table className="table table-hover align-middle" style={{ tableLayout: 'auto', width: '100%' }}>
                                    <thead>
                                      <tr style={{ borderBottom: `2px solid rgba(70,161,161,0.4)` }}>
                                        {isAdmin && <th style={{ fontWeight: '500', color: '#3aabdb', padding: '8px' }}>{t('employee')}</th>}
                                        <th style={{ fontWeight: '500', color: '#3aabdb', padding: '8px' }}>{t('startTime')}</th>
                                        <th style={{ fontWeight: '500', color: '#3aabdb', padding: '8px' }}>{t('endTime')}</th>
                                        <th style={{ fontWeight: '500', color: '#3aabdb', padding: '8px' }}>{t('actions')}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {groupedAvailabilities[dayNum]
                                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                        .map(avail => (
                                          <tr key={avail.id} style={{ color: 'rgba(255,255,255,0.85)' }}>
                                            {isAdmin && <td className="fw-bold" style={{ color: '#3aabdb', padding: '8px' }}>{avail?.user?.name || 'Unknown'}</td>}
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
                                              ) : formatTime(avail.startTime)}
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
                                              ) : formatTime(avail.endTime)}
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                              {editingId === avail.id ? (
                                                <div className="d-flex align-items-center gap-1">
                                                  <button
                                                    className="btn btn-sm d-flex align-items-center gap-1"
                                                    style={{ color: '#fff', background: '#3aabdb', border: 'none', borderRadius: '6px' }}
                                                    onClick={() => handleUpdateSubmit(avail.id)}
                                                  >
                                                    <Check size={13} />
                                                    {t('save')}
                                                  </button>
                                                  <button
                                                    className="btn btn-sm d-flex align-items-center gap-1"
                                                    style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px' }}
                                                    onClick={handleCancelEdit}
                                                  >
                                                    <X size={13} />
                                                    {t('cancel')}
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="d-flex align-items-center gap-1">
                                                  <button
                                                    className="btn btn-sm d-flex align-items-center gap-1"
                                                    style={{ color: '#fff', background: THEME_COLOR, border: '1px solid rgba(70,161,161,0.4)', borderRadius: '6px' }}
                                                    onClick={() => handleEdit(avail)}
                                                  >
                                                    <Pencil size={12} />
                                                    {t('edit')}
                                                  </button>
                                                  <button
                                                    className="btn btn-sm d-flex align-items-center gap-1"
                                                    style={{ color: '#fff', background: 'rgba(220,53,69,0.75)', border: 'none', borderRadius: '6px' }}
                                                    onClick={() => handleDelete(avail.id)}
                                                  >
                                                    <Trash2 size={12} />
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
                                <div>
                                  {groupedAvailabilities[dayNum]
                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                    .map(avail => (
                                      <div key={avail.id} className="card mb-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(70,161,161,0.3)', borderRadius: '12px' }}>
                                        <div className="card-body p-3">
                                          {isAdmin && (
                                            <div className="mb-2">
                                              <small style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>{t('employee')}</small>
                                              <strong style={{ color: '#3aabdb' }}>{avail?.user?.name || 'Unknown'}</strong>
                                            </div>
                                          )}

                                          {editingId === avail.id ? (
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
                                                  className="btn d-flex align-items-center justify-content-center gap-1"
                                                  style={{ backgroundColor: '#3aabdb', color: '#fff', border: 'none' }}
                                                  onClick={() => handleUpdateSubmit(avail.id)}
                                                >
                                                  <Check size={14} />
                                                  {t('save')}
                                                </button>
                                                <button
                                                  className="btn d-flex align-items-center justify-content-center gap-1"
                                                  style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                                                  onClick={handleCancelEdit}
                                                >
                                                  <X size={14} />
                                                  {t('cancel')}
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              <div className="d-flex align-items-center mb-2">
                                                <div className="me-3">
                                                  <small style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>{t('startTime')}</small>
                                                  <strong style={{ color: '#fff' }}>{formatTime(avail.startTime)}</strong>
                                                </div>
                                                <div className="me-3">
                                                  <small style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>{t('endTime')}</small>
                                                  <strong style={{ color: '#fff' }}>{formatTime(avail.endTime)}</strong>
                                                </div>
                                                <div className="d-flex align-items-center gap-1 ms-auto">
                                                  <button
                                                    className="btn btn-sm d-flex align-items-center gap-1"
                                                    style={{ color: '#fff', background: THEME_COLOR, border: '1px solid rgba(70,161,161,0.4)', borderRadius: '6px' }}
                                                    onClick={() => handleEdit(avail)}
                                                  >
                                                    <Pencil size={12} />
                                                    {t('edit')}
                                                  </button>
                                                  <button
                                                    className="btn btn-sm d-flex align-items-center gap-1"
                                                    style={{ color: '#fff', background: 'rgba(220,53,69,0.75)', border: 'none', borderRadius: '6px' }}
                                                    onClick={() => handleDelete(avail.id)}
                                                  >
                                                    <Trash2 size={12} />
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
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* End Right Column */}

        </div>
      </div>
    </div>
  );
};
