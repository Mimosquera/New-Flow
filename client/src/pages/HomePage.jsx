import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/tokenUtils.js';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics.js';
import { updateService, serviceService, SERVER_BASE_URL } from '../services/api.js';
import { UpdateModal } from '../components/UpdateModal.jsx';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import { ScrollToTop } from '../components/ScrollToTop.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { useTranslateItems } from '../hooks/useTranslateItems.js';
import styles from './HomePage.module.css';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

export const HomePage = ({ onNavigateToBooking }) => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const [services, setServices] = useState([]);
  const getDefaultServiceCount = () => window.innerWidth < 768 ? 4 : 3;
  const [serviceDisplayCount, setServiceDisplayCount] = useState(getDefaultServiceCount);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const serviceCardsRef = useRef([]);

  const [news, setNews] = useState([]);
  const [displayCount, setDisplayCount] = useState(4);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const servicesEndRef = useRef(null);
  const updatesEndRef = useRef(null);

  const handleUpdateClick = (update) => {
    hapticLight();
    setSelectedUpdate(update);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUpdate(null);
  };

  const [translatedServices, translatingServices] = useTranslateItems(services, ['name', 'description'], language);
  const [translatedNews, translatingNews] = useTranslateItems(news, ['title', 'content', 'author'], language);
  const translating = translatingServices || translatingNews;

  const fetchServices = useCallback(async () => {
    try {
      const response = await serviceService.getAll();
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, []);

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await updateService.getAll();
      setNews(response.data.updates);
      setTotalUpdates(response.data.total);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
    fetchUpdates();
    fetchServices();
  }, [fetchUpdates, fetchServices]);

  const handleViewMore = () => setDisplayCount(prev => prev + 4);

  const handleShowLess = () => {
    setDisplayCount(4);
    setTimeout(() => {
      updatesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleShowAllServices = () => setServiceDisplayCount(services.length);

  const handleHideServices = () => {
    setServiceDisplayCount(getDefaultServiceCount());
    setTimeout(() => {
      servicesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleServiceClick = (serviceId) => {
    hapticMedium();
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  useEffect(() => {
    if (expandedServiceId === null) return;
    const handleClickOutside = (event) => {
      if (
        serviceCardsRef.current &&
        !serviceCardsRef.current.some(ref => ref && ref.contains(event.target))
      ) {
        setExpandedServiceId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedServiceId]);

  const handleRequestAppointment = (service) => {
    navigate('/appointments', { state: { selectedService: service } });
  };

  const displayedNews = translatedNews.slice(0, displayCount);
  const hasMore = displayCount < totalUpdates;
  const displayedServices = translatedServices.slice(0, serviceDisplayCount);
  const hasMoreServices = serviceDisplayCount < translatedServices.length;

  useEffect(() => {
    document.body.style.background = '#000000';
  }, []);

  return (
    <div className={styles.homePage}>
      {/* Navigation Bar */}
      <nav className={styles.navbar}>
        <div className="container d-flex flex-nowrap justify-content-between align-items-center" style={{ gap: '0.5rem' }}>
          <div className="navbar-brand mb-0 h1 d-flex align-items-center" style={{ minWidth: 0 }}>
            <img
              src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
              alt="New Flow Logo"
              style={{ height: 'clamp(22px, 5vw, 32px)', flexShrink: 0 }}
            />
          </div>
          <div className="d-flex flex-nowrap gap-1 align-items-center" style={{ flexShrink: 0 }}>
            <button
              className={styles.navButton}
              onClick={() => navigate(isLoggedIn ? '/employee-dashboard' : '/employee-login')}
            >
              {t(isLoggedIn ? 'employeeDashboard' : 'employeeLogin')}
            </button>
            <div style={{ transform: 'scale(0.78)', transformOrigin: 'right center', flexShrink: 0 }}>
              <LanguageToggle darkText />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className={`text-white ${styles.heroSection}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="container">
          <div className="row align-items-center g-3 g-md-4">
            {/* Video — top on mobile (animated brand header), right on desktop */}
            <motion.div
              className={`col-12 col-md-6 order-1 order-md-2 ${styles.heroVideoCol}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <video
                className={`w-100 ${styles.heroVideo}`}
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
              >
                <source src={new URL('../assets/videos/hero-banner-video.mp4', import.meta.url).href} type="video/mp4" />
              </video>
            </motion.div>

            {/* Text + CTA — below video on mobile, left on desktop */}
            <motion.div
              className={`col-12 col-md-6 order-2 order-md-1 ${styles.heroTextCol}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <p className={`lead mb-2 ${styles.heroSubtitle}`}>{t('heroSubtitle')}</p>
              <p className={`mb-3 ${styles.heroDesc}`}>{t('heroDescription')}</p>
              <div className={styles.heroCta}>
                <button
                  className={styles.requestButton}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    hapticSuccess();
                    onNavigateToBooking();
                  }}
                >
                  {t('requestAppointment')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className={styles.scrollIndicator}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Services Section */}
      <motion.section
        className={styles.servicesSection}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
      >
        <div className="container">
          <div className={`${styles.sectionHeading} mb-4`}>{t('servicesTitle')}</div>
          {translatedServices.length === 0 ? (
            <div className="text-center py-3">
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                {language === 'es' ? '¡Servicios próximamente!' : 'Services coming soon!'}
              </p>
            </div>
          ) : (
            <motion.div
              className="row g-3 justify-content-center"
              style={{ maxWidth: '860px', margin: '0 auto' }}
              layout
              transition={{ layout: { duration: 0.42, ease: [0.4, 0, 0.2, 1] } }}
            >
              <AnimatePresence>
                {displayedServices.map((service, idx) => (
                  <motion.div
                    key={service.id}
                    className={displayedServices.length === 1 ? 'col-10 col-md-5' : 'col-6 col-md-4 col-lg-3'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <motion.div
                      className={styles.serviceCard}
                      style={{ height: '100%' }}
                      whileHover={{ scale: 1.03, boxShadow: '0 16px 48px rgba(70,161,161,0.28)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleServiceClick(service.id)}
                      ref={el => serviceCardsRef.current[idx] = el}
                    >
                      <div className={styles.serviceCardBody}>
                        <h5 className={styles.serviceCardTitle}>{service.name}</h5>
                        <p className={styles.serviceCardDesc}>{service.description}</p>
                        <span className={styles.serviceCardPrice}>
                          {service.price_max
                            ? `$${parseFloat(service.price).toFixed(2)} – $${parseFloat(service.price_max).toFixed(2)}`
                            : `$${parseFloat(service.price).toFixed(2)}`}
                        </span>
                        <AnimatePresence>
                          {expandedServiceId === service.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <button
                                className={styles.serviceBookBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.currentTarget.blur();
                                  hapticSuccess();
                                  handleRequestAppointment(service);
                                }}
                              >
                                {t('requestAppointment')}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {translatedServices.length > 0 && services.length > getDefaultServiceCount() && (
            <div className="text-center mt-5">
              {hasMoreServices ? (
                <button className={styles.ghostButton} onClick={handleShowAllServices}>
                  {t('showAllServices')}
                </button>
              ) : (
                <button className={styles.ghostButtonOutline} onClick={handleHideServices}>
                  {t('hideServices')}
                </button>
              )}
            </div>
          )}
          {translatedServices.length > 0 && services.length <= getDefaultServiceCount() && (
            <div style={{ marginTop: '2.5rem' }} />
          )}
          <div ref={servicesEndRef} />
        </div>
      </motion.section>

      {/* News Section */}
      <motion.section
        className={styles.newsSection}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
      >
        <div className="container">
          <h2 className={`text-center mb-4 fw-bold text-white ${styles.updatesHeading}`}>
            {t('updatesTitle')}
          </h2>
          {loading || translating ? (
            <div className="text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <p>{translating ? t('translating') : t('loading')}</p>
            </div>
          ) : displayedNews.length === 0 ? (
            <div className="text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <p>{t('noUpdates')}</p>
            </div>
          ) : (
            <>
              <motion.div
                className="row g-3"
                layout
                transition={{ layout: { duration: 0.42, ease: [0.4, 0, 0.2, 1] } }}
              >
                <AnimatePresence>
                {displayedNews.map(article => (
                  <motion.div
                    key={article.id}
                    className="col-6 col-lg-3 mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <motion.div
                      className={styles.updateCard}
                      whileHover={{ scale: 1.025 }}
                      whileTap={{ scale: 0.975 }}
                      onClick={() => handleUpdateClick(article)}
                    >
                      {article.media_url && (
                        <div className={styles.updateCardMedia}>
                          {article.media_type === 'image' ? (
                            <img
                              src={article.media_url.startsWith('http') ? article.media_url : `${SERVER_BASE_URL}${article.media_url}`}
                              alt={article.title}
                              className={styles.updateCardImage}
                            />
                          ) : (
                            <video
                              src={article.media_url.startsWith('http') ? article.media_url : `${SERVER_BASE_URL}${article.media_url}`}
                              className={styles.updateCardImage}
                              playsInline
                              disablePictureInPicture
                              controls={false}
                            />
                          )}
                          <div className={styles.updateCardMediaOverlay} />
                        </div>
                      )}
                      <div className={styles.updateCardBody}>
                        <h5 className={styles.updateCardTitle}>{article.title}</h5>
                        <p className={styles.updateCardContent}>
                          {article.content.length > 80 ? article.content.substring(0, 80) + '…' : article.content}
                        </p>
                        <div className={styles.updateCardMeta}>
                          <span>{article.author}</span>
                          <span>{new Date(article.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </motion.div>
              <div className="text-center mt-4">
                {hasMore && (
                  <button className={`${styles.ghostButton} me-2`} onClick={handleViewMore}>
                    {t('viewMore')}
                  </button>
                )}
                {displayCount > 4 && (
                  <button className={styles.ghostButtonOutline} onClick={handleShowLess}>
                    {t('showLess')}
                  </button>
                )}
              </div>
            </>
          )}
          <div ref={updatesEndRef} />
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section
        className={styles.aboutSection}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="container">
          <div className="row align-items-center">
            <motion.div
              className="col-md-6 mb-5 mb-md-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
                alt="New Flow Team"
                className={`img-fluid rounded ${styles.aboutLogo}`}
              />
            </motion.div>
            <motion.div
              className="col-md-6 ps-md-4"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="fw-bold mb-3" style={{ color: '#fff' }}>{t('aboutTitle')}</h2>
              <p className="mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('aboutParagraph1')}</p>
              <p className="mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('aboutParagraph2')}</p>
              <p style={{ color: 'rgba(255,255,255,0.75)' }}>{t('aboutParagraph3')}</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        className={`py-5 ${styles.contactSection}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="container">
          <motion.h2
            className={`text-center mb-5 fw-bold text-white ${styles.contactTitle}`}
            variants={cardVariants}
          >
            {t('contactTitle')}
          </motion.h2>
          <motion.div
            className="row text-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div className="col-md-3 mb-4" variants={cardVariants}>
              <div className={styles.contactCard}>
                <span className={styles.contactIcon}>⏰</span>
                <h5 className={styles.contactHeading}>{t('hours')}</h5>
                <p className={styles.contactText}>{t('monSun')}: 9am – 7pm</p>
              </div>
            </motion.div>
            <motion.div className="col-md-3 mb-4" variants={cardVariants}>
              <div className={styles.contactCard}>
                <span className={styles.contactIcon}>📞</span>
                <h5 className={styles.contactHeading}>{t('phone')}</h5>
                <p className={styles.contactText}>
                  <a href="tel:+18047452525" className="text-white text-decoration-none">
                    (804) 745-2525
                  </a>
                </p>
              </div>
            </motion.div>
            <motion.div className="col-md-3 mb-4" variants={cardVariants}>
              <div className={styles.contactCard}>
                <span className={styles.contactIcon}>📱</span>
                <h5 className={styles.contactHeading}>{t('followUs')}</h5>
                <a
                  href="https://www.instagram.com/newflowsalon/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`d-inline-flex align-items-center justify-content-center gap-2 text-decoration-none text-white ${styles.contactText}`}
                >
                  <img
                    src={new URL('../assets/images/instagram-logo.png', import.meta.url).href}
                    alt="Instagram"
                    className={styles.instagramIcon}
                  />
                  <span>@newflowsalon</span>
                </a>
              </div>
            </motion.div>
            <motion.div className="col-md-3 mb-4" variants={cardVariants}>
              <div className={styles.contactCard}>
                <span className={styles.contactIcon}>📍</span>
                <h5 className={styles.contactHeading}>{t('address')}</h5>
                <p className={`${styles.addressText} ${styles.contactText}`}>
                  <a
                    href="https://maps.google.com/?q=7102+Hull+Street+Rd+N+Suite+F,+North+Chesterfield,+VA+23235"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-decoration-none"
                  >
                    7102 Hull Street Rd N Suite F,<br />North Chesterfield, VA 23235
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <UpdateModal update={selectedUpdate} show={showModal} onClose={handleCloseModal} />
      <ScrollToTop />
    </div>
  );
};

HomePage.propTypes = {
  onNavigateToBooking: PropTypes.func.isRequired,
};
