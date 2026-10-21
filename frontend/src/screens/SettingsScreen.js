import React, { useState, useContext } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import FloatingBottomNav from '../components/FloatingBottomNav';

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  // Preference Toggle States
  const [biometricUnlock, setBiometricUnlock] = useState(true);
  const [smartReceiptTagging, setSmartReceiptTagging] = useState(true);
  const [monthlyBudgetAlerts, setMonthlyBudgetAlerts] = useState(true);

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

  const handleClearCache = () => {
    Alert.alert('Cache Cleared', 'Local receipt cache cleared successfully.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

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
          <View style={styles.profileCard}>
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
            </View>
          </View>

          {/* Connected Accounts Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="business-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Connected Accounts</Text>
            </View>

            <TouchableOpacity activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="add-circle-outline" size={14} color="#2563EB" style={{ marginRight: 3 }} />
              <Text style={styles.addBankLink}>Add Bank</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.accountsList}>
            {/* Commercial Bank */}
            <View style={styles.accountCard}>
              <View style={[styles.accountIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="wallet-outline" size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.bankName}>Commercial Bank </Text>
                  <View style={styles.greenStatusDot} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bankBalance}>Rs. 185,400.00</Text>
                <Text style={styles.syncStatusGreen}>Sync: 4m ago</Text>
              </View>
            </View>

            {/* Sampath Bank */}
            <View style={styles.accountCard}>
              <View style={[styles.accountIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="card-outline" size={20} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.bankName}>Sampath Bank </Text>
                  <View style={styles.greenStatusDot} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bankBalance}>Rs. 59,600.00</Text>
                <Text style={styles.syncStatusGray}>Sync: 1h ago</Text>
              </View>
            </View>

            {/* Petty Cash Wallet */}
            <View style={styles.accountCard}>
              <View style={[styles.accountIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="cash-outline" size={20} color="#64748B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankName}>Petty Cash Wallet</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bankBalance}>Rs. 12,500.00</Text>
                <Text style={styles.syncStatusGray}>Offline ledger</Text>
              </View>
            </View>
          </View>

          {/* General Preferences Card */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="options-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>General Preferences</Text>
            </View>
          </View>

          <View style={styles.settingsGroupCard}>
            {/* Display Currency */}
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={[styles.settingIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="swap-horizontal-outline" size={18} color="#0284C7" />
              </View>
              <Text style={styles.settingLabel}>Display Currency</Text>

              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>Rs. LKR</Text>
                <Ionicons name="chevron-forward" size={14} color="#2563EB" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Biometric Unlock */}
            <View style={styles.settingRow}>
              <View style={[styles.settingIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="happy-outline" size={18} color="#0284C7" />
              </View>
              <Text style={styles.settingLabel}>Biometric Unlock</Text>

              <Switch
                value={biometricUnlock}
                onValueChange={setBiometricUnlock}
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
              <Text style={styles.settingLabel}>Smart Receipt Tagging</Text>

              <Switch
                value={smartReceiptTagging}
                onValueChange={setSmartReceiptTagging}
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
              <Text style={styles.settingLabel}>Monthly Budget Alerts</Text>

              <Switch
                value={monthlyBudgetAlerts}
                onValueChange={setMonthlyBudgetAlerts}
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
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={[styles.settingIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="cloud-upload-outline" size={18} color="#0284C7" />
              </View>
              <Text style={styles.settingLabel}>Export Financial Records</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
