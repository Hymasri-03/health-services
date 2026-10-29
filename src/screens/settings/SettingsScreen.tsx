import React, { useCallback, useState } from 'react';
import {
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import { colors, radius, spacing } from '../../theme/colors';
import Card from '../../components/Card';
import { RootStackParamList } from '../../navigation/types';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bottomNavHeight = 60 + Math.max(insets.bottom, 8);
  const bottomPadding = bottomNavHeight + 16;
  const { provider, providerType, updateProviderProfile, logout } = useApp();

  // Notification Preferences State
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyAppPush, setNotifyAppPush] = useState(true);

  // Fee & Radius Settings Modal (Doctor mode)
  const [hoursModal, setHoursModal] = useState(false);
  const [consultFee, setConsultFee] = useState(String(provider.consultationFee || 750));
  const [visitFee, setVisitFee] = useState(String(provider.homeVisitFee || 1500));
  const [radiusKm, setRadiusKm] = useState(String(provider.serviceRadiusKm || 12));

  const handleSaveHours = () => {
    updateProviderProfile({
      consultationFee: parseInt(consultFee, 10) || 750,
      homeVisitFee: parseInt(visitFee, 10) || 1500,
      serviceRadiusKm: parseInt(radiusKm, 10) || 12,
    });
    setHoursModal(false);
  };

  const handleGoBack = useCallback(() => {
    if (hoursModal) {
      setHoursModal(false);
      return true;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    const state = navigation.getState();
    const routeNames = ((state as any)?.routeNames || []) as string[];
    if (routeNames.includes('Home')) {
      (navigation as any).navigate('Home');
    } else {
      (navigation as any).navigate('Main', { screen: 'Home' });
    }
    return true;
  }, [navigation, hoursModal]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleGoBack);
      return () => sub.remove();
    }, [handleGoBack])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Settings Header */}
      <View style={styles.topHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={handleGoBack}
          accessibilityLabel="Back to Previous"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Provider Settings</Text>
          <Text style={styles.headerSubtitle}>
            Preferences, operational configurations & partner support
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Provider Account & Regulatory Profile Entry Card */}
        <Pressable
          style={styles.accountCard}
          onPress={() => navigation.navigate('Account')}
          accessibilityLabel="Manage Provider Account"
        >
          <Image source={{ uri: provider.avatar }} style={styles.accountAvatar} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.accountName} numberOfLines={1}>
                {provider.name}
              </Text>
              {provider.approvalStatus === 'approved' && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              )}
            </View>
            <Text style={styles.accountSubtitle}>
              {providerType.toUpperCase()} • Account, Bank & Regulatory Profile
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {/* Medical Council & Legal Compliance Card */}
        <Card style={styles.cardSection} padding="md">
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={styles.sectionHeading} numberOfLines={1}>Medical Council & Legal Compliance</Text>
            </View>
            <View
              style={[
                styles.approvalStatusPill,
                provider.approvalStatus === 'approved'
                  ? { backgroundColor: colors.successLight }
                  : provider.approvalStatus === 'pending'
                  ? { backgroundColor: colors.warningLight }
                  : { backgroundColor: colors.dangerLight },
              ]}
            >
              <Text
                style={[
                  styles.approvalStatusText,
                  provider.approvalStatus === 'approved'
                    ? { color: colors.success }
                    : provider.approvalStatus === 'pending'
                    ? { color: colors.warning }
                    : { color: colors.danger },
                ]}
              >
                {provider.approvalStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.legalDataRow}>
            <Text style={styles.legalFieldLabel}>Regulatory Council:</Text>
            <Text style={styles.legalFieldValue} numberOfLines={2}>{provider.licenseType}</Text>
          </View>

          <View style={styles.legalDataRow}>
            <Text style={styles.legalFieldLabel}>License / Reg Number:</Text>
            <Text style={styles.legalFieldValue}>{provider.licenseNumber}</Text>
          </View>

          <View style={[styles.legalDataRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.legalFieldLabel}>Compliance Document:</Text>
            <View style={styles.legalDocPressable}>
              <Ionicons name="document-attach" size={13} color={colors.primary} />
              <Text style={styles.docLinkText} numberOfLines={1}>{provider.licenseDocName}</Text>
            </View>
          </View>
        </Card>

        {/* Practice Consultation & Radius Settings (For Doctors & Clinics) */}
        {providerType === 'doctor' && (
          <Card style={styles.cardSection} padding="md">
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={18} color={colors.text} />
                <Text style={styles.sectionHeading}>Consultation & Radius Settings</Text>
              </View>
              <Pressable onPress={() => setHoursModal(true)}>
                <Text style={styles.editActionLink}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Online Consult Fee:</Text>
              <Text style={styles.dataValue}>₹{provider.consultationFee}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Home Visit Fee:</Text>
              <Text style={styles.dataValue}>₹{provider.homeVisitFee}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Service Radius:</Text>
              <Text style={styles.dataValue}>{provider.serviceRadiusKm} km</Text>
            </View>
          </Card>
        )}

        {/* Real-Time Push & Sync Notification Channels */}
        <Card style={styles.cardSection} padding="md">
          <Text style={styles.sectionHeading}>Notification Preferences</Text>
          <Text style={styles.notifSub}>
            Customer bookings, reschedules, and cancellations trigger automatic alerts:
          </Text>

          <View style={styles.switchRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={styles.switchLabel}>WhatsApp Instant Alerts</Text>
            </View>
            <Switch
              value={notifyWhatsApp}
              onValueChange={setNotifyWhatsApp}
              trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
              thumbColor={notifyWhatsApp ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="mail" size={18} color={colors.info} />
              <Text style={styles.switchLabel}>Email Summaries & Invoices</Text>
            </View>
            <Switch
              value={notifyEmail}
              onValueChange={setNotifyEmail}
              trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
              thumbColor={notifyEmail ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.secondary} />
              <Text style={styles.switchLabel}>App Push Notifications</Text>
            </View>
            <Switch
              value={notifyAppPush}
              onValueChange={setNotifyAppPush}
              trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
              thumbColor={notifyAppPush ? colors.primary : colors.textMuted}
            />
          </View>
        </Card>

        {/* Help, Support & FAQs Button */}
        <Pressable
          style={styles.helpSupportBtn}
          onPress={() => navigation.navigate('SupportChat', { initialTab: 'faqs' })}
          accessibilityLabel="Help, Support & FAQs"
        >
          <Ionicons name="help-buoy-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.helpSupportTitle}>Help, Support & FAQs</Text>
            <Text style={styles.helpSupportSub}>Read FAQs or view provider operational policies</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {/* Live Partner Chat Button */}
        <Pressable
          style={[
            styles.helpSupportBtn,
            { marginTop: spacing.sm, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
          ]}
          onPress={() => navigation.navigate('SupportChat', { initialTab: 'chat' })}
          accessibilityLabel="Live Partner Chat"
        >
          <Ionicons name="chatbubbles" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.helpSupportTitle}>Live Partner Chat</Text>
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineBadgeText}>ONLINE 24/7</Text>
              </View>
            </View>
            <Text style={styles.helpSupportSub}>
              Chat live with One Buddy healthcare operations concierge
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>

        {/* Logout Button */}
        <Pressable
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            navigation.navigate('Auth');
          }}
          accessibilityLabel="Sign Out"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Consultation & Radius Modal */}
      <Modal visible={hoursModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Consultation & Radius Settings</Text>
              <Pressable onPress={() => setHoursModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Online Consultation Fee (₹)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={consultFee}
                onChangeText={setConsultFee}
                placeholder="e.g. 750"
              />

              <Text style={styles.inputLabel}>Home Visit Fee (₹)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={visitFee}
                onChangeText={setVisitFee}
                placeholder="e.g. 1500"
              />

              <Text style={styles.inputLabel}>Service Radius (Kilometers)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={radiusKm}
                onChangeText={setRadiusKm}
                placeholder="e.g. 12"
              />

              <View style={styles.modalActionsRow}>
                <Pressable style={styles.cancelBtn} onPress={() => setHoursModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.submitBtn} onPress={handleSaveHours}>
                  <Text style={styles.submitBtnText}>Save Settings</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minHeight: 56,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  cardSection: {
    padding: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  editActionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  legalDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 8,
  },
  legalFieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  legalFieldValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    maxWidth: '65%',
  },
  legalDocPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '65%',
    justifyContent: 'flex-end',
  },
  approvalStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  approvalStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  docLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  dataLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  notifSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  helpSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  helpSupportTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  helpSupportSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  onlineBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  onlineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: spacing.xs,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.background,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.borderLight,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  accountSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
