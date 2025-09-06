// hooks/api/useProjects.js
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/services/api/projects';

export const useProjects = (filters = {}) => {
  return useQuery({
    queryKey: ['projects', filters], // Caching key, depends on filters
    queryFn: () => getProjects(filters),
  });
};