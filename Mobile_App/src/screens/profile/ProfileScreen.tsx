import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Switch,
  Divider,
  Avatar,
  Surface,
  Badge,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuthStore } from '@store/authStore';
import { useSyncStore } from '@store/syncStore';
import { usePhotoStore, getPhotoStats } from '@store/photoStore';
import { useProjectStore } from '@store/projectStore';
import { DatabaseService } from '@services/database';
import { FileService } from '@services/file';
import { InitializationService } from '@services/initialization';
import { theme, roleColors } from '@utils/theme';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { pendingCount, lastSyncTime } = useSyncStore();
  const { photos } = usePhotoStore();
  const { projects } = useProjectStore();

  const [settings, setSettings] = useState({
    autoSync: true,
    pushNotifications: true,
    highAccuracyGPS: true,
    compressPhotos: true,
    offlineMode: true,
  });
  
  const [storageInfo, setStorageInfo] = useState({
    photosSize: 0,
    documentsSize: 0,
    totalSize: 0,
  });

  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    lastInitialization: null as string | null,
    isInitialized: false,
  });

  useEffect(() => {
    loadStorageInfo();
    loadAppInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const storage = await FileService.getStorageUsage();
      setStorageInfo(storage);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const loadAppInfo = async () => {
    try {
      const info = await InitializationService.getInitializationInfo();
      setAppInfo(info);
    } catch (error) {
      console.error('Failed to load app info:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Any unsaved data will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and free up storage space. Continue?',
      [
        { text: 'Cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await FileService.cleanupOldFiles(7); // Keep only last 7 days
              await loadStorageInfo();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete ALL local data including photos, projects, and settings. This action cannot be undone!',
      [
        { text: 'Cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? ALL data will be lost!',
              [
                { text: 'Cancel' },
                {
                  text: 'DELETE ALL DATA',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await InitializationService.resetApp();
                      Alert.alert('App Reset', 'The app will restart now.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to reset app');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleShareAppInfo = async () => {
    try {
      const photoStats = getPhotoStats(photos);
      const info = `
Blue Carbon MRV App Info:
Version: ${appInfo.version}
User: ${user?.profile?.firstName} ${user?.profile?.lastName}
Role: ${user?.role}
Organization: ${user?.organization?.name || 'None'}

Statistics:
- Projects: ${projects.length}
- Photos: ${photoStats.total} (${photoStats.pending} pending)
- Storage Used: ${FileService.formatFileSize(storageInfo.totalSize)}
- Last Sync: ${lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}

Generated on: ${new Date().toLocaleString()}
      `.trim();

      await Share.share({
        message: info,
        title: 'Blue Carbon MRV App Info',
      });
    } catch (error) {
      console.error('Failed to share app info:', error);
    }
  };

  const userColor = roleColors[user?.role || 'developer'] || theme.colors.primary;
  const photoStats = getPhotoStats(photos);

  const renderUserProfile = () => (
    <Card style={styles.profileCard}>
      <Card.Content>
        <View style={styles.profileHeader}>
          <Avatar.Text
            size={80}
            label={`${user?.profile?.firstName?.charAt(0) || 'U'}${user?.profile?.lastName?.charAt(0) || ''}`}
            style={[styles.avatar, { backgroundColor: userColor }]}
          />
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.profile?.firstName} {user?.profile?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Badge style={[styles.roleBadge, { backgroundColor: userColor }]}>
              {user?.role?.replace('_', ' ').toUpperCase() || 'USER'}
            </Badge>
            {user?.organization && (
              <Text style={styles.organizationText}>
                {user.organization.name}
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderStatistics = () => (
    <Card style={styles.statsCard}>
      <Card.Title
        title="Statistics"
        left={(props) => <Icon {...props} name="chart-box" />}
      />
      <Card.Content>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{photoStats.total}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending Sync</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {FileService.formatFileSize(storageInfo.totalSize)}
            </Text>
            <Text style={styles.statLabel}>Storage Used</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSettings = () => (
    <Card style={styles.settingsCard}>
      <Card.Title
        title="Settings"
        left={(props) => <Icon {...props} name="cog" />}
      />
      <Card.Content>
        <List.Item
          title="Auto Sync"
          description="Automatically sync when online"
          left={() => <Icon name="sync" size={24} />}
          right={() => (
            <Switch
              value={settings.autoSync}
              onValueChange={(value) =>
                setSettings(prev => ({ ...prev, autoSync: value }))
              }
            />
          )}
        />
        <Divider />
        
        <List.Item
          title="Push Notifications"
          description="Receive sync and audit notifications"
          left={() => <Icon name="bell" size={24} />}
          right={() => (
            <Switch
              value={settings.pushNotifications}
              onValueChange={(value) =>
                setSettings(prev => ({ ...prev, pushNotifications: value }))
              }
            />
          )}
        />
        <Divider />
        
        <List.Item
          title="High Accuracy GPS"
          description="Use high precision location (more battery)"
          left={() => <Icon name="crosshairs-gps" size={24} />}
          right={() => (
            <Switch
              value={settings.highAccuracyGPS}
              onValueChange={(value) =>
                setSettings(prev => ({ ...prev, highAccuracyGPS: value }))
              }
            />
          )}
        />
        <Divider />
        
        <List.Item
          title="Compress Photos"
          description="Reduce file size to save storage"
          left={() => <Icon name="image-filter" size={24} />}
          right={() => (
            <Switch
              value={settings.compressPhotos}
              onValueChange={(value) =>
                setSettings(prev => ({ ...prev, compressPhotos: value }))
              }
            />
          )}
        />
        <Divider />
        
        <List.Item
          title="Offline Mode"
          description="Allow app to work without internet"
          left={() => <Icon name="cloud-off" size={24} />}
          right={() => (
            <Switch
              value={settings.offlineMode}
              onValueChange={(value) =>
                setSettings(prev => ({ ...prev, offlineMode: value }))
              }
            />
          )}
        />
      </Card.Content>
    </Card>
  );

  const renderDataManagement = () => (
    <Card style={styles.dataCard}>
      <Card.Title
        title="Data Management"
        left={(props) => <Icon {...props} name="database" />}
      />
      <Card.Content>
        <List.Item
          title="Storage Usage"
          description={`${FileService.formatFileSize(storageInfo.totalSize)} used`}
          left={() => <Icon name="harddisk" size={24} />}
          right={() => (
            <Text style={styles.storageText}>
              Photos: {FileService.formatFileSize(storageInfo.photosSize)}
            </Text>
          )}
        />
        <Divider />
        
        <List.Item
          title="Clear Cache"
          description="Remove temporary files"
          left={() => <Icon name="broom" size={24} />}
          onPress={handleClearCache}
        />
        <Divider />
        
        <List.Item
          title="Export Data"
          description="Share app statistics"
          left={() => <Icon name="export" size={24} />}
          onPress={handleShareAppInfo}
        />
      </Card.Content>
    </Card>
  );

  const renderAbout = () => (
    <Card style={styles.aboutCard}>
      <Card.Title
        title="About"
        left={(props) => <Icon {...props} name="information" />}
      />
      <Card.Content>
        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>{appInfo.version}</Text>
        </View>
        
        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Build</Text>
          <Text style={styles.aboutValue}>Production</Text>
        </View>
        
        {appInfo.lastInitialization && (
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Last Updated</Text>
            <Text style={styles.aboutValue}>
              {new Date(appInfo.lastInitialization).toLocaleDateString()}
            </Text>
          </View>
        )}
        
        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Developer</Text>
          <Text style={styles.aboutValue}>Blue Carbon MRV Team</Text>
        </View>
        
        <Text style={styles.aboutDescription}>
          Secure, offline-first mobile app for capturing and verifying 
          ground truth data in blue carbon restoration projects.
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderUserProfile()}
        {renderStatistics()}
        {renderSettings()}
        {renderDataManagement()}
        {renderAbout()}
        
        <Surface style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Button
            mode="outlined"
            onPress={handleResetApp}
            textColor={theme.colors.error}
            style={[styles.dangerButton, { borderColor: theme.colors.error }]}
            icon="alert-circle"
          >
            Reset App Data
          </Button>
        </Surface>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <View style={styles.logoutContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          icon="logout"
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
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
  profileCard: {
    margin: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: theme.custom.spacing.lg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.custom.typography.sizes.xl,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.text,
    marginBottom: theme.custom.spacing.xs,
  },
  userEmail: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    marginBottom: theme.custom.spacing.sm,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginBottom: theme.custom.spacing.xs,
  },
  organizationText: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    fontStyle: 'italic',
  },
  statsCard: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    textAlign: 'center',
  },
  settingsCard: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  dataCard: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  storageText: {
    fontSize: theme.custom.typography.sizes.xs,
    color: theme.custom.colors.gray600,
  },
  aboutCard: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.custom.spacing.sm,
  },
  aboutLabel: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    fontWeight: theme.custom.typography.fontWeights.medium as any,
  },
  aboutValue: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.colors.text,
  },
  aboutDescription: {
    fontSize: theme.custom.typography.sizes.sm,
    color: theme.custom.colors.gray600,
    lineHeight: 20,
    marginTop: theme.custom.spacing.md,
    textAlign: 'center',
  },
  dangerZone: {
    marginHorizontal: theme.custom.spacing.md,
    marginBottom: theme.custom.spacing.sm,
    padding: theme.custom.spacing.md,
    borderRadius: theme.custom.borderRadius.md,
    backgroundColor: theme.custom.colors.gray50,
  },
  dangerTitle: {
    fontSize: theme.custom.typography.sizes.base,
    fontWeight: theme.custom.typography.fontWeights.bold as any,
    color: theme.colors.error,
    marginBottom: theme.custom.spacing.md,
    textAlign: 'center',
  },
  dangerButton: {
    borderWidth: 2,
  },
  bottomSpacing: {
    height: theme.custom.spacing.xl,
  },
  logoutContainer: {
    padding: theme.custom.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 4,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
  },
});

export default ProfileScreen;
