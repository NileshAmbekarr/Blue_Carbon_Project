import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Avatar,
  Badge,
  IconButton,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuthStore } from '@store/authStore';
import { useProjectStore } from '@store/projectStore';
import { useSyncStore } from '@store/syncStore';
import { theme, commonStyles, roleColors, statusColors } from '@utils/theme';
import { SyncService } from '@services/sync';
import { DatabaseService } from '@services/database';
import { LocationService } from '@services/location';

const DashboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, loadProjects, isLoading: projectsLoading } = useProjectStore();
  const { syncStatus, lastSyncTime, pendingCount } = useSyncStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingPhotos: 0,
    completedUploads: 0,
    storageUsed: '0 MB',
  });

  const userRole = user?.role || 'developer';
  const userColor = roleColors[userRole] || theme.colors.primary;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await loadProjects();
      await loadStats();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const db = DatabaseService.getInstance();
      
      // Get project stats
      const allProjects = await db.getProjects();
      const activeProjects = allProjects.filter(p => p.status === 'active');
      
      // Get photo stats
      const allPhotos = await db.getPhotos();
      const pendingPhotos = allPhotos.filter(p => p.status === 'pending');
      const completedPhotos = allPhotos.filter(p => p.status === 'uploaded');
      
      // Get storage usage
      const storageUsage = await db.getStorageSize();
      
      setStats({
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        pendingPhotos: pendingPhotos.length,
        completedUploads: completedPhotos.length,
        storageUsed: formatBytes(storageUsage),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleSyncNow = async () => {
    try {
      Alert.alert(
        'Manual Sync',
        'This will attempt to sync all pending data. Make sure you have a good internet connection.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sync',
            onPress: async () => {
              await SyncService.getInstance().forceSyncNow();
              await loadStats();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to start sync. Please try again.');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames = {
      admin: 'Administrator',
      auditor: 'Auditor',
      developer: 'Project Developer',
      ngo_staff: 'NGO Staff',
      panchayat_officer: 'Panchayat Officer',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[userColor]}
          />
        }
      >
        {/* Header Section */}
        <Surface style={[styles.headerCard, { backgroundColor: userColor }]}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={60}
                label={user?.profile?.firstName?.charAt(0) || 'U'}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.greeting}>
                  {getGreeting()}, {user?.profile?.firstName || 'User'}!
                </Text>
                <Text style={styles.roleText}>
                  {getRoleDisplayName(userRole)}
                </Text>
                {user?.organization && (
                  <Text style={styles.organizationText}>
                    {user.organization.name}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Sync Status */}
            <View style={styles.syncStatus}>
              <View style={styles.syncInfo}>
                <Icon
                  name={syncStatus === 'syncing' ? 'sync' : 'sync-off'}
                  size={20}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.syncText}>
                  {syncStatus === 'syncing' ? 'Syncing...' : `${pendingCount} pending`}
                </Text>
              </View>
              {pendingCount > 0 && (
                <IconButton
                  icon="sync"
                  size={24}
                  iconColor={theme.colors.onPrimary}
                  onPress={handleSyncNow}
                />
              )}
            </View>
          </View>
        </Surface>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="folder-multiple" size={32} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{stats.totalProjects}</Text>
              <Text style={styles.statLabel}>Total Projects</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="camera" size={32} color={statusColors.pending} />
              <Text style={styles.statNumber}>{stats.pendingPhotos}</Text>
              <Text style={styles.statLabel}>Pending Photos</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="check-circle" size={32} color={statusColors.completed} />
              <Text style={styles.statNumber}>{stats.completedUploads}</Text>
              <Text style={styles.statLabel}>Uploaded</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="harddisk" size={32} color={theme.custom.colors.gray600} />
              <Text style={styles.statNumber}>{stats.storageUsed}</Text>
              <Text style={styles.statLabel}>Storage Used</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Projects */}
        <Card style={styles.sectionCard}>
          <Card.Title
            title="Recent Projects"
            subtitle={`${stats.activeProjects} active projects`}
            left={(props) => <Icon {...props} name="folder-outline" size={24} />}
            right={(props) => (
              <IconButton
                {...props}
                icon="arrow-right"
                onPress={() => {/* Navigate to projects screen */}}
              />
            )}
          />
          <Card.Content>
            {projects.slice(0, 3).map((project) => (
              <Surface key={project.id} style={styles.projectItem}>
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectDescription} numberOfLines={1}>
                    {project.description}
                  </Text>
                  <View style={styles.projectMeta}>
                    <Badge
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColors[project.status] }
                      ]}
                    >
                      {project.status.toUpperCase()}
                    </Badge>
                    <Text style={styles.projectDate}>
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  onPress={() => {/* Navigate to project details */}}
                />
              </Surface>
            ))}
            
            {projects.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="folder-plus" size={48} color={theme.custom.colors.gray400} />
                <Text style={styles.emptyStateText}>No projects yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create your first project to start capturing data
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.sectionCard}>
          <Card.Title
            title="Quick Actions"
            left={(props) => <Icon {...props} name="lightning-bolt" size={24} />}
          />
          <Card.Content>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="camera"
                onPress={() => {/* Navigate to camera */}}
                style={styles.actionButton}
              >
                Capture Photo
              </Button>
              
              <Button
                mode="outlined"
                icon="folder-plus"
                onPress={() => {/* Navigate to create project */}}
                style={styles.actionButton}
              >
                New Project
              </Button>
              
              <Button
                mode="outlined"
                icon="map"
                onPress={() => {/* Navigate to map */}}
                style={styles.actionButton}
              >
                View Map
              </Button>
              
              <Button
                mode="outlined"
                icon="sync"
                onPress={handleSyncNow}
                disabled={pendingCount === 0}
                style={styles.actionButton}
              >
                Sync Data
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* System Status */}
        <Card style={[styles.sectionCard, styles.lastCard]}>
          <Card.Title
            title="System Status"
            left={(props) => <Icon {...props} name="information" size={24} />}
          />
          <Card.Content>
            <View style={styles.statusItem}>
              <View style={styles.statusInfo}>
                <Icon name="wifi" size={20} color={theme.custom.colors.gray600} />
                <Text style={styles.statusText}>Network</Text>
              </View>
              <Badge style={styles.onlineBadge}>Online</Badge>
            </View>
            
            <View style={styles.statusItem}>
              <View style={styles.statusInfo}>
                <Icon name="crosshairs-gps" size={20} color={theme.custom.colors.gray600} />
                <Text style={styles.statusText}>GPS</Text>
              </View>
              <Badge style={styles.onlineBadge}>Ready</Badge>
            </View>
            
            <View style={styles.statusItem}>
              <View style={styles.statusInfo}>
                <Icon name="clock-outline" size={20} color={theme.custom.colors.gray600} />
                <Text style={styles.statusText}>Last Sync</Text>
              </View>
              <Text style={styles.statusValue}>
                {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 0,
    marginBottom: theme.custom.spacing.md,
    borderRadius: 0,
    elevation: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.custom.spacing.lg,
    paddingTop: theme.custom.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: theme.custom.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.custom.typography.sizes.lg,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.onPrimary,
    marginBottom: theme.custom.spacing.xs,
  },
  roleText: {
    fontSize: theme.custom.typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.custom.spacing.xs,
  },
  organizationText: {
    fontSize: theme.custom.typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  syncStatus: {
    alignItems: 'flex-end',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.custom.spacing.xs,
  },
  syncText: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.colors.onPrimary,
    marginLeft: theme.custom.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.md,
  },
  statCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: theme.custom.spacing.sm,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: theme.custom.spacing.md,
  },
  statNumber: {
    fontSize: theme.custom.typography.sizes['2xl'],
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginTop: theme.custom.spacing.xs,
  },
  statLabel: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray600,
    textAlign: 'center',
    marginTop: theme.custom.spacing.xs,
  },
  sectionCard: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.md,
  },
  lastCard: {
    marginBottom: theme.custom.spacing.xl,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.custom.spacing.sm,
    marginBottom: theme.custom.spacing.xs,
    borderRadius: theme.custom.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: theme.custom.typography.sizes.base,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.xs,
  },
  projectDescription: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    marginBottom: theme.custom.spacing.xs,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    fontSize: theme.custom.typography.sizes.xs,
  },
  projectDate: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray500,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.custom.spacing.xl,
  },
  emptyStateText: {
    fontSize: theme.custom.typography.sizes.base,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.custom.colors.gray600,
    marginTop: theme.custom.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray500,
    textAlign: 'center',
    marginTop: theme.custom.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: theme.custom.spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.custom.spacing.sm,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.colors.text,
    marginLeft: theme.custom.spacing.sm,
  },
  statusValue: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
  },
  onlineBadge: {
    backgroundColor: statusColors.completed,
  },
});

export default DashboardScreen;
