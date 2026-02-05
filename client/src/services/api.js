/**
 * API Service Module
 * Centralized API client configuration and service endpoints
 * Handles authentication, error responses, and HTTP requests
 */

import axios from 'axios';
import { getToken, removeToken } from '../utils/tokenUtils.js';

// Constants
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SERVER_BASE_URL = API_BASE_URL.replace('/api', ''); // For media URLs
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const PROTECTED_ROUTE_PREFIX = '/dashboard';
const LOGIN_REDIRECT_PATH = '/employee-login';

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error adding auth token to request:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle authentication errors globally
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      if (error?.response?.status === 401) {
        const currentPath = window?.location?.pathname;
        // Only clear token and redirect if on protected routes
        if (currentPath && currentPath.startsWith(PROTECTED_ROUTE_PREFIX)) {
          removeToken();
          window.location.href = LOGIN_REDIRECT_PATH;
        }
      }
    } catch (interceptorError) {
      console.error('Response interceptor error:', interceptorError);
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication service endpoints
 */
export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} API response
   */
  register: (userData) => {
    if (!userData) {
      return Promise.reject(new Error('User data is required'));
    }
    return apiClient.post('/auth/register', userData);
  },

  /**
   * Login user
   * @param {Object} credentials - User credentials (email, password)
   * @returns {Promise} API response with token
   */
  login: (credentials) => {
    if (!credentials?.email || !credentials?.password) {
      return Promise.reject(new Error('Email and password are required'));
    }
    return apiClient.post('/auth/login', credentials);
  },

  /**
   * Employee login
   * @param {Object} credentials - Employee credentials (email, password)
   * @returns {Promise} API response with token
   */
  employeeLogin: (credentials) => {
    if (!credentials?.email || !credentials?.password) {
      return Promise.reject(new Error('Email and password are required'));
    }
    return apiClient.post('/auth/employee-login', credentials);
  },

  /**
   * Verify current token
   * @returns {Promise} API response
   */
  verify: () => apiClient.get('/auth/verify'),

  /**
   * Get current user data
   * @returns {Promise} API response with user data
   */
  getMe: () => apiClient.get('/auth/me'),

  /**
   * Create employee account (Admin only)
   * @param {Object} employeeData - Employee data (name, email, password)
   * @returns {Promise} API response
   */
  createEmployee: (employeeData) => {
    if (!employeeData?.name || !employeeData?.email || !employeeData?.password) {
      return Promise.reject(new Error('Name, email, and password are required'));
    }
    return apiClient.post('/auth/create-employee', employeeData);
  },
};

/**
 * Data service endpoints
 */
export const dataService = {
  /**
   * Get all data
   * @returns {Promise} API response with all data
   */
  getAll: () => apiClient.get('/data'),

  /**
   * Get data by ID
   * @param {string} id - Data ID
   * @returns {Promise} API response with data
   */
  getById: (id) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.get(`/data/${id}`);
  },

  /**
   * Get all employees
   * @returns {Promise} API response with employees list
   */
  getEmployees: () => apiClient.get('/data/employees'),
};

/**
 * Update/announcement service endpoints
 */
export const updateService = {
  /**
   * Get all updates with optional pagination
   * @param {number} limit - Maximum number of results
   * @param {number} offset - Number of results to skip
   * @returns {Promise} API response with updates
   */
  getAll: (limit, offset) => {
    const params = {};
    if (limit && typeof limit === 'number') params.limit = limit;
    if (offset && typeof offset === 'number') params.offset = offset;
    return apiClient.get('/updates', { params });
  },

  /**
   * Create a new update
   * @param {Object|FormData} updateData - Update data (supports multipart for images)
   * @returns {Promise} API response
   */
  create: (updateData) => {
    if (!updateData) {
      return Promise.reject(new Error('Update data is required'));
    }
    // If updateData is FormData, let browser set Content-Type with boundary
    const config = updateData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return apiClient.post('/updates', updateData, config);
  },

  /**
   * Delete an update
   * @param {string} id - Update ID
   * @returns {Promise} API response
   */
  delete: (id) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.delete(`/updates/${id}`);
  },
};

/**
 * Service (haircut/grooming services) endpoints
 */
export const serviceService = {
  /**
   * Get all services
   * @returns {Promise} API response with services list
   */
  getAll: () => apiClient.get('/services'),

  /**
   * Create a new service
   * @param {Object} serviceData - Service data
   * @returns {Promise} API response
   */
  create: (serviceData) => {
    if (!serviceData) {
      return Promise.reject(new Error('Service data is required'));
    }
    return apiClient.post('/services', serviceData);
  },

  /**
   * Update a service
   * @param {string} id - Service ID
   * @param {Object} serviceData - Updated service data
   * @returns {Promise} API response
   */
  update: (id, serviceData) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    if (!serviceData) {
      return Promise.reject(new Error('Service data is required'));
    }
    return apiClient.put(`/services/${id}`, serviceData);
  },

  /**
   * Delete a service
   * @param {string} id - Service ID
   * @returns {Promise} API response
   */
  delete: (id) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.delete(`/services/${id}`);
  },
};

