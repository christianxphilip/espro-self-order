import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

// Tables API
export const tablesAPI = {
  getAll: () => api.get('/tables'),
  getById: (id) => api.get(`/tables/${id}`),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  delete: (id) => api.delete(`/tables/${id}`),
  getByQR: (qrCode) => api.get(`/tables/qr/${qrCode}`),
};

// Menu API
export const menuAPI = {
  getAll: () => api.get('/menu'),
  getByCategory: () => api.get('/menu/categories'),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
};

// Billing Groups API
export const billingGroupsAPI = {
  getAll: () => api.get('/billing-groups'),
  getById: (id) => api.get(`/billing-groups/${id}`),
  create: (data) => api.post('/billing-groups', data),
  update: (id, data) => api.put(`/billing-groups/${id}`, data),
  activate: (id) => api.put(`/billing-groups/${id}/activate`),
  deactivate: (id) => api.put(`/billing-groups/${id}/deactivate`),
  close: (id) => api.put(`/billing-groups/${id}/close`),
  getCurrent: () => api.get('/billing-groups/active/current'),
};

// Bills API
export const billsAPI = {
  getSummary: (billingGroupId) => api.get(`/bills/summary/${billingGroupId}`),
  getDetailed: (billingGroupId) => api.get(`/bills/detailed/${billingGroupId}`),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export default api;
