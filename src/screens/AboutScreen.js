import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import globalStyles, { colors, spacing, radius } from '../globalStyles';

const FEATURES = [
  { icon: 'scan-outline', title: 'Scan an item', body: 'Snap a photo to find the right bin and how to dispose of it.' },
  { icon: 'location-outline', title: 'Find a drop-off', body: 'See recycling centres and NGOs near you.' },
  { icon: 'megaphone-outline', title: 'Report a dump', body: 'Flag illegal dumping to the right authority.' },
];

const LINKS = [
  { icon: 'document-text-outline', label: 'Terms & Conditions', route: 'TermsScreen' },
  { icon: 'lock-closed-outline', label: 'Privacy Policy', route: 'PrivacyScreen' },
  { icon: 'mail-outline', label: 'Contact us', route: 'ContactScreen' },
];

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[globalStyles.safeArea, styles.safeAreaOverride]} edges={['top', 'left', 'right']}>
      <View style={styles.webWrapper}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>About</Text>
            <View style={styles.headerBtn} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <Image source={require('../../assets/saaf-logo.png')} style={styles.logoTile} accessibilityLabel="साफ़ logo" />
              <Text style={styles.tagline}>Know what goes where.</Text>
              <Text style={styles.heroSub}>
                Sort your waste right and get it to the people who can reuse or recycle it.
              </Text>
            </View>

            {/* What you can do */}
            <Text style={styles.sectionLabel}>WHAT YOU CAN DO</Text>
            <View style={styles.card}>
              {FEATURES.map((f, i) => (
                <View key={f.title} style={[styles.featureRow, i > 0 && styles.rowDivider]}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={f.icon} size={20} color={colors.primary700} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureBody}>{f.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Mission */}
            <Text style={styles.sectionLabel}>OUR MISSION</Text>
            <View style={[styles.card, styles.missionCard]}>
              <Text style={styles.missionText}>
                Most household waste can be reused or recycled, but only if it reaches the right place. We make
                sorting simple so less of Mumbai's waste ends up in landfills.
              </Text>
            </View>

            {/* Links */}
            <View style={[styles.card, { marginTop: spacing.lg }]}>
              {LINKS.map((l, i) => (
                <TouchableOpacity
                  key={l.route}
                  style={[styles.linkRow, i > 0 && styles.rowDivider]}
                  onPress={() => navigation.navigate(l.route)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={l.icon} size={19} color={colors.primary700} style={{ marginRight: spacing.md }} />
                  <Text style={styles.linkText}>{l.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.footer}>For a cleaner Mumbai</Text>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  // Hero
  hero: { alignItems: 'center', paddingTop: spacing.base, paddingBottom: spacing.xl },
  logoTile: { width: 96, height: 96, borderRadius: 24 },
  tagline: { marginTop: spacing.lg, fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  heroSub: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },

  // Sections
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primary700,
    marginBottom: spacing.sm,
    marginTop: spacing.base,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },

  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.base },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  featureBody: { marginTop: 2, fontSize: 13, lineHeight: 18, color: colors.textSecondary },

  missionCard: { paddingVertical: spacing.base },
  missionText: { fontSize: 14, lineHeight: 21, color: colors.textPrimary },

  linkRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  footer: { marginTop: spacing.xl, textAlign: 'center', fontSize: 12, color: colors.placeholder },
});
