import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentService } from '../services/api';
import apiClient from '../services/api';
import { useTranslation } from '../hooks/useTranslation.js';

/**
 * Public page for customers to cancel their appointments
 * Accessible via link in email/SMS notifications
 */
export function CancelAppointmentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [fetchingAppointment, setFetchingAppointment] = useState(true);

  // Fetch appointment details on mount
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await apiClient.get(`/appointments/public/${id}`);
        setAppointment(response.data.data);
      } catch (err) {
        console.error('Error fetching appointment:', err);
        if (err.response?.status === 404) {
          setError('Appointment not found');
        } else {
          setError('Failed to load appointment');
        }
      } finally {
        setFetchingAppointment(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const handleCancel = async () => {
    setLoading(true);
    setError('');

    try {
      await appointmentService.cancel(id);
      setSuccess(true);
      setShowConfirm(false);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      if (err.response?.status === 404) {
        setError(t('appointmentNotFoundMayBeCancelled'));
      } else if (err.response?.status === 400) {
        setError(t('appointmentAlreadyCancelled'));
      } else {
        setError(t('failedToCancelAppointment'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#212529',
      padding: '1rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.25)',
      }}>
        {fetchingAppointment ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#666' }}>{t('loadingAppointmentDetails')}</p>
          </div>
        ) : showConfirm && !success && (
          <>
            <h1 style={{
              fontSize: '1.75rem',
              marginBottom: '1rem',
              color: '#333',
              textAlign: 'center',
            }}>
              {appointment?.status === 'pending' ? t('cancelAppointmentRequest') : t('cancelAppointmentTitle')}
            </h1>
            {appointment && (
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, color: '#333', fontWeight: '500' }}>
                  {appointment.service?.name}
                </p>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {appointment.time}
                </p>
                {appointment.status === 'accepted' && appointment.acceptedBy && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {t('confirmedWith')}: {appointment.acceptedBy.name}
                  </p>
                )}
              </div>
            )}
            <p style={{
              color: '#666',
              marginBottom: '2rem',
              textAlign: 'center',
              lineHeight: '1.6',
            }}>
              {appointment?.status === 'pending' 
                ? t('confirmCancelRequest')
                : t('confirmCancelAppointment')}
            </p>

            {error && (
              <div style={{
                backgroundColor: '#fee',
                color: '#c33',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid #fcc',
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.5rem',
            }}>
              <button
                onClick={handleGoHome}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgb(5, 45, 63)',
                  background: 'white',
                  color: 'rgb(5, 45, 63)',
                  fontSize: '1rem',
                  fontWeight: '300',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.background = '#f0f0f0';
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white';
                }}
              >
                {t('keepAppointment')}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: loading ? '#ccc' : '#dc3545',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '300',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.background = '#c82333';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.background = '#dc3545';
                  }
                }}
              >
                {loading ? t('cancelling') : t('yesCancel')}
              </button>
            </div>
          </>
        )}

        {success && (
          <>
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 1rem',
                borderRadius: '50%',
                background: '#d4edda',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
              }}>
                ✓
              </div>
              <h1 style={{
                fontSize: '1.75rem',
                marginBottom: '1rem',
                color: '#333',
              }}>
                {appointment?.status === 'pending' ? t('requestCancelled') : t('appointmentCancelled')}
              </h1>
              <p style={{
                color: '#666',
                lineHeight: '1.6',
              }}>
                {appointment?.status === 'pending'
                  ? t('requestCancelledMessage')
                  : t('appointmentCancelledMessage')}
              </p>
            </div>

            <button
              onClick={handleGoHome}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'rgb(5, 45, 63)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '300',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgb(4, 36, 50)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgb(5, 45, 63)';
              }}
            >
              ⌂ {t('backToHome')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
