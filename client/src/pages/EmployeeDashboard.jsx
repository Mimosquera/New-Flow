import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeToken, decodeToken, getToken } from '../utils/tokenUtils.js';
import { AppointmentsManager } from '../components/AppointmentsManager.jsx';
import { UpdatePoster } from '../components/UpdatePoster.jsx';
import { ServiceManager } from '../components/ServiceManager.jsx';
import { AvailabilityManager } from '../components/AvailabilityManager.jsx';
import { EmployeeManager } from '../components/EmployeeManager.jsx';
import { ProfileManager } from '../components/ProfileManager.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import { ScrollToTop } from '../components/ScrollToTop.jsx';

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
      return localStorage.getItem('employeeDashboardTab') || 'profile';
    } else {
      // On initial navigation, start fresh
      sessionStorage.setItem('dashboardVisited', 'true');
      return 'profile';
    }
  });
  
  const [employeeName, setEmployeeName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState('all');

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

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    // Always start with solid black background
    document.body.style.background = '#000000';
    const handleScroll = () => {
      // On every scroll to top, bottom, or upward scroll, set background to black
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      if (
        scrollY <= 10 ||
        scrollY + clientHeight >= scrollHeight - 10 ||
        scrollY < lastScrollYRef.current
      ) {
        document.body.style.background = '#000000';
      }
      // Sticky header logic
      if (scrollY <= 10) {
        setShowHeader(true);
      } else if (scrollY <= 50) {
        setShowHeader(true);
      } else if (scrollY > lastScrollYRef.current) {
        setShowHeader(false);
      } else if (scrollY < lastScrollYRef.current) {
        setShowHeader(true);
      }
      lastScrollYRef.current = scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.background = '#000000';
    };
  }, []);

  // Helper for sticky header margin
  const headerTop = showHeader && window.scrollY <= 10 ? '3px' : '0';

  return (
    <div className="employee-dashboard" style={{ background: 'linear-gradient(135deg, rgb(5, 45, 63) 0%, #fff 100%)', minHeight: '100vh' }}>
      {/* Dashboard Header - Card Style */}
      <div 
        className="container pt-3 pb-3 dashboard-header-sticky"
        style={{ 
          position: 'sticky', 
          top: headerTop, 
          zIndex: 1050,
          backgroundColor: '#cfd8dc',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
          opacity: showHeader ? 1 : 0,
        }}
      >
        <div 
          className="dashboard-header mb-3"
          style={{ 
            backgroundColor: '#cfd8dc',
            borderRadius: '8px',
            padding: '0.6rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #b0bec5'
          }}
        >
          {/* Header Row */}
          <div className="d-flex align-items-center" style={{ width: '100%' }}>
            {/* Left: Title + Badge */}
            <div className="d-flex align-items-center" style={{ minWidth: 0, flex: '1 1 auto', gap: '0.4rem', overflow: 'hidden' }}>
              <h1 className="mb-0 dashboard-title" style={{ 
                fontSize: '1.3rem', fontWeight: '600', color: 'rgb(5, 45, 63)', 
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 
              }}>
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
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {employeeName.split(' ')[0]}
                </span>
              )}
            </div>
            {/* Right: Actions */}
            <div className="d-flex align-items-center" style={{ flexShrink: 0, gap: '0.4rem', marginLeft: '0.5rem' }}>
              <button 
                className="btn btn-sm dashboard-home-btn"
                onClick={() => navigate('/')}
                title={t('backToHome')}
              >
                <span>⌂</span>
              </button>
              <div style={{ 
                width: '53px', 
                height: '24px', 
                position: 'relative',
                flexShrink: 0
              }}>
                <div style={{ 
                  transform: 'scale(0.75)', 
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}>
                  <LanguageToggle inverse darkText />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header + Nav: Single Row */}
        <div className="d-flex align-items-center justify-content-between mb-0" style={{ gap: '0.5rem' }}>
          {/* Left: Logo + Dynamic Title */}
          <div className="d-flex align-items-center" style={{ flexShrink: 0 }}>
            <img 
              src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
              alt="Logo"
              style={{ height: '1.5rem', marginRight: '0.5rem' }}
            />
            <h2 className="mb-0" style={{ fontSize: '1.5rem', whiteSpace: 'nowrap' }}>
              {activeTab === 'profile' && t('myProfile')}
              {activeTab === 'appointments' && t('appointmentRequests')}
              {activeTab === 'availability' && t('manageAvailability')}
              {activeTab === 'updates' && t('managePosts')}
              {activeTab === 'services' && t('manageServices')}
              {activeTab === 'team' && (t('manageTeam') || 'Manage Team')}
            </h2>
          </div>

          {/* Right on desktop: Tabs */}
          <div className="d-none d-lg-flex" style={{ minWidth: 0, flex: '1 1 auto', justifyContent: 'flex-end' }}>
            <ul className="nav nav-tabs mb-0 dashboard-tabs" style={{ flexWrap: 'nowrap', borderBottom: 'none' }}>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  {t('profile')}
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  {t('appointments')}
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'availability' ? 'active' : ''}`}
                  onClick={() => setActiveTab('availability')}
                >
                  {t('availability')}
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'updates' ? 'active' : ''}`}
                  onClick={() => setActiveTab('updates')}
                >
                  {t('postsTab')}
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'services' ? 'active' : ''}`}
                  onClick={() => setActiveTab('services')}
                >
                  {t('services')}
                </button>
              </li>
              {isAdmin && (
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'team' ? 'active' : ''}`}
                    onClick={() => setActiveTab('team')}
                  >
                    {t('team') || 'Team'}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Right on mobile: Hamburger Dropdown */}
          <div className="d-lg-none" style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', left: '0.35rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'white', fontSize: '0.75rem', zIndex: 1 }}>☰</div>
            <select
              id="mobileTabSelect"
              name="mobileTabSelect"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              autoComplete="off"
              style={{
                backgroundColor: 'rgb(5, 45, 63)',
                color: 'transparent',
                border: '2.5px solid #b0bec5',
                borderRadius: '6px',
                padding: '0.25rem 5px 0.25rem 0.35rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                appearance: 'none',
                width: '35px',
                boxShadow: '0 0 10px rgba(176, 190, 197, 0.8), 0 0 20px rgba(176, 190, 197, 0.5), 0 0 30px rgba(5, 45, 63, 0.4)',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'white\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.15rem center',
                backgroundSize: '10px'
              }}
            >
              <option value="profile" style={{ color: 'black', backgroundColor: 'white' }}>{t('profile')}</option>
              <option value="appointments" style={{ color: 'black', backgroundColor: 'white' }}>{t('appointments')}</option>
              <option value="availability" style={{ color: 'black', backgroundColor: 'white' }}>{t('availability')}</option>
              <option value="updates" style={{ color: 'black', backgroundColor: 'white' }}>{t('postsTab')}</option>
              <option value="services" style={{ color: 'black', backgroundColor: 'white' }}>{t('services')}</option>
              {isAdmin && <option value="team" style={{ color: 'black', backgroundColor: 'white' }}>{t('team') || 'Team'}</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Content */}
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

      {/* Footer */}
      <div className="container pt-5 pb-4" style={{ marginTop: '4rem' }}>
        <div className="text-center">
          <img
            src={new URL('../assets/images/full-logo-transparent-nobuffer.png', import.meta.url).href}
            alt="New Flow Logo"
            className="dashboard-logo"
          />
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
