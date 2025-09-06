// src/mocks/mockApi.js
import { mockProjects, mockCredits, mockAudits, mockDashboardStats, mockUsers } from './mockData';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  // Projects
  getProjects: async () => {
    await delay();
    return { data: mockProjects, success: true };
  },

  getProject: async (id) => {
    await delay();
    const project = mockProjects.find(p => p.id === id);
    return { data: project, success: !!project };
  },

  // Credits
  getCredits: async () => {
    await delay();
    return { data: mockCredits, success: true };
  },

  getCreditsByProject: async (projectId) => {
    await delay();
    const credits = mockCredits.filter(c => c.projectId === projectId);
    return { data: credits, success: true };
  },

  // Audits
  getAudits: async () => {
    await delay();
    return { data: mockAudits, success: true };
  },

  getAudit: async (id) => {
    await delay();
    const audit = mockAudits.find(a => a.id === id);
    return { data: audit, success: !!audit };
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    await delay();
    return { data: mockDashboardStats, success: true };
  },

  // Authentication
  login: async (credentials) => {
    await delay();
    const { role } = credentials;

    if (mockUsers[role]) {
      const user = mockUsers[role];
      return {
        data: {
          user,
          token: `mock-token-${role}-${Date.now()}`
        },
        success: true
      };
    }

    return { data: null, success: false, error: 'Invalid credentials' };
  },

  getCurrentUser: async () => {
    await delay();
    // Return the first user as current user for testing
    return { data: mockUsers.admin, success: true };
  }
};
