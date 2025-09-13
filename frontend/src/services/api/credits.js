// services/api/credits.js
import apiClient from './client';

export const creditsAPI = {
  getCreditBatches: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/credits?${params}`);
    return response.data;
  },

  getCreditBatch: async (id) => {
    const response = await apiClient.get(`/credits/${id}`);
    return response.data;
  },

  getCreditStats: async () => {
    const response = await apiClient.get('/credits/stats');
    return response.data;
  },

  issueCreditBatch: async (issueData) => {
    const response = await apiClient.post('/credits/issue', issueData);
    return response.data;
  },

  transferCredits: async (batchId, transferData) => {
    const response = await apiClient.post(`/credits/${batchId}/transfer`, transferData);
    return response.data;
  },

  retireCredits: async (batchId, retireData) => {
    const response = await apiClient.post(`/credits/${batchId}/retire`, retireData);
    return response.data;
  },

  getOrgCredits: async (orgId) => {
    const response = await apiClient.get(`/credits/org/${orgId}`);
    return response.data;
  },

  getCreditHistory: async (batchId) => {
    const response = await apiClient.get(`/credits/${batchId}/history`);
    return response.data;
  },

  getTransferHistory: async (batchId) => {
    const response = await apiClient.get(`/credits/${batchId}/transfers`);
    return response.data;
  },

  getRetirements: async (batchId) => {
    const response = await apiClient.get(`/credits/${batchId}/retirements`);
    return response.data;
  },
};