import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

const App = () => {
  return (
    <div className="d-flex flex-column min-vh-100 w-100">
      <Router>
          <Header />
        <main className="flex-grow-1 w-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Routes>
        </main>
          <Footer />
      </Router>
    </div>
  );
};

export default App;
