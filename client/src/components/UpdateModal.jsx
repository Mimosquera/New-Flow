import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';
import { useTranslation } from '../hooks/useTranslation.js';
import { SERVER_BASE_URL } from '../services/api.js';
import styles from './UpdateModal.module.css';

const ZoomableImage = ({ src, alt }) => {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);

  // Transform state — all refs, updated via direct DOM to avoid React re-render lag
  const s = useRef(1);
  const tx = useRef(0);
  const ty = useRef(0);

  // Gesture tracking
  const lastDist = useRef(0);
  const lastMidX = useRef(0);
  const lastMidY = useRef(0);
  const lastTap = useRef(0);
  const panning = useRef(false);
  const didPan = useRef(false);

  // Momentum
  const velX = useRef(0);
  const velY = useRef(0);
  const lastMoveTime = useRef(0);
  const lastMoveX = useRef(0);
  const lastMoveY = useRef(0);
  const rafRef = useRef(null);

  // Mouse
  const mouseRef = useRef(null);

  const commit = (transition = 'none') => {
    if (!imgRef.current) return;
    imgRef.current.style.transition = `transform ${transition}`;
    imgRef.current.style.transform = `translate(${tx.current}px, ${ty.current}px) scale(${s.current})`;
  };

  const maxPan = () => {
    if (!imgRef.current || !wrapRef.current) return { mx: 0, my: 0 };
    const iw = imgRef.current.offsetWidth * s.current;
    const ih = imgRef.current.offsetHeight * s.current;
    return {
      mx: Math.max(0, (iw - wrapRef.current.offsetWidth) / 2),
      my: Math.max(0, (ih - wrapRef.current.offsetHeight) / 2),
    };
  };

  const clamp = (v, m) => Math.max(-m, Math.min(m, v));

  // Soft resistance when dragging past boundary
  const resist = (v, m) => {
    if (m === 0) return 0;
    if (Math.abs(v) <= m) return v;
    const over = Math.abs(v) - m;
    return v > 0 ? m + over * 0.18 : -(m + over * 0.18);
  };

  const cancelRaf = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const snapBack = (spring = '0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)') => {
    const { mx, my } = maxPan();
    tx.current = clamp(tx.current, mx);
    ty.current = clamp(ty.current, my);
    commit(spring);
  };

  const resetZoom = (animated = true) => {
    cancelRaf();
    s.current = 1; tx.current = 0; ty.current = 0;
    commit(animated ? '0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none');
  };

  const startMomentum = () => {
    cancelRaf();
    if (Math.abs(velX.current) < 0.5 && Math.abs(velY.current) < 0.5) {
      snapBack();
      return;
    }
    const step = () => {
      velX.current *= 0.95;
      velY.current *= 0.95;
      tx.current += velX.current;
      ty.current += velY.current;
      commit();
      if (Math.abs(velX.current) < 0.5 && Math.abs(velY.current) < 0.5) {
        snapBack();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      cancelRaf();
      if (e.touches.length === 2) {
        panning.current = false;
        const t0 = e.touches[0], t1 = e.touches[1];
        lastDist.current = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        lastMidX.current = (t0.clientX + t1.clientX) / 2;
        lastMidY.current = (t0.clientY + t1.clientY) / 2;
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap.current < 280) {
          e.preventDefault();
          resetZoom();
          lastTap.current = 0;
          return;
        }
        lastTap.current = now;
        panning.current = true;
        didPan.current = false;
        lastMidX.current = e.touches[0].clientX;
        lastMidY.current = e.touches[0].clientY;
        velX.current = 0; velY.current = 0;
        lastMoveTime.current = Date.now();
        lastMoveX.current = lastMidX.current;
        lastMoveY.current = lastMidY.current;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;

        const rect = wrapRef.current.getBoundingClientRect();
        // Focal point relative to container center
        const focalX = midX - rect.left - rect.width / 2;
        const focalY = midY - rect.top - rect.height / 2;

        const ratio = dist / lastDist.current;
        const newScale = Math.max(1, Math.min(5, s.current * ratio));
        const actualRatio = newScale / s.current;

        // Zoom toward focal point + pan with midpoint movement
        tx.current = focalX - (focalX - tx.current) * actualRatio + (midX - lastMidX.current);
        ty.current = focalY - (focalY - ty.current) * actualRatio + (midY - lastMidY.current);
        s.current = newScale;

        lastDist.current = dist;
        lastMidX.current = midX;
        lastMidY.current = midY;
        commit();
      } else if (e.touches.length === 1 && panning.current && s.current > 1) {
        e.preventDefault();
        const cx = e.touches[0].clientX;
        const cy = e.touches[0].clientY;
        const dx = cx - lastMidX.current;
        const dy = cy - lastMidY.current;

        // Track velocity for momentum
        const now = Date.now();
        const dt = now - lastMoveTime.current;
        if (dt > 0) {
          velX.current = (cx - lastMoveX.current) / dt * 16;
          velY.current = (cy - lastMoveY.current) / dt * 16;
        }
        lastMoveTime.current = now;
        lastMoveX.current = cx;
        lastMoveY.current = cy;

        const { mx, my } = maxPan();
        tx.current = resist(tx.current + dx, mx);
        ty.current = resist(ty.current + dy, my);
        lastMidX.current = cx;
        lastMidY.current = cy;
        didPan.current = true;
        commit();
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        if (panning.current && s.current > 1) {
          startMomentum();
        } else if (s.current <= 1) {
          tx.current = 0; ty.current = 0;
          commit('0.25s ease');
        } else {
          snapBack();
        }
        panning.current = false;
      } else if (e.touches.length === 1) {
        // One finger remains after pinch — continue as pan
        panning.current = true;
        lastMidX.current = e.touches[0].clientX;
        lastMidY.current = e.touches[0].clientY;
        velX.current = 0; velY.current = 0;
        lastMoveTime.current = Date.now();
        if (s.current < 1) {
          s.current = 1; tx.current = 0; ty.current = 0;
          commit('0.25s ease');
        } else {
          snapBack();
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      cancelRaf();
      const rect = wrapRef.current.getBoundingClientRect();
      const focalX = e.clientX - rect.left - rect.width / 2;
      const focalY = e.clientY - rect.top - rect.height / 2;
      const newScale = Math.max(1, Math.min(5, s.current * (1 - e.deltaY * 0.002)));
      const ratio = newScale / s.current;
      tx.current = focalX - (focalX - tx.current) * ratio;
      ty.current = focalY - (focalY - ty.current) * ratio;
      s.current = newScale;
      if (newScale <= 1) { tx.current = 0; ty.current = 0; }
      commit();
    };

    const onMouseDown = (e) => {
      if (s.current <= 1) return;
      cancelRaf();
      e.preventDefault();
      didPan.current = false;
      mouseRef.current = { startX: e.clientX, startY: e.clientY, tx: tx.current, ty: ty.current };
      velX.current = 0; velY.current = 0;
      lastMoveTime.current = Date.now();
      lastMoveX.current = e.clientX;
      lastMoveY.current = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!mouseRef.current) return;
      const dx = e.clientX - mouseRef.current.startX;
      const dy = e.clientY - mouseRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didPan.current = true;

      const now = Date.now();
      const dt = now - lastMoveTime.current;
      if (dt > 0) {
        velX.current = (e.clientX - lastMoveX.current) / dt * 16;
        velY.current = (e.clientY - lastMoveY.current) / dt * 16;
      }
      lastMoveTime.current = now;
      lastMoveX.current = e.clientX;
      lastMoveY.current = e.clientY;

      const { mx, my } = maxPan();
      tx.current = resist(mouseRef.current.tx + dx, mx);
      ty.current = resist(mouseRef.current.ty + dy, my);
      commit();
    };

    const onMouseUp = () => {
      if (!mouseRef.current) return;
      mouseRef.current = null;
      startMomentum();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      cancelRaf();
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'grab',
      }}
      onClick={(e) => {
        if (didPan.current) { e.stopPropagation(); return; }
        if (s.current > 1) { e.stopPropagation(); resetZoom(); }
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        style={{
          maxWidth: '95%',
          maxHeight: '95vh',
          objectFit: 'contain',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          willChange: 'transform',
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
