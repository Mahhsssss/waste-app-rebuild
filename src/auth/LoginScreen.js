import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import '../global.css';
import globalStyles, { colors } from '../globalStyles';
import GoogleIcon from '../components/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase'; 

export default function LoginScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle, signInAsGuest, resendConfirmation } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('error');

  // 1. Listen for Supabase session changes & automatic redirect to Home
  useEffect(() => {
    // Check if user is already logged in on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && onNavigate) {
        onNavigate('HomeScreen');
      }
    });

    // Listen for auth state changes (triggers right after Google OAuth completes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && onNavigate) {
        onNavigate('HomeScreen');
      }
    });

    return () => subscription.unsubscribe();
  }, [onNavigate]);

  // 2. Handle incoming deep link URLs when redirected back from Google browser
  useEffect(() => {
    const handleDeepLink = async (event) => {
      if (event?.url) {
        await supabase.auth.exchangeCodeForSession(event.url);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) supabase.auth.exchangeCodeForSession(url);
    });

    return () => subscription.remove();
  }, []);

  const isEmailValid = email.includes('@') && email.includes('.');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorType('error');
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await signIn(email, password);

      if (res.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || '';
        const isEmailNotConfirmed = 
          res.errorCode === 'email_not_confirmed' || 
          errMsg.toLowerCase().includes('email not confirmed');

        if (isEmailNotConfirmed) {
          setErrorType('warning');
          setErrorMessage(
            'Your account was created, but Supabase requires your email to be verified. You can resend the link or enter immediately as a Citizen below.'
          );
        } else if (res.errorCode === 'invalid_credentials' || errMsg.toLowerCase().includes('invalid login credentials')) {
          setErrorType('error');
          setErrorMessage(
            'Invalid email or password. You can use 1-Tap Instant Login below if you do not have an account.'
          );
        } else {
          setErrorType('error');
          setErrorMessage(errMsg || 'Login failed. Please check your credentials.');
        }
      } else {
        // Successful login
        setErrorMessage('');
        if (onNavigate) {
          onNavigate('HomeScreen');
        }
      }
    } catch (err) {
      setErrorType('error');
      setErrorMessage(err.message || 'Something went wrong during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email to resend verification.');
      setErrorType('error');
      return;
    }
    try {
      const { error: resendErr } = await resendConfirmation(email);
      if (resendErr) {
        setErrorMessage(`Resend Notice: ${resendErr}`);
        setErrorType('error');
      } else {
        setErrorMessage(`A new verification link has been sent to ${email}. Please check your inbox and spam folder.`);
        setErrorType('success');
      }
    } catch (e) {
      setErrorMessage(e.message || 'Could not resend email.');
      setErrorType('error');
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setGuestLoading(true);
      await signInAsGuest('Citizen Explorer');
      if (onNavigate) {
        onNavigate('HomeScreen');
      }
    } catch (err) {
      setErrorType('error');
      setErrorMessage(err.message || 'Could not log in as guest.');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(typeof error === 'string' ? error : error.message || 'Google sign in failed');
        setErrorType('error');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong with Google sign-in');
      setErrorType('error');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            globalStyles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 20, 36) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            {/* Header / Back Button */}
            <View style={globalStyles.headerRow}>
              <TouchableOpacity
                style={globalStyles.backButton}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => onNavigate && onNavigate('Welcome')}
              >
                <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Screen Title */}
            <View style={globalStyles.loginTitleRow}>
              <Text style={globalStyles.title}>Hi, Welcome! </Text>
              <Text style={{ fontSize: 26 }}>👋</Text>
            </View>
            <View style={{ height: 18 }} />

            {/* Dynamic Status / Error Feedback Banner */}
            {errorMessage ? (
              <View
                style={{
                  backgroundColor:
                    errorType === 'warning'
                      ? '#FFFBEB'
                      : errorType === 'success'
                      ? '#ECFDF5'
                      : '#FEF2F2',
                  borderColor:
                    errorType === 'warning'
                      ? '#FCD34D'
                      : errorType === 'success'
                      ? '#A7F3D0'
                      : '#FCA5A5',
                  borderWidth: 1.5,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 18,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons
                    name={
                      errorType === 'warning'
                        ? 'alert-circle'
                        : errorType === 'success'
                        ? 'checkmark-circle'
                        : 'close-circle'
                    }
                    size={20}
                    color={
                      errorType === 'warning'
                        ? '#D97706'
                        : errorType === 'success'
                        ? '#059669'
                        : '#DC2626'
                    }
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '800',
                      color:
                        errorType === 'warning'
                          ? '#92400E'
                          : errorType === 'success'
                          ? '#065F46'
                          : '#991B1B',
                    }}
                  >
                    {errorType === 'warning'
                      ? 'Email Verification Required'
                      : errorType === 'success'
                      ? 'Link Sent Successfully'
                      : 'Login Notice'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color:
                      errorType === 'warning'
                        ? '#78350F'
                        : errorType === 'success'
                        ? '#047857'
                        : '#7F1D1D',
                    lineHeight: 18,
                  }}
                >
                  {errorMessage}
                </Text>

                {errorType === 'warning' && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#D97706',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                      onPress={handleResend}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                        Resend Link
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#059669',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                      onPress={handleGuestSignIn}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                        Enter as Citizen
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}

            {/* Email Field */}
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.label}>Email address</Text>
              <View style={globalStyles.inputContainer}>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Your email"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {isEmailValid && (
                  <View style={{ paddingLeft: 8 }}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary600} />
                  </View>
                )}
              </View>
            </View>

            {/* Password Field */}
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.label}>Password</Text>
              <View style={globalStyles.inputContainer}>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={globalStyles.inputRightIcon}
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <View style={{ alignItems: 'flex-end', marginTop: 4, marginBottom: 16 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onNavigate && onNavigate('ForgotPassword')}
              >
                <Text style={globalStyles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Log In CTA Button */}
            <TouchableOpacity
              style={[
                globalStyles.primaryButton,
                loading && { opacity: 0.8 }
              ]}
              disabled={loading}
              activeOpacity={0.85}
              onPress={handleLogin}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={globalStyles.primaryButtonText}>Log in</Text>
              )}
            </TouchableOpacity>

            {/* 1-Tap Instant Demo Login Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#ECFDF5',
                borderColor: '#10B981',
                borderWidth: 1.5,
                borderRadius: 14,
                paddingVertical: 13,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 10,
              }}
              activeOpacity={0.8}
              disabled={guestLoading}
              onPress={handleGuestSignIn}
            >
              {guestLoading ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#059669" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#047857', fontSize: 14, fontWeight: '800' }}>
                    1-Tap Instant Login (Citizen Demo)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={globalStyles.dividerContainer}>
              <View style={globalStyles.dividerLine} />
              <Text style={globalStyles.dividerText}>Or with</Text>
              <View style={globalStyles.dividerLine} />
            </View>

            {/* Social Options */}
            <TouchableOpacity
              style={globalStyles.socialButtonCard}
              disabled={googleLoading}
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.primary600} />
              ) : (
                <>
                  <GoogleIcon size={20} />
                  <Text style={globalStyles.socialButtonCardText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Instant Demo Access / Continue as Guest */}
            <TouchableOpacity
              style={[
                globalStyles.socialButtonCard,
                {
                  marginTop: 12,
                  backgroundColor: '#ECFDF5',
                  borderColor: '#10B981',
                  borderWidth: 1.5,
                },
              ]}
              disabled={guestLoading}
              activeOpacity={0.8}
              onPress={handleGuestSignIn}
            >
              {guestLoading ? (
                <ActivityIndicator size="small" color={colors.primary600} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#059669" />
                  <Text
                    style={[
                      globalStyles.socialButtonCardText,
                      { color: '#047857', fontWeight: '700' },
                    ]}
                  >
                    Continue as Guest (Instant Access)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={globalStyles.footerRow}>
            <Text style={globalStyles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate && onNavigate('SignUp')}
            >
              <Text style={globalStyles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}