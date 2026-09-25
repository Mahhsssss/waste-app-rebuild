import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius } from '../globalStyles';
import showAlert from '../utils/alert';
import { submitReport } from '../services/reportService';
import { getCurrentCoords } from '../utils/location';
import { preparePhoto } from '../utils/photo';

const STEPS = ['Photo', 'Details', 'Send'];

const CATEGORIES = [
  'Plastic Scrap & Polythene',
  'E-Waste & Electronics',
  'Hazardous / Medical Scrap',
  'Construction Debris',
  'Overflowing Dumpster',
  'Organic / Textile Waste',
];

const SEVERITIES = [
  { label: 'Critical Hazard', short: 'Critical', color: '#DC2626', desc: 'Blocks drains or toxic' },
  { label: 'Moderate Spill', short: 'Moderate', color: '#D97706', desc: 'Piling up on the street' },
  { label: 'Minor Litter', short: 'Minor', color: '#16A34A', desc: 'Scattered litter' },
];

// Official verified government channels & helplines
const AUTHORITIES = [
  {
    name: 'BMC Solid Waste Management (MCGM)',
    email: 'mcgm.swmproject@gmail.com',
    helpline: '1916 (24x7)',
    whatsapp: '918169681697',
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

export default function ReportDumpScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialType = route?.params?.wasteType || CATEGORIES[0];

  const [step, setStep] = useState(0);
  const [photoUri, setPhotoUri] = useState(null);
  const [wasteType, setWasteType] = useState(initialType);
  const [severity, setSeverity] = useState(SEVERITIES[0].label);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState({ latitude: 19.145, longitude: 72.932 });
  const [hasGps, setHasGps] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [triedAutoGps, setTriedAutoGps] = useState(false);
  const [authority, setAuthority] = useState(AUTHORITIES[0].name);
  const [showAuthorities, setShowAuthorities] = useState(false);
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const selectedAuthority = AUTHORITIES.find((a) => a.name === authority) || AUTHORITIES[0];

  const detectGps = async (silent = false) => {
    setIsDetectingGps(true);
    try {
      const { latitude, longitude } = await getCurrentCoords();
      setCoords({ latitude, longitude });
      setHasGps(true);
      setLocation((prev) => prev || 'My current location');
    } catch (err) {
      if (!silent) Alert.alert('Location unavailable', err.message || 'Could not get your location.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Try GPS once, quietly, when the user reaches the details step
  useEffect(() => {
    if (step === 1 && !triedAutoGps && !hasGps) {
      setTriedAutoGps(true);
      detectGps(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Browser file/camera input fallback for mobile web
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
          if (event.target?.result) setPhotoUri(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        triggerWebFileInput('environment');
        return;
      }
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Camera permission needed', 'Please allow camera access in your phone settings to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const { uri, width, height } = result.assets[0];
        setPhotoUri(await preparePhoto(uri, width, height));
      }
    } catch (err) {
      console.warn('Camera error, trying web fallback:', err);
      triggerWebFileInput('environment');
    }
  };

  const handleUploadPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        triggerWebFileInput();
        return;
      }
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Photo access needed', 'Please allow photo library access to choose a picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const { uri, width, height } = result.assets[0];
        setPhotoUri(await preparePhoto(uri, width, height));
      }
    } catch (err) {
      console.warn('Upload error, trying web fallback:', err);
      triggerWebFileInput();
    }
  };

  const coordsText = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
  const emailSubject = `[URGENT CIVIC COMPLAINT] Illegal Waste Dump at ${location || 'reported location'}`;

  const generateEmailBody = () => {
    let body = `Respected Municipal Sanitation Officer / Authority,\n\n`;
    body += `I am lodging an official civic complaint regarding an unmanaged waste dump observed in our jurisdiction:\n\n`;
    body += `• Waste Classification: ${wasteType}\n`;
    body += `• Severity Assessment: ${severity}\n`;
    body += `• Location: ${location}\n`;
    body += `• Coordinates: ${coordsText}\n`;
    body += `• Map: https://www.google.com/maps?q=${coords.latitude},${coords.longitude}\n`;
    body += `• Timestamp: ${new Date().toLocaleString()}\n`;
    body += `• Photo: ${photoUri ? 'Recorded in the EcoShift app' : 'Not attached'}\n\n`;
    if (additionalMessage.trim()) {
      body += `CITIZEN NOTES:\n"${additionalMessage.trim()}"\n\n`;
    }
    body += `Under the Solid Waste Management Rules, please dispatch a waste collection vehicle or clean-up squad promptly.\n\n`;
    body += `Regards,\nConcerned Citizen (via EcoShift)`;
    return body;
  };

  const handleSendEmail = async () => {
    const mailtoUrl = `mailto:${selectedAuthority.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(generateEmailBody())}`;
    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('No email app found', `You can send your report to: ${selectedAuthority.email}`);
      }
    } catch (err) {
      Alert.alert('No email app found', `You can send your report to: ${selectedAuthority.email}`);
    }
  };

  const handleWhatsAppReport = () => {
    const text =
      `*EcoShift Dump Report*\n` +
      `*Location:* ${location}\n` +
      `*GPS:* ${coordsText}\n` +
      `*Waste type:* ${wasteType}\n` +
      `*Severity:* ${severity}\n` +
      (additionalMessage.trim() ? `*Notes:* ${additionalMessage.trim()}\n` : '') +
      `*Date:* ${new Date().toLocaleString()}\n\n` +
      `Please register this grievance and dispatch a clean-up squad.`;
    Linking.openURL(`https://wa.me/${selectedAuthority.whatsapp}?text=${encodeURIComponent(text)}`);
  };

  const handleSubmit = () => {
    const report = submitReport({
      title: `${wasteType} Dump`,
      wasteType,
      severity,
      severityLevel: severity.startsWith('Critical') ? 'critical' : severity.startsWith('Moderate') ? 'moderate' : 'minor',
      address: location,
      latitude: coords.latitude,
      longitude: coords.longitude,
      notes: additionalMessage || 'Reported via citizen app',
      additionalMessage,
      photoUri,
      authority: selectedAuthority.name,
    });

    showAlert('Report submitted', 'Your report is now pinned on the community map.', [
      {
        text: 'View on map',
        onPress: () => {
          navigation.navigate('MainTabs', {
            screen: 'MapTab',
            params: { focusDumpId: report.id },
          });
        },
      },
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  const goNext = () => {
    if (step === 1 && !location.trim()) {
      Alert.alert('Add a location', 'Type a street or landmark, or tap "Use my location".');
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  };

  // ---------- Steps ----------
  const renderPhotoStep = () => (
    <>
      <Text style={styles.stepTitle}>Add a photo</Text>
      <Text style={styles.stepSub}>A clear photo helps the authorities act faster.</Text>

      {photoUri ? (
        <View style={styles.photoPreview}>
          <Image
            source={{ uri: photoUri }}
            style={styles.photoImage}
            resizeMode="cover"
            resizeMethod="resize"
            onError={(e) => console.warn('Report photo failed to display:', e?.nativeEvent?.error)}
          />
          <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setPhotoUri(null)}>
            <Ionicons name="close" size={18} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.photoActionsOverlay}>
            <TouchableOpacity style={styles.photoPill} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.photoPillText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoPill} onPress={handleUploadPhoto}>
              <Ionicons name="images-outline" size={15} color={colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.photoPillText}>Choose another</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.photoDrop}>
          <View style={styles.photoDropIcon}>
            <Ionicons name="camera-outline" size={26} color={colors.primary700} />
          </View>
          <Text style={styles.photoDropTitle}>No photo yet</Text>
          <View style={styles.photoDropBtns}>
            <TouchableOpacity style={styles.smallPrimaryBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
              <Ionicons name="camera" size={15} color={colors.white} style={{ marginRight: 6 }} />
              <Text style={styles.smallPrimaryBtnText}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallOutlineBtn} onPress={handleUploadPhoto} activeOpacity={0.85}>
              <Ionicons name="images-outline" size={15} color={colors.primary800} style={{ marginRight: 6 }} />
              <Text style={styles.smallOutlineBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  const renderDetailsStep = () => (
    <>
      <Text style={styles.stepTitle}>Describe the dump</Text>
      <Text style={styles.stepSub}>Tell us what it is, how bad it is and where.</Text>

      <Text style={styles.fieldLabel}>Type of waste</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.map((cat) => {
          const active = wasteType === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setWasteType(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>How serious is it?</Text>
      <View style={styles.severityRow}>
        {SEVERITIES.map((s) => {
          const active = severity === s.label;
          return (
            <TouchableOpacity
              key={s.label}
              style={[styles.severityBox, active && { borderColor: s.color, backgroundColor: s.color + '12' }]}
              onPress={() => setSeverity(s.label)}
              activeOpacity={0.8}
            >
              <View style={[styles.severityDot, { backgroundColor: s.color }]} />
              <Text style={[styles.severityLabel, active && { color: s.color }]}>{s.short}</Text>
              <Text style={styles.severityDesc}>{s.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Location</Text>
      <View style={styles.inputRow}>
        <Ionicons name="location-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Street or landmark"
          placeholderTextColor={colors.placeholder}
        />
      </View>
      <TouchableOpacity style={styles.gpsLink} onPress={() => detectGps(false)} disabled={isDetectingGps}>
        {isDetectingGps ? (
          <ActivityIndicator size="small" color={colors.primary700} style={{ marginRight: 6 }} />
        ) : (
          <Ionicons name={hasGps ? 'checkmark-circle' : 'locate'} size={16} color={colors.primary700} style={{ marginRight: 6 }} />
        )}
        <Text style={styles.gpsLinkText}>
          {isDetectingGps ? 'Finding your location…' : hasGps ? `GPS added · ${coordsText}` : 'Use my location'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderSendStep = () => (
    <>
      <Text style={styles.stepTitle}>Review & send</Text>
      <Text style={styles.stepSub}>Your report will be pinned on the community map.</Text>

      <Text style={styles.fieldLabel}>Send to</Text>
      <View style={styles.selectCard}>
        <TouchableOpacity style={styles.selectRow} onPress={() => setShowAuthorities((v) => !v)} activeOpacity={0.8}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectTitle}>{selectedAuthority.name}</Text>
            <Text style={styles.selectSub}>
              {selectedAuthority.jurisdiction} · Helpline {selectedAuthority.helpline}
            </Text>
          </View>
          <Ionicons name={showAuthorities ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {showAuthorities
          ? AUTHORITIES.filter((a) => a.name !== authority).map((a) => (
              <TouchableOpacity
                key={a.name}
                style={[styles.selectRow, styles.selectOption]}
                onPress={() => {
                  setAuthority(a.name);
                  setShowAuthorities(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectOptionTitle}>{a.name}</Text>
                  <Text style={styles.selectSub}>{a.jurisdiction}</Text>
                </View>
              </TouchableOpacity>
            ))
          : null}
      </View>

      <Text style={styles.fieldLabel}>
        Note <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextInput
        style={styles.textArea}
        placeholder="e.g. blocking the drain near the school, strong smell"
        placeholderTextColor={colors.placeholder}
        value={additionalMessage}
        onChangeText={setAdditionalMessage}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.previewToggle} onPress={() => setShowPreview((v) => !v)}>
        <Text style={styles.previewToggleText}>{showPreview ? 'Hide message preview' : 'Preview message'}</Text>
        <Ionicons name={showPreview ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary700} />
      </TouchableOpacity>
      {showPreview ? (
        <View style={styles.previewBox}>
          <Text style={styles.previewMeta}>To: {selectedAuthority.email}</Text>
          <Text style={styles.previewMeta}>Subject: {emailSubject}</Text>
          <View style={styles.previewDivider} />
          <Text style={styles.previewBody}>{generateEmailBody()}</Text>
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Also notify them directly</Text>
      <View style={styles.notifyRow}>
        {selectedAuthority.whatsapp ? (
          <TouchableOpacity style={styles.notifyBtn} onPress={handleWhatsAppReport} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={17} color="#128C7E" style={{ marginRight: 6 }} />
            <Text style={styles.notifyBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.notifyBtn} onPress={handleSendEmail} activeOpacity={0.85}>
          <Ionicons name="mail-outline" size={17} color={colors.primary800} style={{ marginRight: 6 }} />
          <Text style={styles.notifyBtnText}>Email</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const primaryLabel = step === 0 ? (photoUri ? 'Next' : 'Skip photo') : step === 1 ? 'Next' : 'Submit report';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report a dump</Text>
            <View style={styles.headerBtn} />
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            {STEPS.map((label, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <TouchableOpacity
                  key={label}
                  style={styles.progressItem}
                  disabled={i > step}
                  onPress={() => setStep(i)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.progressBar, (done || current) && styles.progressBarActive]} />
                  <Text style={[styles.progressLabel, (done || current) && styles.progressLabelActive]}>
                    {i + 1}. {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {step === 0 ? renderPhotoStep() : step === 1 ? renderDetailsStep() : renderSendStep()}
            </ScrollView>

            {/* Pinned bottom actions */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
              {step > 0 ? (
                <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.8}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>{primaryLabel}</Text>
                {step < STEPS.length - 1 ? (
                  <Ionicons name="arrow-forward" size={17} color={colors.white} style={{ marginLeft: 6 }} />
                ) : null}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
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

  progressRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.base },
  progressItem: { flex: 1 },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt },
  progressBarActive: { backgroundColor: colors.primary600 },
  progressLabel: { marginTop: 6, fontSize: 12, fontWeight: '600', color: colors.placeholder },
  progressLabelActive: { color: colors.primary800 },

  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  stepTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  stepSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg, lineHeight: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  optional: { fontWeight: '400', color: colors.textSecondary },

  // Photo
  photoDrop: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary100,
    backgroundColor: '#F7FBF7',
  },
  photoDropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDropTitle: { marginTop: spacing.md, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  photoDropBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base },
  smallPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    backgroundColor: colors.primary800,
  },
  smallPrimaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  smallOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  smallOutlineBtnText: { color: colors.primary800, fontSize: 14, fontWeight: '600' },
  photoPreview: { height: 280, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  photoImage: { width: '100%', height: '100%' },
  photoRemoveBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActionsOverlay: { position: 'absolute', left: spacing.md, bottom: spacing.md, flexDirection: 'row', gap: spacing.sm },
  photoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  photoPillText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },

  // Details
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary800, borderColor: colors.primary800 },
  chipText: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  severityRow: { flexDirection: 'row', gap: spacing.sm },
  severityBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  severityDot: { width: 9, height: 9, borderRadius: 5, marginBottom: spacing.sm },
  severityLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  severityDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 15 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  gpsLink: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'flex-start' },
  gpsLinkText: { fontSize: 13, fontWeight: '600', color: colors.primary700 },

  // Send
  selectCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  selectRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  selectOption: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: '#FAFCFA' },
  selectTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  selectOptionTitle: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  selectSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  textArea: {
    minHeight: 88,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.textPrimary,
  },
  previewToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.base, alignSelf: 'flex-start' },
  previewToggleText: { fontSize: 13, fontWeight: '600', color: colors.primary700 },
  previewBox: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  previewMeta: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  previewDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  previewBody: { fontSize: 12, color: colors.textPrimary, lineHeight: 18 },
  notifyRow: { flexDirection: 'row', gap: spacing.sm },
  notifyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifyBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

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
  backBtn: {
    height: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  nextBtn: {
    flex: 1,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.primary800,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
