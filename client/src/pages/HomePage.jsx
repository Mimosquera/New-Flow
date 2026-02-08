import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/tokenUtils.js';
import { updateService, serviceService, SERVER_BASE_URL } from '../services/api.js';
import { UpdateModal } from '../components/UpdateModal.jsx';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { translateObject } from '../services/translationService.js';
import styles from './HomePage.module.css';

export const HomePage = ({ onNavigateToBooking }) => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const [services, setServices] = useState([]);
  const [translatedServices, setTranslatedServices] = useState([]);
  const [serviceDisplayCount, setServiceDisplayCount] = useState(3);
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  const [news, setNews] = useState([]);
  const [translatedNews, setTranslatedNews] = useState([]);
  const [displayCount, setDisplayCount] = useState(3);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const servicesEndRef = useRef(null);
  const updatesEndRef = useRef(null);

  const handleUpdateClick = (update) => {
    setSelectedUpdate(update);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUpdate(null);
  };

  const fetchServices = useCallback(async () => {
    try {
      const response = await serviceService.getAll();
      setServices(response.data);
      setTranslatedServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, []);

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await updateService.getAll();
      setNews(response.data.updates);
      setTranslatedNews(response.data.updates);
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

  useEffect(() => {
    // Simple language detection (checks for Spanish characters/words)
    const detectLang = (text) => {
      if (!text) return 'en';
      const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'los', 'del', 'se', 'por', 'un', 'una', 'con', 'para', 'es', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'esos', 'esas', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'esté', 'estés', 'estemos', 'estéis', 'estén', 'estaré', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos', 'estaríais', 'estarían', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron', 'estuviera', 'estuvieras', 'estuviéramos', 'estuvierais', 'estuvieran', 'estuviese', 'estuvieses', 'estuviésemos', 'estuvieseis', 'estuviesen', 'estando', 'estado', 'estada', 'estados', 'estadas', 'estad'];
      const lower = text.toLowerCase();
      let score = 0;
      spanishWords.forEach(word => {
        if (lower.includes(word)) score++;
      });
      if (/[áéíóúñü¿¡]/.test(lower)) score += 2;
      return score > 2 ? 'es' : 'en';
    };

    const translatePosts = async () => {
      if (news.length === 0) return;
      setTranslating(true);
      try {
        const translated = await Promise.all(
          news.map(article => {
            const sourceLang = article.language || detectLang((article.title || '') + ' ' + (article.content || ''));
            const targetLang = language === 'es' ? 'es' : 'en';
            if (sourceLang !== targetLang) {
              return translateObject(article, ['title', 'content', 'author'], targetLang, sourceLang);
            } else {
              return Promise.resolve(article);
            }
          })
        );
        setTranslatedNews(await Promise.all(translated));
      } catch (error) {
        console.error('Error translating posts:', error);
        setTranslatedNews(news);
      } finally {
        setTranslating(false);
      }
    };
    translatePosts();
  }, [language, news]);

  useEffect(() => {
    const detectLang = (text) => {
      if (!text) return 'en';
      const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'los', 'del', 'se', 'por', 'un', 'una', 'con', 'para', 'es', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'esos', 'esas', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'esté', 'estés', 'estemos', 'estéis', 'estén', 'estaré', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos', 'estaríais', 'estarían', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron', 'estuviera', 'estuvieras', 'estuviéramos', 'estuvierais', 'estuvieran', 'estuviese', 'estuvieses', 'estuviésemos', 'estuvieseis', 'estuviesen', 'estando', 'estado', 'estada', 'estados', 'estadas', 'estad'];
      const lower = text.toLowerCase();
      let score = 0;
      spanishWords.forEach(word => {
        if (lower.includes(word)) score++;
      });
      if (/[áéíóúñü¿¡]/.test(lower)) score += 2;
      return score > 2 ? 'es' : 'en';
    };

    const translateServices = async () => {
      if (services.length === 0) return;
      setTranslating(true);
      try {
        const translated = await Promise.all(
          services.map(service => {
            const sourceLang = service.language || detectLang((service.name || '') + ' ' + (service.description || ''));
            const targetLang = language === 'es' ? 'es' : 'en';
            if (sourceLang !== targetLang) {
              return translateObject(service, ['name', 'description'], targetLang, sourceLang);
            } else {
              return Promise.resolve(service);
            }
          })
        );
        setTranslatedServices(await Promise.all(translated));
      } catch (error) {
        console.error('Error translating services:', error);
        setTranslatedServices(services);
      } finally {
        setTranslating(false);
      }
    };
    translateServices();
  }, [language, services]);

  const handleViewMore = () => {
    setDisplayCount(prev => prev + 3);
  };

  const handleShowLess = () => {
    setDisplayCount(3);
    setTimeout(() => {
      updatesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleShowAllServices = () => {
    setServiceDisplayCount(services.length);
  };

  const handleHideServices = () => {
    setServiceDisplayCount(3);
    setTimeout(() => {
      servicesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleServiceClick = (serviceId) => {
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  const handleRequestAppointment = (service) => {
    navigate('/appointments', { state: { selectedService: service } });
  };

  const displayedNews = translatedNews.slice(0, displayCount);
  const hasMore = displayCount < totalUpdates;
  const displayedServices = translatedServices.slice(0, serviceDisplayCount);
  const hasMoreServices = serviceDisplayCount < translatedServices.length;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY <= 50) {
        document.body.style.background = '#000000';
      } else {
        document.body.style.background = 'rgb(3, 35, 50)';
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.background = 'rgb(3, 35, 50)';
    };
  }, []);

  return (
    <div className="homepage" style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <nav className="navbar navbar-light bg-light shadow-sm">
        <div className="container d-flex flex-nowrap justify-content-between align-items-center" style={{ gap: '0.5rem' }}>
          <div className="navbar-brand mb-0 h1 d-flex align-items-center" style={{ minWidth: 0, fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
            <img 
              src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
              alt="New Flow Logo"
              style={{ height: 'clamp(20px, 5vw, 30px)', marginRight: '5px', flexShrink: 0 }}
            />
            <span style={{ whiteSpace: 'nowrap' }}>NEW FLOW</span>
          </div>
          <div className="d-flex flex-nowrap gap-1 align-items-center" style={{ flexShrink: 0 }}>
            <button 
              className="btn btn-sm"
              style={{ 
                backgroundColor: 'transparent', 
                color: 'rgb(5, 45, 63)', 
                border: 'none', 
                fontWeight: '300', 
                whiteSpace: 'nowrap',
                padding: '0.25rem 0.5rem',
                fontSize: 'clamp(0.75rem, 2.5vw, 1rem)'
              }}
              onClick={() => navigate(isLoggedIn ? '/employee-dashboard' : '/employee-login')}
            >
              {t(isLoggedIn ? 'employeeDashboard' : 'employeeLogin')}
            </button>
            <LanguageToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`hero-section bg-dark text-white pt-5 ${styles.heroSection}`}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <h1 className="display-4 fw-bold mb-3">{t('heroTitle')}</h1>
              <p className="lead mb-4">{t('heroSubtitle')}</p>
              <p className="mb-4">{t('heroDescription')}</p>
              <div style={{ whiteSpace: 'nowrap' }}>
                <button 
                  className={styles.requestButton}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onNavigateToBooking();
                  }}
                >
                  {t('requestAppointment')}
                </button>
              </div>
            </div>
            <div className="col-md-6">
              <video
                className={`w-100 ${styles.heroVideo}`}
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
              >
                <source src={new URL('../assets/videos/hero-banner-video.mp4', import.meta.url).href} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section py-5">
        <div className="container">
          <div 
            className={`${styles.servicesHeading} mb-5`}
          >
            {t('servicesTitle')}
          </div>
          {translatedServices.length === 0 ? (
            <div className="text-center py-3">
              <h4 className="text-muted">{language === 'es' ? '¡Servicios próximamente!' : 'Services coming soon!'}</h4>
            </div>
          ) : (
          <div className="row g-4">
            {displayedServices.map(service => (
              <div key={service.id} className="col-md-4">
                <div 
                  className={`card h-100 shadow-sm border-0 ${styles.card} ${styles.cursorPointer}`}
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="card-body">
                    <h5 className="card-title">{service.name}</h5>
                    <p className="card-text text-muted">{service.description}</p>
                    <h6 className="card-subtitle fw-bold">${parseFloat(service.price).toFixed(2)}</h6>
                    {expandedServiceId === service.id && (
                      <div className="mt-3">
                        <button
                          className="btn btn-sm w-100"
                          style={{
                            backgroundColor: 'rgb(5, 45, 63)',
                            color: 'white',
                            border: 'none',
                            fontWeight: '500',
                            borderRadius: '20px',
                            boxShadow: '0 3px 8px rgba(5, 45, 63, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 45, 63, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 3px 8px rgba(5, 45, 63, 0.3)';
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.blur();
                            handleRequestAppointment(service);
                          }}
                        >
                          {t('requestAppointment')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {translatedServices.length > 0 && services.length > 3 && (
            <div className="text-center mt-4">
              {hasMoreServices ? (
                <button 
                  className="btn btn-sm"
                  style={{ 
                    backgroundColor: 'rgb(5, 45, 63)', 
                    color: 'white', 
                    border: '1px solid rgb(5, 45, 63)',
                    fontWeight: '300'
                  }}
                  onClick={handleShowAllServices}
                >
                  {t('showAllServices')}
                </button>
              ) : (
                <button 
                  className="btn btn-sm"
                  style={{ 
                    backgroundColor: 'white', 
                    color: 'rgb(5, 45, 63)', 
                    border: '1px solid rgb(5, 45, 63)',
                    fontWeight: '300'
                  }}
                  onClick={handleHideServices}
                >
                  {t('hideServices')}
                </button>
              )}
            </div>
          )}
          <div ref={servicesEndRef} />
        </div>
      </section>

      {/* News Section */}
      <section className="news-section py-5">
        <div className="container">
          <h2 className={`text-center mb-5 fw-bold text-white ${styles.updatesHeading}`}>{t('updatesTitle')}</h2>
          {loading || translating ? (
            <div className="text-center text-white">
              <p>{translating ? t('translating') : t('loading')}</p>
            </div>
          ) : displayedNews.length === 0 ? (
            <div className="text-center text-white">
              <p>{t('noUpdates')}</p>
            </div>
          ) : (
            <>
              <div className="row">
                {displayedNews.map(article => (
                  <div key={article.id} className="col-md-6 col-lg-4 mb-4">
                    <div 
                      className="card shadow-sm border-0 h-100 update-card-desktop"
                      style={{ cursor: 'pointer', background: '#fff', borderRadius: '16px', boxShadow: '0 3px 8px rgba(5,45,63,0.15)' }}
                      onClick={() => handleUpdateClick(article)}
                    >
                      <div className="card-body p-4 d-flex flex-column justify-content-between">
                        <h5 className="card-title mb-2" style={{ fontWeight: '600', color: 'rgb(5,45,63)' }}>{article.title}</h5>
                        {article.media_url && (
                          <div className="mb-3">
                            {article.media_type === 'image' ? (
                              <img 
                                src={`${SERVER_BASE_URL}${article.media_url}`}
                                alt={article.title}
                                className="img-fluid rounded"
                                style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <video 
                                src={`${SERVER_BASE_URL}${article.media_url}`}
                                className="w-100 rounded"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                                playsInline
                                disablePictureInPicture
                                controls={false}
                              />
                            )}
                          </div>
                        )}
                        <p className="card-text mb-3" style={{ color: '#333', fontWeight: '400', fontSize: '1rem' }}>
                          {article.content.length > 150 ? article.content.substring(0, 150) + '...' : article.content}
                        </p>
                        <small className="text-muted mt-auto" style={{ fontSize: '0.9rem' }}>
                          {new Date(article.date).toLocaleDateString()} • {article.author}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                {hasMore && (
                  <button 
                    className="btn btn-sm me-2"
                    style={{ 
                      backgroundColor: 'white', 
                      color: 'rgb(5, 45, 63)', 
                      border: '1px solid white',
                      fontWeight: '300'
                    }}
                    onClick={handleViewMore}
                  >
                    {t('viewMore')}
                  </button>
                )}
                {displayCount > 3 && (
                  <button 
                    className="btn btn-sm"
                    style={{ 
                      backgroundColor: 'rgb(5, 45, 63)', 
                      color: 'white', 
                      border: '1px solid white',
                      fontWeight: '300'
                    }}
                    onClick={handleShowLess}
                  >
                    {t('showLess')}
                  </button>
                )}
              </div>
            </>
          )}
          <div ref={updatesEndRef} />
        </div>
      </section>

      {/* About Section */}
      <section className="about-section py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 mb-5 mb-md-0">
              <img 
                src={new URL('../assets/images/logo-transparent.png', import.meta.url).href}
                alt="New Flow Team"
                className={`img-fluid rounded ${styles.aboutLogo}`}
              />
            </div>
            <div className="col-md-6 ps-md-4">
              <h2 className="fw-bold mb-3">{t('aboutTitle')}</h2>
              <p className="mb-3">
                {t('aboutParagraph1')}
              </p>
              <p className="mb-3">
                {t('aboutParagraph2')}
              </p>
              <p>
                {t('aboutParagraph3')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section py-5 bg-dark text-white">
        <div className="container">
          <h2 className={`text-center mb-5 fw-bold text-white ${styles.contactTitle}`}>{t('contactTitle')}</h2>
          <div className="row text-center">
            <div className="col-md-3 mb-3">
              <h5 className={styles.contactHeading}>📍 {t('address')}</h5>
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
            <div className="col-md-3 mb-3">
              <h5 className={styles.contactHeading}>📞 {t('phone')}</h5>
              <p className={styles.contactText}>
                <a 
                  href="tel:+18047452525"
                  className="text-white text-decoration-none"
                >
                  (804) 745-2525
                </a>
              </p>
            </div>
            <div className="col-md-3 mb-3">
              <h5 className={styles.contactHeading}>⏰ {t('hours')}</h5>
              <p className={styles.contactText}>{t('monSun')}: 9am - 7pm</p>
            </div>
            <div className="col-md-3 mb-3">
              <h5 className={styles.contactHeading}>📱 {t('followUs')}</h5>
              <a 
                href="https://www.instagram.com/newflowsalon/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`d-inline-flex align-items-center justify-content-center text-decoration-none text-white ${styles.contactText}`}
              >
                <img 
                  src={new URL('../assets/images/instagram-logo.png', import.meta.url).href}
                  alt="Instagram"
                  className={styles.instagramIcon}
                />
                <span>@newflowsalon</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Update Modal */}
      <UpdateModal 
        update={selectedUpdate}
        show={showModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

HomePage.propTypes = {
  onNavigateToBooking: PropTypes.func.isRequired
};