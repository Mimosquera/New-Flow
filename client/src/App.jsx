import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { HomePage } from './pages/HomePage.jsx';
import { AppointmentsPage } from './pages/AppointmentsPage.jsx';
import { EmployeeLoginPage } from './pages/EmployeeLoginPage.jsx';
import { PasswordResetPage } from './pages/PasswordResetPage.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import { CancelAppointmentPage } from './pages/CancelAppointmentPage.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';

/**
 * Main App Component
 */
function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Clear focus and selections when navigating between pages
  useEffect(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }

    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }

    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Auto-blur buttons after tap on mobile
  useEffect(() => {
    const handleButtonBlur = (e) => {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        setTimeout(() => {
          if (document.activeElement) {
            document.activeElement.blur();
          }
        }, 100);
      }
    };

    document.addEventListener('touchend', handleButtonBlur);
    document.addEventListener('click', handleButtonBlur);

    return () => {
      document.removeEventListener('touchend', handleButtonBlur);
      document.removeEventListener('click', handleButtonBlur);
    };
  }, []);

  const handleBookingClick = () => {
    navigate('/appointments');
  };

  return (
    <LanguageProvider>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage onNavigateToBooking={handleBookingClick} />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/employee-login" element={<EmployeeLoginPage />} />
          <Route path="/reset-password/:token" element={<PasswordResetPage />} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/cancel-appointment/:id" element={<CancelAppointmentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </LanguageProvider>
  );
}

export default App;
