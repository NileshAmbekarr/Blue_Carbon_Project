import { launchCamera, launchImageLibrary, MediaType, ImagePickerResponse, CameraOptions } from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import DeviceInfo from 'react-native-device-info';
import ExifReader from 'react-native-exif';

import { FileService } from '@services/file';
import { LocationService } from '@services/location';
import { ExifData, GpsCoordinate } from '@types/index';

export interface CaptureResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  sha256?: string;
  exifData?: ExifData;
  error?: string;
}

export class CameraService {
  private static readonly DEFAULT_QUALITY = 0.8;
  private static readonly MIN_RESOLUTION = 1024;
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  public static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const locationGranted = 
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

        return cameraGranted && locationGranted;
      }
      return true; // iOS handles permissions through Info.plist and runtime prompts
    } catch (error) {
      console.error('❌ Failed to request camera permissions:', error);
      return false;
    }
  }

  public static async capturePhoto(
    projectId: string,
    options: {
      includeLocation?: boolean;
      enforceGPS?: boolean;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<CaptureResult> {
    try {
      // Check permissions first
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return {
          success: false,
          error: 'Camera and location permissions are required'
        };
      }

      // Get current location if required
      let currentLocation: GpsCoordinate | null = null;
      if (options.includeLocation !== false) {
        try {
          currentLocation = await LocationService.getCurrentLocation();
          
          if (options.enforceGPS && !currentLocation) {
            return {
              success: false,
              error: 'GPS location is required but unavailable. Please enable location services.'
            };
          }
        } catch (locationError) {
          console.warn('Failed to get location:', locationError);
          
          if (options.enforceGPS) {
            return {
              success: false,
              error: 'Failed to get GPS location. Please check location settings.'
            };
          }
        }
      }

      // Configure camera options
      const cameraOptions: CameraOptions = {
        mediaType: 'photo',
        quality: options.quality || this.DEFAULT_QUALITY,
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1080,
        includeBase64: false,
        includeExtra: true,
        saveToPhotos: false,
        durationLimit: 0,
        videoQuality: 'high',
      };

      // Launch camera
      const response = await this.launchCameraAsync(cameraOptions);
      
      if (!response.success || !response.assets?.[0]) {
        return {
          success: false,
          error: response.errorMessage || 'Failed to capture photo'
        };
      }

      const asset = response.assets[0];
      
      // Validate captured image
      const validation = await this.validateCapturedImage(asset);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Process and save the photo
      const processResult = await this.processAndSavePhoto(
        asset,
        projectId,
        currentLocation
      );

      return processResult;
    } catch (error: any) {
      console.error('❌ Camera capture failed:', error);
      return {
        success: false,
        error: error.message || 'Camera capture failed unexpectedly'
      };
    }
  }

  public static async selectFromLibrary(): Promise<CaptureResult> {
    try {
      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 1.0,
        includeBase64: false,
        includeExtra: true,
      };

      return new Promise((resolve) => {
        launchImageLibrary(options, (response) => {
          if (response.didCancel) {
            resolve({ success: false, error: 'User cancelled image selection' });
            return;
          }

          if (response.errorMessage) {
            resolve({ success: false, error: response.errorMessage });
            return;
          }

          if (!response.assets?.[0]) {
            resolve({ success: false, error: 'No image selected' });
            return;
          }

          // Note: Library photos may not have GPS data enforcement
          resolve({ 
            success: true, 
            filePath: response.assets[0].uri,
            fileSize: response.assets[0].fileSize 
          });
        });
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to select image from library'
      };
    }
  }

  private static launchCameraAsync(options: CameraOptions): Promise<ImagePickerResponse & { success: boolean }> {
    return new Promise((resolve) => {
      launchCamera(options, (response) => {
        resolve({
          ...response,
          success: !response.didCancel && !response.errorMessage
        });
      });
    });
  }

  private static async validateCapturedImage(asset: any): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Check if URI exists
      if (!asset.uri) {
        return { isValid: false, error: 'Invalid image URI' };
      }

      // Check file size
      if (asset.fileSize && asset.fileSize > this.MAX_FILE_SIZE) {
        return { 
          isValid: false, 
          error: `Image too large: ${FileService.formatFileSize(asset.fileSize)}. Maximum allowed: ${FileService.formatFileSize(this.MAX_FILE_SIZE)}` 
        };
      }

      // Check image dimensions
      if (asset.width && asset.height) {
        const minDimension = Math.min(asset.width, asset.height);
        if (minDimension < this.MIN_RESOLUTION) {
          return { 
            isValid: false, 
            error: `Image resolution too low: ${asset.width}x${asset.height}. Minimum: ${this.MIN_RESOLUTION}px` 
          };
        }
      }

      // Check if it's actually an image
      const mimeType = asset.type || '';
      if (!mimeType.startsWith('image/')) {
        return { isValid: false, error: 'Selected file is not an image' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Failed to validate image' };
    }
  }

  private static async processAndSavePhoto(
    asset: any,
    projectId: string,
    location: GpsCoordinate | null
  ): Promise<CaptureResult> {
    try {
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${projectId}_${timestamp}.jpg`;

      // Save photo to app storage
      const saveResult = await FileService.savePhoto(asset.uri, fileName, true);

      // Extract EXIF data
      const exifData = await this.extractExifData(
        saveResult.filePath,
        asset,
        location
      );

      // Validate GPS data if required
      if (!exifData.gps.latitude || !exifData.gps.longitude) {
        // Could still be valid if GPS enforcement is disabled
        console.warn('⚠️ Photo captured without GPS coordinates');
      }

      return {
        success: true,
        filePath: saveResult.filePath,
        fileSize: saveResult.fileSize,
        sha256: saveResult.sha256,
        exifData,
      };
    } catch (error: any) {
      console.error('❌ Failed to process photo:', error);
      return {
        success: false,
        error: error.message || 'Failed to process captured photo'
      };
    }
  }

  private static async extractExifData(
    filePath: string,
    asset: any,
    location: GpsCoordinate | null
  ): Promise<ExifData> {
    try {
      // Try to read EXIF from file
      let exifFromFile: any = {};
      try {
        exifFromFile = await ExifReader.getExif(filePath);
      } catch (exifError) {
        console.warn('Failed to read EXIF from file:', exifError);
      }

      // Get device information
      const deviceModel = await DeviceInfo.getModel();
      const deviceManufacturer = await DeviceInfo.getManufacturer();

      // Combine GPS data from multiple sources
      const gpsData = {
        latitude: location?.latitude || 
                  exifFromFile.GPS?.GPSLatitude || 
                  asset.latitude || 0,
        longitude: location?.longitude || 
                   exifFromFile.GPS?.GPSLongitude || 
                   asset.longitude || 0,
        altitude: location?.altitude || 
                  exifFromFile.GPS?.GPSAltitude || 
                  asset.altitude,
        accuracy: location?.accuracy,
      };

      // Build comprehensive EXIF data
      const exifData: ExifData = {
        gps: gpsData,
        timestamp: new Date().toISOString(),
        camera: {
          make: deviceManufacturer,
          model: deviceModel,
          orientation: exifFromFile.Image?.Orientation || 1,
        },
        technical: {
          width: asset.width || exifFromFile.Image?.ImageWidth || 0,
          height: asset.height || exifFromFile.Image?.ImageLength || 0,
          fileSize: asset.fileSize || 0,
          iso: exifFromFile.Image?.ISO,
          exposureTime: exifFromFile.Image?.ExposureTime,
          fNumber: exifFromFile.Image?.FNumber,
        },
      };

      return exifData;
    } catch (error) {
      console.error('❌ Failed to extract EXIF data:', error);
      
      // Return minimal EXIF data if extraction fails
      return {
        gps: {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          altitude: location?.altitude,
          accuracy: location?.accuracy,
        },
        timestamp: new Date().toISOString(),
        camera: {
          make: 'Unknown',
          model: 'Unknown',
        },
        technical: {
          width: asset.width || 0,
          height: asset.height || 0,
          fileSize: asset.fileSize || 0,
        },
      };
    }
  }

  // Utility methods
  public static async checkCameraAvailability(): Promise<{
    available: boolean;
    error?: string;
  }> {
    try {
      const hasCamera = await DeviceInfo.hasSystemFeature('android.hardware.camera');
      
      if (Platform.OS === 'ios' || hasCamera) {
        return { available: true };
      } else {
        return { available: false, error: 'Camera not available on this device' };
      }
    } catch (error) {
      return { available: false, error: 'Failed to check camera availability' };
    }
  }

  public static async validateGPSAccuracy(
    location: GpsCoordinate,
    maxAccuracy: number = 10
  ): Promise<{ isAccurate: boolean; accuracy: number }> {
    const accuracy = location.accuracy || Infinity;
    return {
      isAccurate: accuracy <= maxAccuracy,
      accuracy,
    };
  }

  public static showGPSRequiredAlert(): void {
    Alert.alert(
      'GPS Required',
      'High-accuracy GPS is required for evidence photos. Please:\n\n' +
      '1. Enable Location Services\n' +
      '2. Set location accuracy to "High" or "GPS only"\n' +
      '3. Ensure you are outdoors with clear sky view\n\n' +
      'Photos without GPS coordinates cannot be used for MRV verification.',
      [
        { text: 'Settings', onPress: () => {/* Open device settings */} },
        { text: 'OK', style: 'default' },
      ]
    );
  }

  public static showImageQualityAlert(): void {
    Alert.alert(
      'Image Quality Guidelines',
      'For best results:\n\n' +
      '• Hold device steady\n' +
      '• Ensure good lighting\n' +
      '• Focus on the subject\n' +
      '• Include reference objects for scale\n' +
      '• Take multiple angles if needed',
      [{ text: 'Got it', style: 'default' }]
    );
  }
}

export default CameraService;
