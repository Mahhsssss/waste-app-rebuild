import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// SecureStore adapter for Supabase session persistence
const ExpoSecureStoreAdapter = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
      } catch (e) {
        return null;
      }
      return null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn('Error reading from SecureStore', err);
      return null;
    }
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('Error writing to localStorage', e);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('Error writing to SecureStore', err);
    }
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('Error removing from localStorage', e);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('Error deleting from SecureStore', err);
    }
  },
};

// Supabase credentials (reads from Expo / Next env variables or default project config)
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ivzkzhxiiiaqlxmkkaci.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_Bg1gkr0WEOmfxne13nhnMw_mcm0-PwL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { ExpoSecureStoreAdapter };
export default supabase;
