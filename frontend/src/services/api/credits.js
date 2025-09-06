// services/api/credits.js
import apiClient from './client';

export const creditsAPI = {
  getCreditBatches: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/api/credits?${params}`);
    return response.data;
  },

  getCreditBatch: async (id) => {
    const response = await apiClient.get(`/api/credits/${id}`);
    return response.data;
  },

  getCreditStats: async () => {
    const response = await apiClient.get('/api/credits/stats');
    return response.data;
  },

  issueCreditBatch: async (issueData) => {
    const response = await apiClient.post('/api/credits/issue', issueData);
    return response.data;
  },

  transferCredits: async (batchId, transferData) => {
    const response = await apiClient.post(`/api/credits/${batchId}/transfer`, transferData);
    return response.data;
  },

  retireCredits: async (batchId, retireData) => {
    const response = await apiClient.post(`/api/credits/${batchId}/retire`, retireData);
    return response.data;
  },

  getOrgCredits: async (orgId) => {
    const response = await apiClient.get(`/api/credits/org/${orgId}`);
    return response.data;
  },

  getCreditHistory: async (batchId) => {
    const response = await apiClient.get(`/api/credits/${batchId}/history`);
    return response.data;
  },

  getTransferHistory: async (batchId) => {
    const response = await apiClient.get(`/api/credits/${batchId}/transfers`);
    return response.data;
  },

  getRetirements: async (batchId) => {
    const response = await apiClient.get(`/api/credits/${batchId}/retirements`);
    return response.data;
  },
};