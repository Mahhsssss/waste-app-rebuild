import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import globalStyles, { colors, spacing, radius } from '../globalStyles';
import showAlert from '../utils/alert';
import { submitReport } from '../services/reportService';

export default function ReportDumpScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialType = route?.params?.wasteType || 'Plastic Scrap & Polythene';
  const initialCategory = route?.params?.superCategory || 'plastic';

  const [wasteType, setWasteType] = useState(initialType);
  const [severity, setSeverity] = useState('Critical Hazard');
  const [location, setLocation] = useState('Near Bhandup Lake Canal Inflow, LBS Marg, Ward S');
  const [coords, setCoords] = useState({ latitude: 19.145, longitude: 72.932 });
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [authority, setAuthority] = useState('BMC Solid Waste Management (MCGM)');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [photoUri, setPhotoUri] = useState('https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600');

  const categories = [
    'Plastic Scrap & Polythene',
    'E-Waste & Electronics',
    'Hazardous / Medical Scrap',
    'Construction Debris',
    'Overflowing Dumpster',
    'Organic / Textile Waste',
  ];

  // Official Verified Government Channels & Helplines
  const authorities = [
    {
      name: 'BMC Solid Waste Management (MCGM)',
      email: 'mcgm.swmproject@gmail.com',
      helpline: '1916 (24x7)',
      whatsapp: '+91 8169681697',
      jurisdiction: 'Mumbai City & Suburbs',
    },
    {
      name: 'Swachh Bharat Mission (MoHUA)',
      email: 'support@sbmurban.org',
      helpline: '1969 (Toll-Free)',
      whatsapp: null,
      jurisdiction: 'National Urban Waste Portal',
    },
    {
      name: 'Central Pollution Control Board (CPCB)',
      email: 'cpcb@nic.in',
      helpline: '1800-11-4725',
      whatsapp: null,
      jurisdiction: 'Hazardous, Industrial & E-Waste',
    },
    {
      name: 'Maharashtra Pollution Control Board (MPCB)',
      email: 'ms@mpcb.gov.in',
      helpline: '022-67808888',
      whatsapp: null,
      jurisdiction: 'State Environmental Enforcement',
    },
  ];

  const selectedAuthorityObj = authorities.find((a) => a.name === authority) || authorities[0];

  // Real GPS Geolocation Detector
  const handleDetectGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsDetectingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          setLocation(`GPS: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E (Current Device Location)`);
          setIsDetectingGps(false);
          Alert.alert('GPS Location Locked', `Acquired exact coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error) => {
          setIsDetectingGps(false);
          Alert.alert(
            'GPS Detection',
            'Could not access hardware GPS. Using local municipal coordinates. Please ensure browser/device location permission is granted.'
          );
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      Alert.alert('GPS Not Available', 'Geolocation service is not supported on this platform.');
    }
  };

  // Browser File/Camera Input Fallback for Mobile Safari / Chrome Web
  const triggerWebFileInput = (captureMode) => {
    if (typeof document === 'undefined') return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    if (captureMode) {
      fileInput.capture = captureMode;
    }
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotoUri(event.target.result);
            Alert.alert('Photo Attached', 'Photo successfully recorded from your device.');
          }
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  // Real Device Camera Handler (Native & Web)
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        // Direct mobile web back-camera capture
        triggerWebFileInput('environment');
        return;
      }
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please enable camera permission in your phone settings to take dump photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        Alert.alert('Photo Captured', 'Dump evidence recorded successfully.');
      }
    } catch (err) {
      console.warn('Camera error, trying web fallback:', err);
      triggerWebFileInput('environment');
    }
  };

  // Real Photo Library / Gallery Upload Handler (Native & Web)
  const handleUploadPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        // Standard file selector on web
        triggerWebFileInput();
        return;
      }
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Photo Library Permission Required', 'Please enable photo library access to upload dump images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        Alert.alert('Photo Uploaded', 'Dump photo attached from gallery.');
      }
    } catch (err) {
      console.warn('Upload error, trying web fallback:', err);
      triggerWebFileInput();
    }
  };

  // Construct official municipal complaint email body
  const generateEmailBody = () => {
    let body = `Respected Municipal Sanitation Officer / Authority,\n\n`;
    body += `I am lodging an official civic complaint regarding an unmanaged, hazardous waste dump observed in our jurisdiction:\n\n`;
    body += `• Waste Classification: ${wasteType}\n`;
    body += `• Severity Assessment: ${severity}\n`;
    body += `• Precise Location: ${location}\n`;
    body += `• Coordinates: Lat ${coords.latitude.toFixed(5)}, Lon ${coords.longitude.toFixed(5)}\n`;
    body += `• Timestamp: ${new Date().toLocaleString()}\n`;
    body += `• Photo Proof Attached: Yes (Visual evidence recorded in EcoShift Civic DB)\n\n`;

    if (additionalMessage.trim()) {
      body += `CITIZEN OBSERVATION NOTES:\n`;
      body += `"${additionalMessage.trim()}"\n\n`;
    }

    body += `Under the Solid Waste Management Rules and Civic Sanitation Guidelines, please dispatch a waste collection vehicle or clean-up squad promptly.\n\n`;
    body += `Regards,\n`;
    body += `Concerned Citizen (via EcoShift Civic Watch App)`;

    return body;
  };

  const handleSendEmail = async () => {
    const subject = encodeURIComponent(`[URGENT CIVIC COMPLAINT] Illegal Waste Dump at ${location}`);
    const body = encodeURIComponent(generateEmailBody());
    const mailtoUrl = `mailto:${selectedAuthorityObj.email}?subject=${subject}&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Email Client', `Could not open mail client. You can send your report directly to: ${selectedAuthorityObj.email}`);
      }
    } catch (err) {
      Alert.alert('Notice', `Email draft generated for: ${selectedAuthorityObj.email}`);
    }
  };

  // Direct WhatsApp Report to BMC's Official Grievance Bot (+91 8169681697)
  const handleWhatsAppReport = () => {
    const text =
      `*EcoShift Civic Dump Report*\n` +
      `📍 *Location:* ${location}\n` +
      `🌐 *GPS:* ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}\n` +
      `🗑️ *Waste Type:* ${wasteType}\n` +
      `⚠️ *Severity:* ${severity}\n` +
      (additionalMessage.trim() ? `📝 *Notes:* ${additionalMessage.trim()}\n` : '') +
      `📅 *Date:* ${new Date().toLocaleString()}\n\n` +
      `Please register this grievance and dispatch a municipal clean-up squad.`;

    const url = `https://wa.me/918169681697?text=${encodeURIComponent(text)}`;
    Linking.openURL(url);
  };

  const handleSubmitAndPin = () => {
    if (!location.trim()) {
      Alert.alert('Location Required', 'Please provide a location or landmark for the dump.');
      return;
    }

    const report = submitReport({
      title: `${wasteType} Dump`,
      wasteType,
      severity,
      address: location,
      latitude: coords.latitude,
      longitude: coords.longitude,
      notes: additionalMessage || 'Reported via citizen app',
      additionalMessage,
      photoUri,
      authority: selectedAuthorityObj.name,
    });

    showAlert(
      'Report Registered & Pinned!',
      'Your dump report has been logged and pinned to the live Community Waste Map.',
      [
        {
          text: 'View on Live Map',
          onPress: () => {
            navigation.navigate('MainTabs', {
              screen: 'MapTab',
              params: { focusDumpId: report.id },
            });
          },
        },
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

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
            <Text style={styles.headerTitle}>Report Trash Dump</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom + 30, 48) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Photo Capture & Evidence Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>1. Garbage Pile Photo Evidence</Text>
              <Text style={styles.cardSubtitle}>Capture with camera or upload from gallery to document the dump.</Text>

              <View style={styles.imageWrapper}>
                <Image source={{ uri: photoUri }} style={styles.dumpImage} resizeMode="cover" />
                <View style={styles.evidenceBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.evidenceBadgeText}>Visual Proof Attached</Text>
                </View>
              </View>

              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={[styles.photoActionBtn, { backgroundColor: colors.primary800 }]}
                  activeOpacity={0.8}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={17} color={colors.white} style={{ marginRight: 6 }} />
                  <Text style={[styles.photoActionBtnText, { color: colors.white }]}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.photoActionBtn,
                    {
                      backgroundColor: colors.primary50 || '#f0fdf4',
                      borderColor: colors.primary800,
                      borderWidth: 1.5,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={handleUploadPhoto}
                >
                  <Ionicons name="cloud-upload-outline" size={17} color={colors.primary800} style={{ marginRight: 6 }} />
                  <Text style={[styles.photoActionBtnText, { color: colors.primary800 }]}>Upload Image</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Waste Classification Selector */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>2. Waste Stream Classification</Text>
              <View style={styles.chipGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, wasteType === cat && styles.chipActive]}
                    onPress={() => setWasteType(cat)}
                  >
                    <Text style={[styles.chipText, wasteType === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Severity Level */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>3. Hazard & Urgency Level</Text>
              <View style={styles.severityRow}>
                {[
                  { label: 'Critical Hazard', color: '#DC2626', desc: 'Blocks drains / Toxic' },
                  { label: 'Moderate Spill', color: '#D97706', desc: 'Sidewalk accumulation' },
                  { label: 'Minor Litter', color: '#16A34A', desc: 'Scattered paper/bottles' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.label}
                    style={[
                      styles.severityBox,
                      severity === s.label && { borderColor: s.color, backgroundColor: s.color + '15' },
                    ]}
                    onPress={() => setSeverity(s.label)}
                  >
                    <View style={[styles.dot, { backgroundColor: s.color }]} />
                    <Text style={[styles.severityLabel, severity === s.label && { color: s.color, fontWeight: '800' }]}>
                      {s.label}
                    </Text>
                    <Text style={styles.severityDesc}>{s.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 4. Dump Location */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>4. Location & Precise Coordinates</Text>
              <View style={styles.inputRow}>
                <Ionicons name="location-outline" size={20} color={colors.primary600} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.locationInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter street, landmark, or coordinates..."
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              {/* Real GPS Detector Button */}
              <TouchableOpacity
                style={styles.gpsDetectBtn}
                onPress={handleDetectGps}
                disabled={isDetectingGps}
              >
                <Ionicons
                  name={isDetectingGps ? 'sync-outline' : 'navigate-circle'}
                  size={18}
                  color={colors.primary800}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.gpsDetectBtnText}>
                  {isDetectingGps ? 'Detecting Device GPS...' : '📍 Detect My Exact Device GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 5. Official Authority */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>5. Designated Authority</Text>
              <Text style={styles.cardSubtitle}>Official verified government department handling this complaint:</Text>
              <View style={styles.authorityList}>
                {authorities.map((auth) => (
                  <TouchableOpacity
                    key={auth.name}
                    style={[styles.authorityOption, authority === auth.name && styles.authorityOptionActive]}
                    onPress={() => setAuthority(auth.name)}
                  >
                    <Ionicons
                      name={authority === auth.name ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={authority === auth.name ? colors.primary800 : colors.primary400}
                      style={{ marginRight: 8, alignSelf: 'flex-start', marginTop: 3 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.authorityName, authority === auth.name && styles.authorityNameActive]}>
                        {auth.name}
                      </Text>
                      <Text style={styles.authorityJurisdiction}>🏛️ {auth.jurisdiction}</Text>
                      <Text style={styles.authorityEmail}>✉️ {auth.email}</Text>
                      <Text style={styles.authorityHelpline}>📞 Helpline: {auth.helpline}</Text>
                      {auth.whatsapp && (
                        <Text style={styles.authorityWhatsapp}>💬 WhatsApp Bot: {auth.whatsapp}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 6. ADDITIONAL MESSAGE INPUT (Custom user note on top of template) */}
            <View style={styles.card}>
              <View style={styles.additionalHeaderRow}>
                <Text style={styles.cardTitle}>6. Additional Message / Notes</Text>
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom Add-on</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>
                Add specific notes or observations to append on top of the default official email template (e.g. fire hazard, foul odor, near school, blocking traffic):
              </Text>

              <TextInput
                style={styles.additionalMessageInput}
                placeholder="Type additional notes here... (e.g., 'The dump is blocking the stormwater canal right in front of the municipal dispensary. Heavy stench and flies.')"
                placeholderTextColor={colors.placeholder}
                value={additionalMessage}
                onChangeText={setAdditionalMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* 7. Live Email Preview */}
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Ionicons name="mail" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                <Text style={styles.previewTitle}>Official Complaint Email Preview</Text>
              </View>
              <Text style={styles.previewMeta}>To: {selectedAuthorityObj.email}</Text>
              <Text style={styles.previewMeta}>Subject: [URGENT CIVIC COMPLAINT] Illegal Waste Dump at {location}</Text>
              <View style={styles.divider} />
              <Text style={styles.previewBody}>{generateEmailBody()}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              {/* WhatsApp Grievance Bot Direct Dispatch */}
              <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppReport}>
                <Ionicons name="logo-whatsapp" size={20} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.whatsappBtnText}>Send to BMC WhatsApp Bot (+91 8169681697)</Text>
              </TouchableOpacity>

              {/* Official Email Button */}
              <TouchableOpacity style={styles.emailBtn} onPress={handleSendEmail}>
                <Ionicons name="send" size={18} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.emailBtnText}>Dispatch Official Municipal Email</Text>
              </TouchableOpacity>

              {/* Submit & Pin to Map Button */}
              <TouchableOpacity style={styles.pinBtn} onPress={handleSubmitAndPin}>
                <Ionicons name="map" size={18} color={colors.primary800} style={{ marginRight: 8 }} />
                <Text style={styles.pinBtnText}>Submit & Pin to Waste Map</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: { padding: spacing.base, paddingBottom: 80 },
  card: {
    backgroundColor: colors.white,
    padding: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.primary800 },
  cardSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 3, marginBottom: 10 },
  imageWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    height: 190,
    backgroundColor: '#000',
  },
  dumpImage: { width: '100%', height: '100%' },
  evidenceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  evidenceBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  photoActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary800, borderColor: colors.primary800 },
  chipText: { fontSize: 11.5, color: colors.textPrimary, fontWeight: '600' },
  chipTextActive: { color: colors.white, fontWeight: '700' },
  severityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  severityBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    alignItems: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  severityLabel: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  severityDesc: { fontSize: 9, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationInput: { flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary50 || '#f0fdf4',
    borderWidth: 1,
    borderColor: colors.primary600,
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  gpsDetectBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary800 },
  authorityList: { gap: 8, marginTop: 4 },
  authorityOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg || '#f4f8f4',
  },
  authorityOptionActive: { borderColor: colors.primary800, backgroundColor: colors.primary50 || '#f0fdf4' },
  authorityName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  authorityNameActive: { color: colors.primary800 },
  authorityJurisdiction: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  authorityEmail: { fontSize: 11, color: colors.textPrimary, marginTop: 1, fontWeight: '600' },
  authorityHelpline: { fontSize: 11, color: '#047857', marginTop: 1, fontWeight: '700' },
  authorityWhatsapp: { fontSize: 11, color: '#15803D', marginTop: 1, fontWeight: '700' },
  additionalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customBadge: {
    backgroundColor: colors.primary50 || '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  customBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primary800 },
  additionalMessageInput: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 85,
    marginTop: 6,
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  previewTitle: { fontSize: 13, fontWeight: '800', color: colors.primary800 },
  previewMeta: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  previewBody: { fontSize: 11.5, color: '#334155', lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  btnRow: { gap: 10, marginTop: 4 },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: radius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  whatsappBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  emailBtn: {
    backgroundColor: colors.primary800,
    borderRadius: radius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  emailBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  pinBtn: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary800,
  },
  pinBtnText: { color: colors.primary800, fontSize: 14, fontWeight: '800' },
});
