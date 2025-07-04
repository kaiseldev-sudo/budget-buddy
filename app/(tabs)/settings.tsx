import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from '@/components/Card';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useThemeMode } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { User, Bell, Shield, Download, Moon, CircleHelp as HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import ThemeModal from '@/components/ThemeModal';

const settingsItems = [
  {
    id: 'profile',
    title: 'Profile',
    subtitle: 'Manage your account information',
    icon: User,
    color: '#2563EB',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Budget alerts and reminders',
    icon: Bell,
    color: '#F59E0B',
  },
  {
    id: 'security',
    title: 'Security',
    subtitle: 'Privacy and security settings',
    icon: Shield,
    color: '#10B981',
  },
  {
    id: 'export',
    title: 'Export Data',
    subtitle: 'Download your financial data',
    icon: Download,
    color: '#8B5CF6',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    subtitle: 'Dark mode and themes',
    icon: Moon,
    color: '#6B7280',
  },
  {
    id: 'help',
    title: 'Help & Support',
    subtitle: 'Get help and contact support',
    icon: HelpCircle,
    color: '#06B6D4',
  },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/sign-in');
          },
        },
      ]
    );
  };

  const handleSettingPress = (settingId: string) => {
    switch (settingId) {
      case 'profile':
        Alert.alert('Profile', 'Profile settings coming soon!');
        break;
      case 'notifications':
        Alert.alert('Notifications', 'Notification settings coming soon!');
        break;
      case 'security':
        Alert.alert('Security', 'Security settings coming soon!');
        break;
      case 'export':
        Alert.alert('Export Data', 'Data export feature coming soon!');
        break;
      case 'appearance':
        setThemeModalVisible(true);
        break;
      case 'help':
        Alert.alert('Help & Support', 'Help center coming soon!');
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
        </View>

        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]}>
                {user?.user_metadata?.full_name || 'User'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Settings Items */}
        <View style={styles.settingsSection}>
          {settingsItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.settingItem}
                onPress={() => handleSettingPress(item.id)}
                activeOpacity={0.7}
              >
                <Card style={styles.settingCard}>
                  <View style={styles.settingContent}>
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                        <IconComponent size={20} color="#FFFFFF" />
                      </View>
                                          <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                      <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={theme.textTertiary} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
          <Card style={styles.signOutCard}>
            <View style={styles.signOutContent}>
              <View style={styles.signOutIcon}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.textTertiary }]}>Budget Tracker v1.0.0</Text>
          <Text style={[styles.appInfoText, { color: theme.textTertiary }]}>Made with ❤️ by Bolt</Text>
        </View>
      </ScrollView>
      
      {/* Theme Modal */}
      <ThemeModal 
        visible={themeModalVisible} 
        onClose={() => setThemeModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  profileCard: {
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingCard: {
    padding: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  signOutCard: {
    marginBottom: 32,
    padding: 16,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
});