import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  transactionNotifications: boolean;
  budgetNotifications: boolean;
  budgetAlerts: boolean;
  budgetThreshold: number; // percentage (e.g., 80 for 80%)
  dailyReminders: boolean;
  weeklyReports: boolean;
}

export interface NotificationData {
  type: 'transaction' | 'budget' | 'budget_alert' | 'reminder' | 'report';
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationSettings: NotificationSettings = {
    transactionNotifications: true,
    budgetNotifications: true,
    budgetAlerts: true,
    budgetThreshold: 80,
    dailyReminders: false,
    weeklyReports: false,
  };

  async initialize() {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Get push token
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });
        this.expoPushToken = token.data;
        console.log('Push token:', this.expoPushToken);
        
        // Save token to user's profile
        await this.savePushToken();
      }

      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Load notification settings
      await this.loadNotificationSettings();
      
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private async savePushToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !this.expoPushToken) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          push_token: this.expoPushToken,
          notification_settings: this.notificationSettings,
        });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  private async loadNotificationSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('notification_settings')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.notification_settings) {
        this.notificationSettings = {
          ...this.notificationSettings,
          ...data.notification_settings,
        };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  private setupNotificationListeners() {
    // Handle notification received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification response (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    switch (data?.type) {
      case 'transaction':
        // Navigate to transactions screen
        break;
      case 'budget':
        // Navigate to budgets screen
        break;
      case 'budget_alert':
        // Navigate to specific budget
        break;
      default:
        break;
    }
  }

  // Send local notification
  async sendLocalNotification(notification: NotificationData) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Transaction notifications
  async notifyTransactionAdded(transaction: any) {
    if (!this.notificationSettings.transactionNotifications) return;

    const type = transaction.category?.type === 'income' ? 'Income' : 'Expense';
    const emoji = transaction.category?.type === 'income' ? '💰' : '💸';
    
    await this.sendLocalNotification({
      type: 'transaction',
      title: `${emoji} ${type} Added`,
      body: `${transaction.description} - $${transaction.amount.toLocaleString()}`,
      data: {
        type: 'transaction',
        transactionId: transaction.id,
      },
    });

    // Check budget alerts
    await this.checkBudgetAlerts(transaction);
  }

  // Budget notifications
  async notifyBudgetCreated(budget: any) {
    if (!this.notificationSettings.budgetNotifications) return;

    await this.sendLocalNotification({
      type: 'budget',
      title: '📊 Budget Created',
      body: `${budget.category?.name} budget set to $${budget.amount.toLocaleString()} for ${budget.period}`,
      data: {
        type: 'budget',
        budgetId: budget.id,
      },
    });
  }

  // Budget alert notifications
  async checkBudgetAlerts(transaction: any) {
    if (!this.notificationSettings.budgetAlerts) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!budgets) return;

      // Get transactions for current period for each budget
      for (const budget of budgets) {
        if (budget.category_id === transaction.category_id) {
          const startDate = new Date(budget.start_date);
          const endDate = budget.end_date ? new Date(budget.end_date) : new Date();
          
          const { data: budgetTransactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('category_id', budget.category_id)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());

          if (budgetTransactions) {
            const totalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
            const percentage = (totalSpent / budget.amount) * 100;

            if (percentage >= 100) {
              // Over budget
              await this.sendLocalNotification({
                type: 'budget_alert',
                title: '⚠️ Budget Exceeded!',
                body: `${budget.category?.name} budget has been exceeded by $${(totalSpent - budget.amount).toLocaleString()}`,
                data: {
                  type: 'budget_alert',
                  budgetId: budget.id,
                  percentage: percentage,
                },
              });
            } else if (percentage >= this.notificationSettings.budgetThreshold) {
              // Near budget limit
              await this.sendLocalNotification({
                type: 'budget_alert',
                title: '🚨 Budget Warning',
                body: `${budget.category?.name} budget is ${percentage.toFixed(1)}% used ($${totalSpent.toLocaleString()} / $${budget.amount.toLocaleString()})`,
                data: {
                  type: 'budget_alert',
                  budgetId: budget.id,
                  percentage: percentage,
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }

  // Daily reminder notification
  async scheduleDailyReminder() {
    if (!this.notificationSettings.dailyReminders) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📝 Daily Budget Check',
        body: 'Don\'t forget to log your expenses and check your budget!',
        data: { type: 'reminder' },
      },
      trigger: {
        hour: 20, // 8 PM
        minute: 0,
        repeats: true,
      },
    });
  }

  // Weekly report notification
  async scheduleWeeklyReport() {
    if (!this.notificationSettings.weeklyReports) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Budget Report',
        body: 'Check your spending summary for this week',
        data: { type: 'report' },
      },
      trigger: {
        weekday: 1, // Monday
        hour: 9, // 9 AM
        minute: 0,
        repeats: true,
      },
    });
  }

  // Update notification settings
  async updateNotificationSettings(settings: Partial<NotificationSettings>) {
    this.notificationSettings = {
      ...this.notificationSettings,
      ...settings,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notification_settings: this.notificationSettings,
        });

      if (error) {
        console.error('Error updating notification settings:', error);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  // Get current notification settings
  getNotificationSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get notification permissions status
  async getPermissionsStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }
}

export const notificationService = new NotificationService(); 