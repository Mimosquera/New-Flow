import { Link } from "react-router-dom";

const Navigation = () => {
  return (
    <nav className="nav container">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/appointments">Appointments</Link></li>
      </ul>
    </nav>
  );
};

export default Navigation;