import React, { useState, useLayoutEffect, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import LoginPage from "./pages/LoginPage.tsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import SignupPage from "./pages/SignupPage.tsx";
import auth from "./utils/auth";

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false); // Track login state
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en"); // Track selected language
  const [originalTexts, setOriginalTexts] = useState(new Map()); // Store original texts
  const API_KEY = "AIzaSyBLpC5Z-eAyCp1N2aHFW2K8zNThdjXZhzY";

  useLayoutEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = () => {
    if (auth.loggedIn()) {
      setLoggedIn(true);
    }
  };

  const translatePage = async (targetLanguage) => {
    const elements = Array.from(
      document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, a")
    );

    if (targetLanguage === "en") {
      // Restore original text if "en" is selected
      elements.forEach((el) => {
        el.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const originalText = originalTexts.get(node);
            if (originalText) {
              node.textContent = originalText;
            }
          }
        });
      });
      return;
    }

    // Store original text if not already stored
    const newOriginalTexts = new Map(originalTexts);
    elements.forEach((el) => {
      el.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && !newOriginalTexts.has(node)) {
          newOriginalTexts.set(node, node.textContent);
        }
      });
    });
    setOriginalTexts(newOriginalTexts);

    // Extract text content for translation
    const texts = elements
      .flatMap((el) =>
        Array.from(el.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent.trim())
      )
      .filter((text) => text);

    if (texts.length === 0) return; // Skip if no text is found

    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        {
          q: texts,
          target: targetLanguage,
          format: "text",
        },
        {
          params: { key: API_KEY },
        }
      );

      const translations = response.data.data.translations;

      // Apply translations to corresponding text nodes
      let translationIndex = 0;
      elements.forEach((el) => {
        el.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = translations[translationIndex].translatedText;
            translationIndex++;
          }
        });
      });
    } catch (error) {
      console.error("Error translating page:", error);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    localStorage.setItem("language", newLanguage); // Save the selected language
    setLanguage(newLanguage); // Update state
  };

  const LocationChangeHandler = () => {
    const location = useLocation();

    useEffect(() => {
      translatePage(language); // Reapply translation on route change
    }, [location.pathname]); // Trigger on route changes

    return null; // This component doesn't render anything
  };

  return (
    <div className="d-flex flex-column min-vh-100 w-100">
      <Router>
        <LocationChangeHandler />
        <Header loggedIn={loggedIn} />
        <main className="flex-grow-1 w-100">
          <Routes>
            <Route path="/" element={<HomePage loggedIn={loggedIn} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </main>
        <Footer onLanguageChange={handleLanguageChange} />
      </Router>
    </div>
  );
};

export default App;
  