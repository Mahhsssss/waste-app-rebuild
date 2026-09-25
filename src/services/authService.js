import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import supabase from './supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email, password, username = '') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
          full_name: username.trim(),
        },
      },
    });

    if (error) throw error;
    return { data, error: null, errorCode: null };
  } catch (error) {
    return { 
      data: null, 
      error: error.message || 'Failed to sign up',
      errorCode: error.code || (error.message?.toLowerCase().includes('rate limit') ? 'over_email_send_rate_limit' : null)
    };
  }
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    return { data, error: null, errorCode: null };
  } catch (error) {
    const isEmailNotConfirmed = 
      error.code === 'email_not_confirmed' || 
      error.message?.toLowerCase().includes('email not confirmed');

    return { 
      data: null, 
      error: error.message || 'Failed to log in',
      errorCode: isEmailNotConfirmed ? 'email_not_confirmed' : (error.code || null)
    };
  }
}

/**
 * Resend Email Confirmation Link
 */
export async function resendConfirmationEmail(email) {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error.message || 'Failed to resend confirmation email',
      errorCode: error.code || null 
    };
  }
}

/**
 * Sign in with Google OAuth using Supabase
 * Handles Web and Mobile (Expo Go / Native) seamlessly
 */
export async function signInWithGoogle() {
  try {
    // 1. Web handling
    if (Platform.OS === 'web') {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      return { data, error: null };
    }

    // 2. Native / Mobile handling (iOS, Android, Expo Go)
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'wasteapp',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data?.url) {
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (res.type === 'success' && res.url) {
        const params = extractParamsFromUrl(res.url);
        if (params.access_token && params.refresh_token) {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
          if (sessionError) throw sessionError;
          return { data: sessionData, error: null };
        }
      }
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error.message || 'Google sign-in failed' };
  }
}

/**
 * Helper to extract tokens from url hash or query
 */
function extractParamsFromUrl(url) {
  const params = {};
  const queryOrHash = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  if (!queryOrHash) return params;

  const pairs = queryOrHash.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return params;
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail(email) {
  try {
    const redirectUrl = Platform.select({
      web: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081',
      default: AuthSession.makeRedirectUri({
        scheme: 'wasteapp',
        path: 'auth/reset-password',
      }),
    });

    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: redirectUrl,
      }
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || 'Failed to send password reset email' };
  }
}

/**
 * Update current user's password
 */
export async function updateUserPassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || 'Failed to update password' };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message || 'Failed to sign out' };
  }
}

/**
 * Get current session & user
 */
export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}
