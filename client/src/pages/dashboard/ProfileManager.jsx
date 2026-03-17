import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Lock, Camera, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert } from '../../components/Common/index.jsx';
import { authService } from '../../services/api.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { setToken } from '../../utils/tokenUtils.js';
import { hapticSuccess, hapticWarning } from '../../utils/haptics.js';

const THEME_COLOR = 'rgb(5, 60, 82)';
const SECONDARY_COLOR = '#3aabdb';

export const ProfileManager = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profileImageUrl: null,
    bio: ''
  });
  const [isEditingLogin, setIsEditingLogin] = useState(false);
  const [loginStep, setLoginStep] = useState(1);
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [aboutMeData, setAboutMeData] = useState({
    bio: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [alerts, setAlerts] = useState({ error: null, success: null });
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      const data = response.data;
      setProfile({
        name: data.name,
        email: data.email,
        profileImageUrl: data.profileImageUrl || null,
        bio: data.bio || ''
      });
      setLoginFormData({
        name: data.name,
        email: data.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setAboutMeData({
        bio: data.bio || ''
      });
      setImagePreview(data.profileImageUrl || null);
    } catch {
      setAlerts({ error: t('failedToLoadProfile'), success: null });
    }
  };

  const handleEditLogin = () => {
    setIsEditingLogin(true);
    setLoginStep(1);
    setAlerts({ error: null, success: null });
  };

  const handleCancelLogin = () => {
    setIsEditingLogin(false);
    setLoginStep(1);
    setLoginFormData({
      name: profile.name,
      email: profile.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAlerts({ error: null, success: null });
  };

  const handleNextStep = async () => {
    if (!loginFormData.currentPassword) {
      hapticWarning();
      setAlerts({ error: t('currentPasswordRequired'), success: null });
      return;
    }
    setVerifyLoading(true);
    setAlerts({ error: null, success: null });
    try {
      await authService.verifyPassword({ password: loginFormData.currentPassword });
      setLoginStep(2);
    } catch (error) {
      hapticWarning();
      const msg = error.response?.status === 401 ? t('invalidCurrentPassword') : t('currentPasswordRequired');
      setAlerts({ error: msg, success: null });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginFormData(prev => ({ ...prev, [name]: value }));
    setAlerts({ error: null, success: null });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAlerts({ error: null, success: null });

    if (!loginFormData.currentPassword) {
      hapticWarning();
      setAlerts({ error: t('currentPasswordRequired'), success: null });
      return;
    }

    if (loginFormData.newPassword && loginFormData.newPassword !== loginFormData.confirmPassword) {
      hapticWarning();
      setAlerts({ error: t('passwordMismatch'), success: null });
      return;
    }

    if (loginFormData.newPassword && loginFormData.newPassword.length < 6) {
      hapticWarning();
      setAlerts({ error: t('passwordMinLength'), success: null });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: loginFormData.name.trim(),
        email: loginFormData.email.trim().toLowerCase(),
        currentPassword: loginFormData.currentPassword
      };

      if (loginFormData.newPassword) {
        updateData.newPassword = loginFormData.newPassword;
      }

      const response = await authService.updateProfile(updateData);

      if (response.data.token) {
        setToken(response.data.token);
      }

      setProfile(prev => ({
        ...prev,
        name: response.data.user.name,
        email: response.data.user.email
      }));

      hapticSuccess();
      setAlerts({ error: null, success: t('profileUpdatedSuccess') });
      setIsEditingLogin(false);

      setLoginFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      hapticWarning();
      const errorMsg = error.response?.data?.message || t('failedToUpdateProfile');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAboutMe = () => {
    setIsEditingAboutMe(true);
    setAlerts({ error: null, success: null });
  };

  const handleCancelAboutMe = () => {
    setIsEditingAboutMe(false);
    setAboutMeData({
      bio: profile.bio || ''
    });
    setSelectedFile(null);
    setImagePreview(profile.profileImageUrl || null);
    setAlerts({ error: null, success: null });
  };

  const handleBioChange = (e) => {
    setAboutMeData({ bio: e.target.value });
    setAlerts({ error: null, success: null });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setAlerts({ error: t('onlyImageFilesAllowed'), success: null });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setAlerts({ error: t('imageSizeTooLarge'), success: null });
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAlerts({ error: null, success: null });
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await authService.uploadProfileImage(formData);

      setProfile(prev => ({
        ...prev,
        profileImageUrl: response.data.profileImageUrl
      }));
      setImagePreview(response.data.profileImageUrl);
      setSelectedFile(null);
      setAlerts({ error: null, success: t('imageUploadedSuccess') });
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('failedToUploadImage');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async () => {
    if (!profile.profileImageUrl) return;

    setUploadingImage(true);
    try {
      await authService.deleteProfileImage();

      setProfile(prev => ({
        ...prev,
        profileImageUrl: null
      }));
      setImagePreview(null);
      setSelectedFile(null);
      setAlerts({ error: null, success: t('imageDeletedSuccess') });
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('failedToDeleteImage');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAboutMeSubmit = async (e) => {
    e.preventDefault();
    setAlerts({ error: null, success: null });

    if (selectedFile) {
      await handleImageUpload();
    }

    setLoading(true);
    try {
      await authService.updateProfile({
        bio: aboutMeData.bio.trim()
      });

      setProfile(prev => ({
        ...prev,
        bio: aboutMeData.bio.trim()
      }));

      hapticSuccess();
      setAlerts({ error: null, success: t('aboutMeUpdatedSuccess') });
      setIsEditingAboutMe(false);
    } catch (error) {
      hapticWarning();
      const errorMsg = error.response?.data?.message || t('failedToUpdateAboutMe');
      setAlerts({ error: errorMsg, success: null });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      hapticWarning();
      setAlerts({ error: t('emailRequired'), success: null });
      return;
    }

    setResetLoading(true);
    try {
      await authService.forgotPassword({ email: resetEmail });
      hapticSuccess();
      setAlerts({ error: null, success: t('resetLinkSent') });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch {
      hapticWarning();
      setAlerts({ error: t('failedToSendResetLink'), success: null });
    } finally {
      setResetLoading(false);
    }
  };

  const profileCardStyle = {
    background: 'rgba(5, 60, 82, 0.55)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(58, 171, 219, 0.2)',
    borderRadius: '14px',
    overflow: 'hidden',
  };

  const cardHeaderStyle = {
    padding: '0.7rem 1rem',
    background: 'rgba(3, 25, 38, 0.45)',
    borderBottom: '1px solid rgba(70,161,161,0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const sectionLabelStyle = {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
    fontWeight: '600',
  };

  const sectionValueStyle = {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.9rem',
    fontWeight: '500',
  };

  return (
    <div className="container py-3">
      {(alerts.error || alerts.success) && (
        <div className="row justify-content-center mb-2">
          <div className="col-12 col-xl-10">
            {alerts.error && (
              <Alert type="error" message={alerts.error} onClose={() => setAlerts({ ...alerts, error: null })} />
            )}
            {alerts.success && (
              <Alert type="success" message={alerts.success} onClose={() => setAlerts({ ...alerts, success: null })} />
            )}
          </div>
        </div>
      )}

      <div className="row justify-content-center g-3">
        {/* About Me Card */}
        <div className="col-12 col-md-5 col-xl-4">
          <div style={profileCardStyle}>
            <div style={cardHeaderStyle}>
              <h6 style={{ margin: 0, color: '#fff', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={13} />
                {t('aboutMe')}
              </h6>
              {!isEditingAboutMe && (
                <button
                  onClick={handleEditAboutMe}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(70,161,161,0.15)', color: '#3aabdb', border: '1px solid rgba(70,161,161,0.3)', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  <Pencil size={11} />
                  {t('edit')}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {!isEditingAboutMe ? (
              <motion.div key="about-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ padding: '0.85rem 1rem' }}>
                <div className="d-flex align-items-start gap-3">
                  <div style={{ flexShrink: 0 }}>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('profileImageAlt')}
                        style={{ width: '82px', height: '82px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${SECONDARY_COLOR}` }}
                      />
                    ) : (
                      <div style={{ width: '82px', height: '82px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid rgba(70,161,161,0.4)` }}>
                        <User size={32} style={{ color: 'rgba(255,255,255,0.25)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', lineHeight: '1.55', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {profile.bio || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{t('noProfileImage')}</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form key="about-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onSubmit={handleAboutMeSubmit} style={{ padding: '1rem' }}>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                />

                <div className="d-flex align-items-center gap-3 mb-3">
                  <div style={{ flexShrink: 0 }}>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={t('profileImageAlt')}
                        style={{ width: '82px', height: '82px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${SECONDARY_COLOR}` }}
                      />
                    ) : (
                      <div style={{ width: '82px', height: '82px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid rgba(70,161,161,0.4)` }}>
                        <User size={32} style={{ color: 'rgba(255,255,255,0.25)' }} />
                      </div>
                    )}
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm d-flex align-items-center gap-1"
                      disabled={uploadingImage}
                      style={{ background: 'rgba(58,171,219,0.15)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.4)', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    >
                      <Camera size={12} />
                      {imagePreview ? t('changeProfileImage') : t('uploadProfileImage')}
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="btn btn-sm d-flex align-items-center gap-1"
                        disabled={uploadingImage}
                        style={{ background: 'rgba(220,53,69,0.15)', color: '#ff7b7b', border: '1px solid rgba(220,53,69,0.35)', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                      >
                        <Trash2 size={12} />
                        {t('removeProfileImage')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="bio" className="form-label">{t('aboutMe')}</label>
                  <textarea
                    id="bio"
                    name="bio"
                    className="form-control"
                    rows="5"
                    value={aboutMeData.bio}
                    onChange={handleBioChange}
                    placeholder={t('bioPlaceholder')}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn" disabled={loading || uploadingImage} style={{ background: 'rgba(58,171,219,0.15)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.35)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '600' }}>
                    {loading || uploadingImage ? t('updating') : t('save')}
                  </button>
                  <button type="button" onClick={handleCancelAboutMe} className="btn" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '500' }} disabled={loading || uploadingImage}>
                    {t('cancel')}
                  </button>
                </div>
              </motion.form>
            )}
            </AnimatePresence>
          </div>
        </div>

        {/* Account Login Card */}
        <div className="col-12 col-md-6 col-xl-4">
          <div style={profileCardStyle}>
            <div style={cardHeaderStyle}>
              <h6 style={{ margin: 0, color: '#fff', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={13} />
                {t('accountLogin')}
              </h6>
              {!isEditingLogin && (
                <button
                  onClick={handleEditLogin}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(70,161,161,0.15)', color: '#3aabdb', border: '1px solid rgba(70,161,161,0.3)', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  <Pencil size={11} />
                  {t('edit')}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {!isEditingLogin ? (
              <motion.div key="login-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ padding: '0.85rem 1rem' }}>
                <div className="row g-2 mb-3">
                  <div className="col-12 col-sm-6">
                    <div style={sectionLabelStyle}>{t('name')}</div>
                    <div style={sectionValueStyle}>{profile.name}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div style={sectionLabelStyle}>{t('email')}</div>
                    <div style={{ ...sectionValueStyle, wordBreak: 'break-all' }}>{profile.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowForgotPassword(true)}
                  style={{ background: 'none', border: 'none', color: '#3aabdb', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.82rem' }}
                >
                  {t('forgotPassword')}
                </button>
              </motion.div>
            ) : (
              <motion.form key="login-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onSubmit={handleLoginSubmit} style={{ padding: '1rem', overflow: 'hidden' }}>
                <AnimatePresence mode="wait" initial={false}>
                  {loginStep === 1 ? (
                    <motion.div
                      key="login-step1"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.85rem' }}>
                        {t('verifyIdentity')}
                      </p>
                      <div className="mb-4">
                        <label htmlFor="currentPassword" className="form-label">{t('currentPassword')} *</label>
                        <input type="password" id="currentPassword" name="currentPassword" className="form-control" value={loginFormData.currentPassword} onChange={handleLoginChange} autoComplete="current-password" />
                      </div>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn" onClick={handleNextStep} disabled={verifyLoading} style={{ background: 'rgba(58,171,219,0.15)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.35)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '600' }}>
                          {verifyLoading ? t('loading') : t('continueBtn')}
                        </button>
                        <button type="button" onClick={handleCancelLogin} className="btn" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '500' }} disabled={verifyLoading}>
                          {t('cancel')}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login-step2"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <h6 style={{ color: '#3aabdb', marginBottom: '0.75rem' }}>{t('accountInfo')}</h6>
                      <div className="row g-2 mb-2">
                        <div className="col-12 col-sm-6">
                          <label htmlFor="name" className="form-label">{t('name')} *</label>
                          <input type="text" id="name" name="name" className="form-control" value={loginFormData.name} onChange={handleLoginChange} required autoComplete="name" />
                        </div>
                        <div className="col-12 col-sm-6">
                          <label htmlFor="email" className="form-label">{t('email')} *</label>
                          <input type="email" id="email" name="email" className="form-control" value={loginFormData.email} onChange={handleLoginChange} required autoComplete="email" />
                        </div>
                      </div>
                      <hr style={{ margin: '1rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
                      <button
                        type="button"
                        onClick={() => setShowPasswordFields(v => !v)}
                        style={{ background: 'none', border: 'none', outline: 'none', boxShadow: 'none', padding: '0.35rem 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: showPasswordFields ? '#3aabdb' : 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.25rem' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Lock size={13} />
                          {t('changePassword')}
                        </span>
                        {showPasswordFields ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <AnimatePresence initial={false}>
                      {showPasswordFields && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                        {t('leaveBlankToKeepPassword')}
                      </p>
                      <div className="row g-2 mb-3">
                        <div className="col-12 col-sm-6">
                          <label htmlFor="newPassword" className="form-label">{t('newPassword')}</label>
                          <input type="password" id="newPassword" name="newPassword" className="form-control" value={loginFormData.newPassword} onChange={handleLoginChange} autoComplete="new-password" />
                        </div>
                        <div className="col-12 col-sm-6">
                          <label htmlFor="confirmPassword" className="form-label">{t('confirmPassword')}</label>
                          <input type="password" id="confirmPassword" name="confirmPassword" className="form-control" value={loginFormData.confirmPassword} onChange={handleLoginChange} autoComplete="new-password" />
                        </div>
                      </div>
                      </motion.div>
                      )}
                      </AnimatePresence>
                      <div className="d-flex gap-2" style={{ marginTop: '0.75rem' }}>
                        <button type="submit" className="btn" disabled={loading} style={{ background: 'rgba(58,171,219,0.15)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.35)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '600' }}>
                          {loading ? t('updating') : t('save')}
                        </button>
                        <button type="button" onClick={handleCancelLogin} className="btn" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '500' }} disabled={loading}>
                          {t('cancel')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      <AnimatePresence>
      {showForgotPassword && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowForgotPassword(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ color: THEME_COLOR, marginBottom: '1rem' }}>{t('forgotPassword')}</h4>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
              {t('forgotPasswordDescription')}
            </p>
            <form onSubmit={handleForgotPassword}>
              <div className="mb-3">
                <label htmlFor="resetEmail" className="form-label">{t('email')}</label>
                <input type="email" id="resetEmail" className="form-control" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="post-update-btn" disabled={resetLoading} style={{ flex: 1 }}>
                  {resetLoading ? t('sending') : t('sendResetLink')}
                </button>
                <button type="button" onClick={() => setShowForgotPassword(false)} className="btn btn-secondary" disabled={resetLoading} style={{ flex: 1 }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
