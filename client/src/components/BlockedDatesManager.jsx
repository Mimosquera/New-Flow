import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Alert, FormInput } from './Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { blockedDateService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';

// Constants
const INITIAL_FORM_DATA = {
  startDate: '',
  endDate: '',
  startTime: '08:00',
  endTime: '17:00',
  reason: '',
};

const THEME_COLOR = 'rgb(5, 45, 63)';
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const DATE_TIME_REFERENCE = '2000-01-01T';

const DATE_FORMAT_OPTIONS = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

const TIME_FORMAT_OPTIONS = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

/**
 * Safely format a date string to a readable format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} locale - Locale for formatting (e.g., 'en-US', 'es-ES')
 * @returns {string} Formatted date string
 */
const formatDate = (dateStr, locale = 'en-US') => {
  try {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00');
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString(locale, DATE_FORMAT_OPTIONS);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

/**
 * Safely format a time string to a readable format
 * @param {string} timeStr - Time string in HH:MM format
 * @param {string} locale - Locale for formatting (e.g., 'en-US', 'es-ES')
 * @returns {string} Formatted time string
 */
const formatTime = (timeStr, locale = 'en-US') => {
  try {
    if (!timeStr) return '';
    const timeObj = new Date(DATE_TIME_REFERENCE + timeStr);
    if (isNaN(timeObj.getTime())) return timeStr;
    return timeObj.toLocaleTimeString(locale, TIME_FORMAT_OPTIONS);
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr;
  }
};

/**
 * Calculate the difference in days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days between dates
 */
const getDayDifference = (date1, date2) => {
  // Normalize to UTC midnight to avoid timezone issues
  const d1 = new Date(Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate()));
  const d2 = new Date(Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate()));
  return Math.round((d2 - d1) / MILLISECONDS_PER_DAY);
};

/**
 * Check if two blocked date entries can be grouped together
 * @param {Object} current - Current blocked date entry
 * @param {Object} group - Current group being built
 * @param {number} dayDiff - Difference in days
 * @returns {boolean} Whether entries can be grouped
 */
const canGroupEntries = (current, group, dayDiff) => {
  if (dayDiff !== 1) return false;
  if (current?.startTime !== group?.startTime) return false;
  if (current?.endTime !== group?.endTime) return false;
  
  // Check if userId matches (for proper grouping per employee)
  if (current?.userId !== group?.userId) return false;
  
  // Normalize reasons for comparison (treat null, undefined, and empty string as equivalent)
  const currentReason = (current?.reason || '').trim();
  const groupReason = (group?.reason || '').trim();
  
  return currentReason === groupReason;
};

/**
 * Group consecutive blocked dates with the same time range and reason
 * @param {Array} blockedDates - Array of blocked date objects
 * @returns {Array} Array of grouped blocked date ranges
 */
const groupConsecutiveBlocks = (blockedDates) => {
  if (!Array.isArray(blockedDates) || blockedDates.length === 0) {
    return [];
  }

  try {
    const sorted = [...blockedDates].sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    const groups = [];
    let currentGroup = {
      startDate: sorted[0].date,
      endDate: sorted[0].date,
      startTime: sorted[0].startTime,
      endTime: sorted[0].endTime,
      reason: sorted[0].reason || '',
      userId: sorted[0].userId,
      userName: sorted[0].user?.name || 'Unknown',
      ids: [sorted[0].id],
    };

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prevDate = new Date(sorted[i - 1].date);
      const currentDate = new Date(current.date);
      const dayDiff = getDayDifference(prevDate, currentDate);

      if (canGroupEntries(current, currentGroup, dayDiff)) {
        currentGroup.endDate = current.date;
        currentGroup.ids.push(current.id);
      } else {
        groups.push({ ...currentGroup });
        currentGroup = {
          startDate: current.date,
          endDate: current.date,
          startTime: current.startTime,
          endTime: current.endTime,
          reason: current.reason || '',
          userId: current.userId,
          userName: current.user?.name || 'Unknown',
          ids: [current.id],
        };
      }
    }
    
    groups.push(currentGroup);
    return groups;
  } catch (error) {
    console.error('Error grouping consecutive blocks:', error);
    return [];
  }
};

