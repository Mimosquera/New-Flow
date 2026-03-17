import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, PenLine, Pencil, X, AlertTriangle } from 'lucide-react';
import { Alert, FormInput } from '../../components/Common/index.jsx';
import { useForm } from '../../hooks/useForm.js';
import { postsService, SERVER_BASE_URL } from '../../services/api.js';
import { PostModal } from '../../components/PostModal.jsx';
import { decodeToken, getToken } from '../../utils/tokenUtils.js';
import { useTranslation } from '../../hooks/useTranslation.js';
import { useTranslateItems } from '../../hooks/useTranslateItems.js';
import { hapticSuccess, hapticWarning, hapticMedium } from '../../utils/haptics.js';

const INITIAL_FETCH = 5;
const INITIAL_DISPLAY = 4;
const LOAD_MORE_BATCH = 8;

const cardStyle = {
  background: 'rgba(5, 60, 82, 0.45)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(58, 171, 219, 0.2)',
  borderRadius: '14px',
  overflow: 'hidden',
};

const cardBodyStyle = {
  padding: '0.6rem 0.75rem 0.65rem',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: '0.3rem',
};

const cardTitleStyle = {
  color: 'rgba(255,255,255,0.92)',
  fontWeight: '600',
  fontSize: '0.82rem',
  margin: 0,
  lineHeight: '1.4',
};

const cardTextStyle = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '0.73rem',
  lineHeight: '1.55',
  margin: 0,
  flex: 1,
};

