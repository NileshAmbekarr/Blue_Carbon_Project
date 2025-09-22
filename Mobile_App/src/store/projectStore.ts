import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

import { Project, ProjectPolygon, ProjectBaseline } from '@types/index';
import { DatabaseService } from '@services/database';
import { SyncService } from '@services/sync';
import { api } from '@services/api/client';
import { useAuthStore } from './authStore';

interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<string>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (projectId: string | null) => void;
  addPolygon: (projectId: string, polygon: Omit<ProjectPolygon, 'id' | 'createdAt'>) => Promise<void>;
  updatePolygon: (projectId: string, polygonId: string, updates: Partial<ProjectPolygon>) => Promise<void>;
  removePolygon: (projectId: string, polygonId: string) => Promise<void>;
  updateBaseline: (projectId: string, baseline: Partial<ProjectBaseline>) => Promise<void>;
  syncProject: (projectId: string) => Promise<void>;
  clearError: () => void;
  refreshProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,

      // Load projects from local database
      loadProjects: async (): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          const db = DatabaseService.getInstance();
          const projects = await db.getProjects();
          
          set({ projects, isLoading: false });
          console.log(`✅ Loaded ${projects.length} projects from database`);
        } catch (error: any) {
          console.error('❌ Failed to load projects:', error);
          set({ 
            error: error.message || 'Failed to load projects',
            isLoading: false 
          });
        }
      },

      // Create new project
      createProject: async (projectData: Partial<Project>): Promise<string> => {
        set({ isLoading: true, error: null });
        
        try {
          const { user } = useAuthStore.getState();
          if (!user) {
            throw new Error('User not authenticated');
          }

          const projectId = uuidv4();
          const now = new Date().toISOString();

          const newProject: Project = {
            id: projectId,
            name: projectData.name || 'Untitled Project',
            description: projectData.description || '',
            status: 'draft',
            organizationId: user.organization?.id || '',
            createdBy: user.id,
            assignedTo: projectData.assignedTo || [user.id],
            baseline: projectData.baseline || {
              surveyDate: now,
              documents: [],
              species: [],
              environmentalData: {
                salinity: 0,
                soilPh: 7,
                tideRange: 0,
                temperature: { min: 0, max: 0, average: 0 },
                rainfall: 0,
                climateZone: '',
              },
              socialData: {
                communitySize: 0,
                households: 0,
                primaryLivelihood: [],
                dependencyOnEcosystem: 0,
                participationLevel: 0,
                beneficiaries: { direct: 0, indirect: 0 },
              },
            },
            polygons: projectData.polygons || [],
            metadata: projectData.metadata || {
              location: {
                state: '',
                district: '',
                block: '',
                village: '',
                coordinates: [0, 0],
              },
              ecosystem: 'mangrove',
              targetSpecies: [],
              estimatedCarbonSequestration: 0,
              projectDuration: 10,
              fundingSource: '',
              implementationPartner: user.organization?.name || '',
            },
            createdAt: now,
            updatedAt: now,
          };

          // Save to local database
          const db = DatabaseService.getInstance();
          await db.saveProject(newProject);

          // Queue for sync
          const syncService = SyncService.getInstance();
          await syncService.queueProjectSync(newProject);

          // Update store
          set((state) => ({
            projects: [...state.projects, newProject],
            currentProject: newProject,
            isLoading: false,
          }));

          console.log(`✅ Created project: ${newProject.name}`);
          return projectId;
        } catch (error: any) {
          console.error('❌ Failed to create project:', error);
          set({ 
            error: error.message || 'Failed to create project',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update existing project
      updateProject: async (projectId: string, updates: Partial<Project>): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          const db = DatabaseService.getInstance();
          const existingProject = await db.getProject(projectId);
          
          if (!existingProject) {
            throw new Error('Project not found');
          }

          const updatedProject: Project = {
            ...existingProject,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          // Save to database
          await db.saveProject(updatedProject);

          // Queue for sync
          const syncService = SyncService.getInstance();
          await syncService.queueProjectSync(updatedProject);

          // Update store
          set((state) => ({
            projects: state.projects.map(p => 
              p.id === projectId ? updatedProject : p
            ),
            currentProject: state.currentProject?.id === projectId 
              ? updatedProject 
              : state.currentProject,
            isLoading: false,
          }));

          console.log(`✅ Updated project: ${updatedProject.name}`);
        } catch (error: any) {
          console.error('❌ Failed to update project:', error);
          set({ 
            error: error.message || 'Failed to update project',
            isLoading: false 
          });
          throw error;
        }
      },

      // Delete project
      deleteProject: async (projectId: string): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          const db = DatabaseService.getInstance();
          
          // Check if project has any photos
          const photos = await db.getPhotos(projectId);
          if (photos.length > 0) {
            throw new Error('Cannot delete project with existing photos. Please remove all photos first.');
          }

          // Remove from database
          // Note: This would need implementation in DatabaseService
          // await db.deleteProject(projectId);

          // Update store
          set((state) => ({
            projects: state.projects.filter(p => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId 
              ? null 
              : state.currentProject,
            isLoading: false,
          }));

          console.log(`✅ Deleted project: ${projectId}`);
        } catch (error: any) {
          console.error('❌ Failed to delete project:', error);
          set({ 
            error: error.message || 'Failed to delete project',
            isLoading: false 
          });
          throw error;
        }
      },

      // Set current project
      setCurrentProject: (projectId: string | null): void => {
        const { projects } = get();
        const project = projectId ? projects.find(p => p.id === projectId) || null : null;
        
        set({ currentProject: project });
        console.log(`📂 Current project set: ${project?.name || 'None'}`);
      },

      // Add polygon to project
      addPolygon: async (projectId: string, polygonData: Omit<ProjectPolygon, 'id' | 'createdAt'>): Promise<void> => {
        try {
          const newPolygon: ProjectPolygon = {
            ...polygonData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };

          await get().updateProject(projectId, {
            polygons: [
              ...(get().projects.find(p => p.id === projectId)?.polygons || []),
              newPolygon,
            ],
          });

          console.log(`✅ Added polygon to project: ${projectId}`);
        } catch (error: any) {
          console.error('❌ Failed to add polygon:', error);
          throw error;
        }
      },

      // Update polygon
      updatePolygon: async (projectId: string, polygonId: string, updates: Partial<ProjectPolygon>): Promise<void> => {
        try {
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Project not found');
          }

          const updatedPolygons = project.polygons.map(polygon =>
            polygon.id === polygonId ? { ...polygon, ...updates } : polygon
          );

          await get().updateProject(projectId, { polygons: updatedPolygons });
          console.log(`✅ Updated polygon: ${polygonId}`);
        } catch (error: any) {
          console.error('❌ Failed to update polygon:', error);
          throw error;
        }
      },

      // Remove polygon
      removePolygon: async (projectId: string, polygonId: string): Promise<void> => {
        try {
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Project not found');
          }

          const updatedPolygons = project.polygons.filter(polygon => polygon.id !== polygonId);
          
          await get().updateProject(projectId, { polygons: updatedPolygons });
          console.log(`✅ Removed polygon: ${polygonId}`);
        } catch (error: any) {
          console.error('❌ Failed to remove polygon:', error);
          throw error;
        }
      },

      // Update project baseline
      updateBaseline: async (projectId: string, baseline: Partial<ProjectBaseline>): Promise<void> => {
        try {
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Project not found');
          }

          const updatedBaseline = {
            ...project.baseline,
            ...baseline,
          };

          await get().updateProject(projectId, { baseline: updatedBaseline });
          console.log(`✅ Updated baseline for project: ${projectId}`);
        } catch (error: any) {
          console.error('❌ Failed to update baseline:', error);
          throw error;
        }
      },

      // Sync project to backend
      syncProject: async (projectId: string): Promise<void> => {
        try {
          const project = get().projects.find(p => p.id === projectId);
          if (!project) {
            throw new Error('Project not found');
          }

          const syncService = SyncService.getInstance();
          await syncService.queueProjectSync(project);

          console.log(`✅ Queued project for sync: ${projectId}`);
        } catch (error: any) {
          console.error('❌ Failed to sync project:', error);
          throw error;
        }
      },

      // Refresh projects from backend
      refreshProjects: async (): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          // Try to fetch from backend first
          try {
            const response = await api.get('/projects');
            if (response.success && response.data) {
              // Save backend projects to local database
              const db = DatabaseService.getInstance();
              for (const project of response.data) {
                await db.saveProject(project);
              }
            }
          } catch (apiError) {
            console.warn('Failed to fetch from backend, using local data:', apiError);
          }

          // Load from local database
          await get().loadProjects();
        } catch (error: any) {
          console.error('❌ Failed to refresh projects:', error);
          set({ 
            error: error.message || 'Failed to refresh projects',
            isLoading: false 
          });
        }
      },

      // Clear error
      clearError: (): void => {
        set({ error: null });
      },
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => AsyncStorage),
      
      // Only persist basic project list, not full project data
      partialize: (state) => ({
        currentProject: state.currentProject ? { id: state.currentProject.id } : null,
      }),
      
      // Restore projects from database on hydration
      onRehydrateStorage: () => async (state) => {
        if (state) {
          try {
            // Load projects from database
            await useProjectStore.getState().loadProjects();
          } catch (error) {
            console.warn('Failed to load projects on hydration:', error);
          }
        }
      },
    }
  )
);

export default useProjectStore;
