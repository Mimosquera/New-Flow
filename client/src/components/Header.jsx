import Navigation from './Navigation.jsx'
import logo from '../assets/images/full-logo-nobuffer.jpg'

const Header = () => {
    return (
    <header className="header container-fluid">
            <img src={logo} alt="New Flow Beauty Salon & Barber Shop Logo" className="header-logo" />
            <Navigation />
    </header>
    )
}

export default Header;