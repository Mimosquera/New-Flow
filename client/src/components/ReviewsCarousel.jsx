import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { reviews, GOOGLE_RATING, REVIEW_COUNT, GOOGLE_MAPS_URL } from '../data/reviews.js';
import styles from './ReviewsCarousel.module.css';

const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Stars = ({ count }) => (
  <div className={styles.stars} aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`${styles.star} ${i < count ? styles.starFilled : styles.starEmpty}`}
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

Stars.propTypes = { count: PropTypes.number.isRequired };

const ReviewCard = ({ review, mini }) => (
  <div className={`${styles.card} ${mini ? styles.cardMini : ''}`}>
    <div className={styles.cardTop}>
      <div className={`${styles.avatar} ${mini ? styles.avatarMini : ''}`}>
        {review.name[0]}
      </div>
      <div className={styles.reviewer}>
        <span className={`${styles.reviewerName} ${mini ? styles.reviewerNameMini : ''}`}>
          {review.name}
        </span>
        <span className={`${styles.reviewerDate} ${mini ? styles.reviewerDateMini : ''}`}>
          {review.date}
        </span>
      </div>
      <GoogleIcon />
    </div>
    <Stars count={review.rating} />
    <p className={`${styles.reviewText} ${mini ? styles.reviewTextMini : ''}`}>
      {review.text}
    </p>
  </div>
);

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
  }).isRequired,
  mini: PropTypes.bool,
};

const doubled = [...reviews, ...reviews];

export const ReviewsCarousel = ({ mini = false }) => {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        track.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      },
      { threshold: 0 }
    );

    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`${styles.wrapper} ${mini ? styles.wrapperMini : ''}`}>
      {!mini && (
        <div className={styles.header}>
          <h2 className={styles.heading}>What Our Clients Say</h2>
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ratingLink}
          >
            <GoogleIcon />
            <span className={styles.ratingText}>
              <span className={styles.ratingScore}>{GOOGLE_RATING}</span>
              <span className={styles.ratingStars}>★★★★★</span>
              <span className={styles.ratingCount}>· {REVIEW_COUNT} reviews</span>
            </span>
          </a>
        </div>
      )}
      <div className={styles.fade}>
        <div
          ref={trackRef}
          className={`${styles.track} ${mini ? styles.trackMini : ''}`}
        >
          {doubled.map((review, i) => (
            <ReviewCard key={`${review.id}-${i}`} review={review} mini={mini} />
          ))}
        </div>
      </div>
      {mini && (
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.miniLink}
        >
          <GoogleIcon />
          <span>{GOOGLE_RATING} ★★★★★ · {REVIEW_COUNT} reviews on Google</span>
        </a>
      )}
    </div>
  );
};

ReviewsCarousel.propTypes = {
  mini: PropTypes.bool,
};
