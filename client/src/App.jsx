import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HomePage } from './pages/home/HomePage.jsx';
import { BookingPage } from './pages/book/BookingPage.jsx';
import { LoginPage } from './pages/login/LoginPage.jsx';
import { PasswordResetPage } from './pages/reset-password/PasswordResetPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import { CancelPage } from './pages/cancel/CancelPage.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -18, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection) selection.removeAllRanges();
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleButtonBlur = (e) => {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        setTimeout(() => {
          if (document.activeElement) document.activeElement.blur();
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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage onNavigateToBooking={handleBookingClick} />} />
              <Route path="/appointments" element={<BookingPage />} />
              <Route path="/employee-login" element={<LoginPage />} />
              <Route path="/reset-password/:token" element={<PasswordResetPage />} />
              <Route path="/employee-dashboard" element={<DashboardPage />} />
              <Route path="/cancel-appointment/:id" element={<CancelPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </LanguageProvider>
  );
}

export default App;
