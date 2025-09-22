import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DatabaseService } from '@services/database';
import { PushNotification as NotificationType } from '@types/index';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  private static isInitialized = false;
  private static token: string | null = null;

  public static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('📱 Initializing notification service...');

      // Configure push notifications
      PushNotification.configure({
        // Called when token is generated (iOS and Android)
        onRegister: (token) => {
          console.log('📱 Push notification token:', token);
          this.token = token.token;
          AsyncStorage.setItem('pushNotificationToken', token.token);
        },

        // Called when a remote or local notification is opened or received
        onNotification: (notification) => {
          console.log('📱 Notification received:', notification);
          this.handleNotificationReceived(notification);

          // Required on iOS only
          if (Platform.OS === 'ios') {
            notification.finish(PushNotificationIOS.FetchResult.NoData);
          }
        },

        // Called when the user fails to register for remote notifications
        onRegistrationError: (err) => {
          console.error('❌ Push notification registration error:', err);
        },

        // IOS ONLY: called when a remote notification is received while the app is in the foreground
        onRemoteNotification: (notification) => {
          console.log('📱 Remote notification (iOS):', notification);
          this.handleNotificationReceived(notification);
        },

        // Android only: GCM or FCM sender ID
        senderID: "YOUR_SENDER_ID", // Replace with your actual sender ID

        // Should the initial notification be popped automatically
        popInitialNotification: true,

        // Should app request permissions on component mount
        requestPermissions: Platform.OS === 'ios',
      });

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Request permissions for Android
      if (Platform.OS === 'android') {
        await this.requestAndroidPermissions();
      }

      this.isInitialized = true;
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  private static async createNotificationChannels(): Promise<void> {
    const channels = [
      {
        channelId: 'sync_updates',
        channelName: 'Sync Updates',
        channelDescription: 'Notifications about data synchronization status',
        importance: Importance.DEFAULT,
      },
      {
        channelId: 'audit_results',
        channelName: 'Audit Results', 
        channelDescription: 'Notifications about audit decisions and results',
        importance: Importance.HIGH,
      },
      {
        channelId: 'system_updates',
        channelName: 'System Updates',
        channelDescription: 'System maintenance and update notifications',
        importance: Importance.LOW,
      },
      {
        channelId: 'reminders',
        channelName: 'Reminders',
        channelDescription: 'Task and deadline reminders',
        importance: Importance.DEFAULT,
      },
    ];

    for (const channel of channels) {
      PushNotification.createChannel(
        {
          channelId: channel.channelId,
          channelName: channel.channelName,
          channelDescription: channel.channelDescription,
          importance: channel.importance,
          vibrate: true,
        },
        (created) => console.log(`Channel ${channel.channelId} created: ${created}`)
      );
    }
  }

  private static async requestAndroidPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'Blue Carbon MRV needs notification permission to keep you updated about sync status and audit results.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error);
      return false;
    }
  }

  // Local notification methods
  public static showLocalNotification(
    title: string,
    message: string,
    data?: any,
    channelId: string = 'sync_updates'
  ): void {
    const notificationId = Date.now();

    PushNotification.localNotification({
      id: notificationId,
      title,
      message,
      channelId,
      userInfo: data,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
    });

    // Store notification in database
    this.storeNotification({
      id: uuidv4(),
      title,
      body: message,
      type: this.getNotificationTypeFromChannel(channelId),
      payload: data,
      receivedAt: new Date().toISOString(),
    });
  }

  public static showSyncCompleteNotification(
    successCount: number,
    failureCount: number
  ): void {
    const title = 'Sync Complete';
    const message = failureCount > 0 
      ? `${successCount} items synced, ${failureCount} failed`
      : `${successCount} items synced successfully`;

    this.showLocalNotification(title, message, {
      syncResult: { successCount, failureCount }
    }, 'sync_updates');
  }

  public static showAuditResultNotification(
    projectName: string,
    status: 'approved' | 'rejected' | 'requires_revision',
    auditorComments?: string
  ): void {
    const title = 'Audit Result Available';
    const message = `Project "${projectName}" has been ${status}`;

    this.showLocalNotification(title, message, {
      projectName,
      status,
      auditorComments,
    }, 'audit_results');
  }

  public static showReminderNotification(
    title: string,
    message: string,
    reminderData?: any
  ): void {
    this.showLocalNotification(title, message, reminderData, 'reminders');
  }

  public static showSystemUpdateNotification(
    title: string,
    message: string,
    updateInfo?: any
  ): void {
    this.showLocalNotification(title, message, updateInfo, 'system_updates');
  }

  // Scheduled notifications
  public static scheduleNotification(
    title: string,
    message: string,
    date: Date,
    data?: any,
    channelId: string = 'reminders'
  ): void {
    const notificationId = Date.now();

    PushNotification.localNotificationSchedule({
      id: notificationId,
      title,
      message,
      date,
      channelId,
      userInfo: data,
      playSound: true,
      soundName: 'default',
      vibrate: true,
    });

    console.log(`📅 Scheduled notification for ${date.toISOString()}`);
  }

  public static scheduleDataSyncReminder(): void {
    const reminderDate = new Date();
    reminderDate.setHours(reminderDate.getHours() + 24); // 24 hours from now

    this.scheduleNotification(
      'Sync Reminder',
      'You have pending data to sync. Connect to internet to upload your evidence.',
      reminderDate,
      { type: 'sync_reminder' }
    );
  }

  // Notification management
  public static cancelNotification(notificationId: number): void {
    PushNotification.cancelLocalNotifications({ id: notificationId.toString() });
  }

  public static cancelAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  public static clearDeliveredNotifications(): void {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeAllDeliveredNotifications();
    } else {
      // Android automatically clears delivered notifications when user interacts
    }
  }

  // Badge management (iOS)
  public static setBadgeNumber(number: number): void {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.setApplicationIconBadgeNumber(number);
    }
  }

  public static clearBadge(): void {
    this.setBadgeNumber(0);
  }

  // Database operations
  private static async storeNotification(notification: NotificationType): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
      await db.saveNotification(notification);
    } catch (error) {
      console.error('❌ Failed to store notification:', error);
    }
  }

  private static async handleNotificationReceived(notification: any): Promise<void> {
    try {
      // Store received notification
      const notificationData: NotificationType = {
        id: notification.id || uuidv4(),
        title: notification.title || 'Blue Carbon MRV',
        body: notification.message || notification.body || '',
        type: notification.userInfo?.type || 'system_update',
        payload: notification.userInfo,
        receivedAt: new Date().toISOString(),
      };

      await this.storeNotification(notificationData);

      // Handle specific notification types
      if (notification.userInfo?.type) {
        await this.handleNotificationType(notification.userInfo.type, notification.userInfo);
      }

      // Update badge count
      if (Platform.OS === 'ios') {
        const unreadCount = await this.getUnreadNotificationCount();
        this.setBadgeNumber(unreadCount);
      }
    } catch (error) {
      console.error('❌ Failed to handle received notification:', error);
    }
  }

  private static async handleNotificationType(type: string, data: any): Promise<void> {
    switch (type) {
      case 'sync_complete':
        // Could trigger a sync status update in the app
        break;
      case 'audit_result':
        // Could update project status or show detailed result
        break;
      case 'system_update':
        // Could check for app updates or show system messages
        break;
      case 'reminder':
        // Could navigate to specific screen or show action buttons
        break;
      default:
        console.log(`Unhandled notification type: ${type}`);
    }
  }

  // Helper methods
  private static getNotificationTypeFromChannel(channelId: string): NotificationType['type'] {
    const channelTypeMap: Record<string, NotificationType['type']> = {
      sync_updates: 'sync_complete',
      audit_results: 'audit_result', 
      system_updates: 'system_update',
      reminders: 'reminder',
    };

    return channelTypeMap[channelId] || 'system_update';
  }

  public static async getUnreadNotificationCount(): Promise<number> {
    try {
      const db = DatabaseService.getInstance();
      const notifications = await db.getNotifications(true); // unread only
      return notifications.length;
    } catch (error) {
      console.error('❌ Failed to get unread notification count:', error);
      return 0;
    }
  }

  public static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
      await db.markNotificationAsRead(notificationId);

      // Update badge count on iOS
      if (Platform.OS === 'ios') {
        const unreadCount = await this.getUnreadNotificationCount();
        this.setBadgeNumber(unreadCount);
      }
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    }
  }

  public static getToken(): string | null {
    return this.token;
  }

  // Permission helpers
  public static async checkNotificationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        PushNotificationIOS.checkPermissions((permissions) => {
          resolve(permissions.alert && permissions.badge && permissions.sound);
        });
      });
    } else {
      // Android permission checking would need native module
      return true;
    }
  }

  public static showNotificationPermissionAlert(): void {
    Alert.alert(
      'Enable Notifications',
      'Get notified about sync status, audit results, and important updates. You can change this later in settings.',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Enable', 
          onPress: () => {
            if (Platform.OS === 'ios') {
              PushNotificationIOS.requestPermissions();
            }
          }
        },
      ]
    );
  }
}

export default NotificationService;
