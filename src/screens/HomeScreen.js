import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import globalStyles, { colors, spacing, radius } from '../globalStyles';
import { fetchScrapImpactBlogs } from '../services/blogScraper';
import ScalePressable from '../components/ScalePressable';
import SkeletonBentoCard from '../components/SkeletonBentoCard';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [viewMode, setViewMode] = useState('Feed');

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    const data = await fetchScrapImpactBlogs();
    setBlogs(data);
    setLoading(false);
  };

  const categories = [
    { label: 'All', icon: 'apps-outline' },
    { label: 'Paper & Cardboard', icon: 'document-text-outline' },
    { label: 'Plastics', icon: 'trash-bin-outline' },
    { label: 'E-Waste', icon: 'hardware-chip-outline' },
    { label: 'Metals', icon: 'build-outline' },
    { label: 'Glass', icon: 'wine-outline' },
    { label: 'Hazardous Scrap', icon: 'warning-outline' },
    { label: 'Textiles & Organic Waste', icon: 'shirt-outline' },
  ];

  const { signOut } = useAuth();

  const handleMenuPress = (item) => {
    setIsMenuOpen(false);
    if (item === 'Account') {
      navigation.navigate('ProfileScreen');
    } else if (item === 'Report Dump') {
      navigation.navigate('ReportDumpScreen');
    } else if (item === 'Contact Us') {
      navigation.navigate('ContactScreen');
    } else if (item === 'Terms & Conditions') {
      navigation.navigate('TermsScreen');
    } else if (item === 'Privacy Policy') {
      navigation.navigate('PrivacyScreen');
    } else if (item === 'About') {
      navigation.navigate('AboutScreen');
    } else if (item === 'Location') {
      navigation.navigate('MapTab');
    } else if (item === 'Logout') {
      setShowLogoutModal(true);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      setShowLogoutModal(false);
    } catch (err) {
      console.error('Logout error:', err);
      setShowLogoutModal(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const cleanedQuery = searchQuery.replace(/;/g, '').trim();
      setSearchQuery(cleanedQuery);
    }
  };

  const filteredBlogs = blogs.filter((item) => {
    const matchesCategory =
      selectedFilter === 'All' || item.category === selectedFilter;
    const query = searchQuery.toLowerCase().replace(/;/g, '').trim();
    const matchesSearch =
      !query ||
      item.title?.toLowerCase().includes(query) ||
      item.snippet?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={[globalStyles.safeArea, styles.safeAreaOverride]} edges={['top', 'left', 'right']}>
      <View style={styles.webWrapper}>
        <View style={styles.maxContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              style={styles.menuIconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="grid-outline" size={22} color={colors.primary800} />
            </TouchableOpacity>

            <View style={styles.brandContainer}>
              <Text style={styles.brandTitle}>
                Eco<Text style={styles.brandSub}>Shift</Text>
              </Text>
              <Text style={styles.locationMeta}>HAZARD & IMPACT DISPATCHES</Text>
            </View>

            <TouchableOpacity style={styles.reloadBtn} onPress={loadBlogs}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary800} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Area */}
          <ScrollView
            style={styles.scrollViewStyle}
            contentContainerStyle={[
              styles.scrollContentContainer,
              { paddingBottom: 135 + (insets.bottom > 0 ? insets.bottom : 8) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.primary600}
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Search plastics, e-waste, hazardous scrap..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text.replace(/;/g, ''))}
                onSubmitEditing={handleSearchSubmit}
                style={styles.searchInput}
                returnKeyType="search"
              />
              <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchSubmitBtn}>
                <Ionicons name="arrow-forward-circle" size={22} color={colors.primary600} />
              </TouchableOpacity>
            </View>

            {/* Dynamic Story Avatars */}
            <View style={styles.storiesWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScrollContent}
              >
                {categories.map((cat, idx) => {
                  const cleanLabel = cat.label.replace(/;/g, '');
                  const isSelected = selectedFilter === cleanLabel;
                  return (
                    <ScalePressable
                      key={idx}
                      style={styles.storyAvatarItem}
                      onPress={() => setSelectedFilter(cleanLabel)}
                      scaleTo={0.92}
                    >
                      <View
                        style={[
                          styles.storyRing,
                          isSelected && styles.storyRingActive,
                        ]}
                      >
                        <View style={styles.storyInnerCircle}>
                          <Ionicons
                            name={cat.icon}
                            size={20}
                            color={
                              isSelected
                                ? colors.white
                                : colors.primary800
                            }
                          />
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.storyLabel,
                          isSelected && styles.storyLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {cleanLabel}
                      </Text>
                    </ScalePressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Hero Banner */}
            <View style={styles.heroCardContainer}>
              <Text style={styles.heroTitle}>Identify & Divert Hazardous Scrap</Text>
              <Text style={styles.heroSubtitle}>
                Scan discarded items to find local recycling centres & ecological impacts.
              </Text>

              <TouchableOpacity
                style={styles.heroScanBtn}
                onPress={() => navigation.navigate('ScanCamera')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="scan"
                  size={18}
                  color={colors.white}
                  style={styles.heroScanIcon}
                />
                <Text style={styles.heroScanBtnText}>Launch Scanner</Text>
              </TouchableOpacity>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionSubtitle}>CURATED DISPATCHES</Text>
              <Text style={styles.sectionMainTitle}>Hazard Stories & Studies</Text>
            </View>

            {/* Bento Grid Editorial Articles */}
            {loading ? (
              <View style={styles.bentoGrid}>
                <SkeletonBentoCard isLarge={true} />
                <SkeletonBentoCard isLarge={false} />
                <SkeletonBentoCard isLarge={false} />
              </View>
            ) : (
              <View style={styles.bentoGrid}>
                {filteredBlogs.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No hazard articles found for "{selectedFilter}"
                    </Text>
                  </View>
                ) : (
                  filteredBlogs.map((item) => (
                    <ScalePressable
                      key={item.id}
                      style={styles.articleCard}
                      onPress={() => Linking.openURL(item.link)}
                      scaleTo={0.98}
                    >
                      <View style={styles.articleHeader}>
                        <Text style={styles.articleTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View
                          style={[
                            styles.articleBadge,
                            { backgroundColor: item.accentColor || colors.primary800 },
                          ]}
                        >
                          <Text style={styles.articleBadgeText}>
                            {item.urgency || 'HAZARD'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.articleSource} numberOfLines={1}>
                        {[item.source, item.date].filter(Boolean).join('  ·  ')}
                      </Text>

                      <Text style={styles.articleSnippet} numberOfLines={3}>
                        {item.snippet}
                      </Text>

                      <View style={styles.articleDivider} />

                      <View style={styles.articleFooter}>
                        <View style={styles.articleMeta}>
                          <View style={styles.articleCategoryPill}>
                            <Text style={styles.articleCategoryText} numberOfLines={1}>{item.category}</Text>
                          </View>
                        </View>
                        <View style={styles.articleReadBtn}>
                          <Text style={styles.articleReadText}>Read</Text>
                          <Ionicons name="open-outline" size={13} color={colors.white} style={{ marginLeft: 4 }} />
                        </View>
                      </View>
                    </ScalePressable>
                  ))
                )}
              </View>
            )}
          </ScrollView>

          {/* Permanently Floating Pill Bar (Positioned Absolute to remain visible everywhere) */}
          <View
            style={[
              styles.floatingPillContainer,
              { bottom: 68 + (insets.bottom > 0 ? insets.bottom : 8) },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.floatingPill}>
              <TouchableOpacity
                style={[
                  styles.pillSegment,
                  viewMode === 'Feed' && styles.pillSegmentActive,
                ]}
                onPress={() => {
                  setViewMode('Feed');
                  navigation.navigate('HistoryTab');
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={viewMode === 'Feed' ? colors.primary800 : colors.primary100}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.pillText,
                    viewMode === 'Feed' && styles.pillTextActive,
                  ]}
                >
                  History Feed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pillSegment,
                  viewMode === 'Impact Map' && styles.pillSegmentActive,
                ]}
                onPress={() => {
                  setViewMode('Impact Map');
                  navigation.navigate('MapTab');
                }}
              >
                <Ionicons
                  name="map-outline"
                  size={15}
                  color={viewMode === 'Impact Map' ? colors.primary800 : colors.primary100}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.pillText,
                    viewMode === 'Impact Map' && styles.pillTextActive,
                  ]}
                >
                  NGO Map
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Side Drawer Modal */}
      <Modal visible={isMenuOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.drawerSafeArea} edges={['top', 'bottom', 'left', 'right']}>
            <View style={[globalStyles.drawerHeader, styles.drawerHeaderCustom]}>
              <TouchableOpacity
                onPress={() => setIsMenuOpen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.drawerCloseBtn}
              >
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color={colors.primary600}
                />
              </TouchableOpacity>
              <Text style={globalStyles.drawerTitle}>User Profile</Text>
            </View>

            <ScrollView
              style={styles.drawerScroll}
              showsVerticalScrollIndicator={false}
            >
              {[
                { label: 'Account', icon: 'person-outline' },
                { label: 'Report Dump', icon: 'warning-outline' },
                { label: 'Contact Us', icon: 'mail-outline' },
                { label: 'Terms & Conditions', icon: 'document-text-outline' },
                { label: 'Privacy Policy', icon: 'lock-closed-outline' },
                { label: 'About', icon: 'information-circle-outline' },
                { label: 'Location', icon: 'location-outline' },
                { label: 'Logout', icon: 'log-out-outline' },
              ].map((menuItem, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={globalStyles.menuRow}
                  onPress={() => handleMenuPress(menuItem.label)}
                >
                  <View style={styles.menuRowLeft}>
                    <Ionicons
                      name={menuItem.icon}
                      size={22}
                      color={colors.primary600}
                    />
                    <Text style={globalStyles.menuLabel}>{menuItem.label}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.primary400}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Universal In-App Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalBackdrop}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={32} color="#DC2626" />
            </View>

            <Text style={styles.logoutModalTitle}>Log Out of EcoShift?</Text>
            <Text style={styles.logoutModalSub}>
              Are you sure you want to log out? You will be returned to the welcome screen.
            </Text>

            <View style={styles.logoutModalButtonsRow}>
              <TouchableOpacity
                style={styles.logoutModalCancelBtn}
                activeOpacity={0.7}
                disabled={loggingOut}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.logoutModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutModalConfirmBtn}
                activeOpacity={0.8}
                disabled={loggingOut}
                onPress={handleConfirmLogout}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.logoutModalConfirmText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaOverride: { flex: 1, backgroundColor: '#ffffff' },
  webWrapper: { 
    flex: 1, 
    alignItems: 'center', 
    backgroundColor: Platform.OS === 'web' ? '#f3f6f3' : '#ffffff',
    width: '100%',
    height: '100%',
  },
  maxContainer: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 600, 
    backgroundColor: '#ffffff', 
    position: 'relative',
    overflow: 'hidden', 
  },
  drawerCloseBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'ios' ? spacing.xs : spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  menuIconBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center' },
  brandContainer: { alignItems: 'center' },
  brandTitle: { fontSize: 22, fontWeight: '800', color: colors.primary800, letterSpacing: -0.5 },
  brandSub: { color: colors.primary600 },
  locationMeta: { fontSize: 9, fontWeight: '800', color: colors.primary600, letterSpacing: 1 },
  reloadBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center' },
  scrollViewStyle: { flex: 1 },
  scrollContentContainer: { paddingTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    marginHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 },
  searchSubmitBtn: { padding: 4 },
  storiesWrapper: { marginVertical: spacing.xs },
  storiesScrollContent: { paddingHorizontal: spacing.base },
  storyAvatarItem: { alignItems: 'center', marginRight: spacing.sm, width: 72 },
  storyRing: { width: 58, height: 58, borderRadius: 29, padding: 2.5, borderWidth: 2, borderColor: 'transparent' },
  storyRingActive: { borderColor: colors.primary600 },
  storyInnerCircle: { flex: 1, borderRadius: 26, backgroundColor: colors.primary100, justifyContent: 'center', alignItems: 'center' },
  storyLabel: { fontSize: 10.5, fontWeight: '600', color: colors.textSecondary, marginTop: 4, textAlign: 'center', width: '100%' },
  storyLabelActive: { color: colors.primary800, fontWeight: '800' },
  heroCardContainer: { marginHorizontal: spacing.base, marginVertical: spacing.sm, borderRadius: radius.xl, backgroundColor: colors.primary50, padding: spacing.lg },
  heroTitle: { fontSize: 19, fontWeight: '800', color: colors.primary800, lineHeight: 25 },
  heroSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  heroScanBtn: { marginTop: spacing.md, alignSelf: 'flex-start', backgroundColor: colors.primary800, borderRadius: radius.full, paddingVertical: 10, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  heroScanIcon: { marginRight: 8 },
  heroScanBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  sectionHeader: { paddingHorizontal: spacing.base, marginTop: spacing.md, marginBottom: spacing.xs },
  sectionSubtitle: { fontSize: 10, fontWeight: '800', color: colors.primary600, letterSpacing: 1 },
  sectionMainTitle: { fontSize: 20, fontWeight: '800', color: colors.primary800 },
  bentoGrid: { paddingHorizontal: spacing.base, gap: spacing.sm },
  // Article cards mirror the Recycling Centres (NgoScreen) card style
  articleCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.base, borderWidth: 1, borderColor: colors.border },
  articleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  articleTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.primary800, lineHeight: 21 },
  articleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs, marginTop: 2 },
  articleBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  articleSnippet: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 17 },
  articleDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  articleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  articleMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  articleCategoryPill: { flexShrink: 1, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  articleCategoryText: { fontSize: 11, color: colors.primary800, fontWeight: '600' },
  articleSource: { fontSize: 12, color: colors.primary700, fontWeight: '600', marginTop: 4 },
  articleReadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary800, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  articleReadText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  floatingPillContainer: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 78, // Positioned safely right above the bottom tab bar on your screen
    alignItems: 'center', 
    zIndex: 99999, 
  },
  floatingPill: { 
    flexDirection: 'row', 
    borderRadius: radius.full, 
    padding: 3, 
    backgroundColor: colors.primary800, 
    elevation: 15, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 6, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255, 255, 255, 0.3)', 
  },
  pillSegment: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 9, 
    borderRadius: radius.full, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  pillSegmentActive: { 
    backgroundColor: colors.white, 
  },
  pillText: { 
    color: colors.primary100, 
    fontSize: 12, 
    fontWeight: '700', 
  },
  pillTextActive: { 
    color: colors.primary800, 
    fontWeight: '800',
  },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawerSafeArea: { flex: 1, backgroundColor: colors.cardBg, paddingHorizontal: 20 },
  drawerHeaderCustom: { paddingTop: Platform.OS === 'ios' ? 0 : spacing.sm },
  drawerScroll: { flex: 1, marginTop: 10 },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center' },
  logoutModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  logoutIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  logoutModalSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  logoutModalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  logoutModalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutModalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logoutModalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.full,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutModalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});