import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme/colors';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { RootStackParamList } from '../navigation/types';
import { ProviderType } from '../types';
const HEALTHCARE_CATEGORIES = [
  {
    id: 'hospital' as ProviderType,
    title: 'Hospital',
    badge: 'Super Speciality',
    subtitle: 'Inpatient Admissions, ICU Beds & 24x7 Emergency',
    features: ['CEA Registered', '24x7 Emergency Care', 'Inpatient & ICU Care'],
    icon: 'business' as const,
    color: colors.hospitalRed,
    lightBg: colors.hospitalRedLight,
    borderColor: '#BAE6F9',
  },
  {
    id: 'pharmacy' as ProviderType,
    title: 'Pharmacy',
    badge: 'Retail & Clinical',
    subtitle: 'Form 20/21 Drug Retail, Cold Chain & Fast Delivery',
    features: ['Drug Retail Form 20/21', 'Cold Chain Storage', 'Home Delivery'],
    icon: 'flask' as const,
    color: colors.pharmacyTeal,
    lightBg: colors.pharmacyTealLight,
    borderColor: '#99F6E4',
  },
  {
    id: 'doctor' as ProviderType,
    title: 'Doctor',
    badge: 'Specialist Clinic',
    subtitle: 'OPD Practice, Video Consultations & Home Care',
    features: ['MCI / SMC Registered', 'Live Teleconsult', 'In-Home Care'],
    icon: 'medkit' as const,
    color: colors.doctorBanner,
    lightBg: colors.medicalBlueLight,
    borderColor: '#BFDBFE',
  },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    provider,
    providerType,
    isCategoryRegistered,
    switchProviderMode,
    toggleOnlineAvailability,
    opBookings,
    consultations,
    homeVisits,
    pharmacyOrders,
    inventory,
    earnings,
    unreadNotificationsCount,
    acceptOPBooking,
    acceptHomeVisit,
  } = useApp();

  // Auto-refresh timer: periodic refresh every 120 seconds (updated from 60 seconds)
  const REFRESH_INTERVAL_SECONDS = 120;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      onRefresh();
    }, REFRESH_INTERVAL_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Prevent falling back to registration or auth screens from Home
        return true;
      };
      const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backSub.remove();
    }, [])
  );

  // Bottom navigation height + 16px padding so the last item is fully visible above bottom nav
  const bottomNavHeight = 60 + Math.max(insets.bottom, 8);
  const bottomPadding = bottomNavHeight + 16;

  // Metrics based on provider mode
  let todayCount = 0;
  let pendingCount = 0;
  let completedCount = 0;

  if (providerType === 'hospital') {
    todayCount = opBookings.filter((b) => b.appointmentDate === '2026-10-01' || b.status !== 'cancelled').length;
    pendingCount = opBookings.filter((b) => b.status === 'pending').length;
    completedCount = opBookings.filter((b) => b.status === 'completed').length;
  } else if (providerType === 'doctor') {
    const totalConsults = consultations.length + homeVisits.length;
    todayCount = totalConsults;
    pendingCount = homeVisits.filter((v) => v.status === 'pending').length;
    completedCount =
      consultations.filter((c) => c.status === 'completed').length +
      homeVisits.filter((v) => v.status === 'completed').length;
  } else {
    todayCount = pharmacyOrders.length;
    pendingCount = pharmacyOrders.filter((o) => o.status === 'pending').length;
    completedCount = pharmacyOrders.filter((o) => o.status === 'delivered').length;
  }

  const lowStockCount = inventory.filter((item) => item.stockQuantity <= item.lowStockAlert).length;

  const getProviderThemeColor = () => {
    switch (providerType) {
      case 'hospital':
        return colors.hospitalRed;
      case 'doctor':
        return colors.doctorBanner;
      case 'pharmacy':
        return colors.pharmacyTeal;
      default:
        return colors.primary;
    }
  };

  const currentThemeColor = getProviderThemeColor();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 1. Header: Inside the top header row, on the right side next to the notification icon */}
      <View style={styles.headerBar}>
        <View style={styles.providerInfo}>
          <Pressable
            onPress={() => navigation.navigate('Account')}
            style={styles.avatarWrap}
          >
            {isCategoryRegistered(providerType) ? (
              <Image
                source={{ uri: provider.avatar }}
                style={styles.providerAvatar}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.providerAvatar,
                  {
                    backgroundColor:
                      providerType === 'hospital'
                        ? colors.hospitalRedLight
                        : providerType === 'doctor'
                        ? colors.medicalBlueLight
                        : colors.pharmacyTealLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <Ionicons
                  name={
                    providerType === 'hospital'
                      ? 'business'
                      : providerType === 'doctor'
                      ? 'medkit'
                      : 'flask'
                  }
                  size={20}
                  color={
                    providerType === 'hospital'
                      ? colors.hospitalRed
                      : providerType === 'doctor'
                      ? colors.medicalBlue
                      : colors.pharmacyTeal
                  }
                />
              </View>
            )}
            {/* Online indicator dot on Avatar */}
            <View
              style={[
                styles.avatarOnlineDot,
                { backgroundColor: provider.isOnline ? colors.success : colors.textMuted },
              ]}
            />
          </Pressable>
          <View style={styles.providerNameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.providerTitle} numberOfLines={1}>
                {isCategoryRegistered(providerType)
                  ? provider.name
                  : providerType === 'hospital'
                  ? 'Hospital Services'
                  : providerType === 'doctor'
                  ? 'Doctor Practice'
                  : 'Pharmacy Store'}
              </Text>
              {isCategoryRegistered(providerType) && provider.approvalStatus === 'approved' && (
                <Ionicons name="checkmark-circle" size={15} color={colors.primary} style={{ marginLeft: 3 }} />
              )}
            </View>
            <View style={styles.typeBadgeRow}>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      providerType === 'hospital'
                        ? colors.hospitalRedLight
                        : providerType === 'doctor'
                        ? colors.medicalBlueLight
                        : colors.pharmacyTealLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color:
                        providerType === 'hospital'
                          ? colors.hospitalRed
                          : providerType === 'doctor'
                          ? colors.medicalBlue
                          : colors.pharmacyTeal,
                    },
                  ]}
                >
                  {providerType === 'hospital'
                    ? 'Super Speciality Hospital'
                    : providerType === 'doctor'
                    ? 'Specialist Doctor'
                    : 'Retail & Clinical Pharmacy'}
                </Text>
              </View>

              {/* Fully Accessible Online / Offline Toggle Button */}
              <Pressable
                style={[
                  styles.onlineStatusPill,
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
                accessibilityLabel={`Healthcare Provider is currently ${provider.isOnline ? 'Online' : 'Offline'}. Tap to toggle availability.`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View
                  style={[
                    styles.onlineStatusDot,
                    { backgroundColor: provider.isOnline ? colors.success : colors.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.onlineStatusLabel,
                    { color: provider.isOnline ? '#15803D' : colors.textSecondary },
                  ]}
                >
                  {provider.isOnline ? 'ONLINE' : 'OFFLINE'}
                </Text>
                <Ionicons
                  name={provider.isOnline ? 'checkmark-circle' : 'ellipse-outline'}
                  size={12}
                  color={provider.isOnline ? '#15803D' : colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Top Right Header Actions: Notifications Icon */}
        <View style={styles.headerRightActions}>
          {/* Notifications Icon with Badge */}
          <Pressable
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* 3. Bottom cut-off: Scrollable content with bottom padding equal to bottom navigation height + 16px */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentThemeColor]}
            tintColor={currentThemeColor}
          />
        }
      >
        {/* OneBuddy Medical Brand Showcase Header */}
        <View style={styles.oneBuddyBrandBanner}>
          <View style={styles.oneBuddyLogoWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.oneBuddyLogoImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.oneBuddyBrandTextWrap}>
            <View style={styles.oneBuddyTitleRow}>
              <Text style={styles.oneBuddyTitleOne}>One</Text>
              <Text style={styles.oneBuddyTitleBuddy}>Buddy</Text>
              <Text style={styles.oneBuddyTitleMedical}> Medical</Text>
            </View>
            <View style={styles.oneBuddyTaglineRow}>
              <Text style={styles.oneBuddyTaglineMuted}>One App. Many Services. </Text>
              <Text style={styles.oneBuddyTaglineGreen}>One Buddy.</Text>
            </View>
          </View>
          <View style={styles.oneBuddyStatusBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#16A34A" />
            <Text style={styles.oneBuddyStatusBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* Healthcare Categories in Front & Registration Portals */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesSectionHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="apps" size={16} color={currentThemeColor} />
                <Text style={styles.categoriesSectionTitle}>Healthcare Categories</Text>
              </View>
              <Text style={styles.categoriesSectionSubtitle}>
                Select category to switch active live operations view
              </Text>
            </View>
          </View>

          {/* 3 Categories Showcase Cards */}
          <View style={styles.categoriesGrid}>
            {HEALTHCARE_CATEGORIES.map((cat) => {
              const isActive = providerType === cat.id;
              const isRegistered = isCategoryRegistered(cat.id);
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isActive && {
                      borderColor: cat.color,
                      borderWidth: 2,
                      backgroundColor: '#FFFFFF',
                      shadowColor: cat.color,
                      shadowOpacity: 0.14,
                      shadowRadius: 8,
                      elevation: 4,
                    },
                  ]}
                  onPress={() => switchProviderMode(cat.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Select and activate ${cat.title} healthcare block`}
                >
                  <View style={styles.categoryCardHeader}>
                    <View style={[styles.categoryIconWrap, { backgroundColor: cat.lightBg }]}>
                      <Ionicons name={cat.icon} size={22} color={cat.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.categoryTitleRow}>
                        <Text style={styles.categoryTitle} numberOfLines={1}>{cat.title}</Text>
                        {isActive ? (
                          <View style={[styles.activePillBadge, { backgroundColor: cat.color }]}>
                            <Ionicons name="checkmark-circle" size={11} color="#FFFFFF" />
                            <Text style={styles.activePillText}>ACTIVE PORTAL</Text>
                          </View>
                        ) : (
                          <View style={[styles.categoryBadgePill, { backgroundColor: cat.lightBg }]}>
                            <Text style={[styles.categoryBadgeText, { color: cat.color }]}>
                              {cat.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.categorySubtitle} numberOfLines={2}>
                        {cat.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Highlights feature pills */}
                  <View style={styles.categoryFeaturesRow}>
                    {cat.features.map((feat, idx) => (
                      <View key={idx} style={styles.featureChip}>
                        <View style={[styles.featureDot, { backgroundColor: cat.color }]} />
                        <Text style={styles.featureChipText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action buttons: Switch Category and Open Registered Profile & Fields */}
                  <View style={styles.categoryActionsRow}>
                    <Pressable
                      style={[
                        styles.categorySwitchBtn,
                        { flex: 1 },
                        isActive
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                      onPress={() => switchProviderMode(cat.id)}
                    >
                      <Ionicons
                        name={isActive ? 'radio-button-on' : 'swap-horizontal'}
                        size={14}
                        color={isActive ? '#FFFFFF' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categorySwitchBtnText,
                          isActive && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {isActive ? `Active: ${cat.title}` : `Activate ${cat.title}`}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.categorySwitchBtn,
                        {
                          backgroundColor: cat.lightBg,
                          borderColor: cat.borderColor,
                          paddingHorizontal: 12,
                        },
                      ]}
                      onPress={() => {
                        switchProviderMode(cat.id);
                        const targetScreen =
                          cat.id === 'hospital'
                            ? 'HospitalRegistration'
                            : cat.id === 'doctor'
                            ? 'DoctorRegistration'
                            : 'PharmacyRegistration';
                        navigation.navigate(targetScreen as any, {
                          mode: isRegistered ? 'dashboard' : 'register',
                        });
                      }}
                      accessibilityLabel={
                        isRegistered
                          ? `Open ${cat.title} registered dashboard and fields`
                          : `Register ${cat.title}`
                      }
                    >
                      <Ionicons
                        name={isRegistered ? 'create-outline' : 'create-outline'}
                        size={14}
                        color={cat.color}
                      />
                      <Text
                        style={[
                          styles.categorySwitchBtnText,
                          { color: cat.color, fontWeight: '800' },
                        ]}
                      >
                        {isRegistered ? 'Update Changes' : 'Register'}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Active Category Operations Header */}
        <View style={styles.activeCategoryBar}>
          <View style={[styles.activeCategoryIndicator, { backgroundColor: currentThemeColor }]}>
            <Ionicons
              name={
                providerType === 'hospital'
                  ? 'business'
                  : providerType === 'doctor'
                  ? 'medkit'
                  : 'flask'
              }
              size={13}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.activeCategoryBarTitle}>
            Live Operations & Metrics:{' '}
            <Text style={{ fontWeight: '800', color: currentThemeColor }}>
              {providerType.toUpperCase()}
            </Text>
          </Text>
        </View>


        {/* Summary Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statRow}>
            <StatCard
              label={
                providerType === 'hospital'
                  ? "Today's Bookings"
                  : providerType === 'doctor'
                  ? "Today's Consults"
                  : "Today's Orders"
              }
              value={todayCount}
              icon="calendar-outline"
              color={currentThemeColor}
              changeText="Scheduled Today"
              onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
            />
            <StatCard
              label="Pending Requests"
              value={pendingCount}
              icon="time-outline"
              color={pendingCount > 0 ? colors.warning : colors.textMuted}
              changeText="Needs Attention"
              onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
            />
          </View>

          <View style={styles.statRow}>
            <StatCard
              label="Completed Today"
              value={completedCount}
              icon="checkmark-done-circle-outline"
              color={colors.success}
              changeText="Successfully Settled"
              onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
            />
            <StatCard
              label="Customer Rating"
              value={isCategoryRegistered(providerType) ? `★ ${provider.rating}` : '★ --'}
              icon="star"
              color={colors.accentGold}
              changeText={isCategoryRegistered(providerType) ? `${provider.totalReviews} Reviews` : 'New Provider'}
              onPress={() => navigation.navigate('Account')}
            />
          </View>
        </View>

        {/* Role-Specific Quick Operational Action Bar */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {providerType === 'hospital'
              ? 'Hospital Management'
              : providerType === 'doctor'
              ? 'Doctor Clinical Tools'
              : 'Pharmacy Operations'}
          </Text>
        </View>

        <View style={styles.quickActionsGrid}>
          {providerType === 'hospital' && (
            <>
              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('HospitalDoctors')}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.hospitalRedLight }]}>
                  <Ionicons name="people" size={20} color={colors.hospitalRed} />
                </View>
                <Text style={styles.actionLabel}>Manage Doctors</Text>
                <Text style={styles.actionSubLabel}>Slots & Fees</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="clipboard" size={20} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>OP Bookings</Text>
                <Text style={styles.actionSubLabel}>{opBookings.length} total</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('HospitalPackages')}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.hospitalBlueLight }]}>
                  <Ionicons name="cube-outline" size={20} color={colors.hospitalBlue} />
                </View>
                <Text style={styles.actionLabel}>Health Packages</Text>
                <Text style={styles.actionSubLabel}>Promos & Deals</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('Main', { screen: 'Earnings' } as any)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.accentGoldLight }]}>
                  <Ionicons name="wallet-outline" size={20} color={colors.accentGold} />
                </View>
                <Text style={styles.actionLabel}>Payouts</Text>
                <Text style={styles.actionSubLabel}>₹50 flat fee</Text>
              </Pressable>
            </>
          )}

          {providerType === 'doctor' && (
            <>
              <Pressable
                style={styles.actionItem}
                onPress={() => {
                  const upcoming = consultations.find((c) => c.status === 'upcoming') || consultations[0];
                  if (upcoming) {
                    navigation.navigate('LiveMeeting', { consultation: upcoming });
                  }
                }}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.medicalBlueLight }]}>
                  <Ionicons name="videocam" size={20} color={colors.medicalBlue} />
                </View>
                <Text style={styles.actionLabel}>Join Meeting</Text>
                <Text style={styles.actionSubLabel}>Video Consult</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="car-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>Home Visits</Text>
                <Text style={styles.actionSubLabel}>{homeVisits.length} visits</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.purpleLight }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.purple} />
                </View>
                <Text style={styles.actionLabel}>Prescriptions</Text>
                <Text style={styles.actionSubLabel}>Rx Builder</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('Account')}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.infoLight }]}>
                  <Ionicons name="time-outline" size={20} color={colors.info} />
                </View>
                <Text style={styles.actionLabel}>Set Hours</Text>
                <Text style={styles.actionSubLabel}>Fee & Radius</Text>
              </Pressable>
            </>
          )}

          {providerType === 'pharmacy' && (
            <>
              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('PharmacyInventory')}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.pharmacyTealLight }]}>
                  <Ionicons name="cube-outline" size={20} color={colors.pharmacyTeal} />
                </View>
                <Text style={styles.actionLabel}>Inventory</Text>
                <Text style={styles.actionSubLabel}>{inventory.length} items</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.actionLabel}>Deliveries</Text>
                <Text style={styles.actionSubLabel}>{pharmacyOrders.length} orders</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('PharmacyInventory')}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: lowStockCount > 0 ? colors.dangerLight : colors.borderLight },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={lowStockCount > 0 ? colors.danger : colors.textMuted}
                  />
                </View>
                <Text style={styles.actionLabel}>Low Stock</Text>
                <Text style={styles.actionSubLabel}>{lowStockCount} urgent</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: colors.infoLight }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.info} />
                </View>
                <Text style={styles.actionLabel}>Verify Rx</Text>
                <Text style={styles.actionSubLabel}>Substitutions</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Dynamic Upcoming Section based on Active Provider Role */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {providerType === 'hospital'
              ? 'Incoming OP Bookings'
              : providerType === 'doctor'
              ? 'Upcoming Appointments'
              : 'Incoming Medicine Orders'}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
          >
            <Text style={[styles.viewAllLink, { color: currentThemeColor }]}>View All</Text>
          </Pressable>
        </View>

        {/* Hospital View: OP Bookings */}
        {providerType === 'hospital' && (
          <View style={styles.cardsList}>
            {opBookings.slice(0, 3).map((b) => (
              <Card key={b.id} style={styles.bookingCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.patientMeta}>
                    <Text style={styles.patientName}>{b.patientName}</Text>
                    <Text style={styles.patientSub}>
                      {b.patientAge} yrs • {b.patientGender} • {b.patientPhone}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      b.status === 'pending'
                        ? { backgroundColor: colors.warningLight }
                        : b.status === 'accepted'
                        ? { backgroundColor: colors.primaryLight }
                        : { backgroundColor: colors.infoLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        b.status === 'pending'
                          ? { color: colors.warning }
                          : b.status === 'accepted'
                          ? { color: colors.primary }
                          : { color: colors.info },
                      ]}
                    >
                      {b.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.doctorInfoRow}>
                  <Ionicons name="medkit-outline" size={14} color={colors.hospitalRed} />
                  <Text style={styles.doctorInfoText}>
                    Doctor: <Text style={{ fontWeight: '700' }}>{b.doctorName}</Text> ({b.doctorSpecialization})
                  </Text>
                </View>

                <View style={styles.problemBox}>
                  <Text style={styles.problemLabel}>Problem Description:</Text>
                  <Text style={styles.problemText}>{b.problemDescription}</Text>
                </View>

                <View style={styles.slotFeeRow}>
                  <View style={styles.slotWrap}>
                    <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.slotText}>
                      {b.appointmentDate} at {b.timeSlot}
                    </Text>
                  </View>
                  <Text style={styles.feeBreakdownText}>
                    Fee: ₹{b.fee} - ₹50 = <Text style={styles.netAmountText}>₹{b.netPayout} Net</Text>
                  </Text>
                </View>

                {b.status === 'pending' && (
                  <View style={styles.cardActionRow}>
                    <Pressable
                      style={styles.acceptBtn}
                      onPress={() => {
                        acceptOPBooking(b.id);
                      }}
                    >
                      <Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.acceptBtnText}>Accept Booking</Text>
                    </Pressable>
                    <Pressable
                      style={styles.viewMoreBtn}
                      onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
                    >
                      <Text style={styles.viewMoreBtnText}>Manage</Text>
                    </Pressable>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Doctor View: Consultations & Home Visits */}
        {providerType === 'doctor' && (
          <View style={styles.cardsList}>
            {consultations.slice(0, 2).map((c) => (
              <Card key={c.id} style={styles.bookingCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.patientMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.patientName}>{c.patientName}</Text>
                      <View style={styles.onlineBadge}>
                        <Ionicons name="videocam" size={11} color={colors.medicalBlue} />
                        <Text style={styles.onlineBadgeText}>Online Video</Text>
                      </View>
                    </View>
                    <Text style={styles.patientSub}>
                      {c.patientAge} yrs • {c.patientGender} • {c.patientPhone}
                    </Text>
                  </View>
                  <Text style={styles.netAmountText}>₹{c.netPayout} Net</Text>
                </View>

                <View style={styles.problemBox}>
                  <Text style={styles.problemLabel}>Reason for Consult:</Text>
                  <Text style={styles.problemText}>{c.problemDescription}</Text>
                </View>

                <View style={styles.slotFeeRow}>
                  <View style={styles.slotWrap}>
                    <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.slotText}>
                      {c.date} at {c.timeSlot}
                    </Text>
                  </View>
                  <Text style={styles.feeBreakdownText}>Fee: ₹{c.fee} (-₹50 platform fee)</Text>
                </View>

                <View style={styles.cardActionRow}>
                  <Pressable
                    style={[styles.acceptBtn, { backgroundColor: colors.medicalBlue }]}
                    onPress={() => navigation.navigate('LiveMeeting', { consultation: c })}
                  >
                    <Ionicons name="videocam" size={15} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Join Video Consult</Text>
                  </Pressable>
                  <Pressable
                    style={styles.viewMoreBtn}
                    onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
                  >
                    <Text style={styles.viewMoreBtnText}>View Rx</Text>
                  </Pressable>
                </View>
              </Card>
            ))}

            {/* Also show Home Visits */}
            {homeVisits.slice(0, 1).map((v) => (
              <Card key={v.id} style={styles.bookingCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.patientMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.patientName}>{v.patientName}</Text>
                      <View style={[styles.onlineBadge, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="car" size={11} color={colors.primary} />
                        <Text style={[styles.onlineBadgeText, { color: colors.primary }]}>
                          Home Visit ({v.distanceKm} km)
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.patientSub}>{v.address}</Text>
                  </View>
                  <Text style={styles.netAmountText}>₹{v.netPayout} Net</Text>
                </View>

                <View style={styles.problemBox}>
                  <Text style={styles.problemLabel}>Patient Condition:</Text>
                  <Text style={styles.problemText}>{v.problemDescription}</Text>
                </View>

                {v.status === 'pending' && (
                  <View style={styles.cardActionRow}>
                    <Pressable
                      style={styles.acceptBtn}
                      onPress={() => {
                        acceptHomeVisit(v.id);
                      }}
                    >
                      <Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.acceptBtnText}>Accept Visit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.viewMoreBtn}
                      onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
                    >
                      <Text style={styles.viewMoreBtnText}>Details</Text>
                    </Pressable>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Pharmacy View: Delivery Orders */}
        {providerType === 'pharmacy' && (
          <View style={styles.cardsList}>
            {pharmacyOrders.slice(0, 3).map((o) => (
              <Card key={o.id} style={styles.bookingCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.patientMeta}>
                    <Text style={styles.patientName}>{o.customerName}</Text>
                    <Text style={styles.patientSub}>
                      {o.items.length} items • {o.deliveryAddress}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      o.prescriptionStatus === 'pending'
                        ? { backgroundColor: colors.warningLight }
                        : { backgroundColor: colors.pharmacyTealLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        o.prescriptionStatus === 'pending'
                          ? { color: colors.warning }
                          : { color: colors.pharmacyTeal },
                      ]}
                    >
                      {o.prescriptionStatus === 'pending' ? 'Rx Verification' : o.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.medicineListPreview}>
                  {o.items.map((item, idx) => (
                    <Text key={idx} style={styles.medItemLine} numberOfLines={1}>
                      • {item.name} ({item.formula}) x {item.quantity} - ₹{item.price}
                    </Text>
                  ))}
                </View>

                <View style={styles.slotFeeRow}>
                  <View style={styles.slotWrap}>
                    <Ionicons name="bicycle-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.slotText}>ETA: {o.etaMinutes || 30} mins</Text>
                  </View>
                  <Text style={styles.feeBreakdownText}>
                    Order: ₹{o.totalAmount} (-₹50 platform fee) = <Text style={styles.netAmountText}>₹{o.netPayout} Net</Text>
                  </Text>
                </View>

                <View style={styles.cardActionRow}>
                  <Pressable
                    style={[styles.acceptBtn, { backgroundColor: colors.pharmacyTeal }]}
                    onPress={() => navigation.navigate('Main', { screen: 'BookingsOrders' } as any)}
                  >
                    <Ionicons name="receipt-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Process Order & Rx</Text>
                  </Pressable>
                  <Pressable
                    style={styles.viewMoreBtn}
                    onPress={() => navigation.navigate('PharmacyInventory')}
                  >
                    <Text style={styles.viewMoreBtnText}>Check Stock</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // 1. Header Row
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  providerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  providerNameBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 3,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    justifyContent: 'center',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  onlineStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 3.5,
    justifyContent: 'center',
  },
  onlineStatusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  onlineStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    paddingHorizontal: 3,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  // 3. Scrollable content area
  scrollContent: {
    paddingHorizontal: 16, // full width with 16px side padding
  },
  categoriesSection: {
    width: '100%',
    marginTop: 12,
    marginBottom: spacing.md,
  },
  categoriesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoriesSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  categoriesSectionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  categoriesGrid: {
    gap: 10,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  categoryTitle: {
    flex: 1,
    marginRight: 6,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  categorySubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  activePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.full,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  categoryBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  categoryFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  featureChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  categorySwitchBtn: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    gap: 5,
    borderWidth: 1,
  },
  categorySwitchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryRegisterBtn: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    gap: 4,
    borderWidth: 1,
  },
  categoryRegisterBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  activeCategoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  activeCategoryIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCategoryBarTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  statsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  actionItem: {
    flex: 1,
    minHeight: 96,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  actionSubLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  cardsList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  bookingCard: {
    padding: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  patientSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  doctorInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  problemBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginVertical: 6,
  },
  problemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  problemText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  slotFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  slotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  feeBreakdownText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  netAmountText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewMoreBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  viewMoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  medicineListPreview: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginVertical: 6,
  },
  medItemLine: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 1,
  },
  // OneBuddy Medical Brand Banner
  oneBuddyBrandBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2F7C9',
    shadowColor: '#5AB31C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  oneBuddyLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    shadowColor: '#5AB31C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
    marginRight: 10,
  },
  oneBuddyLogoImg: {
    width: 30,
    height: 30,
  },
  oneBuddyBrandTextWrap: {
    flex: 1,
  },
  oneBuddyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oneBuddyTitleOne: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
  },
  oneBuddyTitleBuddy: {
    fontSize: 17,
    fontWeight: '900',
    color: '#5AB31C',
    letterSpacing: -0.3,
  },
  oneBuddyTitleMedical: {
    fontSize: 17,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: -0.3,
  },
  oneBuddyTaglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  oneBuddyTaglineMuted: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  oneBuddyTaglineGreen: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5AB31C',
  },
  oneBuddyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  oneBuddyStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.3,
  },
});
