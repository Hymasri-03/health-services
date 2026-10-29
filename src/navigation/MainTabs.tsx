import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { TabParamList } from './types';
import { useApp } from '../context/AppContext';
import DashboardScreen from '../screens/DashboardScreen';
import RegistrationPortalScreen from '../screens/registration/RegistrationPortalScreen';
import BookingsOrdersScreen from '../screens/bookings/BookingsOrdersScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { providerType, opBookings, homeVisits, pharmacyOrders, isAnyRegistered } = useApp();

  let pendingCount = 0;
  if (providerType === 'hospital') {
    pendingCount = opBookings.filter((b) => b.status === 'pending').length;
  } else if (providerType === 'doctor') {
    pendingCount = homeVisits.filter((v) => v.status === 'pending').length;
  } else {
    pendingCount = pharmacyOrders.filter((o) => o.status === 'pending').length;
  }

  const getBookingsLabel = () => {
    switch (providerType) {
      case 'hospital':
        return 'OP Bookings';
      case 'doctor':
        return 'Consults';
      case 'pharmacy':
        return 'Orders';
      default:
        return 'Bookings';
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          height: 60 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      {/* 1. Live Operations Dashboard (Primary / Default Tab) */}
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Live Operations',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'pulse' : 'pulse-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      {/* 2. Healthcare Category Services & Registration Portals */}
      <Tab.Screen
        name="Register"
        component={RegistrationPortalScreen}
        options={{
          tabBarLabel: isAnyRegistered ? 'Services' : 'Register',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? isAnyRegistered
                    ? 'apps'
                    : 'create'
                  : isAnyRegistered
                  ? 'apps-outline'
                  : 'create-outline'
              }
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="BookingsOrders"
        component={BookingsOrdersScreen}
        options={{
          tabBarLabel: getBookingsLabel(),
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.hospitalBlue,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '800',
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                providerType === 'hospital'
                  ? focused
                    ? 'calendar'
                    : 'calendar-outline'
                  : providerType === 'doctor'
                  ? focused
                    ? 'medkit'
                    : 'medkit-outline'
                  : focused
                  ? 'receipt'
                  : 'receipt-outline'
              }
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
