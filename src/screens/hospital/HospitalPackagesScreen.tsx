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
import { HealthPackage } from '../../types';

export default function HospitalPackagesScreen() {
  const navigation = useNavigation();
  const { packages, addHealthPackage } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('2999');
  const [discountedPrice, setDiscountedPrice] = useState('1499');
  const [testsIncluded, setTestsIncluded] = useState('CBC, Lipid Profile, Thyroid TSH, Blood Sugar Fasting, ECG');
  const [validity, setValidity] = useState('Valid for 30 days from purchase');

  const handleCreate = () => {
    if (!title.trim()) {
      return;
    }

    addHealthPackage({
      title,
      description: description || 'Complete health evaluation by senior specialists.',
      originalPrice: parseInt(originalPrice, 10) || 2000,
      discountedPrice: parseInt(discountedPrice, 10) || 999,
      testsIncluded: testsIncluded.split(',').map((t) => t.trim()).filter(Boolean),
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
      validity,
    });

    setModalVisible(false);
  };

  const renderPackageItem = ({ item }: { item: HealthPackage }) => {
    const discountPercent = Math.round(
      ((item.originalPrice - item.discountedPrice) / item.originalPrice) * 100,
    );

    return (
      <Card style={styles.pkgCard}>
        <Image source={{ uri: item.image }} style={styles.pkgBannerImage} />
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.pkgTitle}>{item.title}</Text>
            <View
              style={[
                styles.approvalBadge,
                item.approvalStatus === 'approved'
                  ? { backgroundColor: colors.successLight }
                  : item.approvalStatus === 'pending'
                  ? { backgroundColor: colors.warningLight }
                  : { backgroundColor: colors.dangerLight },
              ]}
            >
              <Text
                style={[
                  styles.approvalBadgeText,
                  item.approvalStatus === 'approved'
                    ? { color: colors.success }
                    : item.approvalStatus === 'pending'
                    ? { color: colors.warning }
                    : { color: colors.danger },
                ]}
              >
                {item.approvalStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.pkgDesc}>{item.description}</Text>

          <View style={styles.pricingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.discountedPrice}>₹{item.discountedPrice}</Text>
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            </View>
            <View style={styles.discountPill}>
              <Text style={styles.discountPillText}>{discountPercent}% OFF</Text>
            </View>
          </View>

          <View style={styles.testsBox}>
            <Text style={styles.testsTitle}>Included Diagnostics & Tests ({item.testsIncluded.length}):</Text>
            <View style={styles.testsChipsWrap}>
              {item.testsIncluded.map((test, idx) => (
                <View key={idx} style={styles.testChip}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                  <Text style={styles.testChipText}>{test}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.validityRow}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.validityText}>{item.validity}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
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
          <Text style={styles.headerTitle} numberOfLines={1}>Promotional Health Packages</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Deals displayed on One Buddy Customer Home</Text>
        </View>
        <Pressable style={styles.createBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Create Package</Text>
        </Pressable>
      </View>

      {/* Package List */}
      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        renderItem={renderPackageItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Package Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Health Package Banner</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Package Title</Text>
              <TextInput
                style={styles.modalInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Master Heart & Lipid Checkup"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                multiline
                value={description}
                onChangeText={setDescription}
                placeholder="Brief summary of who should book this package..."
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Original Price (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={originalPrice}
                    onChangeText={setOriginalPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Offer Price (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={discountedPrice}
                    onChangeText={setDiscountedPrice}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Tests Included (comma-separated)</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                multiline
                value={testsIncluded}
                onChangeText={setTestsIncluded}
                placeholder="e.g. CBC, Lipid Profile, Thyroid TSH, Fasting Blood Sugar"
              />

              <Text style={styles.inputLabel}>Validity Period</Text>
              <TextInput
                style={styles.modalInput}
                value={validity}
                onChangeText={setValidity}
                placeholder="e.g. Valid until 31st Oct 2026"
              />

              <View style={styles.noticeBox}>
                <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                <Text style={styles.noticeText}>
                  All hospital promotional packages are verified by One Buddy Admin before going live on the customer home page.
                </Text>
              </View>

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.submitBtn} onPress={handleCreate}>
                  <Text style={styles.submitBtnText}>Submit for Review</Text>
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
  headerBar: {
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.hospitalBlue,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  createBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  pkgCard: {
    overflow: 'hidden',
    padding: 0,
  },
  pkgBannerImage: {
    width: '100%',
    height: 140,
    backgroundColor: colors.borderLight,
  },
  cardBody: {
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  pkgTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  approvalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  approvalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pkgDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 4,
    lineHeight: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: colors.hospitalRedLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  discountPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.hospitalRed,
  },
  testsBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginVertical: 6,
  },
  testsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  testsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  testChipText: {
    fontSize: 11,
    color: colors.text,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  validityText: {
    fontSize: 11,
    color: colors.textMuted,
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
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
  noticeBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.hospitalBlueLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  noticeText: {
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
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.hospitalBlue,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
