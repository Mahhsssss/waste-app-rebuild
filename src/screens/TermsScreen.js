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

export default function TermsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const sections = [
    {
      title: '1. Civic Waste Reporting & Verification',
      content:
        'When reporting an illegal garbage pile or waste dump, you agree that the photos and coordinates submitted represent genuine civic conditions. Falsifying waste reports or submitting copyrighted or misleading imagery is strictly prohibited and may result in account termination.',
    },
    {
      title: '2. Waste Classification Guidelines',
      content:
        'Our scrap classification model identifies 59 waste categories to suggest ideal disposal bins and recycling channels. While the model maintains high accuracy, classification suggestions do not supersede local municipal segregation bylaws. Hazardous materials must always be handled in compliance with local environmental safety statutes.',
    },
    {
      title: '3. Municipal Authority Communication',
      content:
        'EcoShift facilitates communication between citizens and city municipal corporations or pollution control boards via standardized email templates. EcoShift acts solely as a technological facilitator and does not guarantee municipal response times or enforcement schedules.',
    },
    {
      title: '4. User Conduct & Photo Content',
      content:
        'Users are responsible for ensuring that uploaded dump photographs do not infringe upon third-party privacy, intellectual property, or capture non-consenting individuals. Images submitted become part of the anonymized civic waste impact database.',
    },
    {
      title: '5. Limitation of Liability',
      content:
        'Under no circumstances shall EcoShift or its developers be held liable for personal injury, property damage, or chemical exposure incurred while collecting, photographing, or handling hazardous municipal waste.',
    },
    {
      title: '6. Amendments to Terms',
      content:
        'We reserve the right to modify these terms as civic regulations and waste management legislation evolve. Continued use of the application constitutes acceptance of updated terms.',
    },
  ];

  return (
    <SafeAreaView style={[globalStyles.safeArea, styles.safeAreaOverride]} edges={['top', 'left', 'right']}>
      <View style={styles.webWrapper}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary800} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom + 25, 40) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCard}>
              <Ionicons name="document-text-outline" size={32} color={colors.primary800} style={{ marginBottom: 8 }} />
              <Text style={styles.introTitle}>EcoShift Civic Agreement</Text>
              <Text style={styles.introDate}>Last Updated: September 2026 ‪ Version 2.4</Text>
              <Text style={styles.introBody}>
                Please read these terms carefully before utilizing the waste classification, dump reporting, and recycling navigation features of EcoShift.
              </Text>
            </View>

            {sections.map((sec, idx) => (
              <View key={idx} style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>{sec.title}</Text>
                <Text style={styles.sectionBody}>{sec.content}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.acceptBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.acceptBtnText}>I Understand & Agree</Text>
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
  introCard: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    padding: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  introTitle: { fontSize: 18, fontWeight: '800', color: colors.primary800 },
  introDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  introBody: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  sectionCard: {
    marginBottom: 16,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: colors.primary800, marginBottom: 6 },
  sectionBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  acceptBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary800,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
