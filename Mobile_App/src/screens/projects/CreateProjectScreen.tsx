import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  HelperText,
  SegmentedButtons,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import MapboxGL from '@mapbox/react-native-mapbox-gl';

import { useProjectStore } from '@store/projectStore';
import { useAuthStore } from '@store/authStore';
import { LocationService } from '@services/location';
import { theme, commonStyles } from '@utils/theme';
import { Project, ProjectMetadata, GpsCoordinate } from '@types/index';

// Initialize Mapbox
MapboxGL.setAccessToken('pk.YOUR_MAPBOX_ACCESS_TOKEN'); // Replace with actual token

interface CreateProjectForm {
  name: string;
  description: string;
  ecosystem: 'mangrove' | 'seagrass' | 'saltmarsh' | 'other';
  state: string;
  district: string;
  block: string;
  village: string;
  targetSpecies: string;
  estimatedArea: string;
  projectDuration: string;
  fundingSource: string;
}

const CreateProjectScreen: React.FC = () => {
  const navigation = useNavigation();
  const { createProject, isLoading } = useProjectStore();
  const { user } = useAuthStore();
  
  const mapRef = useRef<MapboxGL.MapView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<GpsCoordinate | null>(null);
  const [polygonCoordinates, setPolygonCoordinates] = useState<number[][]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<CreateProjectForm>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      ecosystem: 'mangrove',
      state: '',
      district: '',
      block: '',
      village: '',
      targetSpecies: '',
      estimatedArea: '',
      projectDuration: '10',
      fundingSource: '',
    },
  });

  const watchEcosystem = watch('ecosystem');

  const steps = [
    { title: 'Basic Info', subtitle: 'Project name and description' },
    { title: 'Location', subtitle: 'Geographic details' },
    { title: 'Map Area', subtitle: 'Draw project boundaries' },
    { title: 'Details', subtitle: 'Species and project specifics' },
  ];

  const ecosystemOptions = [
    { value: 'mangrove', label: 'Mangrove', icon: '🌿' },
    { value: 'seagrass', label: 'Seagrass', icon: '🌱' },
    { value: 'saltmarsh', label: 'Salt Marsh', icon: '🌾' },
    { value: 'other', label: 'Other', icon: '🏞️' },
  ];

  const handleLocationSelect = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setSelectedLocation(location);
        // Center map on current location
        if (mapRef.current) {
          mapRef.current.setCamera({
            centerCoordinate: [location.longitude, location.latitude],
            zoomLevel: 15,
            animationDuration: 1000,
          });
        }
      }
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get current location');
    }
  };

  const handleMapPress = (feature: any) => {
    if (!isDrawingMode) return;

    const coordinates = feature.geometry.coordinates;
    setPolygonCoordinates(prev => [...prev, coordinates]);
  };

  const clearPolygon = () => {
    setPolygonCoordinates([]);
  };

  const completePolygon = () => {
    if (polygonCoordinates.length < 3) {
      Alert.alert('Invalid Polygon', 'Please draw at least 3 points to create a polygon');
      return;
    }
    
    setIsDrawingMode(false);
    Alert.alert('Polygon Complete', `Created polygon with ${polygonCoordinates.length} points`);
  };

  const onSubmit = async (data: CreateProjectForm) => {
    try {
      if (!selectedLocation) {
        Alert.alert('Location Required', 'Please select a project location on the map');
        return;
      }

      if (polygonCoordinates.length < 3) {
        Alert.alert('Area Required', 'Please draw the project area on the map');
        return;
      }

      const projectMetadata: ProjectMetadata = {
        location: {
          state: data.state,
          district: data.district,
          block: data.block,
          village: data.village,
          coordinates: [selectedLocation.longitude, selectedLocation.latitude],
        },
        ecosystem: data.ecosystem,
        targetSpecies: data.targetSpecies.split(',').map(s => s.trim()),
        estimatedCarbonSequestration: 0, // Will be calculated later
        projectDuration: parseInt(data.projectDuration),
        fundingSource: data.fundingSource,
        implementationPartner: user?.organization?.name || '',
      };

      // Create polygon from coordinates
      const polygon = {
        type: 'Polygon' as const,
        coordinates: [
          [...polygonCoordinates, polygonCoordinates[0]], // Close the polygon
        ],
      };

      const projectId = await createProject({
        name: data.name,
        description: data.description,
        metadata: projectMetadata,
        polygons: [{
          name: 'Main Area',
          type: 'planting_area',
          geometry: polygon,
          area: calculatePolygonArea(polygonCoordinates), // Implement area calculation
        }],
      });

      Alert.alert(
        'Project Created',
        'Your project has been created successfully!',
        [
          {
            text: 'View Project',
            onPress: () => {
              navigation.replace('ProjectDetails', { projectId });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create project');
    }
  };

  const calculatePolygonArea = (coordinates: number[][]): number => {
    // Simplified area calculation - would need proper implementation
    return coordinates.length * 0.1; // Placeholder
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            index <= currentStep && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepNumber,
              index <= currentStep && styles.stepNumberActive
            ]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderBasicInfoStep = () => (
    <View style={styles.stepContent}>
      <Controller
        control={control}
        name="name"
        rules={{ required: 'Project name is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Project Name *"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.name}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Description"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
          </View>
        )}
      />

      <View style={styles.ecosystemContainer}>
        <Text style={styles.sectionLabel}>Ecosystem Type *</Text>
        <View style={styles.ecosystemChips}>
          {ecosystemOptions.map((option) => (
            <Chip
              key={option.value}
              selected={watchEcosystem === option.value}
              onPress={() => setValue('ecosystem', option.value as any)}
              style={styles.ecosystemChip}
              icon={() => <Text>{option.icon}</Text>}
            >
              {option.label}
            </Chip>
          ))}
        </View>
      </View>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Controller
        control={control}
        name="state"
        rules={{ required: 'State is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="State *"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.state}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.state}>
              {errors.state?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="district"
        rules={{ required: 'District is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="District *"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.district}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.district}>
              {errors.district?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="block"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Block/Tehsil"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="village"
        rules={{ required: 'Village is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Village/Area *"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.village}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.village}>
              {errors.village?.message}
            </HelperText>
          </View>
        )}
      />
    </View>
  );

  const renderMapStep = () => (
    <View style={styles.mapStepContent}>
      <Text style={styles.sectionLabel}>Draw Project Area</Text>
      <Text style={styles.mapInstructions}>
        1. Tap "Use Current Location" to center the map{'\n'}
        2. Enable drawing mode and tap on the map to create polygon points{'\n'}
        3. Complete the polygon when finished
      </Text>

      <View style={styles.mapControls}>
        <Button
          mode="outlined"
          onPress={handleLocationSelect}
          icon="crosshairs-gps"
          style={styles.mapButton}
        >
          Use Current Location
        </Button>
        
        <Button
          mode={isDrawingMode ? "contained" : "outlined"}
          onPress={() => setIsDrawingMode(!isDrawingMode)}
          icon="draw"
          style={styles.mapButton}
        >
          {isDrawingMode ? 'Stop Drawing' : 'Draw Area'}
        </Button>
      </View>

      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          ref={mapRef}
          style={styles.map}
          onPress={handleMapPress}
        >
          <MapboxGL.Camera
            zoomLevel={10}
            centerCoordinate={[77.5946, 12.9716]} // Default to Bangalore
          />
          
          {selectedLocation && (
            <MapboxGL.PointAnnotation
              id="currentLocation"
              coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
            >
              <View style={styles.locationMarker} />
            </MapboxGL.PointAnnotation>
          )}

          {polygonCoordinates.length > 0 && (
            <MapboxGL.ShapeSource
              id="polygonSource"
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [polygonCoordinates],
                },
                properties: {},
              }}
            >
              <MapboxGL.FillLayer
                id="polygonFill"
                style={{
                  fillColor: theme.custom.colors.mapPolygon,
                  fillOpacity: 0.3,
                }}
              />
              <MapboxGL.LineLayer
                id="polygonBorder"
                style={{
                  lineColor: theme.custom.colors.mapPolygonBorder,
                  lineWidth: 2,
                }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>
      </View>

      {polygonCoordinates.length > 0 && (
        <View style={styles.polygonControls}>
          <Text style={styles.polygonInfo}>
            Points: {polygonCoordinates.length}
          </Text>
          <View style={styles.polygonButtons}>
            <Button mode="outlined" onPress={clearPolygon}>
              Clear
            </Button>
            <Button
              mode="contained"
              onPress={completePolygon}
              disabled={polygonCoordinates.length < 3}
            >
              Complete
            </Button>
          </View>
        </View>
      )}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Controller
        control={control}
        name="targetSpecies"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Target Species (comma separated)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g., Avicennia marina, Rhizophora mucronata"
              style={styles.input}
            />
            <HelperText type="info">
              List the main species you plan to plant or restore
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="projectDuration"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Project Duration (years)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="fundingSource"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Funding Source"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
            />
          </View>
        )}
      />
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderBasicInfoStep();
      case 1: return renderLocationStep();
      case 2: return renderMapStep();
      case 3: return renderDetailsStep();
      default: return renderBasicInfoStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {renderStepIndicator()}
        
        <ScrollView style={styles.scrollView}>
          <Card style={styles.formCard}>
            <Card.Content>
              {renderCurrentStep()}
            </Card.Content>
          </Card>
        </ScrollView>

        <View style={styles.navigationButtons}>
          <Button
            mode="outlined"
            onPress={prevStep}
            disabled={currentStep === 0}
            style={styles.navButton}
          >
            Previous
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValid}
              style={styles.navButton}
            >
              Create Project
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={nextStep}
              style={styles.navButton}
            >
              Next
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  stepIndicator: {
    backgroundColor: theme.colors.surface,
    padding: theme.custom.spacing.md,
    elevation: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.custom.spacing.sm,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.custom.colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.custom.spacing.md,
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  stepNumber: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.custom.typography.sizes.base,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.colors.text,
  },
  stepSubtitle: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    margin: theme.custom.spacing.md,
    marginBottom: 0,
  },
  stepContent: {
    padding: theme.custom.spacing.sm,
  },
  mapStepContent: {
    padding: theme.custom.spacing.sm,
  },
  inputContainer: {
    marginBottom: theme.custom.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  sectionLabel: {
    fontSize: theme.custom.typography.sizes.base,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.sm,
  },
  ecosystemContainer: {
    marginBottom: theme.custom.spacing.md,
  },
  ecosystemChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ecosystemChip: {
    marginRight: theme.custom.spacing.sm,
    marginBottom: theme.custom.spacing.sm,
  },
  mapInstructions: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    marginBottom: theme.custom.spacing.md,
    lineHeight: 20,
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.custom.spacing.md,
  },
  mapButton: {
    flex: 0.48,
  },
  mapContainer: {
    height: 300,
    borderRadius: theme.custom.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.custom.spacing.md,
  },
  map: {
    flex: 1,
  },
  locationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: 'white',
  },
  polygonControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  polygonInfo: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.colors.text,
  },
  polygonButtons: {
    flexDirection: 'row',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.custom.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 4,
  },
  navButton: {
    flex: 0.48,
  },
});

export default CreateProjectScreen;
