import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Alert } from '../../components/Common/index.jsx';
import { useForm } from '../../hooks/useForm.js';
import { blockedDateService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';

const INITIAL_FORM_DATA = {
  startDate: '',
  endDate: '',
  startTime: '08:00',
  endTime: '17:00',
  reason: '',
};

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const DATE_FORMAT_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' };
const TIME_FORMAT_OPTIONS = { hour: 'numeric', minute: '2-digit', hour12: true };

const formatDate = (dateStr, locale = 'en-US') => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(locale, DATE_FORMAT_OPTIONS);
};

const formatTime = (timeStr, locale = 'en-US') => {
  if (!timeStr) return '';
  const d = new Date('2000-01-01T' + timeStr);
  return isNaN(d.getTime()) ? timeStr : d.toLocaleTimeString(locale, TIME_FORMAT_OPTIONS);
};

const getDayDiff = (d1, d2) => {
  const a = new Date(Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate()));
  const b = new Date(Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate()));
  return Math.round((b - a) / MILLISECONDS_PER_DAY);
};

const canGroup = (cur, grp, diff) =>
  diff === 1 &&
  cur?.startTime === grp?.startTime &&
  cur?.endTime === grp?.endTime &&
  cur?.userId === grp?.userId &&
  (cur?.reason || '').trim() === (grp?.reason || '').trim();

const groupConsecutive = (dates) => {
  if (!dates?.length) return [];
  const sorted = [...dates].sort((a, b) => {
    const d = new Date(a.date) - new Date(b.date);
    return d !== 0 ? d : (a.startTime || '').localeCompare(b.startTime || '');
  });
  const groups = [];
  let cur = { startDate: sorted[0].date, endDate: sorted[0].date, startTime: sorted[0].startTime, endTime: sorted[0].endTime, reason: sorted[0].reason || '', userId: sorted[0].userId, userName: sorted[0].user?.name || 'Unknown', ids: [sorted[0].id] };
  for (let i = 1; i < sorted.length; i++) {
    const entry = sorted[i];
    const diff = getDayDiff(new Date(sorted[i - 1].date), new Date(entry.date));
    if (canGroup(entry, cur, diff)) {
      cur.endDate = entry.date;
      cur.ids.push(entry.id);
    } else {
      groups.push({ ...cur });
      cur = { startDate: entry.date, endDate: entry.date, startTime: entry.startTime, endTime: entry.endTime, reason: entry.reason || '', userId: entry.userId, userName: entry.user?.name || 'Unknown', ids: [entry.id] };
    }
  }
  groups.push(cur);
  return groups;
};

