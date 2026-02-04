import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage.jsx';
import { AppointmentsPage } from './pages/AppointmentsPage.jsx';
import { EmployeeLoginPage } from './pages/EmployeeLoginPage.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import { CancelAppointmentPage } from './pages/CancelAppointmentPage.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';

/**
 * Main App Component
 */
function App() {
  const navigate = useNavigate();

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
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/cancel-appointment/:id" element={<CancelAppointmentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </LanguageProvider>
  );
}

export default App;
