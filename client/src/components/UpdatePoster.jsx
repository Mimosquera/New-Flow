import { useState, useEffect, useCallback } from 'react';
import { Alert, FormInput } from './Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { updateService, SERVER_BASE_URL } from '../services/api.js';
import { UpdateModal } from './UpdateModal.jsx';
import { decodeToken, getToken } from '../utils/tokenUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { useTranslateItems } from '../hooks/useTranslateItems.js';

const INITIAL_FETCH = 5;
const INITIAL_DISPLAY = 4;
const LOAD_MORE_BATCH = 8;

export const UpdatePoster = () => {
  const { t, language } = useTranslation();
  const [updates, setUpdates] = useState([]);
  const [translatedUpdates] = useTranslateItems(updates, ['title', 'content', 'author'], language);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);
  const [loadingMore, setLoadingMore] = useState(false);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
      const response = await updateService.getAll(INITIAL_FETCH);
      setUpdates(response.data.updates);
      setTotalUpdates(response.data.total);
      setDisplayCount(INITIAL_DISPLAY);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Load next batch of posts from the server (only fetches what's needed) */
  const handleLoadMore = async () => {
    const newDisplayCount = Math.min(displayCount + LOAD_MORE_BATCH, totalUpdates);

    // Only hit the server if we don't already have enough cached
    if (newDisplayCount > updates.length && updates.length < totalUpdates) {
      try {
        setLoadingMore(true);
        const needed = newDisplayCount - updates.length;
        const response = await updateService.getAll(needed, updates.length);
        setUpdates(prev => [...prev, ...response.data.updates]);
        setTotalUpdates(response.data.total); // refresh in case total changed
      } catch (error) {
        console.error('Error loading more updates:', error);
        return;
      } finally {
        setLoadingMore(false);
      }
    }

    setDisplayCount(newDisplayCount);
  };

  /** Collapse list back to the initial display count */
  const handleHidePosts = () => {
    setDisplayCount(INITIAL_DISPLAY);
  };

  // Fetch user info and updates on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      setCurrentUser(decoded);
    }
    fetchUpdates();
  }, [fetchUpdates]);


  const { formData, handleChange, handleSubmit: handleFormSubmit, error: formError, setError: setFormError, resetForm } = useForm(
    {
      title: '',
      content: ''
    },
    async (data) => {
      if (!data.title || !data.content) {
        throw new Error(t('pleaseFillRequired'));
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
      setTotalUpdates(prev => prev + 1);
      setDisplayCount(prev => prev + 1); // keep new post visible
      setSuccess(t('updatePosted'));
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
      const remaining = updates.filter(u => u.id !== id);
      setUpdates(remaining);
      setTotalUpdates(prev => prev - 1);
      setDisplayCount(prev => Math.min(prev, remaining.length));
      setSuccess(t('updateDeleted'));
    } catch (error) {
      console.error('Error deleting update:', error);
      alert(t('error'));
    }
  };

  useEffect(() => {
    document.body.style.background = '#000000';
  }, []);

  const cardStyle = {
    background: 'rgba(5, 45, 63, 0.55)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(70, 161, 161, 0.2)',
    borderRadius: '18px',
    overflow: 'hidden',
    marginBottom: '0.75rem',
  };

  const cardTitleStyle = {
    color: '#fff',
    fontWeight: '700',
    fontSize: '0.9rem',
    letterSpacing: '-0.01em',
    cursor: 'pointer',
    flex: 1,
    margin: 0,
  };

  const cardTextStyle = {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.82rem',
    lineHeight: '1.45',
    cursor: 'pointer',
    margin: 0,
  };

  const cardMetaStyle = {
    fontSize: '0.7rem',
    color: '#46a1a1',
    fontWeight: '500',
    letterSpacing: '0.025em',
    borderTop: '1px solid rgba(70,161,161,0.12)',
    paddingTop: '0.4rem',
    marginTop: '0.25rem',
  };

  return (
    <div className="update-poster">
      <div className="container pt-3 pb-5">
        <div className="row justify-content-center">
          {/* Post New Update Form */}
          <div className="col-lg-4 mb-4">
            <div style={{ ...cardStyle, marginBottom: '0' }}>
              <div
                className="d-flex justify-content-between align-items-center collapsible-header"
                style={{
                  background: 'linear-gradient(135deg, rgb(5, 45, 63) 0%, rgb(3, 35, 50) 100%)',
                  borderBottom: '1px solid rgba(70,161,161,0.25)',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.75rem 1rem'
                }}
                onClick={() => setShowForm(!showForm)}
              >
                <h5 className="mb-0" style={{ fontSize: '1rem', color: '#fff', fontWeight: '700' }}>{t('postUpdate')}</h5>
                <span className="d-lg-none" style={{ fontSize: '1.2rem', color: '#46a1a1' }}>
                  {showForm ? '\u2212' : '+'}
                </span>
              </div>
              <div className={`d-lg-block ${showForm ? 'd-block' : 'd-none'}`}>
              <div className="card-body p-4">

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
                    onClose={() => setFormError('')}
                  />
                )}

                <form onSubmit={handleSubmit} noValidate>
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
          </div>

          {/* Updates List */}
          <div className="col-lg-6">
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h4 className="mb-4 recent-updates-header">{t('recentUpdates')}</h4>
            {loading ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>{t('loading')}</p>
            ) : translatedUpdates.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>{t('noUpdates')}</p>
            ) : (
              <>
              <div className="updates-list">
                {translatedUpdates.slice(0, displayCount).map(update => {
                  const isAdmin = currentUser?.email === import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
                  const isOwner = currentUser?.id === update.user_id;
                  const canDelete = isAdmin || isOwner;

                  return (
                  <div key={update.id} style={cardStyle}>
                    <div style={{ padding: '0.75rem 1rem' }}>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6
                          style={cardTitleStyle}
                          onClick={() => handleUpdateClick(update)}
                        >
                          {update.title}
                        </h6>
                        {canDelete && (
                        <button
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(220, 53, 69, 0.2)',
                            color: '#ff7b7b',
                            border: '1px solid rgba(220, 53, 69, 0.4)',
                            borderRadius: '8px',
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            flexShrink: 0,
                            marginLeft: '0.5rem',
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

                      {update.media_url && (
                        <div
                          className="mt-1 mb-2"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleUpdateClick(update)}
                        >
                          {update.media_type === 'image' ? (
                            <img
                              src={update.media_url.startsWith('http') ? update.media_url : `${SERVER_BASE_URL}${update.media_url}`}
                              alt={update.title}
                              className="img-fluid rounded"
                              style={{ maxHeight: '200px', width: '100%', objectFit: 'cover', borderRadius: '12px' }}
                            />
                          ) : (
                            <video
                              src={update.media_url.startsWith('http') ? update.media_url : `${SERVER_BASE_URL}${update.media_url}`}
                              className="w-100"
                              style={{ maxHeight: '200px', objectFit: 'cover', borderRadius: '12px' }}
                            />
                          )}
                        </div>
                      )}

                      <p
                        style={cardTextStyle}
                        onClick={() => handleUpdateClick(update)}
                      >
                        {update.content.length > 150 ? update.content.substring(0, 150) + '...' : update.content}
                      </p>
                      <div style={cardMetaStyle}>
                        {new Date(update.date).toLocaleDateString()} · {update.author}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Load More / Hide Posts buttons */}
              <div className="d-flex justify-content-center gap-2 mt-3">
                {displayCount < totalUpdates && (
                  <button
                    className="btn btn-sm load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? t('loading') : t('loadMorePosts')}
                  </button>
                )}
                {displayCount > INITIAL_DISPLAY && (
                  <button
                    className="btn btn-sm hide-posts-btn"
                    onClick={handleHidePosts}
                  >
                    {t('hidePosts')}
                  </button>
                )}
              </div>
              </>
            )}
            </div>
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
