import { useState, useEffect, useCallback } from 'react';
import { Alert, FormInput } from './Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { updateService, SERVER_BASE_URL } from '../services/api.js';
import { UpdateModal } from './UpdateModal.jsx';
import { decodeToken, getToken } from '../utils/tokenUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { translateObject } from '../services/translationService.js';

/**
 * Update Posting Component for Employees
 */
export const UpdatePoster = () => {
  const { t, language } = useTranslation();
  const [updates, setUpdates] = useState([]); // Original updates
  const [translatedUpdates, setTranslatedUpdates] = useState([]); // Translated updates
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleUpdateClick = (update) => {
    setSelectedUpdate(update);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUpdate(null);
  };

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await updateService.getAll();
      setUpdates(response.data.updates);
      setTranslatedUpdates(response.data.updates); // Initially English
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user info and updates on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      setCurrentUser(decoded);
    }
    fetchUpdates();
  }, [fetchUpdates]);

  // Auto-translate updates when language changes
  useEffect(() => {
    const translateUpdates = async () => {
      if (updates.length === 0) return;

      if (language === 'es') {
        try {
          const translated = await Promise.all(
            updates.map(update => 
              translateObject(update, ['title', 'content', 'author'], 'es', 'en')
            )
          );
          setTranslatedUpdates(translated);
        } catch (error) {
          console.error('Error translating updates:', error);
          setTranslatedUpdates(updates);
        }
      } else {
        setTranslatedUpdates(updates);
      }
    };

    translateUpdates();
  }, [language, updates]);

  const { formData, handleChange, handleSubmit: handleFormSubmit, error: formError, resetForm } = useForm(
    {
      title: '',
      content: ''
    },
    async (data) => {
      if (!data.title || !data.content) {
        throw new Error('Please fill in all fields');
      }

      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', data.title);
      formDataToSend.append('content', data.content);
      
      if (mediaFile) {
        formDataToSend.append('media', mediaFile);
      }

      // Call API to create update
      const response = await updateService.create(formDataToSend);

      // Add new update to the top of the list
      setUpdates([response.data, ...updates]);
      setSuccess('Update posted successfully!');
      resetForm();
      setMediaFile(null);
      setMediaPreview(null);
    }
  );

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview({
        url: previewUrl,
        type: file.type.startsWith('image/') ? 'image' : 'video'
      });
    }
  };

  const handleRemoveMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
    }
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(null);
    handleFormSubmit(e);
  };

  const handleDelete = async (id) => {
    try {
      await updateService.delete(id);
      setUpdates(updates.filter(u => u.id !== id));
      setSuccess(t('updateDeleted'));
    } catch (error) {
      console.error('Error deleting update:', error);
      alert(t('error'));
    }
  };

  useEffect(() => {
    // Always start with solid black background
    document.body.style.background = '#000000';
    const handleScroll = () => {
      // Trigger black background when sticky post update card is near or at the top of the screen
      const stickyCard = document.querySelector('.card.shadow-sm.border-0.sticky-top');
      if (stickyCard) {
        const rect = stickyCard.getBoundingClientRect();
        if (rect.top <= 10) {
          document.body.style.background = '#000000';
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="update-poster">
      <div className="container pt-3 pb-5">
        <div className="row">
          {/* Post New Update Form */}
          <div className="col-lg-5 mb-4">
            <div className="card post-update-card shadow-sm border-0">
              <div className="card-body p-4">
                <h5 className="card-title mb-4 force-black-title">{t('postUpdate')}</h5>

                {success && (
                  <Alert 
                    message={success} 
                    type="success"
                    onClose={() => setSuccess(null)}
                  />
                )}

                {formError && (
                  <Alert 
                    message={formError} 
                    type="danger"
                  />
                )}

                <form onSubmit={handleSubmit}>
                  <FormInput
                    label={t('title')}
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />

                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">{t('content')}</label>
                    <textarea
                      id="content"
                      name="content"
                      className="form-control"
                      rows="5"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder={t('contentPlaceholder')}
                      required
                    />
                  </div>

                  {/* Media Upload */}
                  <div className="mb-3">
                    <label htmlFor="media" className="form-label">{t('photoOrVideo')}</label>
                    <div className="d-flex align-items-center gap-2">
                      <label 
                        htmlFor="media" 
                        className="btn btn-outline-secondary mb-0"
                        style={{ cursor: 'pointer' }}
                      >
                        {t('chooseFile')}
                      </label>
                      <span className="file-info-text">
                        {mediaFile ? mediaFile.name : t('noFileChosen')}
                      </span>
                    </div>
                    <input
                      type="file"
                      id="media"
                      className="d-none"
                      accept="image/*,video/*"
                      onChange={handleMediaChange}
                    />
                    <small className="file-info-text d-block mt-1">{t('mediaInfo')}</small>
                  </div>

                  {/* Media Preview */}
                  {mediaPreview && (
                    <div className="mb-3">
                      <div className="position-relative">
                        {mediaPreview.type === 'image' ? (
                          <img 
                            src={mediaPreview.url} 
                            alt="Preview" 
                            className="img-fluid rounded" 
                            style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <video 
                            src={mediaPreview.url} 
                            className="w-100 rounded" 
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                            controls
                          />
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                          onClick={handleRemoveMedia}
                        >
                          {t('removeMedia')}
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-lg w-100 post-update-btn"
                  >
                    {t('post')}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Updates List */}
          <div className="col-lg-7">
            <h5 className="mb-4">{t('recentUpdates')}</h5>
            {loading ? (
              <p className="text-muted">{t('loading')}</p>
            ) : translatedUpdates.length === 0 ? (
              <p className="text-muted">{t('noUpdates')}</p>
            ) : (
              <div className="updates-list">
                {translatedUpdates.map(update => {
                  // Check if user can delete this update
                  const isAdmin = currentUser?.email === import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
                  const isOwner = currentUser?.id === update.user_id;
                  const canDelete = isAdmin || isOwner;

                  return (
                  <div key={update.id} className="card shadow-sm border-0 mb-3" style={{ boxShadow: '0 12px 48px 0 rgba(5,45,63,0.45), 0 4px 16px 0 rgba(0,0,0,0.25)' }}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 
                          className="card-title mb-0"
                          style={{ cursor: 'pointer', flex: 1 }}
                          onClick={() => handleUpdateClick(update)}
                        >
                          {update.title}
                        </h6>
                        {canDelete && (
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor: 'rgb(5, 45, 63)',
                            color: 'white',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(5,45,63,0.18), 0 1px 1px rgba(0,0,0,0.12)',
                            border: 'none',
                            padding: '0.25rem 0.75rem',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(update.id);
                          }}
                        >
                          {t('delete')}
                        </button>
                        )}
                      </div>
                      
                      {/* Display media if available */}
                      {update.media_url && (
                        <div 
                          className="mb-3"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleUpdateClick(update)}
                        >
                          {update.media_type === 'image' ? (
                            <img 
                              src={`${SERVER_BASE_URL}${update.media_url}`}
                              alt={update.title}
                              className="img-fluid rounded"
                              style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <video 
                              src={`${SERVER_BASE_URL}${update.media_url}`}
                              className="w-100 rounded"
                              style={{ maxHeight: '300px', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                      )}
                      
                      <p 
                        className="card-text mb-3"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleUpdateClick(update)}
                      >
                        {update.content.length > 150 ? update.content.substring(0, 150) + '...' : update.content}
                      </p>
                      <small className="text-muted">
                        {new Date(update.date).toLocaleDateString()} • {update.author}
                      </small>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <UpdateModal 
        update={selectedUpdate}
        show={showModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};
