import { useLanguage } from '../contexts/LanguageContext.jsx';
import PropTypes from 'prop-types';

export const LanguageToggle = ({ inverse = false }) => {
  const { language, toggleLanguage } = useLanguage();

  const defaultStyle = {
    backgroundColor: inverse ? 'rgb(5, 45, 63)' : 'transparent',
    color: inverse ? 'white' : 'rgb(5, 45, 63)',
    border: '1px solid rgb(5, 45, 63)',
  };

  const hoverStyle = {
    backgroundColor: inverse ? 'transparent' : 'rgb(5, 45, 63)',
    color: inverse ? 'rgb(5, 45, 63)' : 'white',
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-sm"
      style={{
        ...defaultStyle,
        fontWeight: '500',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        transition: 'all 0.3s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor;
        e.currentTarget.style.color = hoverStyle.color;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = defaultStyle.backgroundColor;
        e.currentTarget.style.color = defaultStyle.color;
      }}
      title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
    >
      {language === 'en' ? 'ES' : 'EN'}
    </button>
  );
};

LanguageToggle.propTypes = {
  inverse: PropTypes.bool,
};
