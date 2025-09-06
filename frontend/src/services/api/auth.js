// services/api/auth.js
import apiClient from './client';

export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/api/auth/refresh');
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/api/auth/reset-password', {
      token,
      password: newPassword,
    });
    return response.data;
  },
};