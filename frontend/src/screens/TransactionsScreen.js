import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

// Default initial transaction grouped dataset matching screenshot
const DEFAULT_GROUPS = [
  {
    dateGroup: 'Today, 24 Oct',
    metaSummary: 'Spent: Rs. 8,620.00',
    metaColor: '#64748B',
    items: [
      {
        id: 'tx-1',
        title: 'Keells Super - Colombo',
        amount: '-Rs. 5,420.00',
        type: 'expense',
        timeDate: '05:42 PM',
        categoryTag: 'Groceries',
        tagBg: '#E0F2FE',
        tagColor: '#0284C7',
        paymentMethod: 'Sampath Bank',
        methodIcon: 'card-outline',
        icon: 'cart-outline',
        iconBg: '#DCFCE7',
        iconColor: '#16A34A',
        needsReview: false,
      },
      {
        id: 'tx-2',
        title: 'Ceypetco Fuel Shed',
        amount: '-Rs. 3,200.00',
        type: 'expense',
        timeDate: '01:15 PM',
        categoryTag: 'Needs Review',
        tagBg: '#FEE2E2',
        tagColor: '#EF4444',
        paymentMethod: 'Cash',
        methodIcon: 'cash-outline',
        icon: 'funnel-outline',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        needsReview: true,
      },
    ],
  },
  {
    dateGroup: 'Yesterday, 23 Oct',
    metaSummary: 'Net: +Rs. 67,450.00',
    metaColor: '#16A34A',
    items: [
      {
        id: 'tx-3',
        title: 'Stax Asia Consulting',
        isVerified: true,
        amount: '+Rs. 75,000.00',
        type: 'income',
        statusText: 'Successful',
        categoryTag: 'Income',
        tagBg: '#DCFCE7',
        tagColor: '#16A34A',
        paymentMethod: 'Commercial Bank',
        methodIcon: 'business-outline',
        icon: 'wallet-outline',
        iconBg: '#E0F2FE',
        iconColor: '#0284C7',
        needsReview: false,
      },
      {
        id: 'tx-4',
        title: 'Java Lounge - Jawatte',
        amount: '-Rs. 2,350.00',
        type: 'expense',
        timeDate: '04:22 PM',
        categoryTag: 'Dining',
        tagBg: '#E0F2FE',
        tagColor: '#0284C7',
        paymentMethod: 'Sampath Card',
        methodIcon: 'card-outline',
        icon: 'cafe-outline',
        iconBg: '#FFEDD5',
        iconColor: '#EA580C',
        needsReview: false,
      },
      {
        id: 'tx-5',
        title: 'Dialog Home Broadband',
        amount: '-Rs. 5,200.00',
        type: 'expense',
        timeDate: '09:10 AM',
        categoryTag: 'Utilities',
        tagBg: '#E0F2FE',
        tagColor: '#0284C7',
        paymentMethod: 'Commercial Bank',
        methodIcon: 'business-outline',
        icon: 'wifi-outline',
        iconBg: '#F3E8FF',
        iconColor: '#9333EA',
        needsReview: false,
      },
    ],
  },
  {
    dateGroup: '20 – 22 Oct',
    metaSummary: '3 Transactions',
    metaColor: '#64748B',
    items: [
      {
        id: 'tx-6',
        title: 'PickMe Colombo Taxi',
        amount: '-Rs. 1,450.00',
        type: 'expense',
        timeDate: '22 Oct',
        categoryTag: 'Transport',
        tagBg: '#E0F2FE',
        tagColor: '#0284C7',
        paymentMethod: 'Sampath Card',
        methodIcon: 'card-outline',
        icon: 'car-outline',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        needsReview: false,
      },
      {
        id: 'tx-7',
        title: 'Direct Transfer - Wire',
        amount: '+Rs. 120,000.00',
        type: 'income',
        statusText: 'Successful',
        categoryTag: 'Income',
        tagBg: '#DCFCE7',
        tagColor: '#16A34A',
        paymentMethod: 'Commercial Bank',
        methodIcon: 'business-outline',
        icon: 'cash-outline',
        iconBg: '#DCFCE7',
        iconColor: '#16A34A',
        needsReview: false,
      },
      {
        id: 'tx-8',
        title: 'Softlogic Glomark',
        amount: '-Rs. 14,890.00',
        type: 'expense',
        timeDate: '20 Oct',
        categoryTag: 'Needs Review',
        tagBg: '#FEE2E2',
        tagColor: '#EF4444',
        paymentMethod: 'OCR Match',
        methodIcon: 'document-text-outline',
        icon: 'receipt-outline',
        iconBg: '#FEE2E2',
        iconColor: '#EF4444',
        needsReview: true,
      },
    ],
  },
];

