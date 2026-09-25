import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import globalStyles, { colors, spacing, radius } from '../globalStyles';
import { getHistory, subscribeHistory, getHistoryStats } from '../services/historyService';

export default function HistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalScans: 0, totalPoints: 0, totalWeight: '0.00', recycleRate: 100 });
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setHistory(getHistory());
    setStats(getHistoryStats());

    const unsubscribe = subscribeHistory((updated) => {
      setHistory(updated);
      setStats(getHistoryStats());
    });

    return () => unsubscribe();
  }, []);

  const filterCategories = ['All', 'Plastics', 'Paper & Cardboard', 'Metals', 'Glass', 'E-Waste'];

  const filteredHistory = history.filter((item) => {
    const matchesCat =
      selectedFilter === 'All' ||
      item.category?.toLowerCase().includes(selectedFilter.toLowerCase()) ||
      item.superCategory?.toLowerCase().includes(selectedFilter.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <SafeAreaView style={[globalStyles.safeArea, styles.safeAreaOverride]} edges={['top', 'left', 'right']}>
      <View style={styles.webWrapper}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeftRow}>
              <TouchableOpacity
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('HomeTab');
                  }
                }}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.primary800} />
              </TouchableOpacity>
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.headerTitle}>Scan History</Text>
                <Text style={styles.headerSubtitle}>Personal diversion logs & eco-footprint</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Ionicons name="leaf" size={14} color={colors.white} style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>{stats.totalPoints} Pts</Text>
            </View>
          </View>

          {/* Quick Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNum}>{stats.totalScans}</Text>
              <Text style={styles.summaryLabel}>Total Scans</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNum}>{stats.totalWeight} kg</Text>
              <Text style={styles.summaryLabel}>Diverted</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNum}>{stats.recycleRate}%</Text>
              <Text style={styles.summaryLabel}>Recycle Rate</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.primary600} style={styles.searchIcon} />
            <TextInput
              placeholder="Search previous scans..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.primary400} />
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal Filter Chips */}
          <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersList}>
              {filterCategories.map((cat, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.filterChip, selectedFilter === cat && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(cat)}
                >
                  <Text style={[styles.filterChipText, selectedFilter === cat && styles.filterChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Feed List */}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom + 85, 110) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {filteredHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={48} color={colors.placeholder} />
                <Text style={styles.emptyTitle}>No scans match your query</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filter or scan a scrap item!</Text>
              </View>
            ) : (
              filteredHistory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => setSelectedItem(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardLeft}>
                    <View style={[styles.emojiCircle, { backgroundColor: (item.binColor || '#16A34A') + '15' }]}>
                      <Text style={styles.emojiText}>{item.emoji || '♻'}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemCategory}>{item.category} • {item.date}</Text>
                      <View style={styles.statusRow}>
                        <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.impactText}>+{item.points} Pts</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary400} style={{ marginTop: 6 }} />
                  </View>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.scanMoreBtn}
              onPress={() => navigation.navigate('ScanTab')}
            >
              <Ionicons name="camera" size={18} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.scanMoreBtnText}>Scan More Waste</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Item Detail Modal */}
      {selectedItem && (
        <Modal visible={!!selectedItem} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}>
              {/* Native Bottom Sheet Drag Handle */}
              <View style={styles.modalDragHandle} />

              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalEmoji}>{selectedItem.emoji}</Text>
                  <View>
                    <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                    <Text style={styles.modalSub}>{selectedItem.category} • {selectedItem.date}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <Ionicons name="close-circle" size={28} color={colors.primary400} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.modalStatGrid}>
                <View style={styles.modalStatBox}>
                  <Text style={styles.modalStatLabel}>Eco Reward</Text>
                  <Text style={styles.modalStatVal}>+{selectedItem.points} Eco Points</Text>
                </View>
                <View style={styles.modalStatBox}>
                  <Text style={styles.modalStatLabel}>Confidence</Text>
                  <Text style={styles.modalStatVal}>{((selectedItem.confidence || 0.9) * 100).toFixed(0)}% Match</Text>
                </View>
              </View>

              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Status:</Text>
                <Text style={styles.modalDetailVal}>{selectedItem.status}</Text>
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalViewAdviceBtn}
                  onPress={() => {
                    setSelectedItem(null);
                    navigation.navigate('RecycleAdviceScreen', {
                      modelClass: selectedItem.modelClass,
                    });
                  }}
                >
                  <Ionicons name="book-outline" size={16} color={colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.modalViewAdviceBtnText}>View Advice Page</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: colors.cardBg || '#f4f8f4',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.primary800, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.cardBg || '#f4f8f4',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryNum: { fontSize: 18, fontWeight: '800', color: colors.primary800 },
  summaryLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 },
  filtersWrapper: { marginVertical: spacing.xs },
  filtersList: { paddingHorizontal: spacing.base, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary50 || '#f0fdf4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary800,
    borderColor: colors.primary800,
  },
  filterChipText: { fontSize: 11.5, fontWeight: '600', color: colors.primary800 },
  filterChipTextActive: { color: colors.white, fontWeight: '700' },
  scrollContent: { paddingHorizontal: spacing.base, gap: 10, paddingTop: 4 },
  card: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.lg,
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  itemCategory: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  statusText: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  impactText: { fontSize: 12, fontWeight: '800', color: colors.primary800 },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.primary800, marginTop: 12 },
  emptySubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  scanMoreBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary800,
    borderRadius: radius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanMoreBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingTop: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalEmoji: { fontSize: 32 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.primary800 },
  modalSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  modalStatGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modalStatBox: { flex: 1, backgroundColor: colors.primary50 || '#f0fdf4', padding: 12, borderRadius: 12 },
  modalStatLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },
  modalStatVal: { fontSize: 14, fontWeight: '800', color: colors.primary800, marginTop: 4 },
  modalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalDetailLabel: { fontSize: 13, color: colors.textSecondary },
  modalDetailVal: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  modalBtnRow: { flexDirection: 'row' },
  modalViewAdviceBtn: {
    flex: 1,
    backgroundColor: colors.primary800,
    borderRadius: radius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalViewAdviceBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
