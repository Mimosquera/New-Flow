import Navigation from './Navigation.jsx'
import logo from '../assets/images/full-logo-nobuffer.jpg'

const Header = () => {
    return (
        <header className="header site-header container-fluid d-flex align-items-center justify-content-between">
          <div className="logo-container text-center flex-grow-1">
            <img src={logo} alt="New Flow Beauty Salon & Barber Shop Logo" className="header-logo" />
          </div>
          <Navigation />
        </header>
    );
};

export default Header;