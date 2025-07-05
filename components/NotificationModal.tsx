import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { notificationService, NotificationSettings } from '@/lib/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, X, Save, AlertTriangle, Clock, BarChart3, TestTube } from 'lucide-react-native';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const theme = useTheme();
  const { settings, permissionsGranted, loading, loadSettings, updateSettings, sendTestNotification } = useNotificationStore();
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      
      // Schedule or cancel recurring notifications based on settings
      if (localSettings.dailyReminders) {
        await notificationService.scheduleDailyReminder();
      }
      if (localSettings.weeklyReports) {
        await notificationService.scheduleWeeklyReport();
      }

      Alert.alert('Success', 'Notification settings updated successfully!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    disabled?: boolean
  ) => (
    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.primary }]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.surfaceSecondary, true: theme.primary }}
        thumbColor={theme.surface}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <X size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Notifications</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Save size={24} color={loading ? theme.textTertiary : theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transaction Notifications */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Transaction Alerts</Text>
            {renderSettingItem(
              <Bell size={20} color={theme.textInverse} />,
              'Transaction Notifications',
              'Get notified when you add income or expenses',
              localSettings.transactionNotifications,
              (value) => updateSetting('transactionNotifications', value)
            )}
          </View>

          {/* Budget Notifications */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Budget Alerts</Text>
            {renderSettingItem(
              <BarChart3 size={20} color={theme.textInverse} />,
              'Budget Notifications',
              'Get notified when you create new budgets',
              localSettings.budgetNotifications,
              (value) => updateSetting('budgetNotifications', value)
            )}
            {renderSettingItem(
              <AlertTriangle size={20} color={theme.textInverse} />,
              'Budget Warnings',
              'Get alerts when approaching or exceeding budget limits',
              localSettings.budgetAlerts,
              (value) => updateSetting('budgetAlerts', value)
            )}
          </View>

          {/* Reminders */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Reminders</Text>
            {renderSettingItem(
              <Clock size={20} color={theme.textInverse} />,
              'Daily Reminders',
              'Get reminded to log your expenses daily at 8 PM',
              localSettings.dailyReminders,
              (value) => updateSetting('dailyReminders', value)
            )}
            {renderSettingItem(
              <BarChart3 size={20} color={theme.textInverse} />,
              'Weekly Reports',
              'Get weekly spending summaries every Monday at 9 AM',
              localSettings.weeklyReports,
              (value) => updateSetting('weeklyReports', value)
            )}
          </View>

          {/* Budget Threshold Slider */}
          {localSettings.budgetAlerts && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Budget Warning Threshold</Text>
              <View style={[styles.thresholdContainer, { backgroundColor: theme.surface }]}>
                <Text style={[styles.thresholdText, { color: theme.textSecondary }]}>
                  Alert when budget is {localSettings.budgetThreshold}% used
                </Text>
                <View style={styles.thresholdButtons}>
                  {[70, 80, 90].map((threshold) => (
                    <TouchableOpacity
                      key={threshold}
                      style={[
                        styles.thresholdButton,
                        {
                          backgroundColor: localSettings.budgetThreshold === threshold ? theme.primary : theme.surfaceSecondary,
                        }
                      ]}
                      onPress={() => updateSetting('budgetThreshold', threshold)}
                    >
                      <Text style={[
                        styles.thresholdButtonText,
                        { color: localSettings.budgetThreshold === threshold ? theme.textInverse : theme.textSecondary }
                      ]}>
                        {threshold}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Test Notification */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Test Notifications</Text>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: theme.primary }]}
              onPress={sendTestNotification}
              disabled={loading}
            >
              <TestTube size={20} color={theme.textInverse} />
              <Text style={[styles.testButtonText, { color: theme.textInverse }]}>
                Send Test Notification
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>About Notifications</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • Notifications help you stay on top of your finances
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • Budget warnings help prevent overspending
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • You can customize when and how often you receive alerts
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • All notifications can be managed in your device settings
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  thresholdContainer: {
    padding: 16,
    borderRadius: 12,
  },
  thresholdText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  thresholdButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
}); 