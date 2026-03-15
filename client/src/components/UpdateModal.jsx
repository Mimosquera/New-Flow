import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { useTranslation } from '../hooks/useTranslation.js';
import { SERVER_BASE_URL } from '../services/api.js';
import styles from './UpdateModal.module.css';

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
  const [direction, setDirection] = useState(0);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (show) {
      setCurrentIndex(initialIndex);
      setFullscreen(false);
      setDirection(0);
    }
  }, [show, initialIndex]);

  const update = updates[currentIndex];
  const showNav = updates.length > 1;

  const goTo = useCallback((idx) => {
    setCurrentIndex(idx);
    setFullscreen(false);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    goTo((currentIndex - 1 + updates.length) % updates.length);
  }, [currentIndex, updates.length, goTo]);

  const goNext = useCallback(() => {
    setDirection(1);
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
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.96)',
          zIndex: 2000,
        }}
        onClick={() => setFullscreen(false)}
      >
        {update.media_type === 'image' ? (
          <ZoomableImage src={src} alt={update.title} />
        ) : (
          <div
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <video src={src} style={{ maxWidth: '95%', maxHeight: '95%' }} controls autoPlay />
          </div>
        )}
      </div>
    );
  }

  const dateStr = new Date(update.date).toLocaleDateString(
    language === 'es' ? 'es-ES' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modalWrap}>
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>{update.title}</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.body}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                className={styles.slideContent}
                variants={{
                  enter: (dir) => ({ opacity: 0, x: dir * 50 }),
                  center: { opacity: 1, x: 0 },
                  exit: (dir) => ({ opacity: 0, x: dir * -50 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                drag={showNav ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                dragDirectionLock
                onDragEnd={(_, { offset }) => {
                  if (offset.x < -60) goNext();
                  else if (offset.x > 60) goPrev();
                }}
                style={{ cursor: showNav ? 'grab' : 'default' }}
              >
                {src && (
                  <div className={styles.mediaWrap} onClick={() => setFullscreen(true)}>
                    {update.media_type === 'image' ? (
                      <img src={src} alt={update.title} className={styles.mediaImg} />
                    ) : (
                      <video src={src} className={styles.mediaVideo} controls />
                    )}
                  </div>
                )}

                <p className={styles.content}>{update.content}</p>

                <div className={styles.meta}>
                  <span className={styles.metaDot} />
                  <span className={styles.metaText}>
                    {dateStr}
                  </span>
                  <span className={styles.metaDot} />
                  <span className={`${styles.metaText} ${styles.metaAuthor}`}>
                    {update.author}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            {showNav ? (
              <div className={styles.navGroup}>
                <button className={styles.navBtn} onClick={goPrev} aria-label="Previous">
                  <ChevronLeft size={15} strokeWidth={2.5} />
                </button>
                <span className={styles.counter}>{currentIndex + 1} / {updates.length}</span>
                <button className={styles.navBtn} onClick={goNext} aria-label="Next">
                  <ChevronRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            ) : <span />}
            <button className={styles.closeFooterBtn} onClick={onClose}>
              {t('close')}
            </button>
          </div>
        </motion.div>
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
