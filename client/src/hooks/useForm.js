import { useState, useCallback } from 'react';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong';
const DEFAULT_SUCCESS_MESSAGE = 'Success!';

export const useForm = (initialValues, onSubmit) => {
  if (!initialValues || typeof initialValues !== 'object') {
    console.error('useForm: initialValues must be a valid object');
  }

  if (typeof onSubmit !== 'function') {
    console.error('useForm: onSubmit must be a function');
  }

  const [formData, setFormData] = useState(initialValues || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = useCallback((e) => {
    try {
      if (!e || !e.target) {
        console.error('Invalid event object in handleChange');
        return;
      }

      const { name, value } = e.target;

      if (!name) {
        console.error('Input field must have a name attribute');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));

      if (error) {
        setError('');
      }
    } catch (err) {
      console.error('Error handling form change:', err);
    }
  }, [error]);

  const handleSubmit = useCallback(async (e) => {
    try {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      if (typeof onSubmit !== 'function') {
        console.error('onSubmit must be a function');
        setError('Form submission error');
        return;
      }

      setIsLoading(true);
      setError('');
      setSuccess('');

      await onSubmit(formData);

      setSuccess(DEFAULT_SUCCESS_MESSAGE);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err?.message || DEFAULT_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, [formData, onSubmit]);

  const resetForm = useCallback(() => {
    try {
      setFormData(initialValues || {});
      setError('');
      setSuccess('');
    } catch (err) {
      console.error('Error resetting form:', err);
    }
  }, [initialValues]);

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    resetForm,
    isLoading,
    error,
    setError,
    success,
    setSuccess
  };
};
