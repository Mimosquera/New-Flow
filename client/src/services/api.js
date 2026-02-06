import axios from 'axios';
import { getToken, removeToken } from '../utils/tokenUtils.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SERVER_BASE_URL = API_BASE_URL.replace('/api', '');
const DEFAULT_TIMEOUT = 30000;
const PROTECTED_ROUTE_PREFIX = '/dashboard';
const LOGIN_REDIRECT_PATH = '/employee-login';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const currentPath = window?.location?.pathname;
      if (currentPath && currentPath.startsWith(PROTECTED_ROUTE_PREFIX)) {
        removeToken();
        window.location.href = LOGIN_REDIRECT_PATH;
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (userData) => apiClient.post('/auth/register', userData),
  
  login: (credentials) => apiClient.post('/auth/login', credentials),
  
  employeeLogin: (credentials) => apiClient.post('/auth/employee-login', credentials),
  
  verify: () => apiClient.get('/auth/verify'),
  
  getMe: () => apiClient.get('/auth/me'),

  createEmployee: (employeeData) => apiClient.post('/auth/create-employee', employeeData),

  getEmployees: () => apiClient.get('/auth/employees'),

  updateEmployeePassword: (data) => apiClient.put('/auth/update-employee-password', data),

  deleteEmployee: (employeeId, adminPassword) => {
    return apiClient.delete(`/auth/employee/${employeeId}`, {
      data: { adminPassword }
    });
  },
};

export const dataService = {
  getAll: () => apiClient.get('/data'),
  getById: (id) => apiClient.get(`/data/${id}`),
  getEmployees: () => apiClient.get('/data/employees'),
};

export const updateService = {
  getAll: (limit, offset) => {
    const params = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    return apiClient.get('/updates', { params });
  },

  create: (updateData) => {
    const config = updateData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return apiClient.post('/updates', updateData, config);
  },

  delete: (id) => apiClient.delete(`/updates/${id}`),
};

export const serviceService = {
  getAll: () => apiClient.get('/services'),
  create: (serviceData) => apiClient.post('/services', serviceData),
  update: (id, serviceData) => apiClient.put(`/services/${id}`, serviceData),
  delete: (id) => apiClient.delete(`/services/${id}`),
};

export const availabilityService = {
  getAll: () => apiClient.get('/availability'),

  getByDayOfWeek: (dayOfWeek) => apiClient.get(`/availability/day/${dayOfWeek}`),

  getAvailableTimes: (date, employeeId) => {
    const params = employeeId ? { employeeId } : {};
    return apiClient.get(`/availability/available-times/${date}`, { params });
  },

  create: (availabilityData) => apiClient.post('/availability', availabilityData),

  update: (id, availabilityData) => apiClient.put(`/availability/${id}`, availabilityData),

  delete: (id) => apiClient.delete(`/availability/${id}`),
};

export const appointmentService = {
  getAll: (params = {}) => apiClient.get('/appointments', { params }),

  create: (appointmentData) => apiClient.post('/appointments', appointmentData),

  accept: (id, note) => apiClient.put(`/appointments/${id}/accept`, { employeeNote: note || '' }),

  decline: (id, note) => apiClient.put(`/appointments/${id}/decline`, { employeeNote: note || '' }),

  cancel: (id) => apiClient.put(`/appointments/${id}/cancel`),

  cancelByEmployee: (id, reason) => {
    return apiClient.put(`/appointments/${id}/cancel-by-employee`, { reason: reason || '' });
  },
};

export const blockedDateService = {
  getAll: () => apiClient.get('/blocked-dates'),
  create: (blockedDateData) => apiClient.post('/blocked-dates', blockedDateData),
  update: (id, blockedDateData) => apiClient.put(`/blocked-dates/${id}`, blockedDateData),
  delete: (id) => apiClient.delete(`/blocked-dates/${id}`),
};

export default apiClient;
export { SERVER_BASE_URL };