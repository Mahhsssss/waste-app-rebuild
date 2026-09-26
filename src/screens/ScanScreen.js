import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { preparePhoto } from '../utils/photo';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius } from '../globalStyles';
import showAlert from '../utils/alert';
import {
  YOLO_CLASSES,
  normalizeClassName,
  fetchCategoryByModelClass,
  getCategoryEmoji,
} from '../services/categoryService';
import { addHistoryItem } from '../services/historyService';

const API_URL = 'https://mahhsssss--waste-detector-server-detect.modal.run';

const TIPS = [
  { icon: 'cube-outline', text: 'One item at a time' },
  { icon: 'sunny-outline', text: 'Good light, no glare' },
  { icon: 'scan-outline', text: 'Fill most of the frame' },
];

// Photos come from the phone's own camera app. The in-app live preview (expo-camera)
// shows a black screen in Expo Go on some Android phones, while the camera app works everywhere.
export default function ScanScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [showTestPicker, setShowTestPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClasses = YOLO_CLASSES.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.toLowerCase().includes(q) ||
      normalizeClassName(item).toLowerCase().includes(q)
    );
  });

  // Fallback web file selector
  const triggerWebFileInput = (captureMode) => {
    if (typeof document === 'undefined') return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    if (captureMode) fileInput.capture = captureMode;
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            classifyImageUri(event.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  // Handle classification of any image URI (camera app or gallery)
  const classifyImageUri = async (rawUri, width, height) => {
    if (!rawUri) return;
    setPhotoUri(rawUri);
    setLoading(true);

    try {
      const imageUri = await preparePhoto(rawUri, width, height);
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        formData.append('file', blob, 'waste_scan.jpg');
      } else {
        // Expo's fetch only accepts real Blob-like parts, not RN's { uri, type, name } objects
        formData.append('file', new File(imageUri));
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errText || response.statusText}`);
      }

      const result = await response.json();

      const detectedClass =
        result.class ||
        result.prediction ||
        (result.detections && result.detections[0]?.class) ||
        (Array.isArray(result) && result[0]?.class) ||
        result.label;

      if (detectedClass && detectedClass !== 'nothing') {
        const category = await fetchCategoryByModelClass(detectedClass);
        addHistoryItem({
          title: category?.name ? (category.name.charAt(0).toUpperCase() + category.name.slice(1)) : normalizeClassName(detectedClass),
          category: category?.super_category || 'Scrap',
          modelClass: detectedClass,
          superCategory: category?.super_category,
          confidence: result.confidence || 0.92,
          points: 25,
          photoUri: imageUri,
        });
        navigation.navigate('RecycleAdviceScreen', {
          category,
          modelClass: detectedClass,
          confidence: result.confidence,
        });
      } else {
        showAlert('Scan Result', 'No recyclable waste recognized in this photo. Try another angle or select from our catalog.', [
          { text: 'Catalog of 59 Items', onPress: () => setShowTestPicker(true) },
          { text: 'Try Again', style: 'cancel' },
        ]);
      }
    } catch (e) {
      console.warn('Classification error:', e);
      const is500 = e?.message?.includes('500');
      showAlert(
        is500 ? 'Backend Model Error (HTTP 500)' : 'Detection Notice',
        is500
          ? 'The remote model on Modal encountered an internal server error while processing the image. You can check the Modal logs or select an item directly from our catalog below.'
          : 'Could not connect to the remote classification model. You can select your scrap item directly from our catalog to get instant disposal instructions.',
        [
          { text: 'Browse 59 Categories', onPress: () => setShowTestPicker(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
      setPhotoUri(null);
    }
  };

  // Opens the phone's camera app. No crop step: Android's crop screen often never returns the photo.
  const handleSnapCamera = async () => {
    if (loading) return;
    if (Platform.OS === 'web') {
      triggerWebFileInput('environment');
      return;
    }
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        showAlert('Permission Denied', 'Camera access is required to snap waste items.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await classifyImageUri(result.assets[0].uri, result.assets[0].width, result.assets[0].height);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      showAlert('Camera unavailable', "Your camera couldn't open. You can upload a photo from your gallery instead.");
    }
  };

  // Gallery / File Upload
  const handlePickGallery = async () => {
    if (loading) return;
    if (Platform.OS === 'web') {
      triggerWebFileInput();
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        showAlert('Permission Denied', 'Gallery access is required to select photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await classifyImageUri(result.assets[0].uri, result.assets[0].width, result.assets[0].height);
      }
    } catch (err) {
      console.warn('Gallery upload error:', err);
      showAlert('Gallery unavailable', "Your gallery couldn't open. Please try again.");
    }
  };

  // Open the camera straight away the first time the scanner opens (phones only;
  // browsers block file pickers that the user didn't tap)
  const autoOpened = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web' || autoOpened.current) return undefined;
    autoOpened.current = true;
    const timer = setTimeout(handleSnapCamera, 350); // let the screen finish opening first
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle opening dynamic page for any class name
  const handleSelectCategory = async (className) => {
    setShowTestPicker(false);
    setSearchQuery('');
    setLoading(true);
    try {
      const cat = await fetchCategoryByModelClass(className);
      addHistoryItem({
        title: cat?.name ? (cat.name.charAt(0).toUpperCase() + cat.name.slice(1)) : normalizeClassName(className),
        category: cat?.super_category || 'Scrap',
        modelClass: className,
        superCategory: cat?.super_category,
        confidence: 0.95,
        points: 20,
      });
      navigation.navigate('RecycleAdviceScreen', {
        category: cat,
        modelClass: className,
      });
    } catch (err) {
      console.warn('Category fetch error:', err);
      showAlert('Error', 'Could not load advice for this category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan waste</Text>
            <View style={styles.headerBtn} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>What are you throwing away?</Text>
            <Text style={styles.sub}>
              Take a photo of the item and we'll tell you what it is and how to dispose of it.
            </Text>

            {/* Photo area */}
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" resizeMethod="resize" />
                <View style={styles.photoScrim}>
                  <ActivityIndicator size="large" color={colors.white} />
                  <Text style={styles.photoScrimText}>Identifying your item…</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoDrop} onPress={handleSnapCamera} activeOpacity={0.85} disabled={loading}>
                <View style={styles.photoDropIcon}>
                  <Ionicons name="camera-outline" size={34} color={colors.primary700} />
                </View>
                <Text style={styles.photoDropTitle}>Tap to take a photo</Text>
                <Text style={styles.photoDropSub}>Your phone's camera will open</Text>
              </TouchableOpacity>
            )}

            {/* Tips */}
            <View style={styles.tipsRow}>
              {TIPS.map((tip) => (
                <View key={tip.text} style={styles.tip}>
                  <Ionicons name={tip.icon} size={18} color={colors.primary700} />
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>

            {/* Catalog */}
            <TouchableOpacity
              style={styles.catalogCard}
              onPress={() => setShowTestPicker(true)}
              activeOpacity={0.8}
              disabled={loading}
            >
              <View style={styles.catalogIcon}>
                <Ionicons name="list" size={20} color={colors.primary700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.catalogTitle}>Know what it is?</Text>
                <Text style={styles.catalogSub}>Pick it from all 59 waste types</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          </ScrollView>

          {/* Pinned bottom actions */}
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
            <TouchableOpacity
              style={[styles.outlineBtn, loading && styles.btnDisabled]}
              onPress={handlePickGallery}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Ionicons name="images-outline" size={18} color={colors.primary800} style={{ marginRight: 6 }} />
              <Text style={styles.outlineBtnText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSnapCamera}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="camera" size={18} color={colors.white} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.primaryBtnText}>{loading ? 'Scanning…' : 'Take photo'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 59 Waste Categories Catalog Modal */}
      <Modal visible={showTestPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom + 20, 35) }]}>
            {/* Native Bottom Sheet Drag Handle */}
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>59 Waste Categories</Text>
                <Text style={styles.modalSubtitle}>
                  Select any item to view recycling & disposal advice:
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowTestPicker(false);
                  setSearchQuery('');
                }}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items (e.g. plastic, paper, can)..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filteredClasses}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No matching waste categories found.</Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handleSelectCategory(item)}
                >
                  <Text style={styles.pickerItemIndex}>#{index + 1}</Text>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{getCategoryEmoji(item)}</Text>
                  <Text style={styles.pickerItemName}>{normalizeClassName(item)}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  root: { flex: 1, alignItems: 'center', backgroundColor: Platform.OS === 'web' ? '#f3f6f3' : colors.white },
  maxContainer: { flex: 1, width: '100%', maxWidth: 600, backgroundColor: colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg, lineHeight: 20 },

  // Photo
  photoDrop: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary100,
    backgroundColor: '#F7FBF7',
  },
  photoDropIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDropTitle: { marginTop: spacing.base, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  photoDropSub: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  photoPreview: { height: 280, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  photoImage: { width: '100%', height: '100%' },
  photoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoScrimText: { marginTop: spacing.md, fontSize: 15, fontWeight: '700', color: colors.white },

  // Tips
  tipsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base },
  tip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  tipText: { marginTop: 6, fontSize: 12, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },

  // Catalog
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  catalogIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  catalogTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  catalogSub: { marginTop: 2, fontSize: 13, color: colors.textSecondary },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  outlineBtn: {
    flexDirection: 'row',
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary800 },
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.primary800,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  btnDisabled: { opacity: 0.6 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 35,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1B1F1C',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemIndex: {
    width: 36,
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  pickerItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1F1C',
    textTransform: 'capitalize',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
});
