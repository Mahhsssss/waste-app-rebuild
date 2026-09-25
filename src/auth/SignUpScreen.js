import React, { useState } from 'react';
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
import '../global.css';
import globalStyles, { colors } from '../globalStyles';
import GoogleIcon from '../components/GoogleIcon';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const { signUp, signInWithGoogle, signInAsGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('error');

  const handleSignUp = async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorType('error');
      setErrorMessage('Please enter both your email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorType('error');
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    const autoUsername = email.split('@')[0] || 'Eco Citizen';

    try {
      setLoading(true);
      const res = await signUp(email, password, autoUsername);
      if (res.error) {
        const errMsg = typeof res.error === 'string' ? res.error : res.error.message || '';
        const isRateLimited = 
          res.errorCode === 'over_email_send_rate_limit' || 
          errMsg.toLowerCase().includes('rate limit');

        if (isRateLimited) {
          setErrorType('warning');
          setErrorMessage(
            'Supabase email rate limit reached on the free tier. Tap below to enter directly as a Citizen with all features unlocked!'
          );
        } else if (errMsg.toLowerCase().includes('already registered')) {
          setErrorType('warning');
          setErrorMessage(
            'This email is already registered. You can log in with your password, or enter as Citizen below.'
          );
        } else {
          setErrorType('error');
          setErrorMessage(errMsg || 'Registration failed. Please try again.');
        }
      } else {
        setErrorType('success');
        setErrorMessage(
          `Your account has been created! A verification link was sent to ${email}. You can also enter immediately as a Citizen below.`
        );
      }
    } catch (err) {
      setErrorType('error');
      setErrorMessage(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setGuestLoading(true);
      await signInAsGuest(username || 'Eco Citizen');
    } catch (err) {
      Alert.alert('Guest Login Error', err.message || 'Could not sign in as guest');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Google Sign-In', error);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong');
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
            <Text style={globalStyles.title}>Create account</Text>
            <View style={{ height: 16 }} />

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
                      ? 'Notice'
                      : errorType === 'success'
                      ? 'Account Registered!'
                      : 'Sign Up Error'}
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

                {(errorType === 'warning' || errorType === 'success') && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
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
                        Enter Directly as Citizen
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#2563EB',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                      onPress={() => onNavigate && onNavigate('Login')}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                        Go to Login
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}

            {/* Email Field */}
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.label}>Email</Text>
              <View style={globalStyles.inputContainer}>
                <TextInput
                  style={globalStyles.input}
                  placeholder="example@gmail.com"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.label}>Password</Text>
              <View style={globalStyles.inputContainer}>
                <TextInput
                  style={globalStyles.input}
                  placeholder="At least 6 characters"
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

            {/* Terms and Privacy Notice */}
            <View style={{ marginTop: 2, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 17 }}>
                By signing up, you agree to our{' '}
                <Text 
                  style={{ color: colors.primary600, fontWeight: '700' }}
                  onPress={() => onNavigate && onNavigate('Terms')}
                >
                  Terms
                </Text>
                {' '}and{' '}
                <Text 
                  style={{ color: colors.primary600, fontWeight: '700' }}
                  onPress={() => onNavigate && onNavigate('Privacy')}
                >
                  Privacy Policy
                </Text>.
              </Text>
            </View>

            {/* Sign Up CTA Button */}
            <TouchableOpacity
              style={[
                globalStyles.primaryButton,
                loading && { opacity: 0.8 },
              ]}
              disabled={loading}
              activeOpacity={0.85}
              onPress={handleSignUp}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={globalStyles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={globalStyles.dividerContainer}>
              <View style={globalStyles.dividerLine} />
              <Text style={globalStyles.dividerText}>Or Register with</Text>
              <View style={globalStyles.dividerLine} />
            </View>

            {/* Social Options (Only Google, Apple/Facebook removed) */}
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
                    Continue as Guest (Instant Demo)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={globalStyles.footerRow}>
            <Text style={globalStyles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate && onNavigate('Login')}
            >
              <Text style={globalStyles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
