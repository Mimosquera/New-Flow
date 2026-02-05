import { useState } from 'react';
import { Alert } from './Common/index.jsx';
import { authService } from '../services/api.js';
import { useTranslation } from '../hooks/useTranslation.js';

/**
 * Employee Manager Component (Admin Only)
 * Allows admins to create new employee accounts
 */
export const EmployeeManager = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError(t?.('pleaseFillRequired') || 'Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError(t?.('passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.createEmployee({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      setSuccess(
        `${t?.('employeeCreated') || 'Employee account created successfully!'} ${formData.name} (${formData.email})`
      );
      
      // Clear form
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t?.('errorCreatingEmployee') || 'Error creating employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4">
                {t?.('createEmployee') || 'Create Employee Account'}
              </h3>
              
              <p className="text-muted mb-4">
                {t?.('createEmployeeDescription') || 'Add new employees who can manage appointments, post updates, create services, and set availability.'}
              </p>

              {error && <Alert type="danger" message={error} />}
              {success && <Alert type="success" message={success} />}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    {t?.('name') || 'Name'} *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t?.('employeeName') || 'Employee Name'}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    {t?.('email') || 'Email'} *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="employee@example.com"
                    required
                  />
                  <small className="text-muted">
                    {t?.('employeeEmailNote') || 'This will be used to log in to the dashboard'}
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    {t?.('password') || 'Password'} *
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t?.('passwordPlaceholder') || 'Minimum 6 characters'}
                    minLength={6}
                    required
                  />
                  <small className="text-muted">
                    {t?.('employeePasswordNote') || 'Employee can change this after first login'}
                  </small>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      backgroundColor: 'rgb(5, 45, 63)',
                      border: 'none'
                    }}
                  >
                    {loading 
                      ? (t?.('creating') || 'Creating...') 
                      : (t?.('createEmployee') || 'Create Employee Account')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="alert alert-info mt-4">
            <strong>{t?.('note') || 'Note'}:</strong> {t?.('employeeAccountNote') || 'New employees will be able to log in immediately using their email and password. They will have access to manage appointments, create posts, add services, and set their availability.'}
          </div>
        </div>
      </div>
    </div>
  );
};
