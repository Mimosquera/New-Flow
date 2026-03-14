import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Clock, Phone, AtSign, MapPin } from 'lucide-react';
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
  const [servicesLoading, setServicesLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const serviceCardsRef = useRef([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const scrollRafRef = useRef(null);

  const onEmblaSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onEmblaSelect();
    emblaApi.on('select', onEmblaSelect);
    emblaApi.on('reInit', onEmblaSelect);
    return () => {
      emblaApi.off('select', onEmblaSelect);
      emblaApi.off('reInit', onEmblaSelect);
    };
  }, [emblaApi, onEmblaSelect]);

  const startAutoScroll = useCallback((direction) => {
    if (!emblaApi) return;
    const speed = direction === 'next' ? -3 : 3;
    const step = () => {
      const engine = emblaApi.internalEngine();
      engine.target.add(speed);
      engine.scrollBounds.constrain(engine.target);
      engine.animation.start();
      scrollRafRef.current = requestAnimationFrame(step);
    };
    scrollRafRef.current = requestAnimationFrame(step);
  }, [emblaApi]);

  const stopAutoScroll = useCallback(() => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  const [news, setNews] = useState([]);
  const [displayCount, setDisplayCount] = useState(4);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUpdateIndex, setSelectedUpdateIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const updatesEndRef = useRef(null);

  const handleUpdateClick = (article) => {
    hapticLight();
    const idx = translatedNews.findIndex(n => n.id === article.id);
    setSelectedUpdateIndex(idx >= 0 ? idx : 0);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
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
    } finally {
      setServicesLoading(false);
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

  const [viewMorePending, setViewMorePending] = useState(false);

  const handleViewMore = () => {
    hapticLight();
    setViewMorePending(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 4);
      setViewMorePending(false);
    }, 380);
  };

  const handleShowLess = () => {
    setDisplayCount(4);
    setTimeout(() => {
      updatesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleServiceClick = (serviceId) => {
    hapticMedium();
    setExpandedServiceId(prev => prev === serviceId ? null : serviceId);
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

  const navbarRef = useRef(null);
  const [showNavbar, setShowNavbar] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    document.body.style.background = '#000000';
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    requestAnimationFrame(() => window.scrollTo(0, 0));

    const handleNavScroll = () => {
      const current = window.scrollY;
      const prev = lastScrollYRef.current;
      setShowNavbar(current < prev && current > 80);
      lastScrollYRef.current = current;
    };

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleNavScroll);
  }, []);

  return (
    <div className={styles.homePage}>
      {/* Navigation Bar */}
      <motion.nav
        className={styles.navbar}
        ref={navbarRef}
        initial={{ y: '-100%' }}
        animate={{ y: showNavbar ? 0 : '-100%' }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
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
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        className={`text-white ${styles.heroSection}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="container">
          <div className={styles.heroInner}>
            {/* Video — animated brand header, centered */}
            <motion.div
              className={styles.heroVideoWrap}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            >
              <video
                className={styles.heroVideo}
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
              >
                <source src={new URL('../assets/videos/hero-banner-video.mp4', import.meta.url).href} type="video/mp4" />
              </video>
            </motion.div>

            {/* Text + CTA — centered below video, each line enters independently */}
            <div className={styles.heroTextBlock}>
              <motion.p
                className={styles.heroSubtitle}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                {t('heroSubtitle')}
              </motion.p>
              <motion.p
                className={styles.heroDesc}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55, ease: [0.4, 0, 0.2, 1] }}
              >
                {t('heroDescription')}
              </motion.p>
              <motion.div
                className={styles.heroCta}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.72, ease: [0.4, 0, 0.2, 1] }}
              >
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
              </motion.div>
            </div>
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
        <div className="container-xxl px-3 px-md-4">
          <motion.div
            className={`${styles.sectionHeading} mb-4`}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            {t('servicesTitle')}
          </motion.div>
          {servicesLoading ? (
            <div className={styles.carouselViewport}>
              <div className={styles.carouselContainer}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={styles.carouselSlide} style={{ '--sk-delay': `${i * 0.15}s` }}>
                    <div className={styles.skeletonCard} style={{ height: '100%' }}>
                      <div className={styles.skeletonServiceBody}>
                        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonPrice}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-3">
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                {language === 'es' ? '¡Servicios próximamente!' : 'Services coming soon!'}
              </p>
            </div>
          ) : services.length <= 2 ? (
            <div className={styles.centeredCards}>
              {translatedServices.map((service, idx) => (
                <motion.div
                  key={service.id}
                  className={styles.serviceCard}
                  style={{ width: 'min(300px, 80vw)' }}
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
                          transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
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
              ))}
            </div>
          ) : (
            <div className={styles.carouselWrap}>
              {canScrollPrev && (
                <button
                  className={`${styles.carouselArrow} ${styles.carouselArrowPrev}`}
                  onClick={() => emblaApi?.scrollPrev()}
                  onMouseEnter={() => startAutoScroll('prev')}
                  onMouseLeave={stopAutoScroll}
                  aria-label="Previous services"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              <div className={styles.carouselViewport} ref={emblaRef}>
                <div className={styles.carouselContainer}>
                  {translatedServices.map((service, idx) => (
                    <div key={service.id} className={styles.carouselSlide}>
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
                                transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
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
                    </div>
                  ))}
                </div>
              </div>
              {canScrollNext && (
                <button
                  className={`${styles.carouselArrow} ${styles.carouselArrowNext}`}
                  onClick={() => emblaApi?.scrollNext()}
                  onMouseEnter={() => startAutoScroll('next')}
                  onMouseLeave={stopAutoScroll}
                  aria-label="Next services"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
          )}
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
          <motion.h2
            className={`text-center mb-4 fw-bold text-white ${styles.updatesHeading}`}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            {t('updatesTitle')}
          </motion.h2>
          {loading || translating ? (
            <div className="row g-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="col-6 col-lg-3 mb-2" style={{ '--sk-delay': `${i * 0.18}s` }}>
                  <div className={styles.skeletonCard}>
                    <div className={`${styles.skeleton} ${styles.skeletonImage}`} />
                    <div className={styles.skeletonNewsBody}>
                      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                      <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
                      <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                      <div className={styles.skeletonMeta}>
                        <div className={`${styles.skeleton} ${styles.skeletonMetaLeft}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonMetaRight}`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedNews.length === 0 ? (
            <div className="text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <p>{t('noUpdates')}</p>
            </div>
          ) : (
            <>
              <div className="row g-3">
                <AnimatePresence initial={false}>
                {displayedNews.map((article) => (
                  <motion.div
                    key={article.id}
                    className="col-6 col-lg-3 mb-2"
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
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
                {viewMorePending && Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    className="col-6 col-lg-3 mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: i * 0.07 }}
                  >
                    <div className={styles.skeletonCard}>
                      <div className={`${styles.skeleton} ${styles.skeletonImage}`} style={{ '--sk-delay': `${i * 0.12}s` }} />
                      <div className={styles.skeletonNewsBody} style={{ '--sk-delay': `${i * 0.12}s` }}>
                        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                        <div className={styles.skeletonMeta}>
                          <div className={`${styles.skeleton} ${styles.skeletonMetaLeft}`} />
                          <div className={`${styles.skeleton} ${styles.skeletonMetaRight}`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-4">
                {hasMore && !viewMorePending && (
                  <button className={`${styles.fancyButton} me-2`} onClick={handleViewMore}>
                    {t('viewMore')}
                  </button>
                )}
                {displayCount > 4 && (
                  <button className={styles.fancyButtonOutline} onClick={() => { hapticLight(); handleShowLess(); }}>
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
            <div className="col-md-6 ps-md-4">
              <motion.h2
                className="fw-bold mb-3"
                style={{ color: '#fff' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                {t('aboutTitle')}
              </motion.h2>
              <motion.p
                className="mb-3"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.32, ease: [0.4, 0, 0.2, 1] }}
              >
                {t('aboutParagraph1')}
              </motion.p>
              <motion.p
                className="mb-3"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.44, ease: [0.4, 0, 0.2, 1] }}
              >
                {t('aboutParagraph2')}
              </motion.p>
              <motion.p
                style={{ color: 'rgba(255,255,255,0.75)' }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.56, ease: [0.4, 0, 0.2, 1] }}
              >
                {t('aboutParagraph3')}
              </motion.p>
            </div>
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
                <div className={styles.contactIcon}><Clock size={26} strokeWidth={1.5} /></div>
                <h5 className={styles.contactHeading}>{t('hours')}</h5>
                <p className={styles.contactText}>{t('monSun')}: 9am – 7pm</p>
              </div>
            </motion.div>
            <motion.div className="col-md-3 mb-4" variants={cardVariants}>
              <div className={styles.contactCard}>
                <div className={styles.contactIcon}><Phone size={26} strokeWidth={1.5} /></div>
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
                <div className={styles.contactIcon}><AtSign size={26} strokeWidth={1.5} /></div>
                <h5 className={styles.contactHeading}>{t('followUs')}</h5>
                <a
                  href="https://www.instagram.com/newflowsalon/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`d-inline-flex align-items-center justify-content-center gap-2 text-decoration-none text-white ${styles.contactText}`}
                >
                  <span>@newflowsalon</span>
                </a>
              </div>
            </motion.div>
            <motion.div className="col-md-3 mb-4" variants={cardVariants}>
              <div className={styles.contactCard}>
                <div className={styles.contactIcon}><MapPin size={26} strokeWidth={1.5} /></div>
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

      <UpdateModal updates={translatedNews} initialIndex={selectedUpdateIndex} show={showModal} onClose={handleCloseModal} />
      <ScrollToTop hidden={showModal} />
    </div>
  );
};

HomePage.propTypes = {
  onNavigateToBooking: PropTypes.func.isRequired,
};
