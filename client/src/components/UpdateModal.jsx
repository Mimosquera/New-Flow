import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from '../hooks/useTranslation.js';
import { SERVER_BASE_URL } from '../services/api.js';

/**
 * Modal component for viewing full update details with large media
 */
export const UpdateModal = ({ update, show, onClose }) => {
  const [fullscreen, setFullscreen] = useState(false);
  const { t, language } = useTranslation();

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
            src={`${SERVER_BASE_URL}${update.media_url}`}
            alt={update.title}
            style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <video 
            src={`${SERVER_BASE_URL}${update.media_url}`}
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
          <div className="modal-content" style={{ borderRadius: '30px', overflow: 'hidden' }}>
            <div className="modal-header">
              <h5 className="modal-title">{update.title}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              {/* Large media display */}
              {update.media_url && (
                <div 
                  className="mb-4" 
                  style={{ cursor: 'zoom-in' }}
                  onClick={handleMediaClick}
                >
                  {update.media_type === 'image' ? (
                    <img 
                      src={`${SERVER_BASE_URL}${update.media_url}`}
                      alt={update.title}
                      className="img-fluid rounded w-100"
                      style={{ maxHeight: '60vh', objectFit: 'contain' }}
                    />
                  ) : (
                    <video 
                      src={`${SERVER_BASE_URL}${update.media_url}`}
                      className="w-100 rounded"
                      style={{ maxHeight: '60vh' }}
                      controls
                    />
                  )}
                  <small className="text-muted d-block text-center mt-2">
                    {t('clickToViewFullscreen')}
                  </small>
                </div>
              )}
              
              {/* Content */}
              <p className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                {update.content}
              </p>
              
              {/* Metadata */}
              <div className="text-muted">
                <small>
                  {t('postedOn')} {new Date(update.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')} {t('by')} {update.author}
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
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
