// services/api/audits.js
import apiClient from './client';

export const auditsAPI = {
  getMRVQueue: (params = {}) => {
    return apiClient.get('/audits/mrv-queue', { params });
  },

  getMRVReport: (reportId) => {
    return apiClient.get(`/audits/mrv-reports/${reportId}`);
  },

  getMRVEvidence: (reportId) => {
    return apiClient.get(`/audits/mrv-reports/${reportId}/evidence`);
  },

  approveMRV: (reportId, data) => {
    return apiClient.post(`/audits/mrv-reports/${reportId}/approve`, data);
  },

  rejectMRV: (reportId, data) => {
    return apiClient.post(`/audits/mrv-reports/${reportId}/reject`, data);
  },

  requestMRVChanges: (reportId, data) => {
    return apiClient.post(`/audits/mrv-reports/${reportId}/request-changes`, data);
  },

  flagEvidence: (evidenceId, data) => {
    return apiClient.post(`/audits/evidence/${evidenceId}/flag`, data);
  },

  addComment: (reportId, data) => {
    return apiClient.post(`/audits/mrv-reports/${reportId}/comments`, data);
  },

  getComments: (reportId) => {
    return apiClient.get(`/audits/mrv-reports/${reportId}/comments`);
  },

  assignAuditor: (reportId, auditorId) => {
    return apiClient.post(`/audits/mrv-reports/${reportId}/assign`, { auditorId });
  },

  getAuditHistory: (reportId) => {
    return apiClient.get(`/audits/mrv-reports/${reportId}/history`);
  },

  updateAuditStatus: (reportId, status, data = {}) => {
    return apiClient.patch(`/audits/mrv-reports/${reportId}/status`, { status, ...data });
  },

  getAuditorStats: (auditorId) => {
    return apiClient.get(`/audits/auditors/${auditorId}/stats`);
  },

  bulkAssignReports: (reportIds, auditorId) => {
    return apiClient.post('/audits/bulk-assign', { reportIds, auditorId });
  },

  exportAuditReport: (reportId, format = 'pdf') => {
    return apiClient.get(`/audits/mrv-reports/${reportId}/export`, { 
      params: { format },
      responseType: 'blob'
    });
  }
};