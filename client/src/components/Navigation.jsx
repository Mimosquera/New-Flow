import { Link } from "react-router-dom";

const Navigation = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light sticky-top">
      <div className="container-fluid">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item"> <Link className="nav-link" to="/">Home</Link> </li>
          <li className="nav-item"> <Link className="nav-link" to="/about">About</Link> </li>
          <li className="nav-item"> <Link className="nav-link" to="/appointments">Appointments</Link> </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
