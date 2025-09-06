// src/hooks/queries/useMockQueries.js
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/mocks/mockApi';

// Custom hooks that use mock data instead of real API calls
export const useMockProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: mockApi.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMockProject = (id) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => mockApi.getProject(id),
    enabled: !!id,
  });
};

export const useMockCredits = () => {
  return useQuery({
    queryKey: ['credits'],
    queryFn: mockApi.getCredits,
  });
};

export const useMockAudits = () => {
  return useQuery({
    queryKey: ['audits'],
    queryFn: mockApi.getAudits,
  });
};

export const useMockDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: mockApi.getDashboardStats,
  });
};