export const BlockedDatesManager = ({ blockedDates = [], onBlockedDateChange, isAdmin = false, employees = [] }) => {
  const { t, language } = useTranslation();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showList, setShowList] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [dateRange, setDateRange] = useState(undefined);

  const handleFormSubmit = async (data) => {
    if (!data.startDate) {
      setError(t('pleaseSelectDate'));
      return;
    }
    try {
      await blockedDateService.create(data);
      setSuccess(t('blockedDateCreatedSuccess'));
      setError(null);
      setFormData(INITIAL_FORM_DATA);
      setDateRange(undefined);
      onBlockedDateChange?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t('failedToBlockDate'));
      setSuccess(null);
    }
  };

  const { formData, handleChange, handleSubmit, setFormData } = useForm(INITIAL_FORM_DATA, handleFormSubmit);

  useEffect(() => {
    if (dateRange?.from) {
      const to = dateRange.to || dateRange.from;
      setFormData(prev => ({
        ...prev,
        startDate: dateRange.from.toISOString().split('T')[0],
        endDate: to.toISOString().split('T')[0],
      }));
    } else {
      setFormData(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  }, [dateRange, setFormData]);

  const handleDeleteGroup = async (ids) => {
    if (!ids?.length) return;
    const msg = ids.length > 1
      ? `${t('confirmUnblockDates')} ${ids.length} ${t('datesQuestion')}`
      : t('confirmDeleteBlockedDate');
    if (!window.confirm(msg)) return;
    try {
      await Promise.all(ids.map(id => blockedDateService.delete(id)));
      setSuccess(t('blockedDateDeletedSuccess'));
      setError(null);
      onBlockedDateChange?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t('failedUnblockDates'));
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredDates = useMemo(() => {
    if (!isAdmin || selectedEmployeeFilter === 'all') return blockedDates;
    return blockedDates.filter(b => b?.userId === selectedEmployeeFilter);
  }, [blockedDates, isAdmin, selectedEmployeeFilter]);

  const groups = useMemo(() => groupConsecutive(filteredDates), [filteredDates]);
  const locale = language === 'es' ? 'es-ES' : 'en-US';

  const selectedRangeLabel = dateRange?.from
    ? dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
      ? `${formatDate(dateRange.from.toISOString().split('T')[0], locale)} — ${formatDate(dateRange.to.toISOString().split('T')[0], locale)}`
      : formatDate(dateRange.from.toISOString().split('T')[0], locale)
    : null;

  return (
    <div className="p-3">
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} noValidate>
        {/* Calendar */}
        <div className="avail-calendar-wrap mb-3">
          <DayPicker
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            disabled={{ before: today }}
            showOutsideDays={false}
          />
        </div>

        {selectedRangeLabel && (
          <div className="mb-3" style={{ background: 'rgba(58,171,219,0.1)', border: '1px solid rgba(58,171,219,0.25)', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#3aabdb', fontWeight: '600' }}>
            {selectedRangeLabel}
          </div>
        )}

        <div className="row g-2 mb-2">
          <div className="col-6">
            <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('startTime')}</label>
            <input type="time" name="startTime" className="form-control form-control-sm" value={formData.startTime} onChange={handleChange} required autoComplete="off" />
          </div>
          <div className="col-6">
            <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('endTime')}</label>
            <input type="time" name="endTime" className="form-control form-control-sm" value={formData.endTime} onChange={handleChange} required autoComplete="off" />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('reasonForBlock')}</label>
          <input type="text" name="reason" className="form-control form-control-sm" value={formData.reason} onChange={handleChange} placeholder={t('reasonPlaceholder')} autoComplete="off" />
        </div>

        <button type="submit" className="btn post-update-btn w-100">
          {t('blockDate')}
        </button>
      </form>

      {/* Blocked Dates List */}
      <div className="mt-3">
        <button
          className="btn w-100 d-flex justify-content-between align-items-center p-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(58,171,219,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', fontWeight: '600' }}
          onClick={() => setShowList(v => !v)}
        >
          <span>{t('upcomingBlocks')} {groups.length > 0 && `(${groups.length})`}</span>
          {showList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence initial={false}>
          {showList && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="pt-2">
                {isAdmin && employees.length > 0 && (
                  <select
                    className="form-select form-select-sm mb-2 appointments-filter-select"
                    value={selectedEmployeeFilter}
                    onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                  >
                    <option value="all">{t('allEmployees')}</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                )}

                {groups.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', textAlign: 'center', padding: '0.75rem 0' }}>{t('noBlockedDates')}</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {groups.map((grp, i) => {
                      const dateStr = grp.startDate === grp.endDate
                        ? formatDate(grp.startDate, locale)
                        : `${formatDate(grp.startDate, locale)} – ${formatDate(grp.endDate, locale)}`;
                      const timeStr = `${formatTime(grp.startTime, locale)} – ${formatTime(grp.endTime, locale)}`;
                      return (
                        <div key={grp.ids?.[0] || i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(58,171,219,0.12)', borderRadius: '8px', padding: '0.5rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isAdmin && <div style={{ fontSize: '0.7rem', color: '#3aabdb', fontWeight: '600', marginBottom: '0.1rem' }}>{grp.userName}</div>}
                            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>{dateStr}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{timeStr}{grp.reason && ` · ${grp.reason}`}</div>
                          </div>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(220,53,69,0.15)', color: '#ff7b7b', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '6px', padding: '0.25rem 0.45rem', flexShrink: 0 }}
                            onClick={() => handleDeleteGroup(grp.ids)}
                          >
                            <Trash2 size={12} />
                          </button>
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
  );
};

BlockedDatesManager.propTypes = {
  blockedDates: PropTypes.array,
  onBlockedDateChange: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  employees: PropTypes.array,
};
