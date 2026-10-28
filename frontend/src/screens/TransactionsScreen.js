import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import transactionService from '../services/transactionService';
import FloatingBottomNav from '../components/FloatingBottomNav';

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

export default function TransactionsScreen({ navigation, route }) {
  const [groupedTx, setGroupedTx] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Expenses', 'Income', 'Needs Review'
  const [refreshing, setRefreshing] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('History');

  // Detail Modal & Delete States
  const [selectedTx, setSelectedTx] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export Statement Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' or 'txt'
  const [exportRange, setExportRange] = useState('all'); // 'all', 'this_month', 'last_30'
  const [exportType, setExportType] = useState('all'); // 'all', 'expense', 'income'
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (route?.params?.openExport) {
      setShowExportModal(true);
    }
  }, [route?.params?.openExport]);

  const fetchTransactions = async () => {
    try {
      const [txList, summaryData] = await Promise.all([
        transactionService.getTransactions().catch(() => null),
        transactionService.getSummary().catch(() => null),
      ]);

      if (summaryData) {
        setSummary(summaryData);
      }

      if (txList && Array.isArray(txList) && txList.length > 0) {
        const groupsMap = {};

        txList.forEach((tx) => {
          const txDate = tx.date ? new Date(tx.date) : new Date();
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          let dateKey = txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          if (txDate.toDateString() === today.toDateString()) {
            dateKey = `Today, ${dateKey}`;
          } else if (txDate.toDateString() === yesterday.toDateString()) {
            dateKey = `Yesterday, ${dateKey}`;
          }

          if (!groupsMap[dateKey]) {
            groupsMap[dateKey] = {
              dateGroup: dateKey,
              totalSpend: 0,
              totalIncome: 0,
              items: [],
            };
          }

          const isIncome = tx.type === 'income';
          const numAmt = Number(tx.amount || 0);
          if (isIncome) {
            groupsMap[dateKey].totalIncome += numAmt;
          } else {
            groupsMap[dateKey].totalSpend += numAmt;
          }

          // Category icon and color mapping
          const cat = (tx.category || 'General').toLowerCase();
          let icon = 'cart-outline';
          let iconBg = '#DCFCE7';
          let iconColor = '#16A34A';

          if (isIncome) {
            icon = 'wallet-outline';
            iconBg = '#DCFCE7';
            iconColor = '#16A34A';
          } else if (cat.includes('food') || cat.includes('dining')) {
            icon = 'restaurant-outline';
            iconBg = '#FFEDD5';
            iconColor = '#EA580C';
          } else if (cat.includes('travel') || cat.includes('transport')) {
            icon = 'car-outline';
            iconBg = '#FEF3C7';
            iconColor = '#D97706';
          } else if (cat.includes('shop')) {
            icon = 'bag-handle-outline';
            iconBg = '#E0F2FE';
            iconColor = '#0284C7';
          } else if (cat.includes('bill') || cat.includes('utility')) {
            icon = 'receipt-outline';
            iconBg = '#F3E8FF';
            iconColor = '#9333EA';
          } else if (cat.includes('health')) {
            icon = 'medical-outline';
            iconBg = '#FEE2E2';
            iconColor = '#DC2626';
          }

          groupsMap[dateKey].items.push({
            id: tx._id,
            rawTx: tx,
            title: tx.title || 'Transaction',
            amount: `${isIncome ? '+' : '-'}Rs. ${numAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            type: tx.type || 'expense',
            timeDate: txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            categoryTag: tx.category || 'General',
            tagBg: isIncome ? '#DCFCE7' : '#E0F2FE',
            tagColor: isIncome ? '#16A34A' : '#0284C7',
            paymentMethod: tx.paymentMethod || 'Commercial Bank',
            methodIcon: 'card-outline',
            icon,
            iconBg,
            iconColor,
            needsReview: tx.isReviewed === false,
          });
        });

        const formattedGroups = Object.values(groupsMap).map((grp) => {
          let metaSummary = `${grp.items.length} Transactions`;
          let metaColor = '#64748B';
          if (grp.totalIncome > 0 && grp.totalSpend === 0) {
            metaSummary = `Income: +Rs. ${grp.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            metaColor = '#16A34A';
          } else if (grp.totalSpend > 0) {
            metaSummary = `Spent: Rs. ${grp.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            metaColor = '#64748B';
          }
          return {
            dateGroup: grp.dateGroup,
            metaSummary,
            metaColor,
            items: grp.items,
          };
        });

        setGroupedTx(formattedGroups);
      }
    } catch (err) {
      console.log('Using initial transactions design dataset:', err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, []);

  const handleExportStatement = async () => {
    setIsExporting(true);
    try {
      let startDate = null;
      let endDate = null;
      const now = new Date();

      if (exportRange === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      } else if (exportRange === 'last_30') {
        const past = new Date();
        past.setDate(past.getDate() - 30);
        startDate = past.toISOString();
        endDate = now.toISOString();
      }

      let csvContent = '';
      try {
        const backendCsv = await transactionService.exportTransactions({
          format: 'csv',
          type: exportType !== 'all' ? exportType : undefined,
          startDate,
          endDate,
        });
        if (typeof backendCsv === 'string' && backendCsv.length > 0) {
          csvContent = backendCsv;
        }
      } catch (e) {
        // Fallback to building CSV locally from loaded items
      }

      if (!csvContent) {
        const allItems = groupedTx.flatMap((grp) => grp.items || []);
        const filtered = allItems.filter((item) => {
          if (exportType === 'expense' && item.type !== 'expense') return false;
          if (exportType === 'income' && item.type !== 'income') return false;
          return true;
        });

        const headers = ['Transaction ID', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Time/Date'];
        const rows = filtered.map((item) => [
          `"${item.id || ''}"`,
          `"${(item.title || '').replace(/"/g, '""')}"`,
          `"${item.type || 'expense'}"`,
          `"${item.categoryTag || 'General'}"`,
          `"${item.amount || '0'}"`,
          `"${item.paymentMethod || 'Default'}"`,
          `"${item.timeDate || ''}"`,
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }

      if (exportFormat === 'csv') {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `Expenso_Statement_${now.toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setShowExportModal(false);
          Alert.alert('Statement Downloaded', 'Your CSV spreadsheet statement has been exported.');
        } else {
          await Share.share({
            title: `Expenso Statement (${now.toLocaleString('en-US', { month: 'short', year: 'numeric' })})`,
            message: csvContent,
          });
          setShowExportModal(false);
        }
      } else {
        const allItems = groupedTx.flatMap((grp) => grp.items || []);
        const totalInc = summary?.totalIncome || 0;
        const totalExp = summary?.totalExpense || 0;
        const netBal = summary?.balance !== undefined ? summary.balance : (totalInc - totalExp);

        const summaryText = [
          '========================================',
          '        EXPENSO FINANCIAL STATEMENT     ',
          '========================================',
          `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
          `Date Range: ${exportRange.replace('_', ' ').toUpperCase()}`,
          `Type Filter: ${exportType.toUpperCase()}`,
          '----------------------------------------',
          `Total Income : +Rs. ${Number(totalInc).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `Total Expense: -Rs. ${Number(totalExp).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `Net Balance  :  Rs. ${Number(netBal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          '========================================',
          '',
          'Ledger Entries:',
          ...allItems.slice(0, 20).map((it, i) => `${i + 1}. [${it.timeDate}] ${it.title} (${it.categoryTag}) - ${it.amount}`),
          '',
          '========================================',
          'Exported from Expenso Personal Finance',
        ].join('\n');

        await Share.share({
          title: 'Expenso Financial Statement Summary',
          message: summaryText,
        });
        setShowExportModal(false);
      }
    } catch (err) {
      if (err.message !== 'User did not share') {
        Alert.alert('Export Error', err.message || 'Could not export statement.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteTransaction = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await transactionService.deleteTransaction(id);
              setShowDetailModal(false);
              setSelectedTx(null);
              await fetchTransactions();
              Alert.alert('Deleted', 'Transaction removed successfully.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete transaction.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

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
              <Image
                source={require('../../assets/logo_expenso.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
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
              <Text style={styles.spendMainText}>
                {summary && summary.totalExpense !== undefined
                  ? Number(summary.totalExpense).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.')[0]
                  : '0'}
              </Text>
              <Text style={styles.currencySuffix}>
                .{summary && summary.totalExpense !== undefined
                  ? (Number(summary.totalExpense).toFixed(2).split('.')[1] || '00')
                  : '00'}
              </Text>
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

            <TouchableOpacity
              style={styles.actionBtnWrapper}
              activeOpacity={0.85}
              onPress={() => setShowExportModal(true)}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>Export</Text>
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
                  {summary?.totalCount !== undefined
                    ? summary.totalCount
                    : groupedTx.reduce((sum, grp) => sum + (grp.items?.length || 0), 0)}
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
            <TouchableOpacity
              style={styles.exportPillBtn}
              activeOpacity={0.8}
              onPress={() => setShowExportModal(true)}
            >
              <Ionicons name="download-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.exportPillText}>Export</Text>
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
                      <TouchableOpacity
                        style={styles.txRowCard}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedTx(item);
                          setShowDetailModal(true);
                        }}
                      >
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
                      </TouchableOpacity>

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
      <FloatingBottomNav currentScreen="Transactions" navigation={navigation} />

      {/* Transaction Detail & Actions Bottom Sheet Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalGrabBar} />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowDetailModal(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>

            {selectedTx && (
              <>
                <View style={[styles.detailIconBox, { backgroundColor: selectedTx.iconBg }]}>
                  <Ionicons name={selectedTx.icon} size={28} color={selectedTx.iconColor} />
                </View>

                <Text style={styles.detailTitle}>{selectedTx.title}</Text>
                <Text
                  style={[
                    styles.detailAmount,
                    selectedTx.type === 'income' ? styles.txIncomeText : styles.txExpenseText,
                  ]}
                >
                  {selectedTx.amount}
                </Text>

                <View style={styles.detailMetaCard}>
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Transaction Type</Text>
                    <Text style={[styles.detailMetaValue, { textTransform: 'capitalize' }]}>
                      {selectedTx.type}
                    </Text>
                  </View>

                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Category</Text>
                    <View style={[styles.categoryTag, { backgroundColor: selectedTx.tagBg }]}>
                      <Text style={[styles.categoryTagText, { color: selectedTx.tagColor }]}>
                        {selectedTx.categoryTag}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Payment Method</Text>
                    <Text style={styles.detailMetaValue}>{selectedTx.paymentMethod}</Text>
                  </View>

                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>Timestamp</Text>
                    <Text style={styles.detailMetaValue}>{selectedTx.timeDate}</Text>
                  </View>

                  {selectedTx.rawTx?.notes ? (
                    <View style={styles.detailMetaRow}>
                      <Text style={styles.detailMetaLabel}>Notes</Text>
                      <Text style={styles.detailMetaValue}>{selectedTx.rawTx.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Quick Share Item Button */}
                <TouchableOpacity
                  style={styles.shareTxBtnTouch}
                  activeOpacity={0.8}
                  onPress={() => {
                    Share.share({
                      title: `${selectedTx.title} - Expenso Receipt`,
                      message: `Expenso Receipt:\nTitle: ${selectedTx.title}\nAmount: ${selectedTx.amount}\nCategory: ${selectedTx.categoryTag}\nPayment Method: ${selectedTx.paymentMethod}\nTime: ${selectedTx.timeDate}\nRecorded in Expenso App`,
                    });
                  }}
                >
                  <Ionicons name="share-social-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.shareTxBtnText}>Share Receipt Details</Text>
                </TouchableOpacity>

                {selectedTx.id && !selectedTx.id.startsWith('tx-') ? (
                  <TouchableOpacity
                    style={styles.deleteBtnTouch}
                    activeOpacity={0.85}
                    onPress={() => handleDeleteTransaction(selectedTx.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator color="#EF4444" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                        <Text style={styles.deleteBtnText}>Delete Transaction</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.deleteBtnTouch}
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowDetailModal(false);
                      Alert.alert(
                        'Sample Design Item',
                        'This is a preloaded sample transaction. Use the "Expense" button to create live transactions in your MongoDB database!'
                      );
                    }}
                  >
                    <Text style={styles.demoDismissBtnText}>Close Preview</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Export Statement Sheet Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissOverlay}
            activeOpacity={1}
            onPress={() => setShowExportModal(false)}
          />

          <View style={styles.exportSheetCard}>
            <View style={styles.modalGrabBar} />

            <View style={styles.exportModalHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.exportModalTitle}>Export Financial Statement</Text>
                <Text style={styles.exportModalSub}>
                  Download CSV spreadsheets or share formatted summaries.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowExportModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.exportModalBody}>
              {/* 1. File Format Selection */}
              <Text style={styles.exportSectionTitle}>Select Export Format</Text>
              <View style={styles.formatSelectorRow}>
                <TouchableOpacity
                  style={[styles.formatCard, exportFormat === 'csv' && styles.formatCardActive]}
                  activeOpacity={0.8}
                  onPress={() => setExportFormat('csv')}
                >
                  <View style={[styles.formatIconCircle, exportFormat === 'csv' && styles.formatIconActive]}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={exportFormat === 'csv' ? '#2563EB' : '#64748B'}
                    />
                  </View>
                  <Text style={[styles.formatTitle, exportFormat === 'csv' && styles.formatTitleActive]}>
                    CSV / Excel
                  </Text>
                  <Text style={styles.formatSub}>Spreadsheet (.csv)</Text>
                  {exportFormat === 'csv' && (
                    <View style={styles.formatCheckBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formatCard, exportFormat === 'txt' && styles.formatCardActive]}
                  activeOpacity={0.8}
                  onPress={() => setExportFormat('txt')}
                >
                  <View style={[styles.formatIconCircle, exportFormat === 'txt' && styles.formatIconActive]}>
                    <Ionicons
                      name="reader-outline"
                      size={20}
                      color={exportFormat === 'txt' ? '#2563EB' : '#64748B'}
                    />
                  </View>
                  <Text style={[styles.formatTitle, exportFormat === 'txt' && styles.formatTitleActive]}>
                    Summary Report
                  </Text>
                  <Text style={styles.formatSub}>Text ledger (.txt)</Text>
                  {exportFormat === 'txt' && (
                    <View style={styles.formatCheckBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* 2. Date Range Filter */}
              <Text style={styles.exportSectionTitle}>Date Range</Text>
              <View style={styles.pillSelectorRow}>
                {[
                  { id: 'all', label: 'All Records' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_30', label: 'Last 30 Days' },
                ].map((r) => {
                  const isSelected = exportRange === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.optionPill, isSelected && styles.optionPillActive]}
                      onPress={() => setExportRange(r.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.optionPillText, isSelected && styles.optionPillTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. Transaction Type Filter */}
              <Text style={styles.exportSectionTitle}>Record Type</Text>
              <View style={styles.pillSelectorRow}>
                {[
                  { id: 'all', label: 'All (Income & Expenses)' },
                  { id: 'expense', label: 'Expenses Only' },
                  { id: 'income', label: 'Income Only' },
                ].map((t) => {
                  const isSelected = exportType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.optionPill, isSelected && styles.optionPillActive]}
                      onPress={() => setExportType(t.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.optionPillText, isSelected && styles.optionPillTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 4. Statement Summary Preview Box */}
              <View style={styles.exportSummaryCard}>
                <View style={styles.exportSummaryHeader}>
                  <Ionicons name="stats-chart-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.exportSummaryTitle}>Statement Preview</Text>
                </View>

                <View style={styles.exportSummaryRow}>
                  <Text style={styles.exportSummaryLabel}>Available Transactions</Text>
                  <Text style={styles.exportSummaryVal}>
                    {groupedTx.reduce((sum, grp) => sum + (grp.items?.length || 0), 0)} entries
                  </Text>
                </View>

                <View style={styles.exportSummaryRow}>
                  <Text style={styles.exportSummaryLabel}>Net Balance</Text>
                  <Text style={[styles.exportSummaryVal, { color: '#16A34A' }]}>
                    Rs. {Number(summary?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* Export Action Button */}
              <TouchableOpacity
                style={[styles.exportActionBtn, isExporting && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleExportStatement}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.exportActionBtnText}>
                      {exportFormat === 'csv' ? 'Export CSV Spreadsheet' : 'Export Statement Summary'}
                    </Text>
                  </>
                )}
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

  /* Transaction Detail Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    position: 'relative',
  },
  modalGrabBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  detailAmount: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
  },
  txExpenseText: {
    color: '#0F172A',
  },
  detailMetaCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailMetaLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  detailMetaValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  deleteBtnTouch: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
  demoDismissBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Header Export Button */
  exportPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  exportPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Share Receipt Button inside Detail Modal */
  shareTxBtnTouch: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareTxBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Export Sheet Modal Styles */
  modalDismissOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  exportSheetCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  exportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  exportModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  exportModalSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  exportModalBody: {
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  exportSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
  },
  formatSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  formatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  formatCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  formatIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  formatIconActive: {
    backgroundColor: '#DBEAFE',
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  formatTitleActive: {
    color: '#2563EB',
  },
  formatSub: {
    fontSize: 11,
    color: '#64748B',
  },
  formatCheckBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  pillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  optionPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  exportSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exportSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exportSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  exportSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exportSummaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  exportSummaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  exportActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 16,
    marginTop: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
