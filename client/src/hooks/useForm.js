import { useState, useCallback } from 'react';

export const useForm = (initialValues, onSubmit) => {
  const [formData, setFormData] = useState(initialValues);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err?.message || '');
    } finally {
      setIsLoading(false);
    }
  }, [formData, onSubmit]);

  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setError('');
    setSuccess('');
  }, [initialValues]);

  return { formData, setFormData, handleChange, handleSubmit, resetForm, isLoading, error, setError, success, setSuccess };
};
