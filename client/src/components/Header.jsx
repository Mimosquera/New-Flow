import Navigation from './Navigation.jsx';
import logo from '../assets/images/logo-transparent.png';
import React from 'react';

const Header = () => {
  return (
    <header className="site-header container-fluid d-flex align-items-center justify-content-between position-relative">
      {/* Logo Container */}
      <div className="logo-container position-absolute top-50 start-50 translate-middle">
        <img
          src={logo}
          alt="New Flow Beauty Salon & Barber Shop Logo"
          className="header-logo"
        />
      </div>

      {/* Navigation Wrapper */}
      <div className="navigation-wrapper d-flex justify-content-end">
        <Navigation />
      </div>
    </header>
  );
};

export default Header;