import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { User, X, Save, Lock, Eye, EyeOff } from 'lucide-react-native';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { user, refreshUser } = useAuthStore();
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    if (visible && user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (activeSection === 'profile') {
      await handleSaveProfile();
    } else {
      await handleSavePassword();
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);

    try {
      // Update user metadata (full name)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (updateError) {
        Alert.alert('Error', updateError.message);
        return;
      }

      // Update email if it changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim(),
        });

        if (emailError) {
          Alert.alert('Error', emailError.message);
          return;
        }

        Alert.alert(
          'Email Update',
          'A confirmation email has been sent to your new email address. Please check your inbox and confirm the change.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        await refreshUser();
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: onClose }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'New password is required');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      await refreshUser();
      Alert.alert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setActiveSection('profile');
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <X size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Save size={24} color={loading ? theme.textTertiary : theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Section Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'profile' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setActiveSection('profile')}
            >
              <User size={20} color={activeSection === 'profile' ? theme.textInverse : theme.textSecondary} />
              <Text style={[
                styles.tabText,
                { color: activeSection === 'profile' ? theme.textInverse : theme.textSecondary }
              ]}>
                Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'password' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setActiveSection('password')}
            >
              <Lock size={20} color={activeSection === 'password' ? theme.textInverse : theme.textSecondary} />
              <Text style={[
                styles.tabText,
                { color: activeSection === 'password' ? theme.textInverse : theme.textSecondary }
              ]}>
                Password
              </Text>
            </TouchableOpacity>
          </View>

          {activeSection === 'profile' ? (
            <>
              {/* Profile Avatar */}
              <View style={styles.avatarSection}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <User size={32} color={theme.textInverse} />
                </View>
                <Text style={[styles.avatarText, { color: theme.textSecondary }]}>
                  Profile Picture
                </Text>
                <Text style={[styles.avatarSubtext, { color: theme.textTertiary }]}>
                  Coming soon
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formSection}>
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Full Name</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        backgroundColor: theme.surface,
                        color: theme.textPrimary,
                        borderColor: theme.border
                      }
                    ]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.textTertiary}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        backgroundColor: theme.surface,
                        color: theme.textPrimary,
                        borderColor: theme.border
                      }
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>Account Information</Text>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  • Your email address is used for account verification and password recovery
                </Text>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  • When you change your email, you'll need to verify the new address
                </Text>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  • Your data is securely stored and never shared with third parties
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Password Change Section */}
              <View style={styles.avatarSection}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <Lock size={32} color={theme.textInverse} />
                </View>
                <Text style={[styles.avatarText, { color: theme.textSecondary }]}>
                  Change Password
                </Text>
                <Text style={[styles.avatarSubtext, { color: theme.textTertiary }]}>
                  Keep your account secure
                </Text>
              </View>

              <View style={styles.formSection}>
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
                      editable={!loading}
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
                      editable={!loading}
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
                      editable={!loading}
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
              </View>

              {/* Password Info Section */}
              <View style={styles.infoSection}>
                <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>Password Requirements</Text>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  • Password must be at least 6 characters long
                </Text>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  • Use a combination of letters, numbers, and symbols for better security
                </Text>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  • Never share your password with anyone
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  avatarSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  formSection: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  passwordInputContainer: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeButton: {
    padding: 4,
  },
  infoSection: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
}); 