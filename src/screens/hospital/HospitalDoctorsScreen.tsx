import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { colors, radius, spacing } from '../../theme/colors';
import Card from '../../components/Card';
import { HospitalDoctor } from '../../types';

export default function HospitalDoctorsScreen() {
  const navigation = useNavigation();
  const { doctors, addDoctor, updateDoctor, deleteDoctor, toggleDoctorLeave } = useApp();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<HospitalDoctor | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [qualification, setQualification] = useState('MBBS, MD (Cardiology)');
  const [experience, setExperience] = useState('12');
  const [consultationFee, setConsultationFee] = useState('800');
  const [slotDuration, setSlotDuration] = useState('15');
  const [healthIssues, setHealthIssues] = useState('Chest pain, Hypertension, Arrhythmia');
  const [timeStart, setTimeStart] = useState('09:00 AM');
  const [timeEnd, setTimeEnd] = useState('05:00 PM');

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase()) ||
      d.healthIssues.some((issue) => issue.toLowerCase().includes(search.toLowerCase())),
  );

  const openAddModal = () => {
    setEditingDoctor(null);
    setName('');
    setSpecialization('General Medicine');
    setQualification('MBBS, MD');
    setExperience('8');
    setConsultationFee('600');
    setSlotDuration('15');
    setHealthIssues('Fever, Cough, Diabetes, General Health');
    setTimeStart('09:00 AM');
    setTimeEnd('05:00 PM');
    setModalVisible(true);
  };

  const openEditModal = (doc: HospitalDoctor) => {
    setEditingDoctor(doc);
    setName(doc.name);
    setSpecialization(doc.specialization);
    setQualification(doc.qualification);
    setExperience(String(doc.experience));
    setConsultationFee(String(doc.consultationFee));
    setSlotDuration(String(doc.slotDurationMinutes));
    setHealthIssues(doc.healthIssues.join(', '));
    setTimeStart(doc.availableTimeStart);
    setTimeEnd(doc.availableTimeEnd);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    const issuesArray = healthIssues.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingDoctor) {
      updateDoctor(editingDoctor.id, {
        name,
        specialization,
        qualification,
        experience: parseInt(experience, 10) || 5,
        consultationFee: parseInt(consultationFee, 10) || 500,
        slotDurationMinutes: parseInt(slotDuration, 10) || 15,
        healthIssues: issuesArray,
        availableTimeStart: timeStart,
        availableTimeEnd: timeEnd,
      });
    } else {
      addDoctor({
        name,
        photo: 'https://api.dicebear.com/7.x/personas/png?seed=DrArjun&backgroundColor=dcfce7',
        specialization,
        qualification,
        experience: parseInt(experience, 10) || 5,
        consultationFee: parseInt(consultationFee, 10) || 500,
        slotDurationMinutes: parseInt(slotDuration, 10) || 15,
        healthIssues: issuesArray,
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        availableTimeStart: timeStart,
        availableTimeEnd: timeEnd,
        blockedDates: [],
      });
    }

    setModalVisible(false);
  };

  const renderDoctorItem = ({ item }: { item: HospitalDoctor }) => {
    const isLeaveToday = item.blockedDates.includes('2026-10-01');

    return (
      <Card style={styles.docCard}>
        <View style={styles.docHeader}>
          <Image source={{ uri: item.photo }} style={styles.docPhoto} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.docNameRow}>
              <Text style={styles.docName}>{item.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable
                  onPress={() =>
                    (navigation as any).navigate('RegisterDoctor', {
                      doctor: item,
                      mode: 'edit',
                    })
                  }
                  hitSlop={6}
                  accessibilityLabel="Edit Doctor Registration"
                >
                  <Ionicons name="create-outline" size={19} color={colors.hospitalBlue} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.docSpec}>{item.specialization}</Text>
            <Text style={styles.docQual}>
              {item.qualification} • {item.experience} yrs exp
            </Text>
          </View>
        </View>

        {/* Consultation Fee & Slot Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Consult Fee</Text>
            <Text style={styles.detailValue}>₹{item.consultationFee}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Slot Duration</Text>
            <Text style={styles.detailValue}>{item.slotDurationMinutes} mins</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>OP Timings</Text>
            <Text style={styles.detailValue}>{item.availableTimeStart} - {item.availableTimeEnd}</Text>
          </View>
        </View>

        {/* Health Issues Treated */}
        <View style={styles.issuesWrap}>
          <Text style={styles.issuesHeading}>Conditions Treated:</Text>
          <View style={styles.issuesChips}>
            {item.healthIssues.map((issue, idx) => (
              <View key={idx} style={styles.issueChip}>
                <Text style={styles.issueChipText}>{issue}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Leave Blocking & Days */}
        <View style={styles.leaveBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.leaveBarText}>
              Working Days: {item.availableDays.join(', ')}
            </Text>
            {item.blockedDates.length > 0 && (
              <Text style={styles.blockedDaysText}>
                Blocked Leave: {item.blockedDates.join(', ')}
              </Text>
            )}
          </View>

          <Pressable
            style={[
              styles.leaveToggleBtn,
              isLeaveToday ? { backgroundColor: colors.warningLight } : { backgroundColor: colors.background },
            ]}
            onPress={() => {
              toggleDoctorLeave(item.id, '2026-10-01');
            }}
          >
            <Ionicons
              name={isLeaveToday ? 'calendar' : 'calendar-outline'}
              size={13}
              color={isLeaveToday ? colors.warning : colors.textSecondary}
            />
            <Text
              style={[
                styles.leaveToggleText,
                isLeaveToday && { color: colors.warning, fontWeight: '700' },
              ]}
            >
              {isLeaveToday ? 'On Leave Today' : 'Block Leave'}
            </Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              (navigation as any).navigate('Main');
            }
          }}
          style={styles.backBtn}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Hospital Doctors Roster</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Manage consulting physicians, slots & leave</Text>
        </View>
        <Pressable
          style={styles.addDoctorBtn}
          onPress={() => (navigation as any).navigate('RegisterDoctor', { mode: 'add' })}
          accessibilityLabel="Add New Doctor"
        >
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.addDoctorBtnText}>Add Doctor</Text>
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by doctor name, specialty, disease..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Doctor List */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctorItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add / Edit Doctor Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDoctor ? 'Edit Doctor Profile' : 'Add New Consulting Doctor'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Doctor Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Dr. Ramesh Gupta"
              />

              <Text style={styles.fieldLabel}>Specialization</Text>
              <TextInput
                style={styles.textInput}
                value={specialization}
                onChangeText={setSpecialization}
                placeholder="e.g. Cardiology, Neurology, Pediatrics"
              />

              <Text style={styles.fieldLabel}>Qualification & Degrees</Text>
              <TextInput
                style={styles.textInput}
                value={qualification}
                onChangeText={setQualification}
                placeholder="e.g. MBBS, MD, DM"
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Experience (Yrs)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={experience}
                    onChangeText={setExperience}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Consultation Fee (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={consultationFee}
                    onChangeText={setConsultationFee}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Slot Duration (Mins)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={slotDuration}
                    onChangeText={setSlotDuration}
                    placeholder="15 / 20 / 30"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>OP Timings</Text>
                  <TextInput
                    style={styles.textInput}
                    value={`${timeStart} - ${timeEnd}`}
                    onChangeText={(val) => {
                      const parts = val.split('-');
                      if (parts[0]) setTimeStart(parts[0].trim());
                      if (parts[1]) setTimeEnd(parts[1].trim());
                    }}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Health Issues & Conditions Treated (comma-separated)</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                multiline
                value={healthIssues}
                onChangeText={setHealthIssues}
                placeholder="e.g. Chest Pain, Blood Pressure, Heart Failure"
              />

              <View style={styles.modalNotice}>
                <Ionicons name="lock-closed" size={14} color={colors.primary} />
                <Text style={styles.modalNoticeText}>
                  Slot locking enabled: Prevents double bookings automatically when customer reserves a time slot.
                </Text>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.modalSaveBtn} onPress={handleSave}>
                  <Text style={styles.modalSaveBtnText}>Save Doctor</Text>
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
    gap: 8,
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
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.hospitalRed,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  addDoctorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  docCard: {
    padding: spacing.md,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.borderLight,
  },
  docNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  docSpec: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.hospitalRed,
    marginTop: 1,
  },
  docQual: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
  },
  detailBox: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  issuesWrap: {
    marginVertical: 4,
  },
  issuesHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  issuesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  issueChip: {
    backgroundColor: colors.hospitalBlueLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  issueChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.hospitalBlue,
  },
  leaveBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs + 4,
    marginTop: spacing.xs + 4,
  },
  leaveBarText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  blockedDaysText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '700',
    marginTop: 1,
  },
  leaveToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  leaveToggleText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
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
  modalNotice: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.hospitalBlueLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  modalNoticeText: {
    flex: 1,
    fontSize: 11,
    color: colors.hospitalBlue,
    lineHeight: 15,
  },
  modalBtnRow: {
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
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.hospitalRed,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
