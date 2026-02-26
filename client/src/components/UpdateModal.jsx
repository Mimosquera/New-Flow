import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from '../hooks/useTranslation.js';
import { SERVER_BASE_URL } from '../services/api.js';

/**
 * Modal component for viewing full update details with large media
 */
export const UpdateModal = ({ update, show, onClose }) => {
  const [fullscreen, setFullscreen] = useState(false);
  const { t, language } = useTranslation();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (show && update) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show, update]);

  if (!show || !update) return null;

  const handleMediaClick = () => {
    setFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setFullscreen(false);
  };

  // Fullscreen overlay
  if (fullscreen && update.media_url) {
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.95)', 
          zIndex: 2000,
          cursor: 'zoom-out'
        }}
        onClick={handleCloseFullscreen}
      >
        <button
          className="btn btn-light position-absolute top-0 end-0 m-3"
          onClick={handleCloseFullscreen}
          style={{ zIndex: 2001 }}
        >
          ✕ Close
        </button>
        {update.media_type === 'image' ? (
          <img
            src={update.media_url.startsWith('http') ? update.media_url : `${SERVER_BASE_URL}${update.media_url}`}
            alt={update.title}
            style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <video
            src={update.media_url.startsWith('http') ? update.media_url : `${SERVER_BASE_URL}${update.media_url}`}
            style={{ maxWidth: '95%', maxHeight: '95%' }}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Modal backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={onClose}
        style={{ zIndex: 1040 }}
      />
      
      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content" style={{ 
            borderRadius: '24px', 
            overflow: 'hidden', 
            border: 'none',
            boxShadow: '0 20px 60px rgba(5, 45, 63, 0.5), 0 0 0 1px rgba(70, 161, 161, 0.2)'
          }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, rgb(5, 45, 63) 0%, rgb(3, 35, 50) 100%)',
              borderBottom: '3px solid #46a1a1',
              padding: '1.25rem 1.5rem'
            }}>
              <h5 className="modal-title" style={{ 
                color: '#fff', 
                fontWeight: '700', 
                letterSpacing: '-0.01em',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>{update.title}</h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body" style={{ 
              padding: '1.75rem',
              background: 'linear-gradient(180deg, #ffffff 0%, #eaf6f6 100%)'
            }}>
              {/* Large media display */}
              {update.media_url && (
                <div 
                  className="mb-4" 
                  style={{ cursor: 'zoom-in' }}
                  onClick={handleMediaClick}
                >
                  {update.media_type === 'image' ? (
                    <img
                      src={update.media_url.startsWith('http') ? update.media_url : `${SERVER_BASE_URL}${update.media_url}`}
                      alt={update.title}
                      className="img-fluid w-100"
                      style={{ 
                        maxHeight: '60vh', 
                        objectFit: 'contain', 
                        borderRadius: '12px',
                        border: '1px solid rgba(70, 161, 161, 0.15)'
                      }}
                    />
                  ) : (
                    <video
                      src={update.media_url.startsWith('http') ? update.media_url : `${SERVER_BASE_URL}${update.media_url}`}
                      className="w-100"
                      style={{ 
                        maxHeight: '60vh', 
                        borderRadius: '12px',
                        border: '1px solid rgba(70, 161, 161, 0.15)'
                      }}
                      controls
                    />
                  )}
                  <small style={{ color: '#46a1a1', fontWeight: '500' }} className="d-block text-center mt-2">
                    {t('clickToViewFullscreen')}
                  </small>
                </div>
              )}
              
              {/* Content */}
              <p className="mb-3" style={{ 
                whiteSpace: 'pre-wrap', 
                fontSize: '1rem', 
                color: 'rgb(5, 45, 63)',
                lineHeight: '1.6'
              }}>
                {update.content}
              </p>
              
              {/* Metadata */}
              <div style={{ 
                borderTop: '1px solid rgba(70, 161, 161, 0.2)', 
                paddingTop: '0.75rem',
                marginTop: '0.5rem'
              }}>
                <small style={{ color: '#46a1a1', fontWeight: '600', fontSize: '0.82rem', letterSpacing: '0.02em' }}>
                  {t('postedOn')} {new Date(update.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')} {t('by')} {update.author}
                </small>
              </div>
            </div>
            <div className="modal-footer" style={{ 
              background: 'linear-gradient(135deg, rgb(5, 45, 63) 0%, rgb(3, 35, 50) 100%)',
              borderTop: '2px solid #46a1a1',
              padding: '0.75rem 1.5rem'
            }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, rgba(70, 161, 161, 0.15) 0%, rgba(70, 161, 161, 0.08) 100%)',
                  color: '#fff',
                  border: '1.5px solid rgba(70, 161, 161, 0.6)',
                  borderRadius: '10px',
                  padding: '0.4rem 1.25rem',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  letterSpacing: '0.03em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)'
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
  update: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    content: PropTypes.string,
    author: PropTypes.string,
    date: PropTypes.string,
    media_url: PropTypes.string,
    media_type: PropTypes.string,
  }),
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
