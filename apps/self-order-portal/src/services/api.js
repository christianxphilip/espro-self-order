import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Table API
export const tableAPI = {
  getByQRCode: (qrCode) => api.get(`/tables/qr/${qrCode}`),
};

// Menu API
export const menuAPI = {
  getAll: () => api.get('/menu'),
  getByCategories: () => api.get('/menu/categories'),
  getById: (id) => api.get(`/menu/${id}`),
};

// Order API
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getByTable: (tableId) => api.get(`/orders/table/${tableId}`),
};

// Billing Group API
export const billingGroupAPI = {
  getActive: () => api.get('/billing-groups/active/current'),
};

// Settings API
export const settingsAPI = {
  getPublic: () => api.get('/settings/public'),
};

export default api;
