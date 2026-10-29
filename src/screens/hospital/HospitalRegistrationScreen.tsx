import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
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
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import Card from '../../components/Card';
import { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../context/AppContext';
import { pickDocumentOrImage } from '../../utils/filePicker';

const HOSPITAL_TYPES = [
  'Super-Specialty Hospital',
  'Multi-Specialty Hospital',
  'Tertiary Care Center',
  'Nursing Home',
  'Day-Care Surgical Center',
];

const ACCREDITATION_LEVELS = [
  'NABH Full Accreditation',
  'NABH Entry-Level (SHCO)',
  'NABL Accredited Lab',
  'ISO 9001:2015 Certified',
  'State Health Registered',
];

const DEPARTMENTS = [
  'Emergency & Trauma',
  'Cardiology & Cath Lab',
  'Orthopedics & Joint Replacement',
  'Neurology & Neurosurgery',
  'Pediatrics & NICU',
  'Obstetrics & Gynecology',
  'Oncology & Chemotherapy',
  'Nephrology & Dialysis',
  'Gastroenterology',
  'General & Laparoscopic Surgery',
];

// Phone line options for manual selection with strictly required digit counts
const PHONE_LINE_OPTIONS = [
  { id: 'mobile', label: 'Direct Mobile', prefix: '+91', placeholder: 'Enter 10-digit mobile number', minDigits: 10, maxDigits: 10 },
  { id: 'landline', label: 'Hospital Landline (STD)', prefix: '080', placeholder: 'Enter 8-digit landline number', minDigits: 8, maxDigits: 8 },
  { id: 'tollfree', label: 'Toll-Free Helpline', prefix: '1800', placeholder: 'Enter 6 or 7-digit toll-free number', minDigits: 6, maxDigits: 7 },
  { id: 'casualty', label: 'Emergency Casualty Desk', prefix: '+91', placeholder: 'Enter 10-digit casualty number', minDigits: 10, maxDigits: 10 },
];

const STEPS = [
  { id: 1, title: 'Identity & Beds', icon: 'business' as const },
  { id: 2, title: 'Accreditations', icon: 'shield-checkmark' as const },
  { id: 3, title: 'Premises & Admin', icon: 'call' as const },
  { id: 4, title: 'Document Upload', icon: 'cloud-upload' as const },
  { id: 5, title: 'Bank & Legal', icon: 'checkmark-done-circle' as const },
];

interface HospitalRegistrationProps {
  embedded?: boolean;
  onComplete?: () => void;
  onSwitchToDashboard?: () => void;
}

export default function HospitalRegistrationScreen({
  embedded = false,
  onComplete,
  onSwitchToDashboard,
}: HospitalRegistrationProps = {}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'HospitalRegistration'>>();
  const { provider, hospitalProfile, isCategoryRegistered, registerProvider, switchProviderMode, toggleOnlineAvailability } = useApp();

  const isHospRegistered = isCategoryRegistered('hospital');
  // If explicitly opened to edit or register, show form; otherwise open dashboard directly if already registered
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isRegistered, setIsRegistered] = useState<boolean>(
    route?.params?.mode === 'edit' || route?.params?.mode === 'register' ? false : isHospRegistered
  );

  useEffect(() => {
    if (route?.params?.mode === 'edit' || route?.params?.mode === 'register') {
      setIsRegistered(false);
    } else if (isHospRegistered) {
      setIsRegistered(true);
    }
  }, [route?.params?.mode, isHospRegistered]);

  useFocusEffect(
    useCallback(() => {
      if (embedded) return;
      const onBackPress = () => {
        if (!isRegistered && currentStep > 1) {
          handlePrevStep();
          return true;
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Main', { screen: 'Home' } as any);
        }
        return true;
      };
      const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backSub.remove();
    }, [embedded, isRegistered, currentStep, navigation])
  );

  const activeHosp = hospitalProfile || provider;

  // Step 1: Hospital Identity & Beds
  const [hospitalName, setHospitalName] = useState(
    activeHosp?.name || 'Apollo LifeCare Super Speciality Hospital',
  );
  const [hospitalType, setHospitalType] = useState(HOSPITAL_TYPES[0]);
  const [totalBeds, setTotalBeds] = useState('180');
  const [icuBeds, setIcuBeds] = useState('24');
  const [operationTheatres, setOperationTheatres] = useState('6');

  // Facilities Toggles
  const [hasEmergency24x7, setHasEmergency24x7] = useState(true);
  const [hasBloodBank, setHasBloodBank] = useState(true);
  const [hasRadiology, setHasRadiology] = useState(true);
  const [hasAmbulanceFleet, setHasAmbulanceFleet] = useState(true);

  // Departments
  const [selectedDepts, setSelectedDepts] = useState<string[]>([
    'Emergency & Trauma',
    'Cardiology & Cath Lab',
    'Orthopedics & Joint Replacement',
    'Neurology & Neurosurgery',
    'Pediatrics & NICU',
  ]);

  // Step 2: Regulatory & Accreditations
  const [ceaLicenseNumber, setCeaLicenseNumber] = useState(
    activeHosp?.licenseNumber || 'HOSP-KA-BLR-2024-8841',
  );
  const [accreditation, setAccreditation] = useState(ACCREDITATION_LEVELS[0]);
  const [bmwAuthNumber, setBmwAuthNumber] = useState('KSPCB-BMW-2025-4190');

  // Step 3: Administration & Premises
  const [superintendentName, setSuperintendentName] = useState('Dr. Arvind K. Rao, MD, FRCS');
  const [superintendentRegNo, setSuperintendentRegNo] = useState('KMC-1998-38291');

  // Phone number: Manual or pre-filled from registered profile
  const [selectedPhoneOption, setSelectedPhoneOption] = useState<string | null>('mobile');
  const [adminPhone, setAdminPhone] = useState(
    activeHosp?.phone ? activeHosp.phone.replace('+91 ', '') : '9820112345'
  );
  const [emergencyHotline, setEmergencyHotline] = useState('080-23456789');
  const [hospitalEmail, setHospitalEmail] = useState(
    activeHosp?.email || 'partner@apollolifecare.org'
  );

  // Premises & Location
  const [campusAddress, setCampusAddress] = useState(
    activeHosp?.address || 'Plot 42, Healthcare Boulevard, HSR Layout Sector 2'
  );
  const [city, setCity] = useState(activeHosp?.city || 'Bengaluru');
  const [stateName, setStateName] = useState(activeHosp?.state || 'Karnataka');
  const [pincode, setPincode] = useState(activeHosp?.pincode || '560102');

  // Step 4: Regulatory Document Uploads
  const [uploadedCeaDoc, setUploadedCeaDoc] = useState('CEA_Registration_Certificate.pdf');
  const [uploadedBmwDoc, setUploadedBmwDoc] = useState('BioMedical_Waste_Clearance.pdf');

  // Step 5: Bank Settlement & Legal Declaration
  const [bankName, setBankName] = useState(activeHosp?.bankDetails?.bankName || 'HDFC Bank');
  const [accountNumber, setAccountNumber] = useState(activeHosp?.bankDetails?.accountNumber || '50200088921475');
  const [ifscCode, setIfscCode] = useState(activeHosp?.bankDetails?.ifscCode || 'HDFC0001245');
  const [upiId, setUpiId] = useState(activeHosp?.bankDetails?.upiId || 'apollolifecare@hdfcbank');
  const [isDeclared, setIsDeclared] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleDept = (dept: string) => {
    if (selectedDepts.includes(dept)) {
      if (selectedDepts.length === 1) {
        setErrors((prev) => ({ ...prev, selectedDepts: 'Please keep at least one active clinical department selected.' }));
        return;
      }
      clearError('selectedDepts');
      setSelectedDepts(selectedDepts.filter((d) => d !== dept));
    } else {
      clearError('selectedDepts');
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  // Step Validation & Forward Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      const newErrors: Record<string, string> = {};
      if (!hospitalName.trim()) {
        newErrors.hospitalName = 'Please enter official hospital or healthcare center name.';
      }
      if (!totalBeds.trim()) {
        newErrors.totalBeds = 'Please specify total bed capacity.';
      }
      if (selectedDepts.length === 0) {
        newErrors.selectedDepts = 'Please keep at least one active clinical department selected.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const newErrors: Record<string, string> = {};
      if (!ceaLicenseNumber.trim()) {
        newErrors.ceaLicenseNumber = 'Please enter Clinical Establishment Act registration number.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const newErrors: Record<string, string> = {};
      const cleanPhone = adminPhone.trim().replace(/\D/g, '');
      const activeOpt = PHONE_LINE_OPTIONS.find((o) => o.id === selectedPhoneOption);
      const minDigits = activeOpt?.minDigits || 10;
      const maxDigits = activeOpt?.maxDigits || 10;
      if (!selectedPhoneOption) {
        newErrors.selectedPhoneOption = 'Please choose a phone line option manually.';
      } else if (!adminPhone.trim()) {
        newErrors.adminPhone = 'Please enter administrative contact number.';
      } else if (cleanPhone.length < minDigits || cleanPhone.length > maxDigits) {
        if (minDigits === maxDigits) {
          newErrors.adminPhone = `Please enter exactly ${minDigits} digits for ${activeOpt?.label}.`;
        } else {
          newErrors.adminPhone = `Please enter ${minDigits} to ${maxDigits} digits for ${activeOpt?.label}.`;
        }
      }
      if (!campusAddress.trim()) {
        newErrors.campusAddress = 'Please enter hospital campus address.';
      }
      if (!city.trim()) {
        newErrors.city = 'Please enter city.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(4);
    } else if (currentStep === 4) {
      const newErrors: Record<string, string> = {};
      if (!uploadedCeaDoc) {
        newErrors.uploadedCeaDoc = 'Please upload or attach your CEA Registration Certificate.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegisterHospital = () => {
    const newErrors: Record<string, string> = {};
    if (!bankName.trim()) {
      newErrors.bankName = 'Please enter designated bank name.';
    }
    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Please enter bank account number.';
    }
    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'Please enter bank IFSC code.';
    }
    if (!isDeclared) {
      newErrors.declaration = 'Please verify compliance with the Clinical Establishments Act.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const phonePrefix = selectedPhoneOption
      ? PHONE_LINE_OPTIONS.find((o) => o.id === selectedPhoneOption)?.prefix || '+91'
      : '+91';

    // Register provider details into global app context
    registerProvider({
      type: 'hospital',
      name: hospitalName.trim(),
      phone: `${phonePrefix} ${adminPhone.trim()}`,
      email: hospitalEmail.trim(),
      address: campusAddress.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      licenseNumber: ceaLicenseNumber.trim(),
      licenseType: 'Hospital Clinical Establishment Act License (CEA)',
      licenseDocName: uploadedCeaDoc,
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        accountName: hospitalName.trim(),
        upiId: upiId.trim(),
      },
    });

    switchProviderMode('hospital');

    // Keep the user within the registered hospital service dashboard without redirecting to Home!
    setIsRegistered(true);
    Alert.alert(
      isHospRegistered ? 'Changes Updated' : 'Registration Complete',
      isHospRegistered
        ? 'Your hospital details, bed capacity, and department setup have been updated successfully.'
        : 'Hospital registration completed successfully. Welcome to OneBuddy Medical!'
    );
    onComplete?.();
  };

  const ContainerComponent = embedded ? View : SafeAreaView;
  const containerProps = embedded ? { style: styles.safe } : { style: styles.safe, edges: ['top'] as const };

  // If already registered, render the Hospital Provider Dashboard right here!
  if (isRegistered) {
    return (
      <ContainerComponent {...(containerProps as any)}>
        {/* Hospital Dashboard Header */}
        <View style={[styles.topHeader, embedded && styles.topHeaderEmbedded]}>
          {!embedded && (
            <Pressable
              style={styles.backBtn}
              onPress={() => {
                navigation.navigate('Main', { screen: 'Home' } as any);
              }}
              accessibilityLabel="Back to Live Operations"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          )}

          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="business" size={16} color="#0094D4" />
              <Text style={[styles.headerTitle, embedded && { color: '#0F172A' }]} numberOfLines={1}>
                {hospitalName}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, embedded && { color: '#64748B' }]} numberOfLines={1}>
              Registered Hospital • CEA: {ceaLicenseNumber}
            </Text>
          </View>

          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
            <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Status Hero Card */}
          <Card style={styles.dashboardHeroCard} padding="lg">
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="business" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.heroHospitalName} numberOfLines={1}>{hospitalName}</Text>
                <Text style={styles.heroHospitalType}>{hospitalType}</Text>
                <Text style={styles.heroAccreditationText}>{accreditation} • CEA Approved</Text>
              </View>
            </View>

            {/* Fully Accessible Online / Offline Toggle Button (Silent: No Notification Alert) */}
            <View style={styles.onlineToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.onlineToggleTitle}>Emergency & OP Status</Text>
                <Text style={styles.onlineToggleSub}>
                  {provider.isOnline
                    ? 'Online: Accepting in-person OP bookings & emergency triage'
                    : 'Offline: New admissions & appointments paused'}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.onlineToggleBtn,
                  {
                    backgroundColor: provider.isOnline ? '#DCFCE7' : '#F1F5F9',
                    borderColor: provider.isOnline ? '#86EFAC' : '#CBD5E1',
                  },
                ]}
                onPress={() => {
                  toggleOnlineAvailability();
                }}
                accessibilityRole="switch"
                accessibilityState={{ checked: provider.isOnline }}
                accessibilityLabel={`Hospital status is ${provider.isOnline ? 'Online' : 'Offline'}. Tap to toggle.`}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.onlineDot,
                    { backgroundColor: provider.isOnline ? '#16A34A' : '#64748B' },
                  ]}
                />
                <Text
                  style={[
                    styles.onlineToggleBtnText,
                    { color: provider.isOnline ? '#15803D' : '#475569' },
                  ]}
                >
                  {provider.isOnline ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </Pressable>
            </View>

            {/* Quick Action to Update Changes */}
            <Pressable
              style={styles.heroUpdateBtn}
              onPress={() => setIsRegistered(false)}
              accessibilityLabel="Update Hospital Changes"
            >
              <Ionicons name="create-outline" size={16} color="#0094D4" />
              <Text style={styles.heroUpdateBtnText}>Update Hospital Details & Beds</Text>
            </Pressable>
          </Card>

          {/* Infrastructure Metrics Overview */}
          <View style={[styles.sectionHeader, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
            <Ionicons name="stats-chart" size={17} color="#0094D4" />
            <Text style={styles.sectionTitle}>Hospital Infrastructure & Bed Capacity</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#E6F6FC' }]}>
                  <Ionicons name="bed" size={19} color="#0094D4" />
                </View>
                <Text style={styles.statNumber}>{totalBeds}</Text>
                <Text style={styles.statLabel}>Total Beds</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="pulse" size={19} color="#0284C7" />
                </View>
                <Text style={styles.statNumber}>{icuBeds}</Text>
                <Text style={styles.statLabel}>ICU Beds</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="medkit" size={19} color="#16A34A" />
                </View>
                <Text style={styles.statNumber}>{operationTheatres}</Text>
                <Text style={styles.statLabel}>Surgical OTs</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#F0FDFA' }]}>
                  <Ionicons name="flash" size={19} color="#0D9488" />
                </View>
                <Text style={styles.statNumber}>{hasEmergency24x7 ? '24/7' : 'Day'}</Text>
                <Text style={styles.statLabel}>Casualty Desk</Text>
              </View>
            </View>
          </View>

          {/* Hospital Management Actions */}
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={17} color="#0094D4" />
            <Text style={styles.sectionTitle}>Hospital Service Modules</Text>
          </View>

          <View style={styles.actionGrid}>
            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate('HospitalDoctors')}
              accessibilityLabel="Manage Doctor Rosters"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#E6F6FC' }]}>
                  <Ionicons name="people" size={22} color="#0094D4" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Doctor Rosters</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Manage OPD consulting specialists</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={styles.actionLinkText}>Open Rosters</Text>
                <Ionicons name="arrow-forward" size={12} color="#0094D4" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate('HospitalPackages')}
              accessibilityLabel="Manage Health Packages"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#E6F6FC' }]}>
                  <Ionicons name="cube" size={22} color="#0094D4" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Health Packages</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Preventive health checkup plans</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#0094D4' }]}>Open Packages</Text>
                <Ionicons name="arrow-forward" size={12} color="#0094D4" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
              accessibilityLabel="OP Consultation Bookings"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="calendar" size={22} color="#16A34A" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>OP Bookings Desk</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Incoming patient appointments</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#16A34A' }]}>View Bookings</Text>
                <Ionicons name="arrow-forward" size={12} color="#16A34A" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => {
                switchProviderMode('hospital');
                navigation.navigate('Main', { screen: 'Home' } as any);
              }}
              accessibilityLabel="Enter Live Operations Hub"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="pulse" size={22} color="#16A34A" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Live Operations Hub</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Real-time appointments & beds</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#16A34A' }]}>Enter Live Ops</Text>
                <Ionicons name="arrow-forward" size={12} color="#16A34A" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => setIsRegistered(false)}
              accessibilityLabel="Update Hospital Facility"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#E6F6FC' }]}>
                  <Ionicons name="create-outline" size={22} color="#0094D4" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Update Changes</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Update licenses, beds & phone</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#0094D4' }]}>Update Changes</Text>
                <Ionicons name="arrow-forward" size={12} color="#0094D4" />
              </View>
            </Pressable>
          </View>

          {/* Hospital Administration Info */}
          <Card style={styles.summaryCard} padding="md">
            <View style={styles.summaryHeaderRow}>
              <View style={[styles.summaryHeaderIconWrap, { backgroundColor: '#E6F6FC' }]}>
                <Ionicons name="business" size={16} color="#0094D4" />
              </View>
              <Text style={styles.summaryCardHeading}>Administration & Registered Premises</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Superintendent</Text>
              <Text style={styles.summaryValue}>{superintendentName} ({superintendentRegNo})</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Admin Contact</Text>
              <Text style={styles.summaryValue}>
                {selectedPhoneOption
                  ? `${PHONE_LINE_OPTIONS.find((o) => o.id === selectedPhoneOption)?.prefix} ${adminPhone}`
                  : adminPhone || 'Not specified'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Emergency Desk</Text>
              <Text style={styles.summaryValue}>{emergencyHotline}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Campus Address</Text>
              <Text style={styles.summaryValue}>{campusAddress}, {city}, {stateName} - {pincode}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Settlement Bank</Text>
              <Text style={styles.summaryValue}>{bankName} ••••{accountNumber.slice(-4)} ({ifscCode})</Text>
            </View>
          </Card>
        </ScrollView>
      </ContainerComponent>
    );
  }

  // Active Step Registration Form
  return (
    <ContainerComponent {...(containerProps as any)}>
      {/* Top Clinical Header */}
      {!embedded && (
        <View style={styles.topHeader}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              if (currentStep > 1) {
                handlePrevStep();
              } else if (isHospRegistered) {
                setIsRegistered(true);
              } else {
                navigation.navigate('Main', { screen: 'Home' } as any);
              }
            }}
            accessibilityLabel={currentStep > 1 ? `Back to Step ${currentStep - 1}` : (isHospRegistered ? 'Back to Dashboard' : 'Back to Live Operations')}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="business" size={17} color="#0094D4" />
              <Text style={styles.headerTitle}>
                {isHospRegistered ? 'Update Hospital Details' : 'Hospital Registration'}
              </Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {isHospRegistered
                ? `Update Step ${currentStep} of 5: ${STEPS[currentStep - 1]?.title}`
                : `Step ${currentStep} of 5: ${STEPS[currentStep - 1]?.title}`}
            </Text>
          </View>

          <View style={styles.stepBadgePill}>
            <Text style={styles.stepBadgeText}>
              {isHospRegistered ? `Update ${currentStep}/5` : `Step ${currentStep}/5`}
            </Text>
          </View>
        </View>
      )}

      {/* Step Progress Tracker with Ticks / Checkmarks */}
      <View style={styles.progressTrackerContainer}>
        <View style={styles.trackerRow}>
          {STEPS.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isPending = step.id > currentStep;

            return (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <View
                    style={[
                      styles.trackerLine,
                      isCompleted ? styles.trackerLineCompleted : styles.trackerLinePending,
                    ]}
                  />
                )}
                <View style={styles.stepItemWrap}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      isCurrent && styles.stepCircleCurrent,
                      isPending && styles.stepCirclePending,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumberText,
                          isCurrent && styles.stepNumberTextCurrent,
                          isPending && styles.stepNumberTextPending,
                        ]}
                      >
                        {step.id}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCompleted && styles.stepLabelCompleted,
                      isCurrent && styles.stepLabelCurrent,
                      isPending && styles.stepLabelPending,
                    ]}
                    numberOfLines={1}
                  >
                    {step.title}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Keyboard-aware scrollable form */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* STEP 1: IDENTITY & BEDS */}
          {currentStep === 1 && (
            <>
              {/* Professional Medical Theme Hospital Banner */}
              <Card style={styles.themeBannerCard} padding="lg">
                <View style={styles.bannerRow}>
                  <View style={styles.themeBannerIconBadge}>
                    <Ionicons name="business" size={26} color="#0094D4" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.themeBannerTitle}>Hospital Provider Portal</Text>
                    <Text style={styles.themeBannerSubtitle}>
                      Register inpatient facilities, emergency triage, ICU infrastructure & clinical departments.
                    </Text>
                  </View>
                </View>
              </Card>

              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#0094D4" />
                <Text style={styles.sectionTitle}>1. Hospital Identity & Bed Capacity</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>Official Hospital / Healthcare Center Name *</Text>
                <TextInput
                  style={[styles.textInput, errors.hospitalName && styles.inputError]}
                  value={hospitalName}
                  onChangeText={(val) => {
                    setHospitalName(val);
                    clearError('hospitalName');
                  }}
                  placeholder="Enter official hospital name"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.hospitalName ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.hospitalName}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Hospital Classification *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {HOSPITAL_TYPES.map((type) => {
                    const active = hospitalType === type;
                    return (
                      <Pressable
                        key={type}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setHospitalType(type)}
                      >
                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Bed Capacities */}
                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Total Beds *</Text>
                    <TextInput
                      style={[styles.textInput, errors.totalBeds && styles.inputError]}
                      value={totalBeds}
                      onChangeText={(val) => {
                        setTotalBeds(val);
                        clearError('totalBeds');
                      }}
                      keyboardType="number-pad"
                      placeholder="Enter total beds"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.totalBeds ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.totalBeds}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, marginHorizontal: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>ICU Beds</Text>
                    <TextInput
                      style={styles.textInput}
                      value={icuBeds}
                      onChangeText={setIcuBeds}
                      keyboardType="number-pad"
                      placeholder="Enter ICU beds"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Theatres (OT)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={operationTheatres}
                      onChangeText={setOperationTheatres}
                      keyboardType="number-pad"
                      placeholder="Enter operation theatres"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Emergency & Facilities Toggles */}
                <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>
                  Hospital Amenities & Emergency Desk
                </Text>
                <View style={styles.facilityToggleGrid}>
                  <View style={styles.facilityToggleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleItemTitle}>24/7 Emergency & Casualty</Text>
                      <Text style={styles.toggleItemSub}>Resuscitation & trauma triage</Text>
                    </View>
                    <Switch
                      value={hasEmergency24x7}
                      onValueChange={setHasEmergency24x7}
                      trackColor={{ false: '#CBD5E1', true: '#BAE6F9' }}
                      thumbColor={hasEmergency24x7 ? '#0094D4' : '#FFFFFF'}
                    />
                  </View>

                  <View style={styles.facilityToggleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleItemTitle}>In-House Blood Bank</Text>
                      <Text style={styles.toggleItemSub}>Whole blood & PRBC storage</Text>
                    </View>
                    <Switch
                      value={hasBloodBank}
                      onValueChange={setHasBloodBank}
                      trackColor={{ false: '#CBD5E1', true: '#BAE6F9' }}
                      thumbColor={hasBloodBank ? '#0094D4' : '#FFFFFF'}
                    />
                  </View>

                  <View style={styles.facilityToggleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleItemTitle}>Radiology & CT/MRI</Text>
                      <Text style={styles.toggleItemSub}>In-campus imaging diagnostics</Text>
                    </View>
                    <Switch
                      value={hasRadiology}
                      onValueChange={setHasRadiology}
                      trackColor={{ false: '#CBD5E1', true: '#BAE6F9' }}
                      thumbColor={hasRadiology ? '#0094D4' : '#FFFFFF'}
                    />
                  </View>

                  <View style={styles.facilityToggleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleItemTitle}>Ambulance Life Support</Text>
                      <Text style={styles.toggleItemSub}>ALS mobile ambulance fleet</Text>
                    </View>
                    <Switch
                      value={hasAmbulanceFleet}
                      onValueChange={setHasAmbulanceFleet}
                      trackColor={{ false: '#CBD5E1', true: '#BAE6F9' }}
                      thumbColor={hasAmbulanceFleet ? '#0094D4' : '#FFFFFF'}
                    />
                  </View>
                </View>

                {/* Clinical Departments Selection */}
                <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                  Enrolled Clinical Departments ({selectedDepts.length} Selected)
                </Text>
                <View style={styles.chipsWrap}>
                  {DEPARTMENTS.map((dept) => {
                    const selected = selectedDepts.includes(dept);
                    return (
                      <Pressable
                        key={dept}
                        style={[styles.deptChip, selected && styles.deptChipSelected]}
                        onPress={() => toggleDept(dept)}
                      >
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'add-circle-outline'}
                          size={14}
                          color={selected ? '#0094D4' : colors.textMuted}
                        />
                        <Text style={[styles.deptChipText, selected && styles.deptChipTextSelected]}>
                          {dept}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              {/* Step 1 Actions */}
              <Pressable
                style={styles.primaryStepBtn}
                onPress={handleNextStep}
                accessibilityLabel="Next"
              >
                <Text style={styles.primaryStepBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </>
          )}

          {/* STEP 2: REGULATORY LICENSES & ACCREDITATIONS */}
          {currentStep === 2 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={18} color="#0094D4" />
                <Text style={styles.sectionTitle}>2. Regulatory Licenses & Accreditations</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>
                  Clinical Establishments Act (CEA) Registration No. *
                </Text>
                <TextInput
                  style={[styles.textInput, errors.ceaLicenseNumber && styles.inputError]}
                  value={ceaLicenseNumber}
                  onChangeText={(val) => {
                    setCeaLicenseNumber(val);
                    clearError('ceaLicenseNumber');
                  }}
                  placeholder="Enter CEA registration number"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.ceaLicenseNumber ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.ceaLicenseNumber}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Quality Accreditation Level *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {ACCREDITATION_LEVELS.map((acc) => {
                    const active = accreditation === acc;
                    return (
                      <Pressable
                        key={acc}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setAccreditation(acc)}
                      >
                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                          {acc}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={styles.inputLabel}>Bio-Medical Waste (BMW) Authorization No.</Text>
                <TextInput
                  style={styles.textInput}
                  value={bmwAuthNumber}
                  onChangeText={setBmwAuthNumber}
                  placeholder="Enter BMW authorization number"
                  placeholderTextColor={colors.textMuted}
                />

                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle" size={18} color="#0284C7" />
                  <Text style={styles.infoBannerText}>
                    CEA License numbers are cross-verified with state directorates of medical health before full patient discovery activation.
                  </Text>
                </View>
              </Card>

              {/* Step 2 Actions */}
              <View style={styles.stepBtnRow}>
                <Pressable
                  style={styles.secondaryStepBtn}
                  onPress={handlePrevStep}
                  accessibilityLabel="Back to Step 1"
                >
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
                  <Text style={styles.secondaryStepBtnText}>Back</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryStepBtn, { flex: 1, marginTop: 0 }]}
                  onPress={handleNextStep}
                  accessibilityLabel="Next"
                >
                  <Text style={styles.primaryStepBtnText}>Next</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </>
          )}

          {/* STEP 3: PREMISES & ADMINISTRATION */}
          {currentStep === 3 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="call" size={18} color="#0094D4" />
                <Text style={styles.sectionTitle}>3. Administrative Phone & Premises</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>Medical Superintendent / Director Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={superintendentName}
                  onChangeText={setSuperintendentName}
                  placeholder="Enter medical superintendent name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.inputLabel}>Superintendent Council Reg No.</Text>
                <TextInput
                  style={styles.textInput}
                  value={superintendentRegNo}
                  onChangeText={setSuperintendentRegNo}
                  placeholder="Enter council registration number"
                  placeholderTextColor={colors.textMuted}
                />

                {/* Phone Selection Requirement: NO DEFAULT PRESELECTION - user selects manually */}
                <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>
                  Administrative Contact Option (Select One Manually) *
                </Text>
                <View style={styles.phoneOptionGrid}>
                  {PHONE_LINE_OPTIONS.map((opt) => {
                    const isSelected = selectedPhoneOption === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        style={[
                          styles.phoneOptionChip,
                          isSelected && styles.phoneOptionChipSelected,
                        ]}
                        onPress={() => {
                          setSelectedPhoneOption(opt.id);
                          setAdminPhone((prev) => prev.slice(0, opt.maxDigits));
                          clearError('selectedPhoneOption');
                          clearError('adminPhone');
                        }}
                        accessibilityLabel={`Select ${opt.label}`}
                      >
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={15}
                          color={isSelected ? '#0094D4' : colors.textMuted}
                        />
                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text
                            style={[
                              styles.phoneOptionLabel,
                              isSelected && styles.phoneOptionLabelSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          <Text style={styles.phoneOptionPrefix}>Prefix: {opt.prefix}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.selectedPhoneOption ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.selectedPhoneOption}</Text>
                  </View>
                ) : null}

                {/* Phone input with active selected prefix */}
                <Text style={styles.inputLabel}>
                  {selectedPhoneOption
                    ? `Enter ${PHONE_LINE_OPTIONS.find((o) => o.id === selectedPhoneOption)?.label} *`
                    : 'Select Phone Option Above First *'}
                </Text>
                {(() => {
                  const activePhoneOption = PHONE_LINE_OPTIONS.find((o) => o.id === selectedPhoneOption);
                  const phoneMaxDigits = activePhoneOption?.maxDigits || 10;
                  return (
                    <View style={styles.phoneInputWrap}>
                      <View style={styles.prefixBox}>
                        <Text style={styles.prefixText}>
                          {activePhoneOption ? activePhoneOption.prefix : '--'}
                        </Text>
                      </View>
                      <TextInput
                        style={[styles.textInput, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }, errors.adminPhone && styles.inputError]}
                        value={adminPhone}
                        onChangeText={(val) => {
                          const digits = val.replace(/\D/g, '').slice(0, phoneMaxDigits);
                          setAdminPhone(digits);
                          clearError('adminPhone');
                        }}
                        keyboardType="phone-pad"
                        maxLength={phoneMaxDigits}
                        placeholder={
                          selectedPhoneOption
                            ? activePhoneOption?.placeholder
                            : 'Tap a phone option above first'
                        }
                        placeholderTextColor={colors.textMuted}
                        editable={Boolean(selectedPhoneOption)}
                      />
                    </View>
                  );
                })()}
                {errors.adminPhone ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.adminPhone}</Text>
                  </View>
                ) : null}

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Emergency Hotline</Text>
                    <TextInput
                      style={styles.textInput}
                      value={emergencyHotline}
                      onChangeText={(val) => setEmergencyHotline(val.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="Enter 10-digit emergency hotline"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Official Email *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={hospitalEmail}
                      onChangeText={setHospitalEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Enter official email address"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Campus Address / Street *</Text>
                <TextInput
                  style={[styles.textInput, errors.campusAddress && styles.inputError]}
                  value={campusAddress}
                  onChangeText={(val) => {
                    setCampusAddress(val);
                    clearError('campusAddress');
                  }}
                  placeholder="Enter campus address and street"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.campusAddress ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.campusAddress}</Text>
                  </View>
                ) : null}

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>City *</Text>
                    <TextInput
                      style={[styles.textInput, errors.city && styles.inputError]}
                      value={city}
                      onChangeText={(val) => {
                        setCity(val);
                        clearError('city');
                      }}
                      placeholder="Enter city"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.city ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.city}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, marginHorizontal: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>State</Text>
                    <TextInput
                      style={styles.textInput}
                      value={stateName}
                      onChangeText={setStateName}
                      placeholder="Enter state"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Pincode</Text>
                    <TextInput
                      style={styles.textInput}
                      value={pincode}
                      onChangeText={setPincode}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="Enter 6-digit PIN code"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </Card>

              {/* Step 3 Actions */}
              <View style={styles.stepBtnRow}>
                <Pressable
                  style={styles.secondaryStepBtn}
                  onPress={handlePrevStep}
                  accessibilityLabel="Back to Step 2"
                >
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
                  <Text style={styles.secondaryStepBtnText}>Back</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryStepBtn, { flex: 1, marginTop: 0 }]}
                  onPress={handleNextStep}
                  accessibilityLabel="Next"
                >
                  <Text style={styles.primaryStepBtnText}>Next</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </>
          )}

          {/* STEP 4: REGULATORY DOCUMENT UPLOADS */}
          {currentStep === 4 && (
            <>
              {/* Back Button Returning to Previous Registration Step without losing info */}
              <View style={styles.docBackHeader}>
                <Pressable
                  style={styles.docBackBtn}
                  onPress={handlePrevStep}
                  accessibilityLabel="Back to Step 3: Premises & Admin"
                >
                  <Ionicons name="arrow-back" size={18} color="#0094D4" />
                  <Text style={styles.docBackBtnText}>Back to Step 3: Premises & Admin</Text>
                </Pressable>
              </View>

              <View style={styles.sectionHeader}>
                <Ionicons name="cloud-upload" size={18} color="#0094D4" />
                <Text style={styles.sectionTitle}>4. Regulatory Document Verification</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.uploadSectionTitle}>
                  Clinical Establishment Act (CEA) License Certificate *
                </Text>
                <View style={styles.docUploadBox}>
                  <View style={styles.docUploadIconCircle}>
                    <Ionicons name="document-attach" size={22} color="#0094D4" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.docUploadTitle}>CEA Registration PDF</Text>
                    <Text style={styles.docUploadFilename}>{uploadedCeaDoc}</Text>
                    <View style={styles.verifiedDocPill}>
                      <Ionicons name="checkmark-circle" size={11} color="#15803D" />
                      <Text style={styles.verifiedDocPillText}>Ready for Submission</Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.uploadBtn}
                    onPress={async () => {
                      const file = await pickDocumentOrImage();
                      if (file) {
                        setUploadedCeaDoc(file.name);
                        clearError('uploadedCeaDoc');
                      }
                    }}
                  >
                    <Text style={styles.uploadBtnText}>Replace</Text>
                  </Pressable>
                </View>
                {errors.uploadedCeaDoc ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.uploadedCeaDoc}</Text>
                  </View>
                ) : null}

                <Text style={[styles.uploadSectionTitle, { marginTop: spacing.md }]}>
                  Bio-Medical Waste Authorization Document
                </Text>
                <View style={styles.docUploadBox}>
                  <View style={[styles.docUploadIconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="shield-checkmark" size={22} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.docUploadTitle}>BMW Clearance PDF</Text>
                    <Text style={styles.docUploadFilename}>{uploadedBmwDoc}</Text>
                    <View style={[styles.verifiedDocPill, { backgroundColor: '#E0F2FE' }]}>
                      <Ionicons name="checkmark-circle" size={11} color="#0284C7" />
                      <Text style={[styles.verifiedDocPillText, { color: '#0369A1' }]}>
                        File Attached
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.uploadBtn}
                    onPress={async () => {
                      const file = await pickDocumentOrImage();
                      if (file) {
                        setUploadedBmwDoc(file.name);
                      }
                    }}
                  >
                    <Text style={styles.uploadBtnText}>Replace</Text>
                  </Pressable>
                </View>
              </Card>

              {/* Step 4 Navigation with Dedicated Back Button */}
              <View style={styles.stepBtnRow}>
                <Pressable
                  style={styles.secondaryStepBtn}
                  onPress={handlePrevStep}
                  accessibilityLabel="Back to Step 3"
                >
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
                  <Text style={styles.secondaryStepBtnText}>Back</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryStepBtn, { flex: 1, marginTop: 0 }]}
                  onPress={handleNextStep}
                  accessibilityLabel="Next"
                >
                  <Text style={styles.primaryStepBtnText}>Next</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </>
          )}

          {/* STEP 5: BANK SETTLEMENT & LEGAL DECLARATION */}
          {currentStep === 5 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="card" size={18} color="#0094D4" />
                <Text style={styles.sectionTitle}>5. Revenue Payout & Legal Compliance</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>Designated Bank Name *</Text>
                <TextInput
                  style={[styles.textInput, errors.bankName && styles.inputError]}
                  value={bankName}
                  onChangeText={(val) => {
                    setBankName(val);
                    clearError('bankName');
                  }}
                  placeholder="Enter bank name"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.bankName ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.bankName}</Text>
                  </View>
                ) : null}

                <View style={styles.inputRow}>
                  <View style={{ flex: 1.4, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Account Number *</Text>
                    <TextInput
                      style={[styles.textInput, errors.accountNumber && styles.inputError]}
                      value={accountNumber}
                      onChangeText={(val) => {
                        setAccountNumber(val);
                        clearError('accountNumber');
                      }}
                      keyboardType="number-pad"
                      placeholder="Enter account number"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.accountNumber ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.accountNumber}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>IFSC Code *</Text>
                    <TextInput
                      style={[styles.textInput, errors.ifscCode && styles.inputError]}
                      value={ifscCode}
                      onChangeText={(val) => {
                        setIfscCode(val);
                        clearError('ifscCode');
                      }}
                      autoCapitalize="characters"
                      placeholder="Enter IFSC code"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.ifscCode ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.ifscCode}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Text style={styles.inputLabel}>Direct Hospital UPI ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  placeholder="Enter hospital UPI ID"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              {/* Legal Declaration */}
              <Card style={styles.declarationCard} padding="md">
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => {
                    setIsDeclared(!isDeclared);
                    clearError('declaration');
                  }}
                  accessibilityLabel="Agree to Clinical Establishment Terms"
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      isDeclared && {
                        backgroundColor: '#0094D4',
                        borderColor: '#0094D4',
                      },
                    ]}
                  >
                    {isDeclared && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.declarationText}>
                    I declare that all clinical licenses, bed strengths, ICU configurations, and establishment approvals submitted are authentic under the Clinical Establishments Act and State Health regulations.
                  </Text>
                </Pressable>
              </Card>
              {errors.declaration ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.declaration}</Text>
                </View>
              ) : null}

              {/* Final Step Actions */}
              <View style={styles.stepBtnRow}>
                <Pressable
                  style={styles.secondaryStepBtn}
                  onPress={handlePrevStep}
                  accessibilityLabel="Back to Step 4 Documents"
                >
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
                  <Text style={styles.secondaryStepBtnText}>Back</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryStepBtn, { flex: 1, marginTop: 0, backgroundColor: '#0094D4' }]}
                  onPress={handleRegisterHospital}
                  accessibilityLabel={isHospRegistered ? 'Update Hospital Changes' : 'Complete Hospital Registration'}
                >
                  <Ionicons name={isHospRegistered ? 'save-outline' : 'business'} size={18} color="#FFFFFF" />
                  <Text style={styles.primaryStepBtnText} numberOfLines={1}>
                    {isHospRegistered ? 'Update Changes' : 'Complete Registration'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 56,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
  },
  topHeaderEmbedded: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  stepBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: '#0094D4',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 0,
    alignSelf: 'center',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  progressTrackerContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackerLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  trackerLineCompleted: {
    backgroundColor: '#16A34A',
  },
  trackerLinePending: {
    backgroundColor: '#E2E8F0',
  },
  stepItemWrap: {
    alignItems: 'center',
    width: 58,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleCompleted: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  stepCircleCurrent: {
    backgroundColor: '#0094D4',
    borderColor: '#BAE6F9',
  },
  stepCirclePending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepNumberTextCurrent: {
    color: '#FFFFFF',
  },
  stepNumberTextPending: {
    color: '#64748B',
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#16A34A',
    fontWeight: '700',
  },
  stepLabelCurrent: {
    color: '#0094D4',
    fontWeight: '800',
  },
  stepLabelPending: {
    color: '#64748B',
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  themeBannerCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BAE6F9',
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeBannerIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F6FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  clinicalTag: {
    backgroundColor: '#0094D4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  clinicalTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  themeBannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: radius.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipScroll: {
    marginVertical: 4,
  },
  typeChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#0094D4',
    borderColor: '#0094D4',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  facilityToggleGrid: {
    gap: 8,
    marginTop: 4,
  },
  facilityToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  deptChipSelected: {
    backgroundColor: '#E6F6FC',
    borderColor: '#0094D4',
  },
  deptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  deptChipTextSelected: {
    color: '#0094D4',
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    padding: 10,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },
  phoneOptionGrid: {
    gap: 6,
    marginBottom: 6,
  },
  phoneOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 9,
    borderRadius: radius.md,
  },
  phoneOptionChipSelected: {
    backgroundColor: '#E6F6FC',
    borderColor: '#0094D4',
  },
  phoneOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  phoneOptionLabelSelected: {
    color: '#0094D4',
  },
  phoneOptionPrefix: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixBox: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#CBD5E1',
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0094D4',
  },
  docBackHeader: {
    marginBottom: spacing.xs,
  },
  docBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F6FC',
    borderColor: '#0094D4',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  docBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0094D4',
  },
  uploadSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  docUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  docUploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F6FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docUploadFilename: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedDocPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  verifiedDocPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  uploadBtn: {
    backgroundColor: '#0094D4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declarationCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  declarationText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  stepBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
  },
  primaryStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0094D4',
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  primaryStepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryStepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  secondaryStepBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  dashboardHeroCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BAE6F9',
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0094D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHospitalName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroHospitalType: {
    fontSize: 12,
    color: '#0094D4',
    fontWeight: '700',
    marginTop: 2,
  },
  heroAccreditationText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  onlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: 12,
  },
  onlineToggleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  onlineToggleSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  onlineToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  onlineToggleBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsGrid: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 105,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
    minHeight: 28,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  actionCard: {
    width: '48.5%',
    minHeight: 145,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  actionLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0094D4',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryHeaderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    width: 110,
    lineHeight: 18,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'left',
    lineHeight: 18,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
    backgroundColor: '#FEF2F2',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  heroUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E6F6FC',
    borderWidth: 1.5,
    borderColor: '#BAE6F9',
    borderRadius: radius.md,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  heroUpdateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0094D4',
  },
});
