import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

import { PhotoRecord, ExifData, Measurements, PhotoMetadata } from '@types/index';
import { DatabaseService } from '@services/database';
import { SyncService } from '@services/sync';
import { useAuthStore } from './authStore';

interface PhotoStore {
  // State
  photos: PhotoRecord[];
  currentPhoto: PhotoRecord | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPhotos: (projectId?: string) => Promise<void>;
  capturePhoto: (photoData: {
    projectId: string;
    polygonId?: string;
    filePath: string;
    fileSize: number;
    sha256: string;
    exifData: ExifData;
    measurements?: Measurements;
    metadata?: Partial<PhotoMetadata>;
  }) => Promise<string>;
  updatePhoto: (photoId: string, updates: Partial<PhotoRecord>) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  updateMeasurements: (photoId: string, measurements: Measurements) => Promise<void>;
  updateMetadata: (photoId: string, metadata: Partial<PhotoMetadata>) => Promise<void>;
  setCurrentPhoto: (photoId: string | null) => void;
  syncPhoto: (photoId: string) => Promise<void>;
  getPhotosByStatus: (status: PhotoRecord['status']) => PhotoRecord[];
  getPhotosByProject: (projectId: string) => PhotoRecord[];
  clearError: () => void;
  refreshPhotos: (projectId?: string) => Promise<void>;
}

