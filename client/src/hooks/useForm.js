/**
 * useForm Hook Module
 * Custom React hook for managing form state, validation, and submission
 * 
 * Features:
 * - Automatic state management for form inputs
 * - Loading state during async submissions
 * - Error and success message handling
 * - Form reset capability
 * - Automatic error clearing on user input
 */

import { useState, useCallback } from 'react';

// Constants
const DEFAULT_ERROR_MESSAGE = 'Something went wrong';
const DEFAULT_SUCCESS_MESSAGE = 'Success!';

/**
 * Custom hook for managing form state and submission
 * @param {Object} initialValues - Initial form field values
 * @param {Function} onSubmit - Async callback function when form is submitted
 * @returns {Object} Form state and handler functions
 * @property {Object} formData - Current form data values
 * @property {Function} setFormData - Direct form data setter
 * @property {Function} handleChange - Input change handler
 * @property {Function} handleSubmit - Form submit handler
 * @property {Function} resetForm - Reset form to initial values
 * @property {boolean} isLoading - Loading state during submission
 * @property {string} error - Error message (empty if no error)
 * @property {Function} setError - Manual error setter
 * @property {string} success - Success message (empty if no success)
 * @property {Function} setSuccess - Manual success setter
 */
export const useForm = (initialValues, onSubmit) => {
  // Validate inputs
  if (!initialValues || typeof initialValues !== 'object') {
    console.error('useForm: initialValues must be a valid object');
  }

  if (typeof onSubmit !== 'function') {
    console.error('useForm: onSubmit must be a function');
  }

  // State management
  const [formData, setFormData] = useState(initialValues || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Handle input field changes
   * @param {Event} e - Input change event
   */
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

      // Clear errors when user starts typing
      if (error) {
        setError('');
      }
    } catch (err) {
      console.error('Error handling form change:', err);
    }
  }, [error]);

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
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

  /**
   * Reset form to initial values and clear messages
   */
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
