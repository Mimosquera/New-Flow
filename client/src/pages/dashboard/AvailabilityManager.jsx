import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, CalendarOff, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from 'lucide-react';
import { Alert } from '../../components/Common/index.jsx';
import { availabilityService, dataService, blockedDateService } from '../../services/api.js';
import { decodeToken, getToken } from '../../utils/tokenUtils.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { BlockedDatesManager } from './BlockedDatesManager.jsx';

const DEFAULT_FORM = { selectedDays: [], startTime: '08:00', endTime: '21:00' };
const TIME_OPTS = { hour: 'numeric', minute: '2-digit', hour12: true };

export const AvailabilityManager = () => {
  const { t } = useTranslation();

  const DAYS = useMemo(() => [
    { value: 0, label: t('sundays'),    short: 'Su' },
    { value: 1, label: t('mondays'),    short: 'Mo' },
    { value: 2, label: t('tuesdays'),   short: 'Tu' },
    { value: 3, label: t('wednesdays'), short: 'We' },
    { value: 4, label: t('thursdays'),  short: 'Th' },
    { value: 5, label: t('fridays'),    short: 'Fr' },
    { value: 6, label: t('saturdays'),  short: 'Sa' },
  ], [t]);

  const [availabilities, setAvailabilities] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ startTime: '', endTime: '' });
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState([]);
  const [dayFilter, setDayFilter] = useState([]);
  const [activeTab, setActiveTab] = useState('schedule');
  const [showSchedule, setShowSchedule] = useState(true);
  const [showEmployeeChips, setShowEmployeeChips] = useState(false);
  const [showDayChips, setShowDayChips] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await dataService.getEmployees();
      setEmployees(res?.data?.data || []);
    } catch { setEmployees([]); }
  }, []);

  const fetchAvailabilities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await availabilityService.getAll();
      setAvailabilities(res?.data?.data || []);
    } catch {
      setError(t('failedToFetchAvailabilities'));
      setAvailabilities([]);
    } finally { setLoading(false); }
  }, [t]);

  const fetchBlockedDates = useCallback(async () => {
    try {
      const res = await blockedDateService.getAll();
      setBlockedDates(res?.data?.data || []);
    } catch { setBlockedDates([]); }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      const admin = decoded?.email === import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
      setIsAdmin(admin);
      if (admin) fetchEmployees();
    }
    fetchAvailabilities();
    fetchBlockedDates();
  }, [fetchEmployees, fetchAvailabilities, fetchBlockedDates]);

  const handleDayToggle = useCallback((dayValue) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayValue)
        ? prev.selectedDays.filter(d => d !== dayValue)
        : [...prev.selectedDays, dayValue],
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    if (!formData.selectedDays.length) { setError(t('selectOneDay')); return; }
    if (formData.startTime >= formData.endTime) { setError(t('endTimeAfterStart')); return; }
    try {
      await Promise.all(
        formData.selectedDays.map(day =>
          availabilityService.create({ dayOfWeek: day, startTime: formData.startTime, endTime: formData.endTime })
        )
      );
      setSuccess(t('availabilityAdded'));
      setFormData(DEFAULT_FORM);
      await fetchAvailabilities();
    } catch (err) {
      setError(err?.response?.data?.error || t('error'));
    }
  }, [formData, fetchAvailabilities, t]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm(t('confirmDeleteAvailability'))) return;
    try {
      await availabilityService.delete(id);
      setSuccess(t('availabilityDeleted'));
      await fetchAvailabilities();
    } catch { setError(t('error')); }
  }, [fetchAvailabilities, t]);

  const handleEdit = useCallback((avail) => {
    setEditingId(avail.id);
    setEditForm({ startTime: avail.startTime?.substring(0, 5) || '', endTime: avail.endTime?.substring(0, 5) || '' });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({ startTime: '', endTime: '' });
  }, []);

  const handleUpdateSubmit = useCallback(async (id) => {
    if (editForm.startTime >= editForm.endTime) { setError(t('endTimeAfterStart')); return; }
    try {
      await availabilityService.update(id, editForm);
      setSuccess(t('availabilityUpdated'));
      setEditingId(null);
      setEditForm({ startTime: '', endTime: '' });
      await fetchAvailabilities();
    } catch { setError(t('error')); }
  }, [editForm, fetchAvailabilities, t]);

  const formatTime = useCallback((ts) => {
    if (!ts) return '';
    const d = new Date(`2000-01-01T${ts}`);
    return isNaN(d.getTime()) ? ts : d.toLocaleTimeString('en-US', TIME_OPTS);
  }, []);

  const toggleEmployeeFilter = useCallback((id) => {
    setEmployeeFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleDayFilter = useCallback((val) => {
    setDayFilter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }, []);

  const grouped = useMemo(() => {
    let list = availabilities;
    if (isAdmin && employeeFilter.length > 0) list = list.filter(a => employeeFilter.includes(a?.user?.id));
    if (isAdmin && dayFilter.length > 0) list = list.filter(a => dayFilter.includes(String(a?.dayOfWeek)));
    return list.reduce((acc, a) => {
      if (typeof a?.dayOfWeek !== 'number') return acc;
      if (!acc[a.dayOfWeek]) acc[a.dayOfWeek] = [];
      acc[a.dayOfWeek].push(a);
      return acc;
    }, {});
  }, [availabilities, isAdmin, employeeFilter, dayFilter]);

  const tabBtnStyle = (active) => ({
    flex: 1,
    background: active ? 'rgba(58,171,219,0.18)' : 'transparent',
    color: active ? '#3aabdb' : 'rgba(255,255,255,0.45)',
    border: active ? '1px solid rgba(58,171,219,0.35)' : '1px solid transparent',
    borderRadius: '8px',
    padding: '0.4rem 0.5rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    transition: 'all 0.18s ease',
    cursor: 'pointer',
  });

  return (
    <div className="container py-4">
      <div className="row g-4 align-items-start justify-content-center">

        {/* Left: Edit Availability (combined card) */}
        <div className="col-12 col-lg-5">
          <div className="card post-update-card shadow-sm">
            <div style={{ background: 'rgba(3,25,38,0.45)', borderBottom: '1px solid rgba(70,161,161,0.2)', padding: '0.75rem 1rem', borderRadius: '0.75rem 0.75rem 0 0' }}>
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1rem', color: '#fff', fontWeight: '700' }}>
                <Clock size={15} />
                {t('editAvailability')}
              </h5>
            </div>

            {/* Segmented tab control */}
            <div style={{ padding: '0.65rem 0.75rem 0.65rem', display: 'flex', gap: '0.35rem', background: 'rgba(3,25,38,0.2)' }}>
              <button style={tabBtnStyle(activeTab === 'schedule')} onClick={() => setActiveTab('schedule')}>
                <Clock size={13} /> {t('scheduleTab')}
              </button>
              <button style={tabBtnStyle(activeTab === 'blocked')} onClick={() => setActiveTab('blocked')}>
                <CalendarOff size={13} /> {t('blockDatesTab')}
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'schedule' ? (
                <motion.div key="schedule" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
                  <div className="p-3">
                    {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}
                    {error && <Alert message={error} type="danger" onClose={() => setError(null)} />}

                    <form onSubmit={handleSubmit} noValidate>
                      <div className="mb-3">
                        <div className="form-label" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.45rem' }}>{t('daysOfWeek')}</div>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {DAYS.map(day => {
                            const sel = formData.selectedDays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                title={day.label}
                                onClick={() => handleDayToggle(day.value)}
                                style={{
                                  flex: '1 1 0',
                                  height: '40px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  border: sel ? '2px solid #3aabdb' : '1px solid rgba(255,255,255,0.15)',
                                  background: sel ? 'rgba(58,171,219,0.2)' : 'rgba(255,255,255,0.04)',
                                  color: sel ? '#3aabdb' : 'rgba(255,255,255,0.45)',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {day.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label htmlFor="startTime" className="form-label" style={{ fontSize: '0.78rem' }}>{t('startTime')}</label>
                          <input id="startTime" type="time" name="startTime" className="form-control" value={formData.startTime} onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))} required autoComplete="off" />
                        </div>
                        <div className="col-6">
                          <label htmlFor="endTime" className="form-label" style={{ fontSize: '0.78rem' }}>{t('endTime')}</label>
                          <input id="endTime" type="time" name="endTime" className="form-control" value={formData.endTime} onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))} required autoComplete="off" />
                        </div>
                      </div>

                      <button type="submit" className="btn post-update-btn w-100">{t('addAvailability')}</button>
                    </form>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="blocked" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                  <BlockedDatesManager
                    blockedDates={blockedDates}
                    onBlockedDateChange={fetchBlockedDates}
                    isAdmin={isAdmin}
                    employees={employees}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Your Schedule (compact) */}
        <div className="col-12 col-lg-5">
          <div className="card post-update-card shadow-sm">
            <div
              className="d-flex justify-content-between align-items-center collapsible-header"
              style={{ background: 'rgba(3,25,38,0.45)', borderBottom: showSchedule ? '1px solid rgba(70,161,161,0.2)' : 'none', color: 'white', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: showSchedule ? '0.75rem 0.75rem 0 0' : '0.75rem' }}
              onClick={() => setShowSchedule(v => !v)}
            >
              <h5 className="mb-0" style={{ fontSize: '1rem', fontWeight: '700' }}>
                {isAdmin ? t('allAvailability') : t('yourAvailability')}
              </h5>
              {showSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            <AnimatePresence initial={false}>
              {showSchedule && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="p-3">
                    {/* Filters */}
                    {isAdmin && (
                      <div className="mb-3 d-flex flex-column gap-1">
                        {employees.length > 0 && (
                          <div>
                            <button
                              type="button"
                              onClick={() => setShowEmployeeChips(v => !v)}
                              style={{ background: 'none', border: 'none', outline: 'none', boxShadow: 'none', padding: '0.3rem 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: employeeFilter.length > 0 ? '#3aabdb' : 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: '600' }}
                            >
                              <span>{t('allEmployees')}{employeeFilter.length > 0 && ` (${employeeFilter.length})`}</span>
                              {showEmployeeChips ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                            <AnimatePresence initial={false}>
                              {showEmployeeChips && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingTop: '0.35rem', paddingBottom: '0.25rem' }}>
                                    {employees.map(emp => {
                                      const sel = employeeFilter.includes(emp.id);
                                      return (
                                        <button
                                          key={emp.id}
                                          type="button"
                                          onClick={() => toggleEmployeeFilter(emp.id)}
                                          style={{
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            border: sel ? '1.5px solid #3aabdb' : '1px solid rgba(255,255,255,0.15)',
                                            background: sel ? 'rgba(58,171,219,0.2)' : 'rgba(255,255,255,0.04)',
                                            color: sel ? '#3aabdb' : 'rgba(255,255,255,0.45)',
                                            transition: 'all 0.15s ease',
                                          }}
                                        >
                                          {emp.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowDayChips(v => !v)}
                            style={{ background: 'none', border: 'none', outline: 'none', boxShadow: 'none', padding: '0.3rem 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: dayFilter.length > 0 ? '#3aabdb' : 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: '600' }}
                          >
                            <span>{t('allDays')}{dayFilter.length > 0 && ` (${dayFilter.length})`}</span>
                            {showDayChips ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                          <AnimatePresence initial={false}>
                            {showDayChips && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingTop: '0.35rem', paddingBottom: '0.25rem' }}>
                                  {DAYS.map(d => {
                                    const sel = dayFilter.includes(String(d.value));
                                    return (
                                      <button
                                        key={d.value}
                                        type="button"
                                        onClick={() => toggleDayFilter(String(d.value))}
                                        style={{
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          border: sel ? '1.5px solid #3aabdb' : '1px solid rgba(255,255,255,0.15)',
                                          background: sel ? 'rgba(58,171,219,0.2)' : 'rgba(255,255,255,0.04)',
                                          color: sel ? '#3aabdb' : 'rgba(255,255,255,0.45)',
                                          transition: 'all 0.15s ease',
                                          minWidth: '36px',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {d.short}
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {loading ? (
                      <div className="d-flex flex-column gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="sk-card p-2" style={{ animationDelay: `${i * 0.08}s`, borderRadius: '8px' }}>
                            <div className="d-flex gap-2">
                              <span className="sk" style={{ height: '13px', width: '45px', animationDelay: `${i * 0.08}s` }} />
                              <span className="sk" style={{ height: '13px', width: '130px', animationDelay: `${i * 0.08}s` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : availabilities.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>{t('noAvailability')}</p>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {DAYS.map(day => {
                          const entries = grouped[day.value];
                          return (
                            <div key={day.value}>
                              {/* Day header */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: entries?.length ? '#3aabdb' : 'rgba(255,255,255,0.2)', minWidth: '28px' }}>
                                  {day.short}
                                </div>
                                <div style={{ flex: 1, height: '1px', background: entries?.length ? 'rgba(58,171,219,0.15)' : 'rgba(255,255,255,0.05)' }} />
                                {!entries?.length && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)' }}>{t('closed')}</span>}
                              </div>

                              {/* Entries */}
                              {entries?.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(avail => (
                                <div key={avail.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.2rem', border: '1px solid rgba(58,171,219,0.08)' }}>
                                  {isAdmin && (
                                    <span style={{ fontSize: '0.7rem', color: '#3aabdb', fontWeight: '600', minWidth: '64px', flexShrink: 0 }}>
                                      {avail.user?.name}
                                    </span>
                                  )}

                                  {editingId === avail.id ? (
                                    <>
                                      <input type="time" className="form-control form-control-sm" style={{ maxWidth: '110px' }} value={editForm.startTime} onChange={e => setEditForm(p => ({ ...p, startTime: e.target.value }))} autoComplete="off" />
                                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>–</span>
                                      <input type="time" className="form-control form-control-sm" style={{ maxWidth: '110px' }} value={editForm.endTime} onChange={e => setEditForm(p => ({ ...p, endTime: e.target.value }))} autoComplete="off" />
                                      <div className="d-flex gap-1 ms-auto">
                                        <button className="btn btn-sm" style={{ background: 'rgba(58,171,219,0.2)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.4)', borderRadius: '6px', padding: '0.25rem 0.45rem' }} onClick={() => handleUpdateSubmit(avail.id)}><Check size={12} /></button>
                                        <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '0.25rem 0.45rem' }} onClick={handleCancelEdit}><X size={12} /></button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <span style={{ flex: 1, fontSize: '0.85rem', color: 'rgba(255,255,255,0.82)', fontWeight: '500' }}>
                                        {formatTime(avail.startTime)} <span style={{ color: 'rgba(255,255,255,0.3)' }}>–</span> {formatTime(avail.endTime)}
                                      </span>
                                      <div className="d-flex gap-1">
                                        <button className="btn btn-sm" style={{ background: 'rgba(58,171,219,0.1)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.25)', borderRadius: '6px', width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleEdit(avail)}><Pencil size={12} /></button>
                                        <button className="btn btn-sm" style={{ background: 'rgba(220,53,69,0.12)', color: '#ff7b7b', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '6px', width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleDelete(avail.id)}><Trash2 size={12} /></button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
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

      </div>
    </div>
  );
};
