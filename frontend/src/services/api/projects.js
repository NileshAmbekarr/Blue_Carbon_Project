// services/api/projects.js
import apiClient from './client';

export const projectsAPI = {
  getProjects: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/api/projects?${params}`);
    return response.data;
  },
  
  createProject: async (projectData) => {
    const response = await apiClient.post('/api/projects', projectData);
    return response.data;
  },

  getProject: async (id) => {
    const response = await apiClient.get(`/api/projects/${id}`);
    return response.data;
  },

  updateProject: async (id, projectData) => {
    const response = await apiClient.put(`/api/projects/${id}`, projectData);
    return response.data;
  },

  deleteProject: (projectId) => {
    return apiClient.delete(`/projects/${projectId}`);
  },

  getProjectPlots: (projectId) => {
    return apiClient.get(`/projects/${projectId}/plots`);
  },

  updateProjectPlots: (projectId, plotsData) => {
    return apiClient.put(`/projects/${projectId}/plots`, { plots: plotsData });
  },

  createPlot: (projectId, plotData) => {
    return apiClient.post(`/projects/${projectId}/plots`, plotData);
  },

  updatePlot: (projectId, plotId, plotData) => {
    return apiClient.put(`/projects/${projectId}/plots/${plotId}`, plotData);
  },

  deletePlot: (projectId, plotId) => {
    return apiClient.delete(`/projects/${projectId}/plots/${plotId}`);
  },

  getMonitoringEvents: async (projectId) => {
    const response = await apiClient.get(`/api/projects/${projectId}/monitoring`);
    return response.data;
  },

  createMonitoringEvent: async (eventData) => {
    const response = await apiClient.post('/api/monitoring', eventData);
    return response.data;
  },
};

// ... other project-related API calls