/**
 * Availability service endpoints
 */
export const availabilityService = {
  /**
   * Get all availability slots
   * @returns {Promise} API response with availability data
   */
  getAll: () => apiClient.get('/availability'),

  /**
   * Get availability by day of week
   * @param {number} dayOfWeek - Day of week (0-6, Sunday-Saturday)
   * @returns {Promise} API response with availability for that day
   */
  getByDayOfWeek: (dayOfWeek) => {
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return Promise.reject(new Error('Invalid day of week (must be 0-6)'));
    }
    return apiClient.get(`/availability/day/${dayOfWeek}`);
  },

  /**
   * Get available appointment times for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} employeeId - Optional employee ID filter
   * @returns {Promise} API response with available times
   */
  getAvailableTimes: (date, employeeId) => {
    if (!date) {
      return Promise.reject(new Error('Date is required'));
    }
    const params = employeeId ? { employeeId } : {};
    return apiClient.get(`/availability/available-times/${date}`, { params });
  },

  /**
   * Create a new availability slot
   * @param {Object} availabilityData - Availability data
   * @returns {Promise} API response
   */
  create: (availabilityData) => {
    if (!availabilityData) {
      return Promise.reject(new Error('Availability data is required'));
    }
    return apiClient.post('/availability', availabilityData);
  },

  /**
   * Update an availability slot
   * @param {string} id - Availability ID
   * @param {Object} availabilityData - Updated availability data
   * @returns {Promise} API response
   */
  update: (id, availabilityData) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    if (!availabilityData) {
      return Promise.reject(new Error('Availability data is required'));
    }
    return apiClient.put(`/availability/${id}`, availabilityData);
  },

  /**
   * Delete an availability slot
   * @param {string} id - Availability ID
   * @returns {Promise} API response
   */
  delete: (id) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.delete(`/availability/${id}`);
  },
};

/**
 * Appointment service endpoints
 */
export const appointmentService = {
  /**
   * Get all appointments with optional filters
   * @param {Object} params - Query parameters (status, date, etc.)
   * @returns {Promise} API response with appointments
   */
  getAll: (params = {}) => apiClient.get('/appointments', { params }),

  /**
   * Create a new appointment request
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise} API response
   */
  create: (appointmentData) => {
    if (!appointmentData) {
      return Promise.reject(new Error('Appointment data is required'));
    }
    return apiClient.post('/appointments', appointmentData);
  },

  /**
   * Accept an appointment
   * @param {string} id - Appointment ID
   * @param {string} note - Optional employee note
   * @returns {Promise} API response
   */
  accept: (id, note) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.put(`/appointments/${id}/accept`, { employeeNote: note || '' });
  },

  /**
   * Decline an appointment
   * @param {string} id - Appointment ID
   * @param {string} note - Optional employee note explaining decline
   * @returns {Promise} API response
   */
  decline: (id, note) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.put(`/appointments/${id}/decline`, { employeeNote: note || '' });
  },

  /**
   * Cancel an appointment (customer-initiated)
   * @param {string} id - Appointment ID
   * @returns {Promise} API response
   */
  cancel: (id) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.put(`/appointments/${id}/cancel`);
  },

  /**
   * Cancel an appointment (employee-initiated)
   * @param {string} id - Appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} API response
   */
  cancelByEmployee: (id, reason) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.put(`/appointments/${id}/cancel-by-employee`, { reason: reason || '' });
  },
};

/**
 * Blocked dates service endpoints
 */
export const blockedDateService = {
  /**
   * Get all blocked dates
   * @returns {Promise} API response with blocked dates
   */
  getAll: () => apiClient.get('/blocked-dates'),

  /**
   * Create blocked date range
   * @param {Object} blockedDateData - Blocked date data (startDate, endDate, times, reason)
   * @returns {Promise} API response
   */
  create: (blockedDateData) => {
    if (!blockedDateData) {
      return Promise.reject(new Error('Blocked date data is required'));
    }
    return apiClient.post('/blocked-dates', blockedDateData);
  },

  /**
   * Update a blocked date
   * @param {string} id - Blocked date ID
   * @param {Object} blockedDateData - Updated blocked date data
   * @returns {Promise} API response
   */
  update: (id, blockedDateData) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    if (!blockedDateData) {
      return Promise.reject(new Error('Blocked date data is required'));
    }
    return apiClient.put(`/blocked-dates/${id}`, blockedDateData);
  },

  /**
   * Delete a blocked date
   * @param {string} id - Blocked date ID
   * @returns {Promise} API response
   */
  delete: (id) => {
    if (!id) {
      return Promise.reject(new Error('ID is required'));
    }
    return apiClient.delete(`/blocked-dates/${id}`);
  },
};

export default apiClient;
export { SERVER_BASE_URL };