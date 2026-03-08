import { useLanguage } from '../contexts/LanguageContext.jsx';
import PropTypes from 'prop-types';
import styles from './LanguageToggle.module.css';
import { hapticLight } from '../utils/haptics.js';

export const LanguageToggle = ({ inverse = false, darkText = false }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div
      className={`${styles.toggleContainer} ${inverse ? styles.inverse : ''} ${darkText ? styles.darkText : ''}`}
      onClick={() => { hapticLight(); toggleLanguage(); }}
      aria-label={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
      title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
      role="button"
      aria-pressed={language === 'es'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleLanguage();
        }
      }}
    >
      <div className={`${styles.track} ${language === 'es' ? styles.trackActive : ''}`}>
        <span className={`${styles.label} ${styles.labelLeft} ${language === 'en' ? styles.labelActive : ''}`}>
          EN
        </span>
        <span className={`${styles.label} ${styles.labelRight} ${language === 'es' ? styles.labelActive : ''}`}>
          ES
        </span>
        <div className={`${styles.slider} ${language === 'es' ? styles.sliderRight : ''}`}>
          {language === 'en' ? 'EN' : 'ES'}
        </div>
      </div>
    </div>
  );
};

LanguageToggle.propTypes = {
  inverse: PropTypes.bool,
  darkText: PropTypes.bool,
};
