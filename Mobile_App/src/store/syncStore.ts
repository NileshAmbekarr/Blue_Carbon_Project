import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { SyncStatus, UploadProgress, SyncJob } from '@types/index';
import { DatabaseService } from '@services/database';
import { SyncService } from '@services/sync';

interface SyncStore {
  // State
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed';
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  uploadProgress: Record<string, UploadProgress>;
  error: string | null;
  
  // Actions
  startSync: () => Promise<void>;
  stopSync: () => void;
  updateSyncStatus: (status: SyncStore['syncStatus']) => void;
  updatePendingCount: () => Promise<void>;
  updateUploadProgress: (jobId: string, progress: UploadProgress) => void;
  removeUploadProgress: (jobId: string) => void;
  updateNetworkStatus: (isOnline: boolean) => void;
  setLastSyncTime: (timestamp: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getSyncStats: () => Promise<{
    totalPending: number;
    photosPending: number;
    projectsPending: number;
    metadataPending: number;
  }>;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // Initial state
      syncStatus: 'idle',
      isOnline: false,
      pendingCount: 0,
      lastSyncTime: null,
      uploadProgress: {},
      error: null,

      // Start sync process
      startSync: async (): Promise<void> => {
        const { isOnline } = get();
        
        if (!isOnline) {
          set({ error: 'No internet connection available' });
          return;
        }

        set({ syncStatus: 'syncing', error: null });
        
        try {
          const syncService = SyncService.getInstance();
          await syncService.performSync();
          
          set({ 
            syncStatus: 'completed',
            lastSyncTime: new Date().toISOString(),
          });
          
          // Update pending count after sync
          await get().updatePendingCount();
          
          console.log('✅ Sync completed successfully');
        } catch (error: any) {
          console.error('❌ Sync failed:', error);
          set({ 
            syncStatus: 'failed',
            error: error.message || 'Sync failed',
          });
        }
      },

      // Stop sync process
      stopSync: (): void => {
        // Note: This would need implementation in SyncService
        set({ syncStatus: 'idle' });
        console.log('⏹️ Sync stopped');
      },

      // Update sync status
      updateSyncStatus: (status: SyncStore['syncStatus']): void => {
        set({ syncStatus: status });
      },

      // Update pending count from database
      updatePendingCount: async (): Promise<void> => {
        try {
          const db = DatabaseService.getInstance();
          const pendingJobs = await db.getPendingSyncJobs();
          set({ pendingCount: pendingJobs.length });
        } catch (error) {
          console.error('❌ Failed to update pending count:', error);
        }
      },

      // Update upload progress for a specific job
      updateUploadProgress: (jobId: string, progress: UploadProgress): void => {
        set((state) => ({
          uploadProgress: {
            ...state.uploadProgress,
            [jobId]: progress,
          },
        }));
      },

      // Remove upload progress for completed/failed job
      removeUploadProgress: (jobId: string): void => {
        set((state) => {
          const newProgress = { ...state.uploadProgress };
          delete newProgress[jobId];
          return { uploadProgress: newProgress };
        });
      },

      // Update network status
      updateNetworkStatus: (isOnline: boolean): void => {
        set({ isOnline });
        
        // Auto-start sync if came online and have pending items
        if (isOnline && get().pendingCount > 0 && get().syncStatus === 'idle') {
          get().startSync();
        }
      },

      // Set last sync time
      setLastSyncTime: (timestamp: string): void => {
        set({ lastSyncTime: timestamp });
      },

      // Set error
      setError: (error: string | null): void => {
        set({ error });
      },

      // Clear error
      clearError: (): void => {
        set({ error: null });
      },

      // Get detailed sync statistics
      getSyncStats: async () => {
        try {
          const db = DatabaseService.getInstance();
          const pendingJobs = await db.getPendingSyncJobs();
          
          const stats = {
            totalPending: pendingJobs.length,
            photosPending: pendingJobs.filter(job => job.type === 'photo').length,
            projectsPending: pendingJobs.filter(job => job.type === 'project').length,
            metadataPending: pendingJobs.filter(job => job.type === 'metadata').length,
          };

          return stats;
        } catch (error) {
          console.error('❌ Failed to get sync stats:', error);
          return {
            totalPending: 0,
            photosPending: 0,
            projectsPending: 0,
            metadataPending: 0,
          };
        }
      },
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => AsyncStorage),
      
      // Persist essential sync state
      partialize: (state) => ({
        lastSyncTime: state.lastSyncTime,
        pendingCount: state.pendingCount,
      }),
      
      // Initialize network status and pending count on hydration
      onRehydrateStorage: () => async (state) => {
        if (state) {
          try {
            // Check network status
            const networkState = await NetInfo.fetch();
            useSyncStore.getState().updateNetworkStatus(networkState.isConnected || false);
            
            // Update pending count
            await useSyncStore.getState().updatePendingCount();
            
            console.log('✅ Sync store rehydrated');
          } catch (error) {
            console.warn('Failed to initialize sync store:', error);
          }
        }
      },
    }
  )
);

// Set up network listener
let networkUnsubscribe: (() => void) | null = null;

// Initialize network monitoring
export const initializeSyncNetworkMonitoring = () => {
  if (networkUnsubscribe) {
    networkUnsubscribe();
  }

  networkUnsubscribe = NetInfo.addEventListener(state => {
    const isOnline = state.isConnected || false;
    useSyncStore.getState().updateNetworkStatus(isOnline);
    
    if (isOnline) {
      console.log('🌐 Network connected - sync available');
    } else {
      console.log('📴 Network disconnected - offline mode');
    }
  });
};

// Cleanup network monitoring
export const cleanupSyncNetworkMonitoring = () => {
  if (networkUnsubscribe) {
    networkUnsubscribe();
    networkUnsubscribe = null;
  }
};

// Helper function to format sync progress
export const formatSyncProgress = (progress: UploadProgress): string => {
  const { percentage, status } = progress;
  
  switch (status) {
    case 'starting':
      return 'Starting upload...';
    case 'uploading':
      return `Uploading ${percentage.toFixed(0)}%`;
    case 'processing':
      return 'Processing...';
    case 'completed':
      return 'Upload complete';
    case 'failed':
      return 'Upload failed';
    default:
      return `${percentage.toFixed(0)}%`;
  }
};

// Helper function to estimate remaining time
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  } else {
    return `${Math.round(seconds / 3600)}h`;
  }
};

// Helper function to format upload speed
export const formatUploadSpeed = (bytesPerSecond: number): string => {
  const kbps = bytesPerSecond / 1024;
  const mbps = kbps / 1024;
  
  if (mbps > 1) {
    return `${mbps.toFixed(1)} MB/s`;
  } else {
    return `${kbps.toFixed(0)} KB/s`;
  }
};

export default useSyncStore;
