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
import { ReviewsCarousel } from '../components/ReviewsCarousel.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { useTranslateItems } from '../hooks/useTranslateItems.js';
import styles from './HomePage.module.css';

const POSTS_CACHE_KEY = 'nf_posts_v2';
const POSTS_CACHE_TTL = 2 * 60 * 60 * 1000;

const loadPostsCache = () => {
  try {
    const raw = localStorage.getItem(POSTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > POSTS_CACHE_TTL) { localStorage.removeItem(POSTS_CACHE_KEY); return null; }
    return parsed;
  } catch { return null; }
};

const savePostsCache = (posts, total) => {
  try {
    localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify({ posts, total, ts: Date.now() }));
  } catch {}
};

const SKELETON_MIN_MS = 420;

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

const NewsCard = ({ article, onClick, hideMeta = false }) => {
  const [imgLoaded, setImgLoaded] = useState(!article.media_url);
  const src = article.media_url
    ? (article.media_url.startsWith('http') ? article.media_url : `${SERVER_BASE_URL}${article.media_url}`)
    : null;

  return (
    <motion.div
      className={styles.updateCard}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
    >
      {src && (
        <div className={styles.updateCardMedia}>
          {!imgLoaded && (
            <div
              className={`${styles.skeleton} ${styles.skeletonImage}`}
              style={{ position: 'absolute', inset: 0, height: '100%', zIndex: 1 }}
            />
          )}
          {article.media_type === 'image' ? (
            <img
              src={src}
              alt={article.title}
              loading="lazy"
              decoding="async"
              className={styles.updateCardImage}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
              style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
            />
          ) : (
            <video
              src={src}
              className={styles.updateCardImage}
              playsInline
              disablePictureInPicture
              controls={false}
              onLoadedData={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
              style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
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
        {!hideMeta && (
          <div className={styles.updateCardMeta}>
            <span>{new Date(article.date).toLocaleDateString()}</span>
            <span className={styles.updateCardMetaDot} />
            <span className={styles.updateCardMetaAuthor}>{article.author}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

NewsCard.propTypes = {
  article: PropTypes.shape({
    media_url: PropTypes.string,
    media_type: PropTypes.string,
    title: PropTypes.string,
    content: PropTypes.string,
    author: PropTypes.string,
    date: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  hideMeta: PropTypes.bool,
};

export const HomePage = ({ onNavigateToBooking }) => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const pageSize = window.innerWidth < 768 ? 2 : 4;

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const serviceCardsRef = useRef([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
  });
  const scrollRafRef = useRef(null);


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
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
    const t0 = Date.now();
    try {
      const response = await serviceService.getAll();
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      const remaining = SKELETON_MIN_MS - (Date.now() - t0);
      if (remaining > 0) {
        setTimeout(() => setServicesLoading(false), remaining);
      } else {
        setServicesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
    fetchServices();

    const cached = loadPostsCache();
    if (cached) {
      const postsToShow = cached.posts.slice(0, pageSize);
      const cachedIds = postsToShow.map(p => p.id).join(',');

      let syncResult = null;
      let initialRevealDone = false;

      const reveal = (posts, total) => {
        setNews(posts);
        setTotalUpdates(total);
        setLoading(false);
      };

      const timer = setTimeout(() => {
        initialRevealDone = true;
        if (syncResult) {
          reveal(syncResult.posts, syncResult.total);
          if (syncResult.isNew) savePostsCache(syncResult.posts, syncResult.total);
        } else {
          reveal(postsToShow, cached.total);
        }
      }, SKELETON_MIN_MS);

      updateService.getAll(pageSize, 0)
        .then(({ data }) => {
          if (!data.updates?.length) return;
          const freshIds = data.updates.map(p => p.id).join(',');
          const isNew = freshIds !== cachedIds;
          syncResult = { posts: data.updates, total: data.total, isNew };
          if (initialRevealDone) {
            if (isNew) {
              setLoading(true);
              setTimeout(() => {
                reveal(data.updates, data.total);
                savePostsCache(data.updates, data.total);
              }, SKELETON_MIN_MS);
            } else {
              savePostsCache(data.updates, data.total);
            }
          }
        })
        .catch(() => {});

      return () => clearTimeout(timer);
    } else {
      const t0 = Date.now();
      updateService.getAll(pageSize, 0)
        .then(({ data }) => {
          setNews(data.updates);
          setTotalUpdates(data.total);
          savePostsCache(data.updates, data.total);
        })
        .catch(err => console.error('Error fetching updates:', err))
        .finally(() => {
          const remaining = SKELETON_MIN_MS - (Date.now() - t0);
          if (remaining > 0) {
            setTimeout(() => setLoading(false), remaining);
          } else {
            setLoading(false);
          }
        });
    }
  }, [fetchServices, pageSize]);

  const handleViewMore = useCallback(async () => {
    hapticLight();
    setLoadingMore(true);
    const t0 = Date.now();
    let result = null;
    try {
      const { data } = await updateService.getAll(pageSize, news.length);
      result = { merged: [...news, ...data.updates], total: data.total };
    } catch (err) {
      console.error('Error fetching more updates:', err);
    }
    const finish = () => {
      if (result) {
        setNews(result.merged);
        setTotalUpdates(result.total);
        savePostsCache(result.merged, result.total);
      }
      setLoadingMore(false);
    };
    const remaining = SKELETON_MIN_MS - (Date.now() - t0);
    if (remaining > 0) setTimeout(finish, remaining);
    else finish();
  }, [news, pageSize]);

  const handleShowLess = () => {
    setNews(prev => prev.slice(0, pageSize));
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

  const hasMore = news.length < totalUpdates;

  const loopedServices = (() => {
    if (!translatedServices.length) return [];
    const MIN_SLIDES = 10;
    const times = Math.ceil(MIN_SLIDES / translatedServices.length);
    return Array.from({ length: times }).flatMap((_, t) =>
      translatedServices.map(s => ({ ...s, _key: `${s.id}-${t}` }))
    );
  })();

  const [aboutGlowing, setAboutGlowing] = useState(false);

  useEffect(() => {
    document.body.style.background = '#000000';
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <motion.section
        className={`text-white ${styles.heroSection}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="container">
          <div className={styles.heroInner}>
            {/* Logo image — centered brand header */}
            <motion.div
              className={styles.heroVideoWrap}
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={new URL('../assets/images/full-logo-transparent-nobuffer.png', import.meta.url).href}
                alt="New Flow"
                className={styles.heroVideo}
              />
            </motion.div>

            {/* Text + CTA — centered below video, each line enters independently */}
            <div className={styles.heroTextBlock}>
              <motion.p
                className={styles.heroSubtitle}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {t('heroSubtitle')}
              </motion.p>
              <motion.div
                className={styles.heroCta}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Services Section */}
      <section className={styles.servicesSection}>
        <div className="container-xxl px-3 px-md-4">
          <motion.h2
            className={styles.sectionHeading}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            {t('servicesTitle')}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1], delay: 0.12 }}
          >
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
                  className={`${styles.serviceCard}${expandedServiceId === service.id ? ` ${styles.serviceCardExpanded}` : ''}`}
                  style={{ width: 'min(300px, 80vw)' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleServiceClick(service.id)}
                  ref={el => serviceCardsRef.current[idx] = el}
                >
                  <div className={styles.serviceCardBody}>
                    <motion.div
                      className={styles.serviceCardInfo}
                      animate={{ opacity: expandedServiceId === service.id ? 0 : 1 }}
                      transition={{ duration: 0.18 }}
                      style={{ pointerEvents: expandedServiceId === service.id ? 'none' : 'auto' }}
                    >
                      <h5 className={styles.serviceCardTitle}>{service.name}</h5>
                      <p className={styles.serviceCardDesc}>{service.description}</p>
                      <span className={styles.serviceCardPrice}>
                        {service.price_max
                          ? `$${parseFloat(service.price).toFixed(2)} – $${parseFloat(service.price_max).toFixed(2)}`
                          : `$${parseFloat(service.price).toFixed(2)}`}
                      </span>
                    </motion.div>
                    <motion.div
                      className={styles.serviceCardBookOverlay}
                      animate={{ opacity: expandedServiceId === service.id ? 1 : 0 }}
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: expandedServiceId === service.id ? 0.12 : 0 }}
                      style={{ pointerEvents: expandedServiceId === service.id ? 'auto' : 'none' }}
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
                        {t('bookShort')}
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={styles.carouselWrap}>
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
              <div className={styles.carouselViewport} ref={emblaRef}>
                <div className={styles.carouselContainer}>
                  {loopedServices.map((service, idx) => (
                    <div key={service._key} className={styles.carouselSlide}>
                      <motion.div
                        className={`${styles.serviceCard}${expandedServiceId === service.id ? ` ${styles.serviceCardExpanded}` : ''}`}
                        style={{ height: '100%' }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleServiceClick(service.id)}
                        ref={el => serviceCardsRef.current[idx] = el}
                      >
                        <div className={styles.serviceCardBody}>
                          <motion.div
                            className={styles.serviceCardInfo}
                            animate={{ opacity: expandedServiceId === service.id ? 0 : 1 }}
                            transition={{ duration: 0.18 }}
                            style={{ pointerEvents: expandedServiceId === service.id ? 'none' : 'auto' }}
                          >
                            <h5 className={styles.serviceCardTitle}>{service.name}</h5>
                            <p className={styles.serviceCardDesc}>{service.description}</p>
                            <span className={styles.serviceCardPrice}>
                              {service.price_max
                                ? `$${parseFloat(service.price).toFixed(2)} – $${parseFloat(service.price_max).toFixed(2)}`
                                : `$${parseFloat(service.price).toFixed(2)}`}
                            </span>
                          </motion.div>
                          <motion.div
                            className={styles.serviceCardBookOverlay}
                            animate={{ opacity: expandedServiceId === service.id ? 1 : 0 }}
                            initial={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: expandedServiceId === service.id ? 0.12 : 0 }}
                            style={{ pointerEvents: expandedServiceId === service.id ? 'auto' : 'none' }}
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
                              {t('bookShort')}
                            </button>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
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
            </div>
          )}
          </motion.div>
        </div>
      </section>

      {/* News Section */}
      <section className={styles.newsSection}>
        <div className={styles.serviceNewsAccent} aria-hidden="true" />
        <div className="container">
          <motion.h2
            className={styles.sectionHeading}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            {t('updatesTitle')}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          >
          {loading || translating ? (
            <div className="row g-3">
              {Array.from({ length: pageSize }).map((_, i) => (
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
          ) : translatedNews.length === 0 ? (
            <div className="text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <p>{t('noUpdates')}</p>
            </div>
          ) : (
            <>
              <div className="row g-3">
                <AnimatePresence initial={false}>
                {translatedNews.map((article) => (
                  <motion.div
                    key={article.id}
                    className="col-6 col-lg-3 mb-2"
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
                  >
                    <NewsCard article={article} onClick={() => handleUpdateClick(article)} hideMeta />
                  </motion.div>
                ))}
                </AnimatePresence>
                {loadingMore && Array.from({ length: pageSize }).map((_, i) => (
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
              <motion.div
                className="text-center mt-5"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              >
                {hasMore && !loadingMore && (
                  <button className={`${styles.fancyButton} me-2`} onClick={handleViewMore}>
                    {t('viewMore')}
                  </button>
                )}
                {news.length > pageSize && (
                  <button className={styles.fancyButtonOutline} onClick={() => { hapticLight(); handleShowLess(); }}>
                    {t('showLess')}
                  </button>
                )}
              </motion.div>
            </>
          )}
          <div ref={updatesEndRef} />
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <motion.section
        className={styles.reviewsSection}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
      >
        <div className="container">
          <ReviewsCarousel />
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section
        className={`${styles.aboutSection}${aboutGlowing ? ` ${styles.aboutGlowing}` : ''}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        onViewportEnter={() => setTimeout(() => setAboutGlowing(true), 1200)}
      >
        <div className={styles.accentDivider} aria-hidden="true" />
        <div className="container">
          <div className={styles.aboutRow}>
            <motion.div
              className={`mb-5 mb-md-0 ${styles.aboutLogoCol}`}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className={styles.aboutLogoWrap}>
                <img
                  src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
                  alt="New Flow Team"
                  loading="lazy"
                  decoding="async"
                  className={`img-fluid rounded ${styles.aboutLogo}`}
                />
              </div>
            </motion.div>
            <div className={styles.aboutTextCol}>
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
        className={styles.contactSection}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="container">
          <motion.h2
            className={`text-center fw-bold text-white ${styles.contactTitle}`}
            variants={cardVariants}
          >
            {t('contactTitle')}
          </motion.h2>
          <motion.div
            className={`row text-center ${styles.contactRow}`}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div className="col-6 col-md-auto mb-3" variants={cardVariants}>
              <div className={styles.contactCard}>
                <div className={styles.contactIcon}><Clock size={20} strokeWidth={1.5} /></div>
                <h5 className={styles.contactHeading}>{t('hours')}</h5>
                <p className={styles.contactText}>{t('monSun')}: 9am – 7pm</p>
              </div>
            </motion.div>
            <motion.div className="col-6 col-md-auto mb-3" variants={cardVariants}>
              <div className={styles.contactCard}>
                <div className={styles.contactIcon}><Phone size={20} strokeWidth={1.5} /></div>
                <h5 className={styles.contactHeading}>{t('phone')}</h5>
                <p className={styles.contactText}>
                  <a href="tel:+18047452525" className="text-white text-decoration-none">
                    (804) 745-2525
                  </a>
                </p>
              </div>
            </motion.div>
            <motion.div className="col-6 col-md-auto mb-3" variants={cardVariants}>
              <div className={styles.contactCard}>
                <div className={styles.contactIcon}><AtSign size={20} strokeWidth={1.5} /></div>
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
            <motion.div className="col-6 col-md-auto mb-3" variants={cardVariants}>
              <div className={styles.contactCard}>
                <div className={styles.contactIcon}><MapPin size={20} strokeWidth={1.5} /></div>
                <h5 className={styles.contactHeading}>{t('address')}</h5>
                <p className={`${styles.addressText} ${styles.contactText}`}>
                  <a
                    href="https://maps.google.com/?q=7102+Hull+Street+Rd+N+Suite+F,+North+Chesterfield,+VA+23235"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-decoration-none"
                  >
                    7102 Hull Street Rd N Suite F,<br />North Chesterfield, VA
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
          <div className={styles.footerControls}>
            <div style={{ transform: 'scale(0.78)', transformOrigin: 'center' }}>
              <LanguageToggle />
            </div>
            <button
              className={styles.employeeAccessBtn}
              onClick={() => { hapticLight(); navigate(isLoggedIn ? '/employee-dashboard' : '/employee-login'); }}
            >
              {t(isLoggedIn ? 'employeeDashboard' : 'employeeAccess')}
            </button>
          </div>
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