/**
 * BlockedDatesManager Component
 * Manages blocking and unblocking date ranges for employee unavailability
 * @param {Object} props - Component props
 * @param {Array} props.blockedDates - Array of blocked date objects
 * @param {Function} props.onBlockedDateChange - Callback when blocked dates change
 * @param {boolean} props.isAdmin - Whether current user is admin
 * @param {Array} props.employees - Array of employee objects (for admin filtering)
 */

export const BlockedDatesManager = ({ blockedDates = [], onBlockedDateChange, isAdmin = false, employees = [] }) => {
  const { t, language } = useTranslation();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showBlockedDates, setShowBlockedDates] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');

  /**
   * Handle form submission to create blocked date range
   */
  const handleFormSubmit = async (data) => {
    try {
      await blockedDateService.create(data);
      setSuccess(t('blockedDateCreatedSuccess'));
      setError(null);
      setFormData(INITIAL_FORM_DATA);
      if (typeof onBlockedDateChange === 'function') {
        onBlockedDateChange();
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to block date';
      setError(errorMessage);
      setSuccess(null);
      console.error('Error creating blocked dates:', err);
    }
  };

  const { formData, handleChange, handleSubmit, setFormData } = useForm(
    INITIAL_FORM_DATA,
    handleFormSubmit
  );

  /**
   * Handle deletion of a group of blocked dates
   * @param {Array<string>} ids - Array of blocked date IDs to delete
   */
  const handleDeleteGroup = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      console.warn('No IDs provided for deletion');
      return;
    }

    const count = ids.length;
    const confirmMessage = count > 1 
      ? `${t('confirmUnblockDates')} ${count} ${t('datesQuestion')}`
      : t('confirmDeleteBlockedDate');
    
    if (!window.confirm(confirmMessage)) return;

    try {
      await Promise.all(ids.map(id => blockedDateService.delete(id)));
      setSuccess(t('blockedDateDeletedSuccess'));
      setError(null);
      if (typeof onBlockedDateChange === 'function') {
        onBlockedDateChange();
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.message || t('failedUnblockDates');
      setError(errorMessage);
      setSuccess(null);
      console.error('Error deleting blocked dates:', err);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  
  // Filter blocked dates by selected employee if admin
  const filteredBlockedDates = useMemo(() => {
    if (!isAdmin || selectedEmployeeFilter === 'all') {
      return blockedDates;
    }
    return blockedDates.filter(blocked => blocked?.userId === selectedEmployeeFilter);
  }, [blockedDates, isAdmin, selectedEmployeeFilter]);
  
  const consecutiveGroups = useMemo(
    () => groupConsecutiveBlocks(filteredBlockedDates), 
    [filteredBlockedDates]
  );

  const hasBlockedDates = Array.isArray(filteredBlockedDates) && filteredBlockedDates.length > 0;

  return (
    <>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="card post-update-card mb-4 shadow-sm border-0 block-date-card-border">
        <div className="card-body p-3">
          <h6 className="mb-3 block-date-title" style={{ color: 'white' }}>
            {t('blockDateAndTime')}
          </h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-6">
                <FormInput
                  label={t('startDate')}
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  min={today}
                  autocomplete="off"
                />
              </div>
              <div className="col-6">
                <FormInput
                  label={t('endDate')}
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.startDate || today}
                  autocomplete="off"
                />
              </div>
              <div className="col-6">
                <FormInput
                  label={t('startTime')}
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  autocomplete="off"
                />
              </div>
              <div className="col-6">
                <FormInput
                  label={t('endTime')}
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  autocomplete="off"
                />
              </div>
              <div className="col-12">
                <FormInput
                  label={t('reasonForBlock')}
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder={t('reasonPlaceholder')}
                  autocomplete="off"
                />
              </div>
              <div className="col-12">
                <button
                  type="submit"
                  className="btn w-100"
                  style={{
                    backgroundColor: THEME_COLOR,
                    color: 'white',
                    fontWeight: '500',
                  }}
                >
                  {t('blockDate')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div>
        <div 
          onClick={() => setShowBlockedDates(!showBlockedDates)}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}
        >
          <h6 className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '600', color: THEME_COLOR }}>
            {t('blockedDates')}
          </h6>
          <span style={{ fontSize: '1.2rem', color: THEME_COLOR, fontWeight: 'bold' }}>
            {showBlockedDates ? '−' : '+'}
          </span>
        </div>
        
        {showBlockedDates && (
          <>
            {/* Admin Employee Filter */}
            {isAdmin && employees.length > 0 && (
              <div className="mb-3">
                <select
                  id="employeeFilter"
                  name="employeeFilter"
                  className="form-select form-select-sm"
                  style={{ maxWidth: '300px' }}
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
            
            {!hasBlockedDates ? (
              <div className="text-center py-4">
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  {t('noBlockedDates')}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="d-none d-md-block table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${THEME_COLOR}` }}>
                        {isAdmin && (
                          <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px', fontSize: '0.85rem' }}>
                            {t('employee')}
                          </th>
                        )}
                        <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px', fontSize: '0.85rem' }}>
                          {t('dateRange')}
                        </th>
                        <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px', fontSize: '0.85rem' }}>
                          {t('timeRange')}
                        </th>
                        <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px', fontSize: '0.85rem' }}>
                          {t('reason')}
                        </th>
                        <th style={{ fontWeight: '500', color: THEME_COLOR, padding: '8px', fontSize: '0.85rem' }}>
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consecutiveGroups.map((group, index) => {
                        if (!group) return null;

                        const locale = language === 'es' ? 'es-ES' : 'en-US';
                        const dateRangeStr = group.startDate === group.endDate
                          ? formatDate(group.startDate, locale)
                          : `${formatDate(group.startDate, locale)} - ${formatDate(group.endDate, locale)}`;

                        const timeRangeStr = `${formatTime(group.startTime, locale)} - ${formatTime(group.endTime, locale)}`;

                        return (
                          <tr key={group.ids?.[0] || index}>
                            {isAdmin && (
                              <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '500', color: THEME_COLOR }}>
                                {group.userName || t('unknown')}
                              </td>
                            )}
                            <td style={{ padding: '8px', fontSize: '0.85rem' }}>{dateRangeStr}</td>
                            <td style={{ padding: '8px', fontSize: '0.85rem' }}>{timeRangeStr}</td>
                            <td style={{ padding: '8px', fontSize: '0.85rem' }}>
                              {group.reason || <span className="text-muted">—</span>}
                            </td>
                            <td style={{ padding: '8px' }}>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                onClick={() => handleDeleteGroup(group.ids)}
                                disabled={!group.ids || group.ids.length === 0}
                              >
                                {t('unblock')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-md-none">
                  {consecutiveGroups.map((group, index) => {
                    if (!group) return null;

                    const locale = language === 'es' ? 'es-ES' : 'en-US';
                    const dateRangeStr = group.startDate === group.endDate
                      ? formatDate(group.startDate, locale)
                      : `${formatDate(group.startDate, locale)} - ${formatDate(group.endDate, locale)}`;

                    const timeRangeStr = `${formatTime(group.startTime, locale)} - ${formatTime(group.endTime, locale)}`;

                    return (
                      <div key={group.ids?.[0] || index} className="card post-update-card mb-2 shadow-sm border-0">
                        <div className="card-body p-3">
                          {isAdmin && (
                            <div className="mb-2">
                              <small className="text-muted d-block">{t('employee')}</small>
                              <strong style={{ color: THEME_COLOR }}>{group.userName || t('unknown')}</strong>
                            </div>
                          )}
                          <div className="mb-2">
                            <small className="text-muted d-block">{t('dateRange')}</small>
                            <strong>{dateRangeStr}</strong>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted d-block">{t('timeRange')}</small>
                            <strong>{timeRangeStr}</strong>
                          </div>
                          {group.reason && (
                            <div className="mb-2">
                              <small className="text-muted d-block">{t('reason')}</small>
                              <span>{group.reason}</span>
                            </div>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger w-100 mt-2"
                            onClick={() => handleDeleteGroup(group.ids)}
                            disabled={!group.ids || group.ids.length === 0}
                          >
                            {t('unblock')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

BlockedDatesManager.propTypes = {
  blockedDates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      reason: PropTypes.string,
      userId: PropTypes.string,
      user: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
      }),
    })
  ),
  onBlockedDateChange: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
    })
  ),
};
