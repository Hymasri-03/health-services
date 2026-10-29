import React, { useCallback, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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
import {
  HomeVisitRequest,
  OnlineConsultation,
  OPBooking,
  OPBookingStatus,
  PharmacyOrder,
} from '../../types';
import { RootStackParamList } from '../../navigation/types';

export default function BookingsOrdersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bottomNavHeight = 60 + Math.max(insets.bottom, 8);
  const bottomPadding = bottomNavHeight + 16;
  const {
    providerType,
    opBookings,
    acceptOPBooking,
    rescheduleOPBooking,
    cancelOPBooking,
    updateOPStatus,
    consultations,
    updateConsultationStatus,
    uploadPrescription,
    homeVisits,
    acceptHomeVisit,
    declineHomeVisit,
    updateHomeVisitStatus,
    pharmacyOrders,
    verifyPrescription,
    suggestSubstitution,
    setOrderEta,
    updateOrderStatus,
    doctors,
  } = useApp();

  // Common Search & Status Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Doctor Sub-tab: 'consultations' | 'home_visits'
  const [doctorSubTab, setDoctorSubTab] = useState<'consultations' | 'home_visits'>('consultations');

  // Hospital Reschedule Modal State
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<OPBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('2026-10-02');
  const [rescheduleSlot, setRescheduleSlot] = useState('11:30 AM');

  // Pharmacy Modals State
  const [rejectRxModalVisible, setRejectRxModalVisible] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Prescription signature missing / illegible');

  const [substitutionModalVisible, setSubstitutionModalVisible] = useState(false);
  const [substOrderId, setSubstOrderId] = useState<string | null>(null);
  const [substProductId, setSubstProductId] = useState<string | null>(null);
  const [substProductName, setSubstProductName] = useState('');
  const [substFormula, setSubstFormula] = useState('');
  const [suggestedBrand, setSuggestedBrand] = useState('');

  const [etaModalVisible, setEtaModalVisible] = useState(false);
  const [etaOrderId, setEtaOrderId] = useState<string | null>(null);
  const [etaMinutesInput, setEtaMinutesInput] = useState('30');

  // Doctor Prescription Modal State
  const [rxModalVisible, setRxModalVisible] = useState(false);
  const [selectedConsultationForRx, setSelectedConsultationForRx] = useState<OnlineConsultation | null>(null);
  const [diagnosisInput, setDiagnosisInput] = useState('Acute Bronchitis & Viral Pharyngitis');
  const [adviceInput, setAdviceInput] = useState('Warm saline gargles twice daily. Hydrate well and rest.');
  const [medNameInput, setMedNameInput] = useState('Augmentin 625 Duo');
  const [medDosageInput, setMedDosageInput] = useState('625 mg');
  const [medFreqInput, setMedFreqInput] = useState('1-0-1 (After food)');
  const [medDurationInput, setMedDurationInput] = useState('5 days');

  // Universal Back Navigation Helper
  const handleGoBack = useCallback(() => {
    if (rescheduleModalVisible) {
      setRescheduleModalVisible(false);
      return true;
    }
    if (rejectRxModalVisible) {
      setRejectRxModalVisible(false);
      return true;
    }
    if (substitutionModalVisible) {
      setSubstitutionModalVisible(false);
      return true;
    }
    if (etaModalVisible) {
      setEtaModalVisible(false);
      return true;
    }
    if (rxModalVisible) {
      setRxModalVisible(false);
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
  }, [
    navigation,
    rescheduleModalVisible,
    rejectRxModalVisible,
    substitutionModalVisible,
    etaModalVisible,
    rxModalVisible,
  ]);

  // Mobile Hardware Back Button Handler
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleGoBack);
      return () => sub.remove();
    }, [handleGoBack])
  );

  // ==========================================
  // 1. HOSPITAL: OP Booking Render
  // ==========================================
  const filteredOPBookings = opBookings.filter((b) => {
    const matchesSearch =
      b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.problemDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatusFilter === 'all' ? true : b.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderOPBookingItem = ({ item }: { item: OPBooking }) => {
    return (
      <Card style={styles.bookingCard}>
        {/* Top Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.patientName}>{item.patientName}</Text>
              <Text style={styles.genderAgePill}>
                {item.patientGender}, {item.patientAge} yrs
              </Text>
            </View>
            <Text style={styles.phoneText}>📞 {item.patientPhone}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'completed'
                ? { backgroundColor: colors.successLight }
                : item.status === 'checked_in'
                ? { backgroundColor: colors.infoLight }
                : item.status === 'pending'
                ? { backgroundColor: colors.warningLight }
                : item.status === 'rescheduled'
                ? { backgroundColor: colors.purpleLight }
                : { backgroundColor: colors.borderLight },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'completed'
                  ? { color: colors.success }
                  : item.status === 'checked_in'
                  ? { color: colors.info }
                  : item.status === 'pending'
                  ? { color: colors.warning }
                  : item.status === 'rescheduled'
                  ? { color: colors.purple }
                  : { color: colors.textSecondary },
              ]}
            >
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Doctor Assigned */}
        <View style={styles.doctorBlock}>
          <Ionicons name="medkit" size={15} color={colors.hospitalRed} />
          <Text style={styles.doctorText}>
            Assigned: <Text style={{ fontWeight: '700' }}>{item.doctorName}</Text> ({item.doctorSpecialization})
          </Text>
        </View>

        {/* Problem Description */}
        <View style={styles.problemBox}>
          <Text style={styles.problemLabel}>Problem Description</Text>
          <Text style={styles.problemContent}>{item.problemDescription}</Text>
        </View>

        {/* Appointment Date & Slot */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.appointmentDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.timeSlot}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="receipt-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              Fee ₹{item.fee} - ₹50 = <Text style={styles.netAmount}>₹{item.netPayout}</Text>
            </Text>
          </View>
        </View>

        {item.rescheduledTo && (
          <View style={styles.rescheduledBanner}>
            <Ionicons name="calendar" size={13} color={colors.purple} />
            <Text style={styles.rescheduledBannerText}>
              Rescheduled To: {item.rescheduledTo}
            </Text>
          </View>
        )}

        {/* Notification Sync Guarantee Banner */}
        <View style={styles.syncAlertRow}>
          <Ionicons name="notifications" size={12} color={colors.primary} />
          <Text style={styles.syncAlertText}>
            Changes automatically notify patient via App, Mail & WhatsApp
          </Text>
        </View>

        {/* Hospital Booking Actions */}
        <View style={styles.actionsBar}>
          {item.status === 'pending' && (
            <>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  acceptOPBooking(item.id);
                }}
              >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Accept</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.info }]}
                onPress={() => {
                  setSelectedBookingForReschedule(item);
                  setRescheduleModalVisible(true);
                }}
              >
                <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Reschedule</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                onPress={() => {
                  cancelOPBooking(item.id, 'Doctor unavailable on requested slot');
                }}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Cancel</Text>
              </Pressable>
            </>
          )}

          {item.status === 'accepted' && (
            <>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.info }]}
                onPress={() => {
                  updateOPStatus(item.id, 'checked_in');
                }}
              >
                <Ionicons name="enter-outline" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Check-in Patient</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                onPress={() => {
                  updateOPStatus(item.id, 'no_show');
                }}
              >
                <Ionicons name="alert-circle-outline" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>No-show</Text>
              </Pressable>
            </>
          )}

          {item.status === 'checked_in' && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={() => {
                updateOPStatus(item.id, 'completed');
              }}
            >
              <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Mark Completed</Text>
            </Pressable>
          )}
        </View>
      </Card>
    );
  };

  // ==========================================
  // 2. DOCTOR: Online Consultations & Home Visits
  // ==========================================
  const filteredConsultations = consultations.filter((c) => {
    const matches =
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.problemDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matches;
  });

  const filteredHomeVisits = homeVisits.filter((v) => {
    const matches =
      v.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.problemDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matches;
  });

  const renderConsultationItem = ({ item }: { item: OnlineConsultation }) => {
    return (
      <Card style={styles.bookingCard}>
        {/* 1. Header: Patient Name & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeftBlock}>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.patientName}
            </Text>
            <View style={styles.subHeaderRow}>
              <View style={styles.onlineBadge}>
                <Ionicons name="videocam" size={12} color={colors.medicalBlue} />
                <Text style={styles.onlineBadgeText}>Video Consult</Text>
              </View>
              <Text style={styles.patientMetaDot}>•</Text>
              <Text style={styles.patientMetaText}>
                {item.patientGender}, {item.patientAge} yrs
              </Text>
              <Text style={styles.patientMetaDot}>•</Text>
              <Text style={styles.patientMetaPhone}>📞 {item.patientPhone}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.status === 'completed'
                ? { backgroundColor: colors.successLight, borderColor: '#86EFAC' }
                : item.status === 'in_call'
                ? { backgroundColor: colors.infoLight, borderColor: '#93C5FD' }
                : { backgroundColor: colors.medicalBlueLight, borderColor: '#BFDBFE' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === 'completed'
                      ? colors.success
                      : item.status === 'in_call'
                      ? colors.info
                      : colors.medicalBlue,
                },
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'completed'
                  ? { color: colors.success }
                  : item.status === 'in_call'
                  ? { color: colors.info }
                  : { color: colors.medicalBlue },
              ]}
            >
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 2. Problem / Symptoms Box */}
        <View style={styles.problemBox}>
          <View style={styles.problemHeader}>
            <Ionicons name="pulse" size={13} color={colors.primary} />
            <Text style={styles.problemLabel}>Symptoms & Reason For Consult</Text>
          </View>
          <Text style={styles.problemContent}>{item.problemDescription}</Text>
        </View>

        {/* 3. Schedule & Net Payout Row */}
        <View style={styles.schedulePayoutRow}>
          <View style={styles.scheduleLeftGroup}>
            <View style={styles.scheduleBadge}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary} />
              <Text style={styles.scheduleBadgeText}>{item.date}</Text>
            </View>
            <View style={styles.scheduleBadge}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={styles.scheduleBadgeText}>{item.timeSlot}</Text>
            </View>
          </View>

          <View style={styles.consultPayoutPill}>
            <Ionicons name="cash-outline" size={13} color="#15803D" />
            <Text style={styles.consultPayoutText}>₹{item.netPayout} Net Payout</Text>
          </View>
        </View>

        {/* 4. Digital Prescription Info if uploaded */}
        {item.prescriptionUploaded && item.prescription && (
          <View style={styles.rxSummaryBox}>
            <View style={styles.rxSummaryHeader}>
              <Ionicons name="document-text" size={14} color={colors.primary} />
              <Text style={styles.rxSummaryTitle} numberOfLines={1}>
                Digital Rx Issued: {item.prescription.diagnosis}
              </Text>
            </View>
            <Text style={styles.rxSummaryMeds}>
              Meds: {item.prescription.medicines.map((m) => m.name).join(', ')}
            </Text>
            <Text style={styles.rxSummaryAdvice}>Advice: {item.prescription.advice}</Text>
            <View style={styles.rxSentChannelsRow}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={styles.rxSentChannelsText}>Dispatched to patient App, Email & WhatsApp</Text>
            </View>
          </View>
        )}

        {/* 5. Action Buttons */}
        <View style={styles.consultActionsWrap}>
          {item.status !== 'completed' ? (
            <>
              <Pressable
                style={styles.joinMeetingPrimaryBtn}
                onPress={() => navigation.navigate('LiveMeeting', { consultation: item })}
                accessibilityLabel="Join Video Meeting"
              >
                <Ionicons name="videocam" size={16} color="#FFFFFF" />
                <Text style={styles.joinMeetingPrimaryBtnText}>Join Video Consultation</Text>
              </Pressable>

              <View style={styles.secondaryActionsRow}>
                <Pressable
                  style={styles.writeRxSecondaryBtn}
                  onPress={() => {
                    setSelectedConsultationForRx(item);
                    setRxModalVisible(true);
                  }}
                  accessibilityLabel="Write Prescription and Notes"
                >
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                  <Text style={styles.writeRxSecondaryBtnText}>
                    {item.prescriptionUploaded ? 'Edit Digital Rx' : 'Write Rx & Notes'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.noShowSecondaryBtn}
                  onPress={() => {
                    updateConsultationStatus(item.id, 'no_show');
                  }}
                  accessibilityLabel="Mark Patient No-show"
                >
                  <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                  <Text style={styles.noShowSecondaryBtnText}>No-show</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              style={styles.viewRxCompletedBtn}
              onPress={() => {
                setSelectedConsultationForRx(item);
                setRxModalVisible(true);
              }}
              accessibilityLabel="View or Edit Digital Prescription"
            >
              <Ionicons name="document-text-outline" size={15} color="#FFFFFF" />
              <Text style={styles.viewRxCompletedBtnText}>View / Edit Digital Rx</Text>
            </Pressable>
          )}
        </View>
      </Card>
    );
  };

  const renderHomeVisitItem = ({ item }: { item: HomeVisitRequest }) => {
    return (
      <Card style={styles.bookingCard}>
        {/* 1. Header: Patient Name & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeftBlock}>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.patientName}
            </Text>
            <View style={styles.subHeaderRow}>
              <View style={[styles.onlineBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="car" size={12} color={colors.primary} />
                <Text style={[styles.onlineBadgeText, { color: colors.primary }]}>
                  Home Visit ({item.distanceKm} km away)
                </Text>
              </View>
              <Text style={styles.patientMetaDot}>•</Text>
              <Text style={styles.patientMetaText}>
                {item.patientGender}, {item.patientAge} yrs
              </Text>
              <Text style={styles.patientMetaDot}>•</Text>
              <Text style={styles.patientMetaPhone}>📞 {item.patientPhone}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.status === 'completed'
                ? { backgroundColor: colors.successLight, borderColor: '#86EFAC' }
                : item.status === 'reached'
                ? { backgroundColor: colors.infoLight, borderColor: '#93C5FD' }
                : item.status === 'on_the_way'
                ? { backgroundColor: colors.purpleLight, borderColor: '#D8B4FE' }
                : item.status === 'accepted'
                ? { backgroundColor: colors.primaryLight, borderColor: '#93C5FD' }
                : { backgroundColor: colors.warningLight, borderColor: '#FDE68A' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === 'completed'
                      ? colors.success
                      : item.status === 'reached'
                      ? colors.info
                      : item.status === 'on_the_way'
                      ? colors.purple
                      : item.status === 'accepted'
                      ? colors.primary
                      : colors.warning,
                },
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'completed'
                  ? { color: colors.success }
                  : item.status === 'reached'
                  ? { color: colors.info }
                  : item.status === 'on_the_way'
                  ? { color: colors.purple }
                  : item.status === 'accepted'
                  ? { color: colors.primary }
                  : { color: colors.warning },
              ]}
            >
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 2. Address & Navigation Box */}
        <View style={styles.addressBox}>
          <View style={styles.addressIconWrap}>
            <Ionicons name="location" size={17} color={colors.hospitalBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressText} numberOfLines={2}>
              {item.address}
            </Text>
            {item.landmark && (
              <Text style={styles.landmarkText} numberOfLines={1}>
                Landmark: {item.landmark}
              </Text>
            )}
          </View>
          <Pressable
            style={styles.navMapBtn}
            hitSlop={6}
          >
            <Ionicons name="navigate" size={13} color="#FFFFFF" />
            <Text style={styles.navMapBtnText}>Navigate</Text>
          </Pressable>
        </View>

        {/* 3. Problem / Symptoms Box */}
        <View style={styles.problemBox}>
          <View style={styles.problemHeader}>
            <Ionicons name="medical" size={13} color={colors.primary} />
            <Text style={styles.problemLabel}>Symptoms & Chief Complaints</Text>
          </View>
          <Text style={styles.problemContent}>{item.problemDescription}</Text>
        </View>

        {/* 4. Schedule & Payout Bar */}
        <View style={styles.schedulePayoutRow}>
          <View style={styles.scheduleLeftGroup}>
            <View style={styles.scheduleBadge}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary} />
              <Text style={styles.scheduleBadgeText}>{item.date}</Text>
            </View>
            <View style={styles.scheduleBadge}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={styles.scheduleBadgeText}>{item.timeSlot}</Text>
            </View>
          </View>

          <View style={styles.consultPayoutPill}>
            <Ionicons name="cash-outline" size={13} color="#15803D" />
            <Text style={styles.consultPayoutText}>₹{item.netPayout} Net Payout</Text>
          </View>
        </View>

        {/* 5. Visit Notes if uploaded */}
        {item.prescriptionNotes && (
          <View style={styles.rxSummaryBox}>
            <View style={styles.rxSummaryHeader}>
              <Ionicons name="document-text" size={14} color={colors.primary} />
              <Text style={styles.rxSummaryTitle}>Visit Notes & Rx Uploaded</Text>
            </View>
            <Text style={styles.rxSummaryAdvice}>{item.prescriptionNotes}</Text>
          </View>
        )}

        {/* 6. Home Visit Status Progression Buttons */}
        <View style={styles.consultActionsWrap}>
          {item.status === 'pending' && (
            <View style={styles.secondaryActionsRow}>
              <Pressable
                style={[styles.homeVisitActionBtn, { backgroundColor: colors.success }]}
                onPress={() => {
                  acceptHomeVisit(item.id);
                }}
              >
                <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                <Text style={styles.homeVisitActionBtnText}>Accept Request</Text>
              </Pressable>

              <Pressable
                style={[styles.homeVisitActionBtn, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' }]}
                onPress={() => {
                  declineHomeVisit(item.id);
                }}
              >
                <Ionicons name="close-circle" size={15} color={colors.danger} />
                <Text style={[styles.homeVisitActionBtnText, { color: colors.danger }]}>Decline</Text>
              </Pressable>
            </View>
          )}

          {item.status === 'accepted' && (
            <Pressable
              style={[styles.homeVisitFullBtn, { backgroundColor: colors.info }]}
              onPress={() => {
                updateHomeVisitStatus(item.id, 'on_the_way');
              }}
            >
              <Ionicons name="bicycle" size={16} color="#FFFFFF" />
              <Text style={styles.homeVisitFullBtnText}>Update: On The Way to Patient</Text>
            </Pressable>
          )}

          {item.status === 'on_the_way' && (
            <Pressable
              style={[styles.homeVisitFullBtn, { backgroundColor: colors.purple }]}
              onPress={() => {
                updateHomeVisitStatus(item.id, 'reached');
              }}
            >
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.homeVisitFullBtnText}>Update: Reached Patient Doorstep</Text>
            </Pressable>
          )}

          {item.status === 'reached' && (
            <Pressable
              style={[styles.homeVisitFullBtn, { backgroundColor: colors.success }]}
              onPress={() => {
                updateHomeVisitStatus(
                  item.id,
                  'completed',
                  'Vitals normal. Administered prescribed analgesics. Rest advised for 48 hrs.',
                );
              }}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              <Text style={styles.homeVisitFullBtnText}>Complete Visit & Record Rx</Text>
            </Pressable>
          )}
        </View>
      </Card>
    );
  };

  // ==========================================
  // 3. PHARMACY: Medicine Delivery Orders Render
  // ==========================================
  const filteredPharmacyOrders = pharmacyOrders.filter((o) => {
    const matches =
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatusFilter === 'all' ? true : o.status === selectedStatusFilter;
    return matches && matchesStatus;
  });

  const renderPharmacyOrderItem = ({ item }: { item: PharmacyOrder }) => {
    return (
      <Card style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.patientName}>{item.customerName}</Text>
              <Text style={styles.orderIdBadge}>Order #{item.id}</Text>
            </View>
            <Text style={styles.phoneText}>📞 {item.customerPhone}</Text>
            <Text style={styles.addressLineText} numberOfLines={1}>
              📍 {item.deliveryAddress}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'delivered'
                ? { backgroundColor: colors.successLight }
                : item.status === 'out_for_delivery'
                ? { backgroundColor: colors.infoLight }
                : item.status === 'packed'
                ? { backgroundColor: colors.purpleLight }
                : item.status === 'accepted'
                ? { backgroundColor: colors.pharmacyTealLight }
                : { backgroundColor: colors.warningLight },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'delivered'
                  ? { color: colors.success }
                  : item.status === 'out_for_delivery'
                  ? { color: colors.info }
                  : item.status === 'packed'
                  ? { color: colors.purple }
                  : item.status === 'accepted'
                  ? { color: colors.pharmacyTeal }
                  : { color: colors.warning },
              ]}
            >
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Prescription Verification Status Banner */}
        <View
          style={[
            styles.rxVerificationCard,
            item.prescriptionStatus === 'approved'
              ? { backgroundColor: colors.successLight, borderColor: colors.success }
              : item.prescriptionStatus === 'rejected'
              ? { backgroundColor: colors.dangerLight, borderColor: colors.danger }
              : { backgroundColor: colors.warningLight, borderColor: colors.warning },
          ]}
        >
          <View style={styles.rxVerifRow}>
            <Ionicons
              name={
                item.prescriptionStatus === 'approved'
                  ? 'shield-checkmark'
                  : item.prescriptionStatus === 'rejected'
                  ? 'close-circle'
                  : 'document-text-outline'
              }
              size={18}
              color={
                item.prescriptionStatus === 'approved'
                  ? colors.success
                  : item.prescriptionStatus === 'rejected'
                  ? colors.danger
                  : colors.warning
              }
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rxVerifTitle}>
                Uploaded Prescription:{' '}
                <Text style={{ fontWeight: '800' }}>{item.prescriptionStatus.toUpperCase()}</Text>
              </Text>
              {item.rejectionReason && (
                <Text style={styles.rejectionReasonText}>Reason: {item.rejectionReason}</Text>
              )}
            </View>

            {item.prescriptionStatus === 'pending' && (
              <View style={styles.verifBtnGroup}>
                <Pressable
                  style={[styles.smallVerifBtn, { backgroundColor: colors.success }]}
                  onPress={() => {
                    verifyPrescription(item.id, 'approved');
                  }}
                >
                  <Text style={styles.smallVerifBtnText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={[styles.smallVerifBtn, { backgroundColor: colors.danger }]}
                  onPress={() => {
                    setRejectOrderId(item.id);
                    setRejectRxModalVisible(true);
                  }}
                >
                  <Text style={styles.smallVerifBtnText}>Reject</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Ordered Medicines & Equipment Table */}
        <View style={styles.itemsTable}>
          <Text style={styles.itemsTableHeading}>Order Items & Active Composition:</Text>
          {item.items.map((prod, idx) => (
            <View key={idx} style={styles.orderItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderItemName}>{prod.name}</Text>
                <Text style={styles.orderItemFormula}>Active Formula: {prod.formula}</Text>
                {prod.suggestedSubstitution && (
                  <View style={styles.substNotice}>
                    <Ionicons name="swap-horizontal" size={12} color={colors.purple} />
                    <Text style={styles.substNoticeText}>
                      Substitute Suggested: {prod.suggestedSubstitution} (Same Formula)
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderItemQty}>Qty: {prod.quantity}</Text>
                <Text style={styles.orderItemPrice}>₹{prod.price * prod.quantity}</Text>
                {/* Substitution suggestion trigger */}
                <Pressable
                  style={styles.substBtn}
                  onPress={() => {
                    setSubstOrderId(item.id);
                    setSubstProductId(prod.productId);
                    setSubstProductName(prod.name);
                    setSubstFormula(prod.formula);
                    setSuggestedBrand(`Generic ${prod.formula} 500mg`);
                    setSubstitutionModalVisible(true);
                  }}
                >
                  <Text style={styles.substBtnText}>Suggest Substitute</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Meta & Payout Row */}
        <View style={styles.metaRow}>
          <Pressable
            style={styles.metaItem}
            onPress={() => {
              setEtaOrderId(item.id);
              setEtaMinutesInput(String(item.etaMinutes || 30));
              setEtaModalVisible(true);
            }}
          >
            <Ionicons name="timer-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>ETA: {item.etaMinutes || 30} mins (Edit)</Text>
          </Pressable>
          <View style={styles.metaItem}>
            <Ionicons name="wallet-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              Total ₹{item.totalAmount} - ₹50 = <Text style={styles.netAmount}>₹{item.netPayout} Net</Text>
            </Text>
          </View>
        </View>

        {/* Pharmacy Order Status Progression */}
        <View style={styles.actionsBar}>
          {item.status === 'pending' && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.pharmacyTeal }]}
              onPress={() => {
                updateOrderStatus(item.id, 'accepted');
              }}
            >
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Accept Order</Text>
            </Pressable>
          )}

          {item.status === 'accepted' && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.purple }]}
              onPress={() => {
                updateOrderStatus(item.id, 'packed');
              }}
            >
              <Ionicons name="cube-outline" size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Mark Packed</Text>
            </Pressable>
          )}

          {item.status === 'packed' && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.info }]}
              onPress={() => {
                updateOrderStatus(item.id, 'out_for_delivery');
              }}
            >
              <Ionicons name="bicycle-outline" size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Out for Delivery</Text>
            </Pressable>
          )}

          {item.status === 'out_for_delivery' && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={() => {
                updateOrderStatus(item.id, 'delivered');
              }}
            >
              <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Mark Delivered</Text>
            </Pressable>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={handleGoBack}
          accessibilityLabel="Back to Previous"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>
            {providerType === 'hospital'
              ? 'OP Appointments'
              : providerType === 'doctor'
              ? 'Consultations & Visits'
              : 'Pharmacy Orders'}
          </Text>
          <Text style={styles.screenSubtitle}>
            {providerType === 'hospital'
              ? 'Manage hospital out-patient schedules'
              : providerType === 'doctor'
              ? 'Online telemedicine & doorstep home visits'
              : 'Prescription verification & medicine delivery'}
          </Text>
        </View>
      </View>

      {/* Doctor Mode Sub-tabs (Consultations vs Home Visits) */}
      {providerType === 'doctor' && (
        <View style={styles.doctorSubTabsWrap}>
          <Pressable
            style={[
              styles.doctorSubTabBtn,
              doctorSubTab === 'consultations' && styles.doctorSubTabBtnActive,
            ]}
            onPress={() => setDoctorSubTab('consultations')}
          >
            <Ionicons
              name={doctorSubTab === 'consultations' ? 'videocam' : 'videocam-outline'}
              size={15}
              color={doctorSubTab === 'consultations' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.doctorSubTabText,
                doctorSubTab === 'consultations' && styles.doctorSubTabTextActive,
              ]}
            >
              Online Consultations ({consultations.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.doctorSubTabBtn,
              doctorSubTab === 'home_visits' && styles.doctorSubTabBtnActive,
            ]}
            onPress={() => setDoctorSubTab('home_visits')}
          >
            <Ionicons
              name={doctorSubTab === 'home_visits' ? 'car' : 'car-outline'}
              size={15}
              color={doctorSubTab === 'home_visits' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.doctorSubTabText,
                doctorSubTab === 'home_visits' && styles.doctorSubTabTextActive,
              ]}
            >
              Home Visits ({homeVisits.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name, condition or phone..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Status Filter Chips (for Hospital and Pharmacy) */}
      {providerType !== 'doctor' && (
        <View style={styles.filterChipsRow}>
          {(providerType === 'hospital'
            ? [
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'accepted', label: 'Accepted' },
                { id: 'checked_in', label: 'Checked-in' },
                { id: 'completed', label: 'Completed' },
              ]
            : [
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'accepted', label: 'Accepted' },
                { id: 'packed', label: 'Packed' },
                { id: 'out_for_delivery', label: 'Out for Delivery' },
                { id: 'delivered', label: 'Delivered' },
              ]
          ).map((chip) => {
            const active = selectedStatusFilter === chip.id;
            return (
              <Pressable
                key={chip.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedStatusFilter(chip.id)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Main Dynamic List */}
      {providerType === 'hospital' && (
        <FlatList
          data={filteredOPBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderOPBookingItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No OP Bookings Found</Text>
              <Text style={styles.emptySub}>No bookings match your current search and filter.</Text>
            </View>
          }
        />
      )}

      {providerType === 'doctor' && doctorSubTab === 'consultations' && (
        <FlatList
          data={filteredConsultations}
          keyExtractor={(item) => item.id}
          renderItem={renderConsultationItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="videocam-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Video Consultations Found</Text>
            </View>
          }
        />
      )}

      {providerType === 'doctor' && doctorSubTab === 'home_visits' && (
        <FlatList
          data={filteredHomeVisits}
          keyExtractor={(item) => item.id}
          renderItem={renderHomeVisitItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="car-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Home Visit Requests</Text>
            </View>
          }
        />
      )}

      {providerType === 'pharmacy' && (
        <FlatList
          data={filteredPharmacyOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderPharmacyOrderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="cube-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Delivery Orders Found</Text>
            </View>
          }
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 1: HOSPITAL RESCHEDULE MODAL                       */}
      {/* ======================================================== */}
      <Modal visible={rescheduleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule OP Appointment</Text>
              <Pressable onPress={() => setRescheduleModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Patient: {selectedBookingForReschedule?.patientName} ({selectedBookingForReschedule?.doctorName})
            </Text>

            <Text style={styles.inputLabel}>New Appointment Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              placeholder="e.g. 2026-10-02"
            />

            <Text style={styles.inputLabel}>New Time Slot</Text>
            <TextInput
              style={styles.modalInput}
              value={rescheduleSlot}
              onChangeText={setRescheduleSlot}
              placeholder="e.g. 11:30 AM"
            />

            <View style={styles.modalNotice}>
              <Ionicons name="information-circle" size={15} color={colors.primary} />
              <Text style={styles.modalNoticeText}>
                The customer will be instantly notified with confirmation on WhatsApp, Email and One Buddy App.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setRescheduleModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSubmitBtn}
                onPress={() => {
                  if (selectedBookingForReschedule) {
                    rescheduleOPBooking(selectedBookingForReschedule.id, rescheduleDate, rescheduleSlot);
                    setRescheduleModalVisible(false);
                  }
                }}
              >
                <Text style={styles.modalSubmitText}>Confirm & Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: PHARMACY PRESCRIPTION REJECTION REASON          */}
      {/* ======================================================== */}
      <Modal visible={rejectRxModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Prescription</Text>
              <Pressable onPress={() => setRejectRxModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Specify why the prescription cannot be dispensed:
            </Text>

            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Expired date, Doctor registration number missing, etc."
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setRejectRxModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalSubmitBtn, { backgroundColor: colors.danger }]}
                onPress={() => {
                  if (rejectOrderId) {
                    verifyPrescription(rejectOrderId, 'rejected', rejectReason);
                    setRejectRxModalVisible(false);
                  }
                }}
              >
                <Text style={styles.modalSubmitText}>Confirm Rejection</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: PHARMACY MEDICINE SUBSTITUTION                  */}
      {/* ======================================================== */}
      <Modal visible={substitutionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suggest Formula Substitution</Text>
              <Pressable onPress={() => setSubstitutionModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Item out of stock: <Text style={{ fontWeight: '700' }}>{substProductName}</Text>
            </Text>
            <Text style={styles.modalSub}>
              Active Chemical Formula: <Text style={{ fontWeight: '700' }}>{substFormula}</Text>
            </Text>

            <Text style={styles.inputLabel}>Available Alternative Brand (Same Formula)</Text>
            <TextInput
              style={styles.modalInput}
              value={suggestedBrand}
              onChangeText={setSuggestedBrand}
              placeholder="e.g. Cipla Paracetamol 650mg"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setSubstitutionModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalSubmitBtn, { backgroundColor: colors.pharmacyTeal }]}
                onPress={() => {
                  if (substOrderId && substProductId && suggestedBrand.trim()) {
                    suggestSubstitution(substOrderId, substProductId, suggestedBrand);
                    setSubstitutionModalVisible(false);
                  }
                }}
              >
                <Text style={styles.modalSubmitText}>Send Suggestion</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: PHARMACY ETA SETTER                             */}
      {/* ======================================================== */}
      <Modal visible={etaModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Estimated Delivery Time</Text>
              <Pressable onPress={() => setEtaModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Estimated Delivery Minutes</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={etaMinutesInput}
              onChangeText={setEtaMinutesInput}
              placeholder="e.g. 25"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setEtaModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalSubmitBtn, { backgroundColor: colors.pharmacyTeal }]}
                onPress={() => {
                  const mins = parseInt(etaMinutesInput, 10);
                  if (etaOrderId && !isNaN(mins)) {
                    setOrderEta(etaOrderId, mins);
                    setEtaModalVisible(false);
                  }
                }}
              >
                <Text style={styles.modalSubmitText}>Save ETA</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: DOCTOR DIGITAL PRESCRIPTION BUILDER             */}
      {/* ======================================================== */}
      <Modal visible={rxModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Digital Prescription Builder</Text>
              <Pressable onPress={() => setRxModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>
                Patient: <Text style={{ fontWeight: '700' }}>{selectedConsultationForRx?.patientName}</Text> (
                {selectedConsultationForRx?.patientGender}, {selectedConsultationForRx?.patientAge} yrs)
              </Text>

              <Text style={styles.inputLabel}>Clinical Diagnosis</Text>
              <TextInput
                style={styles.modalInput}
                value={diagnosisInput}
                onChangeText={setDiagnosisInput}
                placeholder="e.g. Acute Viral Pharyngitis"
              />

              <Text style={styles.inputLabel}>Prescribed Medicine</Text>
              <TextInput
                style={styles.modalInput}
                value={medNameInput}
                onChangeText={setMedNameInput}
                placeholder="Medicine Name (e.g. Augmentin 625 Duo)"
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Dosage</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={medDosageInput}
                    onChangeText={setMedDosageInput}
                    placeholder="625 mg"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Frequency</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={medFreqInput}
                    onChangeText={setMedFreqInput}
                    placeholder="1-0-1"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Duration & Timing</Text>
              <TextInput
                style={styles.modalInput}
                value={medDurationInput}
                onChangeText={setMedDurationInput}
                placeholder="5 days after food"
              />

              <Text style={styles.inputLabel}>Clinical Advice & Precautions</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                multiline
                value={adviceInput}
                onChangeText={setAdviceInput}
                placeholder="Instructions for patient..."
              />

              <View style={styles.modalNotice}>
                <Ionicons name="send" size={14} color={colors.primary} />
                <Text style={styles.modalNoticeText}>
                  Upon confirmation, this digital prescription will be generated with a secure QR code and sent
                  directly to the patient's App, Registered Email, and WhatsApp.
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setRxModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (selectedConsultationForRx) {
                      uploadPrescription(selectedConsultationForRx.id, {
                        patientName: selectedConsultationForRx.patientName,
                        doctorName: 'Dr. Vikram Sengupta, MD',
                        diagnosis: diagnosisInput,
                        advice: adviceInput,
                        medicines: [
                          {
                            id: `m-${Date.now()}`,
                            name: medNameInput,
                            dosage: medDosageInput,
                            frequency: medFreqInput,
                            timing: 'After food',
                            duration: medDurationInput,
                          },
                        ],
                      });
                      setRxModalVisible(false);
                    }
                  }}
                >
                  <Text style={styles.modalSubmitText}>Generate & Send Rx</Text>
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
  screenHeader: {
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
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  doctorSubTabsWrap: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
    paddingTop: 4,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  doctorSubTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doctorSubTabBtnActive: {
    backgroundColor: colors.medicalBlue,
    borderColor: colors.medicalBlue,
  },
  doctorSubTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  doctorSubTabTextActive: {
    color: '#FFFFFF',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  bookingCard: {
    padding: 14,
    borderRadius: radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  headerLeftBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  patientMetaDot: {
    fontSize: 11,
    color: colors.textMuted,
  },
  patientMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  patientMetaPhone: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderAgePill: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  phoneText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addressLineText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  orderIdBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  doctorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    marginVertical: 4,
  },
  doctorText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  problemBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: 6,
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  problemLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  problemContent: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  schedulePayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: 4,
    gap: 8,
  },
  scheduleLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scheduleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  consultPayoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  consultPayoutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  netAmount: {
    fontWeight: '800',
    color: colors.success,
  },
  rescheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.purpleLight,
    padding: 6,
    borderRadius: radius.sm,
    marginVertical: 4,
  },
  rescheduledBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.purple,
  },
  syncAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  syncAlertText: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  consultActionsWrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  joinMeetingPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.medicalBlue,
    paddingVertical: 10,
    borderRadius: radius.md,
    minHeight: 40,
  },
  joinMeetingPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  writeRxSecondaryBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    borderRadius: radius.md,
    minHeight: 38,
  },
  writeRxSecondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  noShowSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    borderRadius: radius.md,
    minHeight: 38,
  },
  noShowSecondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  viewRxCompletedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: radius.md,
    minHeight: 38,
  },
  viewRxCompletedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.md,
    minHeight: 38,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.medicalBlueLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.medicalBlue,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: 5,
  },
  addressIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.hospitalBlueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  landmarkText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  navMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.hospitalBlue,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  navMapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  homeVisitActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: radius.md,
    minHeight: 38,
  },
  homeVisitActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  homeVisitFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.md,
    minHeight: 38,
  },
  homeVisitFullBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rxSummaryBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.primaryDark + '30',
  },
  rxSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rxSummaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  rxSummaryMeds: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rxSummaryAdvice: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  rxSentChannelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rxSentChannelsText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  rxVerificationCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginVertical: 6,
  },
  rxVerifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rxVerifTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  rejectionReasonText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 1,
  },
  verifBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  smallVerifBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  smallVerifBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  itemsTable: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginVertical: 6,
  },
  itemsTableHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  orderItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  orderItemFormula: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  orderItemQty: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  orderItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  substBtn: {
    marginTop: 3,
    backgroundColor: colors.purpleLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  substBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.purple,
  },
  substNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.purpleLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginTop: 2,
  },
  substNoticeText: {
    fontSize: 10,
    color: colors.purple,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.background,
  },
  modalNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  modalNoticeText: {
    flex: 1,
    fontSize: 11,
    color: colors.primaryDark,
    lineHeight: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.lg,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
