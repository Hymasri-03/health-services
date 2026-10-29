import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import {
  ApprovalStatus,
  BankDetails,
  ChatMessage,
  ConsultationStatus,
  DigitalPrescription,
  HealthPackage,
  HomeVisitRequest,
  HomeVisitStatus,
  HospitalDoctor,
  MedicalEarningsSummary,
  MedicalNotification,
  MedicalProvider,
  MedicalTransaction,
  OnlineConsultation,
  OPBooking,
  OPBookingStatus,
  PharmacyOrder,
  PharmacyOrderStatus,
  PharmacyProduct,
  ProviderType,
  SupportFAQ,
} from '../types';
import {
  initialFAQs,
  initialHealthPackages,
  initialHomeVisits,
  initialHospitalDoctors,
  initialNotifications,
  initialOnlineConsultations,
  initialOPBookings,
  initialPharmacyOrders,
  initialPharmacyProducts,
  initialTransactions,
  mockDoctorProvider,
  mockHospitalProvider,
  mockPharmacyProvider,
} from '../data/mockMedicalData';

interface AppContextValue {
  // Provider Profile & Mode Switcher
  provider: MedicalProvider;
  providerType: ProviderType;
  hospitalProfile: MedicalProvider;
  doctorProfile: MedicalProvider;
  pharmacyProfile: MedicalProvider;
  registeredCategories: Record<ProviderType, boolean>;
  isAnyRegistered: boolean;
  isCategoryRegistered: (type: ProviderType) => boolean;
  setCategoryRegistered: (type: ProviderType, registered: boolean) => void;
  resetAllRegistrations: () => void;
  switchProviderMode: (type: ProviderType) => void;
  toggleOnlineAvailability: () => void;
  updateProviderProfile: (data: Partial<MedicalProvider>) => void;
  updateBankDetails: (data: Partial<BankDetails>) => void;
  loginWithPhone: (phone: string, otp: string) => boolean;
  registerProvider: (data: Partial<MedicalProvider>) => void;
  logout: () => void;

  // Hospital: Doctors, OP Bookings, Health Packages
  doctors: HospitalDoctor[];
  addDoctor: (doc: Omit<HospitalDoctor, 'id' | 'hospitalId'>) => void;
  updateDoctor: (id: string, doc: Partial<HospitalDoctor>) => void;
  deleteDoctor: (id: string) => void;
  toggleDoctorLeave: (doctorId: string, date: string) => void;
  opBookings: OPBooking[];
  acceptOPBooking: (id: string) => void;
  rescheduleOPBooking: (id: string, newDate: string, newSlot: string) => void;
  cancelOPBooking: (id: string, reason?: string) => void;
  updateOPStatus: (id: string, status: OPBookingStatus) => void;
  packages: HealthPackage[];
  addHealthPackage: (pkg: Omit<HealthPackage, 'id' | 'hospitalId' | 'approvalStatus'>) => void;
  updateHealthPackage: (id: string, pkg: Partial<HealthPackage>) => void;

  // Doctor: Consultations & Home Visits
  consultations: OnlineConsultation[];
  uploadPrescription: (
    consultationId: string,
    rx: Omit<DigitalPrescription, 'id' | 'consultationId' | 'date'>,
  ) => void;
  updateConsultationStatus: (id: string, status: ConsultationStatus, notes?: string) => void;
  homeVisits: HomeVisitRequest[];
  acceptHomeVisit: (id: string) => void;
  declineHomeVisit: (id: string) => void;
  updateHomeVisitStatus: (id: string, status: HomeVisitStatus, notes?: string) => void;

  // Pharmacy: Inventory & Orders
  inventory: PharmacyProduct[];
  addProduct: (item: Omit<PharmacyProduct, 'id' | 'pharmacyId'>) => void;
  updateProduct: (id: string, item: Partial<PharmacyProduct>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, quantityToAdd: number) => void;
  pharmacyOrders: PharmacyOrder[];
  verifyPrescription: (orderId: string, status: 'approved' | 'rejected', reason?: string) => void;
  suggestSubstitution: (orderId: string, productId: string, substituteName: string) => void;
  setOrderEta: (orderId: string, minutes: number) => void;
  updateOrderStatus: (orderId: string, status: PharmacyOrderStatus) => void;

  // Financials & Payouts
  earnings: MedicalEarningsSummary;
  transactions: MedicalTransaction[];
  requestPayout: (amount: number) => boolean;

  // Notifications & Support
  notifications: MedicalNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  faqs: SupportFAQ[];
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [providerType, setProviderType] = useState<ProviderType>('hospital');
  const [provider, setProvider] = useState<MedicalProvider>(mockHospitalProvider);

