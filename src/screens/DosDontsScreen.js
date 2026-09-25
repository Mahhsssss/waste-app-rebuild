import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { getCategoryEmoji } from '../services/categoryService';

export default function DosDontsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < 720;
  const [activeTab, setActiveTab] = useState('dos'); // 'dos' | 'donts'

  const category = route?.params?.category || {
    name: 'Plastic Bottle',
    super_category: 'plastic',
    dos: [
      'Rinse out residue before storing for recycling',
      'Flatten to reduce volume',
      'Keep separate from wet, organic waste',
      'Store caps separately if your local collector asks for it',
    ],
    donts: [
      "Don't reuse a single-use PET bottle indefinitely for drinking water",
      "Don't burn plastic bottles at home",
      "Don't mix with food waste or other contaminants",
      "Don't throw into drains or water bodies",
    ],
  };

  const isDos = activeTab === 'dos';
  const themeBgColor = isDos ? '#DCFCE7' : '#FEE2E2';
  const themeAccentColor = isDos ? '#16A34A' : '#DC2626';

  const titleName =
    category.name.charAt(0).toUpperCase() + category.name.slice(1);

  const categoryEmoji = getCategoryEmoji(category);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.container, { backgroundColor: themeBgColor, paddingBottom: Math.max(insets.bottom + 10, 18) }]}>
        {/* Top Bar with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1B1F1C" />
          </TouchableOpacity>
          <Text style={styles.screenHeaderTitle}>Guidelines</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Centered Hero Graphic with Status Icon */}
        <View style={[styles.heroGraphicContainer, isCompact && { marginVertical: 6 }]}>
          <View
            style={[
              styles.illustrationCircle,
              { borderColor: themeAccentColor },
              isCompact && { width: 92, height: 92, borderRadius: 46 },
            ]}
          >
            <Text style={[styles.heroEmojiText, isCompact && { fontSize: 44 }]}>{categoryEmoji}</Text>
            <View
              style={[
                styles.badgeOverlay,
                { backgroundColor: themeAccentColor },
              ]}
            >
              <Ionicons
                name={isDos ? 'checkmark' : 'close'}
                size={18}
                color="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Main Content Card */}
        <View style={styles.contentCard}>
          {/* Card Header: Category Name + Toggle Switch */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.categoryTitle}>{titleName}</Text>

            {/* Segmented Pill Switcher */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleSegment,
                  isDos ? styles.toggleSegmentActiveDos : styles.toggleSegmentInactiveDos,
                ]}
                onPress={() => setActiveTab('dos')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isDos ? styles.toggleTextActive : styles.toggleTextDosInactive,
                  ]}
                >
                  DOs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleSegment,
                  !isDos ? styles.toggleSegmentActiveDonts : styles.toggleSegmentInactiveDonts,
                ]}
                onPress={() => setActiveTab('donts')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !isDos ? styles.toggleTextActive : styles.toggleTextDontsInactive,
                  ]}
                >
                  DON'Ts
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* List of Guidelines */}
          <ScrollView
            style={styles.guidelinesScroll}
            showsVerticalScrollIndicator={false}
          >
            {isDos ? (
              category.dos && category.dos.length > 0 ? (
                category.dos.map((item, idx) => (
                  <View key={idx} style={[styles.itemRow, styles.itemRowDos]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#16A34A"
                      style={styles.iconMargin}
                    />
                    <Text style={styles.itemTextDos}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No specific DOs listed.</Text>
              )
            ) : category.donts && category.donts.length > 0 ? (
              category.donts.map((item, idx) => (
                <View key={idx} style={[styles.itemRow, styles.itemRowDonts]}>
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color="#DC2626"
                    style={styles.iconMargin}
                  />
                  <Text style={styles.itemTextDonts}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: '#DC2626' }]}>No specific DON'Ts listed.</Text>
            )}
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.adviceBackButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={18} color="#165B33" style={{ marginRight: 4 }} />
              <Text style={styles.adviceBackText}>Advice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={() =>
                navigation.navigate('MainTabs', {
                  screen: 'MapTab',
                  params: { filter: 'NGOs' },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="location-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.mapButtonText}>Find Drop-off Hubs</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Dump Report Shortcut */}
          <TouchableOpacity
            style={styles.reportDumpMiniBtn}
            onPress={() =>
              navigation.navigate('ReportDumpScreen', {
                wasteType: titleName,
                superCategory: category.super_category,
              })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="warning-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.reportDumpMiniText}>Report Uncollected {titleName}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  screenHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1F1C',
  },

  // Hero Graphic
  heroGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  heroEmojiText: {
    fontSize: 54,
    textAlign: 'center',
    includeFontPadding: false,
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Content Card
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B1F1C',
    flex: 1,
    marginRight: 10,
  },

  // Toggle Switch
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 3,
  },
  toggleSegment: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  toggleSegmentActiveDos: {
    backgroundColor: '#16A34A',
  },
  toggleSegmentInactiveDos: {
    backgroundColor: 'transparent',
  },
  toggleTextDosInactive: {
    color: '#16A34A',
    fontWeight: '700',
  },
  toggleSegmentActiveDonts: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleSegmentInactiveDonts: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  toggleTextDontsInactive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  toggleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },

  // Guidelines Scroll
  guidelinesScroll: {
    flex: 1,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  itemRowDos: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  itemRowDonts: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  iconMargin: {
    marginRight: 10,
    marginTop: 1,
  },
  itemTextDos: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 21,
    fontWeight: '500',
  },
  itemTextDonts: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 21,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },

  // CTA Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  adviceBackButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#165B33',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adviceBackText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#165B33',
  },
  mapButton: {
    flex: 1.5,
    backgroundColor: '#165B33',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#165B33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportDumpMiniBtn: {
    marginTop: 10,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportDumpMiniText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
