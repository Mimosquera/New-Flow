import { useState, useEffect } from 'react';
import { Alert } from './Common/index.jsx';
import { authService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';

const THEME_COLOR = 'rgb(5, 45, 63)';

export const EmployeeManager = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editPasswordData, setEditPasswordData] = useState({
    newPassword: '',
    adminPassword: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [deletePasswordData, setDeletePasswordData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
    setEditError(null);
    setEditSuccess(null);
  };

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
      console.error('Error fetching employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearAlerts();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!formData.name || !formData.email || !formData.password) {
      setError(t('pleaseFillRequired'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      await authService.createEmployee({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      setSuccess(t('employeeCreatedSuccess'));
      setFormData({ name: '', email: '', password: '' });
      fetchEmployees();
    } catch (err) {
      setError(handleError(err, 'errorCreatingEmployee'));
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employeeId) => {
    const isClosing = expandedEmployeeId === employeeId;
    setExpandedEmployeeId(isClosing ? null : employeeId);
    setEditPasswordData({ newPassword: '', adminPassword: '' });
    clearAlerts();
  };

  const handleEditPasswordChange = (e) => {
    const { name, value } = e.target;
    setEditPasswordData(prev => ({ ...prev, [name]: value }));
    clearAlerts();
  };

  const handleUpdatePassword = async (e, employeeId) => {
    e.preventDefault();
    clearAlerts();

    if (!editPasswordData.newPassword || !editPasswordData.adminPassword) {
      setEditError(t('pleaseFillRequired'));
      return;
    }

    if (editPasswordData.newPassword.length < 6) {
      setEditError(t('passwordMinLength'));
      return;
    }

    setEditLoading(true);

    try {
      await authService.updateEmployeePassword({
        employeeId,
        newPassword: editPasswordData.newPassword,
        adminPassword: editPasswordData.adminPassword
      });

      setEditSuccess(t('passwordUpdatedSuccess'));
      setEditPasswordData({ newPassword: '', adminPassword: '' });
    } catch (err) {
      setEditError(handleError(err, 'errorUpdatingPassword'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    clearAlerts();

    const adminPassword = deletePasswordData[employeeId];
    if (!adminPassword) {
      setEditError(t('pleaseFillRequired'));
      return;
    }

    setDeleteLoading(employeeId);

    try {
      await authService.deleteEmployee(employeeId, adminPassword);
      setEditSuccess(t('employeeDeletedSuccess'));
      setShowDeleteConfirm(null);
      setDeletePasswordData({});
      setExpandedEmployeeId(null);
      fetchEmployees();
    } catch (err) {
      setEditError(handleError(err, 'errorDeletingEmployee'));
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeletePasswordChange = (employeeId, value) => {
    setDeletePasswordData(prev => ({ ...prev, [employeeId]: value }));
    clearAlerts();
  };

  const handleCancelDelete = (employeeId) => {
    setShowDeleteConfirm(null);
    setDeletePasswordData(prev => {
      // eslint-disable-next-line no-unused-vars
      const { [employeeId]: _, ...rest } = prev;
      return rest;
    });
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
                style={{ color: 'inherit' }}
              >
                <h3 className="card-title mb-0 create-employee-title">
                    {t('createEmployee')}
                </h3>
                <span style={{ fontSize: '1.2rem' }}>
                  {showCreateForm ? '▲' : '▼'}
                </span>
              </button>

              {showCreateForm && (
                <div className="p-3 border-top">
                  <p className="file-info-text mb-4 employee-info-black">
                    {t('createEmployeeDescription')}
                  </p>

                  {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
                  {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

                  <form onSubmit={handleSubmit}>

                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">
                        {t('name')} *
                      </label>
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
                      <label htmlFor="email" className="form-label">
                        {t('email')} *
                      </label>
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
                      <small className="file-info-text employee-info-black">
                        {t('employeeEmailNote')}
                      </small>
                    </div>


                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">
                        {t('password')} *
                      </label>
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
                      <small className="file-info-text employee-info-black">
                        {t('employeePasswordNote')}
                      </small>
                    </div>

                    <div className="d-grid gap-2">
                      <button 
                        type="submit" 
                        className="btn btn-lg w-100 post-update-btn"
                        disabled={loading}
                      >
                        {loading ? t('creating') : t('createEmployee')}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="card post-update-card shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4 create-employee-title">
                {t('manageEmployees')}
              </h3>

              {loadingEmployees ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">{t('loading')}</span>
                  </div>
                </div>
              ) : employees.length === 0 ? (
                <p className="employee-info-black text-center py-4">
                  {t('noEmployeesYet')}
                </p>
              ) : (
                <div className="list-group">
                  {employees.map((employee) => (
                    <div key={employee.id} className="list-group-item p-0" style={{ background: '#fff' }}>
                      <button
                        className="btn btn-link text-start text-decoration-none w-100 p-3 d-flex justify-content-between align-items-center"
                        onClick={() => toggleEmployee(employee.id)}
                        style={{ color: 'rgb(5, 45, 63)', background: '#fff', fontWeight: 600 }}
                      >
                        <div>
                          <h5 className="mb-1" style={{ color: 'rgb(5, 45, 63)', fontWeight: 700 }}>{employee.name}</h5>
                          <small className="text-muted">{employee.email}</small>
                        </div>
                        <span style={{ fontSize: '1.2rem', color: 'rgb(5, 45, 63)' }}>
                          {expandedEmployeeId === employee.id ? '▲' : '▼'}
                        </span>
                      </button>

                      {expandedEmployeeId === employee.id && (
                        <div className="p-3 border-top bg-light">
                          <h6 className="mb-3">{t('editPassword')}</h6>

                          {editError && <Alert type="danger" message={editError} onClose={() => setEditError(null)} />}
                          {editSuccess && <Alert type="success" message={editSuccess} onClose={() => setEditSuccess(null)} />}

                          <form onSubmit={(e) => handleUpdatePassword(e, employee.id)}>
                            <div className="mb-3">
                              <label htmlFor={`newPassword-${employee.id}`} className="form-label">
                                {t('newPassword')} *
                              </label>
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
                              <label htmlFor={`adminPassword-${employee.id}`} className="form-label">
                                {t('yourAdminPassword')} *
                              </label>
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
                              <small className="text-muted">
                                {t('adminPasswordRequired')}
                              </small>
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

                          <hr className="my-4" />
                          <div className="mt-4">
                            <h6 className="mb-3 text-danger">{t('removeEmployee')}</h6>
                            
                            {!showDeleteConfirm || showDeleteConfirm !== employee.id ? (
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => setShowDeleteConfirm(employee.id)}
                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                              >
                                {t('removeFromSystem')}
                              </button>
                            ) : (
                              <div className="border border-danger rounded p-3 bg-light">
                                <p className="text-danger mb-3">
                                  <strong>{t('confirmDeleteEmployee')}</strong>
                                </p>
                                <p className="mb-3">
                                  {t('deleteEmployeeWarning')}
                                </p>

                                <div className="mb-3">
                                  <label htmlFor={`deleteAdminPassword-${employee.id}`} className="form-label">
                                    {t('yourAdminPassword')} *
                                  </label>
                                  <input
                                    type="password"
                                    className="form-control"
                                    id={`deleteAdminPassword-${employee.id}`}
                                    value={deletePasswordData[employee.id] || ''}
                                    onChange={(e) => handleDeletePasswordChange(employee.id, e.target.value)}
                                    placeholder={t('enterYourPassword')}
                                    autoComplete="current-password"
                                  />
                                  <small className="text-muted">
                                    {t('adminPasswordRequired')}
                                  </small>
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
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="alert alert-info mt-4">
            <strong>{t('note')}</strong> {t('employeeAccountNote')}
          </div>
        </div>
      </div>
    </div>
  );
};
