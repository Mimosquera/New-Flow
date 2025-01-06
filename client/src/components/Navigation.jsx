import React from "react";
import { Link } from "react-router-dom";

const Navigation = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-nav d-flex flex-row">
        <li className="nav-item">
          <Link className="nav-link light-text" to="/">Home</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link light-text" to="/about">About</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link light-text" to="/appointments">Appointments</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link light-text" to="/login">Log In</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;