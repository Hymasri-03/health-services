import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { ProviderType } from '../../types';
import { useApp } from '../../context/AppContext';
import HospitalRegistrationScreen from '../hospital/HospitalRegistrationScreen';
import DoctorRegistrationScreen from '../doctor/DoctorRegistrationScreen';
import PharmacyRegistrationScreen from '../pharmacy/PharmacyRegistrationScreen';

type RegistrationPortalRouteProp = RouteProp<TabParamList, 'Register'>;

const PORTAL_CATEGORIES: { id: ProviderType; label: string; icon: any; color: string }[] = [
  { id: 'hospital', label: 'Hospital', icon: 'business', color: '#0094D4' },
  { id: 'doctor', label: 'Doctor', icon: 'medkit', color: '#2563EB' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'flask', color: '#0D9488' },
];

export default function RegistrationPortalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList> & BottomTabNavigationProp<TabParamList>>();
  const route = useRoute<RegistrationPortalRouteProp>();
  const { providerType, switchProviderMode, isCategoryRegistered, isAnyRegistered } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<ProviderType>(
    (route.params?.category || providerType || 'hospital') as ProviderType
  );

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home');
        }
        return true;
      };
      const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backSub.remove();
    }, [navigation])
  );

  const handleSelectCategory = (cat: ProviderType) => {
    setSelectedCategory(cat);
    switchProviderMode(cat);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Category Switcher Tabs */}
      <View style={styles.categorySwitcherBar}>
        <View style={styles.switcherHeaderRow}>
          <Text style={styles.switcherTitle}>
            {isAnyRegistered ? 'Healthcare Services & Facilities' : 'Healthcare Provider Onboarding'}
          </Text>
          <Text style={styles.switcherSubtitle}>
            {isAnyRegistered
              ? 'Select category to review live facility status or update changes'
              : 'Select category to begin regulatory onboarding and compliance setup'}
          </Text>
        </View>
        <View style={styles.pillsContainer}>
          {PORTAL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const isRegistered = isCategoryRegistered(cat.id);

            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => handleSelectCategory(cat.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons
                  name={cat.icon}
                  size={15}
                  color={isSelected ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
                {isRegistered && (
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={isSelected ? '#FFFFFF' : '#16A34A'}
                    style={{ marginLeft: 2 }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.formContainer}>
        {selectedCategory === 'hospital' && (
          <HospitalRegistrationScreen
            embedded={true}
            onSwitchToDashboard={() => navigation.navigate('Home')}
          />
        )}
        {selectedCategory === 'pharmacy' && (
          <PharmacyRegistrationScreen
            embedded={true}
            onSwitchToDashboard={() => navigation.navigate('Home')}
          />
        )}
        {selectedCategory === 'doctor' && (
          <DoctorRegistrationScreen
            embedded={true}
            onSwitchToDashboard={() => navigation.navigate('Home')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  categorySwitcherBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  switcherHeaderRow: {
    marginBottom: 10,
  },
  switcherTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  switcherSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
