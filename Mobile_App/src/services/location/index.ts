import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import { GpsCoordinate } from '@types/index';

export class LocationService {
  private static watchId: number | null = null;
  private static lastKnownLocation: GpsCoordinate | null = null;
  
  // Configuration constants
  private static readonly HIGH_ACCURACY_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 10000,
    distanceFilter: 1,
    interval: 5000,
    fastestInterval: 2000,
  };

  private static readonly LOW_ACCURACY_OPTIONS = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 60000,
    distanceFilter: 10,
  };

  public static async requestLocationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Blue Carbon MRV needs precise location access to geo-tag photos and verify project areas.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          // Try coarse location as fallback
          const coarseGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            {
              title: 'Location Permission',
              message: 'At minimum, approximate location is needed for basic functionality.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return coarseGranted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      }
      return true; // iOS handles permissions through Info.plist and runtime prompts
    } catch (error) {
      console.error('❌ Failed to request location permissions:', error);
      return false;
    }
  }

  public static async getCurrentLocation(
    highAccuracy: boolean = true,
    timeout: number = 30000
  ): Promise<GpsCoordinate | null> {
    try {
      // Check permissions first
      const hasPermission = await this.checkLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const options = {
        ...(highAccuracy ? this.HIGH_ACCURACY_OPTIONS : this.LOW_ACCURACY_OPTIONS),
        timeout,
      };

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const location: GpsCoordinate = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude || undefined,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
              timestamp: position.timestamp,
            };

            this.lastKnownLocation = location;
            console.log('📍 Location acquired:', location);
            resolve(location);
          },
          (error) => {
            console.error('❌ Location error:', error);
            
            // Return last known location if available
            if (this.lastKnownLocation && error.code === 3) { // Timeout
              console.log('⏰ Using last known location due to timeout');
              resolve(this.lastKnownLocation);
            } else {
              reject(this.createLocationError(error));
            }
          },
          options
        );
      });
    } catch (error: any) {
      console.error('❌ Failed to get current location:', error);
      return null;
    }
  }

  public static startLocationTracking(
    onLocationUpdate: (location: GpsCoordinate) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        // Check permissions
        const hasPermission = await this.checkLocationPermission();
        if (!hasPermission) {
          onError?.('Location permission not granted');
          resolve(false);
          return;
        }

        // Stop existing tracking
        this.stopLocationTracking();

        this.watchId = Geolocation.watchPosition(
          (position) => {
            const location: GpsCoordinate = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude || undefined,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
              timestamp: position.timestamp,
            };

            this.lastKnownLocation = location;
            onLocationUpdate(location);
          },
          (error) => {
            console.error('❌ Location tracking error:', error);
            onError?.(this.createLocationError(error));
          },
          this.HIGH_ACCURACY_OPTIONS
        );

        console.log('📍 Location tracking started');
        resolve(true);
      } catch (error: any) {
        console.error('❌ Failed to start location tracking:', error);
        onError?.(error.message || 'Failed to start location tracking');
        resolve(false);
      }
    });
  }

  public static stopLocationTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('⏹️ Location tracking stopped');
    }
  }

  public static async checkLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const fineLocation = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarseLocation = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        return fineLocation || coarseLocation;
      }
      return true; // iOS permission checking is handled differently
    } catch (error) {
      console.error('❌ Failed to check location permission:', error);
      return false;
    }
  }

  public static async isLocationServicesEnabled(): Promise<boolean> {
    try {
      // This would need a native module to check properly
      // For now, we'll try to get location and see if it fails
      const location = await this.getCurrentLocation(false, 5000);
      return location !== null;
    } catch (error) {
      return false;
    }
  }

  public static getLastKnownLocation(): GpsCoordinate | null {
    return this.lastKnownLocation;
  }

  // Utility methods
  public static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  public static isPointInPolygon(
    point: [number, number],
    polygon: [number, number][]
  ): boolean {
    const x = point[0];
    const y = point[1];
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  public static formatCoordinates(latitude: number, longitude: number): string {
    const latDirection = latitude >= 0 ? 'N' : 'S';
    const lonDirection = longitude >= 0 ? 'E' : 'W';
    
    const latDegrees = Math.abs(latitude).toFixed(6);
    const lonDegrees = Math.abs(longitude).toFixed(6);
    
    return `${latDegrees}°${latDirection}, ${lonDegrees}°${lonDirection}`;
  }

  public static validateGPSAccuracy(
    location: GpsCoordinate,
    requiredAccuracy: number = 10
  ): { isValid: boolean; message: string } {
    if (!location.accuracy) {
      return {
        isValid: false,
        message: 'GPS accuracy information not available',
      };
    }

    if (location.accuracy > requiredAccuracy) {
      return {
        isValid: false,
        message: `GPS accuracy ${location.accuracy.toFixed(1)}m exceeds required ${requiredAccuracy}m`,
      };
    }

    return {
      isValid: true,
      message: `GPS accuracy: ${location.accuracy.toFixed(1)}m`,
    };
  }

  private static createLocationError(error: any): string {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return 'Location permission denied. Please grant location access in settings.';
      case 2: // POSITION_UNAVAILABLE
        return 'Location unavailable. Please check GPS settings and try again.';
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again.';
      default:
        return error.message || 'Unknown location error occurred.';
    }
  }

  // Alert helpers
  public static showLocationPermissionAlert(): void {
    Alert.alert(
      'Location Permission Required',
      'Blue Carbon MRV needs location access to geo-tag photos and verify project boundaries. This is essential for MRV data integrity.',
      [
        {
          text: 'Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  public static showLocationServicesAlert(): void {
    Alert.alert(
      'Location Services Disabled',
      'Please enable Location Services in your device settings for accurate GPS positioning.',
      [
        {
          text: 'Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('App-Prefs:Privacy&path=LOCATION');
            } else {
              Linking.openSettings();
            }
          },
        },
        { text: 'OK', style: 'default' },
      ]
    );
  }

  public static showHighAccuracyAlert(): void {
    Alert.alert(
      'Improve GPS Accuracy',
      'For better location accuracy:\n\n' +
      '• Move to an open area\n' +
      '• Ensure clear view of the sky\n' +
      '• Enable High Accuracy mode\n' +
      '• Wait for GPS signal to stabilize',
      [{ text: 'OK', style: 'default' }]
    );
  }
}

export default LocationService;
