import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false); // Track login state

  return (
    <div className="d-flex flex-column min-vh-100 w-100">
      <Router>
        <Header />
        <main className="flex-grow-1 w-100">
          <Routes>
            <Route path="/" element={<HomePage loggedIn={loggedIn} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
