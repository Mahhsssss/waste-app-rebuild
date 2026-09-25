import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import globalStyles, { colors, spacing, radius } from '../globalStyles';

export default function PrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const policies = [
    {
      title: 'Camera & Visual Data',
      icon: 'camera-outline',
      description:
        'When you use the waste scanner or take a garbage dump photo, image frames are processed in real-time by the YOLO detection model to identify scrap categories. We do not store raw images of your private spaces.',
    },
    {
      title: 'Location & Geographic Pinning',
      icon: 'location-outline',
      description:
        'GPS location data is requested solely when pinning an illegal garbage dump or locating nearby recycling stations. You can choose to manually enter a landmark instead of providing continuous GPS tracking.',
    },
    {
      title: 'Civic Report Transparency',
      icon: 'eye-outline',
      description:
        'Dump reports appear as anonymous pins on the community map to alert other residents. Your private contact details are never exposed to other users or commercial advertisers.',
    },
    {
      title: 'Account & Secure Credentials',
      icon: 'lock-closed-outline',
      description:
        'All authentication credentials, session tokens, and passwords are encrypted using industry-standard Supabase AES-256 and Argon2 key derivation. We never share user lists with third-party marketers.',
    },
    {
      title: 'Data Deletion Rights',
      icon: 'trash-bin-outline',
      description:
        'You maintain full ownership of your data. You may request permanent deletion of your scan history, reported dump submissions, and user account by contacting privacy@ecoshift.app.',
    },
  ];

  return (
    <SafeAreaView style={[globalStyles.safeArea, styles.safeAreaOverride]} edges={['top', 'left', 'right']}>
      <View style={styles.webWrapper}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="arrow-back" size={24} color={colors.primary800} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 25, 40) }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.bannerCard}>
              <Ionicons name="shield-checkmark" size={32} color="#16A34A" style={{ marginBottom: 6 }} />
              <Text style={styles.bannerTitle}>Your Data & Privacy Protected</Text>
              <Text style={styles.bannerText}>
                EcoShift is committed to preserving citizen privacy while fostering civic sustainability and responsible waste management.
              </Text>
            </View>

            {policies.map((p, idx) => (
              <View key={idx} style={styles.policyCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={p.icon} size={18} color={colors.primary800} />
                  </View>
                  <Text style={styles.policyTitle}>{p.title}</Text>
                </View>
                <Text style={styles.policyDesc}>{p.description}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Back to EcoShift</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaOverride: { flex: 1, backgroundColor: '#ffffff' },
  webWrapper: { flex: 1, alignItems: 'center', backgroundColor: Platform.OS === 'web' ? '#f3f6f3' : '#ffffff' },
  maxContainer: { flex: 1, width: '100%', maxWidth: 600, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'ios' ? spacing.xs : spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.primary800 },
  scrollContent: { padding: spacing.base, paddingBottom: 60 },
  bannerCard: {
    backgroundColor: '#DCFCE7',
    padding: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: spacing.base,
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: colors.primary800 },
  bannerText: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  policyCard: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary50 || '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  policyTitle: { fontSize: 15, fontWeight: '700', color: colors.primary800 },
  policyDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  doneBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary800,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
