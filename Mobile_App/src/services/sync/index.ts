import BackgroundJob from 'react-native-background-job';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

import { DatabaseService } from '@services/database';
import { api } from '@services/api/client';
import { FileService } from '@services/file';
import { SyncJob, PhotoRecord, Project, UploadStatus } from '@types/index';

export class SyncService {
  private static instance: SyncService;
  private db: DatabaseService;
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryDelays = [1000, 5000, 15000, 60000, 300000]; // Progressive delays in ms

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  public async startBackgroundSync(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🔄 Starting background sync service');

    // Start periodic sync
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, 15 * 60 * 1000); // Sync every 15 minutes

    // Initial sync
    await this.performSync();

    // Register background job for when app is backgrounded
    BackgroundJob.register({
      jobKey: 'blueCarbonSync',
      job: () => {
        this.performSync();
      },
    });
  }

  public async stopBackgroundSync(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('⏹️ Stopping background sync service');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    BackgroundJob.stop({
      jobKey: 'blueCarbonSync',
    });
  }

  public async performSync(): Promise<void> {
    try {
      // Check network connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        console.log('📴 No network connection, skipping sync');
        return;
      }

      console.log('🔄 Starting sync process');

      // Get pending sync jobs
      const pendingSyncJobs = await this.db.getPendingSyncJobs();
      
      if (pendingSyncJobs.length === 0) {
        console.log('✅ No pending sync jobs');
        return;
      }

      console.log(`📋 Found ${pendingSyncJobs.length} pending sync jobs`);

      // Process jobs by priority
      const sortedJobs = pendingSyncJobs.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      for (const job of sortedJobs) {
        await this.processSyncJob(job);
      }

      console.log('✅ Sync process completed');
    } catch (error) {
      console.error('❌ Sync process failed:', error);
    }
  }

  private async processSyncJob(job: SyncJob): Promise<void> {
    try {
      // Check if job should be retried
      if (job.attempts >= job.maxAttempts) {
        console.log(`⏭️ Skipping job ${job.id} - max attempts reached`);
        return;
      }

      // Check retry delay
      if (job.nextAttemptAt && new Date(job.nextAttemptAt) > new Date()) {
        console.log(`⏳ Job ${job.id} not ready for retry yet`);
        return;
      }

      console.log(`🔄 Processing sync job: ${job.type} - ${job.entityId}`);

      // Update job status to processing
      await this.db.updateSyncJobStatus(job.id, 'processing', undefined, job.attempts + 1);

      let success = false;
      let error: string | undefined;

      switch (job.type) {
        case 'photo':
          success = await this.syncPhoto(job);
          break;
        case 'project':
          success = await this.syncProject(job);
          break;
        case 'metadata':
          success = await this.syncMetadata(job);
          break;
        default:
          error = `Unknown job type: ${job.type}`;
      }

      if (success) {
        await this.db.updateSyncJobStatus(job.id, 'completed');
        console.log(`✅ Job ${job.id} completed successfully`);
      } else {
        const nextAttempt = this.calculateNextAttempt(job.attempts);
        await this.db.updateSyncJobStatus(
          job.id, 
          'failed', 
          error || 'Unknown error', 
          job.attempts + 1
        );
        console.log(`❌ Job ${job.id} failed, next attempt: ${nextAttempt}`);
      }
    } catch (jobError: any) {
      console.error(`❌ Error processing job ${job.id}:`, jobError);
      await this.db.updateSyncJobStatus(
        job.id, 
        'failed', 
        jobError.message || 'Unknown error', 
        job.attempts + 1
      );
    }
  }

  private async syncPhoto(job: SyncJob): Promise<boolean> {
    try {
      const photo: PhotoRecord = job.payload;
      
      // Step 1: Upload file to S3 via presigned URL
      const uploadResult = await this.uploadPhotoFile(photo);
      if (!uploadResult.success) {
        return false;
      }

      // Step 2: Send metadata to backend
      const metadataResult = await this.sendPhotoMetadata(photo, uploadResult.remoteUrl!);
      if (!metadataResult.success) {
        return false;
      }

      // Step 3: Update local photo record
      await this.db.updatePhotoStatus(photo.id, 'uploaded', uploadResult.remoteUrl);
      
      return true;
    } catch (error: any) {
      console.error('Photo sync error:', error);
      return false;
    }
  }

  private async uploadPhotoFile(photo: PhotoRecord): Promise<{ success: boolean; remoteUrl?: string }> {
    try {
      // Get presigned upload URL
      const presignedResponse = await api.post('/files/presigned-upload', {
        fileName: `photos/${photo.id}.jpg`,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        sha256: photo.sha256,
      });

      if (!presignedResponse.success) {
        throw new Error('Failed to get presigned URL');
      }

      const { uploadUrl, fileId } = presignedResponse.data;

      // Upload file to S3
      const fileData = await FileService.readFile(photo.localFilePath);
      const uploadSuccess = await FileService.uploadToS3(uploadUrl, fileData);

      if (!uploadSuccess) {
        throw new Error('Failed to upload to S3');
      }

      // Generate remote URL
      const remoteUrl = `https://s3.amazonaws.com/bucket/${fileId}`;
      
      return { success: true, remoteUrl };
    } catch (error: any) {
      console.error('File upload error:', error);
      return { success: false };
    }
  }

  private async sendPhotoMetadata(photo: PhotoRecord, remoteUrl: string): Promise<{ success: boolean }> {
    try {
      const response = await api.post('/photos', {
        id: photo.id,
        projectId: photo.projectId,
        polygonId: photo.polygonId,
        remoteUrl,
        sha256: photo.sha256,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        exifData: photo.exifData,
        measurements: photo.measurements,
        metadata: photo.metadata,
        createdAt: photo.createdAt,
      });

      return { success: response.success };
    } catch (error: any) {
      console.error('Metadata sync error:', error);
      return { success: false };
    }
  }

  private async syncProject(job: SyncJob): Promise<boolean> {
    try {
      const project: Project = job.payload;
      
      const response = await api.post('/projects', project);
      return response.success;
    } catch (error: any) {
      console.error('Project sync error:', error);
      return false;
    }
  }

  private async syncMetadata(job: SyncJob): Promise<boolean> {
    try {
      const { entityType, entityId, updates } = job.payload;
      
      const response = await api.patch(`/${entityType}/${entityId}`, updates);
      return response.success;
    } catch (error: any) {
      console.error('Metadata sync error:', error);
      return false;
    }
  }

  private calculateNextAttempt(attempts: number): string {
    const delay = this.retryDelays[Math.min(attempts, this.retryDelays.length - 1)];
    return new Date(Date.now() + delay).toISOString();
  }

  // Public methods for manual sync operations
  public async queuePhotoSync(photo: PhotoRecord): Promise<string> {
    const jobId = uuidv4();
    
    const syncJob: SyncJob = {
      id: jobId,
      type: 'photo',
      entityId: photo.id,
      priority: 'high',
      payload: photo,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    };

    await this.db.addSyncJob(syncJob);
    console.log(`📋 Queued photo sync job: ${jobId}`);
    
    // Trigger immediate sync if connected
    const networkState = await NetInfo.fetch();
    if (networkState.isConnected) {
      this.performSync();
    }
    
    return jobId;
  }

  public async queueProjectSync(project: Project): Promise<string> {
    const jobId = uuidv4();
    
    const syncJob: SyncJob = {
      id: jobId,
      type: 'project',
      entityId: project.id,
      priority: 'normal',
      payload: project,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    };

    await this.db.addSyncJob(syncJob);
    console.log(`📋 Queued project sync job: ${jobId}`);
    
    return jobId;
  }

  public async forceSyncNow(): Promise<void> {
    console.log('🚀 Forcing immediate sync');
    await this.performSync();
  }

  public async getSyncStatus(): Promise<{
    pendingJobs: number;
    lastSyncTime: string | null;
    isOnline: boolean;
  }> {
    const pendingJobs = await this.db.getPendingSyncJobs();
    const networkState = await NetInfo.fetch();
    
    return {
      pendingJobs: pendingJobs.length,
      lastSyncTime: null, // Could be stored in app config
      isOnline: networkState.isConnected || false,
    };
  }

  public async retryFailedJobs(): Promise<void> {
    console.log('🔄 Retrying all failed jobs');
    
    const failedJobs = await this.db.getPendingSyncJobs();
    
    for (const job of failedJobs.filter(j => j.status === 'failed')) {
      await this.db.updateSyncJobStatus(job.id, 'pending', undefined, 0);
    }
    
    await this.performSync();
  }

  public async clearCompletedJobs(): Promise<void> {
    // This would need a database method to delete completed jobs
    console.log('🧹 Clearing completed sync jobs');
  }
}

export default SyncService;