const cardMetaStyle = {
  fontSize: '0.66rem',
  color: 'rgba(58,171,219,0.55)',
  fontWeight: '500',
  borderTop: '1px solid rgba(58,171,219,0.1)',
  paddingTop: '0.45rem',
  marginTop: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const PostCard = ({ update, onOpen, onDelete, onEdit, canManage, t }) => {
  const [imgLoaded, setImgLoaded] = useState(!update.media_url);
  const src = update.media_url
    ? (update.media_url.startsWith('http') ? update.media_url : `${SERVER_BASE_URL}${update.media_url}`)
    : null;

  return (
    <div style={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }} onClick={onOpen}>
      {canManage && (
        <div
          className="d-flex gap-2"
          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn"
            style={{ background: 'rgba(5,30,45,0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(58,171,219,0.3)', borderRadius: '9px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3aabdb', padding: 0 }}
            onClick={onEdit}
            title={t('edit')}
          >
            <Pencil size={14} />
          </button>
          <button
            className="btn"
            style={{ background: 'rgba(5,30,45,0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(220,53,69,0.35)', borderRadius: '9px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7b7b', padding: 0 }}
            onClick={onDelete}
            title={t('delete')}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {src && (
        <div style={{ position: 'relative', flexShrink: 0, overflow: 'hidden', borderRadius: '14px 14px 0 0' }}>
          {!imgLoaded && (
            <div className="sk" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          )}
          {update.media_type === 'image' ? (
            <img
              src={src}
              alt={update.title}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
            />
          ) : (
            <video
              src={src}
              style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
              onLoadedData={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(5,30,45,0.8) 0%, rgba(5,30,45,0.05) 60%, transparent 100%)', pointerEvents: 'none' }} />
        </div>
      )}
      <div style={cardBodyStyle}>
        <h6 style={cardTitleStyle}>{update.title}</h6>
        <p style={cardTextStyle}>
          {update.content.length > 110 ? update.content.substring(0, 110) + '…' : update.content}
        </p>
        <div style={cardMetaStyle}>
          <span>{new Date(update.date).toLocaleDateString()}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(58,171,219,0.5)', flexShrink: 0 }} />
          <span style={{ color: 'rgba(58,171,219,0.65)' }}>{update.author}</span>
        </div>
      </div>
    </div>
  );
};

PostCard.propTypes = {
  update: PropTypes.shape({
    media_url: PropTypes.string,
    media_type: PropTypes.string,
    title: PropTypes.string,
    content: PropTypes.string,
    date: PropTypes.string,
    author: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  canManage: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
};

export const PostsManager = () => {
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

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formCardRef = useRef(null);

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
      const response = await postsService.getAll(INITIAL_FETCH);
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
        const response = await postsService.getAll(needed, updates.length);
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

      const response = await postsService.create(formDataToSend);
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
    if (!file) return;
    if (mediaPreview?.url?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview.url);
    if (editingId) {
      setEditMediaFile(file);
    } else {
      setMediaFile(file);
    }
    setMediaPreview({ url: URL.createObjectURL(file), type: file.type.startsWith('image/') ? 'image' : 'video' });
  };

  const handleRemoveMedia = () => {
    if (mediaPreview?.url?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
    if (editingId) {
      setEditMediaFile(null);
    } else {
      setMediaFile(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      handleEditSave(editingId);
    } else {
      setSuccess(null);
      handleFormSubmit(e);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await postsService.delete(id);
      const remaining = updates.filter(u => u.id !== id);
      setUpdates(remaining);
      setTotalUpdates(prev => prev - 1);
      setDisplayCount(prev => Math.min(prev, remaining.length));
      hapticMedium();
      setSuccess(t('updateDeleted'));
      setDeleteConfirmId(null);
    } catch (error) {
      hapticWarning();
      console.error('Error deleting update:', error);
      alert(t('error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditStart = (updateId) => {
    const original = updates.find(u => u.id === updateId);
    if (!original) return;
    setEditingId(updateId);
    setEditForm({ title: original.title, content: original.content });
    setEditMediaFile(null);
    setMediaFile(null);
    if (original.media_url) {
      const src = original.media_url.startsWith('http')
        ? original.media_url
        : `${SERVER_BASE_URL}${original.media_url}`;
      setMediaPreview({ url: src, type: original.media_type || 'image' });
    } else {
      setMediaPreview(null);
    }
    setShowForm(true);
    setTimeout(() => formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ title: '', content: '' });
    setEditMediaFile(null);
    if (mediaPreview?.url?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
  };

  const handleEditSave = async (updateId) => {
    if (!editForm.title || !editForm.content) return;
    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', editForm.title);
      formData.append('content', editForm.content);
      if (editMediaFile) formData.append('media', editMediaFile);
      const response = await postsService.update(updateId, formData);
      setUpdates(prev => prev.map(u => u.id === updateId ? response.data : u));
      hapticSuccess();
      setSuccess(t('updateEdited'));
      setEditingId(null);
      setEditForm({ title: '', content: '' });
      setEditMediaFile(null);
      if (mediaPreview?.url?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview.url);
      setMediaPreview(null);
    } catch (error) {
      hapticWarning();
      console.error('Error editing update:', error);
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.background = '#000000';
  }, []);

  return (
    <div className="update-poster">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="post-update-card" style={{ overflow: 'hidden' }} ref={formCardRef}>

              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.85rem 1.15rem',
                borderBottom: '1px solid rgba(70,161,161,0.15)',
                background: 'rgba(3, 25, 38, 0.45)',
              }}>
                <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                  <FileText size={16} />
                  {t('recentUpdates')}{totalUpdates > 0 && ` (${totalUpdates})`}
                </h5>
                <button
                  onClick={() => {
                    if (showForm) {
                      if (editingId) handleEditCancel(); else setShowForm(false);
                    } else {
                      setShowForm(true);
                    }
                    setSuccess(null);
                    setFormError('');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: showForm ? 'rgba(255,255,255,0.06)' : 'rgba(58,171,219,0.15)',
                    color: showForm ? 'rgba(255,255,255,0.6)' : '#3aabdb',
                    border: `1px solid ${showForm ? 'rgba(255,255,255,0.15)' : 'rgba(58,171,219,0.35)'}`,
                    borderRadius: '8px', padding: '0.28rem 0.7rem',
                    fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {showForm ? <X size={13} /> : <><PenLine size={13} /> {t('postUpdate')}</>}
                </button>
              </div>

              {/* Alerts */}
              <AnimatePresence>
                {(success || formError) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0.75rem 1.15rem 0' }}>
                      {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}
                      {formError && <Alert message={formError} type="danger" onClose={() => setFormError('')} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline Create/Edit Form */}
              <AnimatePresence initial={false}>
                {showForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '1.15rem', borderBottom: '1px solid rgba(70,161,161,0.12)' }}>
                      <h6 style={{ margin: '0 0 0.85rem', color: '#3aabdb', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {editingId ? <><Pencil size={13} /> {t('editPost')}</> : <><PenLine size={13} /> {t('postUpdate')}</>}
                      </h6>
                      <form onSubmit={handleSubmit} noValidate>
                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <FormInput
                              label={t('title')}
                              name="title"
                              type="text"
                              value={editingId ? editForm.title : formData.title}
                              onChange={editingId ? (e) => setEditForm(p => ({ ...p, title: e.target.value })) : handleChange}
                              required
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="mb-3">
                              <label htmlFor="media" className="form-label">{t('photoOrVideo')}</label>
                              <div className="d-flex align-items-center gap-2">
                                <label
                                  htmlFor="media"
                                  className="btn mb-0"
                                  style={{
                                    cursor: 'pointer', fontSize: '0.78rem', padding: '0.28rem 0.75rem',
                                    background: 'rgba(70,161,161,0.12)', color: '#3aabdb',
                                    border: '1.5px solid rgba(70,161,161,0.4)', borderRadius: '0.5rem',
                                    fontWeight: '500',
                                  }}
                                >
                                  {t('chooseFile')}
                                </label>
                                <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)' }}>
                                  {(editingId ? editMediaFile : mediaFile)?.name ?? t('noFileChosen')}
                                </span>
                              </div>
                              <input type="file" id="media" className="d-none" accept="image/*,video/*" onChange={handleMediaChange} />
                              <small style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{t('mediaInfo')}</small>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label htmlFor="content" className="form-label">{t('content')}</label>
                          <textarea
                            id="content"
                            name="content"
                            className="form-control"
                            rows="4"
                            value={editingId ? editForm.content : formData.content}
                            onChange={editingId ? (e) => setEditForm(p => ({ ...p, content: e.target.value })) : handleChange}
                            placeholder={t('contentPlaceholder')}
                            required
                          />
                        </div>

                        {/* Media Preview */}
                        {mediaPreview && (
                          <div className="mb-3">
                            <div className="position-relative" style={{ display: 'inline-block' }}>
                              {mediaPreview.type === 'image' ? (
                                <img src={mediaPreview.url} alt="Preview" className="rounded" style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'cover', display: 'block' }} />
                              ) : (
                                <video src={mediaPreview.url} className="rounded" style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'cover' }} controls />
                              )}
                              <button type="button" className="btn btn-sm position-absolute top-0 end-0 m-1" onClick={handleRemoveMedia} style={{ background: 'rgba(220,53,69,0.85)', color: '#fff', borderRadius: '6px', fontSize: '0.7rem', padding: '0.15rem 0.45rem', border: 'none' }}>
                                {t('removeMedia')}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn" disabled={editingId ? editLoading : false} style={{ background: 'rgba(58,171,219,0.15)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.35)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '600' }}>
                            {editingId ? (editLoading ? '...' : t('save')) : t('post')}
                          </button>
                          {editingId && (
                            <button type="button" className="btn" onClick={handleEditCancel} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: '500' }}>
                              {t('cancel')}
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Posts Grid */}
              <div style={{ padding: '1rem 1.15rem 1.15rem' }}>
                {loading ? (
                  <div className="row g-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="col-6 col-md-3">
                        <div className="sk-card p-3 h-100" style={{ animationDelay: `${i * 0.14}s` }}>
                          <span className="sk mb-2" style={{ height: '80px', width: '100%', borderRadius: '8px', animationDelay: `${i * 0.14}s` }} />
                          <span className="sk mb-2" style={{ height: '12px', width: '70%', animationDelay: `${i * 0.14}s` }} />
                          <span className="sk" style={{ height: '10px', width: '50%', animationDelay: `${i * 0.14}s` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : translatedUpdates.length === 0 ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                    <FileText size={32} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: '0.5rem' }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>{t('noUpdates')}</p>
                  </div>
                ) : (
                  <>
                    <div className="row g-3">
                      {translatedUpdates.slice(0, displayCount).map(update => {
                        const isAdmin = currentUser?.email === import.meta.env.VITE_SEED_EMPLOYEE_EMAIL;
                        const isOwner = currentUser?.id === update.user_id;
                        const canManage = isAdmin || isOwner;

                        return (
                          <div key={update.id} className="col-6 col-md-4 col-lg-3" style={editingId === update.id ? { outline: '1.5px solid rgba(58,171,219,0.45)', borderRadius: '14px' } : {}}>
                            <PostCard
                              update={update}
                              onOpen={() => handleUpdateClick(update)}
                              onDelete={() => setDeleteConfirmId(update.id)}
                              onEdit={() => handleEditStart(update.id)}
                              canManage={canManage}
                              t={t}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {loadingMore && (
                      <div className="row g-3 mt-1">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="col-6 col-md-4 col-lg-3">
                            <div className="sk-card p-3" style={{ animationDelay: `${i * 0.12}s` }}>
                              <span className="sk mb-2" style={{ height: '80px', width: '100%', borderRadius: '8px', animationDelay: `${i * 0.12}s` }} />
                              <span className="sk mb-2" style={{ height: '12px', width: '70%', animationDelay: `${i * 0.12}s` }} />
                              <span className="sk" style={{ height: '10px', width: '50%', animationDelay: `${i * 0.12}s` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Load More / Hide Posts */}
                    {(displayCount < totalUpdates || displayCount > INITIAL_DISPLAY) && (
                      <div className="d-flex justify-content-center gap-2 mt-3">
                        {displayCount < totalUpdates && (
                          <button className="btn" onClick={handleLoadMore} disabled={loadingMore} style={{ background: 'rgba(58,171,219,0.1)', color: '#3aabdb', border: '1px solid rgba(58,171,219,0.25)', borderRadius: '8px', padding: '0.28rem 0.85rem', fontSize: '0.75rem', fontWeight: 600 }}>
                            {loadingMore ? t('loading') : t('loadMorePosts')}
                          </button>
                        )}
                        {displayCount > INITIAL_DISPLAY && (
                          <button className="btn" onClick={handleHidePosts} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.28rem 0.85rem', fontSize: '0.75rem', fontWeight: 500 }}>
                            {t('hidePosts')}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

    {/* Delete Confirmation Modal */}
    <AnimatePresence>
      {deleteConfirmId !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
          onClick={() => !deleteLoading && setDeleteConfirmId(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ background: 'rgba(5, 40, 60, 0.95)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '16px', padding: '1.5rem', maxWidth: '360px', width: '100%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(220,53,69,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertTriangle size={22} style={{ color: '#ff7b7b' }} />
            </div>
            <h6 style={{ color: '#fff', fontWeight: '700', fontSize: '1rem', marginBottom: '0.5rem' }}>{t('deletePost') || 'Delete Post?'}</h6>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              {t('deletePostConfirmation') || 'This action cannot be undone. Are you sure you want to delete this post?'}
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.4rem 1.2rem', fontWeight: '600', fontSize: '0.85rem' }}
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
              >
                {t('cancel')}
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(220,53,69,0.8)', color: '#fff', border: '1px solid rgba(220,53,69,0.6)', borderRadius: '8px', padding: '0.4rem 1.2rem', fontWeight: '600', fontSize: '0.85rem' }}
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteLoading}
              >
                {deleteLoading ? '...' : t('delete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Update Modal */}
    <PostModal
      updates={translatedUpdates}
      initialIndex={selectedUpdateIndex}
      show={showModal}
      onClose={handleCloseModal}
    />
  </div>
  );
};
