import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import globalStyles, { colors, spacing, radius } from '../globalStyles';
import { DEFAULT_RECOVERY_HUBS, fetchRecoveryHubs } from '../services/hubService';

export default function NgoSearchScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedDetailHub, setSelectedDetailHub] = useState(null);
  const [hubs, setHubs] = useState(DEFAULT_RECOVERY_HUBS);
  const [loading, setLoading] = useState(false);

  // Fetch markers data from Supabase table on mount
  useEffect(() => {
    fetchHubsFromSupabase();
  }, []);

  const fetchHubsFromSupabase = async () => {
    try {
      setLoading(true);
      const data = await fetchRecoveryHubs();
      if (data && data.length > 0) {
        setHubs(data);
      }
    } catch (error) {
      console.warn('Error fetching recovery hubs in NgoScreen:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // If navigated with focusHubId param, open its details
  useEffect(() => {
    const focusId = route?.params?.focusHubId;
    if (focusId) {
      const cleanId = focusId.replace('ngo-', '');
      const found = hubs.find((h) => h.id === cleanId || h.id === focusId || h.rawId === cleanId || h.id === `ngo-${cleanId}`);
      if (found) {
        setSelectedDetailHub(found);
      }
    }
  }, [route?.params?.focusHubId, hubs]);

  const handleSearchSubmit = () => {
    const cleaned = searchQuery.replace(/;/g, '').trim();
    setSubmittedQuery(cleaned);
  };

  const filteredHubs = hubs.filter((hub) => {
    if (!submittedQuery) return true;
    const q = submittedQuery.toLowerCase();
    const matchesName = (hub.title || hub.name || '').toLowerCase().includes(q);
    const matchesAddress = (hub.address || '').toLowerCase().includes(q);
    const matchesStream = Array.isArray(hub.streams) && hub.streams.some((stream) => stream.toLowerCase().includes(q));
    return matchesName || matchesAddress || matchesStream;
  });

  const handleDirections = (lat, lon) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, styles.safeAreaOverride]} edges={['top', 'left', 'right']}>
      <View style={styles.webWrapper}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.headerContainer}>
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
                <Text style={styles.headerTitle}>Recovery Hubs</Text>
                <Text style={styles.headerSubtitle}>Discover centers, accepted streams & drop-off details</Text>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.primary600} style={styles.searchIcon} />
            <TextInput
              placeholder="Search center or waste type..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text.replace(/;/g, ''))}
              onSubmitEditing={handleSearchSubmit}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchActionBtn}>
              <Ionicons name="arrow-forward-circle" size={24} color={colors.primary800} />
            </TouchableOpacity>
          </View>

          {/* Section Header */}
          <View style={styles.sectionMetaRow}>
            <Text style={styles.availableTitle}>Available Centers</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredHubs.length} found</Text>
            </View>
          </View>

          {/* Content / Loader */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary800} />
              <Text style={styles.loaderText}>Loading hubs from Supabase...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom + 85, 110) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {filteredHubs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No recovery hubs found matching your search.</Text>
                </View>
              ) : (
                filteredHubs.map((hub) => (
                  <View key={hub.id} style={styles.hubCard}>
                    <View style={styles.hubCardHeader}>
                      <Text style={styles.hubName}>{hub.name}</Text>
                      <View style={styles.ngoBadge}>
                        <Text style={styles.ngoBadgeText}>{hub.type}</Text>
                      </View>
                    </View>

                    <Text style={styles.hubAddress} numberOfLines={2}>{hub.address}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.streamsLabel}>Accepted Streams ({hub.streams.length}):</Text>
                    <View style={styles.streamsContainer}>
                      {hub.streams.map((stream, idx) => (
                        <View key={idx} style={styles.streamPill}>
                          <Text style={styles.streamPillText}>{stream}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.hubCardFooter}>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => setSelectedDetailHub(hub)}
                      >
                        <Ionicons name="information-circle-outline" size={14} color={colors.primary800} style={{ marginRight: 4 }} />
                        <Text style={styles.detailsBtnText}>Details</Text>
                      </TouchableOpacity>

                      {hub.phone ? (
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => Linking.openURL(`tel:${hub.phone}`)}
                        >
                          <Ionicons name="call" size={14} color={colors.white} style={{ marginRight: 4 }} />
                          <Text style={styles.callBtnText}>Call</Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        style={styles.mapBtn}
                        onPress={() => {
                          navigation.navigate('MainTabs', {
                            screen: 'MapTab',
                            params: {
                              focusLocation: {
                                id: hub.id.startsWith('ngo-') ? hub.id : `ngo-${hub.id}`,
                                title: hub.title || hub.name,
                                address: hub.address,
                                latitude: hub.latitude,
                                longitude: hub.longitude,
                              },
                            },
                          });
                        }}
                      >
                        <Ionicons name="map-outline" size={14} color={colors.primary800} style={{ marginRight: 4 }} />
                        <Text style={styles.mapBtnText}>Map</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.directionsBtn}
                        onPress={() => handleDirections(hub.latitude, hub.longitude)}
                      >
                        <Ionicons name="navigate" size={14} color={colors.white} style={{ marginRight: 4 }} />
                        <Text style={styles.directionsBtnText}>Directions</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* HUB DETAILS MODAL */}
      {selectedDetailHub && (
        <Modal visible={!!selectedDetailHub} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              {/* Native Bottom Sheet Drag Handle */}
              <View style={styles.modalDragHandle} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.ngoBadgeModal}>
                    <Text style={styles.ngoBadgeTextModal}>{selectedDetailHub.type}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{selectedDetailHub.name}</Text>
                  <Text style={styles.modalSub}>{selectedDetailHub.facilityType}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedDetailHub(null)} style={styles.closeBtn}>
                  <Ionicons name="close-circle" size={28} color={colors.primary600} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Physical Address */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionTitleRow}>
                    <Ionicons name="location" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>Physical Address & Location</Text>
                  </View>
                  <Text style={styles.modalSectionContent}>{selectedDetailHub.fullAddress || selectedDetailHub.address}</Text>
                  <Text style={styles.modalCoords}>
                    GPS: {selectedDetailHub.latitude.toFixed(4)}° N, {selectedDetailHub.longitude.toFixed(4)}° E
                  </Text>
                </View>

                {/* Operating Hours */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionTitleRow}>
                    <Ionicons name="time" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>Operating & Drop-off Hours</Text>
                  </View>
                  <Text style={styles.modalSectionContent}>{selectedDetailHub.timings}</Text>
                </View>

                {/* Contact Phone */}
                {selectedDetailHub.phone ? (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="call" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                      <Text style={styles.modalSectionTitle}>Contact Number</Text>
                    </View>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${selectedDetailHub.phone}`)}>
                      <Text style={[styles.modalSectionContent, { color: colors.primary800, fontWeight: '700' }]}>
                        {selectedDetailHub.phone} (Tap to Call)
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Website */}
                {selectedDetailHub.website ? (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="globe" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                      <Text style={styles.modalSectionTitle}>Official Website</Text>
                    </View>
                    <TouchableOpacity onPress={() => Linking.openURL(selectedDetailHub.website)}>
                      <Text style={[styles.modalSectionContent, { color: colors.primary800, textDecorationLine: 'underline' }]}>
                        {selectedDetailHub.website}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Accepted Streams */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionTitleRow}>
                    <Ionicons name="leaf" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>Accepted Waste Streams ({selectedDetailHub.streams.length})</Text>
                  </View>
                  <View style={styles.modalStreamGrid}>
                    {selectedDetailHub.streams.map((stream, idx) => (
                      <View key={idx} style={styles.modalStreamPill}>
                        <Ionicons name="checkmark-circle" size={14} color="#166534" style={{ marginRight: 4 }} />
                        <Text style={styles.modalStreamText}>{stream}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons in Modal */}
              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.modalDirectionsBtn}
                  onPress={() => handleDirections(selectedDetailHub.latitude, selectedDetailHub.longitude)}
                >
                  <Ionicons name="navigate" size={16} color={colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.modalDirectionsBtnText}>Get Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalMapBtn}
                  onPress={() => {
                    const hub = selectedDetailHub;
                    setSelectedDetailHub(null);
                    navigation.navigate('MainTabs', {
                      screen: 'MapTab',
                      params: {
                        focusLocation: {
                          id: hub.id.startsWith('ngo-') ? hub.id : `ngo-${hub.id}`,
                          title: hub.title || hub.name,
                          address: hub.address,
                          latitude: hub.latitude,
                          longitude: hub.longitude,
                        },
                      },
                    });
                  }}
                >
                  <Ionicons name="map" size={15} color={colors.primary800} style={{ marginRight: 6 }} />
                  <Text style={styles.modalMapBtnText}>View on Map</Text>
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
  maxContainer: { flex: 1, width: '100%', maxWidth: 600, backgroundColor: '#ffffff', position: 'relative' },
  headerContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'ios' ? spacing.xs : spacing.sm,
    paddingBottom: spacing.xs,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 },
  searchActionBtn: { padding: 4 },
  sectionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  availableTitle: { fontSize: 16, fontWeight: '800', color: colors.primary800 },
  countBadge: { backgroundColor: colors.primary50, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  countText: { fontSize: 11, fontWeight: '700', color: colors.primary800 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loaderText: { marginTop: 10, fontSize: 13, color: colors.textSecondary },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  scrollContent: { paddingHorizontal: spacing.base, gap: spacing.sm },
  hubCard: {
    backgroundColor: '#f4f8f4',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hubCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hubName: { fontSize: 18, fontWeight: '800', color: colors.primary800, textTransform: 'capitalize' },
  ngoBadge: { backgroundColor: colors.primary800, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs },
  ngoBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  hubAddress: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  streamsLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  streamsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  streamPill: { backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  streamPillText: { fontSize: 11, color: colors.primary800, fontWeight: '600' },
  hubCardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 6 },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  detailsBtnText: { color: colors.primary800, fontSize: 11, fontWeight: '700' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  callBtnText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  mapBtnText: { color: colors.primary800, fontSize: 11, fontWeight: '700' },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  directionsBtnText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.base,
    paddingTop: 12,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ngoBadgeModal: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary800,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginBottom: 4,
  },
  ngoBadgeTextModal: { color: colors.white, fontSize: 9.5, fontWeight: '800' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.primary800 },
  modalSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  closeBtn: { padding: 4 },
  modalBody: { marginBottom: 12 },
  modalSection: {
    backgroundColor: colors.cardBg || '#f8fafc',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  modalSectionTitle: { fontSize: 12, fontWeight: '800', color: colors.primary800 },
  modalSectionContent: { fontSize: 12.5, color: colors.textPrimary, lineHeight: 18 },
  modalCoords: { fontSize: 11, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  modalStreamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  modalStreamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  modalStreamText: { fontSize: 11, color: '#166534', fontWeight: '700' },
  modalFooterActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalDirectionsBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  modalDirectionsBtnText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  modalMapBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  modalMapBtnText: { color: colors.primary800, fontSize: 12.5, fontWeight: '700' },
});