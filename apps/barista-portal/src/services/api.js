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

// Order API
export const orderAPI = {
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updateItemStatus: (orderId, itemId, status) =>
    api.put(`/orders/${orderId}/items/${itemId}/status`, { status }),
};

// Barista API
export const baristaAPI = {
  getPendingOrders: () => api.get('/barista/orders/pending'),
  getActiveOrders: () => api.get('/barista/orders/active'),
  getDashboard: () => api.get('/barista/dashboard'),
  startOrder: (id) => api.put(`/barista/orders/${id}/start`),
  completeOrder: (id) => api.put(`/barista/orders/${id}/complete`),
  dispatchOrder: (id) => api.put(`/barista/orders/${id}/dispatch`),
  cancelOrder: (id) => api.put(`/barista/orders/${id}/cancel`),
};

// Settings API
export const settingsAPI = {
  getPublic: () => api.get('/settings/public'),
};

export default api;
