import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
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
import { HospitalDoctor } from '../../types';
import { pickDocumentOrImage, pickPhotoFromGallery } from '../../utils/filePicker';

// Doctor Practice Options / Designations (Required field for Doctor registration)
const DOCTOR_PRACTICE_OPTIONS = [
  { id: 'specialist', label: 'Specialist Consultant', sub: 'MD / MS / DNB Certified Specialist' },
  { id: 'general', label: 'General Physician', sub: 'MBBS Family & Primary Care Physician' },
  { id: 'surgeon', label: 'Super-Specialist Surgeon', sub: 'MCh / DM / Fellowship Surgeon' },
  { id: 'telehealth', label: 'Visiting & Telehealth Doctor', sub: 'Remote Digital OPD & Home Consultations' },
  { id: 'senior_clinic', label: 'Clinic Senior Practitioner', sub: 'Independent Clinical Practice Lead' },
];

const PRACTICE_MODALITY_OPTIONS = [
  'OPD Clinic & Video Consults',
  'In-Clinic OPD Only',
  'Teleconsultation & Home Visits',
];

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Neurology',
  'Gynecology & Obstetrics',
  'ENT Specialist',
  'Psychiatry',
  'Pulmonology',
  'Gastroenterology',
  'Ophthalmology',
];

const MEDICAL_COUNCILS = [
  'National Medical Commission (NMC)',
  'Karnataka Medical Council (KMC)',
  'Delhi Medical Council (DMC)',
  'Maharashtra Medical Council (MMC)',
  'Tamil Nadu Medical Council',
  'Other State Medical Council',
];

