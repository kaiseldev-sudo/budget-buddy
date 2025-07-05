import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  loading: boolean;
  sessionExpiry: Date | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => void;
  refreshUser: () => Promise<void>;
  checkSessionExpiry: () => boolean;
  extendSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  sessionExpiry: null,

  signIn: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Set session expiry to 7 days from now
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      
      set({ sessionExpiry: newExpiry });
      
      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem('sessionExpiry', newExpiry.toISOString());
      } catch (storageError) {
        console.log('Failed to save session expiry:', storageError);
      }

      return {};
    } catch (error) {
      console.log('Sign in error:', error);
      return { error: 'An unexpected error occurred' };
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, sessionExpiry: null });
    
    // Clear session expiry from AsyncStorage
    try {
      await AsyncStorage.removeItem('sessionExpiry');
    } catch (error) {
      console.log('Failed to clear session expiry:', error);
    }
  },

  initialize: () => {
    // Load session expiry from AsyncStorage
    const loadSessionExpiry = async () => {
      try {
        const savedExpiry = await AsyncStorage.getItem('sessionExpiry');
        if (savedExpiry) {
          const expiryDate = new Date(savedExpiry);
          set({ sessionExpiry: expiryDate });
          
          // Check if session is expired
          const now = new Date();
          if (now > expiryDate) {
            // Session expired, sign out user
            await supabase.auth.signOut();
            set({ user: null, sessionExpiry: null, loading: false });
            await AsyncStorage.removeItem('sessionExpiry');
            return;
          }
        }
      } catch (error) {
        console.log('Failed to load session expiry:', error);
      }
    };

    // Load session expiry
    loadSessionExpiry();

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, loading: false });
    });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false });
    });
  },

  refreshUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    set({ user });
  },

  checkSessionExpiry: () => {
    const { sessionExpiry } = get();
    if (!sessionExpiry) return false;
    
    const now = new Date();
    const isExpired = now > sessionExpiry;
    
    if (isExpired) {
      // Session expired, sign out user
      // Use setTimeout to avoid calling signOut during render
      setTimeout(() => {
        get().signOut();
      }, 0);
      return true;
    }
    
    return false;
  },

  extendSession: async () => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7); // 7 days from now
    
    set({ sessionExpiry: newExpiry });
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('sessionExpiry', newExpiry.toISOString());
    } catch (error) {
      console.log('Failed to save session expiry:', error);
    }
  },
}));