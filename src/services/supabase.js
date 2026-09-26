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

// Web: note what a sign-in redirect brought back (tokens or an error) before the client
// consumes and clears it from the address bar. Token values are never logged.
const readWebAuthRedirect = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const params = new URLSearchParams(
    [window.location.search.slice(1), window.location.hash.slice(1)].filter(Boolean).join('&')
  );
  const result = {
    hasTokens: params.has('access_token'),
    hasCode: params.has('code'),
    error: params.get('error_description') || params.get('error') || null,
  };
  if (result.hasTokens || result.hasCode || result.error) {
    console.log(
      `[auth] returned from sign-in at ${window.location.origin}: tokens=${result.hasTokens} code=${result.hasCode} error=${result.error || 'none'}`
    );
    return result;
  }
  return null;
};

export const webAuthRedirect = readWebAuthRedirect();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // On web, Google sign-in returns to the page with the session in the URL, so read it from there.
    // Native apps get it from the deep link instead (see authService.signInWithGoogle).
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export { ExpoSecureStoreAdapter };
export default supabase;
