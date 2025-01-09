import React, { useState, useLayoutEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import LoginPage from "./pages/LoginPage.tsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import SignupPage from "./pages/SignupPage.tsx";
import auth from './utils/auth';

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false); // Track login state
  useLayoutEffect(() => {
    checkLogin();
}, []);

const checkLogin = () => {
    if (auth.loggedIn()) {
        setLoggedIn(true);
    }
};
  return (
    <div className="d-flex flex-column min-vh-100 w-100">
      <Router>
        <Header loggedIn={loggedIn}/>
        <main className="flex-grow-1 w-100">
          <Routes>
            <Route path="/" element={<HomePage loggedIn={loggedIn} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage/>} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
