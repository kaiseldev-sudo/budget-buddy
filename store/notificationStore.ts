import { create } from 'zustand';
import { notificationService, NotificationSettings } from '@/lib/notifications';

interface NotificationState {
  settings: NotificationSettings;
  permissionsGranted: boolean;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  checkPermissions: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  settings: {
    transactionNotifications: true,
    budgetNotifications: true,
    budgetAlerts: true,
    budgetThreshold: 80,
    dailyReminders: false,
    weeklyReports: false,
  },
  permissionsGranted: false,
  loading: false,

  loadSettings: async () => {
    set({ loading: true });
    try {
      const settings = notificationService.getNotificationSettings();
      const permissionsStatus = await notificationService.getPermissionsStatus();
      
      set({ 
        settings,
        permissionsGranted: permissionsStatus === 'granted',
        loading: false 
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
      set({ loading: false });
    }
  },

  updateSettings: async (newSettings: Partial<NotificationSettings>) => {
    set({ loading: true });
    try {
      await notificationService.updateNotificationSettings(newSettings);
      const updatedSettings = notificationService.getNotificationSettings();
      set({ settings: updatedSettings, loading: false });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      set({ loading: false });
    }
  },

  checkPermissions: async () => {
    try {
      const status = await notificationService.getPermissionsStatus();
      set({ permissionsGranted: status === 'granted' });
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  },

  sendTestNotification: async () => {
    try {
      await notificationService.sendLocalNotification({
        type: 'reminder',
        title: '🔔 Test Notification',
        body: 'This is a test notification from Budget Buddy!',
        data: { type: 'test' },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  },
})); 