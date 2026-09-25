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

export default function ResetPasswordScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showAlert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await updatePassword(newPassword);
      if (error) {
        showAlert('Reset Failed', error);
      } else {
        if (onNavigate) {
          onNavigate('PasswordChanged');
        }
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
            <Text style={globalStyles.title}>Reset password</Text>
            <Text style={globalStyles.subtitle}>
              Please type something you'll remember
            </Text>

            {/* New Password Field */}
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.label}>New password</Text>
              <View style={globalStyles.inputContainer}>
                <TextInput
                  style={globalStyles.input}
                  placeholder="must be 8 characters"
                  placeholderTextColor={colors.placeholder}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={globalStyles.inputRightIcon}
                  activeOpacity={0.7}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password Field */}
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.label}>Confirm new password</Text>
              <View style={globalStyles.inputContainer}>
                <TextInput
                  style={globalStyles.input}
                  placeholder="repeat password"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={globalStyles.inputRightIcon}
                  activeOpacity={0.7}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 12 }} />

            {/* Reset Password Button */}
            <TouchableOpacity
              style={[
                globalStyles.primaryButton,
                loading && { opacity: 0.8 },
              ]}
              disabled={loading}
              activeOpacity={0.85}
              onPress={handleResetPassword}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={globalStyles.primaryButtonText}>Reset password</Text>
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
