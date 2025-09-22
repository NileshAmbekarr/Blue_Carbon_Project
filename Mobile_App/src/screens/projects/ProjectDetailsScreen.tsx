import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  FAB,
  SegmentedButtons,
  Surface,
  Badge,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapboxGL from '@mapbox/react-native-mapbox-gl';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useProjectStore } from '@store/projectStore';
import { usePhotoStore, getPhotoStats } from '@store/photoStore';
import { useAuthStore } from '@store/authStore';
import { LocationService } from '@services/location';
import { theme, statusColors } from '@utils/theme';
import { Project, PhotoRecord } from '@types/index';

const { width } = Dimensions.get('window');

const ProjectDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { projectId } = route.params as { projectId: string };
  
  const { projects, setCurrentProject } = useProjectStore();
  const { photos } = usePhotoStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState<Project | null>(
    projects.find(p => p.id === projectId) || null
  );

  const projectPhotos = photos.filter(photo => photo.projectId === projectId);
  const photoStats = getPhotoStats(projectPhotos);
  const canEdit = user?.role && ['admin', 'developer', 'ngo_staff'].includes(user.role);

  useEffect(() => {
    if (project) {
      setCurrentProject(project.id);
    }
    
    return () => {
      setCurrentProject(null);
    };
  }, [project, setCurrentProject]);

  useEffect(() => {
    const updatedProject = projects.find(p => p.id === projectId);
    if (updatedProject) {
      setProject(updatedProject);
    }
  }, [projects, projectId]);

  if (!project) {
    return (
      <View style={styles.notFoundContainer}>
        <Icon name="folder-remove" size={64} color={theme.custom.colors.gray400} />
        <Text style={styles.notFoundText}>Project not found</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const handleTakePhoto = () => {
    navigation.navigate('Camera');
  };

  const handleEditProject = () => {
    // Navigate to edit project screen
    Alert.alert('Edit Project', 'Edit project functionality coming soon');
  };

  const handleViewPhoto = (photo: PhotoRecord) => {
    navigation.navigate('PhotoDetails', { photoId: photo.id });
  };

  const renderHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.projectTitle}>{project.name}</Text>
            <Text style={styles.projectDescription}>{project.description}</Text>
            
            <View style={styles.headerMeta}>
              <Badge
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[project.status] }
                ]}
              >
                {project.status.toUpperCase()}
              </Badge>
              
              <Chip icon="leaf" style={styles.ecosystemChip}>
                {project.metadata.ecosystem}
              </Chip>
            </View>
          </View>
          
          {canEdit && (
            <IconButton
              icon="pencil"
              size={24}
              onPress={handleEditProject}
              style={styles.editButton}
            />
          )}
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{project.polygons.length}</Text>
            <Text style={styles.statLabel}>Plots</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{photoStats.total}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {project.polygons.reduce((sum, p) => sum + p.area, 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Hectares</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{photoStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Location Info */}
      <Card style={styles.infoCard}>
        <Card.Title
          title="Location"
          left={(props) => <Icon {...props} name="map-marker" />}
        />
        <Card.Content>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>State:</Text>
            <Text style={styles.locationValue}>{project.metadata.location.state}</Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>District:</Text>
            <Text style={styles.locationValue}>{project.metadata.location.district}</Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Village:</Text>
            <Text style={styles.locationValue}>{project.metadata.location.village}</Text>
          </View>
          
          {project.metadata.location.coordinates && (
            <Text style={styles.coordinatesText}>
              {LocationService.formatCoordinates(
                project.metadata.location.coordinates[1],
                project.metadata.location.coordinates[0]
              )}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Project Details */}
      <Card style={styles.infoCard}>
        <Card.Title
          title="Project Details"
          left={(props) => <Icon {...props} name="information" />}
        />
        <Card.Content>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{project.metadata.projectDuration} years</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Funding:</Text>
            <Text style={styles.detailValue}>{project.metadata.fundingSource || 'Not specified'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Partner:</Text>
            <Text style={styles.detailValue}>{project.metadata.implementationPartner}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(project.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Target Species */}
      {project.metadata.targetSpecies.length > 0 && (
        <Card style={styles.infoCard}>
          <Card.Title
            title="Target Species"
            left={(props) => <Icon {...props} name="leaf" />}
          />
          <Card.Content>
            <View style={styles.speciesContainer}>
              {project.metadata.targetSpecies.map((species, index) => (
                <Chip key={index} style={styles.speciesChip}>
                  {species}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderMapTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.mapCard}>
        <Card.Title
          title="Project Area"
          subtitle={`${project.polygons.length} polygon(s) defined`}
          left={(props) => <Icon {...props} name="map" />}
        />
        <Card.Content>
          <View style={styles.mapContainer}>
            <MapboxGL.MapView style={styles.map}>
              {project.metadata.location.coordinates && (
                <MapboxGL.Camera
                  zoomLevel={12}
                  centerCoordinate={project.metadata.location.coordinates}
                />
              )}
              
              {project.polygons.map((polygon, index) => (
                <MapboxGL.ShapeSource
                  key={polygon.id}
                  id={`polygon-${polygon.id}`}
                  shape={{
                    type: 'Feature',
                    geometry: polygon.geometry,
                    properties: { name: polygon.name },
                  }}
                >
                  <MapboxGL.FillLayer
                    id={`polygon-fill-${polygon.id}`}
                    style={{
                      fillColor: theme.custom.colors.mapPolygon,
                      fillOpacity: 0.3,
                    }}
                  />
                  <MapboxGL.LineLayer
                    id={`polygon-border-${polygon.id}`}
                    style={{
                      lineColor: theme.custom.colors.mapPolygonBorder,
                      lineWidth: 2,
                    }}
                  />
                </MapboxGL.ShapeSource>
              ))}
            </MapboxGL.MapView>
          </View>
          
          <View style={styles.polygonsList}>
            {project.polygons.map((polygon) => (
              <Surface key={polygon.id} style={styles.polygonItem}>
                <View style={styles.polygonInfo}>
                  <Text style={styles.polygonName}>{polygon.name}</Text>
                  <Text style={styles.polygonDetails}>
                    {polygon.type.replace('_', ' ')} • {polygon.area.toFixed(2)} ha
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  onPress={() => {/* Show polygon details */}}
                />
              </Surface>
            ))}
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderPhotosTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.photosCard}>
        <Card.Title
          title="Photos"
          subtitle={`${photoStats.total} photos captured`}
          left={(props) => <Icon {...props} name="camera" />}
          right={() => (
            <Button
              mode="outlined"
              compact
              onPress={handleTakePhoto}
              icon="camera-plus"
            >
              Add Photo
            </Button>
          )}
        />
        <Card.Content>
          {/* Photo Statistics */}
          <View style={styles.photoStats}>
            <View style={styles.photoStatItem}>
              <Text style={[styles.photoStatNumber, { color: statusColors.pending }]}>
                {photoStats.pending}
              </Text>
              <Text style={styles.photoStatLabel}>Pending</Text>
            </View>
            <View style={styles.photoStatItem}>
              <Text style={[styles.photoStatNumber, { color: theme.colors.primary }]}>
                {photoStats.uploading}
              </Text>
              <Text style={styles.photoStatLabel}>Uploading</Text>
            </View>
            <View style={styles.photoStatItem}>
              <Text style={[styles.photoStatNumber, { color: statusColors.completed }]}>
                {photoStats.uploaded}
              </Text>
              <Text style={styles.photoStatLabel}>Uploaded</Text>
            </View>
            <View style={styles.photoStatItem}>
              <Text style={[styles.photoStatNumber, { color: statusColors.failed }]}>
                {photoStats.failed}
              </Text>
              <Text style={styles.photoStatLabel}>Failed</Text>
            </View>
          </View>

          {/* Recent Photos */}
          {projectPhotos.length > 0 ? (
            <View style={styles.photosGrid}>
              {projectPhotos.slice(0, 6).map((photo) => (
                <Surface
                  key={photo.id}
                  style={styles.photoItem}
                  onTouchEnd={() => handleViewPhoto(photo)}
                >
                  <View style={styles.photoPlaceholder}>
                    <Icon name="image" size={24} color={theme.custom.colors.gray400} />
                  </View>
                  <Badge
                    style={[
                      styles.photoStatusBadge,
                      { backgroundColor: statusColors[photo.status] }
                    ]}
                    size={16}
                  />
                  <Text style={styles.photoDate} numberOfLines={1}>
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </Text>
                </Surface>
              ))}
            </View>
          ) : (
            <View style={styles.noPhotosContainer}>
              <Icon name="camera-plus" size={48} color={theme.custom.colors.gray400} />
              <Text style={styles.noPhotosText}>No photos captured yet</Text>
              <Text style={styles.noPhotosSubtext}>
                Take your first photo to start documenting this project
              </Text>
              <Button
                mode="contained"
                onPress={handleTakePhoto}
                style={styles.takePhotoButton}
                icon="camera"
              >
                Take Photo
              </Button>
            </View>
          )}
          
          {projectPhotos.length > 6 && (
            <Button
              mode="outlined"
              onPress={() => {/* Navigate to all photos */}}
              style={styles.viewAllButton}
            >
              View All Photos ({projectPhotos.length})
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'overview', label: 'Overview' },
          { value: 'map', label: 'Map' },
          { value: 'photos', label: 'Photos' },
        ]}
        style={styles.tabButtons}
      />

      <ScrollView style={styles.scrollView}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'map' && renderMapTab()}
        {activeTab === 'photos' && renderPhotosTab()}
      </ScrollView>

      <FAB
        icon="camera"
        style={styles.fab}
        onPress={handleTakePhoto}
        label="Take Photo"
      />
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
  headerCard: {
    margin: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  projectTitle: {
    fontSize: theme.custom.typography.sizes['2xl'],
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.xs,
  },
  projectDescription: {
    fontSize: theme.custom.typography.sizes.base,
    color: theme.custom.colors.gray600,
    lineHeight: 22,
    marginBottom: theme.custom.spacing.md,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.custom.spacing.md,
  },
  statusBadge: {
    marginRight: theme.custom.spacing.sm,
  },
  ecosystemChip: {
    backgroundColor: theme.custom.colors.accent + '20',
  },
  editButton: {
    marginLeft: theme.custom.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.custom.colors.gray200,
    paddingTop: theme.custom.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.custom.typography.sizes.lg,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray600,
    marginTop: theme.custom.spacing.xs,
  },
  tabButtons: {
    margin: theme.custom.spacing.md,
    marginTop: 0,
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
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.custom.spacing.sm,
  },
  locationLabel: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
  },
  locationValue: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.colors.text,
  },
  coordinatesText: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray500,
    fontFamily: 'monospace',
    marginTop: theme.custom.spacing.sm,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.custom.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
  },
  detailValue: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  speciesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  speciesChip: {
    marginRight: theme.custom.spacing.sm,
    marginBottom: theme.custom.spacing.sm,
  },
  mapCard: {
    marginBottom: theme.custom.spacing.md,
  },
  mapContainer: {
    height: 200,
    borderRadius: theme.custom.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.custom.spacing.md,
  },
  map: {
    flex: 1,
  },
  polygonsList: {
    marginTop: theme.custom.spacing.sm,
  },
  polygonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.custom.spacing.sm,
    marginBottom: theme.custom.spacing.xs,
    borderRadius: theme.custom.borderRadius.md,
  },
  polygonInfo: {
    flex: 1,
  },
  polygonName: {
    fontSize: theme.custom.typography.sizes.base,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.colors.text,
  },
  polygonDetails: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    textTransform: 'capitalize',
  },
  photosCard: {
    marginBottom: theme.custom.spacing.md,
  },
  photoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.custom.spacing.lg,
    paddingVertical: theme.custom.spacing.md,
    backgroundColor: theme.custom.colors.gray50,
    borderRadius: theme.custom.borderRadius.md,
  },
  photoStatItem: {
    alignItems: 'center',
  },
  photoStatNumber: {
    fontSize: theme.custom.typography.sizes.lg,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
  },
  photoStatLabel: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray600,
    marginTop: theme.custom.spacing.xs,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: (width - theme.custom.spacing.md * 3) / 3,
    aspectRatio: 1,
    marginBottom: theme.custom.spacing.sm,
    borderRadius: theme.custom.borderRadius.md,
    position: 'relative',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.custom.colors.gray100,
    borderRadius: theme.custom.borderRadius.md,
  },
  photoStatusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  photoDate: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 2,
    borderRadius: 2,
    textAlign: 'center',
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: theme.custom.spacing.xl,
  },
  noPhotosText: {
    fontSize: theme.custom.typography.sizes.base,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.custom.colors.gray600,
    marginTop: theme.custom.spacing.sm,
  },
  noPhotosSubtext: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray500,
    textAlign: 'center',
    marginTop: theme.custom.spacing.xs,
    marginBottom: theme.custom.spacing.lg,
  },
  takePhotoButton: {
    paddingHorizontal: theme.custom.spacing.lg,
  },
  viewAllButton: {
    marginTop: theme.custom.spacing.md,
  },
  fab: {
    position: 'absolute',
    right: theme.custom.spacing.md,
    bottom: theme.custom.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

export default ProjectDetailsScreen;
