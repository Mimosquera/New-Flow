import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { useTranslation } from '../hooks/useTranslation.js';
import { SERVER_BASE_URL } from '../services/api.js';

const ZoomableImage = ({ src, alt }) => {
  const wrapRef = useRef(null);
  const scaleRef = useRef(1);
  const lastDistRef = useRef(null);
  const lastTapRef = useRef(0);
  const [scale, setScale] = useState(1);
  const [pinching, setPinching] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        setPinching(true);
        lastDistRef.current = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 280) {
          scaleRef.current = 1;
          setScale(1);
        }
        lastTapRef.current = now;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || lastDistRef.current === null) return;
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      scaleRef.current = Math.max(1, Math.min(5, scaleRef.current * (dist / lastDistRef.current)));
      lastDistRef.current = dist;
      setScale(scaleRef.current);
    };

    const onTouchEnd = () => {
      lastDistRef.current = null;
      setPinching(false);
    };

    const onWheel = (e) => {
      e.preventDefault();
      scaleRef.current = Math.max(1, Math.min(5, scaleRef.current - e.deltaY * 0.003));
      setScale(scaleRef.current);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        cursor: scale > 1 ? 'zoom-out' : 'zoom-in',
      }}
      onClick={(e) => {
        if (scale > 1) { e.stopPropagation(); scaleRef.current = 1; setScale(1); }
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          maxWidth: '95%',
          maxHeight: '95vh',
          objectFit: 'contain',
          transform: `scale(${scale})`,
          transition: pinching ? 'none' : 'transform 0.18s ease',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

const mediaUrl = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${SERVER_BASE_URL}${url}`;
};

export const UpdateModal = ({ updates = [], initialIndex = 0, show, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [fullscreen, setFullscreen] = useState(false);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (show) {
      setCurrentIndex(initialIndex);
      setFullscreen(false);
    }
  }, [show, initialIndex]);

  const update = updates[currentIndex];
  const showNav = updates.length > 1;

  const goTo = useCallback((idx) => {
    setCurrentIndex(idx);
    setFullscreen(false);
  }, []);

  const goPrev = useCallback(() => {
    goTo((currentIndex - 1 + updates.length) % updates.length);
  }, [currentIndex, updates.length, goTo]);

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % updates.length);
  }, [currentIndex, updates.length, goTo]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, goPrev, goNext, onClose]);

  useEffect(() => {
    document.body.style.overflow = show && update ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [show, update]);

  if (!show || !update) return null;

  const src = mediaUrl(update.media_url);

  if (fullscreen && src) {
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2000 }}
        onClick={() => setFullscreen(false)}
      >
        {update.media_type === 'image' ? (
          <ZoomableImage src={src} alt={update.title} />
        ) : (
          <div
            className="w-100 h-100 d-flex align-items-center justify-content-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video src={src} style={{ maxWidth: '95%', maxHeight: '95%' }} controls autoPlay />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content" style={{
            borderRadius: '24px', overflow: 'hidden', border: 'none',
            boxShadow: '0 20px 60px rgba(5,45,63,0.5), 0 0 0 1px rgba(70,161,161,0.2)',
          }}>
            {/* Header */}
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, rgb(5,45,63) 0%, rgb(3,35,50) 100%)',
              borderBottom: '3px solid #46a1a1',
              padding: '1.25rem 1.5rem',
            }}>
              <h5 className="modal-title" style={{
                color: '#fff', fontWeight: '700', letterSpacing: '-0.01em',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                {update.title}
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close" />
            </div>

            {/* Swipeable body */}
            <div style={{
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(5,45,63,0.97) 0%, rgba(3,28,40,0.99) 100%)',
              position: 'relative',
            }}>
              <motion.div
                key={currentIndex}
                drag={showNav ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                dragDirectionLock
                onDragEnd={(_, { offset }) => {
                  if (offset.x < -60) goNext();
                  else if (offset.x > 60) goPrev();
                }}
                style={{
                  padding: '1.75rem',
                  cursor: showNav ? 'grab' : 'default',
                }}
              >
                  {src && (
                    <div className="mb-4" style={{ cursor: 'zoom-in' }} onClick={() => setFullscreen(true)}>
                      {update.media_type === 'image' ? (
                        <img
                          src={src}
                          alt={update.title}
                          className="img-fluid w-100"
                          style={{ maxHeight: '60vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid rgba(70,161,161,0.15)' }}
                        />
                      ) : (
                        <video
                          src={src}
                          className="w-100"
                          style={{ maxHeight: '60vh', borderRadius: '12px', border: '1px solid rgba(70,161,161,0.15)' }}
                          controls
                        />
                      )}
                    </div>
                  )}

                  <p className="mb-3" style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', color: 'rgba(255,255,255,0.88)', lineHeight: '1.6' }}>
                    {update.content}
                  </p>

                  <div style={{ borderTop: '1px solid rgba(70,161,161,0.25)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <small style={{ color: '#46a1a1', fontWeight: '600', fontSize: '0.82rem', letterSpacing: '0.02em' }}>
                      {t('postedOn')} {new Date(update.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')} {t('by')} {update.author}
                    </small>
                  </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{
              background: 'linear-gradient(135deg, rgb(5,45,63) 0%, rgb(3,35,50) 100%)',
              borderTop: '2px solid #46a1a1',
              padding: '0.75rem 1.5rem',
              display: 'flex',
              justifyContent: showNav ? 'space-between' : 'flex-end',
              alignItems: 'center',
            }}>
              {showNav && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={goPrev}
                    style={{
                      background: 'none', border: '1px solid rgba(70,161,161,0.4)',
                      borderRadius: '8px', color: '#46a1a1', cursor: 'pointer',
                      padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', minWidth: '3rem', textAlign: 'center' }}>
                    {currentIndex + 1} / {updates.length}
                  </span>
                  <button
                    onClick={goNext}
                    style={{
                      background: 'none', border: '1px solid rgba(70,161,161,0.4)',
                      borderRadius: '8px', color: '#46a1a1', cursor: 'pointer',
                      padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, rgba(70,161,161,0.15) 0%, rgba(70,161,161,0.08) 100%)',
                  color: '#fff', border: '1.5px solid rgba(70,161,161,0.6)',
                  borderRadius: '10px', padding: '0.4rem 1.25rem',
                  fontWeight: '600', fontSize: '0.85rem', letterSpacing: '0.03em',
                  cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(8px)',
                }}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

UpdateModal.propTypes = {
  updates: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    content: PropTypes.string,
    author: PropTypes.string,
    date: PropTypes.string,
    media_url: PropTypes.string,
    media_type: PropTypes.string,
  })),
  initialIndex: PropTypes.number,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
