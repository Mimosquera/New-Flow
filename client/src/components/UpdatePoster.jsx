import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText, PenLine } from 'lucide-react';
import { Alert, FormInput } from './Common/index.jsx';
import { useForm } from '../hooks/useForm.js';
import { updateService, SERVER_BASE_URL } from '../services/api.js';
import { UpdateModal } from './UpdateModal.jsx';
import { decodeToken, getToken } from '../utils/tokenUtils.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { useTranslateItems } from '../hooks/useTranslateItems.js';
import { hapticSuccess, hapticWarning, hapticMedium } from '../utils/haptics.js';

const INITIAL_FETCH = 5;
const INITIAL_DISPLAY = 4;
const LOAD_MORE_BATCH = 8;

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

const PostCard = ({ update, onOpen, onDelete, canDelete, t }) => {
  const [imgLoaded, setImgLoaded] = useState(!update.media_url);
  const src = update.media_url
    ? (update.media_url.startsWith('http') ? update.media_url : `${SERVER_BASE_URL}${update.media_url}`)
    : null;

  return (
    <div style={{ ...cardStyle, marginBottom: 0, height: '100%' }}>
      <div style={{ padding: '0.75rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h6 style={cardTitleStyle} onClick={onOpen}>{update.title}</h6>
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
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              {t('delete')}
            </button>
          )}
        </div>

        {src && (
          <div
            className="mt-3 mb-2"
            style={{ cursor: 'pointer', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}
            onClick={onOpen}
          >
            {!imgLoaded && (
              <div className="sk" style={{ position: 'absolute', inset: 0, height: '100%', borderRadius: '12px', zIndex: 1 }} />
            )}
            {update.media_type === 'image' ? (
              <img
                src={src}
                alt={update.title}
                loading="lazy"
                decoding="async"
                className="img-fluid rounded"
                style={{ maxHeight: '200px', width: '100%', objectFit: 'cover', borderRadius: '12px', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgLoaded(true)}
              />
            ) : (
              <video
                src={src}
                className="w-100"
                style={{ maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
                onLoadedData={() => setImgLoaded(true)}
                onError={() => setImgLoaded(true)}
              />
            )}
          </div>
        )}

        <p style={cardTextStyle} onClick={onOpen}>
          {update.content.length > 150 ? update.content.substring(0, 150) + '...' : update.content}
        </p>
        <div style={cardMetaStyle}>
          {new Date(update.date).toLocaleDateString()} · {update.author}
        </div>
      </div>
    </div>
  );
};

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
  const [selectedUpdateIndex, setSelectedUpdateIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showUpdates, setShowUpdates] = useState(window.innerWidth >= 992);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  const handleUpdateClick = (update) => {
    const idx = translatedUpdates.findIndex(u => u.id === update.id);
    setSelectedUpdateIndex(idx >= 0 ? idx : 0);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
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

  const handleLoadMore = async () => {
    const newDisplayCount = Math.min(displayCount + LOAD_MORE_BATCH, totalUpdates);

    if (newDisplayCount > updates.length && updates.length < totalUpdates) {
      try {
        setLoadingMore(true);
        const needed = newDisplayCount - updates.length;
        const response = await updateService.getAll(needed, updates.length);
        setUpdates(prev => [...prev, ...response.data.updates]);
        setTotalUpdates(response.data.total);
      } catch (error) {
        console.error('Error loading more updates:', error);
        return;
      } finally {
        setLoadingMore(false);
      }
    }

    setDisplayCount(newDisplayCount);
  };

  const handleHidePosts = () => {
    setDisplayCount(INITIAL_DISPLAY);
  };

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

      const formDataToSend = new FormData();
      formDataToSend.append('title', data.title);
      formDataToSend.append('content', data.content);
      
      if (mediaFile) {
        formDataToSend.append('media', mediaFile);
      }

      const response = await updateService.create(formDataToSend);
      setUpdates([response.data, ...updates]);
      setTotalUpdates(prev => prev + 1);
      setDisplayCount(prev => prev + 1);
      hapticSuccess();
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
      hapticMedium();
      setSuccess(t('updateDeleted'));
    } catch (error) {
      hapticWarning();
      console.error('Error deleting update:', error);
      alert(t('error'));
    }
  };

  useEffect(() => {
    document.body.style.background = '#000000';
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="update-poster">
      <div className="container pt-3 pb-5">
        <div className="row justify-content-center">
          {/* Post New Update Form */}
          <div className="col-lg-4 mb-4">
            <div className="post-update-card" style={{ ...cardStyle, marginBottom: '0' }}>
              <div
                className="d-flex justify-content-between align-items-center collapsible-header"
                style={{
                  background: 'rgba(3, 25, 38, 0.45)',
                  borderBottom: '1px solid rgba(70,161,161,0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.75rem 1rem',
                  borderRadius: (isDesktop || showForm) ? '0.75rem 0.75rem 0 0' : '0.75rem',
                }}
                onClick={() => setShowForm(!showForm)}
              >
                <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1rem', color: '#fff', fontWeight: '700' }}>
                  <PenLine size={15} />
                  {t('postUpdate')}
                </h5>
                <span className="d-lg-none">
                  {showForm ? <ChevronUp size={16} style={{ color: '#46a1a1' }} /> : <ChevronDown size={16} style={{ color: '#46a1a1' }} />}
                </span>
              </div>
              <AnimatePresence initial={false}>
                {(isDesktop || showForm) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
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
                        className="btn mb-0"
                        style={{
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '0.3rem 0.85rem',
                          background: 'rgba(70,161,161,0.12)',
                          color: '#46a1a1',
                          border: '1.5px solid rgba(70,161,161,0.4)',
                          borderRadius: '0.5rem',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                        }}
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

                  <div className="d-flex justify-content-center">
                    <button
                      type="submit"
                      className="btn post-update-btn"
                    >
                      {t('post')}
                    </button>
                  </div>
                </form>
              </div>
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Updates List */}
          <div className="col-lg-8">
            <div
              className="d-flex justify-content-between align-items-center collapsible-header mb-0"
              style={{ background: 'rgba(3, 25, 38, 0.45)', borderBottom: '1px solid rgba(70,161,161,0.2)', color: 'white', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: showUpdates ? '0.75rem 0.75rem 0 0' : '0.75rem' }}
              onClick={() => setShowUpdates(!showUpdates)}
            >
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1rem', fontWeight: '700' }}>
                <FileText size={15} />
                {t('recentUpdates')}{totalUpdates > 0 && ` (${totalUpdates})`}
              </h5>
              {showUpdates ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <AnimatePresence initial={false}>
            {showUpdates && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
            <div className="pt-3">
            {loading ? (
              <div className="row g-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="col-6">
                    <div className="sk-card p-3 h-100" style={{ animationDelay: `${i * 0.14}s` }}>
                      <span className="sk mb-2" style={{ height: '14px', width: '70%', animationDelay: `${i * 0.14}s` }} />
                      <span className="sk mb-1" style={{ height: '11px', width: '90%', animationDelay: `${i * 0.14}s` }} />
                      <span className="sk mb-3" style={{ height: '11px', width: '55%', animationDelay: `${i * 0.14}s` }} />
                      <div className="d-flex justify-content-between">
                        <span className="sk" style={{ height: '10px', width: '30%', animationDelay: `${i * 0.14}s` }} />
                        <span className="sk" style={{ height: '10px', width: '22%', animationDelay: `${i * 0.14}s` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : translatedUpdates.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>{t('noUpdates')}</p>
            ) : (
              <>
              <div className="row g-3">
                {translatedUpdates.slice(0, displayCount).map(update => {
                  const isAdmin = currentUser?.email === import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
                  const isOwner = currentUser?.id === update.user_id;
                  const canDelete = isAdmin || isOwner;

                  return (
                  <div key={update.id} className="col-6">
                    <PostCard
                      update={update}
                      onOpen={() => handleUpdateClick(update)}
                      onDelete={() => handleDelete(update.id)}
                      canDelete={canDelete}
                      t={t}
                    />
                  </div>
                  );
                })}
              </div>

              {loadingMore && (
                <div className="row g-3 mt-1">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="col-6">
                      <div className="sk-card p-3" style={{ animationDelay: `${i * 0.12}s` }}>
                        <span className="sk mb-2" style={{ height: '14px', width: '70%', animationDelay: `${i * 0.12}s` }} />
                        <span className="sk mb-1" style={{ height: '11px', width: '90%', animationDelay: `${i * 0.12}s` }} />
                        <span className="sk mb-3" style={{ height: '11px', width: '55%', animationDelay: `${i * 0.12}s` }} />
                        <div className="d-flex justify-content-between">
                          <span className="sk" style={{ height: '10px', width: '30%', animationDelay: `${i * 0.12}s` }} />
                          <span className="sk" style={{ height: '10px', width: '22%', animationDelay: `${i * 0.12}s` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
            </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    {/* Update Modal */}
    <UpdateModal
      updates={translatedUpdates}
      initialIndex={selectedUpdateIndex}
      show={showModal}
      onClose={handleCloseModal}
    />
  </div>
  );
};
