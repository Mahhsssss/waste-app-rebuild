import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';
import globalStyles, { colors } from '../globalStyles';

export default function PasswordChangedScreen({ onNavigate }) {
  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={globalStyles.passwordChangedContainer}>
        <View style={globalStyles.passwordChangedCenterSection}>
          <Text style={globalStyles.passwordChangedTitle}>Password changed</Text>
          <Text style={globalStyles.passwordChangedSubtitle}>
            Your password has been changed succesfully
          </Text>

          <TouchableOpacity
            style={[globalStyles.primaryButton, { width: '100%' }]}
            activeOpacity={0.85}
            onPress={() => onNavigate && onNavigate('Login')}
          >
            <Text style={globalStyles.primaryButtonText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
