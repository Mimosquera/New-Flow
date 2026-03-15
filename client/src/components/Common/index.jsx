import PropTypes from 'prop-types';

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

