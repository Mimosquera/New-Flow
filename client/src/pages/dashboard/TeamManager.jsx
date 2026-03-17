import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserPlus, Users, ChevronDown, ChevronUp, Key, UserMinus, Pencil, AtSign } from 'lucide-react';
import { Alert } from '../../components/Common/index.jsx';
import { authService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { hapticSuccess, hapticWarning } from '../../utils/haptics.js';

export const TeamManager = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(window.innerWidth >= 992);
  const [alerts, setAlerts] = useState({
    error: null, success: null,
    editError: null, editSuccess: null,
    nameError: null, nameSuccess: null,
    emailError: null, emailSuccess: null,
  });

  const [editPasswordStep, setEditPasswordStep] = useState('form');
  const [editPasswordData, setEditPasswordData] = useState({ newPassword: '', adminPassword: '' });
  const [editLoading, setEditLoading] = useState(false);

  const [editNameStep, setEditNameStep] = useState('form');
  const [editNameData, setEditNameData] = useState({ newName: '', adminPassword: '' });
  const [editNameLoading, setEditNameLoading] = useState(false);

  const [editEmailStep, setEditEmailStep] = useState('form');
  const [editEmailData, setEditEmailData] = useState({ newEmail: '', adminPassword: '' });
  const [editEmailLoading, setEditEmailLoading] = useState(false);

  const [showEditName, setShowEditName] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(null);
  const [deletePasswordData, setDeletePasswordData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => { fetchEmployees(); }, []);

  const clearAlerts = () => setAlerts({
    error: null, success: null,
    editError: null, editSuccess: null,
    nameError: null, nameSuccess: null,
    emailError: null, emailSuccess: null,
  });
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
    } catch {
      // intentional
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
    setEditPasswordStep('form');
    setEditNameData({ newName: '', adminPassword: '' });
    setEditNameStep('form');
    setEditEmailData({ newEmail: '', adminPassword: '' });
    setEditEmailStep('form');
    setShowEditName(false);
    setShowEditEmail(false);
    setShowEditPassword(false);
    clearAlerts();
  };

  // Edit Email — step 1: validate new email
  const handleEditEmailNext = (e) => {
    e.preventDefault();
    clearAlerts();
    if (!editEmailData.newEmail.trim()) {
      setAlert('emailError', t('pleaseFillRequired'));
      return;
    }
    setEditEmailStep('confirm');
  };

  // Edit Email — step 2: confirm with admin password
  const handleConfirmUpdateEmail = async (e, employeeId) => {
    e.preventDefault();
    clearAlerts();
    if (!editEmailData.adminPassword) {
      setAlert('emailError', t('pleaseFillRequired'));
      return;
    }
    setEditEmailLoading(true);
    try {
      await authService.updateEmployeeEmail({
        employeeId,
        newEmail: editEmailData.newEmail.trim(),
        adminPassword: editEmailData.adminPassword
      });
      hapticSuccess();
      setAlert('emailSuccess', t('emailUpdatedSuccess'));
      setEditEmailData({ newEmail: '', adminPassword: '' });
      setEditEmailStep('form');
      fetchEmployees();
    } catch (err) {
      hapticWarning();
      setAlert('emailError', handleError(err, 'errorUpdatingEmail'));
    } finally {
      setEditEmailLoading(false);
    }
  };

  // Edit Password — step 1: validate new password
  const handleEditPasswordNext = (e) => {
    e.preventDefault();
    clearAlerts();
    if (!editPasswordData.newPassword) {
      setAlert('editError', t('pleaseFillRequired'));
      return;
    }
    if (editPasswordData.newPassword.length < 6) {
      setAlert('editError', t('passwordMinLength'));
      return;
    }
    setEditPasswordStep('confirm');
  };

  // Edit Password — step 2: confirm with admin password
  const handleConfirmUpdatePassword = async (e, employeeId) => {
    e.preventDefault();
    clearAlerts();
    if (!editPasswordData.adminPassword) {
      setAlert('editError', t('pleaseFillRequired'));
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
      setEditPasswordStep('form');
    } catch (err) {
      hapticWarning();
      setAlert('editError', handleError(err, 'errorUpdatingPassword'));
    } finally {
      setEditLoading(false);
    }
  };

  // Edit Name — step 1: validate new name
  const handleEditNameNext = (e) => {
    e.preventDefault();
    clearAlerts();
    if (!editNameData.newName.trim()) {
      setAlert('nameError', t('pleaseFillRequired'));
      return;
    }
    setEditNameStep('confirm');
  };

  // Edit Name — step 2: confirm with admin password
  const handleConfirmUpdateName = async (e, employeeId) => {
    e.preventDefault();
    clearAlerts();
    if (!editNameData.adminPassword) {
      setAlert('nameError', t('pleaseFillRequired'));
      return;
    }
    setEditNameLoading(true);
    try {
      await authService.updateEmployeeName({
        employeeId,
        newName: editNameData.newName.trim(),
        adminPassword: editNameData.adminPassword
      });
      hapticSuccess();
      setAlert('nameSuccess', t('nameUpdatedSuccess'));
      setEditNameData({ newName: '', adminPassword: '' });
      setEditNameStep('form');
      fetchEmployees();
    } catch (err) {
      hapticWarning();
      setAlert('nameError', handleError(err, 'errorUpdatingName'));
    } finally {
      setEditNameLoading(false);
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
      const next = { ...prev };
      delete next[employeeId];
      return next;
    });
  };

  const renderCreateForm = () => (
    <div className="p-4">
      <p className="file-info-text mb-4 employee-info-black text-center">{t('createEmployeeDescription')}</p>
      {alerts.error && <Alert type="danger" message={alerts.error} onClose={() => setAlert('error', null)} />}
      {alerts.success && <Alert type="success" message={alerts.success} onClose={() => setAlert('success', null)} />}
      <form onSubmit={handleSubmit} noValidate style={{ maxWidth: '380px', margin: '0 auto' }}>
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
        <div className="mt-2 d-flex justify-content-center">
          <button type="submit" className="btn post-update-btn" disabled={loading}>
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
            background: expandedEmployeeId === employee.id ? undefined : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(70,161,161,0.2)',
            borderRadius: '10px',
            marginBottom: '0.5rem'
          }}
        >
          <button
            className="btn btn-link text-start text-decoration-none w-100 p-3 d-flex justify-content-between align-items-center"
            onClick={() => toggleEmployee(employee.id)}
            style={{ color: '#fff', background: 'transparent', fontWeight: 600 }}
          >
            <div>
              <h5 className="mb-1" style={{ color: expandedEmployeeId === employee.id ? '#fff' : '#e0f7f7', fontWeight: 700 }}>{employee.name}</h5>
              <small style={{ color: 'rgba(255,255,255,0.55)' }}>{employee.email}</small>
            </div>
            {expandedEmployeeId === employee.id
              ? <ChevronUp size={18} style={{ color: '#3aabdb', flexShrink: 0 }} />
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
            <div className="p-3 border-top" style={{ borderColor: 'rgba(58, 171, 219, 0.25)' }}>

              {/* Edit Name */}
              <button
                className="btn w-100 d-flex justify-content-between align-items-center p-2 mb-1"
                style={{ background: showEditName ? 'rgba(58,171,219,0.1)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(58,171,219,0.2)', borderRadius: '8px', color: '#3aabdb', fontWeight: 700, fontSize: '0.88rem' }}
                onClick={() => { setShowEditName(v => !v); setShowEditEmail(false); setShowEditPassword(false); clearAlerts(); }}
              >
                <span className="d-flex align-items-center gap-2"><Pencil size={14} />{t('editEmployeeName')}</span>
                {showEditName ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <AnimatePresence initial={false}>
              {showEditName && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
              <div className="pt-3 pb-2">
              {alerts.nameError && <Alert type="danger" message={alerts.nameError} onClose={() => setAlert('nameError', null)} />}
              {alerts.nameSuccess && <Alert type="success" message={alerts.nameSuccess} onClose={() => setAlert('nameSuccess', null)} />}

              <AnimatePresence mode="wait" initial={false}>
                {editNameStep === 'form' ? (
                  <motion.form
                    key="name-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleEditNameNext}
                    noValidate
                    style={{ maxWidth: '360px', margin: '0 auto' }}
                  >
                    <div className="mb-3">
                      <label htmlFor={`newName-${employee.id}`} className="form-label">{t('newName')} *</label>
                      <input
                        type="text"
                        className="form-control"
                        id={`newName-${employee.id}`}
                        value={editNameData.newName}
                        onChange={(e) => setEditNameData(prev => ({ ...prev, newName: e.target.value }))}
                        placeholder={t('namePlaceholder')}
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-center">
                      <button type="submit" className="btn post-update-btn">
                        {t('updateName')}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="name-confirm"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={(e) => handleConfirmUpdateName(e, employee.id)}
                    noValidate
                    style={{ maxWidth: '360px', margin: '0 auto' }}
                  >
                    <p className="mb-3" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>
                      Renaming <strong style={{ color: '#fff' }}>{employee.name}</strong> → <strong style={{ color: '#3aabdb' }}>{editNameData.newName}</strong>
                    </p>
                    <div className="mb-3">
                      <label htmlFor={`nameAdminPw-${employee.id}`} className="form-label">{t('yourAdminPassword')} *</label>
                      <input
                        type="password"
                        className="form-control"
                        id={`nameAdminPw-${employee.id}`}
                        value={editNameData.adminPassword}
                        onChange={(e) => setEditNameData(prev => ({ ...prev, adminPassword: e.target.value }))}
                        placeholder={t('enterYourPassword')}
                        autoComplete="current-password"
                        required
                        autoFocus
                      />
                      <small className="text-muted">{t('adminPasswordRequired')}</small>
                    </div>
                    <div className="d-flex gap-2 justify-content-center">
                      <button type="submit" className="btn post-update-btn" disabled={editNameLoading}>
                        {editNameLoading ? t('updating') : t('confirm')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontWeight: '500' }}
                        onClick={() => { setEditNameStep('form'); setEditNameData(prev => ({ ...prev, adminPassword: '' })); clearAlerts(); }}
                        disabled={editNameLoading}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
              </div>
              </motion.div>
              )}
              </AnimatePresence>

              <div className="my-2" />

              {/* Edit Email */}
              <button
                className="btn w-100 d-flex justify-content-between align-items-center p-2 mb-1"
                style={{ background: showEditEmail ? 'rgba(58,171,219,0.1)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(58,171,219,0.2)', borderRadius: '8px', color: '#3aabdb', fontWeight: 700, fontSize: '0.88rem' }}
                onClick={() => { setShowEditEmail(v => !v); setShowEditName(false); setShowEditPassword(false); clearAlerts(); }}
              >
                <span className="d-flex align-items-center gap-2"><AtSign size={14} />{t('editEmployeeEmail')}</span>
                {showEditEmail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <AnimatePresence initial={false}>
              {showEditEmail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
              <div className="pt-3 pb-2">
              {alerts.emailError && <Alert type="danger" message={alerts.emailError} onClose={() => setAlert('emailError', null)} />}
              {alerts.emailSuccess && <Alert type="success" message={alerts.emailSuccess} onClose={() => setAlert('emailSuccess', null)} />}

              <AnimatePresence mode="wait" initial={false}>
                {editEmailStep === 'form' ? (
                  <motion.form
                    key="email-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleEditEmailNext}
                    noValidate
                    style={{ maxWidth: '360px', margin: '0 auto' }}
                  >
                    <div className="mb-3">
                      <label htmlFor={`newEmail-${employee.id}`} className="form-label">{t('newEmail')} *</label>
                      <input
                        type="email"
                        className="form-control"
                        id={`newEmail-${employee.id}`}
                        value={editEmailData.newEmail}
                        onChange={(e) => setEditEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                        placeholder={t('emailPlaceholder')}
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-center">
                      <button type="submit" className="btn post-update-btn">
                        {t('updateEmail')}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="email-confirm"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={(e) => handleConfirmUpdateEmail(e, employee.id)}
                    noValidate
                    style={{ maxWidth: '360px', margin: '0 auto' }}
                  >
                    <p className="mb-3" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>
                      {employee.email} → <strong style={{ color: '#3aabdb' }}>{editEmailData.newEmail}</strong>
                    </p>
                    <div className="mb-3">
                      <label htmlFor={`emailAdminPw-${employee.id}`} className="form-label">{t('yourAdminPassword')} *</label>
                      <input
                        type="password"
                        className="form-control"
                        id={`emailAdminPw-${employee.id}`}
                        value={editEmailData.adminPassword}
                        onChange={(e) => setEditEmailData(prev => ({ ...prev, adminPassword: e.target.value }))}
                        placeholder={t('enterYourPassword')}
                        autoComplete="current-password"
                        required
                        autoFocus
                      />
                      <small className="text-muted">{t('adminPasswordRequired')}</small>
                    </div>
                    <div className="d-flex gap-2 justify-content-center">
                      <button type="submit" className="btn post-update-btn" disabled={editEmailLoading}>
                        {editEmailLoading ? t('updating') : t('confirm')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontWeight: '500' }}
                        onClick={() => { setEditEmailStep('form'); setEditEmailData(prev => ({ ...prev, adminPassword: '' })); clearAlerts(); }}
                        disabled={editEmailLoading}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
              </div>
              </motion.div>
              )}
              </AnimatePresence>

              <div className="my-2" />

              {/* Edit Password */}
              <button
                className="btn w-100 d-flex justify-content-between align-items-center p-2 mb-1"
                style={{ background: showEditPassword ? 'rgba(58,171,219,0.1)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(58,171,219,0.2)', borderRadius: '8px', color: '#3aabdb', fontWeight: 700, fontSize: '0.88rem' }}
                onClick={() => { setShowEditPassword(v => !v); setShowEditName(false); setShowEditEmail(false); clearAlerts(); }}
              >
                <span className="d-flex align-items-center gap-2"><Key size={14} />{t('editPassword')}</span>
                {showEditPassword ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <AnimatePresence initial={false}>
              {showEditPassword && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
              <div className="pt-3 pb-2">
              {alerts.editError && <Alert type="danger" message={alerts.editError} onClose={() => setAlert('editError', null)} />}
              {alerts.editSuccess && <Alert type="success" message={alerts.editSuccess} onClose={() => setAlert('editSuccess', null)} />}

              <AnimatePresence mode="wait" initial={false}>
                {editPasswordStep === 'form' ? (
                  <motion.form
                    key="pw-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleEditPasswordNext}
                    noValidate
                    style={{ maxWidth: '360px', margin: '0 auto' }}
                  >
                    <div className="mb-3">
                      <label htmlFor={`newPassword-${employee.id}`} className="form-label">{t('newPassword')} *</label>
                      <input
                        type="password"
                        className="form-control"
                        id={`newPassword-${employee.id}`}
                        name="newPassword"
                        value={editPasswordData.newPassword}
                        onChange={(e) => setEditPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder={t('passwordPlaceholder')}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-center">
                      <button type="submit" className="btn post-update-btn">
                        {t('updatePassword')}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="pw-confirm"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={(e) => handleConfirmUpdatePassword(e, employee.id)}
                    noValidate
                    style={{ maxWidth: '360px', margin: '0 auto' }}
                  >
                    <div className="mb-3">
                      <label htmlFor={`adminPassword-${employee.id}`} className="form-label">{t('yourAdminPassword')} *</label>
                      <input
                        type="password"
                        className="form-control"
                        id={`adminPassword-${employee.id}`}
                        name="adminPassword"
                        value={editPasswordData.adminPassword}
                        onChange={(e) => setEditPasswordData(prev => ({ ...prev, adminPassword: e.target.value }))}
                        placeholder={t('enterYourPassword')}
                        autoComplete="current-password"
                        required
                        autoFocus
                      />
                      <small className="text-muted">{t('adminPasswordRequired')}</small>
                    </div>
                    <div className="d-flex gap-2 justify-content-center">
                      <button type="submit" className="btn post-update-btn" disabled={editLoading}>
                        {editLoading ? t('updating') : t('confirm')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontWeight: '500' }}
                        onClick={() => { setEditPasswordStep('form'); setEditPasswordData(prev => ({ ...prev, adminPassword: '' })); clearAlerts(); }}
                        disabled={editLoading}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
              </div>
              </motion.div>
              )}
              </AnimatePresence>

              <hr className="my-3 section-divider" style={{ borderColor: 'rgba(58,171,219,0.2)', borderWidth: '1px' }} />

              {/* Remove Employee */}
              <div className="mt-4">
                <div className="d-flex justify-content-center mb-3">
                <button
                  className="btn p-0 section-header d-flex align-items-center gap-2 remove-employee-btn"
                  style={{ color: '#ff8585', fontWeight: 700, fontSize: '1rem', background: 'none', border: 'none', outline: 'none', boxShadow: 'none' }}
                  onClick={() => showDeleteConfirm === employee.id ? handleCancelDelete(employee.id) : setShowDeleteConfirm(employee.id)}
                >
                  <UserMinus size={15} />
                  {t('removeEmployee')}
                </button>
                </div>
                <AnimatePresence initial={false}>
                {showDeleteConfirm === employee.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div>
                    <p className="mb-2" style={{ color: '#ff8585', fontWeight: 600, fontSize: '0.9rem' }}>
                      {t('confirmDeleteEmployee')}
                    </p>
                    <p className="mb-3" style={{ color: 'rgba(255,160,160,0.8)', fontSize: '0.82rem' }}>{t('deleteEmployeeWarning')}</p>
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
                      <small style={{ color: 'rgba(255,160,160,0.6)', fontSize: '0.75rem' }}>{t('adminPasswordRequired')}</small>
                    </div>
                    <div className="d-flex gap-2 justify-content-center">
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(220,53,69,0.8)', color: '#fff', border: 'none', fontWeight: 600 }}
                        onClick={() => handleDeleteEmployee(employee.id)}
                        disabled={deleteLoading === employee.id}
                      >
                        {deleteLoading === employee.id ? t('deleting') : t('confirmDelete')}
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 500 }}
                        onClick={() => handleCancelDelete(employee.id)}
                        disabled={deleteLoading === employee.id}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
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
      <div className="row g-4 align-items-start justify-content-center">

        {/* Left: Create Employee */}
        <div className="col-12 col-lg-4">
          <div className="card post-update-card shadow-sm">
            <div
              className="d-flex justify-content-between align-items-center collapsible-header"
              style={{
                background: 'rgba(3, 25, 38, 0.45)',
                borderBottom: showCreateForm ? '1px solid rgba(70,161,161,0.2)' : 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.75rem 1rem',
                borderRadius: showCreateForm ? '0.75rem 0.75rem 0 0' : '0.75rem',
              }}
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <h3 className="card-title mb-0 create-employee-title d-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
                <UserPlus size={16} />
                {t('createEmployee')}
              </h3>
              {showCreateForm
                ? <ChevronUp size={16} style={{ color: '#3aabdb', flexShrink: 0 }} />
                : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />}
            </div>
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

        {/* Right: Manage Employees */}
        <div className="col-12 col-lg-6">
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
          <div
            style={{
              marginTop: '1rem',
              background: 'rgba(58,171,219,0.08)',
              border: '1px solid rgba(58,171,219,0.2)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
            }}
          >
            <span style={{ flexShrink: 0, marginTop: '1px', color: '#3aabdb', opacity: 0.7 }}>ℹ</span>
            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.55)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>{t('note')}</strong>{' '}
              {t('employeeAccountNote')}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
