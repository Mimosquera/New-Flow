import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { useTranslation } from '../hooks/useTranslation.js';
import { SERVER_BASE_URL } from '../services/api.js';
import styles from './UpdateModal.module.css';

const ZoomableImage = ({ src, alt }) => {
  const wrapRef = useRef(null);
  const scaleRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const lastDistRef = useRef(null);
  const lastTouchRef = useRef(null);
  const lastTapRef = useRef(0);
  const mouseDownRef = useRef(null);
  const didDragRef = useRef(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pinching, setPinching] = useState(false);

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    txRef.current = 0;
    tyRef.current = 0;
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        setPinching(true);
        lastTouchRef.current = null;
        lastDistRef.current = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 280) {
          resetZoom();
        }
        lastTapRef.current = now;
        if (scaleRef.current > 1) {
          lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && lastDistRef.current !== null) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        scaleRef.current = Math.max(1, Math.min(5, scaleRef.current * (dist / lastDistRef.current)));
        lastDistRef.current = dist;
        setScale(scaleRef.current);
      } else if (e.touches.length === 1 && scaleRef.current > 1 && lastTouchRef.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastTouchRef.current.x;
        const dy = e.touches[0].clientY - lastTouchRef.current.y;
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        txRef.current += dx;
        tyRef.current += dy;
        setPos({ x: txRef.current, y: tyRef.current });
      }
    };

    const onTouchEnd = () => {
      lastDistRef.current = null;
      lastTouchRef.current = null;
      setPinching(false);
      if (scaleRef.current <= 1) {
        txRef.current = 0;
        tyRef.current = 0;
        setPos({ x: 0, y: 0 });
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      const newScale = Math.max(1, Math.min(5, scaleRef.current - e.deltaY * 0.003));
      scaleRef.current = newScale;
      setScale(newScale);
      if (newScale <= 1) {
        txRef.current = 0;
        tyRef.current = 0;
        setPos({ x: 0, y: 0 });
      }
    };

    const onMouseDown = (e) => {
      if (scaleRef.current <= 1) return;
      e.preventDefault();
      didDragRef.current = false;
      mouseDownRef.current = { x: e.clientX, y: e.clientY, tx: txRef.current, ty: tyRef.current };
    };

    const onMouseMove = (e) => {
      if (!mouseDownRef.current) return;
      const dx = e.clientX - mouseDownRef.current.x;
      const dy = e.clientY - mouseDownRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;
      txRef.current = mouseDownRef.current.tx + dx;
      tyRef.current = mouseDownRef.current.ty + dy;
      setPos({ x: txRef.current, y: tyRef.current });
    };

    const onMouseUp = () => {
      mouseDownRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
    };
  }, [resetZoom]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        cursor: scale > 1 ? 'grab' : 'zoom-in',
      }}
      onClick={(e) => {
        if (didDragRef.current) { e.stopPropagation(); return; }
        if (scale > 1) { e.stopPropagation(); resetZoom(); }
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
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
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
  const [slideWidth, setSlideWidth] = useState(0);
  const { t, language } = useTranslation();
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const pointerStartRef = useRef(null);
  const xBaseRef = useRef(0);

  const showNav = updates.length > 1;

  const snapTo = useCallback((idx, instant = false) => {
    const w = containerRef.current?.offsetWidth ?? 0;
    if (!w) return;
    const target = -idx * w;
    if (instant) {
      x.set(target);
    } else {
      animate(x, target, { type: 'spring', stiffness: 360, damping: 36, mass: 0.85 });
    }
  }, [x]);

  // On open: instantly position track at the opened post, no animation
  useLayoutEffect(() => {
    if (show && containerRef.current) {
      const w = containerRef.current.offsetWidth;
      setSlideWidth(w);
      setCurrentIndex(initialIndex);
      setFullscreen(false);
      x.set(-initialIndex * w);
    }
  }, [show, initialIndex, x]);

  const update = updates[currentIndex];

  const goTo = useCallback((idx) => {
    setCurrentIndex(idx);
    setFullscreen(false);
    snapTo(idx);
  }, [snapTo]);

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

  const onPointerDown = useCallback((e) => {
    if (!showNav) return;
    pointerStartRef.current = e.clientX;
    xBaseRef.current = x.get();
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [showNav, x]);

  const onPointerMove = useCallback((e) => {
    if (pointerStartRef.current === null) return;
    const delta = e.clientX - pointerStartRef.current;
    const w = containerRef.current?.offsetWidth ?? 0;
    const minX = -(updates.length - 1) * w;
    const maxX = 0;
    const raw = xBaseRef.current + delta;
    if (raw > maxX) {
      x.set(maxX + (raw - maxX) * 0.3);
    } else if (raw < minX) {
      x.set(minX + (raw - minX) * 0.3);
    } else {
      x.set(raw);
    }
  }, [updates.length, x]);

  const onPointerUp = useCallback((e) => {
    if (pointerStartRef.current === null) return;
    const delta = e.clientX - pointerStartRef.current;
    pointerStartRef.current = null;
    const threshold = 48;
    if (delta < -threshold && currentIndex < updates.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      snapTo(next);
    } else if (delta > threshold && currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      snapTo(prev);
    } else {
      snapTo(currentIndex);
    }
  }, [currentIndex, updates.length, snapTo]);

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

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modalWrap} onClick={onClose}>
        <motion.div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.97, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className={styles.header}>
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentIndex}
                className={styles.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.09 }}
              >
                {update.title}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Body — carousel track */}
          <div className={styles.body} ref={containerRef}>
            <motion.div
              className={styles.track}
              style={{
                x,
                width: slideWidth ? slideWidth * updates.length : '100%',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {updates.map((upd, idx) => {
                const updSrc = mediaUrl(upd.media_url);
                const dateStr = new Date(upd.date).toLocaleDateString(
                  language === 'es' ? 'es-ES' : 'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                );
                return (
                  <div
                    key={upd.id}
                    className={styles.slide}
                    style={{ width: slideWidth || '100%' }}
                  >
                    <div className={styles.slideContent}>
                      {updSrc && (
                        <div
                          className={styles.mediaWrap}
                          onClick={() => { if (idx === currentIndex) setFullscreen(true); }}
                        >
                          {upd.media_type === 'image' ? (
                            <img src={updSrc} alt={upd.title} className={styles.mediaImg} />
                          ) : (
                            <video src={updSrc} className={styles.mediaVideo} controls />
                          )}
                        </div>
                      )}

                      <p className={styles.content}>{upd.content}</p>

                      <div className={styles.meta}>
                        <span className={styles.metaDot} />
                        <span className={styles.metaText}>{dateStr}</span>
                        <span className={styles.metaDot} />
                        <span className={`${styles.metaText} ${styles.metaAuthor}`}>
                          {upd.author}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
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
