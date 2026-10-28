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
  Modal,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import budgetService from '../services/budgetService';
import { AuthContext } from '../context/AuthContext';
import FloatingBottomNav from '../components/FloatingBottomNav';

const { width } = Dimensions.get('window');

// Standard budget categories with theme colors and icons
const BUDGET_CATEGORIES = [
  { name: 'Groceries', icon: 'cart-outline', color: '#0284C7' },
  { name: 'Food & Dining', icon: 'restaurant-outline', color: '#F59E0B' },
  { name: 'Transportation', icon: 'car-outline', color: '#10B981' },
  { name: 'Utilities', icon: 'receipt-outline', color: '#8B5CF6' },
  { name: 'Shopping', icon: 'bag-handle-outline', color: '#EC4899' },
  { name: 'Entertainment', icon: 'film-outline', color: '#6366F1' },
  { name: 'Healthcare', icon: 'medical-outline', color: '#EF4444' },
  { name: 'Travel', icon: 'airplane-outline', color: '#0EA5E9' },
  { name: 'Education', icon: 'school-outline', color: '#14B8A6' },
  { name: 'Other', icon: 'grid-outline', color: '#64748B' },
];

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000];
const THRESHOLD_OPTIONS = [70, 80, 90, 100];
const PALETTE_COLORS = ['#2563EB', '#0284C7', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];

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

