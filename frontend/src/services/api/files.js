// services/api/files.js
import apiClient from './client';

export const filesAPI = {
  uploadFile: async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadMultipleFiles: async (files, metadata = {}) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await apiClient.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getFile: async (hash) => {
    const response = await apiClient.get(`/files/${hash}`);
    return response.data;
  },

  getFileUrl: async (hash) => {
    const response = await apiClient.get(`/files/${hash}/url`);
    return response.data;
  },

  deleteFile: async (hash) => {
    const response = await apiClient.delete(`/files/${hash}`);
    return response.data;
  },

  verifyFileHash: async (hash) => {
    const response = await apiClient.get(`/files/${hash}/verify`);
    return response.data;
  },
};