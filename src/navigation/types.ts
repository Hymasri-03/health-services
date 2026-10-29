import { NavigatorScreenParams } from '@react-navigation/native';
import { HospitalDoctor, OnlineConsultation, PharmacyProduct } from '../types';

export type TabParamList = {
  Register?: { category?: 'hospital' | 'doctor' | 'pharmacy' };
  Home: undefined;
  BookingsOrders: undefined;
  Earnings: undefined;
  Settings: undefined;
  Profile?: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Register?: { category?: 'hospital' | 'doctor' | 'pharmacy' };
  Dashboard: undefined;
  Service: undefined;
  Auth: undefined;
  Account: undefined;
  Profile: undefined;
  RegisterProvider?: { category?: 'hospital' | 'doctor' | 'pharmacy'; initialRole?: 'hospital' | 'doctor' | 'pharmacy' };
  HospitalRegistration?: { mode?: 'dashboard' | 'edit' | 'register' };
  DoctorRegistration?: { doctor?: HospitalDoctor; mode?: 'add' | 'edit' | 'dashboard' | 'register' };
  PharmacyRegistration?: { mode?: 'dashboard' | 'edit' | 'register' };
  RegisterDoctor?: { doctor?: HospitalDoctor; mode?: 'add' | 'edit' };
  HospitalDoctors: undefined;
  AddEditDoctor?: { doctor?: HospitalDoctor };
  HospitalPackages: undefined;
  DoctorConsultations: undefined;
  LiveMeeting?: { consultation?: OnlineConsultation };
  DoctorHomeVisits: undefined;
  PharmacyInventory: undefined;
  PharmacyOrders: undefined;
  Notifications: undefined;
  SupportChat?: { initialTab?: 'faqs' | 'chat' };
  EditProfile: undefined;
};
