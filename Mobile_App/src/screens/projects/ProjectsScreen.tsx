import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  Chip,
  Badge,
  FAB,
  Menu,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useProjectStore } from '@store/projectStore';
import { usePhotoStore } from '@store/photoStore';
import { useAuthStore } from '@store/authStore';
import { theme, commonStyles, statusColors } from '@utils/theme';
import { Project, ProjectStatus } from '@types/index';

const ProjectsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const { projects, loadProjects, isLoading, error } = useProjectStore();
  const { photos } = usePhotoStore();
  const { user } = useAuthStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [menuVisible, setMenuVisible] = useState(false);
  
  const userRole = user?.role || 'developer';
  const canCreateProject = ['admin', 'developer', 'ngo_staff', 'panchayat_officer'].includes(userRole);

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getProjectPhotoCount = (projectId: string) => {
    return photos.filter(photo => photo.projectId === projectId).length;
  };

  const getProjectPendingCount = (projectId: string) => {
    return photos.filter(photo => 
      photo.projectId === projectId && photo.status === 'pending'
    ).length;
  };

  const handleProjectPress = (project: Project) => {
    navigation.navigate('ProjectDetails', { projectId: project.id });
  };

  const handleCreateProject = () => {
    navigation.navigate('CreateProject');
  };

  const renderProjectCard = (project: Project) => {
    const photoCount = getProjectPhotoCount(project.id);
    const pendingCount = getProjectPendingCount(project.id);
    const polygonCount = project.polygons.length;

    return (
      <Card key={project.id} style={styles.projectCard}>
        <TouchableOpacity onPress={() => handleProjectPress(project)}>
          <Card.Content>
            <View style={styles.projectHeader}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectDescription} numberOfLines={2}>
                  {project.description || 'No description provided'}
                </Text>
              </View>
              
              <View style={styles.projectActions}>
                <Badge
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColors[project.status] }
                  ]}
                >
                  {project.status.toUpperCase()}
                </Badge>
              </View>
            </View>

            <View style={styles.projectMeta}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Icon name="map-marker" size={16} color={theme.custom.colors.gray600} />
                  <Text style={styles.metaText}>
                    {project.metadata.location.village || 'Location TBD'}
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Icon name="leaf" size={16} color={theme.custom.colors.gray600} />
                  <Text style={styles.metaText}>
                    {project.metadata.ecosystem}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Icon name="vector-polygon" size={16} color={theme.custom.colors.gray600} />
                  <Text style={styles.metaText}>
                    {polygonCount} {polygonCount === 1 ? 'plot' : 'plots'}
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Icon name="camera" size={16} color={theme.custom.colors.gray600} />
                  <Text style={styles.metaText}>
                    {photoCount} photos
                  </Text>
                </View>
                
                {pendingCount > 0 && (
                  <View style={styles.metaItem}>
                    <Icon name="clock-outline" size={16} color={statusColors.pending} />
                    <Text style={[styles.metaText, { color: statusColors.pending }]}>
                      {pendingCount} pending
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.projectDates}>
                <Text style={styles.dateText}>
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.dateText}>
                  Updated: {new Date(project.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderFilterChips = () => {
    const statusOptions: Array<{ key: ProjectStatus | 'all'; label: string }> = [
      { key: 'all', label: 'All' },
      { key: 'draft', label: 'Draft' },
      { key: 'active', label: 'Active' },
      { key: 'completed', label: 'Completed' },
      { key: 'suspended', label: 'Suspended' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {statusOptions.map(option => (
          <Chip
            key={option.key}
            selected={filterStatus === option.key}
            onPress={() => setFilterStatus(option.key)}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            {option.label}
          </Chip>
        ))}
      </ScrollView>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="folder-plus" size={64} color={theme.custom.colors.gray400} />
      <Text style={styles.emptyTitle}>No Projects Yet</Text>
      <Text style={styles.emptySubtitle}>
        {canCreateProject 
          ? 'Create your first project to start collecting MRV data'
          : 'Projects will appear here once created by your organization'
        }
      </Text>
      {canCreateProject && (
        <Button
          mode="contained"
          onPress={handleCreateProject}
          style={styles.emptyButton}
          icon="plus"
        >
          Create First Project
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search projects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleRefresh();
            }}
            title="Refresh"
            leadingIcon="refresh"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              // Navigate to project map view
            }}
            title="Map View"
            leadingIcon="map"
          />
        </Menu>
      </View>

      {renderFilterChips()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.projectsContainer}>
          {filteredProjects.length > 0 ? (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
                  {filterStatus !== 'all' && ` (${filterStatus})`}
                </Text>
              </View>
              
              {filteredProjects.map(renderProjectCard)}
            </>
          ) : (
            searchQuery || filterStatus !== 'all' ? (
              <View style={styles.noResultsContainer}>
                <Icon name="magnify" size={48} color={theme.custom.colors.gray400} />
                <Text style={styles.noResultsTitle}>No Results Found</Text>
                <Text style={styles.noResultsSubtitle}>
                  Try adjusting your search or filter criteria
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  style={styles.clearFiltersButton}
                >
                  Clear Filters
                </Button>
              </View>
            ) : (
              renderEmptyState()
            )
          )}
        </View>
      </ScrollView>

      {canCreateProject && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleCreateProject}
          label="New Project"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.custom.spacing.md,
    paddingVertical: theme.custom.spacing.sm,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  searchBar: {
    flex: 1,
    marginRight: theme.custom.spacing.sm,
  },
  filterContainer: {
    backgroundColor: theme.colors.surface,
    paddingBottom: theme.custom.spacing.sm,
  },
  filterContent: {
    paddingHorizontal: theme.custom.spacing.md,
  },
  filterChip: {
    marginRight: theme.custom.spacing.sm,
  },
  filterChipText: {
    fontSize: theme.custom.typography.sizes.sm,
  },
  scrollView: {
    flex: 1,
  },
  projectsContainer: {
    padding: theme.custom.spacing.md,
  },
  resultsHeader: {
    marginBottom: theme.custom.spacing.md,
  },
  resultsCount: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
  },
  projectCard: {
    marginBottom: theme.custom.spacing.md,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.custom.spacing.md,
  },
  projectInfo: {
    flex: 1,
    marginRight: theme.custom.spacing.sm,
  },
  projectName: {
    fontSize: theme.custom.typography.sizes.lg,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.xs,
  },
  projectDescription: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    lineHeight: 20,
  },
  projectActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    fontSize: theme.custom.typography.sizes.xs,
  },
  projectMeta: {
    borderTopWidth: 1,
    borderTopColor: theme.custom.colors.gray200,
    paddingTop: theme.custom.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.custom.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.custom.spacing.lg,
    marginBottom: theme.custom.spacing.xs,
  },
  metaText: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    marginLeft: theme.custom.spacing.xs,
  },
  projectDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.custom.spacing.xs,
  },
  dateText: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.custom.spacing['4xl'],
    paddingHorizontal: theme.custom.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.custom.typography.sizes.xl,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginTop: theme.custom.spacing.lg,
    marginBottom: theme.custom.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.custom.typography.sizes.base,
    color: theme.custom.colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.custom.spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: theme.custom.spacing.lg,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.custom.spacing['3xl'],
    paddingHorizontal: theme.custom.spacing.lg,
  },
  noResultsTitle: {
    fontSize: theme.custom.typography.sizes.lg,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginTop: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  noResultsSubtitle: {
    fontSize: theme.custom.typography.sizes.base,
    color: theme.custom.colors.gray600,
    textAlign: 'center',
    marginBottom: theme.custom.spacing.lg,
  },
  clearFiltersButton: {
    marginTop: theme.custom.spacing.md,
  },
  fab: {
    position: 'absolute',
    right: theme.custom.spacing.md,
    bottom: theme.custom.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

export default ProjectsScreen;
