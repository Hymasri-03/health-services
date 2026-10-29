import React, { useCallback, useState } from 'react';
import {
  Alert,
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
import { useApp } from '../../context/AppContext';
import { colors, radius, spacing } from '../../theme/colors';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import { MedicalTransaction } from '../../types';

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { provider, earnings, transactions, requestPayout } = useApp();

  const bottomNavHeight = 60 + Math.max(insets.bottom, 8);
  const bottomPadding = bottomNavHeight + 16;

  const [periodTab, setPeriodTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(String(earnings.pendingPayout));

  const filteredTransactions = transactions.filter((t) => {
    if (selectedTypeFilter === 'all') return true;
    return t.type === selectedTypeFilter;
  });

  const handleWithdraw = () => {
    const cleanAmount = withdrawAmount.replace(/[^0-9.]/g, '');
    const amt = parseFloat(cleanAmount);
    if (!cleanAmount || isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount to withdraw.');
      return;
    }

    if (amt > earnings.pendingPayout) {
      Alert.alert(
        'Insufficient Balance',
        `The requested amount of ₹${amt.toLocaleString('en-IN')} exceeds your available eligible balance of ₹${earnings.pendingPayout.toLocaleString('en-IN')}.`
      );
      return;
    }

    const success = requestPayout(amt);
    if (success) {
      setWithdrawModalVisible(false);
      Alert.alert(
        'Disbursal Initiated Successfully',
        `₹${amt.toLocaleString('en-IN')} has been requested for direct settlement to ${provider.bankDetails?.bankName || 'Verified Bank'} (A/C ••••${(provider.bankDetails?.accountNumber || '1234').slice(-4)}).\n\nFunds will be credited via IMPS/NEFT within 2-4 hours.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Withdrawal Failed', 'Could not process payout. Please check your balance and try again.');
    }
  };

  const handleDownloadStatement = () => {
    // Statement processed directly
  };

  const handleGoBack = useCallback(() => {
    if (withdrawModalVisible) {
      setWithdrawModalVisible(false);
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
  }, [navigation, withdrawModalVisible]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleGoBack);
      return () => sub.remove();
    }, [handleGoBack])
  );

  const renderTransactionItem = ({ item }: { item: MedicalTransaction }) => {
    const isWithdrawal = item.type === 'bank_withdrawal';

    return (
      <Card style={styles.txnCard}>
        <View style={styles.txnRow}>
          <View
            style={[
              styles.txnIconWrap,
              isWithdrawal
                ? { backgroundColor: colors.purpleLight }
                : item.type === 'op_booking'
                ? { backgroundColor: colors.hospitalRedLight }
                : item.type === 'consultation'
                ? { backgroundColor: colors.medicalBlueLight }
                : { backgroundColor: colors.pharmacyTealLight },
            ]}
          >
            <Ionicons
              name={
                isWithdrawal
                  ? 'business-outline'
                  : item.type === 'op_booking'
                  ? 'people-outline'
                  : item.type === 'consultation'
                  ? 'videocam-outline'
                  : 'receipt-outline'
              }
              size={18}
              color={
                isWithdrawal
                  ? colors.purple
                  : item.type === 'op_booking'
                  ? colors.hospitalRed
                  : item.type === 'consultation'
                  ? colors.medicalBlue
                  : colors.pharmacyTeal
              }
            />
          </View>

          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.titleRow}>
              <Text style={styles.txnTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text
                style={[
                  styles.txnAmount,
                  isWithdrawal ? { color: colors.textSecondary } : { color: colors.success },
                ]}
              >
                {isWithdrawal ? `-₹${Math.abs(item.netPayout)}` : `+₹${item.netPayout}`}
              </Text>
            </View>

            <Text style={styles.serviceDesc}>{item.serviceDescription}</Text>
            <Text style={styles.patientLine}>Patient: {item.patientName}</Text>

            {/* Flat ₹50 fee breakdown if not withdrawal */}
            {!isWithdrawal && (
              <View style={styles.feeBreakdownRow}>
                <Text style={styles.feeBreakdownText}>
                  Gross: ₹{item.grossAmount} | Platform Fee: <Text style={{ color: colors.danger }}>-₹50</Text> | Net: <Text style={{ color: colors.success, fontWeight: '700' }}>₹{item.netPayout}</Text>
                </Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.dateText}>{item.date}</Text>
              <View
                style={[
                  styles.statusPill,
                  item.status === 'settled'
                    ? { backgroundColor: colors.successLight }
                    : item.status === 'processing'
                    ? { backgroundColor: colors.purpleLight }
                    : { backgroundColor: colors.warningLight },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    item.status === 'settled'
                      ? { color: colors.success }
                      : item.status === 'processing'
                      ? { color: colors.purple }
                      : { color: colors.warning },
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.screenHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={handleGoBack}
          accessibilityLabel="Back to Previous"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.screenTitle} numberOfLines={1}>Earnings & Payouts</Text>
          <Text style={styles.screenSubtitle} numberOfLines={1}>Transparent breakdown & automated bank disbursal</Text>
        </View>
        <Pressable style={styles.downloadBtn} onPress={handleDownloadStatement}>
          <Ionicons name="download-outline" size={16} color={colors.primary} />
          <Text style={styles.downloadBtnText}>Statement</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Tabs: Daily | Weekly | Monthly */}
        <View style={styles.periodTabsRow}>
          {(['daily', 'weekly', 'monthly'] as const).map((tab) => {
            const active = periodTab === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.periodTab, active && styles.periodTabActive]}
                onPress={() => setPeriodTab(tab)}
              >
                <Text style={[styles.periodTabText, active && styles.periodTabTextActive]}>
                  {tab.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Big Earnings Hero Card */}
        <Card style={styles.heroCard} padding="lg">
          <Text style={styles.heroLabel}>
            {periodTab === 'daily'
              ? "Today's Net Payout"
              : periodTab === 'weekly'
              ? 'This Week Net Payout'
              : 'This Month Net Payout'}
          </Text>
          <Text style={styles.heroAmount}>
            ₹
            {periodTab === 'daily'
              ? earnings.todayEarnings.toLocaleString('en-IN')
              : periodTab === 'weekly'
              ? earnings.weeklyEarnings.toLocaleString('en-IN')
              : earnings.monthlyEarnings.toLocaleString('en-IN')}
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.pendingLabel}>Eligible for Bank Settlement</Text>
              <Text style={styles.pendingAmount}>
                ₹{earnings.pendingPayout.toLocaleString('en-IN')}
              </Text>
            </View>

            <Pressable
              style={styles.requestPayoutBtn}
              onPress={() => {
                if (earnings.pendingPayout <= 0) {
                  Alert.alert(
                    'No Available Balance',
                    'Your eligible settlement balance is currently ₹0. Once appointments or medicine orders are completed, funds will become available for withdrawal.'
                  );
                  return;
                }
                setWithdrawAmount(String(earnings.pendingPayout));
                setWithdrawModalVisible(true);
              }}
            >
              <Ionicons name="card-outline" size={15} color="#FFFFFF" />
              <Text style={styles.requestPayoutText}>Withdraw to Bank</Text>
            </Pressable>
          </View>
        </Card>

        {/* Platform Fee Transparent Guarantee Card */}
        <Card style={styles.feeNoticeCard} padding="md">
          <View style={styles.feeNoticeRow}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.feeNoticeTitle}>Flat ₹50 Platform Fee Structure</Text>
              <Text style={styles.feeNoticeText}>
                One Buddy Medical operates on zero percentage commissions. A flat ₹50 fee is deducted per completed booking or order, leaving 100% of your remaining charges as your net payout.
              </Text>
            </View>
          </View>
        </Card>

        {/* Registered Bank Account Summary */}
        <Card style={styles.bankCard} padding="md">
          <View style={styles.bankRow}>
            <View style={styles.bankIconWrap}>
              <Ionicons name="business" size={20} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankTitle}>{provider.bankDetails.bankName}</Text>
              <Text style={styles.bankSub}>
                A/C: ••••{provider.bankDetails.accountNumber.slice(-4)} • IFSC: {provider.bankDetails.ifscCode}
              </Text>
              <Text style={styles.bankHolder}>Beneficiary: {provider.bankDetails.accountName}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </Card>

        {/* Transaction History Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Transaction & Settlement History</Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'op_booking', label: 'OP Bookings' },
            { id: 'consultation', label: 'Consults' },
            { id: 'medicine_order', label: 'Medicine Orders' },
            { id: 'bank_withdrawal', label: 'Withdrawals' },
          ].map((c) => {
            const active = selectedTypeFilter === c.id;
            return (
              <Pressable
                key={c.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedTypeFilter(c.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Transactions List */}
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {filteredTransactions.map((tx) => (
            <View key={tx.id}>{renderTransactionItem({ item: tx })}</View>
          ))}
        </View>
      </ScrollView>

      {/* Bank Withdrawal Modal */}
      <Modal visible={withdrawModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Bank Settlement</Text>
              <Pressable onPress={() => setWithdrawModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalBalanceBox}>
              <Text style={styles.modalBalanceLabel}>Available Eligible Balance</Text>
              <Text style={styles.modalBalanceAmount}>
                ₹{earnings.pendingPayout.toLocaleString('en-IN')}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Payout Amount (₹)</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputCurrencyPrefix}>₹</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={(text) => setWithdrawAmount(text.replace(/[^0-9.]/g, ''))}
                placeholder="Enter amount"
                placeholderTextColor={colors.textMuted}
              />
              {withdrawAmount.length > 0 && (
                <Pressable onPress={() => setWithdrawAmount('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Quick Amount Selector Chips */}
            <View style={styles.quickAmountsRow}>
              {[
                { label: 'Full Balance', value: earnings.pendingPayout },
                { label: '₹1,000', value: 1000 },
                { label: '₹2,500', value: 2500 },
                { label: '₹5,000', value: 5000 },
              ]
                .filter((p) => p.value <= earnings.pendingPayout && p.value > 0)
                .map((p, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.quickAmountChip,
                      String(p.value) === withdrawAmount.replace(/[^0-9.]/g, '') &&
                        styles.quickAmountChipActive,
                    ]}
                    onPress={() => setWithdrawAmount(String(p.value))}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        String(p.value) === withdrawAmount.replace(/[^0-9.]/g, '') &&
                          styles.quickAmountTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
            </View>

            {/* Dynamic Remaining Balance */}
            {(() => {
              const parsed = parseFloat(withdrawAmount.replace(/[^0-9.]/g, '')) || 0;
              const remaining = Math.max(0, earnings.pendingPayout - parsed);
              const isOver = parsed > earnings.pendingPayout;
              return (
                <Text
                  style={[
                    styles.remainingBalanceText,
                    isOver && { color: colors.danger, fontWeight: '700' },
                  ]}
                >
                  {isOver
                    ? `⚠️ Amount exceeds balance by ₹${(parsed - earnings.pendingPayout).toLocaleString('en-IN')}`
                    : `Remaining balance after payout: ₹${remaining.toLocaleString('en-IN')}`}
                </Text>
              );
            })()}

            <View style={styles.destBankBox}>
              <Text style={styles.destBankLabel}>Destination Bank Account:</Text>
              <Text style={styles.destBankName}>{provider.bankDetails.bankName}</Text>
              <Text style={styles.destBankDetails}>
                Account: {provider.bankDetails.accountNumber} • IFSC: {provider.bankDetails.ifscCode}
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setWithdrawModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={handleWithdraw}>
                <Text style={styles.submitBtnText}>Confirm Disbursal</Text>
              </Pressable>
            </View>
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
    justifyContent: 'space-between',
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
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  downloadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110,
  },
  periodTabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  periodTabActive: {
    backgroundColor: colors.secondary,
  },
  periodTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  periodTabTextActive: {
    color: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: colors.secondary,
    marginBottom: spacing.md,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: spacing.md,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
    marginTop: 2,
  },
  requestPayoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  requestPayoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feeNoticeCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark + '30',
    marginBottom: spacing.md,
  },
  feeNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  feeNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  feeNoticeText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  bankCard: {
    marginBottom: spacing.md,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bankIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  bankSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  bankHolder: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  sectionHeaderRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  txnCard: {
    padding: spacing.md,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  txnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  txnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  serviceDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  patientLine: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  feeBreakdownRow: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.xs,
    marginVertical: 4,
  },
  feeBreakdownText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
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
  modalBalanceBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  modalBalanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  modalBalanceAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  inputCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textSecondary,
    marginRight: 4,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  quickAmountChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAmountChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickAmountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  quickAmountTextActive: {
    color: '#FFFFFF',
  },
  remainingBalanceText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  destBankBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  destBankLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  destBankName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  destBankDetails: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
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
    backgroundColor: colors.primary,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
