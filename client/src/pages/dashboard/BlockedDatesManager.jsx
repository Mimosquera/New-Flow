import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Alert, FormInput } from '../../components/Common/index.jsx';
import { useForm } from '../../hooks/useForm.js';
import { blockedDateService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';

// Constants
const INITIAL_FORM_DATA = {
  startDate: '',
  endDate: '',
  startTime: '08:00',
  endTime: '17:00',
  reason: '',
};

const THEME_COLOR = 'rgb(5, 60, 82)';
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

const formatDate = (dateStr, locale = 'en-US') => {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr + 'T00:00:00');
  return isNaN(dateObj.getTime()) ? dateStr : dateObj.toLocaleDateString(locale, DATE_FORMAT_OPTIONS);
};

const formatTime = (timeStr, locale = 'en-US') => {
  if (!timeStr) return '';
  const timeObj = new Date(DATE_TIME_REFERENCE + timeStr);
  return isNaN(timeObj.getTime()) ? timeStr : timeObj.toLocaleTimeString(locale, TIME_FORMAT_OPTIONS);
};

const getDayDifference = (date1, date2) => {
  // Normalize to UTC midnight to avoid timezone issues
  const d1 = new Date(Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate()));
  const d2 = new Date(Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate()));
  return Math.round((d2 - d1) / MILLISECONDS_PER_DAY);
};

const canGroupEntries = (current, group, dayDiff) => {
  if (dayDiff !== 1) return false;
  if (current?.startTime !== group?.startTime) return false;
  if (current?.endTime !== group?.endTime) return false;
  
  if (current?.userId !== group?.userId) return false;

  const currentReason = (current?.reason || '').trim();
  const groupReason = (group?.reason || '').trim();
  
  return currentReason === groupReason;
};

const groupConsecutiveBlocks = (blockedDates) => {
  if (!Array.isArray(blockedDates) || blockedDates.length === 0) {
    return [];
  }

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
};

export const BlockedDatesManager = ({ blockedDates = [], onBlockedDateChange, isAdmin = false, employees = [] }) => {
  const { t, language } = useTranslation();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showBlockedDates, setShowBlockedDates] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');

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
      const errorMessage = err?.response?.data?.error || err?.message || t('failedToBlockDate');
      setError(errorMessage);
      setSuccess(null);
      console.error('Error creating blocked dates:', err);
    }
  };

  const { formData, handleChange, handleSubmit, setFormData } = useForm(
    INITIAL_FORM_DATA,
    handleFormSubmit
  );

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
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="card post-update-card mb-4 shadow-sm block-date-card-border" style={{ background: 'rgba(255,255,255,0.05)' }}>
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
              <div className="col-12 d-flex justify-content-center">
                <button
                  type="submit"
                  className="btn"
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
                            className="btn btn-sm btn-outline-danger mt-2"
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
