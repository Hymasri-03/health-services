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

const PHARMACY_TYPES = [
  'Retail Medical Chemist',
  'Hospital-Attached Pharmacy',
  '24x7 Emergency Chemist',
  'Generic Medicine Dispensary',
  'Wellness & Surgical Store',
];

const PHARMACIST_DEGREES = [
  'B.Pharm (Bachelor of Pharmacy)',
  'D.Pharm (Diploma in Pharmacy)',
  'Pharm.D (Doctor of Pharmacy)',
  'M.Pharm (Master of Pharmacy)',
];

const STEPS = [
  { id: 1, title: 'Store Profile', icon: 'storefront' as const },
  { id: 2, title: 'Drug Licenses', icon: 'shield-checkmark' as const },
  { id: 3, title: 'Premises & Contact', icon: 'location' as const },
  { id: 4, title: 'Document Upload', icon: 'cloud-upload' as const },
  { id: 5, title: 'Bank & Legal', icon: 'checkmark-done-circle' as const },
];

interface PharmacyRegistrationProps {
  embedded?: boolean;
  onComplete?: () => void;
  onSwitchToDashboard?: () => void;
}

export default function PharmacyRegistrationScreen({
  embedded = false,
  onComplete,
  onSwitchToDashboard,
}: PharmacyRegistrationProps = {}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PharmacyRegistration'>>();
  const { provider, pharmacyProfile, isCategoryRegistered, registerProvider, switchProviderMode, toggleOnlineAvailability } = useApp();

  const isPharmRegistered = isCategoryRegistered('pharmacy');
  // Step Tracker state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isRegistered, setIsRegistered] = useState<boolean>(
    route?.params?.mode === 'edit' || route?.params?.mode === 'register' ? false : isPharmRegistered
  );

  useEffect(() => {
    if (route?.params?.mode === 'edit' || route?.params?.mode === 'register') {
      setIsRegistered(false);
    } else if (isPharmRegistered) {
      setIsRegistered(true);
    }
  }, [route?.params?.mode, isPharmRegistered]);

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

  const activePharm = pharmacyProfile || provider;

  // Step 1: Pharmacy Store Profile & Classification
  const [storeName, setStoreName] = useState(
    activePharm?.name || 'MedPlus Express Pharmacy & Surgical Hub'
  );
  const [pharmacyType, setPharmacyType] = useState(PHARMACY_TYPES[0]);
  const [operatingHours, setOperatingHours] = useState('08:00 AM - 11:00 PM');
  const [has24x7Service, setHas24x7Service] = useState(true);
  const [hasHomeDelivery, setHasHomeDelivery] = useState(true);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(String(activePharm?.serviceRadiusKm || 8));
  const [hasColdChain, setHasColdChain] = useState(true);
  const [hasRxVerificationDesk, setHasRxVerificationDesk] = useState(true);

  // Step 2: Drug Licenses & Registered Pharmacist
  const [form20License, setForm20License] = useState(
    activePharm?.licenseNumber ? activePharm.licenseNumber.split('/')[0].trim() : 'KA-BGL-DRUG-20-49182'
  );
  const [form21License, setForm21License] = useState(
    activePharm?.licenseNumber && activePharm.licenseNumber.includes('/')
      ? activePharm.licenseNumber.split('/')[1].trim()
      : 'KA-BGL-DRUG-21-49183'
  );
  const [licenseExpiry, setLicenseExpiry] = useState('2028-12-31');
  const [gstin, setGstin] = useState('29ABCDE1234F1Z5');
  const [pharmacistName, setPharmacistName] = useState('Pooja Kulkarni');
  const [pharmacistDegree, setPharmacistDegree] = useState(PHARMACIST_DEGREES[0]);
  const [pharmacistRegNo, setPharmacistRegNo] = useState('KSPC-2021-58291');

  // Step 3: Premises & Contact
  const [storePhone, setStorePhone] = useState(
    activePharm?.phone ? activePharm.phone.replace('+91 ', '') : '9876524680'
  );
  const [storeEmail, setStoreEmail] = useState(
    activePharm?.email || 'express@medpluspartner.com'
  );
  const [storeAddress, setStoreAddress] = useState(
    activePharm?.address || 'Shop 14, Ground Floor, Central Arcade, Koramangala 4th Block'
  );
  const [city, setCity] = useState(activePharm?.city || 'Bengaluru');
  const [stateName, setStateName] = useState(activePharm?.state || 'Karnataka');
  const [pincode, setPincode] = useState(activePharm?.pincode || '560034');

  // Step 4: Regulatory Document Uploads
  const [uploadedDrugDoc, setUploadedDrugDoc] = useState('Drug_License_Form_20_21.pdf');
  const [uploadedPharmDoc, setUploadedPharmDoc] = useState('Pharmacist_Council_Registration.pdf');

  // Step 5: Bank Settlement & Legal Declaration
  const [bankName, setBankName] = useState(activePharm?.bankDetails?.bankName || 'HDFC Bank');
  const [accountNumber, setAccountNumber] = useState(activePharm?.bankDetails?.accountNumber || '50200088921475');
  const [ifscCode, setIfscCode] = useState(activePharm?.bankDetails?.ifscCode || 'HDFC0001245');
  const [upiId, setUpiId] = useState(activePharm?.bankDetails?.upiId || 'medplus@hdfcbank');
  const [isDeclared, setIsDeclared] = useState(true);

  // Field inline error validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const newErrors: Record<string, string> = {};
      if (!storeName.trim()) {
        newErrors.storeName = 'Please enter pharmacy or chemist store name.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const newErrors: Record<string, string> = {};
      if (!form20License.trim()) {
        newErrors.form20License = 'Please enter Form 20 Drug Retail License number.';
      }
      if (!form21License.trim()) {
        newErrors.form21License = 'Please enter Form 21 Drug Retail License number.';
      }
      if (!pharmacistName.trim()) {
        newErrors.pharmacistName = 'Please enter registered pharmacist in-charge name.';
      }
      if (!pharmacistRegNo.trim()) {
        newErrors.pharmacistRegNo = 'Please enter State Pharmacy Council registration number.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const newErrors: Record<string, string> = {};
      const cleanPhone = storePhone.trim().replace(/\D/g, '');
      if (!storePhone.trim() || cleanPhone.length !== 10) {
        newErrors.storePhone = 'Please enter a valid 10-digit primary store mobile number.';
      }
      if (!storeAddress.trim()) {
        newErrors.storeAddress = 'Please enter physical store address.';
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
      if (!uploadedDrugDoc) {
        newErrors.uploadedDrugDoc = 'Please upload Drug License Form 20/21 PDF certificate.';
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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegisterPharmacy = () => {
    const newErrors: Record<string, string> = {};
    if (!bankName.trim()) {
      newErrors.bankName = 'Please enter payout bank name.';
    }
    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Please enter bank account number.';
    }
    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'Please enter IFSC code.';
    }
    if (!isDeclared) {
      newErrors.isDeclared = 'Please confirm adherence to Drugs & Cosmetics Act and dispensing standards.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    // Save provider into context
    registerProvider({
      type: 'pharmacy',
      name: storeName.trim(),
      phone: `+91 ${storePhone.trim()}`,
      email: storeEmail.trim(),
      address: storeAddress.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      licenseNumber: `${form20License.trim()} / ${form21License.trim()}`,
      licenseType: 'State Drugs Control Dept (Form 20 & 21)',
      licenseDocName: uploadedDrugDoc,
      serviceRadiusKm: parseInt(deliveryRadiusKm, 10) || 8,
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        accountName: storeName.trim(),
        upiId: upiId.trim(),
      },
    });

    switchProviderMode('pharmacy');
    setIsRegistered(true);
    Alert.alert(
      isPharmRegistered ? 'Changes Updated' : 'Registration Complete',
      isPharmRegistered
        ? 'Your pharmacy store details and delivery coverage have been updated successfully.'
        : 'Pharmacy registration completed successfully. Welcome to OneBuddy Medical!'
    );
    onComplete?.();
  };

  const ContainerComponent = embedded ? View : SafeAreaView;
  const containerProps = embedded ? { style: styles.safe } : { style: styles.safe, edges: ['top'] as const };

  // If already registered, render the Pharmacy Service Dashboard right here!
  if (isRegistered) {
    return (
      <ContainerComponent {...(containerProps as any)}>
        {/* Pharmacy Dashboard Header */}
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
              <Ionicons name="flask" size={16} color="#0D9488" />
              <Text style={[styles.headerTitle, embedded && { color: '#0F172A' }]} numberOfLines={1}>
                {storeName}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, embedded && { color: '#64748B' }]} numberOfLines={1}>
              Registered Pharmacy • Form 20/21: {form20License}
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
          {/* Active Pharmacy Hero Card */}
          <Card style={styles.dashboardHeroCard} padding="lg">
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="flask" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.heroStoreName} numberOfLines={1}>{storeName}</Text>
                <View style={styles.pharmacyTag}>
                  <Text style={styles.pharmacyTagText}>{pharmacyType}</Text>
                </View>
                <Text style={styles.heroSubText}>
                  Pharmacist: {pharmacistName} ({pharmacistRegNo})
                </Text>
                <Text style={styles.heroLicenseText}>Licensed Drug Retailer (Form 20/21)</Text>
              </View>
            </View>

            {/* Fully Accessible Online / Offline Toggle Button (Silent: No Notification Alert) */}
            <View style={styles.onlineToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.onlineToggleTitle}>Prescription Delivery Status</Text>
                <Text style={styles.onlineToggleSub}>
                  {provider.isOnline
                    ? 'Online: Accepting customer medicine orders & e-prescriptions'
                    : 'Offline: Order dispatch temporarily paused'}
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
                accessibilityLabel={`Pharmacy is ${provider.isOnline ? 'Online' : 'Offline'}. Tap to toggle.`}
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
              accessibilityLabel="Update Pharmacy Changes"
            >
              <Ionicons name="create-outline" size={16} color="#0D9488" />
              <Text style={styles.heroUpdateBtnText}>Update Store Details & License</Text>
            </Pressable>
          </Card>

          {/* Operational Metrics */}
          <View style={[styles.sectionHeader, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
            <Ionicons name="bicycle-outline" size={17} color="#0D9488" />
            <Text style={styles.sectionTitle}>Delivery Operations & Compliance</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#F0FDFA' }]}>
                  <Ionicons name="map" size={19} color="#0D9488" />
                </View>
                <Text style={styles.statNumber}>{deliveryRadiusKm} km</Text>
                <Text style={styles.statLabel}>Delivery Radius</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="snow" size={19} color="#0284C7" />
                </View>
                <Text style={styles.statNumber}>{hasColdChain ? 'Yes' : 'No'}</Text>
                <Text style={styles.statLabel}>Cold Chain 2-8°C</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time" size={19} color="#D97706" />
                </View>
                <Text style={styles.statNumber}>{has24x7Service ? '24/7' : 'Standard'}</Text>
                <Text style={styles.statLabel}>Store Hours</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="document-text" size={19} color="#16A34A" />
                </View>
                <Text style={styles.statNumber}>Form 20/21</Text>
                <Text style={styles.statLabel}>Drug License</Text>
              </View>
            </View>
          </View>

          {/* Pharmacy Management Actions */}
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={17} color="#0D9488" />
            <Text style={styles.sectionTitle}>Pharmacy Operations Modules</Text>
          </View>

          <View style={styles.actionGrid}>
            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate('PharmacyInventory')}
              accessibilityLabel="Manage Pharmacy Inventory"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#CCFBF1' }]}>
                  <Ionicons name="medkit" size={22} color="#0D9488" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Inventory Stock</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Manage medicines, prices & batches</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={styles.actionLinkText}>Open Catalog</Text>
                <Ionicons name="arrow-forward" size={12} color="#0D9488" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
              accessibilityLabel="View Customer Orders"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="receipt" size={22} color="#0284C7" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Customer Orders</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Incoming prescription orders</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#0284C7' }]}>Open Orders</Text>
                <Ionicons name="arrow-forward" size={12} color="#0284C7" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => {
                switchProviderMode('pharmacy');
                navigation.navigate('Main', { screen: 'Home' } as any);
              }}
              accessibilityLabel="Enter Live Operations Hub"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#F0FDFA' }]}>
                  <Ionicons name="pulse" size={22} color="#0D9488" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Live Operations Hub</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Live prescription dispatch</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#0D9488' }]}>Enter Live Ops</Text>
                <Ionicons name="arrow-forward" size={12} color="#0D9488" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => setIsRegistered(false)}
              accessibilityLabel="Update Pharmacy Store Setup"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#F0FDFA' }]}>
                  <Ionicons name="create-outline" size={22} color="#0D9488" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Update Changes</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Update licenses, pharmacist & address</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#0D9488' }]}>Update Changes</Text>
                <Ionicons name="arrow-forward" size={12} color="#0D9488" />
              </View>
            </Pressable>
          </View>

          {/* Store & Settlement Summary */}
          <Card style={styles.summaryCard} padding="md">
            <View style={styles.summaryHeaderRow}>
              <View style={[styles.summaryHeaderIconWrap, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="business" size={16} color="#0D9488" />
              </View>
              <Text style={styles.summaryCardHeading}>Store Location & Bank Settlement</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Store Address</Text>
              <Text style={styles.summaryValue}>{storeAddress}, {city}, {stateName} - {pincode}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Store Mobile</Text>
              <Text style={styles.summaryValue}>+91 {storePhone}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GSTIN / PAN</Text>
              <Text style={styles.summaryValue}>{gstin}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pharmacist</Text>
              <Text style={styles.summaryValue}>{pharmacistName} ({pharmacistDegree})</Text>
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
      {/* Top Header */}
      {!embedded && (
        <View style={styles.topHeader}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              if (currentStep > 1) {
                handlePrevStep();
              } else if (isPharmRegistered) {
                setIsRegistered(true);
              } else {
                navigation.navigate('Main', { screen: 'Home' } as any);
              }
            }}
            accessibilityLabel={currentStep > 1 ? `Back to Step ${currentStep - 1}` : (isPharmRegistered ? 'Back to Dashboard' : 'Back to Live Operations')}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="flask" size={17} color="#2DD4BF" />
              <Text style={styles.headerTitle}>
                {isPharmRegistered ? 'Update Pharmacy Details' : 'Pharmacy Registration'}
              </Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {isPharmRegistered
                ? `Update Step ${currentStep} of 5: ${STEPS[currentStep - 1]?.title}`
                : `Step ${currentStep} of 5: ${STEPS[currentStep - 1]?.title}`}
            </Text>
          </View>

          <View style={styles.stepBadgePill}>
            <Text style={styles.stepBadgeText}>
              {isPharmRegistered ? `Update ${currentStep}/5` : `Step ${currentStep}/5`}
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

      {/* Keyboard-aware scrollable registration form */}
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
          {/* STEP 1: PHARMACY STORE PROFILE */}
          {currentStep === 1 && (
            <>
              {/* Pharmacy Hero Banner */}
              <Card style={styles.bannerCard} padding="lg">
                <View style={styles.bannerRow}>
                  <View style={styles.bannerIconBadge}>
                    <Ionicons name="flask" size={26} color="#0D9488" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.bannerTitle}>Pharmacy Retail Portal</Text>
                    <Text style={styles.bannerSubtitle}>
                      Register your licensed retail chemist, upload Form 20/21 approvals, and configure home delivery dispatch.
                    </Text>
                  </View>
                </View>
              </Card>

              <View style={styles.sectionHeader}>
                <Ionicons name="storefront" size={18} color="#0D9488" />
                <Text style={styles.sectionTitle}>1. Pharmacy Store Profile & Classification</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>Pharmacy / Retail Chemist Name *</Text>
                <TextInput
                  style={[styles.textInput, errors.storeName && styles.inputError]}
                  value={storeName}
                  onChangeText={(val) => {
                    setStoreName(val);
                    clearError('storeName');
                  }}
                  placeholder="Enter pharmacy name"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.storeName ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.storeName}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Pharmacy Classification *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {PHARMACY_TYPES.map((type) => {
                    const active = pharmacyType === type;
                    return (
                      <Pressable
                        key={type}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setPharmacyType(type)}
                      >
                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.inputRow}>
                  <View style={{ flex: 1.5, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Operating Hours *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={operatingHours}
                      onChangeText={setOperatingHours}
                      placeholder="Enter operating hours"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Delivery Radius</Text>
                    <TextInput
                      style={styles.textInput}
                      value={deliveryRadiusKm}
                      onChangeText={setDeliveryRadiusKm}
                      keyboardType="number-pad"
                      placeholder="Enter delivery radius in km"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Facilities Toggles */}
                <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>
                  Storage & Delivery Facilities
                </Text>
                <View style={styles.facilityToggleGrid}>
                  <View style={styles.facilityToggleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleItemTitle}>24x7 Emergency Service</Text>
                      <Text style={styles.toggleItemSub}>Night dispensary window active</Text>
                    </View>
                    <Switch
                      value={has24x7Service}
                      onValueChange={setHas24x7Service}
                      trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                      thumbColor={has24x7Service ? '#0D9488' : '#FFFFFF'}
                    />
                  </View>

                  <View style={styles.facilityToggleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleItemTitle}>Home Delivery Service</Text>
                      <Text style={styles.toggleItemSub}>Fast doorstep courier delivery</Text>
                    </View>
                    <Switch
                      value={hasHomeDelivery}
                      onValueChange={setHasHomeDelivery}
                      trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                      thumbColor={hasHomeDelivery ? '#0D9488' : '#FFFFFF'}
                    />
                  </View>

                  <View style={styles.facilityToggleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleItemTitle}>Cold Chain Refrigerator (2°C - 8°C)</Text>
                      <Text style={styles.toggleItemSub}>For Insulin, Vaccines & Biologics</Text>
                    </View>
                    <Switch
                      value={hasColdChain}
                      onValueChange={setHasColdChain}
                      trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                      thumbColor={hasColdChain ? '#0D9488' : '#FFFFFF'}
                    />
                  </View>
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

          {/* STEP 2: DRUG LICENSES & PHARMACIST */}
          {currentStep === 2 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#0D9488" />
                <Text style={styles.sectionTitle}>2. Drug Licenses & Registered Pharmacist</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>
                  Drug License Form 20 (General Retail) No. *
                </Text>
                <TextInput
                  style={[styles.textInput, errors.form20License && styles.inputError]}
                  value={form20License}
                  onChangeText={(val) => {
                    setForm20License(val);
                    clearError('form20License');
                  }}
                  placeholder="Enter Form 20 license number"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.form20License ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.form20License}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>
                  Drug License Form 21 (Biologicals & Specified) No. *
                </Text>
                <TextInput
                  style={[styles.textInput, errors.form21License && styles.inputError]}
                  value={form21License}
                  onChangeText={(val) => {
                    setForm21License(val);
                    clearError('form21License');
                  }}
                  placeholder="Enter Form 21 license number"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.form21License ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.form21License}</Text>
                  </View>
                ) : null}

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>License Expiry Date</Text>
                    <TextInput
                      style={styles.textInput}
                      value={licenseExpiry}
                      onChangeText={setLicenseExpiry}
                      placeholder="Enter license expiry date"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>GSTIN Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={gstin}
                      onChangeText={setGstin}
                      autoCapitalize="characters"
                      placeholder="Enter GSTIN number"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Pharmacist in-charge details */}
                <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                  Registered Pharmacist In-Charge Name *
                </Text>
                <TextInput
                  style={[styles.textInput, errors.pharmacistName && styles.inputError]}
                  value={pharmacistName}
                  onChangeText={(val) => {
                    setPharmacistName(val);
                    clearError('pharmacistName');
                  }}
                  placeholder="Enter pharmacist name"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.pharmacistName ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.pharmacistName}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Pharmacist Qualification Degree *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {PHARMACIST_DEGREES.map((deg) => {
                    const active = pharmacistDegree === deg;
                    return (
                      <Pressable
                        key={deg}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setPharmacistDegree(deg)}
                      >
                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                          {deg}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={styles.inputLabel}>State Pharmacy Council Registration No. *</Text>
                <TextInput
                  style={[styles.textInput, errors.pharmacistRegNo && styles.inputError]}
                  value={pharmacistRegNo}
                  onChangeText={(val) => {
                    setPharmacistRegNo(val);
                    clearError('pharmacistRegNo');
                  }}
                  placeholder="Enter council registration number"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.pharmacistRegNo ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.pharmacistRegNo}</Text>
                  </View>
                ) : null}
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

          {/* STEP 3: PREMISES & CONTACT */}
          {currentStep === 3 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={18} color="#0D9488" />
                <Text style={styles.sectionTitle}>3. Physical Premises & Store Contacts</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Store Contact Mobile *</Text>
                    <TextInput
                      style={[styles.textInput, errors.storePhone && styles.inputError]}
                      value={storePhone}
                      onChangeText={(val) => {
                        const digits = val.replace(/\D/g, '').slice(0, 10);
                        setStorePhone(digits);
                        clearError('storePhone');
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.storePhone ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.storePhone}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Official Store Email *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={storeEmail}
                      onChangeText={setStoreEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Enter official store email"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Physical Store Address *</Text>
                <TextInput
                  style={[styles.textInput, errors.storeAddress && styles.inputError]}
                  value={storeAddress}
                  onChangeText={(val) => {
                    setStoreAddress(val);
                    clearError('storeAddress');
                  }}
                  placeholder="Enter physical store address"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.storeAddress ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.storeAddress}</Text>
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
                  accessibilityLabel="Back to Step 3: Premises & Contact"
                >
                  <Ionicons name="arrow-back" size={18} color="#0D9488" />
                  <Text style={styles.docBackBtnText}>Back to Step 3: Premises & Contact</Text>
                </Pressable>
              </View>

              <View style={styles.sectionHeader}>
                <Ionicons name="cloud-upload" size={18} color="#0D9488" />
                <Text style={styles.sectionTitle}>4. Regulatory Drug License Verification</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.uploadSectionTitle}>
                  Form 20 & 21 Drug Retail License Certificate *
                </Text>
                <View style={[styles.docUploadBox, errors.uploadedDrugDoc && styles.inputError]}>
                  <View style={styles.docUploadIconCircle}>
                    <Ionicons name="document-attach" size={22} color="#0D9488" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.docUploadTitle}>Form 20/21 License PDF</Text>
                    <Text style={styles.docUploadFilename}>{uploadedDrugDoc}</Text>
                    <View style={styles.verifiedDocPill}>
                      <Ionicons name="checkmark-circle" size={11} color="#15803D" />
                      <Text style={styles.verifiedDocPillText}>Ready for Verification</Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.uploadBtn}
                    onPress={async () => {
                      const file = await pickDocumentOrImage();
                      if (file) {
                        setUploadedDrugDoc(file.name);
                        clearError('uploadedDrugDoc');
                      }
                    }}
                  >
                    <Text style={styles.uploadBtnText}>Replace</Text>
                  </Pressable>
                </View>
                {errors.uploadedDrugDoc ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.uploadedDrugDoc}</Text>
                  </View>
                ) : null}

                <Text style={[styles.uploadSectionTitle, { marginTop: spacing.md }]}>
                  Registered Pharmacist Certificate
                </Text>
                <View style={styles.docUploadBox}>
                  <View style={[styles.docUploadIconCircle, { backgroundColor: '#CCFBF1' }]}>
                    <Ionicons name="ribbon" size={22} color="#0D9488" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.docUploadTitle}>Pharmacist Reg PDF</Text>
                    <Text style={styles.docUploadFilename}>{uploadedPharmDoc}</Text>
                    <View style={[styles.verifiedDocPill, { backgroundColor: '#CCFBF1' }]}>
                      <Ionicons name="checkmark-circle" size={11} color="#0F766E" />
                      <Text style={[styles.verifiedDocPillText, { color: '#0F766E' }]}>
                        File Attached
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.uploadBtn}
                    onPress={async () => {
                      const file = await pickDocumentOrImage();
                      if (file) {
                        setUploadedPharmDoc(file.name);
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
                <Ionicons name="card" size={18} color="#0D9488" />
                <Text style={styles.sectionTitle}>5. Revenue Disbursal & Compliance Declaration</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>Payout Bank Name *</Text>
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

                <Text style={styles.inputLabel}>Direct Pharmacy UPI ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  placeholder="Enter pharmacy UPI ID"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              {/* Compliance Declaration */}
              <Card style={[styles.declarationCard, errors.isDeclared && styles.inputError]} padding="md">
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => {
                    setIsDeclared(!isDeclared);
                    clearError('isDeclared');
                  }}
                  accessibilityLabel="Agree to Drugs & Cosmetics Act"
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      isDeclared && {
                        backgroundColor: '#0D9488',
                        borderColor: '#0D9488',
                      },
                    ]}
                  >
                    {isDeclared && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.declarationText}>
                    I declare that all drug licenses (Form 20/21) and pharmacist registrations submitted are authentic under the Drugs and Cosmetics Act, 1940 and Pharmacy Practice Regulations.
                  </Text>
                </Pressable>
              </Card>
              {errors.isDeclared ? (
                <View style={[styles.errorRow, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.isDeclared}</Text>
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
                  style={[styles.primaryStepBtn, { flex: 1, marginTop: 0, backgroundColor: '#0D9488' }]}
                  onPress={handleRegisterPharmacy}
                  accessibilityLabel={isPharmRegistered ? 'Update Pharmacy Changes' : 'Complete Pharmacy Registration'}
                >
                  <Ionicons name={isPharmRegistered ? 'save-outline' : 'flask'} size={18} color="#FFFFFF" />
                  <Text style={styles.primaryStepBtnText} numberOfLines={1}>
                    {isPharmRegistered ? 'Update Changes' : 'Complete Registration'}
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
    backgroundColor: '#0D9488',
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
    backgroundColor: '#0D9488',
    borderColor: '#99F6E4',
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
    color: '#0D9488',
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
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#99F6E4',
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pharmacyTag: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  pharmacyTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
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
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
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
  docBackHeader: {
    marginBottom: spacing.xs,
  },
  docBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#CCFBF1',
    borderColor: '#0D9488',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  docBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
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
    backgroundColor: '#CCFBF1',
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
    backgroundColor: '#0D9488',
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
    backgroundColor: '#0D9488',
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
    borderColor: '#99F6E4',
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
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStoreName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  heroLicenseText: {
    fontSize: 10,
    color: '#0D9488',
    marginTop: 1,
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
    color: '#0D9488',
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
  heroUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    borderRadius: radius.md,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  heroUpdateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
});
