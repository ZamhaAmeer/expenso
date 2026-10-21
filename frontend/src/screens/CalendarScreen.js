import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line } from 'react-native-svg';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import FloatingBottomNav from '../components/FloatingBottomNav';

const { width } = Dimensions.get('window');

export default function CalendarScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [balance, setBalance] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate().toString());
  const [bills, setBills] = useState([]);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('Calendar');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/transactions/summary').catch(() => null);
        if (res?.data && res.data.balance !== undefined) {
          setBalance(Number(res.data.balance || 0));
        }
      } catch (e) {
        // quiet fallback
      }
    };
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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

            <Text style={styles.salaryCycleText}>Salary cycle: 25th Oct - 24th Nov</Text>
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
                Rs. 5,880 <Text style={styles.bufferSub}>/ day</Text>
              </Text>
            </View>

            <View style={styles.onTrackPill}>
              <View style={styles.greenDot} />
              <Text style={styles.onTrackText}>On Track</Text>
            </View>
          </View>

          {/* Month Selector & Legend Header */}
          <View style={styles.monthHeaderRow}>
            <View style={styles.monthTitleRow}>
              <Text style={styles.monthTitle}>October 2024</Text>
              <TouchableOpacity activeOpacity={0.7} style={{ marginLeft: 6 }}>
                <Ionicons name="chevron-back" size={14} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={{ marginLeft: 4 }}>
                <Ionicons name="chevron-forward" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
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
            {DAYS_STRIP.map((item) => {
              const isSelected = selectedDay === item.date;
              return (
                <TouchableOpacity
                  key={item.date}
                  style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  onPress={() => setSelectedDay(item.date)}
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
              <Text style={styles.outflowText}>Thursday, 17 Oct Recorded Outflow</Text>
            </View>
            <Text style={styles.outflowAmount}>Rs. 2,150.00</Text>
          </View>

          {/* October Velocity Chart Card */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>October Velocity</Text>
            <Text style={styles.cardSubtitle}>Cumulative spending trajectory vs budget</Text>

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
                  y1="35"
                  x2={width - 76}
                  y2="35"
                  stroke="#CBD5E1"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Shaded Area Below Curve */}
                <Path
                  d={`M 0 70 Q ${(width - 76) * 0.5} 55, ${(width - 76)} 20 L ${(width - 76)} 90 L 0 90 Z`}
                  fill="url(#curveGrad)"
                />

                {/* Trend Curve Line */}
                <Path
                  d={`M 0 70 Q ${(width - 76) * 0.5} 55, ${(width - 76)} 20`}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                />

                {/* Active Node at Today */}
                <Circle cx={(width - 76) * 0.53} cy="53" r="6" fill="#2563EB" />
                <Circle cx={(width - 76) * 0.53} cy="53" r="10" fill="#2563EB" opacity="0.25" />
              </Svg>

              {/* X-Axis Labels */}
              <View style={styles.xAxisRow}>
                <Text style={styles.xAxisText}>Oct 1 (Rs. 0)</Text>
                <Text style={styles.xAxisActive}>Today (Oct 17)</Text>
                <Text style={styles.xAxisText}>Oct 31 (Rs. 240k Cap)</Text>
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
                      <TouchableOpacity style={styles.payEarlyBtn} activeOpacity={0.85}>
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
                  Your rent due on Oct 25 is fully secured with 68% remaining disposable cushion.
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
});
