import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  List,
  Chip,
  Surface,
  IconButton,
  Badge,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';

import { useSyncStore, formatSyncProgress, formatTimeRemaining, formatUploadSpeed } from '@store/syncStore';
import { usePhotoStore } from '@store/photoStore';
import { useProjectStore } from '@store/projectStore';
import { SyncService } from '@services/sync';
import { DatabaseService } from '@services/database';
import { theme, statusColors } from '@utils/theme';
import { SyncJob, UploadProgress } from '@types/index';

const SyncScreen: React.FC = () => {
  const {
    syncStatus,
    isOnline,
    pendingCount,
    lastSyncTime,
    uploadProgress,
    startSync,
    updatePendingCount,
    getSyncStats,
  } = useSyncStore();
  
  const { photos } = usePhotoStore();
  const { projects } = useProjectStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [syncStats, setSyncStats] = useState({
    totalPending: 0,
    photosPending: 0,
    projectsPending: 0,
    metadataPending: 0,
  });
  const [networkInfo, setNetworkInfo] = useState({
    type: 'unknown',
    isConnected: false,
    isInternetReachable: false,
  });

  useEffect(() => {
    loadSyncData();
    
    // Listen to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkInfo({
        type: state.type || 'unknown',
        isConnected: state.isConnected || false,
        isInternetReachable: state.isInternetReachable || false,
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Refresh data when sync status changes
    if (syncStatus === 'completed') {
      loadSyncData();
    }
  }, [syncStatus]);

  const loadSyncData = async () => {
    try {
      await updatePendingCount();
      
      const stats = await getSyncStats();
      setSyncStats(stats);
      
      // Load pending sync jobs
      const db = DatabaseService.getInstance();
      const jobs = await db.getPendingSyncJobs();
      setSyncJobs(jobs);
    } catch (error) {
      console.error('Failed to load sync data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSyncData();
    setRefreshing(false);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await startSync();
    } catch (error: any) {
      Alert.alert('Sync Error', error.message || 'Failed to start sync');
    }
  };

  const handleRetryFailedJobs = async () => {
    try {
      const syncService = SyncService.getInstance();
      await syncService.retryFailedJobs();
      await loadSyncData();
      Alert.alert('Success', 'Failed jobs have been queued for retry');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to retry jobs');
    }
  };

  const handleClearCompletedJobs = async () => {
    Alert.alert(
      'Clear Completed Jobs',
      'This will remove all completed sync jobs from the queue. Continue?',
      [
        { text: 'Cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              const syncService = SyncService.getInstance();
              await syncService.clearCompletedJobs();
              await loadSyncData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to clear jobs');
            }
          },
        },
      ]
    );
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'clock-outline';
      case 'processing': return 'sync';
      case 'completed': return 'check-circle';
      case 'failed': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return statusColors.pending;
      case 'processing': return theme.colors.primary;
      case 'completed': return statusColors.completed;
      case 'failed': return statusColors.failed;
      default: return theme.custom.colors.gray500;
    }
  };

  const renderNetworkStatus = () => (
    <Card style={styles.statusCard}>
      <Card.Title
        title="Network Status"
        left={(props) => (
          <Icon
            {...props}
            name={isOnline ? 'wifi' : 'wifi-off'}
            color={isOnline ? statusColors.completed : statusColors.failed}
          />
        )}
        right={() => (
          <Badge
            style={[
              styles.statusBadge,
              { backgroundColor: isOnline ? statusColors.completed : statusColors.failed }
            ]}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        )}
      />
      <Card.Content>
        <View style={styles.networkDetails}>
          <Text style={styles.networkInfo}>
            Connection: {networkInfo.type.toUpperCase()}
          </Text>
          <Text style={styles.networkInfo}>
            Internet: {networkInfo.isInternetReachable ? 'Reachable' : 'Not Reachable'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSyncStats = () => (
    <Card style={styles.statsCard}>
      <Card.Title
        title="Sync Statistics"
        left={(props) => <Icon {...props} name="chart-line" />}
      />
      <Card.Content>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{syncStats.totalPending}</Text>
            <Text style={styles.statLabel}>Total Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{syncStats.photosPending}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{syncStats.projectsPending}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{syncStats.metadataPending}</Text>
            <Text style={styles.statLabel}>Metadata</Text>
          </View>
        </View>
        
        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            Last sync: {new Date(lastSyncTime).toLocaleString()}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderActiveUploads = () => {
    const activeUploads = Object.entries(uploadProgress).filter(
      ([_, progress]) => progress.status === 'uploading' || progress.status === 'processing'
    );

    if (activeUploads.length === 0) {
      return null;
    }

    return (
      <Card style={styles.uploadsCard}>
        <Card.Title
          title="Active Uploads"
          subtitle={`${activeUploads.length} files uploading`}
          left={(props) => <Icon {...props} name="upload" />}
        />
        <Card.Content>
          {activeUploads.map(([jobId, progress]) => (
            <Surface key={jobId} style={styles.uploadItem}>
              <View style={styles.uploadHeader}>
                <Text style={styles.uploadFileName} numberOfLines={1}>
                  {progress.fileName}
                </Text>
                <Text style={styles.uploadPercent}>
                  {progress.percentage.toFixed(0)}%
                </Text>
              </View>
              
              <ProgressBar
                progress={progress.percentage / 100}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
              
              <View style={styles.uploadDetails}>
                <Text style={styles.uploadDetail}>
                  {formatSyncProgress(progress)}
                </Text>
                {progress.speed > 0 && (
                  <Text style={styles.uploadDetail}>
                    {formatUploadSpeed(progress.speed)}
                  </Text>
                )}
                {progress.timeRemaining > 0 && (
                  <Text style={styles.uploadDetail}>
                    {formatTimeRemaining(progress.timeRemaining)} remaining
                  </Text>
                )}
              </View>
            </Surface>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderSyncQueue = () => (
    <Card style={styles.queueCard}>
      <Card.Title
        title="Sync Queue"
        subtitle={`${syncJobs.length} items in queue`}
        left={(props) => <Icon {...props} name="format-list-bulleted" />}
        right={() => (
          <View style={styles.queueActions}>
            <IconButton
              icon="refresh"
              size={20}
              onPress={loadSyncData}
            />
            <IconButton
              icon="broom"
              size={20}
              onPress={handleClearCompletedJobs}
            />
          </View>
        )}
      />
      <Card.Content>
        {syncJobs.length > 0 ? (
          syncJobs.slice(0, 10).map((job, index) => (
            <View key={job.id}>
              <List.Item
                title={`${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Sync`}
                description={`Attempts: ${job.attempts}/${job.maxAttempts}`}
                left={() => (
                  <Icon
                    name={getJobStatusIcon(job.status)}
                    size={24}
                    color={getJobStatusColor(job.status)}
                  />
                )}
                right={() => (
                  <View style={styles.jobRight}>
                    <Chip
                      style={[
                        styles.priorityChip,
                        { backgroundColor: job.priority === 'high' ? statusColors.failed : theme.custom.colors.gray300 }
                      ]}
                    >
                      {job.priority}
                    </Chip>
                  </View>
                )}
              />
              {index < syncJobs.length - 1 && <Divider />}
            </View>
          ))
        ) : (
          <View style={styles.emptyQueue}>
            <Icon name="check-all" size={48} color={theme.custom.colors.gray400} />
            <Text style={styles.emptyQueueText}>No items in sync queue</Text>
            <Text style={styles.emptyQueueSubtext}>
              All data is up to date
            </Text>
          </View>
        )}
        
        {syncJobs.length > 10 && (
          <Text style={styles.queueMore}>
            ... and {syncJobs.length - 10} more items
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderSyncControls = () => (
    <View style={styles.controls}>
      <Button
        mode="contained"
        onPress={handleManualSync}
        disabled={!isOnline || syncStatus === 'syncing' || pendingCount === 0}
        loading={syncStatus === 'syncing'}
        icon="sync"
        style={styles.controlButton}
      >
        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
      </Button>
      
      <Button
        mode="outlined"
        onPress={handleRetryFailedJobs}
        disabled={syncJobs.filter(j => j.status === 'failed').length === 0}
        icon="refresh"
        style={styles.controlButton}
      >
        Retry Failed
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
        {renderNetworkStatus()}
        {renderSyncStats()}
        {renderActiveUploads()}
        {renderSyncQueue()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {renderSyncControls()}
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
  statusCard: {
    margin: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  statusBadge: {
    fontSize: theme.custom.typography.sizes.xs,
  },
  networkDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  networkInfo: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
  },
  statsCard: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.custom.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.custom.typography.sizes['2xl'],
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray600,
    marginTop: theme.custom.spacing.xs,
  },
  lastSyncText: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    textAlign: 'center',
  },
  uploadsCard: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  uploadItem: {
    padding: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
    borderRadius: theme.custom.borderRadius.md,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.custom.spacing.sm,
  },
  uploadFileName: {
    fontSize: theme.custom.typography.sizes.sm,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.custom.spacing.sm,
  },
  uploadPercent: {
    fontSize: theme.custom.typography.sizes.sm,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: theme.custom.spacing.sm,
  },
  uploadDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  uploadDetail: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray600,
  },
  queueCard: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  queueActions: {
    flexDirection: 'row',
  },
  jobRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priorityChip: {
    height: 24,
  },
  emptyQueue: {
    alignItems: 'center',
    paddingVertical: theme.custom.spacing.xl,
  },
  emptyQueueText: {
    fontSize: theme.custom.typography.sizes.base,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
    color: theme.custom.colors.gray600,
    marginTop: theme.custom.spacing.sm,
  },
  emptyQueueSubtext: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray500,
    marginTop: theme.custom.spacing.xs,
  },
  queueMore: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    textAlign: 'center',
    marginTop: theme.custom.spacing.sm,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.custom.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 4,
  },
  controlButton: {
    flex: 0.48,
  },
  bottomSpacing: {
    height: theme.custom.spacing.xl,
  },
});

export default SyncScreen;
