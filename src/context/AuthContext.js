import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase, { ExpoSecureStoreAdapter } from '../services/supabase';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  sendPasswordResetEmail,
  updateUserPassword,
  resendConfirmationEmail,
  signOut as authSignOut,
} from '../services/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session (Supabase or stored Guest session)
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
        } else {
          // Check for persistent guest session
          const storedGuest = await ExpoSecureStoreAdapter.getItem('ecoshift_guest_session');
          if (storedGuest) {
            try {
              const parsed = JSON.parse(storedGuest);
              if (parsed?.user) {
                setSession(parsed);
                setUser(parsed.user);
              }
            } catch (err) {
              console.warn('Invalid stored guest session', err);
            }
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignUp = async (email, password, username) => {
    const res = await signUpWithEmail(email, password, username);
    if (res.data?.session) {
      setSession(res.data.session);
      setUser(res.data.session.user);
    }
    return res;
  };

  const handleSignIn = async (email, password) => {
    const res = await signInWithEmail(email, password);
    if (res.data?.session) {
      setSession(res.data.session);
      setUser(res.data.session.user);
    }
    return res;
  };

  const handleGoogleSignIn = async () => {
    return await signInWithGoogle();
  };

  const handleResendConfirmation = async (email) => {
    return await resendConfirmationEmail(email);
  };

  const handleSignInAsGuest = async (name = 'Eco Citizen') => {
    const guestUser = {
      id: 'guest-' + Date.now(),
      email: 'guest.citizen@ecoshift.app',
      user_metadata: {
        username: name || 'Eco Citizen',
        full_name: name || 'Eco Citizen',
      },
      app_metadata: {
        provider: 'guest',
      },
    };
    const guestSession = {
      access_token: 'guest_token_' + Date.now(),
      user: guestUser,
    };

    try {
      await ExpoSecureStoreAdapter.setItem('ecoshift_guest_session', JSON.stringify(guestSession));
    } catch (e) {
      console.warn('Could not persist guest session:', e);
    }

    setSession(guestSession);
    setUser(guestUser);
    return { data: { session: guestSession, user: guestUser }, error: null };
  };

  const handlePasswordReset = async (email) => {
    return await sendPasswordResetEmail(email);
  };

  const handleUpdatePassword = async (newPassword) => {
    return await updateUserPassword(newPassword);
  };

  const handleSignOut = async () => {
    try {
      await ExpoSecureStoreAdapter.removeItem('ecoshift_guest_session');
    } catch (e) {
      // ignore
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('ecoshift_guest_session');
      } catch (e) {}
    }
    setSession(null);
    setUser(null);
    try {
      await authSignOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signInWithGoogle: handleGoogleSignIn,
        signInAsGuest: handleSignInAsGuest,
        resendConfirmation: handleResendConfirmation,
        sendPasswordReset: handlePasswordReset,
        updatePassword: handleUpdatePassword,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
