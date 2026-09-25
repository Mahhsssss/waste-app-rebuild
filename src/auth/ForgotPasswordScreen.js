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
import { useAuth } from '../context/AuthContext';
import showAlert from '../utils/alert';

export default function ForgotPasswordScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmailValid = email.includes('@') && email.includes('.');

  const handleSendLink = async () => {
    if (!email.trim() || !isEmailValid) {
      showAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await sendPasswordReset(email);
      if (error) {
        showAlert('Request Failed', error);
      } else {
        showAlert(
          'Email Sent',
          'Instructions to reset your password have been sent to your email.',
          [
            {
              text: 'OK',
              onPress: () => onNavigate && onNavigate('ResetPassword'),
            },
          ]
        );
      }
    } catch (err) {
      showAlert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
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
                onPress={() => onNavigate && onNavigate('Login')}
              >
                <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Screen Title & Subtitle */}
            <Text style={globalStyles.title}>Forgot password?</Text>
            <Text style={globalStyles.subtitle}>
              Don't worry! Enter the email address associated with your account to reset your password.
            </Text>

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

            <View style={{ height: 16 }} />

            {/* Send Reset Link CTA Button */}
            <TouchableOpacity
              style={[
                globalStyles.primaryButton,
                (!email.trim() || loading) && { opacity: 0.7 },
              ]}
              disabled={!email.trim() || loading}
              activeOpacity={0.85}
              onPress={handleSendLink}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={globalStyles.primaryButtonText}>Send instructions</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={globalStyles.footerRow}>
            <Text style={globalStyles.footerText}>Remember your password?</Text>
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
