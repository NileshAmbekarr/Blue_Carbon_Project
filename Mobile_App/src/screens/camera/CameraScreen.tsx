import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  BackHandler,
} from 'react-native';
import {
  Text,
  Button,
  IconButton,
  Surface,
  Badge,
} from 'react-native-paper';
import { RNCamera } from 'react-native-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { CameraService } from '@services/camera';
import { LocationService } from '@services/location';
import { useProjectStore } from '@store/projectStore';
import { usePhotoStore } from '@store/photoStore';
import { theme } from '@utils/theme';
import { GpsCoordinate } from '@types/index';

const { width, height } = Dimensions.get('window');

const CameraScreen: React.FC = () => {
  const navigation = useNavigation();
  const cameraRef = useRef<RNCamera>(null);
  
  const { currentProject, projects } = useProjectStore();
  const { capturePhoto } = usePhotoStore();
  
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState(RNCamera.Constants.FlashMode.auto);
  const [currentLocation, setCurrentLocation] = useState<GpsCoordinate | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState(currentProject);

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  useEffect(() => {
    initializeCamera();
    startLocationTracking();
    
    return () => {
      stopLocationTracking();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const hasPermissions = await CameraService.requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'Camera and location permissions are required to capture geo-tagged photos.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Retry', onPress: initializeCamera },
          ]
        );
        return;
      }
      
      setIsReady(true);
    } catch (error) {
      console.error('Camera initialization failed:', error);
      Alert.alert('Camera Error', 'Failed to initialize camera');
    }
  };

  const startLocationTracking = async () => {
    try {
      await LocationService.startLocationTracking(
        (location) => {
          setCurrentLocation(location);
          setGpsAccuracy(location.accuracy || null);
        },
        (error) => {
          console.warn('Location tracking error:', error);
        }
      );
    } catch (error) {
      console.error('Failed to start location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    LocationService.stopLocationTracking();
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    if (!selectedProject) {
      Alert.alert(
        'Select Project',
        'Please select a project before capturing photos.',
        [
          { text: 'Cancel' },
          { text: 'Select', onPress: showProjectSelector },
        ]
      );
      return;
    }

    // Validate GPS accuracy
    if (currentLocation && gpsAccuracy && gpsAccuracy > 10) {
      Alert.alert(
        'GPS Accuracy Warning',
        `Current GPS accuracy is ${gpsAccuracy.toFixed(1)}m. For better accuracy, move to an open area with clear sky view.`,
        [
          { text: 'Cancel' },
          { text: 'Capture Anyway', onPress: () => performCapture() },
        ]
      );
      return;
    }

    if (!currentLocation) {
      Alert.alert(
        'GPS Required',
        'GPS location is required for evidence photos. Please wait for GPS signal or check location settings.',
        [
          { text: 'Cancel' },
          { text: 'Retry', onPress: () => setTimeout(handleCapture, 2000) },
        ]
      );
      return;
    }

    await performCapture();
  };

  const performCapture = async () => {
    if (!cameraRef.current || !selectedProject) return;

    setIsCapturing(true);

    try {
      const options = {
        quality: 0.8,
        base64: false,
        skipProcessing: false,
        orientation: 'portrait' as const,
        fixOrientation: true,
      };

      const data = await cameraRef.current.takePictureAsync(options);
      
      // Process with camera service for EXIF and validation
      const result = await CameraService.capturePhoto(selectedProject.id, {
        includeLocation: true,
        enforceGPS: true,
        quality: 0.8,
      });

      if (result.success && result.filePath) {
        // Store photo with metadata
        const photoId = await capturePhoto({
          projectId: selectedProject.id,
          filePath: result.filePath,
          fileSize: result.fileSize || 0,
          sha256: result.sha256 || '',
          exifData: result.exifData!,
        });

        // Navigate to photo details
        navigation.navigate('PhotoDetails', { photoId });
      } else {
        throw new Error(result.error || 'Failed to capture photo');
      }
    } catch (error: any) {
      console.error('Photo capture failed:', error);
      Alert.alert(
        'Capture Failed',
        error.message || 'Failed to capture photo. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const showProjectSelector = () => {
    const projectOptions = projects.map(project => ({
      text: project.name,
      onPress: () => setSelectedProject(project),
    }));

    Alert.alert(
      'Select Project',
      'Choose a project for this photo:',
      [
        ...projectOptions,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleFlash = () => {
    const flashModes = [
      RNCamera.Constants.FlashMode.off,
      RNCamera.Constants.FlashMode.on,
      RNCamera.Constants.FlashMode.auto,
    ];
    const currentIndex = flashModes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % flashModes.length;
    setFlashMode(flashModes[nextIndex]);
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case RNCamera.Constants.FlashMode.on:
        return 'flash';
      case RNCamera.Constants.FlashMode.off:
        return 'flash-off';
      case RNCamera.Constants.FlashMode.auto:
        return 'flash-auto';
      default:
        return 'flash-auto';
    }
  };

  const getGpsStatusColor = () => {
    if (!currentLocation) return theme.colors.error;
    if (!gpsAccuracy) return theme.colors.warning;
    if (gpsAccuracy <= 5) return theme.custom.colors.success;
    if (gpsAccuracy <= 10) return theme.colors.warning;
    return theme.colors.error;
  };

  const getGpsStatusText = () => {
    if (!currentLocation) return 'No GPS';
    if (!gpsAccuracy) return 'GPS Found';
    return `${gpsAccuracy.toFixed(1)}m`;
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing Camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Camera Preview */}
      <RNCamera
        ref={cameraRef}
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        flashMode={flashMode}
        captureAudio={false}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
      >
        {/* Top Overlay */}
        <SafeAreaView style={styles.topOverlay}>
          <View style={styles.topControls}>
            <IconButton
              icon="close"
              size={24}
              iconColor="white"
              onPress={() => navigation.goBack()}
            />
            
            <View style={styles.topInfo}>
              {selectedProject && (
                <Surface style={styles.projectBadge}>
                  <Text style={styles.projectText} numberOfLines={1}>
                    {selectedProject.name}
                  </Text>
                </Surface>
              )}
              
              <Surface style={[styles.gpsBadge, { backgroundColor: getGpsStatusColor() }]}>
                <Icon name="crosshairs-gps" size={16} color="white" />
                <Text style={styles.gpsText}>{getGpsStatusText()}</Text>
              </Surface>
            </View>

            <IconButton
              icon={getFlashIcon()}
              size={24}
              iconColor="white"
              onPress={toggleFlash}
            />
          </View>
        </SafeAreaView>

        {/* Center Guidelines */}
        <View style={styles.guidelines}>
          <View style={styles.guideline} />
          <View style={[styles.guideline, styles.guidelineHorizontal]} />
        </View>

        {/* Bottom Overlay */}
        <View style={styles.bottomOverlay}>
          <View style={styles.bottomControls}>
            <IconButton
              icon="image-multiple"
              size={32}
              iconColor="white"
              onPress={() => {/* Navigate to photo gallery */}}
            />

            <View style={styles.captureButtonContainer}>
              <IconButton
                icon="camera"
                size={48}
                iconColor="white"
                style={[
                  styles.captureButton,
                  isCapturing && styles.captureButtonActive
                ]}
                onPress={handleCapture}
                disabled={isCapturing}
              />
              {isCapturing && (
                <View style={styles.capturingIndicator}>
                  <Text style={styles.capturingText}>Capturing...</Text>
                </View>
              )}
            </View>

            <IconButton
              icon="folder-outline"
              size={32}
              iconColor="white"
              onPress={showProjectSelector}
            />
          </View>

          {/* Info Panel */}
          <Surface style={styles.infoPanel}>
            <View style={styles.infoRow}>
              <Icon name="information" size={16} color={theme.custom.colors.gray600} />
              <Text style={styles.infoText}>
                Ensure good lighting and GPS accuracy for best results
              </Text>
            </View>
            
            {currentLocation && (
              <View style={styles.infoRow}>
                <Icon name="map-marker" size={16} color={theme.custom.colors.gray600} />
                <Text style={styles.infoText}>
                  {LocationService.formatCoordinates(
                    currentLocation.latitude,
                    currentLocation.longitude
                  )}
                </Text>
              </View>
            )}
          </Surface>
        </View>
      </RNCamera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
    fontSize: theme.custom.typography.sizes.lg,
  },
  preview: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.custom.spacing.md,
    paddingTop: theme.custom.spacing.sm,
  },
  topInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.custom.spacing.md,
  },
  projectBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: theme.custom.spacing.sm,
    paddingVertical: theme.custom.spacing.xs,
    borderRadius: theme.custom.borderRadius.md,
    marginBottom: theme.custom.spacing.xs,
    maxWidth: width * 0.6,
  },
  projectText: {
    color: 'white',
    fontSize: theme.custom.typography.sizes.sm,
    textAlign: 'center',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.custom.spacing.sm,
    paddingVertical: theme.custom.spacing.xs,
    borderRadius: theme.custom.borderRadius.md,
  },
  gpsText: {
    color: 'white',
    fontSize: theme.custom.typography.sizes.xs,
    marginLeft: theme.custom.spacing.xs,
  },
  guidelines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideline: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 1,
    height: '100%',
  },
  guidelineHorizontal: {
    width: '100%',
    height: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.custom.spacing.lg,
    paddingHorizontal: theme.custom.spacing.md,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 40,
    margin: 0,
  },
  captureButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  capturingIndicator: {
    marginTop: theme.custom.spacing.xs,
  },
  capturingText: {
    color: 'white',
    fontSize: theme.custom.typography.sizes.sm,
    textAlign: 'center',
  },
  infoPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: theme.custom.spacing.md,
    paddingVertical: theme.custom.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.custom.spacing.xs,
  },
  infoText: {
    color: 'white',
    fontSize: theme.custom.typography.sizes.xs,
    marginLeft: theme.custom.spacing.sm,
    flex: 1,
  },
});

export default CameraScreen;
