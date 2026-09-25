import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import globalStyles, { colors, spacing, radius } from '../globalStyles';
import showAlert from '../utils/alert';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const userEmail = session?.user?.email || 'citizen@ecoshift.app';
  const initialName = session?.user?.user_metadata?.full_name || userEmail.split('@')[0] || 'Eco Citizen';

  const [displayName, setDisplayName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState('+91 98200 12345');
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSaveProfile = () => {
    setIsEditing(false);
    showAlert('Profile Updated', 'Your profile details have been saved successfully.');
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      setShowLogoutModal(false);
    } catch (e) {
      console.error('Logout error:', e);
      setShowLogoutModal(false);
    } finally {
      setLoggingOut(false);
    }
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
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editToggleBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.editToggleText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom + 30, 48) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar & Badges */}
            <View style={styles.avatarCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
              </View>

              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>

              <View style={styles.tierPill}>
                <Ionicons name="shield-checkmark" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.tierText}>Green Guardian ₪ Tier 3</Text>
              </View>
            </View>

            {/* Impact Badges Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>90</Text>
                <Text style={styles.statLabel}>Eco Points</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>4</Text>
                <Text style={styles.statLabel}>Scans</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>3</Text>
                <Text style={styles.statLabel}>Dumps Reported</Text>
              </View>
            </View>

            {/* Editable Profile Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={[styles.inputField, !isEditing && styles.inputDisabled]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  editable={isEditing}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={[styles.inputField, styles.inputDisabled]}
                  value={userEmail}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Phone</Text>
                <TextInput
                  style={[styles.inputField, !isEditing && styles.inputDisabled]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  editable={isEditing}
                  keyboardType="phone-pad"
                />
              </View>

              {isEditing && (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Eco Achievements */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Eco Milestones</Text>
              <View style={styles.milestoneCard}>
                <Ionicons name="leaf" size={24} color="#16A34A" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle}>Early Adopter</Text>
                  <Text style={styles.milestoneSub}>Scanned first recyclable waste item</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              </View>
              <View style={styles.milestoneCard}>
                <Ionicons name="shield-checkmark" size={24} color="#16A34A" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle}>Civic Watchdog</Text>
                  <Text style={styles.milestoneSub}>Reported an illegal trash dump</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              </View>
            </View>

            {/* Logout Action */}
            <TouchableOpacity 
              style={styles.logoutBtn} 
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Universal In-App Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={32} color="#DC2626" />
            </View>

            <Text style={styles.logoutModalTitle}>Log Out of EcoShift?</Text>
            <Text style={styles.logoutModalSub}>
              Are you sure you want to log out? You will be returned to the login & welcome screen.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                disabled={loggingOut}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmLogoutBtn}
                activeOpacity={0.8}
                disabled={loggingOut}
                onPress={handleConfirmLogout}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmLogoutText}>Log Out</Text>
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
  editToggleBtn: { padding: 6 },
  editToggleText: { fontSize: 14, fontWeight: '700', color: colors.primary800 },
  scrollContent: { padding: spacing.base, paddingBottom: 60 },
  avatarCard: { alignItems: 'center', marginVertical: spacing.md },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary800,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarInitials: { fontSize: 36, fontWeight: '800', color: colors.white },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#16A34A',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  userName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 10 },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: 8,
  },
  tierText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  statsRow: { flexDirection: 'row', gap: 10, marginVertical: spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardBg || '#f4f8f4',
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: { fontSize: 20, fontWeight: '800', color: colors.primary800 },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  section: { marginTop: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.primary800, marginBottom: spacing.xs },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  inputField: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputDisabled: { opacity: 0.75, backgroundColor: '#f9fafb' },
  saveBtn: {
    backgroundColor: colors.primary800,
    borderRadius: radius.full,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  milestoneTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  milestoneSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.full,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '800' },
  modalBackdrop: {
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
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalConfirmLogoutBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.full,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmLogoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