const DOCTOR_AVATAR_PRESETS = [
  {
    id: 'av-1',
    label: 'Physician (M)',
    uri: 'https://api.dicebear.com/7.x/personas/png?seed=DrArjun&backgroundColor=dcfce7',
  },
  {
    id: 'av-2',
    label: 'Consultant (F)',
    uri: 'https://api.dicebear.com/7.x/personas/png?seed=DrPriya&backgroundColor=fee2e2',
  },
  {
    id: 'av-3',
    label: 'Specialist (M)',
    uri: 'https://api.dicebear.com/7.x/personas/png?seed=DrRahul&backgroundColor=e0f2fe',
  },
  {
    id: 'av-4',
    label: 'Surgeon (F)',
    uri: 'https://api.dicebear.com/7.x/personas/png?seed=DrAnanya&backgroundColor=fef3c7',
  },
  {
    id: 'av-5',
    label: 'Cardiologist (M)',
    uri: 'https://api.dicebear.com/7.x/personas/png?seed=DrVikram&backgroundColor=f3e8ff',
  },
  {
    id: 'av-6',
    label: 'Pediatrician (F)',
    uri: 'https://api.dicebear.com/7.x/personas/png?seed=DrMeera&backgroundColor=ccfbf1',
  },
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STEPS = [
  { id: 1, title: 'Doctor Option & Profile', icon: 'person' as const },
  { id: 2, title: 'Council & Credentials', icon: 'shield-checkmark' as const },
  { id: 3, title: 'Schedule & Fees', icon: 'cash' as const },
  { id: 4, title: 'Document Upload', icon: 'cloud-upload' as const },
  { id: 5, title: 'Bank & Ethics', icon: 'checkmark-done-circle' as const },
];

type DoctorRegistrationRouteProp = RouteProp<RootStackParamList, 'DoctorRegistration'>;

interface DoctorRegistrationProps {
  embedded?: boolean;
  onComplete?: () => void;
  onSwitchToDashboard?: () => void;
}

export default function DoctorRegistrationScreen({
  embedded = false,
  onComplete,
  onSwitchToDashboard,
}: DoctorRegistrationProps = {}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DoctorRegistrationRouteProp>();
  const { provider, doctorProfile, isCategoryRegistered, addDoctor, updateDoctor, registerProvider, switchProviderMode, toggleOnlineAvailability } = useApp();

  const existingDoctor = route.params?.doctor;
  const isEditing = Boolean(existingDoctor);
  const isDocRegistered = isCategoryRegistered('doctor');

  // Step Tracker state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isRegistered, setIsRegistered] = useState<boolean>(
    route.params?.mode === 'edit' || route.params?.mode === 'register' || route.params?.mode === 'add' || isEditing
      ? false
      : isDocRegistered
  );

  useEffect(() => {
    if (route.params?.mode === 'edit' || route.params?.mode === 'register' || route.params?.mode === 'add' || isEditing) {
      setIsRegistered(false);
    } else if (isDocRegistered) {
      setIsRegistered(true);
    }
  }, [route.params?.mode, isDocRegistered, isEditing]);

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

  const activeDoc = doctorProfile || provider;

  // Step 1: Doctor Practice Option / Field & Personal Identity
  const [doctorOption, setDoctorOption] = useState<string>(DOCTOR_PRACTICE_OPTIONS[0].id);
  const [practiceModality, setPracticeModality] = useState<string>(PRACTICE_MODALITY_OPTIONS[0]);
  const [name, setName] = useState(
    existingDoctor?.name || activeDoc?.name || 'Dr. Vikram Sengupta, MD, DM'
  );
  const [photo, setPhoto] = useState(
    existingDoctor?.photo || activeDoc?.avatar || DOCTOR_AVATAR_PRESETS[4].uri
  );
  const isCustomPhoto = !DOCTOR_AVATAR_PRESETS.some((p) => p.uri === photo);

  const handleUploadPhoto = async () => {
    const picked = await pickPhotoFromGallery();
    if (picked && picked.uri) {
      setPhoto(picked.uri);
    }
  };
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(
    existingDoctor?.gender || 'Male',
  );
  const [phone, setPhone] = useState(
    existingDoctor?.phone || (activeDoc?.phone ? activeDoc.phone.replace('+91 ', '') : '9845078901')
  );
  const [email, setEmail] = useState(
    existingDoctor?.email || activeDoc?.email || 'dr.vikram@onebuddy.health'
  );
  const [specialization, setSpecialization] = useState(
    existingDoctor?.specialization || activeDoc?.specialization || 'Senior Interventional Cardiologist & Physician'
  );
  const [qualification, setQualification] = useState(
    existingDoctor?.qualification || activeDoc?.qualifications || 'MBBS, MD (Gen Med), DM (Cardiology - AIIMS Delhi)'
  );
  const [experience, setExperience] = useState(
    String(existingDoctor?.experience || activeDoc?.experienceYears || '14')
  );

  // Step 2: Medical Credentials & Council
  const [councilRegNumber, setCouncilRegNumber] = useState(
    existingDoctor?.councilRegistrationNumber || activeDoc?.licenseNumber || 'MCI-REG-2012-74921'
  );
  const [medicalCouncil, setMedicalCouncil] = useState(MEDICAL_COUNCILS[0]);
  const [councilRegYear, setCouncilRegYear] = useState('2012');
  const [affiliatedHospital, setAffiliatedHospital] = useState('Apollo LifeCare Super Speciality Hospital');

  // Step 3: Clinic Details & Fees
  const [clinicName, setClinicName] = useState('Meditrust Clinic & Cardio Care');
  const [clinicAddress, setClinicAddress] = useState(activeDoc?.address || 'Suite 302, Meditrust Clinic, 100ft Road, Indiranagar, Bengaluru');
  const [consultationFee, setConsultationFee] = useState(
    String(existingDoctor?.consultationFee || '800')
  );
  const [onlineFee, setOnlineFee] = useState(
    String(existingDoctor?.onlineConsultationFee || activeDoc?.consultationFee || '750')
  );
  const [homeVisitFee, setHomeVisitFee] = useState(
    String(activeDoc?.homeVisitFee || '1500')
  );
  const [slotDuration, setSlotDuration] = useState(
    String(existingDoctor?.slotDurationMinutes || '15'),
  );
  const [availableDays, setAvailableDays] = useState<string[]>(
    existingDoctor?.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  );
  const [timeStart, setTimeStart] = useState(existingDoctor?.availableTimeStart || '09:00 AM');
  const [timeEnd, setTimeEnd] = useState(existingDoctor?.availableTimeEnd || '05:00 PM');
  const [offersHomeVisits, setOffersHomeVisits] = useState(true);

  // Step 4: Regulatory Document Uploads
  const [uploadedDoc, setUploadedDoc] = useState('MCI_Council_Registration_Certificate.pdf');
  const [uploadedDegreeDoc, setUploadedDegreeDoc] = useState('Medical_PostGraduate_Degree.pdf');

  // Step 5: Bank Settlement & Medical Ethics
  const [bankName, setBankName] = useState(activeDoc?.bankDetails?.bankName || 'State Bank of India');
  const [accountNumber, setAccountNumber] = useState(activeDoc?.bankDetails?.accountNumber || '381920491823');
  const [ifscCode, setIfscCode] = useState(activeDoc?.bankDetails?.ifscCode || 'SBIN0004512');
  const [upiId, setUpiId] = useState(activeDoc?.bankDetails?.upiId || 'drvikram@oksbi');
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

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      if (availableDays.length === 1) {
        setErrors((prev) => ({ ...prev, availableDays: 'Doctor must have at least one consulting day.' }));
        return;
      }
      clearError('availableDays');
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      clearError('availableDays');
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const newErrors: Record<string, string> = {};
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName === 'Dr.') {
        newErrors.name = 'Please enter doctor full name.';
      }
      if (!doctorOption) {
        newErrors.doctorOption = 'Please select a Doctor Option / Designation.';
      }
      if (!specialization.trim()) {
        newErrors.specialization = 'Please select primary medical specialization.';
      }
      if (!qualification.trim()) {
        newErrors.qualification = 'Please enter degrees / qualifications.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const newErrors: Record<string, string> = {};
      if (!councilRegNumber.trim()) {
        newErrors.councilRegNumber = 'Please enter Medical Council Registration number.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const newErrors: Record<string, string> = {};
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (!phone.trim()) {
        newErrors.phone = 'Please enter primary mobile number.';
      } else if (cleanPhone.length !== 10) {
        newErrors.phone = 'Please enter a valid 10-digit primary mobile number.';
      }
      if (!clinicAddress.trim()) {
        newErrors.clinicAddress = 'Please enter clinic or consultation chambers address.';
      }
      if (availableDays.length === 0) {
        newErrors.availableDays = 'Doctor must have at least one consulting day.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setCurrentStep(4);
    } else if (currentStep === 4) {
      const newErrors: Record<string, string> = {};
      if (!uploadedDoc) {
        newErrors.uploadedDoc = 'Please upload Medical Council registration certificate.';
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

  const handleRegisterDoctor = () => {
    const newErrors: Record<string, string> = {};
    if (!bankName.trim()) {
      newErrors.bankName = 'Please enter designated bank name.';
    }
    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Please enter bank account number.';
    }
    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'Please enter IFSC code.';
    }
    if (!isDeclared) {
      newErrors.declaration = 'Please confirm adherence to Telemedicine Practice Guidelines and Medical Council ethics.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const trimmedName = name.trim();

    const selectedOptionObj = DOCTOR_PRACTICE_OPTIONS.find((o) => o.id === doctorOption);

    const doctorData: Omit<HospitalDoctor, 'id' | 'hospitalId'> = {
      name: trimmedName,
      photo,
      specialization,
      qualification,
      experience: parseInt(experience, 10) || 10,
      consultationFee: parseInt(consultationFee, 10) || 750,
      onlineConsultationFee: parseInt(onlineFee, 10) || 600,
      healthIssues: ['General Consultation', specialization],
      slotDurationMinutes: parseInt(slotDuration, 10) || 15,
      availableDays,
      availableTimeStart: timeStart,
      availableTimeEnd: timeEnd,
      blockedDates: existingDoctor?.blockedDates || [],
      councilRegistrationNumber: councilRegNumber.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gender,
      bio: `${selectedOptionObj?.label || 'Doctor'} practicing ${specialization} with ${experience} years experience.`,
    };

    if (isEditing && existingDoctor) {
      updateDoctor(existingDoctor.id, doctorData);
    } else {
      addDoctor(doctorData);
    }

    // Register into provider context
    registerProvider({
      type: 'doctor',
      name: trimmedName,
      phone: `+91 ${phone.trim()}`,
      email: email.trim(),
      licenseNumber: councilRegNumber.trim(),
      licenseType: medicalCouncil,
      licenseDocName: uploadedDoc,
      consultationFee: parseInt(onlineFee, 10) || 600,
      homeVisitFee: parseInt(homeVisitFee, 10) || 1200,
      specialization,
      qualifications: qualification,
      experienceYears: parseInt(experience, 10) || 10,
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        accountName: trimmedName,
        upiId: upiId.trim(),
      },
    });

    switchProviderMode('doctor');
    setIsRegistered(true);
    Alert.alert(
      isDocRegistered ? 'Changes Updated' : 'Registration Complete',
      isDocRegistered
        ? 'Your doctor profile, fees, and practice credentials have been updated successfully.'
        : 'Doctor registration completed successfully. Welcome to OneBuddy Medical!'
    );
    onComplete?.();
  };

  const ContainerComponent = embedded ? View : SafeAreaView;
  const containerProps = embedded ? { style: styles.safe } : { style: styles.safe, edges: ['top'] as const };

  // If already registered, render the Doctor Service Dashboard right here!
  if (isRegistered) {
    const selectedOptionObj = DOCTOR_PRACTICE_OPTIONS.find((o) => o.id === doctorOption);

    return (
      <ContainerComponent {...(containerProps as any)}>
        {/* Doctor Dashboard Header */}
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
              <Ionicons name="medkit" size={16} color="#2563EB" />
              <Text style={[styles.headerTitle, embedded && { color: '#0F172A' }]} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, embedded && { color: '#64748B' }]} numberOfLines={1}>
              Registered Doctor • {specialization} • Reg: {councilRegNumber}
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
          {/* Active Doctor Hero Card */}
          <Card style={styles.dashboardHeroCard} padding="lg">
            <View style={styles.heroTopRow}>
              <Image source={{ uri: photo }} style={styles.heroDoctorAvatar} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.heroDoctorName} numberOfLines={1}>{name}</Text>
                <View style={styles.doctorOptionTag}>
                  <Text style={styles.doctorOptionTagText}>
                    {selectedOptionObj?.label || 'Specialist Consultant'}
                  </Text>
                </View>
                <Text style={styles.heroSubText}>
                  {specialization} • {qualification} • {experience} yrs exp
                </Text>
                <Text style={styles.heroCouncilText}>{medicalCouncil}</Text>
              </View>
            </View>

            {/* Fully Accessible Online / Offline Toggle Button (Silent: No Notification Alert) */}
            <View style={styles.onlineToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.onlineToggleTitle}>Consultation Availability</Text>
                <Text style={styles.onlineToggleSub}>
                  {provider.isOnline
                    ? 'Online: Accepting video consultations & clinic appointments'
                    : 'Offline: Patient booking requests paused'}
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
                accessibilityLabel={`Doctor availability is ${provider.isOnline ? 'Online' : 'Offline'}. Tap to toggle.`}
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
              accessibilityLabel="Update Doctor Changes"
            >
              <Ionicons name="create-outline" size={16} color="#2563EB" />
              <Text style={styles.heroUpdateBtnText}>Update Doctor Details & Fees</Text>
            </Pressable>
          </Card>

          {/* Consultation Fee Metrics */}
          <View style={[styles.sectionHeader, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
            <Ionicons name="cash-outline" size={17} color="#2563EB" />
            <Text style={styles.sectionTitle}>Consultation Fees & Practice Modalities</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="videocam" size={19} color="#2563EB" />
                </View>
                <Text style={styles.statNumber}>₹{onlineFee}</Text>
                <Text style={styles.statLabel}>Video Consult</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#F0FDFA' }]}>
                  <Ionicons name="business" size={19} color="#0D9488" />
                </View>
                <Text style={styles.statNumber}>₹{consultationFee}</Text>
                <Text style={styles.statLabel}>In-Clinic OPD</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="home" size={19} color="#D97706" />
                </View>
                <Text style={styles.statNumber}>₹{homeVisitFee}</Text>
                <Text style={styles.statLabel}>Home Visit</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBadge, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="time" size={19} color="#7C3AED" />
                </View>
                <Text style={styles.statNumber}>{slotDuration}m</Text>
                <Text style={styles.statLabel}>Slot Duration</Text>
              </View>
            </View>
          </View>

          {/* Doctor Management Actions */}
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={17} color="#2563EB" />
            <Text style={styles.sectionTitle}>Doctor Practice Modules</Text>
          </View>

          <View style={styles.actionGrid}>
            <Pressable
              style={styles.actionCard}
              onPress={() => {
                switchProviderMode('doctor');
                navigation.navigate('DoctorConsultations');
              }}
              accessibilityLabel="View Consultations"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="videocam" size={22} color="#2563EB" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Video Consults</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Incoming teleconsultation queue</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={styles.actionLinkText}>Open Queue</Text>
                <Ionicons name="arrow-forward" size={12} color="#2563EB" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => {
                switchProviderMode('doctor');
                navigation.navigate('DoctorHomeVisits');
              }}
              accessibilityLabel="Manage Home Visits"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="car" size={22} color="#D97706" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Home Visits Desk</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>House-call appointments nearby</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#D97706' }]}>Open Visits</Text>
                <Ionicons name="arrow-forward" size={12} color="#D97706" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => {
                switchProviderMode('doctor');
                navigation.navigate('Main', { screen: 'Home' } as any);
              }}
              accessibilityLabel="Enter Live Operations Hub"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="pulse" size={22} color="#2563EB" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Live Operations Hub</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Teleconsults & schedule desk</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#2563EB' }]}>Enter Live Ops</Text>
                <Ionicons name="arrow-forward" size={12} color="#2563EB" />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => setIsRegistered(false)}
              accessibilityLabel="Update Doctor Profile"
            >
              <View>
                <View style={[styles.actionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="create-outline" size={22} color="#2563EB" />
                </View>
                <Text style={styles.actionCardTitle} numberOfLines={1}>Update Changes</Text>
                <Text style={styles.actionCardSub} numberOfLines={2}>Update fees, schedule & bio</Text>
              </View>
              <View style={styles.actionLinkRow}>
                <Text style={[styles.actionLinkText, { color: '#2563EB' }]}>Update Changes</Text>
                <Ionicons name="arrow-forward" size={12} color="#2563EB" />
              </View>
            </Pressable>
          </View>

          {/* Practice & Settlement Summary */}
          <Card style={styles.summaryCard} padding="md">
            <View style={styles.summaryHeaderRow}>
              <View style={[styles.summaryHeaderIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="medical" size={16} color="#2563EB" />
              </View>
              <Text style={styles.summaryCardHeading}>Practice Chambers & Bank Settlement</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Clinic Name</Text>
              <Text style={styles.summaryValue}>{clinicName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Clinic Address</Text>
              <Text style={styles.summaryValue}>{clinicAddress}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Schedule Days</Text>
              <Text style={styles.summaryValue}>{availableDays.join(', ')} ({timeStart} - {timeEnd})</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Contact Phone</Text>
              <Text style={styles.summaryValue}>+91 {phone}</Text>
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
              } else if (isDocRegistered) {
                setIsRegistered(true);
              } else {
                navigation.navigate('Main', { screen: 'Home' } as any);
              }
            }}
            accessibilityLabel={currentStep > 1 ? `Back to Step ${currentStep - 1}` : (isDocRegistered ? 'Back to Dashboard' : 'Back to Live Operations')}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="medkit" size={17} color="#60A5FA" />
              <Text style={styles.headerTitle}>
                {isDocRegistered ? 'Update Doctor Details' : 'Doctor Registration'}
              </Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {isDocRegistered
                ? `Update Step ${currentStep} of 5: ${STEPS[currentStep - 1]?.title}`
                : `Step ${currentStep} of 5: ${STEPS[currentStep - 1]?.title}`}
            </Text>
          </View>

          <View style={styles.stepBadgePill}>
            <Text style={styles.stepBadgeText}>
              {isDocRegistered ? `Update ${currentStep}/5` : `Step ${currentStep}/5`}
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
          {/* STEP 1: DOCTOR OPTION & IDENTITY */}
          {currentStep === 1 && (
            <>
              {/* Doctor Category Hero Banner */}
              <Card style={styles.bannerCard} padding="lg">
                <View style={styles.bannerRow}>
                  <View style={styles.bannerIconBadge}>
                    <Ionicons name="medkit" size={26} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.bannerTitle}>Doctor Practice Onboarding</Text>
                    <Text style={styles.bannerSubtitle}>
                      Register as a specialist consultant, family physician, or telemedicine expert with verified council credentials.
                    </Text>
                  </View>
                </View>
              </Card>

              {/* REQUIRED DOCTOR OPTION / DESIGNATION SELECTOR */}
              <View style={styles.sectionHeader}>
                <Ionicons name="ribbon" size={18} color="#2563EB" />
                <Text style={styles.sectionTitle}>1. Doctor Practice Option / Designation *</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>
                  Select Doctor Option / Practice Category *
                </Text>
                <View style={styles.doctorOptionGrid}>
                  {DOCTOR_PRACTICE_OPTIONS.map((opt) => {
                    const active = doctorOption === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        style={[styles.doctorOptionCard, active && styles.doctorOptionCardActive]}
                        onPress={() => setDoctorOption(opt.id)}
                        accessibilityLabel={`Select ${opt.label}`}
                      >
                        <Ionicons
                          name={active ? 'checkmark-circle' : 'ellipse-outline'}
                          size={18}
                          color={active ? '#2563EB' : colors.textMuted}
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={[styles.doctorOptionTitle, active && styles.doctorOptionTitleActive]}>
                            {opt.label}
                          </Text>
                          <Text style={styles.doctorOptionSub}>{opt.sub}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.doctorOption ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.doctorOption}</Text>
                  </View>
                ) : null}

                <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                  Practice Modality *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {PRACTICE_MODALITY_OPTIONS.map((mod) => {
                    const active = practiceModality === mod;
                    return (
                      <Pressable
                        key={mod}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setPracticeModality(mod)}
                      >
                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                          {mod}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Card>

              {/* Personal & Specialty Profile */}
              <View style={styles.sectionHeader}>
                <Ionicons name="person-circle" size={18} color="#2563EB" />
                <Text style={styles.sectionTitle}>Doctor Profile & Qualifications</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>Doctor Full Name (with Prefix) *</Text>
                <TextInput
                  style={[styles.textInput, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    clearError('name');
                  }}
                  placeholder="Enter doctor full name"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.name ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.name}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Doctor Profile Photo / Avatar</Text>
                <View style={styles.photoPickerContainer}>
                  <View style={styles.photoPreviewSection}>
                    <View style={styles.photoAvatarWrap}>
                      <Image source={{ uri: photo }} style={styles.avatarPreview} />
                    </View>
                    {isCustomPhoto && (
                      <View style={styles.customPhotoTag}>
                        <Ionicons name="checkmark-circle" size={10} color="#15803D" />
                        <Text style={styles.customPhotoTagText}>Custom Photo</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.photoActionsSection}>
                    {/* 1. Doctor Avatar Presets (First) */}
                    <Text style={styles.avatarPickerLabel}>Select Doctor Avatar:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.presetsWrap}
                    >
                      {DOCTOR_AVATAR_PRESETS.map((preset, index) => {
                        const isSelected = photo === preset.uri;
                        return (
                          <Pressable
                            key={preset.id || index}
                            style={[styles.avatarChoice, isSelected && styles.avatarChoiceSelected]}
                            onPress={() => setPhoto(preset.uri)}
                            accessibilityLabel={`Select Doctor Avatar ${index + 1}`}
                          >
                            <Image source={{ uri: preset.uri }} style={styles.avatarImg} />
                            {isSelected && (
                              <View style={styles.avatarCheckmarkBadge}>
                                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {/* 2. Upload Photo Option (Second) */}
                    <Text style={[styles.avatarPickerLabel, { marginTop: 10 }]}>Or Upload Photo:</Text>
                    <Pressable
                      style={styles.uploadPhotoBtn}
                      onPress={handleUploadPhoto}
                      accessibilityLabel="Upload doctor photo from phone"
                    >
                      <Ionicons name="cloud-upload-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.uploadPhotoBtnText}>Upload Photo</Text>
                    </Pressable>
                    <Text style={styles.photoHintText}>Pick custom photo from phone storage</Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Primary Medical Specialization *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {SPECIALIZATIONS.map((spec) => {
                    const active = specialization === spec;
                    return (
                      <Pressable
                        key={spec}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setSpecialization(spec)}
                      >
                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                          {spec}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {errors.specialization ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.specialization}</Text>
                  </View>
                ) : null}

                <View style={styles.inputRow}>
                  <View style={{ flex: 1.5, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Degrees / Qualifications *</Text>
                    <TextInput
                      style={[styles.textInput, errors.qualification && styles.inputError]}
                      value={qualification}
                      onChangeText={(val) => {
                        setQualification(val);
                        clearError('qualification');
                      }}
                      placeholder="Enter degrees / qualifications"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.qualification ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.qualification}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 0.8, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Exp (Years)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={experience}
                      onChangeText={setExperience}
                      keyboardType="number-pad"
                      placeholder="Enter experience in years"
                      placeholderTextColor={colors.textMuted}
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

          {/* STEP 2: COUNCIL & REGULATORY CREDENTIALS */}
          {currentStep === 2 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#2563EB" />
                <Text style={styles.sectionTitle}>2. Medical Council Registration & Credentials</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>
                  Medical Council Registration Number *
                </Text>
                <TextInput
                  style={[styles.textInput, errors.councilRegNumber && styles.inputError]}
                  value={councilRegNumber}
                  onChangeText={(val) => {
                    setCouncilRegNumber(val);
                    clearError('councilRegNumber');
                  }}
                  placeholder="Enter medical council registration number"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.councilRegNumber ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.councilRegNumber}</Text>
                  </View>
                ) : null}

                <Text style={styles.inputLabel}>Registering Medical Council *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {MEDICAL_COUNCILS.map((c) => {
                    const active = medicalCouncil === c;
                    return (
                      <Pressable
                        key={c}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setMedicalCouncil(c)}
                      >
                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Year of Registration</Text>
                    <TextInput
                      style={styles.textInput}
                      value={councilRegYear}
                      onChangeText={setCouncilRegYear}
                      keyboardType="number-pad"
                      placeholder="Enter year of registration"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1.5, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Hospital Affiliation</Text>
                    <TextInput
                      style={styles.textInput}
                      value={affiliatedHospital}
                      onChangeText={setAffiliatedHospital}
                      placeholder="Enter affiliated hospital name"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.infoBanner}>
                  <Ionicons name="shield" size={18} color="#2563EB" />
                  <Text style={styles.infoBannerText}>
                    Doctor registration numbers are verified with the NMC National Medical Register to ensure authorized telemedicine & clinical practice.
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

          {/* STEP 3: PRACTICE SCHEDULE & FEES */}
          {currentStep === 3 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="cash" size={18} color="#2563EB" />
                <Text style={styles.sectionTitle}>3. Consultation Fees & Practice Schedule</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.inputLabel}>Practice Chambers / Clinic Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholder="Enter practice clinic name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.inputLabel}>Clinic Address *</Text>
                <TextInput
                  style={[styles.textInput, errors.clinicAddress && styles.inputError]}
                  value={clinicAddress}
                  onChangeText={(val) => {
                    setClinicAddress(val);
                    clearError('clinicAddress');
                  }}
                  placeholder="Enter clinic address"
                  placeholderTextColor={colors.textMuted}
                />
                {errors.clinicAddress ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.clinicAddress}</Text>
                  </View>
                ) : null}

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Primary Mobile *</Text>
                    <TextInput
                      style={[styles.textInput, errors.phone && styles.inputError]}
                      value={phone}
                      onChangeText={(val) => {
                        const digits = val.replace(/\D/g, '').slice(0, 10);
                        setPhone(digits);
                        clearError('phone');
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.phone ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{errors.phone}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Doctor Email *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Enter doctor email address"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Consultation Fees */}
                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>In-Clinic Fee (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={consultationFee}
                      onChangeText={setConsultationFee}
                      keyboardType="number-pad"
                      placeholder="Enter clinic fee"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Video Fee (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={onlineFee}
                      onChangeText={setOnlineFee}
                      keyboardType="number-pad"
                      placeholder="Enter video fee"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.xs }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Home Visit (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={homeVisitFee}
                      onChangeText={setHomeVisitFee}
                      keyboardType="number-pad"
                      placeholder="Enter home visit fee"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Consulting Days */}
                <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
                  Consultation Days (Tap to toggle)
                </Text>
                <View style={styles.daysRow}>
                  {DAYS_OF_WEEK.map((day) => {
                    const active = availableDays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() => toggleDay(day)}
                      >
                        <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.availableDays ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.availableDays}</Text>
                  </View>
                ) : null}

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>Start Time</Text>
                    <TextInput
                      style={styles.textInput}
                      value={timeStart}
                      onChangeText={setTimeStart}
                      placeholder="Enter start time"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel} numberOfLines={1}>End Time</Text>
                    <TextInput
                      style={styles.textInput}
                      value={timeEnd}
                      onChangeText={setTimeEnd}
                      placeholder="Enter end time"
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
                  accessibilityLabel="Back to Step 3: Practice & Fees"
                >
                  <Ionicons name="arrow-back" size={18} color="#2563EB" />
                  <Text style={styles.docBackBtnText}>Back to Step 3: Practice & Fees</Text>
                </Pressable>
              </View>

              <View style={styles.sectionHeader}>
                <Ionicons name="cloud-upload" size={18} color="#2563EB" />
                <Text style={styles.sectionTitle}>4. Medical Council Document Verification</Text>
              </View>

              <Card style={styles.formCard} padding="lg">
                <Text style={styles.uploadSectionTitle}>
                  Medical Council Registration Certificate (MCI / State SMC) *
                </Text>
                <View style={styles.docUploadBox}>
                  <View style={styles.docUploadIconCircle}>
                    <Ionicons name="document-attach" size={22} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.docUploadTitle}>Council Certificate PDF</Text>
                    <Text style={styles.docUploadFilename}>{uploadedDoc}</Text>
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
                        setUploadedDoc(file.name);
                        clearError('uploadedDoc');
                      }
                    }}
                  >
                    <Text style={styles.uploadBtnText}>Replace</Text>
                  </Pressable>
                </View>
                {errors.uploadedDoc ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.uploadedDoc}</Text>
                  </View>
                ) : null}

                <Text style={[styles.uploadSectionTitle, { marginTop: spacing.md }]}>
                  Postgraduate Degree / Specialization Certificate
                </Text>
                <View style={styles.docUploadBox}>
                  <View style={[styles.docUploadIconCircle, { backgroundColor: '#EDE9FE' }]}>
                    <Ionicons name="school" size={22} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.docUploadTitle}>Degree Certificate PDF</Text>
                    <Text style={styles.docUploadFilename}>{uploadedDegreeDoc}</Text>
                    <View style={[styles.verifiedDocPill, { backgroundColor: '#EDE9FE' }]}>
                      <Ionicons name="checkmark-circle" size={11} color="#7C3AED" />
                      <Text style={[styles.verifiedDocPillText, { color: '#6D28D9' }]}>
                        File Attached
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.uploadBtn}
                    onPress={async () => {
                      const file = await pickDocumentOrImage();
                      if (file) {
                        setUploadedDegreeDoc(file.name);
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

          {/* STEP 5: BANK SETTLEMENT & MEDICAL ETHICS */}
          {currentStep === 5 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="card" size={18} color="#2563EB" />
                <Text style={styles.sectionTitle}>5. Revenue Disbursal & Code of Ethics</Text>
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

                <Text style={styles.inputLabel}>Direct Doctor UPI ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  placeholder="Enter doctor UPI ID"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              {/* Ethics Declaration */}
              <Card style={styles.declarationCard} padding="md">
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => {
                    setIsDeclared(!isDeclared);
                    clearError('declaration');
                  }}
                  accessibilityLabel="Agree to Medical Ethics"
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      isDeclared && {
                        backgroundColor: '#2563EB',
                        borderColor: '#2563EB',
                      },
                    ]}
                  >
                    {isDeclared && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.declarationText}>
                    I confirm adherence to the NMC Telemedicine Practice Guidelines, Indian Medical Council (Professional Conduct, Etiquette & Ethics) Regulations, and affirm that all submitted qualification credentials are accurate.
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
                  style={[styles.primaryStepBtn, { flex: 1, marginTop: 0, backgroundColor: '#2563EB' }]}
                  onPress={handleRegisterDoctor}
                  accessibilityLabel={isDocRegistered ? 'Update Doctor Changes' : 'Complete Doctor Registration'}
                >
                  <Ionicons name={isDocRegistered ? 'save-outline' : 'medkit'} size={18} color="#FFFFFF" />
                  <Text style={styles.primaryStepBtnText} numberOfLines={1}>
                    {isDocRegistered ? 'Update Changes' : 'Complete Registration'}
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
    backgroundColor: '#2563EB',
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
    backgroundColor: '#2563EB',
    borderColor: '#BFDBFE',
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
    color: '#2563EB',
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
    borderColor: '#BFDBFE',
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
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  doctorTag: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  doctorTagText: {
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorOptionGrid: {
    gap: 8,
    marginTop: 4,
  },
  doctorOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    borderRadius: radius.md,
  },
  doctorOptionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 1.5,
  },
  doctorOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  doctorOptionTitleActive: {
    color: '#1D4ED8',
  },
  doctorOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
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
  photoPickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
  },
  photoPreviewSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAvatarWrap: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  avatarPreview: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  photoCameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  customPhotoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  customPhotoTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  photoActionsSection: {
    flex: 1,
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  uploadPhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoHintText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    marginBottom: 8,
  },
  avatarPickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  presetsWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  avatarChoice: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  avatarChoiceSelected: {
    borderColor: colors.primary,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarCheckmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
  },
  dayChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    padding: 10,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#1D4ED8',
    lineHeight: 16,
  },
  docBackHeader: {
    marginBottom: spacing.xs,
  },
  docBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  docBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
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
    backgroundColor: '#DBEAFE',
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
    backgroundColor: '#2563EB',
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
    backgroundColor: '#2563EB',
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
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDoctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  heroDoctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  doctorOptionTag: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  doctorOptionTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  heroCouncilText: {
    fontSize: 10,
    color: '#2563EB',
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
    color: '#2563EB',
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  heroUpdateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});