// Initial Notification Items matching popup design mockup
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'alert',
    title: 'Smart Budget Alert',
    time: '2m ago',
    description: 'Dining reached 85% of monthly limit (Rs. 24,000 / 28,000).',
    highlight: '85%',
    icon: 'warning-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    hasActions: true,
    isUnread: true,
  },
  {
    id: 'n2',
    type: 'transaction',
    title: 'Keells Super • Colombo 03',
    time: '12m ago',
    description: '-Rs. 8,450.00 auto-categorized into Groceries.',
    icon: 'bag-handle-outline',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    isUnread: true,
  },
  {
    id: 'n3',
    type: 'system',
    title: 'Central Bank Update',
    time: '1h ago',
    description: 'LKR exchange rate policy update reflected.',
    icon: 'sync-circle-outline',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    isUnread: true,
  },
];

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
  const [recentTx, setRecentTx] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');

  const [budgetOverview, setBudgetOverview] = useState({
    budgets: [],
    totalBudget: 0,
    totalSpent: 0,
    overallPercentage: 0,
  });

  // Notification Popup State
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const fetchData = async () => {
    try {
      const [summaryRes, txRes, budgetRes] = await Promise.all([
        api.get('/transactions/summary').catch(() => null),
        api.get('/transactions').catch(() => null),
        budgetService.getBudgets().catch(() => null),
      ]);
      if (summaryRes?.data && summaryRes.data.balance !== undefined) {
        setSummary({
          balance: Number(summaryRes.data.balance || 0),
          totalIncome: Number(summaryRes.data.totalIncome || 0),
          totalExpense: Number(summaryRes.data.totalExpense || 0),
        });
      }
      if (budgetRes && budgetRes.budgets) {
        setBudgetOverview(budgetRes);
        // Build dynamic budget warning notifications if user exceeds threshold
        const budgetAlerts = budgetRes.budgets
          .filter((b) => b.isNearLimit || b.isOverBudget)
          .map((b, idx) => ({
            id: `b-${b._id || idx}`,
            type: 'alert',
            title: b.isOverBudget ? `Budget Exceeded: ${b.category}` : `Smart Budget Alert: ${b.category}`,
            time: 'Just now',
            description: `${b.category} reached ${b.percentage}% of limit (Rs. ${b.spent.toLocaleString()} / ${b.limit.toLocaleString()}).`,
            highlight: `${b.percentage}%`,
            icon: 'warning-outline',
            iconBg: b.isOverBudget ? '#FEE2E2' : '#FEF3C7',
            iconColor: b.isOverBudget ? '#EF4444' : '#D97706',
            hasActions: true,
            isUnread: true,
          }));
        if (budgetAlerts.length > 0) {
          setNotifications(budgetAlerts);
        }
      }
      if (txRes?.data && Array.isArray(txRes.data)) {
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
      } else {
        setRecentTx([]);
      }
    } catch (err) {
      console.log('Error fetching dashboard:', err.message);
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

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const formatCurrency = (val) => {
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Budget Management State & Handlers
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAllBudgetsModal, setShowAllBudgetsModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetCategory, setBudgetCategory] = useState('Groceries');
  const [customCategory, setCustomCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetThreshold, setBudgetThreshold] = useState(80);
  const [budgetColor, setBudgetColor] = useState('#0284C7');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const handleOpenAddBudget = () => {
    setEditingBudget(null);
    setBudgetCategory('Groceries');
    setCustomCategory('');
    setBudgetLimit('');
    setBudgetThreshold(80);
    setBudgetColor('#0284C7');
    setShowBudgetModal(true);
  };

  const handleOpenEditBudget = (b) => {
    setEditingBudget(b);
    const isPreset = BUDGET_CATEGORIES.some((c) => c.name === b.category);
    if (isPreset) {
      setBudgetCategory(b.category);
      setCustomCategory('');
    } else {
      setBudgetCategory('Other');
      setCustomCategory(b.category);
    }
    setBudgetLimit(String(b.limit || ''));
    setBudgetThreshold(b.alertThreshold || 80);
    setBudgetColor(b.color || '#2563EB');
    setShowAllBudgetsModal(false);
    setShowNotifModal(false);
    setShowBudgetModal(true);
  };

  const handleSaveBudget = async () => {
    const finalCategory = budgetCategory === 'Other' ? customCategory.trim() : budgetCategory;
    if (!finalCategory) {
      Alert.alert('Category Required', 'Please select or enter a budget category name.');
      return;
    }

    const numericLimit = parseFloat(String(budgetLimit).replace(/,/g, ''));
    if (isNaN(numericLimit) || numericLimit <= 0) {
      Alert.alert('Invalid Limit', 'Please enter a valid budget limit amount greater than 0.');
      return;
    }

    setIsSavingBudget(true);
    try {
      await budgetService.setBudget({
        category: finalCategory,
        limit: numericLimit,
        alertThreshold: budgetThreshold,
        color: budgetColor,
      });

      await fetchData();
      setShowBudgetModal(false);
      Alert.alert(
        'Budget Target Saved 🎉',
        `Monthly budget for "${finalCategory}" set to Rs. ${numericLimit.toLocaleString()}.`
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save budget. Please check your connection.');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleDeleteBudget = (id, categoryName) => {
    Alert.alert(
      'Delete Budget Target',
      `Are you sure you want to remove the budget for "${categoryName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSavingBudget(true);
            try {
              await budgetService.deleteBudget(id);
              await fetchData();
              setShowBudgetModal(false);
              Alert.alert('Removed', `Budget for "${categoryName}" was successfully removed.`);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete budget.');
            } finally {
              setIsSavingBudget(false);
            }
          },
        },
      ]
    );
  };

  const handleAddPresetAmount = (addAmount) => {
    const current = parseFloat(String(budgetLimit).replace(/,/g, '')) || 0;
    const nextVal = current + addAmount;
    setBudgetLimit(String(nextVal));
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <SafeAreaView style={styles.topSafeArea} />
      <SafeAreaView style={styles.container}>

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

            <TouchableOpacity
              style={styles.notificationBtn}
              activeOpacity={0.8}
              onPress={() => setShowNotifModal(true)}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {unreadCount > 0 && <View style={styles.notifBadgeDot} />}
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
                Total Monthly Budget: <Text style={styles.savingsHighlight}>Rs. {budgetOverview.totalBudget.toLocaleString()}</Text> ({budgetOverview.overallPercentage}% spent)
              </Text>
            </View>
          </View>

          {/* Monthly Category Budgets Tracker */}
          <View style={styles.cardContainer}>
            <View style={styles.velocityHeader}>
              <View style={styles.velocityTitleRow}>
                <View style={[styles.velocityIconBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="pie-chart-outline" size={16} color="#2563EB" />
                </View>
                <Text style={styles.cardTitle}>Category Budgets</Text>
              </View>

              <TouchableOpacity
                style={styles.setBudgetBtnPill}
                activeOpacity={0.8}
                onPress={handleOpenAddBudget}
              >
                <Ionicons name="add" size={14} color="#2563EB" style={{ marginRight: 2 }} />
                <Text style={styles.setBudgetBtnText}>Set Budget</Text>
              </TouchableOpacity>
            </View>

            {/* Spent / Target Info Bar */}
            <View style={styles.budgetSpentSubRow}>
              <Text style={styles.velocityTargetText}>
                {budgetOverview.totalSpent.toLocaleString()} / {budgetOverview.totalBudget.toLocaleString()} LKR
              </Text>
              <Text style={[
                styles.budgetRemainingPill,
                budgetOverview.totalRemaining <= 0 ? { color: '#EF4444' } : { color: '#16A34A' }
              ]}>
                {budgetOverview.totalRemaining <= 0 ? 'Limit Reached' : `Rs. ${budgetOverview.totalRemaining.toLocaleString()} left`}
              </Text>
            </View>

            {/* Category Progress Bars */}
            {(!budgetOverview.budgets || budgetOverview.budgets.length === 0) ? (
              <View style={styles.emptyBudgetBox}>
                <Ionicons name="pie-chart-outline" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyBudgetTitle}>No Category Budgets Yet</Text>
                <Text style={styles.emptyBudgetSubtitle}>
                  Set monthly category limits to receive smart warnings before overspending.
                </Text>
                <TouchableOpacity
                  style={styles.addFirstBudgetBtn}
                  activeOpacity={0.85}
                  onPress={handleOpenAddBudget}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.addFirstBudgetBtnText}>Set First Budget</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.categoryBudgetsList}>
                {budgetOverview.budgets.slice(0, 4).map((b) => (
                  <TouchableOpacity
                    key={b._id || b.category}
                    style={styles.budgetItemWrapper}
                    activeOpacity={0.7}
                    onPress={() => handleOpenEditBudget(b)}
                  >
                    <View style={styles.budgetMetaRow}>
                      <View style={styles.budgetTitleLeft}>
                        <View style={[styles.budgetCategoryDot, { backgroundColor: b.color || '#2563EB' }]} />
                        <Text style={styles.budgetCategoryTitle}>{b.category}</Text>
                        {b.isOverBudget && (
                          <View style={styles.overBudgetBadge}>
                            <Text style={styles.overBudgetText}>Over</Text>
                          </View>
                        )}
                        {!b.isOverBudget && b.isNearLimit && (
                          <View style={styles.nearBudgetBadge}>
                            <Text style={styles.nearBudgetText}>{b.percentage}%</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.budgetAmountsRight}>
                        <Text style={[
                          styles.budgetCategoryAmounts,
                          b.isOverBudget ? { color: '#EF4444', fontWeight: '800' } : null
                        ]}>
                          Rs. {b.spent.toLocaleString()} / {b.limit.toLocaleString()}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
                      </View>
                    </View>

                    {/* Progress Bar Track */}
                    <View style={styles.budgetProgressTrack}>
                      <View
                        style={[
                          styles.budgetProgressFill,
                          {
                            width: `${Math.min(b.percentage, 100)}%`,
                            backgroundColor: b.isOverBudget
                              ? '#EF4444'
                              : b.isNearLimit
                              ? '#F59E0B'
                              : (b.color || '#2563EB'),
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                ))}

                {/* View All Budgets Button if more than 4 */}
                {budgetOverview.budgets.length > 4 && (
                  <TouchableOpacity
                    style={styles.viewAllBudgetsBtn}
                    activeOpacity={0.7}
                    onPress={() => setShowAllBudgetsModal(true)}
                  >
                    <Text style={styles.viewAllBudgetsText}>
                      View all {budgetOverview.budgets.length} category budgets
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#2563EB" />
                  </TouchableOpacity>
                )}
              </View>
            )}
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
            {recentTx.length === 0 ? (
              <View style={styles.emptyRecentCard}>
                <View style={styles.emptyRecentCircle}>
                  <Ionicons name="sparkles-outline" size={24} color="#0284C7" />
                </View>
                <Text style={styles.emptyRecentTitle}>No transactions recorded yet</Text>
                <Text style={styles.emptyRecentSub}>
                  Tap "Expense" or "Scan Bill" above to record your very first expense!
                </Text>
                <TouchableOpacity
                  style={styles.addFirstBtn}
                  onPress={() => navigation?.navigate('AddExpense')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.addFirstBtnText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentTx.map((tx) => (
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
              ))
            )}
          </View>

          {/* Export Monthly Statement Banner */}
          <View style={styles.exportCard}>
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

              <TouchableOpacity
                style={styles.downloadCircleBtn}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate('Transactions', { openExport: true })}
              >
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <FloatingBottomNav currentScreen="Dashboard" navigation={navigation} />

      {/* Notification Popup Badge Modal matching Design Mockup */}
      <Modal
        visible={showNotifModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifModal(false)}
      >
        <TouchableOpacity
          style={styles.notifOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifModal(false)}
        >
          {/* Popup Card position anchored below top notification icon */}
          <View style={styles.notifPopupCard} onStartShouldSetResponder={() => true}>
            {/* Tooltip Triangle Pointer pointing to Bell Button */}
            <View style={styles.tooltipPointer} />

            {/* Popup Header */}
            <View style={styles.notifHeaderRow}>
              <View style={styles.notifTitleGroup}>
                <Text style={styles.notifHeaderTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.newBadgePill}>
                    <Text style={styles.newBadgeText}>{unreadCount} New</Text>
                  </View>
                )}
              </View>

              <View style={styles.notifHeaderRight}>
                <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
                  <Text style={styles.markAllReadText}>Mark all read</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowNotifModal(false)}
                  style={styles.closeNotifBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification List Items */}
            <ScrollView style={styles.notifListScroll} showsVerticalScrollIndicator={false}>
              {notifications.map((notif) => (
                <View key={notif.id} style={styles.notifItemRow}>
                  <View style={[styles.notifIconCircle, { backgroundColor: notif.iconBg }]}>
                    <Ionicons name={notif.icon} size={18} color={notif.iconColor} />
                  </View>

                  <View style={styles.notifContentGroup}>
                    <View style={styles.notifItemHeader}>
                      <Text style={styles.notifItemTitle}>{notif.title}</Text>
                      <Text style={styles.notifItemTime}>{notif.time}</Text>
                    </View>

                    {notif.description && (
                      <Text style={styles.notifItemDesc}>
                        {notif.highlight ? (
                          <>
                            Dining reached{' '}
                            <Text style={styles.highlightAmber}>{notif.highlight}</Text>
                            {notif.description.replace('Dining reached 85%', '')}
                          </>
                        ) : (
                          notif.description
                        )}
                      </Text>
                    )}

                    {/* Action Chips for Smart Budget Alert */}
                    {notif.hasActions && (
                      <View style={styles.notifActionRow}>
                        <TouchableOpacity
                          style={styles.adjustPillBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            const matched = (budgetOverview.budgets || []).find((b) =>
                              notif.title.toLowerCase().includes(b.category.toLowerCase())
                            );
                            if (matched) {
                              handleOpenEditBudget(matched);
                            } else {
                              handleOpenAddBudget();
                            }
                          }}
                        >
                          <Text style={styles.adjustBtnText}>Adjust Target</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setShowNotifModal(false);
                            setShowAllBudgetsModal(true);
                          }}
                        >
                          <Text style={styles.quickActionText}>View all</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add / Edit Budget Target Modal */}
      <Modal
        visible={showBudgetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdropOverlay}
        >
          <TouchableOpacity
            style={styles.modalDismissTouchable}
            activeOpacity={1}
            onPress={() => setShowBudgetModal(false)}
          />

          <View style={styles.budgetModalCard}>
            {/* Modal Drag Handle */}
            <View style={styles.modalDragHandle} />

            {/* Modal Header */}
            <View style={styles.budgetModalHeader}>
              <View style={styles.budgetModalTitleGroup}>
                <Text style={styles.budgetModalTitle}>
                  {editingBudget ? 'Edit Budget Target' : 'Set Category Budget'}
                </Text>
                <Text style={styles.budgetModalSub}>
                  {editingBudget
                    ? `Update monthly limit for ${editingBudget.category}`
                    : 'Set monthly limits to get smart alerts and avoid overspending.'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowBudgetModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.budgetModalScroll}
            >
              {/* 1. Category Selection */}
              <Text style={styles.inputSectionLabel}>Select Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipsRow}
              >
                {BUDGET_CATEGORIES.map((cat) => {
                  const isSelected = budgetCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.categoryChip,
                        isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}15` },
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setBudgetCategory(cat.name);
                        setBudgetColor(cat.color);
                      }}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={16}
                        color={isSelected ? cat.color : '#64748B'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && { color: cat.color, fontWeight: '700' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Category Input if "Other" is selected */}
              {budgetCategory === 'Other' && (
                <View style={styles.customCatInputWrapper}>
                  <TextInput
                    style={styles.customCatInput}
                    placeholder="Enter custom category name"
                    placeholderTextColor="#94A3B8"
                    value={customCategory}
                    onChangeText={setCustomCategory}
                  />
                </View>
              )}

              {/* 2. Monthly Budget Limit Input */}
              <Text style={styles.inputSectionLabel}>Monthly Limit (LKR)</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencyPrefixText}>Rs.</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={budgetLimit}
                  onChangeText={setBudgetLimit}
                />
                {budgetLimit.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setBudgetLimit('')}
                    style={styles.clearAmountBtn}
                  >
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.presetAmountsRow}>
                {PRESET_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.presetAmountBtn}
                    activeOpacity={0.7}
                    onPress={() => handleAddPresetAmount(amt)}
                  >
                    <Text style={styles.presetAmountText}>+Rs. {amt.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. Alert Threshold Selector */}
              <Text style={styles.inputSectionLabel}>Smart Warning Threshold</Text>
              <Text style={styles.inputSectionSub}>
                Receive warning notifications when spending reaches this percentage.
              </Text>
              <View style={styles.thresholdRow}>
                {THRESHOLD_OPTIONS.map((th) => {
                  const isSelected = budgetThreshold === th;
                  return (
                    <TouchableOpacity
                      key={th}
                      style={[
                        styles.thresholdBtn,
                        isSelected && styles.thresholdBtnActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => setBudgetThreshold(th)}
                    >
                      <Text
                        style={[
                          styles.thresholdBtnText,
                          isSelected && styles.thresholdBtnTextActive,
                        ]}
                      >
                        {th}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 4. Theme Color Selector */}
              <Text style={styles.inputSectionLabel}>Indicator Accent Color</Text>
              <View style={styles.colorPaletteRow}>
                {PALETTE_COLORS.map((clr) => {
                  const isSelected = budgetColor === clr;
                  return (
                    <TouchableOpacity
                      key={clr}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: clr },
                        isSelected && styles.colorSwatchActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setBudgetColor(clr)}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 5. Action Buttons */}
              <View style={styles.budgetModalActions}>
                <TouchableOpacity
                  style={[styles.saveBudgetBtn, isSavingBudget && { opacity: 0.7 }]}
                  activeOpacity={0.85}
                  onPress={handleSaveBudget}
                  disabled={isSavingBudget}
                >
                  {isSavingBudget ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={editingBudget ? 'save-outline' : 'checkmark-circle-outline'}
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.saveBudgetBtnText}>
                        {editingBudget ? 'Update Budget Target' : 'Save Budget Target'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {editingBudget && (
                  <TouchableOpacity
                    style={styles.deleteBudgetBtn}
                    activeOpacity={0.8}
                    onPress={() => handleDeleteBudget(editingBudget._id, editingBudget.category)}
                    disabled={isSavingBudget}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteBudgetBtnText}>Delete This Budget</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* All Category Budgets Overview Sheet */}
      <Modal
        visible={showAllBudgetsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllBudgetsModal(false)}
      >
        <View style={styles.modalBackdropOverlay}>
          <TouchableOpacity
            style={styles.modalDismissTouchable}
            activeOpacity={1}
            onPress={() => setShowAllBudgetsModal(false)}
          />

          <View style={styles.allBudgetsModalCard}>
            <View style={styles.modalDragHandle} />

            <View style={styles.allBudgetsHeader}>
              <View>
                <Text style={styles.allBudgetsTitle}>Monthly Category Budgets</Text>
                <Text style={styles.allBudgetsSub}>
                  Total: Rs. {budgetOverview.totalSpent.toLocaleString()} / Rs. {budgetOverview.totalBudget.toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAllBudgetsModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            >
              {/* Progress Summary Card */}
              <View style={styles.allBudgetsSummaryCard}>
                <View style={styles.summaryTopRow}>
                  <Text style={styles.summarySpentLabel}>
                    Spent: <Text style={styles.summarySpentVal}>Rs. {budgetOverview.totalSpent.toLocaleString()}</Text>
                  </Text>
                  <Text style={styles.summaryPctVal}>{budgetOverview.overallPercentage}%</Text>
                </View>
                <View style={styles.summaryTrack}>
                  <View
                    style={[
                      styles.summaryFill,
                      { width: `${Math.min(budgetOverview.overallPercentage, 100)}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Budgets List */}
              <View style={styles.allBudgetsListWrapper}>
                {(budgetOverview.budgets || []).map((b) => (
                  <View key={b._id || b.category} style={styles.allBudgetItemCard}>
                    <View style={styles.allBudgetTopRow}>
                      <View style={styles.allBudgetLeftGroup}>
                        <View style={[styles.allBudgetDot, { backgroundColor: b.color || '#2563EB' }]} />
                        <Text style={styles.allBudgetCategoryName}>{b.category}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.editBudgetRowBtn}
                        activeOpacity={0.7}
                        onPress={() => handleOpenEditBudget(b)}
                      >
                        <Ionicons name="pencil-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                        <Text style={styles.editBudgetRowBtnText}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.allBudgetAmountRow}>
                      <Text style={styles.allBudgetSpentText}>
                        Rs. {b.spent.toLocaleString()} <Text style={styles.allBudgetOfText}>of {b.limit.toLocaleString()}</Text>
                      </Text>
                      <Text
                        style={[
                          styles.allBudgetStatusBadge,
                          b.isOverBudget
                            ? styles.badgeOver
                            : b.isNearLimit
                            ? styles.badgeNear
                            : styles.badgeSafe,
                        ]}
                      >
                        {b.isOverBudget ? 'Over Budget' : `${b.percentage}%`}
                      </Text>
                    </View>

                    <View style={styles.budgetProgressTrack}>
                      <View
                        style={[
                          styles.budgetProgressFill,
                          {
                            width: `${Math.min(b.percentage, 100)}%`,
                            backgroundColor: b.isOverBudget
                              ? '#EF4444'
                              : b.isNearLimit
                              ? '#F59E0B'
                              : (b.color || '#2563EB'),
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addNewBudgetBtnSheet}
                activeOpacity={0.85}
                onPress={handleOpenAddBudget}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addNewBudgetBtnSheetText}>Set Another Category Budget</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
    borderWidth: 1.5,
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

  /* Category Budgets List */
  categoryBudgetsList: {
    marginTop: 8,
    gap: 12,
  },
  budgetItemWrapper: {
    marginBottom: 4,
  },
  budgetMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetCategoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  budgetCategoryAmounts: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  budgetProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
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

  /* Notification Overlay & Popup Badge */
  notifOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 40 : 54,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  notifPopupCard: {
    width: width * 0.9,
    maxHeight: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },
  tooltipPointer: {
    position: 'absolute',
    top: -8,
    right: 22,
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  newBadgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  notifHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  closeNotifBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Notification List Items */
  notifListScroll: {
    maxHeight: 360,
  },
  notifItemRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  notifIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  notifContentGroup: {
    flex: 1,
  },
  notifItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifItemTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notifItemDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  highlightAmber: {
    fontWeight: '700',
    color: '#D97706',
  },
  notifActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  adjustPillBtn: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adjustBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },

  /* Empty Recent Transactions Card */
  emptyRecentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 6,
  },
  emptyRecentCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyRecentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyRecentSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Budget Management Component Styles */
  setBudgetBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  setBudgetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  budgetSpentSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetRemainingPill: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBudgetBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyBudgetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptyBudgetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  addFirstBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addFirstBudgetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  budgetTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  budgetCategoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overBudgetBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  overBudgetText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  nearBudgetBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  nearBudgetText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  budgetAmountsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllBudgetsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  viewAllBudgetsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginRight: 4,
  },

  /* Budget Modal Styles */
  modalBackdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissTouchable: {
    flex: 1,
  },
  budgetModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  budgetModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  budgetModalTitleGroup: {
    flex: 1,
    paddingRight: 10,
  },
  budgetModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  budgetModalSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetModalScroll: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  inputSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 14,
    marginBottom: 8,
  },
  inputSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: -4,
    marginBottom: 10,
  },
  categoryChipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  customCatInputWrapper: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  customCatInput: {
    height: 42,
    fontSize: 14,
    color: '#0F172A',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  currencyPrefixText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearAmountBtn: {
    padding: 4,
  },
  presetAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  presetAmountBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  presetAmountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thresholdBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  thresholdBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  thresholdBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  thresholdBtnTextActive: {
    color: '#2563EB',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 4,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  budgetModalActions: {
    marginTop: 22,
    gap: 10,
  },
  saveBudgetBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBudgetBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBudgetBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    height: 44,
    borderRadius: 14,
  },
  deleteBudgetBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },

  /* All Budgets Sheet Styles */
  allBudgetsModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: '88%',
  },
  allBudgetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  allBudgetsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  allBudgetsSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  allBudgetsSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summarySpentLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summarySpentVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryPctVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  summaryTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  summaryFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  allBudgetsListWrapper: {
    gap: 10,
    marginBottom: 16,
  },
  allBudgetItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  allBudgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  allBudgetLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allBudgetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allBudgetCategoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  editBudgetRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBudgetRowBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  allBudgetAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allBudgetSpentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  allBudgetOfText: {
    fontWeight: '400',
    color: '#64748B',
  },
  allBudgetStatusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOver: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
  },
  badgeNear: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  badgeSafe: {
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
  },
  addNewBudgetBtnSheet: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 16,
    marginTop: 4,
  },
  addNewBudgetBtnSheetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
