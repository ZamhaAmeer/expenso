import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Supported currencies with symbols, country flags, and full names
export const CURRENCY_CATALOG = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
];

// Baseline benchmark peg exchange rates (relative to USD = 1.0)
const BENCHMARK_RATES = {
  USD: 1.0,
  LKR: 302.5,
  EUR: 0.925,
  GBP: 0.782,
  INR: 84.2,
  AED: 3.673,
  SGD: 1.332,
  AUD: 1.524,
  CAD: 1.388,
  JPY: 153.4,
};

const PRESET_AMOUNTS = [10, 50, 100, 500, 1000];

export default function CurrencyConverterModal({
  visible,
  onClose,
  navigation,
  initialBase = 'USD',
  initialTarget = 'LKR',
}) {
  const [fromCode, setFromCode] = useState(initialBase);
  const [toCode, setToCode] = useState(initialTarget);
  const [amountInput, setAmountInput] = useState('100');
  const [rates, setRates] = useState(BENCHMARK_RATES);
  const [rateSource, setRateSource] = useState('Market Benchmark');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch live market exchange rates when modal opens
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    const fetchLiveRates = async () => {
      try {
        setIsRefreshing(true);
        // Free open exchange rate endpoint with 3s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.rates && isMounted) {
            setRates((prev) => ({
              ...prev,
              USD: 1.0,
              LKR: data.rates.LKR || prev.LKR,
              EUR: data.rates.EUR || prev.EUR,
              GBP: data.rates.GBP || prev.GBP,
              INR: data.rates.INR || prev.INR,
              AED: data.rates.AED || prev.AED,
              SGD: data.rates.SGD || prev.SGD,
              AUD: data.rates.AUD || prev.AUD,
              CAD: data.rates.CAD || prev.CAD,
              JPY: data.rates.JPY || prev.JPY,
            }));
            setRateSource('Live Forex Feed 🟢');
          }
        }
      } catch (err) {
        // Fallback gracefully to offline benchmark rates
        if (isMounted) {
          setRateSource('Central Bank Peg (Offline)');
        }
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    };

    fetchLiveRates();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Currency swap handler
  const handleSwapCurrencies = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  // Compute conversion
  const numericAmount = parseFloat(amountInput.replace(/,/g, '')) || 0;
  const fromRate = rates[fromCode] || 1;
  const toRate = rates[toCode] || 1;

  // Amount in USD = amount / fromRate; Amount in Target = USD * toRate
  const convertedAmount = fromRate > 0 ? (numericAmount / fromRate) * toRate : 0;
  const unitRate = fromRate > 0 ? toRate / fromRate : 0;
  const inverseUnitRate = toRate > 0 ? fromRate / toRate : 0;

  const fromCurrencyMeta = CURRENCY_CATALOG.find((c) => c.code === fromCode) || CURRENCY_CATALOG[0];
  const toCurrencyMeta = CURRENCY_CATALOG.find((c) => c.code === toCode) || CURRENCY_CATALOG[1];

  const formatNumber = (val, maxDecimals = 2) =>
    Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });

  // Action: Log directly into expense form
  const handleLogConvertedExpense = () => {
    onClose();
    navigation?.navigate('AddExpense', {
      prefillAmount: toCode === 'LKR' ? convertedAmount : numericAmount,
      prefillMerchant: `Converted from ${fromCode} ${numericAmount}`,
      prefillCategory: 'Travel',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContentCard}>
          {/* Top Grab Handle */}
          <View style={styles.grabBar} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <View style={styles.titleIconBadge}>
                  <Ionicons name="swap-horizontal" size={18} color="#2563EB" />
                </View>
                <Text style={styles.modalTitle}>Currency Converter</Text>
              </View>
              <Text style={styles.rateStatusText}>
                {rateSource} • 1 {fromCode} = {formatNumber(unitRate, 4)} {toCode}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* 1. "From" Currency Box */}
            <View style={styles.currencyBox}>
              <View style={styles.boxHeaderRow}>
                <Text style={styles.boxLabel}>YOU SEND / BASE</Text>
                <Text style={styles.flagBadge}>
                  {fromCurrencyMeta.flag} {fromCurrencyMeta.name}
                </Text>
              </View>

              <View style={styles.amountInputRow}>
                <TextInput
                  style={styles.amountInput}
                  value={amountInput}
                  onChangeText={(val) => setAmountInput(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  selectTextOnFocus
                />
                <View style={styles.currencyTagPill}>
                  <Text style={styles.currencyTagSymbol}>{fromCurrencyMeta.symbol}</Text>
                  <Text style={styles.currencyTagCode}>{fromCode}</Text>
                </View>
              </View>

              {/* Horizontal Scroll of "From" Currency Selectors */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
              >
                {CURRENCY_CATALOG.map((c) => {
                  const isSelected = c.code === fromCode;
                  return (
                    <TouchableOpacity
                      key={`from-${c.code}`}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setFromCode(c.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipFlag}>{c.flag}</Text>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {c.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Quick Amount Presets */}
            <View style={styles.presetsRow}>
              {PRESET_AMOUNTS.map((p) => (
                <TouchableOpacity
                  key={`p-${p}`}
                  style={[
                    styles.presetPill,
                    numericAmount === p && styles.presetPillActive,
                  ]}
                  onPress={() => setAmountInput(String(p))}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.presetText,
                      numericAmount === p && styles.presetTextActive,
                    ]}
                  >
                    {fromCurrencyMeta.symbol}
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Swap Button Divider */}
            <View style={styles.swapDividerRow}>
              <View style={styles.dividerLine} />
              <TouchableOpacity
                style={styles.swapCircleBtn}
                activeOpacity={0.8}
                onPress={handleSwapCurrencies}
              >
                <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.dividerLine} />
            </View>

            {/* 2. "To" Converted Result Box */}
            <View style={[styles.currencyBox, styles.currencyBoxTarget]}>
              <View style={styles.boxHeaderRow}>
                <Text style={styles.boxLabel}>CONVERTED / YOU GET</Text>
                <Text style={styles.flagBadge}>
                  {toCurrencyMeta.flag} {toCurrencyMeta.name}
                </Text>
              </View>

              <View style={styles.amountInputRow}>
                <Text style={styles.convertedAmountText} numberOfLines={1}>
                  {formatNumber(convertedAmount)}
                </Text>
                <View style={[styles.currencyTagPill, styles.currencyTagPillTarget]}>
                  <Text style={styles.currencyTagSymbol}>{toCurrencyMeta.symbol}</Text>
                  <Text style={styles.currencyTagCode}>{toCode}</Text>
                </View>
              </View>

              {/* Horizontal Scroll of "To" Currency Selectors */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
              >
                {CURRENCY_CATALOG.map((c) => {
                  const isSelected = c.code === toCode;
                  return (
                    <TouchableOpacity
                      key={`to-${c.code}`}
                      style={[styles.chip, isSelected && styles.chipActiveTarget]}
                      onPress={() => setToCode(c.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipFlag}>{c.flag}</Text>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActiveTarget]}>
                        {c.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Live Exchange Rate Card */}
            <View style={styles.exchangeRateTicker}>
              <View style={styles.tickerIconCircle}>
                <Ionicons name="trending-up-outline" size={16} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tickerTitle}>
                  1 {fromCode} = {formatNumber(unitRate, 4)} {toCode}
                </Text>
                <Text style={styles.tickerSub}>
                  1 {toCode} = {formatNumber(inverseUnitRate, 6)} {fromCode}
                </Text>
              </View>
              <View style={styles.tickerBadge}>
                <Text style={styles.tickerBadgeText}>Mid-Market</Text>
              </View>
            </View>

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.logExpenseBtn}
                activeOpacity={0.85}
                onPress={handleLogConvertedExpense}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.logExpenseBtnText}>Log as Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                activeOpacity={0.8}
                onPress={onClose}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  grabBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  rateStatusText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  currencyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  currencyBoxTarget: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  boxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  boxLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  flagBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  convertedAmountText: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#0284C7',
  },
  currencyTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  currencyTagPillTarget: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  currencyTagSymbol: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
    marginRight: 4,
  },
  currencyTagCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  chipsScroll: {
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipActiveTarget: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipFlag: {
    fontSize: 13,
    marginRight: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextActiveTarget: {
    color: '#FFFFFF',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  presetTextActive: {
    color: '#2563EB',
  },
  swapDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  swapCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exchangeRateTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tickerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  tickerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  tickerSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  tickerBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tickerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  logExpenseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  logExpenseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneBtn: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});

