import PropTypes from 'prop-types';

/**
 * Loading Spinner Component
 */
export const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

/**
 * Alert Component
 */
export const Alert = ({ message, type = 'danger', onClose }) => (
  <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
    {message}
    <button 
      type="button" 
      className="btn-close" 
      onClick={onClose}
      aria-label="Close"
    />
  </div>
);

Alert.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

/**
 * Form Input Component
 */
export const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false,
  error = null,
  autocomplete,
  min,
  max,
  placeholder,
  ...rest
}) => (
  <div className="mb-3">
    <label htmlFor={name} className="form-label">{label}</label>
    <input
      type={type}
      className={`form-control ${error ? 'is-invalid' : ''}`}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      autoComplete={autocomplete}
      min={min}
      max={max}
      placeholder={placeholder}
      aria-describedby={error ? `${name}-error` : undefined}
      {...rest}
    />
    {error && <div id={`${name}-error`} className="invalid-feedback">{error}</div>}
  </div>
);

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  autocomplete: PropTypes.string,
  min: PropTypes.string,
  max: PropTypes.string,
  placeholder: PropTypes.string
};

/**
 * Loading State Component
 */
export const LoadingState = ({ message = 'Loading...' }) => (
  <div className="text-center py-5">
    <div className="spinner-border mb-3" role="status">
      <span className="visually-hidden">{message}</span>
    </div>
    <p>{message}</p>
  </div>
);

LoadingState.propTypes = {
  message: PropTypes.string
};
