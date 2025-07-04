import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Mail, Lock, User, CheckSquare, Square } from 'lucide-react-native';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [agreed, setAgreed] = useState(false);

  const signUp = useAuthStore((state) => state.signUp);
  const theme = useTheme();

  const handleSignUp = async () => {
    setErrors({});
    if (!fullName) {
      setErrors(prev => ({ ...prev, fullName: 'Full name is required' }));
      return;
    }
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      return;
    }
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }
    if (!agreed) {
      Alert.alert('Agreement Required', 'You must agree to the Terms and Conditions and Privacy Policy to create an account.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join us to start tracking your budget</Text>
        </View>
        <View style={styles.form}>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            leftIcon={<User size={20} color={theme.textTertiary} />}
            error={errors.fullName}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={theme.textTertiary} />}
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            leftIcon={<Lock size={20} color={theme.textTertiary} />}
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
            leftIcon={<Lock size={20} color={theme.textTertiary} />}
            error={errors.confirmPassword}
          />
          <View style={styles.checkboxRow}>
            <Pressable
              onPress={() => setAgreed((a) => !a)}
              style={({ pressed }) => [styles.checkbox, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary, opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
            >
              {agreed ? (
                <CheckSquare size={22} color={theme.primary} />
              ) : (
                <Square size={22} color={theme.textTertiary} />
              )}
            </Pressable>
            <Text style={[styles.checkboxLabel, { color: theme.textSecondary }]}>I agree to the </Text>
            <Link href="/terms" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, { color: theme.primary }]}>Terms and Conditions</Text>
              </TouchableOpacity>
            </Link>
            <Text style={[styles.checkboxLabel, { color: theme.textSecondary }]}> and </Text>
            <Link href="/privacy" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, { color: theme.primary }]}>Privacy Policy</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Button
            title={loading ? 'Creating Account...' : 'Sign Up'}
            onPress={handleSignUp}
            disabled={loading || !agreed}
            style={styles.signUpButton}
          />
        </View>
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
          <Link href="/auth/sign-in" asChild>
            <TouchableOpacity>
              <Text style={[styles.link, { color: theme.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  signUpButton: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  link: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});