import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Calendar, Clock, FileText, Scissors, Users } from 'lucide-react';
import { removeToken, decodeToken, getToken } from '../utils/tokenUtils.js';
import { hapticLight } from '../utils/haptics.js';
import { AppointmentsManager } from '../components/AppointmentsManager.jsx';
import { UpdatePoster } from '../components/UpdatePoster.jsx';
import { ServiceManager } from '../components/ServiceManager.jsx';
import { AvailabilityManager } from '../components/AvailabilityManager.jsx';
import { EmployeeManager } from '../components/EmployeeManager.jsx';
import { ProfileManager } from '../components/ProfileManager.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import { ScrollToTop } from '../components/ScrollToTop.jsx';

export default function EmployeeDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    const isRefresh = sessionStorage.getItem('dashboardVisited') === 'true';
    if (isRefresh) {
      return localStorage.getItem('employeeDashboardTab') || 'profile';
    }
    sessionStorage.setItem('dashboardVisited', 'true');
    return 'profile';
  });
  
  const [employeeName, setEmployeeName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('employeeDashboardTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (!location.pathname.includes('/employee/dashboard')) {
        sessionStorage.removeItem('dashboardVisited');
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded?.name) {
        setEmployeeName(decoded.name);
        setIsAdmin(decoded.email === import.meta.env.VITE_SEED_EMPLOYEE_EMAIL);
      }
    }
  }, []);

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    document.body.style.background = '#000000';
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY <= 50 || scrollY < lastScrollYRef.current) {
        setShowHeader(true);
      } else {
        setShowHeader(false);
      }
      lastScrollYRef.current = scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.background = '#000000';
    };
  }, []);

  return (
    <div className="employee-dashboard" style={{ background: 'linear-gradient(135deg, rgb(5, 45, 63) 0%, #fff 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        className="dashboard-header-sticky"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1050,
          background: 'linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(5, 45, 63) 100%)',
          borderBottom: '2px solid #46a1a1',
          padding: '0.5rem 1rem',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
          opacity: showHeader ? 1 : 0,
        }}
      >
        <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>

          {/* Left: Logo + name badge */}
          <div className="d-flex align-items-center" style={{ gap: '0.5rem', flexShrink: 0 }}>
            <img
              src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
              alt="Logo"
              style={{ height: '1.4rem', flexShrink: 0 }}
            />
            {employeeName && (<>
              <span className="d-lg-none" style={{
                backgroundColor: 'rgba(70, 161, 161, 0.25)',
                color: '#ffffff',
                padding: '0.15rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
              }}>
                {employeeName.split(' ')[0]}
              </span>
              <span className="d-none d-lg-inline" style={{
                backgroundColor: 'rgba(70, 161, 161, 0.28)',
                color: '#ffffff',
                padding: '0.18rem 0.55rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                border: '1px solid rgba(70, 161, 161, 0.5)',
                letterSpacing: '0.01em',
              }}>
                {employeeName.split(' ')[0]}
              </span>
            </>)}
          </div>

          {/* Center: Desktop tabs */}
          <div className="d-none d-lg-flex" style={{ flex: 1, justifyContent: 'center' }}>
            <ul className="nav nav-tabs mb-0 dashboard-tabs" style={{ flexWrap: 'nowrap', borderBottom: 'none' }}>
              <li className="nav-item">
                <button className={`nav-link d-flex align-items-center gap-1 ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { hapticLight(); setActiveTab('profile'); }}>
                  <User size={13} />{t('profile')}
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link d-flex align-items-center gap-1 ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => { hapticLight(); setActiveTab('appointments'); }}>
                  <Calendar size={13} />{t('appointments')}
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link d-flex align-items-center gap-1 ${activeTab === 'availability' ? 'active' : ''}`} onClick={() => { hapticLight(); setActiveTab('availability'); }}>
                  <Clock size={13} />{t('availability')}
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link d-flex align-items-center gap-1 ${activeTab === 'updates' ? 'active' : ''}`} onClick={() => { hapticLight(); setActiveTab('updates'); }}>
                  <FileText size={13} />{t('postsTab')}
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link d-flex align-items-center gap-1 ${activeTab === 'services' ? 'active' : ''}`} onClick={() => { hapticLight(); setActiveTab('services'); }}>
                  <Scissors size={13} />{t('services')}
                </button>
              </li>
              {isAdmin && (
                <li className="nav-item">
                  <button className={`nav-link d-flex align-items-center gap-1 ${activeTab === 'team' ? 'active' : ''}`} onClick={() => { hapticLight(); setActiveTab('team'); }}>
                    <Users size={13} />{t('team')}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Center: Mobile tab select */}
          <div className="d-lg-none" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <select
              id="mobileTabSelect"
              name="mobileTabSelect"
              value={activeTab}
              onChange={(e) => { hapticLight(); setActiveTab(e.target.value); }}
              autoComplete="off"
              style={{
                backgroundColor: 'rgba(70, 161, 161, 0.15)',
                color: 'white',
                border: '1.5px solid rgba(70, 161, 161, 0.5)',
                borderRadius: '8px',
                padding: '0.3rem 1.6rem 0.3rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: '500',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                width: 'auto',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%2346a1a1\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.4rem center',
                backgroundSize: '10px',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <option value="profile" style={{ color: '#000', backgroundColor: '#fff' }}>{t('profile')}</option>
              <option value="appointments" style={{ color: '#000', backgroundColor: '#fff' }}>{t('appointments')}</option>
              <option value="availability" style={{ color: '#000', backgroundColor: '#fff' }}>{t('availability')}</option>
              <option value="updates" style={{ color: '#000', backgroundColor: '#fff' }}>{t('postsTab')}</option>
              <option value="services" style={{ color: '#000', backgroundColor: '#fff' }}>{t('services')}</option>
              {isAdmin && <option value="team" style={{ color: '#000', backgroundColor: '#fff' }}>{t('team')}</option>}
            </select>
          </div>

          {/* Right: Home + Language toggle */}
          <div className="d-flex align-items-center" style={{ gap: '0.4rem', flexShrink: 0 }}>
            <button
              className="btn btn-sm dashboard-home-btn"
              onClick={() => navigate('/')}
              title={t('backToHome')}
            >
              <Home size={14} />
            </button>
            <div style={{ width: '53px', height: '24px', position: 'relative', flexShrink: 0 }}>
              <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                <LanguageToggle inverse />
              </div>
            </div>
          </div>

        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ flex: 1 }}
        >
          {activeTab === 'appointments' && <AppointmentsManager filter={appointmentFilter} setFilter={setAppointmentFilter} />}
          {activeTab === 'updates' && <UpdatePoster />}
          {activeTab === 'services' && <ServiceManager />}
          {activeTab === 'availability' && <AvailabilityManager />}
          {activeTab === 'profile' && (
            <ProfileManager
              onLogout={() => {
                removeToken();
                navigate('/');
              }}
            />
          )}
          {activeTab === 'team' && isAdmin && <EmployeeManager />}
        </motion.div>
      </AnimatePresence>

      <div style={{ textAlign: 'center', padding: '2.5rem 0 1.5rem' }}>
        <img
          src={new URL('../assets/images/full-logo-transparent-nobuffer.png', import.meta.url).href}
          alt="New Flow Logo"
          style={{ maxWidth: '80px', opacity: 0.9 }}
        />
      </div>
      <ScrollToTop />
    </div>
  );
}
