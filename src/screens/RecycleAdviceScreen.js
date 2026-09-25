import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  fetchCategoryByModelClass,
  fetchCategoryByClassId,
  getContainerInfo,
  getCategoryBenefits,
  getCategoryEmoji,
} from '../services/categoryService';

export default function RecycleAdviceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);

  const paramCategory = route?.params?.category;
  const paramClassId = route?.params?.classId;
  const paramModelClass = route?.params?.modelClass || route?.params?.className;

  useEffect(() => {
    async function loadData() {
      if (paramCategory) {
        setCategory(paramCategory);
        setLoading(false);
        return;
      }

      let data = null;
      if (paramClassId) {
        data = await fetchCategoryByClassId(paramClassId);
      } else if (paramModelClass) {
        data = await fetchCategoryByModelClass(paramModelClass);
      } else {
        data = await fetchCategoryByClassId(1);
      }

      setCategory(data);
      setLoading(false);
    }

    loadData();
  }, [paramCategory, paramClassId, paramModelClass]);

  if (loading || !category) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#165B33" />
        <Text style={styles.loadingText}>Loading recycling advice...</Text>
      </View>
    );
  }

  const containerInfo = getContainerInfo(category.super_category, category.name);
  const benefits = getCategoryBenefits(category);
  const categoryEmoji = getCategoryEmoji(category);
  const titleName =
    category.name.charAt(0).toUpperCase() + category.name.slice(1);
  const superCatName =
    (category.super_category || '').charAt(0).toUpperCase() +
    (category.super_category || '').slice(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1B1F1C" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Recycle Advice</Text>
        <View style={styles.headerRightBadge}>
          <Text style={styles.headerRightBadgeText}>ID #{category.class_id || 1}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Item Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroEmojiCircle}>
              <Text style={styles.heroEmoji}>{categoryEmoji}</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.heroCategoryLabel}>{superCatName}</Text>
              <Text style={styles.heroTitle}>{titleName}</Text>
            </View>

            {/* Container Color Pill */}
            <View
              style={[
                styles.containerBadge,
                {
                  backgroundColor: containerInfo.bgColor,
                  borderColor: containerInfo.borderColor,
                },
              ]}
            >
              <Ionicons
                name="trash-bin-outline"
                size={14}
                color={containerInfo.textColor}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.containerBadgeText,
                  { color: containerInfo.textColor },
                ]}
              >
                {containerInfo.label}
              </Text>
            </View>
          </View>

          {/* Status Tags Row */}
          <View style={styles.statusTagsRow}>
            <View
              style={[
                styles.statusPill,
                category.is_recyclable
                  ? styles.recyclablePill
                  : styles.nonRecyclablePill,
              ]}
            >
              <Ionicons
                name={
                  category.is_recyclable
                    ? 'checkmark-circle'
                    : 'alert-circle'
                }
                size={14}
                color={category.is_recyclable ? '#15803D' : '#B91C1C'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: category.is_recyclable ? '#15803D' : '#B91C1C',
                  },
                ]}
              >
                {category.is_recyclable
                  ? 'Recyclable Material'
                  : 'Special Care / Non-Recyclable'}
              </Text>
            </View>
          </View>

          {/* Description Section */}
          {category.description ? (
            <View style={styles.descriptionBox}>
              <Ionicons
                name="information-circle"
                size={18}
                color="#165B33"
                style={styles.descIcon}
              />
              <Text style={styles.descriptionText}>{category.description}</Text>
            </View>
          ) : null}
        </View>

        {/* How to Dispose (Action Steps Cards) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>How to Dispose</Text>
          <View style={styles.stepCountBadge}>
            <Text style={styles.stepCountText}>
              {category.disposal_advice?.length || 0} Steps
            </Text>
          </View>
        </View>

        <View style={styles.stepsContainer}>
          {category.disposal_advice && category.disposal_advice.length > 0 ? (
            category.disposal_advice.map((item, idx) => (
              <View key={idx} style={styles.stepCard}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>
                    {idx < 9 ? `0${idx + 1}` : idx + 1}
                  </Text>
                </View>
                <Text style={styles.stepBodyText}>{item}</Text>
              </View>
            ))
          ) : (
            <View style={styles.stepCard}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>01</Text>
              </View>
              <Text style={styles.stepBodyText}>
                Segregate clean and dry items into your municipal dry waste bin.
              </Text>
            </View>
          )}
        </View>

        {/* Recycling Channels & Processing */}
        {category.recycling_options && category.recycling_options.length > 0 && (
          <View style={styles.recyclingSection}>
            <Text style={styles.sectionTitle}>Where It Goes & How It's Recycled</Text>
            <View style={styles.optionsContainer}>
              {category.recycling_options.map((opt, idx) => (
                <View key={idx} style={styles.optionCard}>
                  <View style={styles.optionIconBox}>
                    <Text style={{ fontSize: 18 }}>
                      {idx === 0 ? '🏪' : idx === 1 ? '🏭' : '♻️'}
                    </Text>
                  </View>
                  <Text style={styles.optionText}>{opt}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Environmental & Economic Impact Cards */}
        <Text style={styles.sectionTitle}>Recycling Benefits</Text>
        <View style={styles.benefitsGrid}>
          {/* Environmental Card */}
          <View style={styles.benefitCard}>
            <View style={styles.benefitCardHeader}>
              <View style={[styles.benefitIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="leaf" size={18} color="#15803D" />
              </View>
              <Text style={styles.benefitCardTitle}>Environmental Impact</Text>
            </View>
            <Text style={styles.benefitCardText}>{benefits.environmental}</Text>
          </View>

          {/* Economic Card */}
          <View style={styles.benefitCard}>
            <View style={styles.benefitCardHeader}>
              <View style={[styles.benefitIconCircle, { backgroundColor: '#FEF9C3' }]}>
                <Ionicons name="cash" size={18} color="#854D0E" />
              </View>
              <Text style={styles.benefitCardTitle}>Economic Efficiency</Text>
            </View>
            <Text style={styles.benefitCardText}>{benefits.economic}</Text>
          </View>
        </View>

        {/* Bottom CTA Button: View Guidelines */}
        <TouchableOpacity
          style={styles.guidelinesButton}
          onPress={() =>
            navigation.navigate('DosDontsScreen', {
              category,
            })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.guidelinesButtonText}>View Guidelines (DOs & DON'Ts)</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Civic Action: Report Dump */}
        <TouchableOpacity
          style={styles.reportDumpButton}
          onPress={() =>
            navigation.navigate('ReportDumpScreen', {
              wasteType: titleName,
              superCategory: category.super_category,
            })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="warning-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.reportDumpButtonText}>Report Dumped / Unmanaged {titleName}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FDF8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FDF8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#165B33',
    fontWeight: '600',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#F7FDF8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EFE7',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5EFE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1F1C',
  },
  headerRightBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EDF7EE',
  },
  headerRightBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#165B33',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5EFE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroEmojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  heroEmoji: {
    fontSize: 28,
    textAlign: 'center',
    includeFontPadding: false,
  },
  heroCategoryLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#165B33',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B1F1C',
    letterSpacing: -0.3,
  },
  containerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  containerBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recyclablePill: {
    backgroundColor: '#DCFCE7',
  },
  nonRecyclablePill: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F4FBF5',
    padding: 12,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#165B33',
  },
  descIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1B1F1C',
    marginBottom: 12,
  },
  stepCountBadge: {
    backgroundColor: '#EDF7EE',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stepCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#165B33',
  },

  // Steps
  stepsContainer: {
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5EFE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  stepNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#165B33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepBodyText: {
    flex: 1,
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 20,
    marginTop: 5,
  },

  // Recycling Options
  recyclingSection: {
    marginBottom: 20,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5EFE7',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EDF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginTop: 6,
  },

  // Benefits
  benefitsGrid: {
    marginBottom: 26,
  },
  benefitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EFE7',
  },
  benefitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  benefitCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1F1C',
  },
  benefitCardText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },

  // CTA Button
  guidelinesButton: {
    backgroundColor: '#165B33',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#165B33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  guidelinesButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportDumpButton: {
    marginTop: 12,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportDumpButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
