import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Chip,
  Surface,
  TextInput,
  HelperText,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { usePhotoStore } from '@store/photoStore';
import { useProjectStore } from '@store/projectStore';
import { LocationService } from '@services/location';
import { theme, statusColors } from '@utils/theme';
import { Measurements, PhotoMetadata } from '@types/index';

const { width } = Dimensions.get('window');

interface MetadataForm {
  species: string;
  count: string;
  survivalRate: string;
  diameter: string;
  height: string;
  healthStatus: 'healthy' | 'stressed' | 'dying' | 'dead';
  description: string;
  witnessName: string;
  witnessPhone: string;
  tags: string;
}

const PhotoDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { photoId } = route.params as { photoId: string };
  
  const { photos, updateMeasurements, updateMetadata, syncPhoto } = usePhotoStore();
  const { projects } = useProjectStore();
  
  const [photo, setPhoto] = useState(photos.find(p => p.id === photoId));
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<MetadataForm>({
    defaultValues: {
      species: photo?.measurements?.species || '',
      count: photo?.measurements?.count?.toString() || '',
      survivalRate: photo?.measurements?.survivalRate?.toString() || '',
      diameter: photo?.measurements?.diameter?.toString() || '',
      height: photo?.measurements?.height?.toString() || '',
      healthStatus: photo?.measurements?.healthStatus || 'healthy',
      description: photo?.metadata?.description || '',
      witnessName: photo?.metadata?.witnessName || '',
      witnessPhone: photo?.metadata?.witnessPhone || '',
      tags: photo?.metadata?.tags?.join(', ') || '',
    },
  });

  useEffect(() => {
    // Update photo if it changes in store
    const updatedPhoto = photos.find(p => p.id === photoId);
    if (updatedPhoto) {
      setPhoto(updatedPhoto);
    }
  }, [photos, photoId]);

  if (!photo) {
    return (
      <View style={styles.notFoundContainer}>
        <Icon name="image-off" size={64} color={theme.custom.colors.gray400} />
        <Text style={styles.notFoundText}>Photo not found</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const project = projects.find(p => p.id === photo.projectId);

  const handleSave = async (data: MetadataForm) => {
    try {
      // Update measurements
      const measurements: Measurements = {
        species: data.species || undefined,
        count: data.count ? parseInt(data.count) : undefined,
        survivalRate: data.survivalRate ? parseFloat(data.survivalRate) : undefined,
        diameter: data.diameter ? parseFloat(data.diameter) : undefined,
        height: data.height ? parseFloat(data.height) : undefined,
        healthStatus: data.healthStatus,
        notes: data.description,
      };

      await updateMeasurements(photo.id, measurements);

      // Update metadata
      const metadata: Partial<PhotoMetadata> = {
        description: data.description,
        witnessName: data.witnessName || undefined,
        witnessPhone: data.witnessPhone || undefined,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };

      await updateMetadata(photo.id, metadata);

      setIsEditing(false);
      Alert.alert('Success', 'Photo metadata updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update metadata');
    }
  };

  const handleSync = async () => {
    try {
      Alert.alert(
        'Sync Photo',
        'This will upload the photo and metadata to the server. Continue?',
        [
          { text: 'Cancel' },
          {
            text: 'Sync',
            onPress: async () => {
              await syncPhoto(photo.id);
              Alert.alert('Success', 'Photo queued for sync');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sync photo');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // deletePhoto(photo.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderPhotoHeader = () => (
    <View style={styles.photoHeader}>
      <Image
        source={{ uri: `file://${photo.localFilePath}` }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      
      <View style={styles.photoOverlay}>
        <View style={styles.photoInfo}>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: statusColors[photo.status] }
            ]}
            textStyle={{ color: 'white' }}
          >
            {photo.status.toUpperCase()}
          </Chip>
          
          <Text style={styles.photoDate}>
            {new Date(photo.createdAt).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.photoActions}>
          <IconButton
            icon="pencil"
            size={24}
            iconColor="white"
            style={styles.actionButton}
            onPress={() => setIsEditing(!isEditing)}
          />
          <IconButton
            icon="sync"
            size={24}
            iconColor="white"
            style={styles.actionButton}
            onPress={handleSync}
            disabled={photo.status === 'uploaded'}
          />
          <IconButton
            icon="delete"
            size={24}
            iconColor="white"
            style={styles.actionButton}
            onPress={handleDelete}
          />
        </View>
      </View>
    </View>
  );

  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
      {/* Project Info */}
      <Card style={styles.infoCard}>
        <Card.Title
          title="Project"
          subtitle={project?.name || 'Unknown Project'}
          left={(props) => <Icon {...props} name="folder" size={24} />}
        />
      </Card>

      {/* Location Info */}
      <Card style={styles.infoCard}>
        <Card.Title
          title="Location"
          left={(props) => <Icon {...props} name="map-marker" size={24} />}
        />
        <Card.Content>
          <Text style={styles.coordText}>
            {LocationService.formatCoordinates(
              photo.exifData.gps.latitude,
              photo.exifData.gps.longitude
            )}
          </Text>
          {photo.exifData.gps.accuracy && (
            <Text style={styles.accuracyText}>
              Accuracy: {photo.exifData.gps.accuracy.toFixed(1)}m
            </Text>
          )}
          {photo.exifData.gps.altitude && (
            <Text style={styles.accuracyText}>
              Altitude: {photo.exifData.gps.altitude.toFixed(1)}m
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Technical Info */}
      <Card style={styles.infoCard}>
        <Card.Title
          title="Technical Details"
          left={(props) => <Icon {...props} name="camera" size={24} />}
        />
        <Card.Content>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Size:</Text>
            <Text style={styles.techValue}>
              {photo.exifData.technical.width} × {photo.exifData.technical.height}
            </Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>File Size:</Text>
            <Text style={styles.techValue}>
              {(photo.fileSize / 1024 / 1024).toFixed(2)} MB
            </Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Device:</Text>
            <Text style={styles.techValue}>
              {photo.exifData.camera.make} {photo.exifData.camera.model}
            </Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Hash:</Text>
            <Text style={[styles.techValue, styles.hashText]} numberOfLines={1}>
              {photo.sha256}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderMeasurementsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.formCard}>
        <Card.Title title="Species & Measurements" />
        <Card.Content>
          <Controller
            control={control}
            name="species"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Species"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  disabled={!isEditing}
                  style={styles.input}
                />
              </View>
            )}
          />

          <View style={styles.inputRow}>
            <Controller
              control={control}
              name="count"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    label="Count"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="survivalRate"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    label="Survival Rate (%)"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </View>
              )}
            />
          </View>

          <View style={styles.inputRow}>
            <Controller
              control={control}
              name="diameter"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    label="Diameter (cm)"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="height"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    label="Height (m)"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    disabled={!isEditing}
                    style={styles.input}
                  />
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="healthStatus"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.segmentLabel}>Health Status</Text>
                <SegmentedButtons
                  value={value}
                  onValueChange={onChange}
                  buttons={[
                    { value: 'healthy', label: 'Healthy' },
                    { value: 'stressed', label: 'Stressed' },
                    { value: 'dying', label: 'Dying' },
                    { value: 'dead', label: 'Dead' },
                  ]}
                  disabled={!isEditing}
                />
              </View>
            )}
          />
        </Card.Content>
      </Card>
    </View>
  );

  const renderMetadataTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.formCard}>
        <Card.Title title="Additional Information" />
        <Card.Content>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Description/Notes"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  disabled={!isEditing}
                  style={styles.input}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="witnessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Witness Name"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  disabled={!isEditing}
                  style={styles.input}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="witnessPhone"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Witness Phone"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  disabled={!isEditing}
                  style={styles.input}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="tags"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Tags (comma separated)"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  disabled={!isEditing}
                  style={styles.input}
                />
                <HelperText type="info">
                  Add tags to help organize and search photos
                </HelperText>
              </View>
            )}
          />
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderPhotoHeader()}
      
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'details', label: 'Details' },
          { value: 'measurements', label: 'Measurements' },
          { value: 'metadata', label: 'Metadata' },
        ]}
        style={styles.tabButtons}
      />

      <ScrollView style={styles.scrollView}>
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'measurements' && renderMeasurementsTab()}
        {activeTab === 'metadata' && renderMetadataTab()}
      </ScrollView>

      {isEditing && (
        <View style={styles.editActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setIsEditing(false);
              reset();
            }}
            style={styles.actionButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit(handleSave)}
            disabled={!isDirty}
            style={styles.actionButton}
          >
            Save Changes
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.custom.spacing.xl,
  },
  notFoundText: {
    fontSize: theme.custom.typography.sizes.lg,
    color: theme.custom.colors.gray600,
    marginVertical: theme.custom.spacing.lg,
  },
  photoHeader: {
    position: 'relative',
  },
  photoImage: {
    width: width,
    height: width * 0.75,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.custom.spacing.md,
  },
  photoInfo: {
    flex: 1,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: theme.custom.spacing.sm,
  },
  photoDate: {
    color: 'white',
    fontSize: theme.custom.typography.sizes.sm,
  },
  photoActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    marginLeft: theme.custom.spacing.xs,
  },
  tabButtons: {
    margin: theme.custom.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: theme.custom.spacing.md,
  },
  infoCard: {
    marginBottom: theme.custom.spacing.md,
  },
  coordText: {
    fontSize: theme.custom.typography.sizes.base,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.xs,
  },
  accuracyText: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.custom.spacing.xs,
  },
  techLabel: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
  },
  techValue: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: theme.custom.typography.sizes.xs,
  },
  formCard: {
    marginBottom: theme.custom.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.custom.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  segmentLabel: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.sm,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.custom.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 4,
  },
});

export default PhotoDetailsScreen;
