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

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const modelSpecs = [
    { label: 'Model Architecture', value: 'YOLOv11 Fine-Tuned Vision Classifier' },
    { label: 'Scrap Categories', value: '59 Real-World Waste & Packaging Classes' },
    { label: 'API Endpoint', value: 'Modal Serverless Container GPU Runtime' },
    { label: 'Database Backend', value: 'Supabase PostgreSQL 15 Segregation Engine' },
    { label: 'Target Platforms', value: 'iOS, Android & Web (Expo SDK 54)' },
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
            <Text style={styles.headerTitle}>About EcoShift</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 25, 40) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo & App Info */}
            <View style={styles.appCard}>
              <View style={styles.logoCircle}>
                <Ionicons name="leaf" size={38} color={colors.white} />
              </View>
              <Text style={styles.appName}>EcoShift</Text>
              <Text style={styles.appTagline}>Civic Waste Classification & Dump Reporting</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>Version 2.4.0 (Production Build)</Text>
              </View>
            </View>

            {/* Mission Statement */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Our Mission</Text>
              <Text style={styles.sectionBody}>
                EcoShift empowers citizens to tackle municipal landfill crises through edge computer vision. By identifying 59 distinct scrap streams and providing actionable disposal routes, we divert recyclables from toxic combustion and empower municipal authorities with real-time illegal dump reporting.
              </Text>
            </View>

            {/* Technical Specifications */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>System Architecture</Text>
              {modelSpecs.map((spec, idx) => (
                <View key={idx} style={styles.specRow}>
                  <Text style={styles.specLabel}>{spec.label}:</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>

            {/* Recovery Hubs */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Recovery Hubs</Text>
              <Text style={styles.partnerItem}>• greenciti (Dreams Mall, Bhandup West)</Text>
              <Text style={styles.partnerItem}>• saahas (MCHS Colony, Kanjurmarg)</Text>
            </View>

            <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backHomeBtnText}>Back</Text>
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
  appCard: { alignItems: 'center', marginVertical: spacing.md },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary800,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: { fontSize: 24, fontWeight: '800', color: colors.primary800 },
  appTagline: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  versionBadge: {
    backgroundColor: colors.primary50 || '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: 10,
  },
  versionText: { fontSize: 11, fontWeight: '700', color: colors.primary800 },
  sectionCard: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    padding: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.primary800, marginBottom: 8 },
  sectionBody: { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  specLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, flex: 1 },
  specValue: { fontSize: 12, color: colors.primary800, fontWeight: '600', flex: 1.2, textAlign: 'right' },
  partnerItem: { fontSize: 13, color: colors.textPrimary, paddingVertical: 4 },
  backHomeBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary800,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backHomeBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
