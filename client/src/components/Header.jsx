import Navigation from './Navigation.jsx';
import logo from '../assets/images/logo-transparent.png';
import React from 'react';

const Header = ({loggedIn}) => {
  return (
    <header className="site-header container-fluid">
      {/* Logo Container */}
      <div className="logo-container">
        <img
          src={logo}
          alt="New Flow Beauty Salon & Barber Shop Logo"
          className="header-logo"
        />
      </div>

      {/* Navigation Wrapper */}
      <div className="navigation-wrapper">
        <Navigation loggedIn = {loggedIn}/>
      </div>
    </header>
  );
};

export default Header;