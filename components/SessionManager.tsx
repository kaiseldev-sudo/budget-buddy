import React, { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';

export default function SessionManager() {
  const { user, sessionExpiry, checkSessionExpiry, extendSession, loading } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const sessionCheckInterval = useRef<number | null>(null);
  const hasShownExpiryWarning = useRef(false);

  // Don't run session management if still loading
  if (loading) {
    return null;
  }

  // Check session expiry when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (user && sessionExpiry) {
          try {
            const isExpired = checkSessionExpiry();
            if (isExpired) {
              Alert.alert(
                'Session Expired',
                'Your session has expired. Please sign in again.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/auth/sign-in');
                    }
                  }
                ]
              );
            }
          } catch (error) {
            console.log('Error checking session expiry on app state change:', error);
          }
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [user, sessionExpiry]); // Remove checkSessionExpiry from dependencies

  // Set up periodic session checks (every hour)
  useEffect(() => {
    if (user && sessionExpiry) {
      sessionCheckInterval.current = setInterval(() => {
        try {
          const isExpired = checkSessionExpiry();
          if (isExpired) {
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please sign in again.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.replace('/auth/sign-in');
                  }
                }
              ]
            );
          }
        } catch (error) {
          console.log('Error checking session expiry:', error);
        }
      }, 60 * 60 * 1000); // Check every hour
    }

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
        sessionCheckInterval.current = null;
      }
    };
  }, [user, sessionExpiry]); // Remove checkSessionExpiry from dependencies

  // Extend session when user is active (only once when component mounts)
  useEffect(() => {
    if (user && sessionExpiry) {
      const extendSessionOnActivity = async () => {
        try {
          await extendSession();
        } catch (error) {
          console.log('Failed to extend session:', error);
        }
      };

      // Only extend session once when component mounts
      extendSessionOnActivity();
    }
  }, [user]); // Remove sessionExpiry and extendSession from dependencies to prevent infinite loops

  // Show session expiry warning when session is about to expire (within 24 hours)
  useEffect(() => {
    if (user && sessionExpiry && !hasShownExpiryWarning.current) {
      const now = new Date();
      const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
      const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

      if (hoursUntilExpiry <= 24 && hoursUntilExpiry > 0) {
        hasShownExpiryWarning.current = true;
        Alert.alert(
          'Session Expiring Soon',
          `Your session will expire in ${Math.round(hoursUntilExpiry)} hours. You'll need to sign in again.`,
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  await extendSession();
                } catch (error) {
                  console.log('Failed to extend session:', error);
                }
              }
            }
          ]
        );
      }
    }
  }, [user, sessionExpiry]); // Remove extendSession from dependencies

  return null; // This component doesn't render anything
} 