  // Mode-specific providers cache
  const [hospitalProfile, setHospitalProfile] = useState<MedicalProvider>(mockHospitalProvider);
  const [doctorProfile, setDoctorProfile] = useState<MedicalProvider>(mockDoctorProvider);
  const [pharmacyProfile, setPharmacyProfile] = useState<MedicalProvider>(mockPharmacyProvider);

  // Track registration status for each healthcare category - starts as false by default so new providers can register
  const [registeredCategories, setRegisteredCategories] = useState<Record<ProviderType, boolean>>({
    hospital: false,
    doctor: false,
    pharmacy: false,
  });

  const isCategoryRegistered = (type: ProviderType) => {
    return Boolean(registeredCategories[type]);
  };

  const isAnyRegistered = Boolean(
    registeredCategories.hospital || registeredCategories.doctor || registeredCategories.pharmacy
  );

  const setCategoryRegistered = (type: ProviderType, registered: boolean) => {
    setRegisteredCategories((prev) => ({ ...prev, [type]: registered }));
  };

  const resetAllRegistrations = () => {
    setRegisteredCategories({
      hospital: false,
      doctor: false,
      pharmacy: false,
    });
    setProvider(mockHospitalProvider);
    setProviderType('hospital');
  };

  // Hospital state
  const [doctors, setDoctors] = useState<HospitalDoctor[]>(initialHospitalDoctors);
  const [opBookings, setOpBookings] = useState<OPBooking[]>(initialOPBookings);
  const [packages, setPackages] = useState<HealthPackage[]>(initialHealthPackages);

  // Doctor state
  const [consultations, setConsultations] = useState<OnlineConsultation[]>(initialOnlineConsultations);
  const [homeVisits, setHomeVisits] = useState<HomeVisitRequest[]>(initialHomeVisits);

  // Pharmacy state
  const [inventory, setInventory] = useState<PharmacyProduct[]>(initialPharmacyProducts);
  const [pharmacyOrders, setPharmacyOrders] = useState<PharmacyOrder[]>(initialPharmacyOrders);

  // Transactions & Financials
  const [transactions, setTransactions] = useState<MedicalTransaction[]>(initialTransactions);

