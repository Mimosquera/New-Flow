import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeToken, decodeToken, getToken } from '../utils/tokenUtils.js';
import { AppointmentsManager } from '../components/AppointmentsManager.jsx';
import { UpdatePoster } from '../components/UpdatePoster.jsx';
import { ServiceManager } from '../components/ServiceManager.jsx';
import { AvailabilityManager } from '../components/AvailabilityManager.jsx';
import { EmployeeManager } from '../components/EmployeeManager.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';

// Public placeholder dashboard (no auth redirects)
export default function EmployeeDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Only load from localStorage on refresh (not on navigation)
  const [activeTab, setActiveTab] = useState(() => {
    // Check if this is a page refresh vs navigation
    const isRefresh = sessionStorage.getItem('dashboardVisited') === 'true';
    
    if (isRefresh) {
      // On refresh, load the saved tab
      return localStorage.getItem('employeeDashboardTab') || 'appointments';
    } else {
      // On initial navigation, start fresh
      sessionStorage.setItem('dashboardVisited', 'true');
      return 'appointments';
    }
  });
  
  const [employeeName, setEmployeeName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [showHeaderBg, setShowHeaderBg] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    localStorage.setItem('employeeDashboardTab', activeTab);
  }, [activeTab]);
  
  // Clear session flag when leaving the dashboard
  useEffect(() => {
    return () => {
      if (!location.pathname.includes('/employee/dashboard')) {
        sessionStorage.removeItem('dashboardVisited');
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    // Get employee name from JWT token
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded?.name) {
        setEmployeeName(decoded.name);
        // Check if user is Admin by email
        const adminEmail = import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
        setIsAdmin(decoded.email === adminEmail);
      }
    }
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = 'rgb(5, 45, 63)';
    return () => {
      document.body.style.backgroundColor = '#f5f5f5';
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 10) {
        // At the top of the page
        setShowHeader(true);
        setShowHeaderBg(false);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setShowHeader(true);
        setShowHeaderBg(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up (but not at top)
        setShowHeader(false);
        setShowHeaderBg(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  return (
    <div className="employee-dashboard">
      {/* Dashboard Header - Card Style */}
      <div 
        className="container pt-3 pb-3" 
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1050,
          backgroundColor: showHeaderBg ? 'rgba(248, 249, 250, 0.95)' : 'transparent',
          backdropFilter: showHeaderBg ? 'blur(10px)' : 'none',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
          opacity: showHeader ? 1 : 0
        }}
      >
        <div 
          className="dashboard-header mb-3" 
          style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0.6rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid rgba(5, 45, 63, 0.08)'
          }}
        >
          {/* Single Row: All Content */}
          <div className="d-flex align-items-center" style={{ gap: '0.4rem', width: '100%' }}>
            <h1 className="mb-0" style={{ fontSize: '1.3rem', fontWeight: '600', color: 'rgb(5, 45, 63)', whiteSpace: 'nowrap' }}>
              {t('employeeDashboard')}
            </h1>
            {employeeName && (
              <span 
                style={{ 
                  backgroundColor: 'rgba(5, 45, 63, 0.1)',
                  color: 'rgb(5, 45, 63)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
              >
                {employeeName.split(' ')[0]}
              </span>
            )}
            <div style={{ flexGrow: 1 }}></div>
            <div className="d-flex align-items-center" style={{ gap: '0.3rem' }}>
              <button 
                className="btn btn-sm"
                style={{ 
                  backgroundColor: 'white', 
                  color: 'rgb(5, 45, 63)', 
                  border: '1px solid rgb(5, 45, 63)',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  borderRadius: '4px',
                  lineHeight: '1'
                }}
                onClick={() => navigate('/')}
                title={t('backToHome')}
              >
                ⌂
              </button>
              <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
                <LanguageToggle inverse />
              </div>
              <button 
                className="btn btn-sm"
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  borderRadius: '4px',
                  lineHeight: '1'
                }}
                onClick={() => {
                  if (window.confirm(t('logoutConfirm'))) {
                    removeToken();
                    navigate('/');
                  }
                }}
                title={t('logout')}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: Horizontal Tabs */}
        <div className="mb-0 pb-3">
          <ul className="nav nav-tabs d-none d-md-flex mb-0">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setActiveTab('appointments')}
                style={activeTab !== 'appointments' ? { color: 'rgb(5, 45, 63)' } : {}}
              >
                {t('appointments')}
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'updates' ? 'active' : ''}`}
                onClick={() => setActiveTab('updates')}
                style={activeTab !== 'updates' ? { color: 'rgb(5, 45, 63)' } : {}}
              >
                {t('postsTab')}
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'services' ? 'active' : ''}`}
                onClick={() => setActiveTab('services')}
                style={activeTab !== 'services' ? { color: 'rgb(5, 45, 63)' } : {}}
              >
                {t('services')}
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'availability' ? 'active' : ''}`}
                onClick={() => setActiveTab('availability')}
                style={activeTab !== 'availability' ? { color: 'rgb(5, 45, 63)' } : {}}
              >
                {t('availability')}
              </button>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'team' ? 'active' : ''}`}
                  onClick={() => setActiveTab('team')}
                  style={activeTab !== 'team' ? { color: 'rgb(5, 45, 63)' } : {}}
                >
                  {t('team') || 'Team'}
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Section Headers */}
        {activeTab === 'appointments' && (
          <div className="d-flex align-items-center justify-content-between mb-0">
            <div className="d-flex align-items-center">
              <img 
                src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
                alt="Logo"
                style={{ height: '2rem', marginRight: '0.75rem' }}
              />
              <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>{t('appointmentRequests')}</h2>
            </div>
            <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
              {/* Mobile Tab Dropdown */}
              <div className="d-md-none" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.35rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'white', fontSize: '0.75rem', zIndex: 1 }}>☰</div>
                <select
                  id="mobileTabSelectAppt"
                  name="mobileTabSelectAppt"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  autoComplete="off"
                  style={{
                    backgroundColor: 'rgb(5, 45, 63)',
                    color: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.25rem 5px 0.25rem 0.35rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    appearance: 'none',
                    width: '35px',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'white\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.15rem center',
                    backgroundSize: '10px'
                  }}
                >
                  <option value="appointments" style={{ color: 'black', backgroundColor: 'white' }}>{t('appointments')}</option>
                  <option value="updates" style={{ color: 'black', backgroundColor: 'white' }}>{t('postsTab')}</option>
                  <option value="services" style={{ color: 'black', backgroundColor: 'white' }}>{t('services')}</option>
                  <option value="availability" style={{ color: 'black', backgroundColor: 'white' }}>{t('availability')}</option>
                  {isAdmin && <option value="team" style={{ color: 'black', backgroundColor: 'white' }}>{t('team') || 'Team'}</option>}
                </select>
              </div>
              {/* Filter on desktop only */}
              <div className="d-none d-md-block">
                <label htmlFor="statusFilterHeader" className="form-label me-2 mb-0">{t('filter')}:</label>
                <select
                  id="statusFilterHeader"
                  name="statusFilterHeader"
                  className="form-select d-inline-block w-auto"
                  value={appointmentFilter}
                  onChange={(e) => setAppointmentFilter(e.target.value)}
                  autoComplete="off"
                >
                  <option value="all">{t('allAppointments')}</option>
                  <option value="upcoming">{t('upcoming')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="accepted">{t('accepted')}</option>
                  <option value="declined">{t('declined')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'updates' && (
          <div className="d-flex align-items-center justify-content-between mb-0">
            <div className="d-flex align-items-center">
              <img 
                src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
                alt="Logo"
                style={{ height: '2rem', marginRight: '0.75rem' }}
              />
              <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>{t('managePosts')}</h2>
            </div>
            <div className="d-md-none" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.35rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'white', fontSize: '0.75rem', zIndex: 1 }}>☰</div>
              <select
                id="mobileTabSelectUpdates"
                name="mobileTabSelectUpdates"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                autoComplete="off"
                style={{
                  backgroundColor: 'rgb(5, 45, 63)',
                  color: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.25rem 5px 0.25rem 0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  appearance: 'none',
                  width: '35px',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'white\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.15rem center',
                  backgroundSize: '10px'
                }}
              >
                <option value="appointments" style={{ color: 'black', backgroundColor: 'white' }}>{t('appointments')}</option>
                <option value="updates" style={{ color: 'black', backgroundColor: 'white' }}>{t('postsTab')}</option>
                <option value="services" style={{ color: 'black', backgroundColor: 'white' }}>{t('services')}</option>
                <option value="availability" style={{ color: 'black', backgroundColor: 'white' }}>{t('availability')}</option>
                {isAdmin && <option value="team" style={{ color: 'black', backgroundColor: 'white' }}>{t('team') || 'Team'}</option>}
              </select>
            </div>
          </div>
        )}
        {activeTab === 'services' && (
          <div className="d-flex align-items-center justify-content-between mb-0">
            <div className="d-flex align-items-center">
              <img 
                src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
                alt="Logo"
                style={{ height: '2rem', marginRight: '0.75rem' }}
              />
              <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>{t('manageServices')}</h2>
            </div>
            <div className="d-md-none" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.35rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'white', fontSize: '0.75rem', zIndex: 1 }}>☰</div>
              <select
                id="mobileTabSelectServices"
                name="mobileTabSelectServices"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                autoComplete="off"
                style={{
                  backgroundColor: 'rgb(5, 45, 63)',
                  color: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.25rem 5px 0.25rem 0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  appearance: 'none',
                  width: '35px',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'white\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.15rem center',
                  backgroundSize: '10px'
                }}
              >
                <option value="appointments" style={{ color: 'black', backgroundColor: 'white' }}>{t('appointments')}</option>
                <option value="updates" style={{ color: 'black', backgroundColor: 'white' }}>{t('postsTab')}</option>
                <option value="services" style={{ color: 'black', backgroundColor: 'white' }}>{t('services')}</option>
                <option value="availability" style={{ color: 'black', backgroundColor: 'white' }}>{t('availability')}</option>
                {isAdmin && <option value="team" style={{ color: 'black', backgroundColor: 'white' }}>{t('team') || 'Team'}</option>}
              </select>
            </div>
          </div>
        )}
        {activeTab === 'availability' && (
          <div className="d-flex align-items-center justify-content-between mb-0">
            <div className="d-flex align-items-center">
              <img 
                src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
                alt="Logo"
                style={{ height: '2rem', marginRight: '0.75rem' }}
              />
              <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>{t('manageAvailability')}</h2>
            </div>
            <div className="d-md-none" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.35rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'white', fontSize: '0.75rem', zIndex: 1 }}>☰</div>
              <select
                id="mobileTabSelectAvailability"
                name="mobileTabSelectAvailability"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                autoComplete="off"
                style={{
                  backgroundColor: 'rgb(5, 45, 63)',
                  color: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.25rem 5px 0.25rem 0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  appearance: 'none',
                  width: '35px',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'white\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.15rem center',
                  backgroundSize: '10px'
                }}
              >
                <option value="appointments" style={{ color: 'black', backgroundColor: 'white' }}>{t('appointments')}</option>
                <option value="updates" style={{ color: 'black', backgroundColor: 'white' }}>{t('postsTab')}</option>
                <option value="services" style={{ color: 'black', backgroundColor: 'white' }}>{t('services')}</option>
                <option value="availability" style={{ color: 'black', backgroundColor: 'white' }}>{t('availability')}</option>
                {isAdmin && <option value="team" style={{ color: 'black', backgroundColor: 'white' }}>{t('team') || 'Team'}</option>}
              </select>
            </div>
          </div>
        )}
        {activeTab === 'team' && isAdmin && (
          <div className="d-flex align-items-center justify-content-between mb-0">
            <div className="d-flex align-items-center">
              <img 
                src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
                alt="Logo"
                style={{ height: '2rem', marginRight: '0.75rem' }}
              />
              <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>{t('manageTeam') || 'Manage Team'}</h2>
            </div>
            <div className="d-md-none" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.35rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'white', fontSize: '0.75rem', zIndex: 1 }}>☰</div>
              <select
                id="mobileTabSelectTeam"
                name="mobileTabSelectTeam"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                autoComplete="off"
                style={{
                  backgroundColor: 'rgb(5, 45, 63)',
                  color: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.25rem 5px 0.25rem 0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  appearance: 'none',
                  width: '35px',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'white\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.15rem center',
                  backgroundSize: '10px'
                }}
              >
                <option value="appointments" style={{ color: 'black', backgroundColor: 'white' }}>{t('appointments')}</option>
                <option value="updates" style={{ color: 'black', backgroundColor: 'white' }}>{t('postsTab')}</option>
                <option value="services" style={{ color: 'black', backgroundColor: 'white' }}>{t('services')}</option>
                <option value="availability" style={{ color: 'black', backgroundColor: 'white' }}>{t('availability')}</option>
                <option value="team" style={{ color: 'black', backgroundColor: 'white' }}>{t('team') || 'Team'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'appointments' && <AppointmentsManager filter={appointmentFilter} setFilter={setAppointmentFilter} />}
      {activeTab === 'updates' && <UpdatePoster />}
      {activeTab === 'services' && <ServiceManager />}
      {activeTab === 'availability' && <AvailabilityManager />}
      {activeTab === 'team' && isAdmin && <EmployeeManager />}

      {/* Footer */}
      <div className="container pt-5 pb-4" style={{ marginTop: '4rem' }}>
        <div className="text-center">
          <img 
            src={new URL('../assets/images/full-logo-transparent-nobuffer.png', import.meta.url).href}
            alt="New Flow Logo"
            style={{ maxWidth: '300px', width: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
