import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Config from 'react-native-config';

import { DatabaseService } from '@services/database';
import { FileService } from '@services/file';
import { LocationService } from '@services/location';
import { CameraService } from '@services/camera';
import { NotificationService } from '@services/notifications';
import { AppConfig } from '@types/index';

export class InitializationService {
  private static isInitialized = false;
  private static initPromise: Promise<void> | null = null;

  public static async initializeApp(): Promise<void> {
    // Prevent multiple initialization
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  private static async performInitialization(): Promise<void> {
    try {
      console.log('🚀 Starting Blue Carbon MRV app initialization...');

      // Step 1: Load app configuration
      const appConfig = await this.loadAppConfig();
      console.log('✅ App configuration loaded');

      // Step 2: Initialize database
      await DatabaseService.getInstance().initialize();
      console.log('✅ Database initialized');

      // Step 3: Initialize file service
      await FileService.initialize();
      console.log('✅ File service initialized');

      // Step 4: Request essential permissions
      await this.requestEssentialPermissions();
      console.log('✅ Essential permissions requested');

      // Step 5: Check device capabilities
      await this.checkDeviceCapabilities();
      console.log('✅ Device capabilities checked');

      // Step 6: Initialize services that don't require user interaction
      await this.initializeBackgroundServices();
      console.log('✅ Background services initialized');

      // Step 7: Perform cleanup tasks
      await this.performCleanupTasks();
      console.log('✅ Cleanup tasks completed');

      // Step 8: Store initialization timestamp
      await AsyncStorage.setItem('lastInitialization', new Date().toISOString());

      this.isInitialized = true;
      console.log('🎉 Blue Carbon MRV app initialization completed successfully!');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      throw error;
    }
  }

  private static async loadAppConfig(): Promise<AppConfig> {
    try {
      // Load configuration from environment variables
      const config: AppConfig = {
        apiBaseUrl: Config.API_BASE_URL || 'http://localhost:3000',
        apiTimeout: parseInt(Config.API_TIMEOUT || '30000', 10),
        maxFileSize: parseInt(Config.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024,
        maxBatchUploadSize: parseInt(Config.MAX_BATCH_UPLOAD_SIZE || '5', 10),
        uploadRetryAttempts: parseInt(Config.UPLOAD_RETRY_ATTEMPTS || '3', 10),
        syncIntervalMinutes: parseInt(Config.SYNC_INTERVAL_MINUTES || '15', 10),
        gpsAccuracyThreshold: parseInt(Config.GPS_ACCURACY_THRESHOLD_METERS || '10', 10),
        gpsTimeoutSeconds: parseInt(Config.GPS_TIMEOUT_SECONDS || '30', 10),
        minImageResolution: parseInt(Config.MIN_IMAGE_RESOLUTION || '1024', 10),
        imageCompressionQuality: parseFloat(Config.IMAGE_COMPRESSION_QUALITY || '0.8'),
        requireExifData: Config.REQUIRE_EXIF_DATA === 'true',
        enableOfflineMode: Config.ENABLE_OFFLINE_MODE !== 'false',
        enableBackgroundSync: Config.ENABLE_BACKGROUND_SYNC !== 'false',
        enableFileCompression: Config.ENABLE_FILE_COMPRESSION !== 'false',
        enableDeviceAttestation: Config.ENABLE_DEVICE_ATTESTATION === 'true',
        mapboxAccessToken: Config.MAPBOX_ACCESS_TOKEN || '',
        encryptionKey: Config.ENCRYPTION_KEY || 'default-key-change-in-production',
      };

      // Store config in AsyncStorage for runtime access
      await AsyncStorage.setItem('appConfig', JSON.stringify(config));

      return config;
    } catch (error) {
      console.error('❌ Failed to load app configuration:', error);
      throw new Error('Failed to load app configuration');
    }
  }

  private static async requestEssentialPermissions(): Promise<void> {
    try {
      const results = await Promise.allSettled([
        LocationService.requestLocationPermissions(),
        CameraService.requestPermissions(),
        FileService.requestStoragePermissions(),
      ]);

      // Log permission results
      const [locationResult, cameraResult, storageResult] = results;

      if (locationResult.status === 'fulfilled' && locationResult.value) {
        console.log('✅ Location permissions granted');
      } else {
        console.warn('⚠️ Location permissions denied - GPS features limited');
      }

      if (cameraResult.status === 'fulfilled' && cameraResult.value) {
        console.log('✅ Camera permissions granted');
      } else {
        console.warn('⚠️ Camera permissions denied - Photo capture disabled');
      }

      if (storageResult.status === 'fulfilled' && storageResult.value) {
        console.log('✅ Storage permissions granted');
      } else {
        console.warn('⚠️ Storage permissions denied - File operations limited');
      }
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      // Don't throw - app should still work with limited functionality
    }
  }

  private static async checkDeviceCapabilities(): Promise<void> {
    try {
      // Check camera availability
      const cameraCheck = await CameraService.checkCameraAvailability();
      if (!cameraCheck.available) {
        console.warn('⚠️ Camera not available:', cameraCheck.error);
      }

      // Check location services
      const locationEnabled = await LocationService.isLocationServicesEnabled();
      if (!locationEnabled) {
        console.warn('⚠️ Location services disabled');
      }

      // Check available storage
      const storageUsage = await FileService.getStorageUsage();
      console.log(`📊 Storage usage: ${FileService.formatFileSize(storageUsage.totalSize)}`);

      // Check device specifications
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
      };
      console.log('📱 Device info:', deviceInfo);

    } catch (error) {
      console.error('❌ Failed to check device capabilities:', error);
      // Don't throw - continue initialization
    }
  }

  private static async initializeBackgroundServices(): Promise<void> {
    try {
      // Initialize notification service
      await NotificationService.initialize();

      // Note: Sync service will be started after authentication
      // We don't start it here to avoid unnecessary background activity

      console.log('✅ Background services ready');
    } catch (error) {
      console.error('❌ Failed to initialize background services:', error);
      // Don't throw - continue initialization
    }
  }

  private static async performCleanupTasks(): Promise<void> {
    try {
      // Clean up old files (files older than 30 days)
      const deletedCount = await FileService.cleanupOldFiles(30);
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old files`);
      }

      // Clear old logs or cache if needed
      await this.clearOldLogs();

      // Optimize database (could be implemented in DatabaseService)
      // await DatabaseService.getInstance().optimize();

    } catch (error) {
      console.error('❌ Cleanup tasks failed:', error);
      // Don't throw - cleanup failure shouldn't prevent app startup
    }
  }

  private static async clearOldLogs(): Promise<void> {
    try {
      // Clear old debug logs from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => key.startsWith('debug_log_'));
      
      // Keep only last 10 log entries
      if (logKeys.length > 10) {
        const oldLogKeys = logKeys.slice(0, logKeys.length - 10);
        await AsyncStorage.multiRemove(oldLogKeys);
        console.log(`🧹 Cleared ${oldLogKeys.length} old log entries`);
      }
    } catch (error) {
      console.warn('Failed to clear old logs:', error);
    }
  }

  // Utility methods
  public static async getAppConfig(): Promise<AppConfig | null> {
    try {
      const configString = await AsyncStorage.getItem('appConfig');
      return configString ? JSON.parse(configString) : null;
    } catch (error) {
      console.error('❌ Failed to get app config:', error);
      return null;
    }
  }

  public static async updateAppConfig(updates: Partial<AppConfig>): Promise<void> {
    try {
      const currentConfig = await this.getAppConfig();
      if (!currentConfig) {
        throw new Error('No existing config found');
      }

      const updatedConfig = { ...currentConfig, ...updates };
      await AsyncStorage.setItem('appConfig', JSON.stringify(updatedConfig));
      console.log('✅ App config updated');
    } catch (error) {
      console.error('❌ Failed to update app config:', error);
      throw error;
    }
  }

  public static async getInitializationInfo(): Promise<{
    isInitialized: boolean;
    lastInitialization: string | null;
    version: string;
  }> {
    try {
      const lastInit = await AsyncStorage.getItem('lastInitialization');
      return {
        isInitialized: this.isInitialized,
        lastInitialization: lastInit,
        version: '1.0.0', // Could be retrieved from package.json
      };
    } catch (error) {
      return {
        isInitialized: false,
        lastInitialization: null,
        version: '1.0.0',
      };
    }
  }

  public static async resetApp(): Promise<void> {
    try {
      console.log('🔄 Resetting app...');

      // Clear all stored data
      await AsyncStorage.clear();
      
      // Clear database
      await DatabaseService.getInstance().clearAllData();
      
      // Clear file storage
      const storageUsage = await FileService.getStorageUsage();
      if (storageUsage.totalSize > 0) {
        // This would need implementation in FileService
        console.log('🧹 File cleanup needed after reset');
      }

      // Reset initialization flag
      this.isInitialized = false;
      this.initPromise = null;

      console.log('✅ App reset completed');
    } catch (error) {
      console.error('❌ App reset failed:', error);
      throw error;
    }
  }
}

// Export the main initialization function
export const initializeApp = InitializationService.initializeApp.bind(InitializationService);

export default InitializationService;