  // Notifications & Support
  const [notifications, setNotifications] = useState<MedicalNotification[]>(initialNotifications);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'support',
      text: 'Hello! Welcome to One Buddy Medical Partner Desk. How can we help your healthcare operations today?',
      timestamp: 'Just now',
    },
  ]);

  // Mode switcher handler
  const switchProviderMode = (type: ProviderType) => {
    setProviderType(type);
    if (type === 'hospital') setProvider(hospitalProfile);
    else if (type === 'doctor') setProvider(doctorProfile);
    else if (type === 'pharmacy') setProvider(pharmacyProfile);
  };

  const toggleOnlineAvailability = () => {
    setProvider((prev) => {
      const updated = { ...prev, isOnline: !prev.isOnline };
      if (providerType === 'hospital') setHospitalProfile(updated);
      else if (providerType === 'doctor') setDoctorProfile(updated);
      else if (providerType === 'pharmacy') setPharmacyProfile(updated);
      return updated;
    });
  };

  const updateProviderProfile = (data: Partial<MedicalProvider>) => {
    setProvider((prev) => {
      const updated = { ...prev, ...data };
      if (providerType === 'hospital') setHospitalProfile(updated);
      else if (providerType === 'doctor') setDoctorProfile(updated);
      else if (providerType === 'pharmacy') setPharmacyProfile(updated);
      return updated;
    });
  };

  const updateBankDetails = (data: Partial<BankDetails>) => {
    setProvider((prev) => {
      const updated = { ...prev, bankDetails: { ...prev.bankDetails, ...data } };
      if (providerType === 'hospital') setHospitalProfile(updated);
      else if (providerType === 'doctor') setDoctorProfile(updated);
      else if (providerType === 'pharmacy') setPharmacyProfile(updated);
      return updated;
    });
  };

  // Hospital Methods
  const addDoctor = (doc: Omit<HospitalDoctor, 'id' | 'hospitalId'>) => {
    const newDoc: HospitalDoctor = {
      ...doc,
      id: `doc-h-${Date.now()}`,
      hospitalId: provider.id,
    };
    setDoctors((prev) => [newDoc, ...prev]);
  };

  const updateDoctor = (id: string, doc: Partial<HospitalDoctor>) => {
    setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...doc } : d)));
  };

  const deleteDoctor = (id: string) => {
    setDoctors((prev) => prev.filter((d) => d.id !== id));
  };

  const toggleDoctorLeave = (doctorId: string, date: string) => {
    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id !== doctorId) return d;
        const exists = d.blockedDates.includes(date);
        return {
          ...d,
          blockedDates: exists ? d.blockedDates.filter((dt) => dt !== date) : [...d.blockedDates, date],
        };
      }),
    );
  };

  const acceptOPBooking = (id: string) => {
    setOpBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'accepted' } : b)),
    );
  };

  const rescheduleOPBooking = (id: string, newDate: string, newSlot: string) => {
    setOpBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'rescheduled',
              appointmentDate: newDate,
              timeSlot: newSlot,
              rescheduledTo: `${newDate} at ${newSlot}`,
            }
          : b,
      ),
    );
  };

  const cancelOPBooking = (id: string, reason?: string) => {
    setOpBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)),
    );
  };

  const updateOPStatus = (id: string, status: OPBookingStatus) => {
    setOpBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b)),
    );
  };

  const addHealthPackage = (pkg: Omit<HealthPackage, 'id' | 'hospitalId' | 'approvalStatus'>) => {
    const newPkg: HealthPackage = {
      ...pkg,
      id: `PKG-${Date.now().toString().slice(-4)}`,
      hospitalId: provider.id,
      approvalStatus: 'approved',
    };
    setPackages((prev) => [newPkg, ...prev]);
  };

  const updateHealthPackage = (id: string, pkg: Partial<HealthPackage>) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...pkg } : p)));
  };

  // Doctor Methods
  const uploadPrescription = (
    consultationId: string,
    rx: Omit<DigitalPrescription, 'id' | 'consultationId' | 'date'>,
  ) => {
    const newRx: DigitalPrescription = {
      ...rx,
      id: `RX-${Date.now().toString().slice(-4)}`,
      consultationId,
      date: new Date().toISOString().slice(0, 10),
    };
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === consultationId
          ? { ...c, prescriptionUploaded: true, prescription: newRx, status: 'completed' }
          : c,
      ),
    );
  };

  const updateConsultationStatus = (id: string, status: ConsultationStatus, notes?: string) => {
    setConsultations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, clinicalNotes: notes || c.clinicalNotes } : c)),
    );
  };

  const acceptHomeVisit = (id: string) => {
    setHomeVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'accepted' } : v)),
    );
  };

  const declineHomeVisit = (id: string) => {
    setHomeVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'declined' } : v)),
    );
  };

  const updateHomeVisitStatus = (id: string, status: HomeVisitStatus, notes?: string) => {
    setHomeVisits((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              status,
              prescriptionNotes: notes || v.prescriptionNotes,
              prescriptionUploaded: status === 'completed' ? true : v.prescriptionUploaded,
            }
          : v,
      ),
    );
  };

  // Pharmacy Methods
  const addProduct = (item: Omit<PharmacyProduct, 'id' | 'pharmacyId'>) => {
    const newItem: PharmacyProduct = {
      ...item,
      id: `med-${Date.now().toString().slice(-4)}`,
      pharmacyId: provider.id,
    };
    setInventory((prev) => [newItem, ...prev]);
  };

  const updateProduct = (id: string, item: Partial<PharmacyProduct>) => {
    setInventory((prev) => prev.map((p) => (p.id === id ? { ...p, ...item } : p)));
  };

  const deleteProduct = (id: string) => {
    setInventory((prev) => prev.filter((p) => p.id !== id));
  };

  const restockProduct = (id: string, quantityToAdd: number) => {
    setInventory((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stockQuantity: p.stockQuantity + quantityToAdd } : p)),
    );
  };

  const verifyPrescription = (orderId: string, status: 'approved' | 'rejected', reason?: string) => {
    setPharmacyOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              prescriptionStatus: status,
              rejectionReason: reason,
              status: status === 'approved' ? 'accepted' : 'cancelled',
            }
          : o,
      ),
    );
  };

  const suggestSubstitution = (orderId: string, productId: string, substituteName: string) => {
    setPharmacyOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((it) =>
            it.productId === productId
              ? { ...it, isAvailable: false, suggestedSubstitution: substituteName }
              : it,
          ),
        };
      }),
    );
  };

  const setOrderEta = (orderId: string, minutes: number) => {
    setPharmacyOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, etaMinutes: minutes } : o)),
    );
  };

  const updateOrderStatus = (orderId: string, status: PharmacyOrderStatus) => {
    setPharmacyOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
  };

  // Financials calculation
  const earnings = useMemo<MedicalEarningsSummary>(() => {
    let today = 0;
    let weekly = 0;
    let monthly = 0;
    let totalWithdrawn = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'bank_withdrawal') {
        totalWithdrawn += Math.abs(tx.netPayout);
      } else if (tx.netPayout > 0) {
        today += tx.netPayout;
        weekly += tx.netPayout * 3.5;
        monthly += tx.netPayout * 12;
      }
    });

    today = Math.round(today);
    weekly = Math.round(weekly);
    monthly = Math.round(monthly);
    // Baseline pool from previous week operations + today's positive earnings minus all withdrawals
    const baseAccumulated = Math.round(18500 + today * 1.5);
    const pending = Math.max(0, baseAccumulated - totalWithdrawn);
    const completed = 34500 + totalWithdrawn;

    return {
      todayEarnings: today,
      weeklyEarnings: weekly,
      monthlyEarnings: monthly,
      pendingPayout: pending,
      completedPayouts: completed,
      platformFeePerOrder: 50,
      transactions,
    };
  }, [transactions]);

  const requestPayout = (amount: number) => {
    if (amount <= 0 || amount > earnings.pendingPayout) return false;
    const refCode = `WTH-${Date.now().toString().slice(-4)}`;
    const newTx: MedicalTransaction = {
      id: refCode,
      bookingId: refCode,
      type: 'bank_withdrawal',
      title: `Bank Settlement (${provider.bankDetails?.bankName || 'Verified Bank'} ••••${(provider.bankDetails?.accountNumber || '1234').slice(-4)})`,
      grossAmount: -amount,
      platformFee: 0,
      netPayout: -amount,
      status: 'processing',
      date: new Date().toISOString().slice(0, 10),
      patientName: 'OneBuddy Financial Disbursal',
      serviceDescription: 'Requested direct bank settlement to verified account',
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Dispatch real-time financial notification
    const withdrawalNotif: MedicalNotification = {
      id: `notif-${Date.now()}`,
      title: 'Withdrawal Initiated',
      message: `₹${amount.toLocaleString('en-IN')} requested for direct disbursal to ${provider.bankDetails?.bankName || 'Bank'}. Ref: ${refCode}`,
      timestamp: 'Just now',
      type: 'payout',
      read: false,
    };
    setNotifications((prev) => [withdrawalNotif, ...prev]);
    return true;
  };

  // Chat Support
  const sendChatMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };
    setChatMessages((prev) => [...prev, userMsg]);

    // Simulated instant AI Medical Desk reply
    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = 'Thank you for reaching out to One Buddy Medical Provider Support. Our healthcare concierge team is reviewing your query.';
      if (lower.includes('payout') || lower.includes('fee') || lower.includes('50') || lower.includes('money')) {
        reply = 'Platform fees are fixed at ₹50 per completed booking or order. Bank payouts settle on rolling weekly cycles into your registered account.';
      } else if (lower.includes('doctor') || lower.includes('op') || lower.includes('slot')) {
        reply = 'You can manage doctor slots, consultation fees, and block leave days under the Hospital Doctors management screen.';
      } else if (lower.includes('prescription') || lower.includes('video') || lower.includes('meet')) {
        reply = 'Digital prescriptions generated during online consults are automatically archived and sent to the patient via App, Mail, and WhatsApp.';
      } else if (lower.includes('medicine') || lower.includes('stock') || lower.includes('delivery')) {
        reply = 'Pharmacy delivery orders can be verified against uploaded prescriptions. If a medicine is out of stock, use the substitution suggestion tool.';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'support',
          text: reply,
          timestamp: 'Just now',
        },
      ]);
    }, 600);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const value: AppContextValue = {
    provider,
    providerType,
    hospitalProfile,
    doctorProfile,
    pharmacyProfile,
    registeredCategories,
    isAnyRegistered,
    isCategoryRegistered,
    setCategoryRegistered,
    resetAllRegistrations,
    switchProviderMode,
    toggleOnlineAvailability,
    updateProviderProfile,
    updateBankDetails,
    loginWithPhone: (phone, otp) => {
      if (phone.length >= 10 && otp.length >= 4) {
        return true;
      }
      return false;
    },
    registerProvider: (data) => {
      const targetType = data.type || providerType;
      setRegisteredCategories((prev) => ({ ...prev, [targetType]: true }));
      setProvider((prev) => {
        const updated = {
          ...prev,
          ...data,
          type: targetType,
          approvalStatus: 'approved' as const,
        };
        if (targetType === 'hospital') setHospitalProfile(updated);
        else if (targetType === 'doctor') setDoctorProfile(updated);
        else if (targetType === 'pharmacy') setPharmacyProfile(updated);
        return updated;
      });
      setProviderType(targetType);
    },
    logout: () => {
      resetAllRegistrations();
    },

    // Hospital
    doctors,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    toggleDoctorLeave,
    opBookings,
    acceptOPBooking,
    rescheduleOPBooking,
    cancelOPBooking,
    updateOPStatus,
    packages,
    addHealthPackage,
    updateHealthPackage,

    // Doctor
    consultations,
    uploadPrescription,
    updateConsultationStatus,
    homeVisits,
    acceptHomeVisit,
    declineHomeVisit,
    updateHomeVisitStatus,

    // Pharmacy
    inventory,
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    pharmacyOrders,
    verifyPrescription,
    suggestSubstitution,
    setOrderEta,
    updateOrderStatus,

    // Financials
    earnings,
    transactions,
    requestPayout,

    // Notifications & Support
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    faqs: initialFAQs,
    chatMessages,
    sendChatMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
