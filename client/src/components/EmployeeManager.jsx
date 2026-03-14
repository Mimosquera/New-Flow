import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserPlus, Users, ChevronDown, ChevronUp, Key, UserMinus } from 'lucide-react';
import { Alert } from './Common/index.jsx';
import { authService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { hapticSuccess, hapticWarning } from '../utils/haptics.js';

const THEME_COLOR = 'rgb(5, 45, 63)';

export const EmployeeManager = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [alerts, setAlerts] = useState({ error: null, success: null, editError: null, editSuccess: null });
  const [editPasswordData, setEditPasswordData] = useState({ newPassword: '', adminPassword: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [deletePasswordData, setDeletePasswordData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => { fetchEmployees(); }, []);

  const clearAlerts = () => setAlerts({ error: null, success: null, editError: null, editSuccess: null });
  const setAlert = (type, value) => setAlerts(prev => ({ ...prev, [type]: value }));

  const handleError = (err, defaultKey) => {
    const errorMsg = err.response?.data?.message;
    const errorMap = {
      'Email already registered': 'emailAlreadyExists',
      'Invalid admin password': 'invalidAdminPassword',
      'Employee not found': 'employeeNotFound',
      'Cannot delete the Admin account': 'cannotDeleteAdmin'
    };
    return t(errorMap[errorMsg] || defaultKey);
  };

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await authService.getEmployees();
      setEmployees(response.data.data || []);
    } catch (err) {
      // Optionally show error
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();
    if (!formData.name || !formData.email || !formData.password) {
      setAlert('error', t('pleaseFillRequired'));
      return;
    }
    if (formData.password.length < 6) {
      setAlert('error', t('passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      await authService.createEmployee({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });
      hapticSuccess();
      setAlert('success', t('employeeCreatedSuccess'));
      setFormData({ name: '', email: '', password: '' });
      fetchEmployees();
    } catch (err) {
      hapticWarning();
      setAlert('error', handleError(err, 'errorCreatingEmployee'));
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employeeId) => {
    setExpandedEmployeeId(expandedEmployeeId === employeeId ? null : employeeId);
    setEditPasswordData({ newPassword: '', adminPassword: '' });
    clearAlerts();
  };

  const handleEditPasswordChange = (e) => {
    const { name, value } = e.target;
    setEditPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e, employeeId) => {
    e.preventDefault();
    clearAlerts();
    if (!editPasswordData.newPassword || !editPasswordData.adminPassword) {
      setAlert('editError', t('pleaseFillRequired'));
      return;
    }
    if (editPasswordData.newPassword.length < 6) {
      setAlert('editError', t('passwordMinLength'));
      return;
    }
    setEditLoading(true);
    try {
      await authService.updateEmployeePassword({
        employeeId,
        newPassword: editPasswordData.newPassword,
        adminPassword: editPasswordData.adminPassword
      });
      hapticSuccess();
      setAlert('editSuccess', t('passwordUpdatedSuccess'));
      setEditPasswordData({ newPassword: '', adminPassword: '' });
    } catch (err) {
      hapticWarning();
      setAlert('editError', handleError(err, 'errorUpdatingPassword'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    clearAlerts();
    const adminPassword = deletePasswordData[employeeId];
    if (!adminPassword) {
      setAlert('editError', t('pleaseFillRequired'));
      return;
    }
    setDeleteLoading(employeeId);
    try {
      await authService.deleteEmployee(employeeId, adminPassword);
      hapticSuccess();
      setAlert('editSuccess', t('employeeDeletedSuccess'));
      setShowDeleteConfirm(null);
      setDeletePasswordData({});
      setExpandedEmployeeId(null);
      fetchEmployees();
    } catch (err) {
      hapticWarning();
      setAlert('editError', handleError(err, 'errorDeletingEmployee'));
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeletePasswordChange = (employeeId, value) => {
    setDeletePasswordData(prev => ({ ...prev, [employeeId]: value }));
  };

  const handleCancelDelete = (employeeId) => {
    setShowDeleteConfirm(null);
    setDeletePasswordData(prev => {
      const { [employeeId]: _, ...rest } = prev;
      return rest;
    });
  };

  const renderCreateForm = () => (
    <div className="p-3 border-top">
      <p className="file-info-text mb-4 employee-info-black">{t('createEmployeeDescription')}</p>
      {alerts.error && <Alert type="danger" message={alerts.error} onClose={() => setAlert('error', null)} />}
      {alerts.success && <Alert type="success" message={alerts.success} onClose={() => setAlert('success', null)} />}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">{t('name')} *</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('employeeName')}
            autoComplete="name"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">{t('email')} *</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="employee@example.com"
            autoComplete="email"
            required
          />
          <small className="file-info-text employee-info-black">{t('employeeEmailNote')}</small>
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">{t('password')} *</label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('passwordPlaceholder')}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <small className="file-info-text employee-info-black">{t('employeePasswordNote')}</small>
        </div>
        <div className="d-grid gap-2">
          <button type="submit" className="btn btn-lg w-100 post-update-btn" disabled={loading}>
            {loading ? t('creating') : t('createEmployee')}
          </button>
        </div>
      </form>
    </div>
  );

  const renderEmployeeList = () => {
    const adminEmail = import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
    const filteredEmployees = employees.filter(emp => emp.email !== adminEmail);
    return (
    <div className="list-group">
      {filteredEmployees.map((employee) => (
        <div
          key={employee.id}
          className={`list-group-item p-0${expandedEmployeeId === employee.id ? ' expanded-employee-card' : ''}`}
          style={{
            background: expandedEmployeeId === employee.id ? THEME_COLOR : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(70,161,161,0.2)',
            borderRadius: '10px',
            marginBottom: '0.5rem'
          }}
        >
          <button
            className="btn btn-link text-start text-decoration-none w-100 p-3 d-flex justify-content-between align-items-center"
            onClick={() => toggleEmployee(employee.id)}
            style={{
              color: '#fff',
              background: 'transparent',
              fontWeight: 600
            }}
          >
            <div>
              <h5 className="mb-1" style={{ color: expandedEmployeeId === employee.id ? '#fff' : '#e0f7f7', fontWeight: 700 }}>{employee.name}</h5>
              <small style={{ color: 'rgba(255,255,255,0.55)' }}>{employee.email}</small>
            </div>
            {expandedEmployeeId === employee.id
              ? <ChevronUp size={18} style={{ color: '#46a1a1', flexShrink: 0 }} />
              : <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />}
          </button>
          <AnimatePresence initial={false}>
          {expandedEmployeeId === employee.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
            <div className="p-3 border-top" style={{ borderColor: 'rgba(70, 161, 161, 0.25)' }}>
              <h6 className="mb-3 section-header d-flex align-items-center gap-2" style={{ color: '#46a1a1', fontWeight: 700 }}>
                <Key size={15} />
                {t('editPassword')}
              </h6>
              {alerts.editError && <Alert type="danger" message={alerts.editError} onClose={() => setAlert('editError', null)} />}
              {alerts.editSuccess && <Alert type="success" message={alerts.editSuccess} onClose={() => setAlert('editSuccess', null)} />}
              <form onSubmit={(e) => handleUpdatePassword(e, employee.id)} noValidate>
                <div className="mb-3">
                  <label htmlFor={`newPassword-${employee.id}`} className="form-label">{t('newPassword')} *</label>
                  <input
                    type="password"
                    className="form-control"
                    id={`newPassword-${employee.id}`}
                    name="newPassword"
                    value={editPasswordData.newPassword}
                    onChange={handleEditPasswordChange}
                    placeholder={t('passwordPlaceholder')}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor={`adminPassword-${employee.id}`} className="form-label">{t('yourAdminPassword')} *</label>
                  <input
                    type="password"
                    className="form-control"
                    id={`adminPassword-${employee.id}`}
                    name="adminPassword"
                    value={editPasswordData.adminPassword}
                    onChange={handleEditPasswordChange}
                    placeholder={t('enterYourPassword')}
                    autoComplete="current-password"
                    required
                  />
                  <small className="text-muted">{t('adminPasswordRequired')}</small>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                  style={{ backgroundColor: THEME_COLOR, border: 'none' }}
                >
                  {editLoading ? t('updating') : t('updatePassword')}
                </button>
              </form>
              <hr className="my-4 section-divider" style={{ borderColor: '#46a1a1', borderWidth: '2px' }} />
              <div className="mt-4">
                <h6 className="mb-3 text-danger section-header d-flex align-items-center gap-2">
                  <UserMinus size={15} />
                  {t('removeEmployee')}
                </h6>
                {!showDeleteConfirm || showDeleteConfirm !== employee.id ? (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setShowDeleteConfirm(employee.id)}
                  >
                    {t('removeFromSystem')}
                  </button>
                ) : (
                  <div className="border border-danger rounded p-3" style={{ background: 'rgba(220, 53, 69, 0.08)' }}>
                    <p className="mb-3 section-header" style={{ color: '#46a1a1', fontWeight: 600 }}>
                      <strong>{t('confirmDeleteEmployee')}</strong>
                    </p>
                    <p className="text-danger mb-3">{t('deleteEmployeeWarning')}</p>
                    <div className="mb-3">
                      <label htmlFor={`deleteAdminPassword-${employee.id}`} className="form-label">{t('yourAdminPassword')} *</label>
                      <input
                        type="password"
                        className="form-control"
                        id={`deleteAdminPassword-${employee.id}`}
                        value={deletePasswordData[employee.id] || ''}
                        onChange={(e) => handleDeletePasswordChange(employee.id, e.target.value)}
                        placeholder={t('enterYourPassword')}
                        autoComplete="current-password"
                      />
                      <small className="text-muted">{t('adminPasswordRequired')}</small>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        disabled={deleteLoading === employee.id}
                      >
                        {deleteLoading === employee.id ? t('deleting') : t('confirmDelete')}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleCancelDelete(employee.id)}
                        disabled={deleteLoading === employee.id}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      ))}
    </div>
    );
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="card post-update-card shadow-sm mb-4">
            <div className="card-body p-0">
              <button
                className="btn btn-link text-start text-decoration-none w-100 p-3 d-flex justify-content-between align-items-center"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <h3 className="card-title mb-0 create-employee-title d-flex align-items-center gap-2">
                  <UserPlus size={18} />
                  {t('createEmployee')}
                </h3>
                {showCreateForm ? <ChevronUp size={18} style={{ color: '#46a1a1' }} /> : <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />}
              </button>
              <AnimatePresence initial={false}>
                {showCreateForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    {renderCreateForm()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="card post-update-card shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4 create-employee-title d-flex align-items-center gap-2">
                <Users size={18} />
                {t('manageEmployees')}
              </h3>
              {loadingEmployees ? (
                <div className="list-group">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="sk-card mb-2 p-3 d-flex justify-content-between align-items-center">
                      <div style={{ flex: 1 }}>
                        <span className="sk mb-2" style={{ height: '17px', width: '140px', animationDelay: `${i * 0.12}s` }} />
                        <span className="sk" style={{ height: '12px', width: '190px', animationDelay: `${i * 0.12}s` }} />
                      </div>
                      <span className="sk" style={{ height: '22px', width: '22px', borderRadius: '50%', animationDelay: `${i * 0.12}s` }} />
                    </div>
                  ))}
                </div>
              ) : employees.length === 0 ? (
                <p className="employee-info-black text-center py-4">{t('noEmployeesYet')}</p>
              ) : (
                renderEmployeeList()
              )}
            </div>
          </div>
          <div className="alert alert-info mt-4" style={{ borderRadius: '16px' }}>
            <strong>{t('note')}</strong> {t('employeeAccountNote')}
          </div>
        </div>
      </div>
    </div>
  );
};
