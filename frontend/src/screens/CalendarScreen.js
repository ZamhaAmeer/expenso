import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line } from 'react-native-svg';
import api from '../services/api';
import transactionService from '../services/transactionService';
import budgetService from '../services/budgetService';
import { AuthContext } from '../context/AuthContext';
import FloatingBottomNav from '../components/FloatingBottomNav';

const { width } = Dimensions.get('window');

// Date helper to compare same calendar day regardless of time
const isSameCalendarDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Generate 7-day week strip dynamically based on week offset and compute real outflow
const getDynamicWeekStrip = (weekOffset = 0, txList = [], safeDailyBuffer = 5000) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const base = new Date();
  base.setDate(base.getDate() + (weekOffset * 7));
  const today = new Date();
  const strip = [];

  for (let i = -3; i <= 3; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);

    // Compute real daily outflow from transactions
    const dayOutflow = (txList || [])
      .filter((tx) => tx.type === 'expense' && isSameCalendarDay(tx.date, d))
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const isToday = isSameCalendarDay(d, today);
    let dotColor = '#10B981'; // Green: low or 0 outflow
    if (dayOutflow > 0 && dayOutflow <= safeDailyBuffer) {
      dotColor = '#EAB308'; // Amber: medium outflow
    } else if (dayOutflow > safeDailyBuffer) {
      dotColor = '#EF4444'; // Red: high outflow
    }
    if (isToday) {
      dotColor = '#2563EB'; // Blue: today
    }

    strip.push({
      day: days[d.getDay()],
      date: d.getDate().toString(),
      fullDate: d,
      isToday,
      outflow: dayOutflow,
      dotColor,
    });
  }
  return strip;
};

