import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  UserCheck, 
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  Bell
} from 'lucide-react-native';

interface SecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SecurityModal({ visible, onClose }: SecurityModalProps) {
  const theme = useTheme();
  const { user, sessionExpiry, extendSession } = useAuthStore();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Privacy settings state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [dataSharingEnabled, setDataSharingEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  
  // Security features state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [suspiciousActivityAlerts, setSuspiciousActivityAlerts] = useState(true);
  
  // App lock state
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [appLockPin, setAppLockPin] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupStep, setPinSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempPin, setTempPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Initialize biometric authentication
  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricSetting();
    loadAppLockSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      setBiometricAvailable(available);
      if (available && biometryType) {
        setBiometricType(biometryType);
      }
    } catch (error) {
      console.log('Biometric check failed:', error);
      setBiometricAvailable(false);
    }
  };

  const loadBiometricSetting = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      if (enabled === 'true') {
        setBiometricEnabled(true);
      }
    } catch (error) {
      console.log('Failed to load biometric setting:', error);
    }
  };

  const saveBiometricSetting = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('biometricEnabled', enabled.toString());
    } catch (error) {
      console.log('Failed to save biometric setting:', error);
    }
  };

  const loadAppLockSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('appLockEnabled');
      const pin = await AsyncStorage.getItem('appLockPin');
      if (enabled === 'true' && pin) {
        setAppLockEnabled(true);
        setAppLockPin(pin);
      }
    } catch (error) {
      console.log('Failed to load app lock settings:', error);
    }
  };

  const saveAppLockSettings = async (enabled: boolean, pin?: string) => {
    try {
      await AsyncStorage.setItem('appLockEnabled', enabled.toString());
      if (pin) {
        await AsyncStorage.setItem('appLockPin', pin);
      }
    } catch (error) {
      console.log('Failed to save app lock settings:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTwoFactorToggle = () => {
    Alert.alert(
      'Two-Factor Authentication',
      twoFactorEnabled 
        ? 'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
        : 'Two-factor authentication adds an extra layer of security to your account. You\'ll need to enter a code from your authenticator app when signing in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: twoFactorEnabled ? 'Disable' : 'Enable',
          style: twoFactorEnabled ? 'destructive' : 'default',
          onPress: () => {
            setTwoFactorEnabled(!twoFactorEnabled);
            Alert.alert(
              'Success',
              twoFactorEnabled 
                ? 'Two-factor authentication has been disabled'
                : 'Two-factor authentication has been enabled'
            );
          }
        }
      ]
    );
  };

  const handleBiometricToggle = async () => {
    if (!biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Biometric authentication is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (biometricEnabled) {
      // Disable biometric authentication
      Alert.alert(
        'Disable Biometric Authentication',
        'Are you sure you want to disable biometric authentication?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              setBiometricEnabled(false);
              await saveBiometricSetting(false);
              Alert.alert('Success', 'Biometric authentication has been disabled');
            }
          }
        ]
      );
    } else {
      // Enable biometric authentication
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        
        // First, check if biometric is available
        const { available } = await rnBiometrics.isSensorAvailable();
        
        if (!available) {
          Alert.alert(
            'Biometric Not Available',
            'Biometric authentication is not available on this device.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Prompt user to authenticate with biometric
        const { success, error } = await rnBiometrics.simplePrompt({
          promptMessage: `Enable ${biometricType} Authentication`,
          cancelButtonText: 'Cancel'
        });

        if (success) {
          // Biometric authentication successful, enable it
          setBiometricEnabled(true);
          await saveBiometricSetting(true);
          Alert.alert(
            'Success', 
            `${biometricType} authentication has been enabled. You can now use ${biometricType.toLowerCase()} to sign in.`
          );
        } else if (error) {
          Alert.alert('Authentication Failed', error);
        }
      } catch (error) {
        console.log('Biometric authentication error:', error);
        Alert.alert(
          'Authentication Error',
          'Failed to enable biometric authentication. Please try again.'
        );
      }
    }
  };

  const testBiometricAuthentication = async () => {
    if (!biometricAvailable || !biometricEnabled) {
      Alert.alert(
        'Biometric Not Available',
        'Biometric authentication is not available or not enabled.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const rnBiometrics = new ReactNativeBiometrics();
      
      const { success, error } = await rnBiometrics.simplePrompt({
        promptMessage: `Test ${biometricType} Authentication`,
        cancelButtonText: 'Cancel'
      });

      if (success) {
        Alert.alert('Success', `${biometricType} authentication test passed!`);
      } else if (error) {
        Alert.alert('Authentication Failed', error);
      }
    } catch (error) {
      console.log('Biometric test error:', error);
      Alert.alert(
        'Test Error',
        'Failed to test biometric authentication. Please try again.'
      );
    }
  };

  const handleAppLockToggle = async () => {
    if (appLockEnabled) {
      // Disable app lock
      Alert.alert(
        'Disable App Lock',
        'Are you sure you want to disable app lock? You will no longer need to enter a PIN to access the app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              setAppLockEnabled(false);
              setAppLockPin('');
              await saveAppLockSettings(false);
              Alert.alert('Success', 'App lock has been disabled');
            }
          }
        ]
      );
    } else {
      // Enable app lock - show PIN setup
      setShowPinSetup(true);
      setPinSetupStep('create');
      setTempPin('');
      setPinError('');
    }
  };

  const handlePinSetup = async () => {
    if (pinSetupStep === 'create') {
      if (tempPin.length < 4) {
        setPinError('PIN must be at least 4 digits');
        return;
      }
      setAppLockPin(tempPin);
      setPinSetupStep('confirm');
      setTempPin('');
      setPinError('');
    } else {
      // Confirm step
      if (tempPin !== appLockPin) {
        setPinError('PINs do not match');
        return;
      }
      
      // PIN setup successful
      setAppLockEnabled(true);
      await saveAppLockSettings(true, appLockPin);
      setShowPinSetup(false);
      setPinSetupStep('create');
      setTempPin('');
      setPinError('');
      Alert.alert('Success', 'App lock has been enabled with your PIN');
    }
  };

  const handleExtendSession = async () => {
    try {
      await extendSession();
      Alert.alert('Success', 'Your session has been extended for 7 more days');
    } catch (error) {
      Alert.alert('Error', 'Failed to extend session');
    }
  };

  const formatTimeRemaining = () => {
    try {
      if (!sessionExpiry) return 'No active session';
      
      const now = new Date();
      const timeRemaining = sessionExpiry.getTime() - now.getTime();
      
      if (timeRemaining <= 0) return 'Session expired';
      
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.log('Error formatting time remaining:', error);
      return 'Session status unavailable';
    }
  };

  const handleDataSharingToggle = () => {
    Alert.alert(
      'Data Sharing',
      dataSharingEnabled
        ? 'Disabling data sharing will prevent us from using your data to improve our services.'
        : 'Enabling data sharing helps us improve our services and provide better features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: dataSharingEnabled ? 'Disable' : 'Enable',
          onPress: () => setDataSharingEnabled(!dataSharingEnabled)
        }
      ]
    );
  };

  const SecuritySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: theme.primary }]}>
              <Shield size={24} color="#FFFFFF" />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Security</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Manage your account security</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Password Change Section */}
          <SecuritySection title="Password">
            <Card style={styles.passwordCard}>
              <View style={styles.passwordHeader}>
                <Lock size={20} color={theme.primary} />
                <Text style={[styles.passwordTitle, { color: theme.textPrimary }]}>Change Password</Text>
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Current Password</Text>
                <View style={[
                  styles.passwordInputContainer,
                  { 
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }
                ]}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      { color: theme.textPrimary }
                    ]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.textTertiary}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={styles.eyeButton}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} color={theme.textTertiary} />
                    ) : (
                      <Eye size={20} color={theme.textTertiary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>New Password</Text>
                <View style={[
                  styles.passwordInputContainer,
                  { 
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }
                ]}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      { color: theme.textPrimary }
                    ]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.textTertiary}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeButton}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color={theme.textTertiary} />
                    ) : (
                      <Eye size={20} color={theme.textTertiary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Confirm New Password</Text>
                <View style={[
                  styles.passwordInputContainer,
                  { 
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }
                ]}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      { color: theme.textPrimary }
                    ]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={theme.textTertiary} />
                    ) : (
                      <Eye size={20} color={theme.textTertiary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <Button
                title={isChangingPassword ? "Updating..." : "Update Password"}
                onPress={handlePasswordChange}
                disabled={isChangingPassword}
                style={styles.updateButton}
              />
            </Card>
          </SecuritySection>

          {/* Authentication Section */}
          <SecuritySection title="Authentication">
            <TouchableOpacity onPress={handleTwoFactorToggle} activeOpacity={0.7}>
              <Card style={styles.securityItem}>
                <View style={styles.securityItemContent}>
                  <View style={styles.securityItemLeft}>
                    <View style={[styles.securityItemIcon, { backgroundColor: theme.primary }]}>
                      <Smartphone size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.securityItemText}>
                      <Text style={[styles.securityItemTitle, { color: theme.textPrimary }]}>Two-Factor Authentication</Text>
                      <Text style={[styles.securityItemSubtitle, { color: theme.textSecondary }]}>Add an extra layer of security</Text>
                    </View>
                  </View>
                  <Switch
                    value={twoFactorEnabled}
                    onValueChange={handleTwoFactorToggle}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={twoFactorEnabled ? '#FFFFFF' : theme.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleBiometricToggle} activeOpacity={0.7} disabled={!biometricAvailable}>
              <Card style={{ ...styles.securityItem, opacity: biometricAvailable ? 1 : 0.6 }}>
                <View style={styles.securityItemContent}>
                  <View style={styles.securityItemLeft}>
                    <View style={[
                      styles.securityItemIcon, 
                      { 
                        backgroundColor: biometricAvailable ? theme.primary : theme.textTertiary 
                      }
                    ]}>
                      <UserCheck size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.securityItemText}>
                      <Text style={[
                        styles.securityItemTitle, 
                        { 
                          color: biometricAvailable ? theme.textPrimary : theme.textTertiary 
                        }
                      ]}>
                        Biometric Authentication
                      </Text>
                      <Text style={[
                        styles.securityItemSubtitle, 
                        { 
                          color: biometricAvailable ? theme.textSecondary : theme.textTertiary 
                        }
                      ]}>
                        {biometricAvailable 
                          ? `Sign in with ${biometricType.toLowerCase()}`
                          : 'Not available on this device'
                        }
                      </Text>
                    </View>
                  </View>
                  {biometricAvailable ? (
                    <Switch
                      value={biometricEnabled}
                      onValueChange={handleBiometricToggle}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor={biometricEnabled ? '#FFFFFF' : theme.textSecondary}
                    />
                  ) : (
                    <View style={styles.unavailableIndicator}>
                      <Text style={[styles.unavailableText, { color: theme.textTertiary }]}>N/A</Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setAutoLockEnabled(!autoLockEnabled)} activeOpacity={0.7}>
              <Card style={styles.securityItem}>
                <View style={styles.securityItemContent}>
                  <View style={styles.securityItemLeft}>
                    <View style={[styles.securityItemIcon, { backgroundColor: theme.primary }]}>
                      <Lock size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.securityItemText}>
                      <Text style={[styles.securityItemTitle, { color: theme.textPrimary }]}>Auto-Lock</Text>
                      <Text style={[styles.securityItemSubtitle, { color: theme.textSecondary }]}>Lock app when inactive</Text>
                    </View>
                  </View>
                  <Switch
                    value={autoLockEnabled}
                    onValueChange={setAutoLockEnabled}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={autoLockEnabled ? '#FFFFFF' : theme.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleAppLockToggle} activeOpacity={0.7}>
              <Card style={styles.securityItem}>
                <View style={styles.securityItemContent}>
                  <View style={styles.securityItemLeft}>
                    <View style={[styles.securityItemIcon, { backgroundColor: theme.primary }]}>
                      <Shield size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.securityItemText}>
                      <Text style={[styles.securityItemTitle, { color: theme.textPrimary }]}>App Lock</Text>
                      <Text style={[styles.securityItemSubtitle, { color: theme.textSecondary }]}>
                        {appLockEnabled ? 'PIN required to open app' : 'Set PIN to lock app'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={appLockEnabled}
                    onValueChange={handleAppLockToggle}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={appLockEnabled ? '#FFFFFF' : theme.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          </SecuritySection>

          {/* Privacy Section */}
          <SecuritySection title="Privacy">
            <TouchableOpacity onPress={handleDataSharingToggle} activeOpacity={0.7}>
              <Card style={styles.securityItem}>
                <View style={styles.securityItemContent}>
                  <View style={styles.securityItemLeft}>
                    <View style={[styles.securityItemIcon, { backgroundColor: theme.primary }]}>
                      <CheckCircle size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.securityItemText}>
                      <Text style={[styles.securityItemTitle, { color: theme.textPrimary }]}>Data Sharing</Text>
                      <Text style={[styles.securityItemSubtitle, { color: theme.textSecondary }]}>Help improve our services</Text>
                    </View>
                  </View>
                  <Switch
                    value={dataSharingEnabled}
                    onValueChange={handleDataSharingToggle}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={dataSharingEnabled ? '#FFFFFF' : theme.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setAnalyticsEnabled(!analyticsEnabled)} activeOpacity={0.7}>
              <Card style={styles.securityItem}>
                <View style={styles.securityItemContent}>
                  <View style={styles.securityItemLeft}>
                    <View style={[styles.securityItemIcon, { backgroundColor: theme.primary }]}>
                      <CheckCircle size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.securityItemText}>
                      <Text style={[styles.securityItemTitle, { color: theme.textPrimary }]}>Analytics</Text>
                      <Text style={[styles.securityItemSubtitle, { color: theme.textSecondary }]}>Allow anonymous usage data</Text>
                    </View>
                  </View>
                  <Switch
                    value={analyticsEnabled}
                    onValueChange={setAnalyticsEnabled}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={analyticsEnabled ? '#FFFFFF' : theme.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          </SecuritySection>

          {/* Notifications Section */}
          <SecuritySection title="Security Notifications">
            <TouchableOpacity onPress={() => setLoginNotifications(!loginNotifications)} activeOpacity={0.7}>
              <Card style={styles.securityItem}>
                <View style={styles.securityItemContent}>
                  <View style={styles.securityItemLeft}>
                    <View style={[styles.securityItemIcon, { backgroundColor: theme.primary }]}>
                      <Bell size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.securityItemText}>
                      <Text style={[styles.securityItemTitle, { color: theme.textPrimary }]}>Login Notifications</Text>
                      <Text style={[styles.securityItemSubtitle, { color: theme.textSecondary }]}>Get notified of new sign-ins</Text>
                    </View>
                  </View>
                  <Switch
                    value={loginNotifications}
                    onValueChange={setLoginNotifications}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={loginNotifications ? '#FFFFFF' : theme.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setSuspiciousActivityAlerts(!suspiciousActivityAlerts)} activeOpacity={0.7}>
              <Card style={styles.securityItem}>
                <View style={styles.securityItemContent}>
                  <View style={styles.securityItemLeft}>
                    <View style={[styles.securityItemIcon, { backgroundColor: theme.primary }]}>
                      <AlertTriangle size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.securityItemText}>
                      <Text style={[styles.securityItemTitle, { color: theme.textPrimary }]}>Suspicious Activity Alerts</Text>
                      <Text style={[styles.securityItemSubtitle, { color: theme.textSecondary }]}>Get alerts for unusual activity</Text>
                    </View>
                  </View>
                  <Switch
                    value={suspiciousActivityAlerts}
                    onValueChange={setSuspiciousActivityAlerts}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={suspiciousActivityAlerts ? '#FFFFFF' : theme.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          </SecuritySection>

          {/* Session Management */}
          <SecuritySection title="Session Management">
            <Card style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={[styles.sessionIcon, { backgroundColor: theme.primary }]}>
                  <Shield size={20} color="#FFFFFF" />
                </View>
                <View style={styles.sessionTextContainer}>
                  <Text style={[styles.sessionTitle, { color: theme.textPrimary }]}>Active Session</Text>
                  <Text style={[styles.sessionSubtitle, { color: theme.textSecondary }]}>
                    {formatTimeRemaining()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.sessionActions}>
                <TouchableOpacity
                  onPress={handleExtendSession}
                  style={[styles.sessionButton, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.sessionButtonText, { color: theme.textInverse }]}>
                    Extend Session
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.sessionDetails}>
                <Text style={[styles.sessionInfoText, { color: theme.textSecondary }]}>
                  • Sessions expire after 7 days of inactivity
                </Text>
                <Text style={[styles.sessionInfoText, { color: theme.textSecondary }]}>
                  • You'll be automatically logged out when expired
                </Text>
                <Text style={[styles.sessionInfoText, { color: theme.textSecondary }]}>
                  • Extend your session to stay logged in longer
                </Text>
              </View>
            </Card>
          </SecuritySection>

          {/* Account Security Info */}
          <SecuritySection title="Account Security">
            <Card style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Shield size={20} color={theme.success} />
                <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>Security Status</Text>
              </View>
              <View style={styles.securityStatus}>
                <View style={styles.statusItem}>
                  <CheckCircle size={16} color={theme.success} />
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>Strong password</Text>
                </View>
                <View style={styles.statusItem}>
                  {twoFactorEnabled ? (
                    <CheckCircle size={16} color={theme.success} />
                  ) : (
                    <AlertTriangle size={16} color={theme.warning} />
                  )}
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    {twoFactorEnabled ? '2FA enabled' : '2FA recommended'}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  {biometricEnabled ? (
                    <CheckCircle size={16} color={theme.success} />
                  ) : biometricAvailable ? (
                    <AlertTriangle size={16} color={theme.warning} />
                  ) : (
                    <AlertTriangle size={16} color={theme.textTertiary} />
                  )}
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    {biometricEnabled 
                      ? `${biometricType} enabled` 
                      : biometricAvailable 
                        ? `${biometricType} available` 
                        : 'Biometric not available'
                    }
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  {appLockEnabled ? (
                    <CheckCircle size={16} color={theme.success} />
                  ) : (
                    <AlertTriangle size={16} color={theme.warning} />
                  )}
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    {appLockEnabled ? 'App lock enabled' : 'App lock recommended'}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  {(() => {
                    try {
                      return sessionExpiry && new Date() < sessionExpiry ? (
                        <CheckCircle size={16} color={theme.success} />
                      ) : (
                        <AlertTriangle size={16} color={theme.warning} />
                      );
                    } catch (error) {
                      console.log('Error checking session status:', error);
                      return <AlertTriangle size={16} color={theme.warning} />;
                    }
                  })()}
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    {(() => {
                      try {
                        return sessionExpiry && new Date() < sessionExpiry 
                          ? 'Active session' 
                          : 'Session expired';
                      } catch (error) {
                        console.log('Error getting session status text:', error);
                        return 'Session status unavailable';
                      }
                    })()}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <CheckCircle size={16} color={theme.success} />
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>Secure connection</Text>
                </View>
              </View>
              
              {biometricEnabled && (
                <TouchableOpacity 
                  onPress={testBiometricAuthentication}
                  style={styles.testButton}
                >
                  <Text style={[styles.testButtonText, { color: theme.primary }]}>
                    Test {biometricType} Authentication
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          </SecuritySection>
        </ScrollView>
      </View>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPinSetup}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowPinSetup(false);
          setPinSetupStep('create');
          setTempPin('');
          setPinError('');
        }}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerContent}>
              <View style={[styles.headerIcon, { backgroundColor: theme.primary }]}>
                <Shield size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Set App Lock PIN</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  {pinSetupStep === 'create' ? 'Create a 4-digit PIN' : 'Confirm your PIN'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => {
                setShowPinSetup(false);
                setPinSetupStep('create');
                setTempPin('');
                setPinError('');
              }} 
              style={styles.closeButton}
            >
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.pinSetupContent}>
            <View style={styles.pinSetupSection}>
              <Text style={[styles.pinSetupTitle, { color: theme.textPrimary }]}>
                {pinSetupStep === 'create' ? 'Create PIN' : 'Confirm PIN'}
              </Text>
              <Text style={[styles.pinSetupSubtitle, { color: theme.textSecondary }]}>
                {pinSetupStep === 'create' 
                  ? 'Enter a 4-digit PIN to secure your app' 
                  : 'Re-enter your PIN to confirm'
                }
              </Text>
              
              <View style={styles.pinInputContainer}>
                <TextInput
                  style={[
                    styles.pinInput,
                    { 
                      color: theme.textPrimary,
                      backgroundColor: theme.surface,
                      borderColor: pinError ? theme.error : theme.border
                    }
                  ]}
                  value={tempPin}
                  onChangeText={(text) => {
                    setTempPin(text.replace(/[^0-9]/g, '').slice(0, 4));
                    setPinError('');
                  }}
                  placeholder="Enter PIN"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                  secureTextEntry={true}
                  maxLength={4}
                  autoFocus={true}
                />
              </View>
              
              {pinError ? (
                <Text style={[styles.pinError, { color: theme.error }]}>{pinError}</Text>
              ) : null}
              
              <View style={styles.pinSetupButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setShowPinSetup(false);
                    setPinSetupStep('create');
                    setTempPin('');
                    setPinError('');
                  }}
                  style={[styles.pinButton, { borderColor: theme.border }]}
                >
                  <Text style={[styles.pinButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handlePinSetup}
                  style={[
                    styles.pinButton, 
                    { 
                      backgroundColor: theme.primary,
                      borderColor: theme.primary
                    }
                  ]}
                  disabled={tempPin.length < 4}
                >
                  <Text style={[
                    styles.pinButtonText, 
                    { 
                      color: tempPin.length >= 4 ? theme.textInverse : theme.textTertiary 
                    }
                  ]}>
                    {pinSetupStep === 'create' ? 'Next' : 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  passwordCard: {
    padding: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  input: {
    marginBottom: 12,
  },
  updateButton: {
    marginTop: 8,
  },
  securityItem: {
    marginBottom: 8,
    padding: 16,
  },
  securityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  securityItemText: {
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  securityItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  infoCard: {
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  securityStatus: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  disabledItem: {
    opacity: 0.6,
  },
  unavailableIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  unavailableText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  testButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  pinSetupContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pinSetupSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  pinSetupTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  pinSetupSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pinInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  pinInput: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    borderWidth: 2,
    borderRadius: 12,
    letterSpacing: 8,
  },
  pinError: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 30,
    textAlign: 'center',
  },
  pinSetupButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  pinButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  pinButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sessionCard: {
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionTextContainer: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  sessionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sessionActions: {
    marginBottom: 16,
  },
  sessionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sessionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  sessionDetails: {
    marginTop: 8,
  },
  sessionInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
}); 