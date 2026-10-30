import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 5 Color Intensity Levels matching README specs:
// Level 0: No expense / rest day (subtle slate)
// Level 1: Low spend (light emerald green / safe)
// Level 2: Moderate spend (warm amber / balanced)
// Level 3: Elevated spend (orange / attention)
// Level 4: Heavy spend (crimson red / high outflow)
const COLOR_LEVELS = [
  { level: 0, bg: '#F1F5F9', border: '#E2E8F0', label: 'Zero' },
  { level: 1, bg: '#86EFAC', border: '#4ADE80', label: 'Low (< 2k)' },
  { level: 2, bg: '#FDE047', border: '#FACC15', label: 'Mid (2k-6k)' },
  { level: 3, bg: '#FB923C', border: '#F97316', label: 'High (6k-15k)' },
  { level: 4, bg: '#EF4444', border: '#DC2626', label: 'Peak (> 15k)' },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SpendingHeatmap({
  heatmapData = {},
  currency = 'Rs.',
  transactions = [],
}) {
  const [selectedRange, setSelectedRange] = useState(26); // Default 26 weeks (~6 months), switchable to 16w or 52w
  const [selectedCell, setSelectedCell] = useState(null);
  const scrollViewRef = useRef(null);

  // Derive daily intensity level based on amount
  const getIntensityLevel = (amount) => {
    if (!amount || amount <= 0) return 0;
    if (amount <= 2000) return 1;
    if (amount <= 6000) return 2;
    if (amount <= 15000) return 3;
    return 4;
  };

  // Build the 52 / 26 / 16 week grid
  const { weeks, monthLabels, stats } = useMemo(() => {
    const today = new Date();
    // Normalize to today midnight
    today.setHours(0, 0, 0, 0);

    // Current day of week: 0 (Sun) to 6 (Sat) -> convert to Mon=0 ... Sun=6
    const currentDayOfWeek = (today.getDay() + 6) % 7;

    // Total days to display = selectedRange * 7
    const totalDays = selectedRange * 7;
    // Start date is aligned to a Monday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDays - 1 - (6 - currentDayOfWeek)));

    const weeksArray = [];
    const months = [];
    let curWeek = [];
    let currentMonth = -1;

    let totalSpendInPeriod = 0;
    let activeDaysCount = 0;
    let zeroSpendDaysCount = 0;
    let peakSingleDay = { amount: 0, dateStr: null };

    const iter = new Date(startDate);

    for (let i = 0; i < totalDays; i++) {
      const dateStr = iter.toISOString().split('T')[0];
      const isFuture = iter > today;
      const spend = isFuture ? 0 : Number(heatmapData[dateStr] || 0);

      if (!isFuture) {
        if (spend > 0) {
          totalSpendInPeriod += spend;
          activeDaysCount++;
          if (spend > peakSingleDay.amount) {
            peakSingleDay = { amount: spend, dateStr };
          }
        } else {
          zeroSpendDaysCount++;
        }
      }

      const dayOfWeek = (iter.getDay() + 6) % 7;
      const monthIndex = iter.getMonth();

      // Track month transitions for header labels (placed on the Monday of the week)
      if (dayOfWeek === 0 && monthIndex !== currentMonth) {
        currentMonth = monthIndex;
        months.push({
          weekIndex: weeksArray.length,
          monthName: iter.toLocaleString('en-US', { month: 'short' }),
        });
      }

      curWeek.push({
        dateStr,
        fullDate: new Date(iter),
        amount: spend,
        isFuture,
        isToday: dateStr === today.toISOString().split('T')[0],
        level: isFuture ? -1 : getIntensityLevel(spend),
        dayOfWeek,
      });

      if (curWeek.length === 7) {
        weeksArray.push(curWeek);
        curWeek = [];
      }

      iter.setDate(iter.getDate() + 1);
    }

    if (curWeek.length > 0) {
      weeksArray.push(curWeek);
    }

    return {
      weeks: weeksArray,
      monthLabels: months,
      stats: {
        totalSpend: totalSpendInPeriod,
        activeDays: activeDaysCount,
        zeroDays: zeroSpendDaysCount,
        peak: peakSingleDay,
        dailyAvg: activeDaysCount > 0 ? Math.round(totalSpendInPeriod / activeDaysCount) : 0,
      },
    };
  }, [heatmapData, selectedRange]);

  // Auto-scroll to the right (most recent weeks/today) when range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedRange, weeks.length]);

  const handleCellPress = (cell) => {
    if (cell.isFuture) return;
    if (selectedCell?.dateStr === cell.dateStr) {
      setSelectedCell(null); // toggle off
    } else {
      setSelectedCell(cell);
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.cardContainer}>
      {/* 1. Header with Title & Range Switcher Pills */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconBadge}>
            <Ionicons name="grid-outline" size={16} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Spending Heatmap</Text>
            <Text style={styles.cardSubtitle}>52-Week Outflow Intensity</Text>
          </View>
        </View>

        {/* Range Selector Pills: 16w | 26w | 52w */}
        <View style={styles.rangePillContainer}>
          {[
            { label: '16W', weeks: 16 },
            { label: '26W', weeks: 26 },
            { label: '52W', weeks: 52 },
          ].map((r) => {
            const isActive = selectedRange === r.weeks;
            return (
              <TouchableOpacity
                key={r.weeks}
                style={[styles.rangePill, isActive && styles.rangePillActive]}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedRange(r.weeks);
                  setSelectedCell(null);
                }}
              >
                <Text style={[styles.rangePillText, isActive && styles.rangePillTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Top Analytics Metrics Strip */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Window Outflow</Text>
          <Text style={styles.metricValue}>
            {currency} {formatCurrency(stats.totalSpend)}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Daily Avg</Text>
          <Text style={[styles.metricValue, { color: '#0284C7' }]}>
            {currency} {stats.dailyAvg.toLocaleString()}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Zero-Spend Days</Text>
          <Text style={[styles.metricValue, { color: '#16A34A' }]}>
            {stats.zeroDays} Days 🌱
          </Text>
        </View>
      </View>

      {/* 3. Horizontal Scrollable Matrix */}
      <View style={styles.matrixWrapper}>
        {/* Left Day Labels (Mon, Wed, Fri) */}
        <View style={styles.dayLabelsColumn}>
          <View style={styles.monthHeaderSpacer} />
          {DAY_LABELS.map((day, idx) => (
            <View key={day} style={styles.dayLabelRow}>
              {idx % 2 === 0 ? (
                <Text style={styles.dayLabelText}>{day}</Text>
              ) : (
                <View style={{ height: 12 }} />
              )}
            </View>
          ))}
        </View>

        {/* Scrollable Columns for Weeks */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View>
            {/* Month Labels Bar above the columns */}
            <View style={styles.monthsRow}>
              {weeks.map((_, weekIdx) => {
                const matchMonth = monthLabels.find((m) => m.weekIndex === weekIdx);
                return (
                  <View key={`m-${weekIdx}`} style={styles.monthHeaderCol}>
                    {matchMonth ? (
                      <Text style={styles.monthLabelText}>{matchMonth.monthName}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* 7 Rows of Day Tiles */}
            <View style={styles.columnsContainer}>
              {weeks.map((week, weekIdx) => (
                <View key={`w-${weekIdx}`} style={styles.weekColumn}>
                  {week.map((dayCell) => {
                    const isSelected = selectedCell?.dateStr === dayCell.dateStr;
                    const levelCfg =
                      dayCell.level >= 0
                        ? COLOR_LEVELS[dayCell.level]
                        : { bg: '#F8FAFC', border: '#F1F5F9' };

                    return (
                      <TouchableOpacity
                        key={dayCell.dateStr}
                        activeOpacity={dayCell.isFuture ? 1 : 0.65}
                        disabled={dayCell.isFuture}
                        onPress={() => handleCellPress(dayCell)}
                        style={[
                          styles.tile,
                          {
                            backgroundColor: levelCfg.bg,
                            borderColor: isSelected
                              ? '#2563EB'
                              : dayCell.isToday
                              ? '#0284C7'
                              : levelCfg.border,
                            borderWidth: isSelected ? 2 : dayCell.isToday ? 1.5 : 1,
                            opacity: dayCell.isFuture ? 0.35 : 1,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 4. Interactive Detail Inspector Callout (when a day is pressed) */}
      {selectedCell && (
        <View style={styles.inspectorBanner}>
          <View style={styles.inspectorLeft}>
            <View
              style={[
                styles.inspectorDot,
                {
                  backgroundColor:
                    COLOR_LEVELS[selectedCell.level]?.bg || '#F1F5F9',
                  borderColor:
                    COLOR_LEVELS[selectedCell.level]?.border || '#CBD5E1',
                },
              ]}
            />
            <View>
              <Text style={styles.inspectorDate}>
                {selectedCell.fullDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.inspectorSpendText}>
                {selectedCell.amount > 0 ? (
                  <>
                    <Text style={styles.inspectorAmount}>
                      {currency} {formatCurrency(selectedCell.amount)}
                    </Text>
                    <Text style={styles.inspectorSub}> outflow recorded</Text>
                  </>
                ) : (
                  <Text style={styles.inspectorZeroText}>
                    ✨ No spending recorded (Zero-spend day!)
                  </Text>
                )}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.inspectorCloseBtn}
            activeOpacity={0.7}
            onPress={() => setSelectedCell(null)}
          >
            <Ionicons name="close" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}

      {/* 5. GitHub Legend Row at bottom */}
      <View style={styles.legendRow}>
        <View style={styles.legendLeft}>
          <Text style={styles.legendText}>Less</Text>
          <View style={styles.legendTiles}>
            {COLOR_LEVELS.map((c) => (
              <View
                key={c.level}
                style={[
                  styles.legendTile,
                  { backgroundColor: c.bg, borderColor: c.border },
                ]}
              />
            ))}
          </View>
          <Text style={styles.legendText}>More</Text>
        </View>

        <View style={styles.legendTip}>
          <View style={[styles.legendIndicatorDot, { backgroundColor: '#86EFAC' }]} />
          <Text style={styles.legendTipText}>Green = Safe</Text>
          <View style={[styles.legendIndicatorDot, { backgroundColor: '#EF4444', marginLeft: 8 }]} />
          <Text style={styles.legendTipText}>Red = High</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rangePillContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 2,
  },
  rangePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rangePillActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  rangePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  rangePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  matrixWrapper: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    width: 28,
    marginRight: 6,
    justifyContent: 'flex-start',
  },
  monthHeaderSpacer: {
    height: 18,
  },
  dayLabelRow: {
    height: 14,
    marginBottom: 3,
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  scrollContent: {
    paddingRight: 6,
  },
  monthsRow: {
    flexDirection: 'row',
    height: 18,
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  monthHeaderCol: {
    width: 17, // 14px tile + 3px margin
    overflow: 'visible',
  },
  monthLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  columnsContainer: {
    flexDirection: 'row',
  },
  weekColumn: {
    width: 14,
    marginRight: 3,
  },
  tile: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginBottom: 3,
  },
  inspectorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
  },
  inspectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inspectorDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 10,
  },
  inspectorDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  inspectorSpendText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1,
  },
  inspectorAmount: {
    fontWeight: '700',
    color: '#DC2626',
  },
  inspectorSub: {
    color: '#64748B',
  },
  inspectorZeroText: {
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 11,
  },
  inspectorCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  legendTiles: {
    flexDirection: 'row',
    marginHorizontal: 6,
  },
  legendTile: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    marginHorizontal: 1.5,
    borderWidth: 1,
  },
  legendTip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendTipText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
});