export default function TransactionsScreen({ navigation }) {
  const [groupedTx, setGroupedTx] = useState(DEFAULT_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Expenses', 'Income', 'Needs Review'
  const [refreshing, setRefreshing] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('History');

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        // Group transactions dynamically if API returns list
        const todayItems = [];
        res.data.forEach((tx, idx) => {
          todayItems.push({
            id: tx._id || `api-${idx}`,
            title: tx.title || 'Transaction',
            amount: `${tx.type === 'income' ? '+' : '-'}Rs. ${Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            type: tx.type || 'expense',
            timeDate: new Date(tx.date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            categoryTag: tx.category || 'General',
            tagBg: tx.type === 'income' ? '#DCFCE7' : '#E0F2FE',
            tagColor: tx.type === 'income' ? '#16A34A' : '#0284C7',
            paymentMethod: tx.paymentMethod || 'Commercial Bank',
            methodIcon: 'card-outline',
            icon: tx.type === 'income' ? 'wallet-outline' : 'cart-outline',
            iconBg: tx.type === 'income' ? '#DCFCE7' : '#E0F2FE',
            iconColor: tx.type === 'income' ? '#16A34A' : '#0284C7',
            needsReview: false,
          });
        });

        setGroupedTx([
          {
            dateGroup: 'Recent Activity',
            metaSummary: `${todayItems.length} Logged Items`,
            metaColor: '#64748B',
            items: todayItems,
          },
          ...DEFAULT_GROUPS.slice(1),
        ]);
      }
    } catch (err) {
      console.log('Using initial transactions design dataset:', err.message);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, []);

  // Filter transactions based on query & active tab
  const getFilteredGroups = () => {
    return groupedTx
      .map((group) => {
        const filteredItems = group.items.filter((item) => {
          // Search query check
          const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.categoryTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

          // Category filter check
          if (!matchesSearch) return false;
          if (activeFilter === 'Expenses') return item.type === 'expense';
          if (activeFilter === 'Income') return item.type === 'income';
          if (activeFilter === 'Needs Review') return item.needsReview === true;
          return true;
        });

        return { ...group, items: filteredItems };
      })
      .filter((group) => group.items.length > 0);
  };

  const filteredData = getFilteredGroups();

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
        {/* Sky-Blue Header Gradient Banner */}
        <LinearGradient
          colors={['#2563EB', '#3B82F6', '#4F46E5']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Top Brand Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadgeCircle}>
                <Ionicons name="diamond-outline" size={16} color="#FBBF24" />
              </View>
              <Text style={styles.brandTitle}>Expenso</Text>
            </View>

            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Spend Info Header */}
          <View style={styles.spendSection}>
            <View style={styles.monthBadge}>
              <Text style={styles.flagText}>LK</Text>
              <Text style={styles.monthBadgeText}>October 2024 Spend</Text>
            </View>

            <View style={styles.spendAmountRow}>
              <Text style={styles.currencyPrefix}>Rs. </Text>
              <Text style={styles.spendMainText}>184,320</Text>
              <Text style={styles.currencySuffix}>.50</Text>
            </View>

            <View style={styles.subPill}>
              <Ionicons name="trending-down-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.subPillText}>8.4% vs Sep</Text>
            </View>
          </View>

          {/* 4 Quick Circular Action Buttons */}
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

        {/* Search & Filter Bar Section */}
        <View style={styles.bodyContent}>
          <View style={styles.searchRowContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Keells, Fuel, Salary, Uber..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterIconButton} activeOpacity={0.8}>
              <Ionicons name="options-outline" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* Filter Pills Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'All' && styles.filterPillActive]}
              onPress={() => setActiveFilter('All')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, activeFilter === 'All' && styles.filterPillTextActive]}>
                All
              </Text>
              <View style={[styles.badgeCount, activeFilter === 'All' && styles.badgeCountActive]}>
                <Text style={[styles.badgeCountText, activeFilter === 'All' && styles.badgeCountTextActive]}>
                  24
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'Expenses' && styles.filterPillActive]}
              onPress={() => setActiveFilter('Expenses')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, activeFilter === 'Expenses' && styles.filterPillTextActive]}>
                Expenses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'Income' && styles.filterPillActive]}
              onPress={() => setActiveFilter('Income')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, activeFilter === 'Income' && styles.filterPillTextActive]}>
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, styles.filterPillAlert, activeFilter === 'Needs Review' && styles.filterPillAlertActive]}
              onPress={() => setActiveFilter('Needs Review')}
              activeOpacity={0.8}
            >
              <View style={styles.redDot} />
              <Text style={[styles.filterPillTextAlert, activeFilter === 'Needs Review' && styles.filterPillTextAlertActive]}>
                Needs Review
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Recent Transactions Header */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Grouped Transaction Lists */}
          {filteredData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No matching transactions</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
            </View>
          ) : (
            filteredData.map((group, groupIdx) => (
              <View key={groupIdx} style={styles.groupContainer}>
                {/* Group Date Header */}
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupDateText}>{group.dateGroup}</Text>
                  <Text style={[styles.groupMetaText, { color: group.metaColor }]}>
                    {group.metaSummary}
                  </Text>
                </View>

                {/* Cards Container */}
                <View style={styles.groupCardWrapper}>
                  {group.items.map((item, itemIdx) => (
                    <View key={item.id}>
                      <View style={styles.txRowCard}>
                        {/* Circle Icon */}
                        <View style={[styles.txIconCircle, { backgroundColor: item.iconBg }]}>
                          <Ionicons name={item.icon} size={20} color={item.iconColor} />
                        </View>

                        {/* Title & Sub Meta */}
                        <View style={styles.txMainInfo}>
                          <View style={styles.titleRow}>
                            <Text style={styles.txTitleText}>{item.title}</Text>
                            {item.needsReview && <View style={styles.titleRedDot} />}
                            {item.isVerified && (
                              <Ionicons name="checkmark-circle" size={14} color="#2563EB" style={{ marginLeft: 4 }} />
                            )}
                          </View>

                          <View style={styles.subMetaRow}>
                            <View style={[styles.categoryTag, { backgroundColor: item.tagBg }]}>
                              <Text style={[styles.categoryTagText, { color: item.tagColor }]}>
                                {item.categoryTag}
                              </Text>
                            </View>

                            <View style={styles.methodRow}>
                              <Ionicons name={item.methodIcon} size={11} color="#94A3B8" style={{ marginRight: 3 }} />
                              <Text style={styles.methodText}>{item.paymentMethod}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Amount & Time / Status */}
                        <View style={styles.txRightInfo}>
                          <Text style={[styles.txAmountText, item.type === 'income' && styles.txIncomeText]}>
                            {item.amount}
                          </Text>
                          {item.statusText ? (
                            <Text style={styles.txStatusText}>{item.statusText}</Text>
                          ) : (
                            <Text style={styles.txTimeText}>{item.timeDate}</Text>
                          )}
                        </View>
                      </View>

                      {/* Divider line between items inside group */}
                      {itemIdx < group.items.length - 1 && <View style={styles.itemDivider} />}
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.floatingNavBar}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('Home');
              navigation?.navigate('Dashboard');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveNavTab('History')}
            activeOpacity={0.8}
          >
            <View style={styles.navActiveCircle}>
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('Calendar');
              navigation?.navigate('Calendar');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveNavTab('Card')}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('Profile');
              navigation?.navigate('Settings');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={22} color="#94A3B8" />
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
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
  },

  /* Spend Header */
  spendSection: {
    alignItems: 'center',
    marginVertical: 4,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  flagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  monthBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  spendAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spendMainText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  currencySuffix: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  subPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Quick Actions Row */
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingHorizontal: 6,
  },
  actionBtnWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Body Content */
  bodyContent: {
    paddingHorizontal: 18,
    marginTop: 18,
  },

  /* Search Row */
  searchRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Filter Pills */
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  badgeCount: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  badgeCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  badgeCountTextActive: {
    color: '#FFFFFF',
  },
  filterPillAlert: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
  },
  filterPillAlertActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  redDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  filterPillTextAlert: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  filterPillTextAlertActive: {
    color: '#FFFFFF',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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

  /* Group Container */
  groupContainer: {
    marginBottom: 18,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  groupMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Cards Wrapper */
  groupCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  txRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  txIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txMainInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  txTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  titleRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginLeft: 4,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Right Info */
  txRightInfo: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  txIncomeText: {
    color: '#16A34A',
  },
  txTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  txStatusText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
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
