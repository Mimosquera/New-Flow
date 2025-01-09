import React from "react";
import { Link } from "react-router-dom";
import auth from "../utils/auth"

const Navigation = ({ loggedIn }) => {
  function handleLogout() {
    auth.logout()
  }
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
        {
          loggedIn ?
            <li className="nav-item">
              <div className="nav-link light-text" onClick={handleLogout}>Logout</div>
            </li>
            :
            <>
              <li className="nav-item">
                <Link className="nav-link light-text" to="/login">Log In</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link light-text" to="/signup">Signup</Link>
              </li>
            </>
        }

      </ul>
    </nav>
  );
};

export default Navigation;