// Generate spending velocity curve coordinates from real transaction data
const generateVelocityChartData = (txList = [], monthlyCap = 240000, chartW = width - 76, chartH = 100) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayDate = now.getDate();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const monthShort = now.toLocaleString('en-US', { month: 'short' });

  // Filter expenses for current month
  const monthExpenses = (txList || []).filter((tx) => {
    if (tx.type !== 'expense') return false;
    const d = new Date(tx.date || Date.now());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Calculate daily totals up to today
  const dailyTotals = Array(daysInMonth + 1).fill(0);
  monthExpenses.forEach((tx) => {
    const d = new Date(tx.date || Date.now());
    const day = d.getDate();
    if (day >= 1 && day <= daysInMonth) {
      dailyTotals[day] += Number(tx.amount) || 0;
    }
  });

  // Calculate cumulative spending up to today
  let cumulative = 0;
  const points = [];
  for (let day = 1; day <= todayDate; day++) {
    cumulative += dailyTotals[day];
    const x = Math.max(2, (day / daysInMonth) * chartW);
    const ratio = monthlyCap > 0 ? Math.min(1.05, cumulative / monthlyCap) : 0;
    const y = Math.max(15, 85 - (ratio * 65));
    points.push({ day, x, y, cumulative });
  }

  // Linear target guide coordinates for today
  const targetRatio = todayDate / daysInMonth;
  const targetX = targetRatio * chartW;
  const targetY = 85 - (targetRatio * 65);

  let curvePath = `M 0 85`;
  let areaPath = `M 0 85`;

  if (points.length > 0) {
    points.forEach((p, idx) => {
      if (idx === 0) {
        curvePath += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      } else {
        const prev = points[idx - 1];
        curvePath += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      }
    });

    const lastPoint = points[points.length - 1];
    areaPath = `${curvePath} L ${lastPoint.x.toFixed(1)} 90 L 0 90 Z`;
  } else {
    curvePath = `M 0 85 L ${(chartW * 0.5).toFixed(1)} 70`;
    areaPath = `M 0 85 L ${(chartW * 0.5).toFixed(1)} 70 L ${(chartW * 0.5).toFixed(1)} 90 L 0 90 Z`;
  }

  const todayPoint = points.length > 0 ? points[points.length - 1] : { x: targetX, y: targetY, cumulative: 0 };

  return {
    curvePath,
    areaPath,
    todayPoint,
    totalSpent: cumulative,
    daysInMonth,
    todayDate,
    monthName,
    monthShort,
    targetY,
  };
};

export default function CalendarScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [balance, setBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [budgetCap, setBudgetCap] = useState(240000);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [bills, setBills] = useState([]);
  const [showAdvisor, setShowAdvisor] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [summaryRes, txRes, budgetRes] = await Promise.all([
        transactionService.getSummary().catch(() => null),
        transactionService.getTransactions().catch(() => null),
        budgetService.getBudgets().catch(() => null),
      ]);

      if (summaryRes) {
        setBalance(Number(summaryRes.balance || 0));
        setTotalIncome(Number(summaryRes.totalIncome || 0));
        setTotalExpense(Number(summaryRes.totalExpense || 0));
      }

      if (txRes && Array.isArray(txRes)) {
        setTransactions(txRes);
      }

      if (budgetRes && budgetRes.totalBudget) {
        setBudgetCap(Number(budgetRes.totalBudget) || 240000);
      }

      // Populate detected / recurring bills
      setBills([
        {
          id: 'bill-1',
          title: 'Dialog Home Broadband',
          amount: 'Rs. 3,490.00',
          rawAmount: 3490,
          category: 'Utilities',
          icon: 'wifi-outline',
          iconBg: '#F3E8FF',
          iconColor: '#9333EA',
          isActionable: true,
          actionText: 'Pay Early',
          status: 'Due Soon',
          statusBg: '#FEF3C7',
          statusColor: '#D97706',
        },
        {
          id: 'bill-2',
          title: 'CEB Electricity Bill',
          amount: 'Rs. 8,250.00',
          rawAmount: 8250,
          category: 'Utilities',
          icon: 'flash-outline',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          isActionable: false,
          status: 'Auto-Debit 28th',
          statusBg: '#DCFCE7',
          statusColor: '#16A34A',
        },
        {
          id: 'bill-3',
          title: 'Netflix Premium Subscription',
          amount: 'Rs. 2,200.00',
          rawAmount: 2200,
          category: 'Entertainment',
          icon: 'film-outline',
          iconBg: '#FEE2E2',
          iconColor: '#EF4444',
          isActionable: false,
          status: 'Subscribed',
          statusBg: '#E0F2FE',
          statusColor: '#0284C7',
        },
      ]);
    } catch (e) {
      console.log('Error loading calendar data:', e.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Compute daily safe buffer metrics
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);
  const remainingBudget = Math.max(0, budgetCap - totalExpense);
  const safeDailySpend = Math.round(remainingBudget / daysRemaining);

  // Dynamic 7-day week strip
  const daysStrip = getDynamicWeekStrip(weekOffset, transactions, safeDailySpend);

  // Filter transactions for the selected calendar date
  const selectedDayTransactions = transactions.filter((tx) =>
    isSameCalendarDay(tx.date, selectedDate)
  );

  const selectedDayOutflow = selectedDayTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const isDailyOnTrack = selectedDayOutflow <= safeDailySpend;

  // Velocity Chart data
  const velocityChart = generateVelocityChartData(transactions, budgetCap);

  const handleShiftWeek = (delta) => {
    setWeekOffset((prev) => {
      const nextOffset = prev + delta;
      const newBase = new Date();
      newBase.setDate(newBase.getDate() + (nextOffset * 7));
      setSelectedDate(newBase);
      return nextOffset;
    });
  };

  const handleBillAction = (bill) => {
    navigation?.navigate('AddExpense', {
      prefillMerchant: bill.title,
      prefillAmount: bill.rawAmount,
      prefillCategory: bill.category,
    });
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
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

          {/* AI Forecast & Balance Display */}
          <View style={styles.forecastSection}>
            <View style={styles.forecastPill}>
              <Text style={styles.flagText}>LK</Text>
              <Text style={styles.forecastText}>AI Forecast • End of Month Balance</Text>
            </View>

            <View style={styles.balanceAmountRow}>
              <Text style={styles.currencyPrefix}>Rs. </Text>
              <Text style={styles.balanceMainText}>
                {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            <Text style={styles.salaryCycleText}>
              Salary cycle: 25th {velocityChart.monthShort} - 24th {new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleString('en-US', { month: 'short' })}
            </Text>
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
              onPress={() => navigation?.navigate('Transactions')}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnWrapper}
              activeOpacity={0.85}
              onPress={() => navigation?.navigate('Settings')}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="ellipsis-horizontal-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>More</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Main Body Content */}
        <View style={styles.bodyContent}>
          {/* Overlapping Daily Safe Spend Buffer Card */}
          <View style={styles.bufferCard}>
            <View style={styles.lightningCircle}>
              <Ionicons name="flash-outline" size={20} color="#0284C7" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.bufferLabel}>DAILY SAFE SPEND BUFFER</Text>
              <Text style={styles.bufferValue}>
                Rs. {safeDailySpend.toLocaleString()} <Text style={styles.bufferSub}>/ day</Text>
              </Text>
            </View>

            <View style={[styles.onTrackPill, !isDailyOnTrack && { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.greenDot, !isDailyOnTrack && { backgroundColor: '#D97706' }]} />
              <Text style={[styles.onTrackText, !isDailyOnTrack && { color: '#D97706' }]}>
                {isDailyOnTrack ? 'On Track' : 'High Outflow'}
              </Text>
            </View>
          </View>

          {/* Month Selector & Legend Header */}
          <View style={styles.monthHeaderRow}>
            <View style={styles.monthTitleRow}>
              <Text style={styles.monthTitle}>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ marginLeft: 8, padding: 4 }}
                onPress={() => handleShiftWeek(-1)}
              >
                <Ionicons name="chevron-back" size={16} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ marginLeft: 4, padding: 4 }}
                onPress={() => handleShiftWeek(1)}
              >
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Low</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} />
                <Text style={styles.legendText}>Med</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.legendText}>Today</Text>
              </View>
            </View>
          </View>

          {/* 7-Day Date Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStripRow}
          >
            {daysStrip.map((item) => {
              const isSelected = isSameCalendarDay(selectedDate, item.fullDate);
              return (
                <TouchableOpacity
                  key={item.fullDate.toISOString()}
                  style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  onPress={() => setSelectedDate(item.fullDate)}
                  activeOpacity={0.85}
                >
                  {isSelected && <View style={styles.cornerActiveDot} />}

                  <Text style={[styles.dayNameText, isSelected && styles.dayNameActive]}>
                    {item.day}
                  </Text>
                  <Text style={[styles.dateNumberText, isSelected && styles.dateNumberActive]}>
                    {item.date}
                  </Text>

                  {isSelected ? (
                    <View style={styles.selectedWhiteDot} />
                  ) : (
                    <View style={[styles.dayStatusDot, { backgroundColor: item.dotColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Selected Outflow Banner */}
          <View style={styles.outflowBanner}>
            <View style={styles.outflowLeft}>
              <Ionicons name="calendar-outline" size={16} color="#0284C7" style={{ marginRight: 8 }} />
              <Text style={styles.outflowText}>
                {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} Recorded Outflow
              </Text>
            </View>
            <Text style={styles.outflowAmount}>
              Rs. {selectedDayOutflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Selected Day Transactions Breakdown */}
          {selectedDayTransactions.length > 0 ? (
            <View style={styles.dayTxContainer}>
              <View style={styles.dayTxHeader}>
                <Text style={styles.dayTxHeaderTitle}>
                  Activity on {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={styles.dayTxCountBadge}>{selectedDayTransactions.length} recorded</Text>
              </View>

              <View style={styles.dayTxList}>
                {selectedDayTransactions.map((tx) => (
                  <View key={tx._id || tx.id} style={styles.dayTxItem}>
                    <View style={[
                      styles.dayTxIconCircle,
                      { backgroundColor: tx.type === 'income' ? '#DCFCE7' : '#EFF6FF' }
                    ]}>
                      <Ionicons
                        name={tx.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'}
                        size={16}
                        color={tx.type === 'income' ? '#16A34A' : '#2563EB'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayTxTitle}>{tx.title || 'Transaction'}</Text>
                      <Text style={styles.dayTxSub}>
                        {tx.category || 'General'} • {tx.paymentMethod || 'Default'}
                      </Text>
                    </View>
                    <Text style={[
                      styles.dayTxAmount,
                      tx.type === 'income' ? { color: '#16A34A' } : { color: '#0F172A' }
                    ]}>
                      {tx.type === 'income' ? '+' : '-'}Rs. {Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyDayNotice}>
              <Ionicons name="receipt-outline" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.emptyDayNoticeText}>No transactions recorded on this day.</Text>
            </View>
          )}

          {/* Monthly Velocity Chart Card */}
          <View style={styles.cardContainer}>
            <View style={styles.velocityCardHeader}>
              <View>
                <Text style={styles.cardTitle}>{velocityChart.monthName} Velocity</Text>
                <Text style={styles.cardSubtitle}>Cumulative spending trajectory vs budget</Text>
              </View>
              <View style={styles.velocityBadge}>
                <Text style={styles.velocityBadgeText}>
                  Rs. {velocityChart.totalSpent.toLocaleString()} spent
                </Text>
              </View>
            </View>

            {/* SVG Trend Chart */}
            <View style={styles.chartWrapper}>
              <Svg width={width - 76} height={100}>
                <Defs>
                  <SvgGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                    <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </SvgGradient>
                </Defs>

                {/* Dotted Target Budget Line */}
                <Line
                  x1="0"
                  y1="85"
                  x2={width - 76}
                  y2="20"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Shaded Area Below Real Cumulative Curve */}
                <Path
                  d={velocityChart.areaPath}
                  fill="url(#curveGrad)"
                />

                {/* Real Cumulative Trend Curve Line */}
                <Path
                  d={velocityChart.curvePath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                />

                {/* Active Node at Current Day */}
                <Circle cx={velocityChart.todayPoint.x} cy={velocityChart.todayPoint.y} r="6" fill="#2563EB" />
                <Circle cx={velocityChart.todayPoint.x} cy={velocityChart.todayPoint.y} r="11" fill="#2563EB" opacity="0.22" />
              </Svg>

              {/* X-Axis Labels */}
              <View style={styles.xAxisRow}>
                <Text style={styles.xAxisText}>1st (Rs. 0)</Text>
                <Text style={styles.xAxisActive}>Today ({velocityChart.monthShort} {velocityChart.todayDate})</Text>
                <Text style={styles.xAxisText}>{velocityChart.daysInMonth}th (Rs. {(budgetCap / 1000).toFixed(0)}k Cap)</Text>
              </View>
            </View>
          </View>

          {/* Scheduled Recurring Bills */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Scheduled Recurring Bills</Text>
            {bills.length > 0 && (
              <View style={styles.upcomingPill}>
                <Text style={styles.upcomingText}>{bills.length} Upcoming</Text>
              </View>
            )}
          </View>

          <View style={styles.billsList}>
            {bills.length === 0 ? (
              <View style={styles.emptyBillsCard}>
                <Ionicons name="calendar-outline" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyBillsTitle}>No recurring bills due</Text>
                <Text style={styles.emptyBillsSub}>
                  Upcoming subscriptions and repeating bills will appear here automatically.
                </Text>
              </View>
            ) : (
              bills.map((bill) => (
                <View key={bill.id} style={styles.billCard}>
                  <View style={[styles.billIconCircle, { backgroundColor: bill.iconBg }]}>
                    <Ionicons name={bill.icon} size={20} color={bill.iconColor} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.billTitle}>{bill.title}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.billAmount, bill.amountColor && { color: bill.amountColor }]}>
                      {bill.amount}
                    </Text>

                    {bill.isActionable ? (
                      <TouchableOpacity
                        style={styles.payEarlyBtn}
                        activeOpacity={0.85}
                        onPress={() => handleBillAction(bill)}
                      >
                        <Text style={styles.payEarlyText}>{bill.actionText}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: bill.statusBg }]}>
                        <Text style={[styles.statusText, { color: bill.statusColor }]}>
                          {bill.status}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Expenso Advisor AI Banner */}
          {showAdvisor && (
            <View style={styles.advisorCard}>
              <View style={styles.advisorRobotCircle}>
                <Ionicons name="hardware-chip-outline" size={20} color="#FFFFFF" />
              </View>

              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={styles.advisorTitle}>Expenso Advisor </Text>
                  <Ionicons name="sparkles" size={13} color="#2563EB" />
                </View>
                <Text style={styles.advisorBody}>
                  {isDailyOnTrack
                    ? `Your spending is on track! Rs. ${remainingBudget.toLocaleString()} disposable cushion remaining for the next ${daysRemaining} days.`
                    : `Today's outflow (Rs. ${selectedDayOutflow.toLocaleString()}) exceeded your daily safe spend buffer (Rs. ${safeDailySpend.toLocaleString()}).`}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowAdvisor(false)}
                activeOpacity={0.7}
                style={styles.closeAdvisorBtn}
              >
                <Ionicons name="close" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <FloatingBottomNav currentScreen="Calendar" navigation={navigation} />
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

  /* Forecast Section */
  forecastSection: {
    alignItems: 'center',
    marginVertical: 4,
  },
  forecastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
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
  forecastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
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
  salaryCycleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },

  /* Quick Actions Row */
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
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
  },

  /* Buffer Overlapping Card */
  bufferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -28,
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  lightningCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bufferLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  bufferValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bufferSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  onTrackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  onTrackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },

  /* Month Header Row */
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Date Strip */
  dateStripRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 6,
    marginBottom: 14,
  },
  dateCard: {
    width: 52,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dateCardActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cornerActiveDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  dayNameActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dateNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  dateNumberActive: {
    color: '#FFFFFF',
  },
  dayStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  selectedWhiteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  /* Outflow Banner */
  outflowBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  outflowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  outflowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  outflowAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },

  /* Chart */
  chartWrapper: {
    alignItems: 'center',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  xAxisText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  xAxisActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Bills Section */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  upcomingPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  billsList: {
    gap: 10,
    marginBottom: 20,
  },
  billCard: {
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
  billIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  billAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  payEarlyBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  payEarlyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Advisor Card */
  advisorCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginBottom: 20,
  },
  advisorRobotCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  advisorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  advisorBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  closeAdvisorBtn: {
    padding: 4,
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

  /* Empty Recurring Bills State */
  emptyBillsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 4,
  },
  emptyBillsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyBillsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  /* Velocity Header & Badge */
  velocityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  velocityBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  velocityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Selected Day Transactions Activity */
  dayTxContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  dayTxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  dayTxHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dayTxCountBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dayTxList: {
    gap: 10,
  },
  dayTxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayTxIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dayTxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  dayTxSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  dayTxAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyDayNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDayNoticeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
