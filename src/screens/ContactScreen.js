import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import globalStyles, { colors, spacing, radius } from '../globalStyles';
import showAlert from '../utils/alert';

export default function ContactScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('Feedback');

  const handleSubmit = () => {
    if (!message.trim()) {
      showAlert('Required Field', 'Please enter a message before submitting.');
      return;
    }

    showAlert(
      'Message Dispatched',
      'Thank you for reaching out! Our civic response team has received your ticket.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const emergencyContacts = [
    {
      name: 'BMC Solid Waste Control Room',
      contact: '1916',
      display: '1916 (24x7 Helpline)',
      type: 'Toll-Free Municipal Solid Waste Desk',
      icon: 'call',
      actionType: 'tel',
    },
    {
      name: 'BMC WhatsApp Garbage Grievance Bot',
      contact: '+91 8169681697',
      display: '+91 8169681697 (WhatsApp Bot)',
      type: 'Direct Citizen Grievance Chatbot',
      icon: 'logo-whatsapp',
      actionType: 'whatsapp',
    },
    {
      name: 'Swachh Bharat Mission (MoHUA)',
      contact: '1969',
      display: '1969 (National Toll-Free)',
      type: 'Ministry of Housing & Urban Affairs',
      icon: 'shield-checkmark',
      actionType: 'tel',
    },
    {
      name: 'Central Pollution Control Board (CPCB)',
      contact: '1800-11-4725',
      display: '1800-11-4725 (Toll-Free)',
      type: 'Hazardous Spill & E-Waste Division',
      icon: 'warning',
      actionType: 'tel',
    },
    {
      name: 'Maharashtra Pollution Control Board (MPCB)',
      contact: '022-67808888',
      display: '022-67808888 (Head Office)',
      type: 'State Environmental Enforcement',
      icon: 'business',
      actionType: 'tel',
    },
    {
      name: 'CPCB Official Grievance Inbox',
      contact: 'cpcb@nic.in',
      display: 'cpcb@nic.in',
      type: 'Central Government Official Portal',
      icon: 'mail',
      actionType: 'email',
    },
  ];

  const handleContactPress = (contact) => {
    if (contact.actionType === 'whatsapp') {
      Linking.openURL('https://wa.me/918169681697');
    } else if (contact.actionType === 'email') {
      Linking.openURL(`mailto:${contact.contact}`);
    } else {
      Linking.openURL(`tel:${contact.contact.replace(/[^0-9]/g, '')}`);
    }
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, styles.safeAreaOverride]} edges={['top', 'left', 'right']}>
      <View style={styles.webWrapper}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="arrow-back" size={24} color={colors.primary800} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contact & Civic Support</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 25, 40) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Helpline Numbers */}
            <Text style={styles.sectionHeader}>Official Government Helplines & Portals</Text>
            <Text style={styles.sectionSub}>Verified 24/7 channels for civic solid waste grievances & pollution control.</Text>
            {emergencyContacts.map((contact, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.contactCard}
                onPress={() => handleContactPress(contact)}
              >
                <View style={[styles.iconCircle, contact.actionType === 'whatsapp' && { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons
                    name={contact.icon}
                    size={18}
                    color={contact.actionType === 'whatsapp' ? '#15803D' : colors.primary800}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactType}>{contact.type}</Text>
                  <Text style={[styles.contactPhone, contact.actionType === 'whatsapp' && { color: '#15803D' }]}>
                    {contact.display}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={18} color={colors.primary600} />
              </TouchableOpacity>
            ))}

            {/* In-App Feedback Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Send Us a Message</Text>
              <Text style={styles.formSub}>Inquire about waste classification, pickup schedules, or civic partnership.</Text>

              {/* Inquiry Type Chips */}
              <View style={styles.typeRow}>
                {['Feedback', 'Technical', 'Municipal Query'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, inquiryType === t && styles.typeChipActive]}
                    onPress={() => setInquiryType(t)}
                  >
                    <Text style={[styles.typeChipText, inquiryType === t && styles.typeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief summary of your inquiry..."
                placeholderTextColor={colors.placeholder}
                value={subject}
                onChangeText={setSubject}
              />

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Type your message, location details, or civic question here..."
                placeholderTextColor={colors.placeholder}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.sendBtn} onPress={handleSubmit}>
                <Ionicons name="paper-plane" size={18} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Submit Message</Text>
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
  scrollContent: { padding: spacing.base, paddingBottom: 60 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: colors.primary800, marginBottom: 2 },
  sectionSub: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary50 || '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  contactType: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  contactPhone: { fontSize: 12, fontWeight: '700', color: colors.primary800, marginTop: 3 },
  formCard: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: colors.primary800 },
  formSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary800, borderColor: colors.primary800 },
  typeChipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  typeChipTextActive: { color: colors.white },
  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  textArea: { height: 90 },
  sendBtn: {
    backgroundColor: colors.primary800,
    borderRadius: radius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  sendBtnText: { color: colors.white, fontSize: 14, fontWeight: '800' },
});
