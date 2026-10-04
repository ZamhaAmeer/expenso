import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Default initial transaction mock matching screenshot
const DEFAULT_TRANSACTIONS = [
  {
    id: '1',
    title: 'Keells Super',
    dateCategory: 'Oct 24, 2024 • Groceries',
    amount: '-Rs. 8,450.00',
    type: 'expense',
    status: 'Successful',
    icon: 'bag-handle-outline',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
  },
  {
    id: '2',
    title: 'Freelance Retainer',
    dateCategory: 'Oct 24, 2024 • UX Sprint',
    amount: '+Rs. 85,000.00',
    type: 'income',
    status: 'Successful',
    icon: 'wallet-outline',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    id: '3',
    title: 'Dialog Axiata',
    dateCategory: 'Oct 23, 2024 • Broadband',
    amount: '-Rs. 2,100.00',
    type: 'expense',
    status: 'Successful',
    icon: 'wifi-outline',
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
  },
  {
    id: '4',
    title: 'Uber Premier',
    dateCategory: 'Oct 22, 2024 • Transport',
    amount: '-Rs. 1,420.00',
    type: 'expense',
    status: 'Successful',
    icon: 'car-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
];

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    balance: 245000,
    totalIncome: 320000,
    totalExpense: 75000,
  });
  const [recentTx, setRecentTx] = useState(DEFAULT_TRANSACTIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');

  const fetchData = async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions'),
      ]);
      if (summaryRes?.data && summaryRes.data.balance !== undefined) {
        setSummary({
          balance: summaryRes.data.balance || 245000,
          totalIncome: summaryRes.data.totalIncome || 320000,
          totalExpense: summaryRes.data.totalExpense || 75000,
        });
      }
      if (txRes?.data && Array.isArray(txRes.data) && txRes.data.length > 0) {
        const mapped = txRes.data.slice(0, 4).map((tx, idx) => ({
          id: tx._id || String(idx),
          title: tx.title || 'Transaction',
          dateCategory: `${new Date(tx.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${tx.category || 'General'}`,
          amount: `${tx.type === 'income' ? '+' : '-'}Rs. ${Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          type: tx.type || 'expense',
          status: 'Successful',
          icon: tx.type === 'income' ? 'wallet-outline' : 'bag-handle-outline',
          iconBg: tx.type === 'income' ? '#DCFCE7' : '#E0F2FE',
          iconColor: tx.type === 'income' ? '#16A34A' : '#0284C7',
        }));
        setRecentTx(mapped);
      }
    } catch (err) {
      console.log('Using default dashboard dataset:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const formatCurrency = (val) => {
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* Top Header & Blue Balance Banner */}
        <LinearGradient
          colors={['#2563EB', '#3B82F6', '#4F46E5']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Top Bar: Brand Logo & Notification Icon */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/logo_expenso.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>Expenso</Text>
            </View>

            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
          </View>

          {/* Balance Section */}
          <View style={styles.balanceSection}>
            <TouchableOpacity
              style={styles.balanceLabelRow}
              activeOpacity={0.7}
              onPress={() => setShowBalance(!showBalance)}
            >
              <View style={styles.flagBadge}>
                <Text style={styles.flagText}>LK</Text>
              </View>
              <Text style={styles.balanceLabel}>Your Balance is</Text>
              <Ionicons
                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                size={16}
                color="rgba(255, 255, 255, 0.85)"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <View style={styles.balanceAmountRow}>
              <Text style={styles.currencyPrefix}>Rs. </Text>
              <Text style={styles.balanceMainText}>
                {showBalance ? formatCurrency(summary.balance) : '••••••••'}
              </Text>
              <Text style={styles.currencySuffix}> LKR</Text>
            </View>

            {/* Growth Pill */}
            <View style={styles.growthPill}>
              <Ionicons name="trending-up-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.growthPillText}>+14.8% vs last month</Text>
            </View>
          </View>

          {/* 4 Quick Action Circular Buttons */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.actionBtnWrapper}
              activeOpacity={0.85}
              onPress={() => navigation?.navigate('ScanReceipt')}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="add-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>Scan Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnWrapper}
              activeOpacity={0.85}
              onPress={() => navigation?.navigate('AddExpense')}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ transform: [{ rotate: '-25deg' }] }} />
              </View>
              <Text style={styles.actionLabel}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnWrapper} activeOpacity={0.85}>
              <View style={styles.actionCircle}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>Convert</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnWrapper} activeOpacity={0.85}>
              <View style={styles.actionCircle}>
                <Ionicons name="ellipsis-horizontal-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>More</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Main Body Content */}
        <View style={styles.bodyContent}>
          {/* Overlapping Inflow / Outflow Summary Cards */}
          <View style={styles.summaryRow}>
            {/* Total Inflow Card */}
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="arrow-down-outline" size={18} color="#16A34A" />
              </View>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>Total Inflow</Text>
                <Text style={[styles.summaryAmount, { color: '#16A34A' }]}>
                  +Rs. {Math.round(summary.totalIncome).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Total Outflow Card */}
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="arrow-up-outline" size={18} color="#EF4444" />
              </View>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>Total Outflow</Text>
                <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
                  -Rs. {Math.round(summary.totalExpense).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Weekly Spend Velocity Section */}
          <View style={styles.cardContainer}>
            <View style={styles.velocityHeader}>
              <View style={styles.velocityTitleRow}>
                <View style={styles.velocityIconBadge}>
                  <Ionicons name="analytics-outline" size={16} color="#0284C7" />
                </View>
                <Text style={styles.cardTitle}>Weekly Spend Velocity</Text>
              </View>
              <Text style={styles.velocityTargetText}>Target: Rs. 20k/wk</Text>
            </View>

            {/* Weekly Bar Chart */}
            <View style={styles.chartBarRow}>
              {/* Mon */}
              <View style={styles.chartCol}>
                <View style={[styles.barBase, { height: 26, backgroundColor: '#F1F5F9' }]} />
                <Text style={styles.dayLabel}>Mon</Text>
              </View>
              {/* Tue */}
              <View style={styles.chartCol}>
                <View style={[styles.barBase, { height: 38, backgroundColor: '#F1F5F9' }]} />
                <Text style={styles.dayLabel}>Tue</Text>
              </View>
              {/* Wed */}
              <View style={styles.chartCol}>
                <View style={[styles.barBase, { height: 18, backgroundColor: '#F1F5F9' }]} />
                <Text style={styles.dayLabel}>Wed</Text>
              </View>
              {/* Thu - Active Gradient Bar */}
              <View style={styles.chartCol}>
                <LinearGradient
                  colors={['#38BDF8', '#2563EB']}
                  style={[styles.barBase, styles.barActive]}
                />
                <Text style={[styles.dayLabel, styles.dayLabelActive]}>Thu</Text>
              </View>
              {/* Fri */}
              <View style={styles.chartCol}>
                <View style={[styles.barBase, { height: 36, backgroundColor: '#F1F5F9' }]} />
                <Text style={styles.dayLabel}>Fri</Text>
              </View>
              {/* Sat */}
              <View style={styles.chartCol}>
                <View style={[styles.barBase, { height: 24, backgroundColor: '#F1F5F9' }]} />
                <Text style={styles.dayLabel}>Sat</Text>
              </View>
              {/* Sun */}
              <View style={styles.chartCol}>
                <View style={[styles.barBase, { height: 14, backgroundColor: '#F1F5F9' }]} />
                <Text style={styles.dayLabel}>Sun</Text>
              </View>
            </View>

            {/* Savings Cycle Banner */}
            <View style={styles.savingsBanner}>
              <Ionicons name="sparkles" size={15} color="#0284C7" style={{ marginRight: 8 }} />
              <Text style={styles.savingsText}>
                On track to save <Text style={styles.savingsHighlight}>Rs. 42,000</Text> this cycle.
              </Text>
            </View>
          </View>

          {/* Recent Transactions Header */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation?.navigate('Transactions')}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Transactions List */}
          <View style={styles.transactionsList}>
            {recentTx.map((tx) => (
              <View key={tx.id} style={styles.txCard}>
                <View style={[styles.txIconCircle, { backgroundColor: tx.iconBg }]}>
                  <Ionicons name={tx.icon} size={20} color={tx.iconColor} />
                </View>

                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txDate}>{tx.dateCategory}</Text>
                </View>

                <View style={styles.txRight}>
                  <Text style={[styles.txAmountText, tx.type === 'income' && styles.txIncomeText]}>
                    {tx.amount}
                  </Text>
                  <Text style={styles.txStatusText}>{tx.status}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Export Monthly Statement Banner */}
          <View style={styles.exportCard}>
            {/* Background image overlay effect */}
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exportGradient}
            >
              <View style={styles.exportLeft}>
                <Text style={styles.exportTitle}>Export Monthly Statement</Text>
                <Text style={styles.exportSubtitle}>PDF & Excel sheets ready for October</Text>
              </View>

              <TouchableOpacity style={styles.downloadCircleBtn} activeOpacity={0.85}>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar matching mockup */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.floatingNavBar}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('Home')}
            activeOpacity={0.8}
          >
            <View style={[styles.navHomeBadge, activeTab === 'Home' && styles.navHomeBadgeActive]}>
              <Ionicons name="home" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveTab('Velocity');
              navigation?.navigate('Transactions');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="bar-chart-outline"
              size={22}
              color={activeTab === 'Velocity' ? '#2563EB' : '#94A3B8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveTab('Calendar');
              navigation?.navigate('Calendar');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={activeTab === 'Calendar' ? '#2563EB' : '#94A3B8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveTab('AIChat');
              navigation?.navigate('AIChat');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="sparkles-outline"
              size={22}
              color={activeTab === 'AIChat' ? '#2563EB' : '#94A3B8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveTab('Profile');
              navigation?.navigate('Settings');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person-outline"
              size={22}
              color={activeTab === 'Profile' ? '#2563EB' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 50,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
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
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF4D4D',
    borderWidth: 1,
    borderColor: '#2563EB',
  },

  /* Balance Section */
  balanceSection: {
    alignItems: 'center',
    marginVertical: 4,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flagBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 6,
  },
  flagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceMainText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  currencySuffix: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 4,
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  growthPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Quick Actions Row */
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
    paddingHorizontal: 6,
  },
  actionBtnWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  actionCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Body Content */
  bodyContent: {
    paddingHorizontal: 18,
  },

  /* Summary Overlapping Cards */
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -28,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  summaryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Card Container Base */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  /* Weekly Velocity Section */
  velocityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  velocityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  velocityIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  velocityTargetText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Bar Chart */
  chartBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 85,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  chartCol: {
    alignItems: 'center',
    width: 32,
  },
  barBase: {
    width: 28,
    borderRadius: 14,
    marginBottom: 8,
  },
  barActive: {
    height: 52,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  dayLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dayLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  /* Savings Banner */
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  savingsText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  savingsHighlight: {
    color: '#0284C7',
    fontWeight: '700',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Transactions List */
  transactionsList: {
    gap: 10,
    marginBottom: 20,
  },
  txCard: {
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
  txIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  txDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  txIncomeText: {
    color: '#16A34A',
  },
  txStatusText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },

  /* Export Card */
  exportCard: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  exportGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  exportLeft: {
    flex: 1,
    paddingRight: 12,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exportSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  downloadCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },

  /* Floating Bottom Navigation Bar */
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
  navHomeBadge: {
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
  navHomeBadgeActive: {
    backgroundColor: '#2563EB',
  },
});