export const usePhotoStore = create<PhotoStore>()(
  persist(
    (set, get) => ({
      // Initial state
      photos: [],
      currentPhoto: null,
      isLoading: false,
      error: null,

      // Load photos from database
      loadPhotos: async (projectId?: string): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          const db = DatabaseService.getInstance();
          const photos = await db.getPhotos(projectId);
          
          set({ photos, isLoading: false });
          console.log(`✅ Loaded ${photos.length} photos${projectId ? ` for project ${projectId}` : ''}`);
        } catch (error: any) {
          console.error('❌ Failed to load photos:', error);
          set({ 
            error: error.message || 'Failed to load photos',
            isLoading: false 
          });
        }
      },

      // Capture new photo
      capturePhoto: async (photoData): Promise<string> => {
        set({ isLoading: true, error: null });
        
        try {
          const { user } = useAuthStore.getState();
          if (!user) {
            throw new Error('User not authenticated');
          }

          const photoId = uuidv4();
          const now = new Date().toISOString();

          // Default metadata
          const defaultMetadata: PhotoMetadata = {
            purpose: 'monitoring',
            category: 'general',
            description: '',
            tags: [],
            ...photoData.metadata,
          };

          const newPhoto: PhotoRecord = {
            id: photoId,
            projectId: photoData.projectId,
            polygonId: photoData.polygonId,
            localFilePath: photoData.filePath,
            sha256: photoData.sha256,
            fileSize: photoData.fileSize,
            mimeType: 'image/jpeg', // Default for camera captures
            exifData: photoData.exifData,
            measurements: photoData.measurements,
            metadata: defaultMetadata,
            status: 'pending',
            syncAttempts: 0,
            createdBy: user.id,
            createdAt: now,
          };

          // Save to database
          const db = DatabaseService.getInstance();
          await db.savePhoto(newPhoto);

          // Queue for sync
          const syncService = SyncService.getInstance();
          await syncService.queuePhotoSync(newPhoto);

          // Update store
          set((state) => ({
            photos: [newPhoto, ...state.photos],
            currentPhoto: newPhoto,
            isLoading: false,
          }));

          console.log(`✅ Photo captured: ${photoId}`);
          return photoId;
        } catch (error: any) {
          console.error('❌ Failed to capture photo:', error);
          set({ 
            error: error.message || 'Failed to capture photo',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update existing photo
      updatePhoto: async (photoId: string, updates: Partial<PhotoRecord>): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          const db = DatabaseService.getInstance();
          const existingPhoto = get().photos.find(p => p.id === photoId);
          
          if (!existingPhoto) {
            throw new Error('Photo not found');
          }

          const updatedPhoto: PhotoRecord = {
            ...existingPhoto,
            ...updates,
          };

          // Save to database
          await db.savePhoto(updatedPhoto);

          // Update store
          set((state) => ({
            photos: state.photos.map(p => 
              p.id === photoId ? updatedPhoto : p
            ),
            currentPhoto: state.currentPhoto?.id === photoId 
              ? updatedPhoto 
              : state.currentPhoto,
            isLoading: false,
          }));

          console.log(`✅ Photo updated: ${photoId}`);
        } catch (error: any) {
          console.error('❌ Failed to update photo:', error);
          set({ 
            error: error.message || 'Failed to update photo',
            isLoading: false 
          });
          throw error;
        }
      },

      // Delete photo
      deletePhoto: async (photoId: string): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          const photo = get().photos.find(p => p.id === photoId);
          if (!photo) {
            throw new Error('Photo not found');
          }

          // Delete file from local storage
          // Note: This would need implementation in FileService
          // await FileService.deleteFile(photo.localFilePath);

          // Remove from database
          // Note: This would need implementation in DatabaseService
          // await db.deletePhoto(photoId);

          // Update store
          set((state) => ({
            photos: state.photos.filter(p => p.id !== photoId),
            currentPhoto: state.currentPhoto?.id === photoId 
              ? null 
              : state.currentPhoto,
            isLoading: false,
          }));

          console.log(`✅ Photo deleted: ${photoId}`);
        } catch (error: any) {
          console.error('❌ Failed to delete photo:', error);
          set({ 
            error: error.message || 'Failed to delete photo',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update measurements
      updateMeasurements: async (photoId: string, measurements: Measurements): Promise<void> => {
        await get().updatePhoto(photoId, { measurements });
        console.log(`✅ Measurements updated for photo: ${photoId}`);
      },

      // Update metadata
      updateMetadata: async (photoId: string, metadata: Partial<PhotoMetadata>): Promise<void> => {
        const photo = get().photos.find(p => p.id === photoId);
        if (!photo) {
          throw new Error('Photo not found');
        }

        const updatedMetadata = {
          ...photo.metadata,
          ...metadata,
        };

        await get().updatePhoto(photoId, { metadata: updatedMetadata });
        console.log(`✅ Metadata updated for photo: ${photoId}`);
      },

      // Set current photo
      setCurrentPhoto: (photoId: string | null): void => {
        const { photos } = get();
        const photo = photoId ? photos.find(p => p.id === photoId) || null : null;
        
        set({ currentPhoto: photo });
        console.log(`📷 Current photo set: ${photo?.id || 'None'}`);
      },

      // Sync photo to backend
      syncPhoto: async (photoId: string): Promise<void> => {
        try {
          const photo = get().photos.find(p => p.id === photoId);
          if (!photo) {
            throw new Error('Photo not found');
          }

          const syncService = SyncService.getInstance();
          await syncService.queuePhotoSync(photo);

          console.log(`✅ Photo queued for sync: ${photoId}`);
        } catch (error: any) {
          console.error('❌ Failed to sync photo:', error);
          throw error;
        }
      },

      // Get photos by status
      getPhotosByStatus: (status: PhotoRecord['status']): PhotoRecord[] => {
        return get().photos.filter(photo => photo.status === status);
      },

      // Get photos by project
      getPhotosByProject: (projectId: string): PhotoRecord[] => {
        return get().photos.filter(photo => photo.projectId === projectId);
      },

      // Clear error
      clearError: (): void => {
        set({ error: null });
      },

      // Refresh photos
      refreshPhotos: async (projectId?: string): Promise<void> => {
        await get().loadPhotos(projectId);
      },
    }),
    {
      name: 'photo-storage',
      storage: createJSONStorage(() => AsyncStorage),
      
      // Only persist basic photo list metadata, actual data comes from database
      partialize: (state) => ({
        currentPhoto: state.currentPhoto ? { id: state.currentPhoto.id } : null,
      }),
      
      // Load photos from database on hydration
      onRehydrateStorage: () => async (state) => {
        if (state) {
          try {
            await usePhotoStore.getState().loadPhotos();
          } catch (error) {
            console.warn('Failed to load photos on hydration:', error);
          }
        }
      },
    }
  )
);

// Helper functions for photo management
export const getPhotoStats = (photos: PhotoRecord[]) => {
  return {
    total: photos.length,
    pending: photos.filter(p => p.status === 'pending').length,
    uploading: photos.filter(p => p.status === 'uploading').length,
    uploaded: photos.filter(p => p.status === 'uploaded').length,
    failed: photos.filter(p => p.status === 'failed').length,
    processed: photos.filter(p => p.status === 'processed').length,
  };
};

export const getPhotosByDate = (photos: PhotoRecord[], date: string) => {
  const targetDate = new Date(date).toDateString();
  return photos.filter(photo => 
    new Date(photo.createdAt).toDateString() === targetDate
  );
};

export const getPhotosRequiringSync = (photos: PhotoRecord[]) => {
  return photos.filter(photo => 
    photo.status === 'pending' || photo.status === 'failed'
  );
};

export const formatPhotoSize = (sizeInBytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default usePhotoStore;
