import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

export const ScrollToTop = ({ hidden = false }) => {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > 300);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const show = visible && !hidden;

  return (
    <button
      className={`scroll-to-top-btn${show ? ' visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      tabIndex={show ? 0 : -1}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
};

ScrollToTop.propTypes = {
  hidden: PropTypes.bool,
};
