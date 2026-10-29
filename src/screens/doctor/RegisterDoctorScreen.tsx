import React, { useState } from 'react';
import {
  Image,
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import Card from '../../components/Card';
import { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../context/AppContext';
import { HospitalDoctor } from '../../types';
import { pickPhotoFromGallery } from '../../utils/filePicker';

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Neurology',
  'Gynecology',
  'ENT Specialist',
  'Psychiatry',
  'Pulmonology',
  'Gastroenterology',
  'Ophthalmology',
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

const COMMON_SYMPTOMS = [
  'Fever & Cough',
  'Diabetes',
  'Hypertension',
  'Chest Pain',
  'Joint Pain',
  'Skin Allergies',
  'Asthma',
  'Headache & Migraine',
  'Thyroid',
  'Acidity & GERD',
];

type RegisterDoctorRouteProp = RouteProp<RootStackParamList, 'RegisterDoctor'>;

export default function RegisterDoctorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RegisterDoctorRouteProp>();
  const { addDoctor, updateDoctor, provider } = useApp();

  const existingDoctor = route.params?.doctor;
  const isEditing = Boolean(existingDoctor);

  // Form State
  const [name, setName] = useState(existingDoctor?.name || 'Dr. ');
  const [photo, setPhoto] = useState(
    existingDoctor?.photo || DOCTOR_AVATAR_PRESETS[0].uri,
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
  const [phone, setPhone] = useState(existingDoctor?.phone || '9876543210');
  const [email, setEmail] = useState(
    existingDoctor?.email || 'doctor.care@onebuddy.health',
  );

  // Credentials
  const [councilRegNumber, setCouncilRegNumber] = useState(
    existingDoctor?.councilRegistrationNumber || 'MCI-2019-84729',
  );
  const [specialization, setSpecialization] = useState(
    existingDoctor?.specialization || 'Cardiology',
  );
  const [qualification, setQualification] = useState(
    existingDoctor?.qualification || 'MBBS, MD (General Medicine)',
  );
  const [experience, setExperience] = useState(
    String(existingDoctor?.experience || '10'),
  );

  // Practice Timings & Fees
  const [consultationFee, setConsultationFee] = useState(
    String(existingDoctor?.consultationFee || '750'),
  );
  const [onlineFee, setOnlineFee] = useState(
    String(existingDoctor?.onlineConsultationFee || '600'),
  );
  const [slotDuration, setSlotDuration] = useState(
    String(existingDoctor?.slotDurationMinutes || '15'),
  );
  const [availableDays, setAvailableDays] = useState<string[]>(
    existingDoctor?.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  );
  const [timeStart, setTimeStart] = useState(
    existingDoctor?.availableTimeStart || '09:00 AM',
  );
  const [timeEnd, setTimeEnd] = useState(
    existingDoctor?.availableTimeEnd || '05:00 PM',
  );

  // Clinical Issues & Bio
  const [healthIssues, setHealthIssues] = useState(
    existingDoctor?.healthIssues.join(', ') ||
      'Hypertension, Heart Disease, Chest Pain, Arrhythmia',
  );
  const [bio, setBio] = useState(
    existingDoctor?.bio ||
      'Experienced medical specialist dedicated to evidence-based healthcare and patient wellness.',
  );

  // Regulatory Declaration
  const [declared, setDeclared] = useState(true);

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

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      if (availableDays.length === 1) {
        setErrors((prev) => ({ ...prev, availableDays: 'Doctor must have at least one working day.' }));
        return;
      }
      clearError('availableDays');
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      clearError('availableDays');
      setAvailableDays([...availableDays, day]);
    }
  };

  const addSymptom = (symptom: string) => {
    const list = healthIssues
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.includes(symptom)) {
      list.push(symptom);
      setHealthIssues(list.join(', '));
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === 'Dr.') {
      newErrors.name = 'Please enter doctor full name.';
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!phone.trim() || cleanPhone.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (!councilRegNumber.trim()) {
      newErrors.councilRegNumber = 'Please enter Medical Council Registration number.';
    }

    if (!qualification.trim()) {
      newErrors.qualification = 'Please enter doctor qualification degrees.';
    }

    if (availableDays.length === 0) {
      newErrors.availableDays = 'Doctor must have at least one working day.';
    }

    if (!declared) {
      newErrors.declared = 'Please verify that doctor credentials and registration details are authentic.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const issuesArray = healthIssues
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const doctorData: Omit<HospitalDoctor, 'id' | 'hospitalId'> = {
      name: trimmedName,
      photo,
      specialization,
      qualification,
      experience: parseInt(experience, 10) || 5,
      consultationFee: parseInt(consultationFee, 10) || 500,
      onlineConsultationFee: parseInt(onlineFee, 10) || 450,
      healthIssues:
        issuesArray.length > 0 ? issuesArray : ['General Consultation'],
      slotDurationMinutes: parseInt(slotDuration, 10) || 15,
      availableDays,
      availableTimeStart: timeStart,
      availableTimeEnd: timeEnd,
      blockedDates: existingDoctor?.blockedDates || [],
      councilRegistrationNumber: councilRegNumber.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gender,
      bio: bio.trim(),
    };

    if (isEditing && existingDoctor) {
      updateDoctor(existingDoctor.id, doctorData);
      navigation.goBack();
    } else {
      addDoctor(doctorData);
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header with Back Navigation */}
      <View style={styles.topHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back to Previous Screen"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isEditing ? 'Edit Doctor Profile' : 'Register Doctor'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Medical practitioner registration, license & schedule
          </Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.verifiedBadgeText}>MCI VERIFIED</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: Personal & Profile Photo */}
        <Card style={styles.sectionCard} padding="md">
          <View style={styles.sectionHeadingRow}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionHeading}>1. Personal & Contact Details</Text>
          </View>

          {/* Doctor Profile Picture: Avatar Selection + Upload Photo */}
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
                  const active = photo === preset.uri;
                  return (
                    <Pressable
                      key={preset.id || index}
                      style={[
                        styles.presetChip,
                        active && styles.presetChipActive,
                      ]}
                      onPress={() => setPhoto(preset.uri)}
                      accessibilityLabel={`Select Doctor Avatar ${index + 1}`}
                    >
                      <Image source={{ uri: preset.uri }} style={styles.presetMiniImg} />
                      {active && (
                        <View style={styles.presetActiveCheck}>
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
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

          {/* Full Name */}
          <Text style={styles.inputLabel}>Doctor Full Name *</Text>
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

          {/* Gender Pills */}
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.pillsRow}>
            {(['Male', 'Female', 'Other'] as const).map((g) => (
              <Pressable
                key={g}
                style={[
                  styles.selectorPill,
                  gender === g && styles.selectorPillActive,
                ]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.selectorPillText,
                    gender === g && styles.selectorPillTextActive,
                  ]}
                >
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Contact Row */}
          <View style={styles.dualInputRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Mobile Phone *</Text>
              <TextInput
                style={[styles.textInput, errors.phone && styles.inputError]}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(val) => {
                  const digits = val.replace(/\D/g, '').slice(0, 10);
                  setPhone(digits);
                  clearError('phone');
                }}
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
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Official Email</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter doctor email address"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </Card>

        {/* SECTION 2: Medical Credentials & License */}
        <Card style={styles.sectionCard} padding="md">
          <View style={styles.sectionHeadingRow}>
            <Ionicons name="ribbon-outline" size={18} color={colors.hospitalRed} />
            <Text style={styles.sectionHeading}>
              2. Medical Credentials & Council Registration
            </Text>
          </View>

          {/* Council Reg Number */}
          <Text style={styles.inputLabel}>State Medical Council / MCI Reg No. *</Text>
          <View style={[styles.regInputWrap, errors.councilRegNumber && styles.inputError]}>
            <Ionicons name="document-text" size={17} color={colors.hospitalRed} />
            <TextInput
              style={styles.regTextInput}
              value={councilRegNumber}
              onChangeText={(val) => {
                setCouncilRegNumber(val);
                clearError('councilRegNumber');
              }}
              placeholder="Enter council registration number"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
          </View>
          {errors.councilRegNumber ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{errors.councilRegNumber}</Text>
            </View>
          ) : null}

          {/* Specialization Selection */}
          <Text style={styles.inputLabel}>Primary Clinical Specialization *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specScroll}
          >
            {SPECIALIZATIONS.map((spec) => {
              const active = specialization === spec;
              return (
                <Pressable
                  key={spec}
                  style={[
                    styles.specChip,
                    active && styles.specChipActive,
                  ]}
                  onPress={() => setSpecialization(spec)}
                >
                  <Text
                    style={[
                      styles.specChipText,
                      active && styles.specChipTextActive,
                    ]}
                  >
                    {spec}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Qualifications & Experience */}
          <View style={styles.dualInputRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.inputLabel}>Degree / Qualifications *</Text>
              <TextInput
                style={[styles.textInput, errors.qualification && styles.inputError]}
                value={qualification}
                onChangeText={(val) => {
                  setQualification(val);
                  clearError('qualification');
                }}
                placeholder="Enter qualifications and degrees"
                placeholderTextColor={colors.textMuted}
              />
              {errors.qualification ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.qualification}</Text>
                </View>
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Experience (Yrs)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={experience}
                onChangeText={setExperience}
                placeholder="Enter experience in years"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </Card>

        {/* SECTION 3: Consultation Pricing & Timings */}
        <Card style={styles.sectionCard} padding="md">
          <View style={styles.sectionHeadingRow}>
            <Ionicons name="time-outline" size={18} color={colors.medicalBlue} />
            <Text style={styles.sectionHeading}>3. Practice Fees & OPD Hours</Text>
          </View>

          {/* Fees Row */}
          <View style={styles.dualInputRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>In-Person OPD Fee (₹)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={consultationFee}
                onChangeText={setConsultationFee}
                placeholder="Enter in-person OPD fee"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Online Video Fee (₹)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={onlineFee}
                onChangeText={setOnlineFee}
                placeholder="Enter online video fee"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Slot Duration */}
          <Text style={styles.inputLabel}>Consultation Slot Duration</Text>
          <View style={styles.pillsRow}>
            {['10', '15', '20', '30'].map((mins) => (
              <Pressable
                key={mins}
                style={[
                  styles.selectorPill,
                  slotDuration === mins && styles.selectorPillActive,
                ]}
                onPress={() => setSlotDuration(mins)}
              >
                <Text
                  style={[
                    styles.selectorPillText,
                    slotDuration === mins && styles.selectorPillTextActive,
                  ]}
                >
                  {mins} Mins
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Available Working Days */}
          <Text style={styles.inputLabel}>Available Practice Days *</Text>
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((d) => {
              const active = availableDays.includes(d);
              return (
                <Pressable
                  key={d}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => toggleDay(d)}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {d}
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

          {/* Timings */}
          <View style={styles.dualInputRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>OPD Start Time</Text>
              <TextInput
                style={styles.textInput}
                value={timeStart}
                onChangeText={setTimeStart}
                placeholder="Enter OPD start time"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>OPD End Time</Text>
              <TextInput
                style={styles.textInput}
                value={timeEnd}
                onChangeText={setTimeEnd}
                placeholder="Enter OPD end time"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </Card>

        {/* SECTION 4: Clinical Symptoms & Doctor Bio */}
        <Card style={styles.sectionCard} padding="md">
          <View style={styles.sectionHeadingRow}>
            <Ionicons name="medkit-outline" size={18} color={colors.purple} />
            <Text style={styles.sectionHeading}>4. Symptoms & Clinical Expertise</Text>
          </View>

          <Text style={styles.inputLabel}>Quick Add Common Conditions:</Text>
          <View style={styles.symptomsWrap}>
            {COMMON_SYMPTOMS.map((sym, idx) => (
              <Pressable
                key={idx}
                style={styles.symptomAddChip}
                onPress={() => addSymptom(sym)}
              >
                <Ionicons name="add" size={13} color={colors.primary} />
                <Text style={styles.symptomAddText}>{sym}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>
            Symptoms & Conditions Handled (Comma Separated) *
          </Text>
          <TextInput
            style={[styles.textInput, { minHeight: 60 }]}
            multiline
            numberOfLines={2}
            value={healthIssues}
            onChangeText={setHealthIssues}
            placeholder="Enter handled symptoms and conditions"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>Doctor Biography / Profile Summary</Text>
          <TextInput
            style={[styles.textInput, { minHeight: 65 }]}
            multiline
            numberOfLines={3}
            value={bio}
            onChangeText={setBio}
            placeholder="Enter professional biography and affiliations"
            placeholderTextColor={colors.textMuted}
          />
        </Card>

        {/* SECTION 5: Verification & Legal Declaration */}
        <Card style={styles.sectionCard} padding="md">
          <View style={styles.sectionHeadingRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionHeading}>5. Document Verification & Declaration</Text>
          </View>

          <View style={styles.docUploadBox}>
            <View style={styles.docUploadLeft}>
              <Ionicons name="document-attach" size={24} color={colors.primary} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.docTitle}>Medical Council Certificate / Degree</Text>
                <Text style={styles.docSub}>PDF/JPG • Document Verified</Text>
              </View>
            </View>
            <View style={styles.uploadedPill}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.uploadedPillText}>VERIFIED</Text>
            </View>
          </View>

          <Pressable
            style={styles.declarationRow}
            onPress={() => {
              setDeclared(!declared);
              clearError('declared');
            }}
          >
            <Switch
              value={declared}
              onValueChange={(val) => {
                setDeclared(val);
                clearError('declared');
              }}
              trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
              thumbColor={declared ? colors.primary : colors.textMuted}
            />
            <Text style={styles.declarationText}>
              I certify that this medical practitioner holds an active license with the State
              Medical Council / NMC and is certified to practice healthcare.
            </Text>
          </Pressable>
          {errors.declared ? (
            <View style={[styles.errorRow, { marginTop: 8 }]}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{errors.declared}</Text>
            </View>
          ) : null}
        </Card>

        {/* Action Submit Button */}
        <Pressable
          style={styles.submitBtn}
          onPress={handleSubmit}
          accessibilityLabel={isEditing ? 'Save Doctor Changes' : 'Register Doctor to Roster'}
        >
          <Ionicons
            name={isEditing ? 'save-outline' : 'person-add'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.submitBtnText}>
            {isEditing ? 'Save Doctor Changes' : 'Register Doctor to Roster'}
          </Text>
        </Pressable>
      </ScrollView>
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
    paddingHorizontal: 16,
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
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  sectionCard: {
    padding: spacing.md,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
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
  presetChip: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetMiniImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  presetActiveCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.background,
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
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  selectorPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  selectorPillTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  regInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    gap: 8,
  },
  regTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 8,
  },
  specScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  specChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  specChipActive: {
    backgroundColor: colors.hospitalRedLight,
    borderColor: colors.hospitalRed,
  },
  specChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  specChipTextActive: {
    color: colors.hospitalRed,
    fontWeight: '800',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dayChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dayChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  symptomsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  symptomAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  symptomAddText: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  docUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: spacing.sm,
  },
  docUploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  docSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  uploadedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  uploadedPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.success,
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  declarationText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: radius.lg,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
