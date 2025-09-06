// store/slices/projectsSlice.js
import { create } from 'zustand';

export const useProjectsStore = create((set, get) => ({
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    habitatType: 'all',
    search: ''
  },

  setProjects: (projects) => set({ projects }),
  
  setSelectedProject: (project) => set({ selectedProject: project }),
  
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),
  
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(project => 
      project.id === id ? { ...project, ...updates } : project
    ),
    selectedProject: state.selectedProject?.id === id 
      ? { ...state.selectedProject, ...updates } 
      : state.selectedProject
  })),
  
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter(project => project.id !== id),
    selectedProject: state.selectedProject?.id === id ? null : state.selectedProject
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  clearFilters: () => set({
    filters: {
      status: 'all',
      habitatType: 'all',
      search: ''
    }
  })
}));