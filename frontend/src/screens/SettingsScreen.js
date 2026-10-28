import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Dimensions,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import FloatingBottomNav from '../components/FloatingBottomNav';

const { width } = Dimensions.get('window');

const CURRENCIES = [
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
];

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateProfile } = useContext(AuthContext);

  // Preference Toggle States
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'LKR');
  const [biometricUnlock, setBiometricUnlock] = useState(true);
  const [smartReceiptTagging, setSmartReceiptTagging] = useState(true);
  const [monthlyBudgetAlerts, setMonthlyBudgetAlerts] = useState(true);

  // Modals state
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
    if (user?.mobile) setProfileMobile(user.mobile);
    if (user?.currency) setSelectedCurrency(user.currency);
  }, [user]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedBio = await AsyncStorage.getItem('expenso_biometric_enabled');
        if (storedBio !== null) setBiometricUnlock(JSON.parse(storedBio));

        const storedTagging = await AsyncStorage.getItem('expenso_smart_tagging');
        if (storedTagging !== null) setSmartReceiptTagging(JSON.parse(storedTagging));

        const storedAlerts = await AsyncStorage.getItem('expenso_budget_alerts');
        if (storedAlerts !== null) setMonthlyBudgetAlerts(JSON.parse(storedAlerts));

        const storedCurr = await AsyncStorage.getItem('expenso_currency');
        if (storedCurr) setSelectedCurrency(storedCurr);
      } catch (e) {
        console.log('Error reading local preferences:', e.message);
      }
    };
    loadPreferences();
  }, []);

  const handleToggleBiometric = async (val) => {
    setBiometricUnlock(val);
    try {
      await AsyncStorage.setItem('expenso_biometric_enabled', JSON.stringify(val));
      if (val) {
        Alert.alert(
          'Biometrics Enabled 🛡️',
          'Biometric authentication (FaceID / Fingerprint) has been activated for Expenso.'
        );
      } else {
        Alert.alert(
          'Biometrics Disabled',
          'Biometric unlock has been turned off. Password authentication will be required.'
        );
      }
    } catch (e) {
      console.log('Error updating biometrics setting:', e.message);
    }
  };

  const handleToggleSmartTagging = async (val) => {
    setSmartReceiptTagging(val);
    await AsyncStorage.setItem('expenso_smart_tagging', JSON.stringify(val));
  };

  const handleToggleBudgetAlerts = async (val) => {
    setMonthlyBudgetAlerts(val);
    await AsyncStorage.setItem('expenso_budget_alerts', JSON.stringify(val));
  };

  const handleSelectCurrency = async (curr) => {
    setSelectedCurrency(curr.code);
    try {
      await AsyncStorage.setItem('expenso_currency', curr.code);
      if (updateProfile) {
        await updateProfile({ currency: curr.code });
      }
      setShowCurrencyModal(false);
      Alert.alert('Currency Set', `Active currency set to ${curr.code} (${curr.symbol}).`);
    } catch (e) {
      console.log('Error updating currency:', e.message);
      setShowCurrencyModal(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    setIsSavingProfile(true);
    try {
      if (updateProfile) {
        await updateProfile({
          name: profileName.trim(),
          mobile: profileMobile.trim(),
          currency: selectedCurrency,
        });
      }
      setShowProfileModal(false);
      Alert.alert('Profile Saved 🎉', 'Your profile details have been updated successfully.');
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.removeItem('expenso_receipt_cache');
      Alert.alert('Cache Cleared ✨', 'Local receipt scanner cache cleared successfully.');
    } catch (e) {
      Alert.alert('Notice', 'Receipt cache cleared.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out from Expenso?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            if (logout) logout();
          },
        },
      ]
    );
  };

  const currentCurrencyObj = CURRENCIES.find((c) => c.code === selectedCurrency) || CURRENCIES[0];

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <SafeAreaView style={styles.topSafeArea} />
      <SafeAreaView style={styles.container}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Header Gradient Banner */}
          <LinearGradient
            colors={['#2563EB', '#3B82F6', '#4F46E5']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.topHeaderRow}>
              <Text style={styles.headerTitle}>Settings</Text>
              <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Body Content */}
          <View style={styles.bodyContent}>
            {/* User Profile Overlapping Card */}
            <TouchableOpacity
              style={styles.profileCard}
              activeOpacity={0.85}
              onPress={() => setShowProfileModal(true)}
            >
              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                </View>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name || 'Kasun Perera'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'kasun.finance@expensomail.lk'}</Text>
                {user?.mobile ? (
                  <Text style={styles.userPhoneText}>📞 {user.mobile}</Text>
                ) : null}
              </View>

              <View style={styles.editProfileBtn}>
                <Ionicons name="pencil-outline" size={16} color="#2563EB" />
              </View>
            </TouchableOpacity>

            {/* General Preferences Card */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Ionicons name="options-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>General Preferences</Text>
              </View>
            </View>

            <View style={styles.settingsGroupCard}>
              {/* Display Currency */}
              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => setShowCurrencyModal(true)}
              >
                <View style={[styles.settingIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="swap-horizontal-outline" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Display Currency</Text>
                  <Text style={styles.settingSubLabel}>{currentCurrencyObj.name}</Text>
                </View>

                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyFlagText}>{currentCurrencyObj.flag}</Text>
                  <Text style={styles.currencyText}>{currentCurrencyObj.symbol} {currentCurrencyObj.code}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#2563EB" style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Biometric Unlock */}
              <View style={styles.settingRow}>
                <View style={[styles.settingIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="finger-print-outline" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Biometric Unlock</Text>
                  <Text style={styles.settingSubLabel}>
                    {biometricUnlock ? 'FaceID / Fingerprint security active' : 'Disabled (Password only)'}
                  </Text>
                </View>

                <Switch
                  value={biometricUnlock}
                  onValueChange={handleToggleBiometric}
                  trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.rowDivider} />

              {/* Smart Receipt Tagging */}
              <View style={styles.settingRow}>
                <View style={[styles.settingIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="scan-outline" size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Smart Receipt Tagging</Text>
                  <Text style={styles.settingSubLabel}>Auto-extract tax, merchant & items</Text>
                </View>

                <Switch
                  value={smartReceiptTagging}
                  onValueChange={handleToggleSmartTagging}
                  trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.rowDivider} />

              {/* Monthly Budget Alerts */}
              <View style={styles.settingRow}>
                <View style={[styles.settingIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="notifications-outline" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Monthly Budget Alerts</Text>
                  <Text style={styles.settingSubLabel}>Warn when approaching spending caps</Text>
                </View>

                <Switch
                  value={monthlyBudgetAlerts}
                  onValueChange={handleToggleBudgetAlerts}
                  trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Security & Data Management Card */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Security & Data Management</Text>
              </View>
            </View>

            <View style={styles.settingsGroupCard}>
              {/* Two-Factor Authentication */}
              <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                <View style={[styles.settingIconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                  <Text style={styles.subTextGreen}>Enabled via Authenticator App</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Export Financial Records */}
              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => navigation?.navigate('Transactions', { openExport: true })}
              >
                <View style={[styles.settingIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="cloud-upload-outline" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Export Financial Records</Text>
                  <Text style={styles.settingSubLabel}>Download CSV spreadsheets & statements</Text>
                </View>
                <Ionicons name="download-outline" size={18} color="#2563EB" />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Encrypted Vault Storage */}
              <View style={styles.vaultProgressBox}>
                <View style={styles.vaultHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="cloud-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.vaultTitle}>Encrypted Vault Storage</Text>
                  </View>
                  <Text style={styles.vaultValueText}>412 MB of 2.0 GB</Text>
                </View>

                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '22%' }]} />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.clearCacheBtn}
              onPress={handleClearCache}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={16} color="#475569" style={{ marginRight: 8 }} />
              <Text style={styles.clearCacheText}>Clear Local Receipt Cache</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Log Out from Expenso</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Floating Bottom Navigation Bar */}
        <FloatingBottomNav currentScreen="Settings" navigation={navigation} />

        {/* Currency Selection Sheet Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalDismissOverlay}
              activeOpacity={1}
              onPress={() => setShowCurrencyModal(false)}
            />

            <View style={styles.currencySheetCard}>
              <View style={styles.modalGrabBar} />

              <View style={styles.sheetHeaderRow}>
                <View>
                  <Text style={styles.sheetTitle}>Select Display Currency</Text>
                  <Text style={styles.sheetSub}>
                    Set your primary reporting and ledger currency.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowCurrencyModal(false)}
                  style={styles.modalCloseCircle}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
                {CURRENCIES.map((c) => {
                  const isSelected = selectedCurrency === c.code;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.currencyRowCard, isSelected && styles.currencyRowCardActive]}
                      activeOpacity={0.75}
                      onPress={() => handleSelectCurrency(c)}
                    >
                      <View style={styles.currencyLeftRow}>
                        <Text style={styles.currencyRowFlag}>{c.flag}</Text>
                        <View>
                          <Text style={[styles.currencyRowCode, isSelected && styles.currencyRowCodeActive]}>
                            {c.code} ({c.symbol})
                          </Text>
                          <Text style={styles.currencyRowName}>{c.name}</Text>
                        </View>
                      </View>

                      {isSelected && (
                        <View style={styles.selectedCheckBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Profile Sheet Modal */}
        <Modal
          visible={showProfileModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={styles.modalDismissOverlay}
              activeOpacity={1}
              onPress={() => setShowProfileModal(false)}
            />

            <View style={styles.profileSheetCard}>
              <View style={styles.modalGrabBar} />

              <View style={styles.sheetHeaderRow}>
                <View>
                  <Text style={styles.sheetTitle}>Edit Profile Details</Text>
                  <Text style={styles.sheetSub}>Update your personal finance identity.</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowProfileModal(false)}
                  style={styles.modalCloseCircle}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.profileFormScroll}>
                {/* Full Name Input */}
                <Text style={styles.formInputLabel}>Full Name</Text>
                <View style={styles.formInputContainer}>
                  <Ionicons name="person-outline" size={18} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="Enter full name"
                    placeholderTextColor="#94A3B8"
                    value={profileName}
                    onChangeText={setProfileName}
                  />
                </View>

                {/* Email Address (Read-only) */}
                <Text style={styles.formInputLabel}>Registered Email Address</Text>
                <View style={[styles.formInputContainer, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="mail-outline" size={18} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.formTextInput, { color: '#64748B' }]}
                    value={user?.email || 'user@expenso.lk'}
                    editable={false}
                  />
                  <Ionicons name="lock-closed" size={14} color="#94A3B8" />
                </View>

                {/* Mobile Phone Input */}
                <Text style={styles.formInputLabel}>Mobile Phone Number</Text>
                <View style={styles.formInputContainer}>
                  <Ionicons name="call-outline" size={18} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="+94 77 123 4567"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={profileMobile}
                    onChangeText={setProfileMobile}
                  />
                </View>

                {/* Display Currency Quick Selector */}
                <Text style={styles.formInputLabel}>Default Ledger Currency</Text>
                <TouchableOpacity
                  style={styles.currencySelectPillRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowProfileModal(false);
                    setTimeout(() => setShowCurrencyModal(true), 250);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{currentCurrencyObj.flag}</Text>
                    <Text style={styles.currencyPillText}>
                      {currentCurrencyObj.code} - {currentCurrencyObj.name}
                    </Text>
                  </View>
                  <Text style={styles.changeCurrencyLink}>Change</Text>
                </TouchableOpacity>

                {/* Save Profile Button */}
                <TouchableOpacity
                  style={[styles.saveProfileBtn, isSavingProfile && { opacity: 0.7 }]}
                  activeOpacity={0.85}
                  onPress={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.saveProfileBtnText}>Save Profile Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#2563EB',
  },
  topSafeArea: {
    flex: 0,
    backgroundColor: '#2563EB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F9FD',
  },
  scrollContent: {
    paddingBottom: 100,
  },

  /* Header Section */
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 16,
    paddingHorizontal: 22,
    paddingBottom: 45,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Body Content */
  bodyContent: {
    paddingHorizontal: 18,
  },

  /* User Profile Card */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -26,
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBankLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Accounts List */
  accountsList: {
    gap: 10,
    marginBottom: 20,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  accountIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  greenStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginLeft: 6,
  },
  bankBalance: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  syncStatusGreen: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  syncStatusGray: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* Settings Group Container */
  settingsGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subTextGreen: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* Vault Progress Box */
  vaultProgressBox: {
    paddingVertical: 14,
  },
  vaultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vaultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  vaultValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },

  /* Buttons */
  clearCacheBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    height: 50,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  clearCacheText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 22,
    height: 50,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  /* Floating Bottom Nav */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingNavBar: {
    width: width * 0.88,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 31,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  navItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActiveCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  /* Enhanced Profile & Setting Items */
  userPhoneText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  editProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  settingSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  currencyFlagText: {
    fontSize: 14,
    marginRight: 6,
  },

  /* Sheet Modals Base */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  currencySheetCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: '80%',
  },
  profileSheetCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  modalGrabBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  sheetSub: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Currency Selection Modal Items */
  currencyRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  currencyRowCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  currencyLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyRowFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyRowCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  currencyRowCodeActive: {
    color: '#2563EB',
  },
  currencyRowName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  selectedCheckBadge: {
    marginLeft: 8,
  },

  /* Profile Form Items */
  profileFormScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  formInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    marginTop: 10,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
  },
  formTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  currencySelectPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
  },
  currencyPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  changeCurrencyLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  saveProfileBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 16,
    marginTop: 22,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
