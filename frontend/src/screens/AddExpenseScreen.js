import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import transactionService from '../services/transactionService';
import FloatingBottomNav from '../components/FloatingBottomNav';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Food & Dining', icon: 'restaurant-outline' },
  { id: '2', name: 'Shopping', icon: 'bag-handle-outline' },
  { id: '3', name: 'Bills & Utility', icon: 'receipt-outline' },
  { id: '4', name: 'Travel', icon: 'bus-outline' },
  { id: '5', name: 'Healthcare', icon: 'medical-outline' },
  { id: '6', name: 'Entertainment', icon: 'film-outline' },
];

export default function AddExpenseScreen({ navigation, route }) {
  const [transactionType, setTransactionType] = useState('Expense'); // 'Expense', 'Income', 'Transfer'
  const [amount, setAmount] = useState('0.00');
  const [selectedCategory, setSelectedCategory] = useState('Food & Dining');
  const [merchant, setMerchant] = useState('');
  const [dateStr, setDateStr] = useState('Today');
  const [timeStr, setTimeStr] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [paidFrom, setPaidFrom] = useState('Cash');
  const [accountSub, setAccountSub] = useState('Default Account');
  const [notes, setNotes] = useState('');
  const [hasReceipt, setHasReceipt] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quick Amount helper
  const handleAddAmount = (addVal) => {
    const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    const newTotal = numericAmount + addVal;
    setAmount(newTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleClearAmount = () => {
    setAmount('0.00');
  };

  const handleSave = async () => {
    const rawVal = parseFloat(amount.replace(/,/g, '')) || 0;
    if (rawVal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than zero.');
      return;
    }

    try {
      setLoading(true);
      await transactionService.createTransaction({
        title: merchant.trim() || `${selectedCategory} ${transactionType}`,
        amount: rawVal,
        type: transactionType.toLowerCase(),
        category: selectedCategory,
        paymentMethod: paidFrom,
        merchant: merchant.trim(),
        notes: notes.trim(),
        date: new Date().toISOString(),
        entryMethod: 'manual',
      });

      Alert.alert('Transaction Saved! 🎉', `Rs. ${amount} saved successfully under ${selectedCategory}.`, [
        {
          text: 'Transactions',
          onPress: () => navigation?.navigate('Transactions'),
        },
        {
          text: 'Dashboard',
          onPress: () => navigation?.navigate('Dashboard'),
        },
      ]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not save transaction. Please check your backend connection.';
      Alert.alert('Save Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <SafeAreaView style={styles.topSafeArea} />
      <SafeAreaView style={styles.container}>

      {/* Blue Gradient Header Bar */}
      <LinearGradient
        colors={['#2563EB', '#3B82F6', '#4F46E5']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Manual Expense Entry</Text>

          <TouchableOpacity style={styles.circleHeaderBtn} activeOpacity={0.8}>
            <Ionicons name="ellipsis-horizontal-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Type Selector & AI Sync Pill */}
        <View style={styles.topSelectorRow}>
          <View style={styles.aiSyncPill}>
            <View style={styles.blueDot} />
            <Text style={styles.aiSyncText}>Smart AI Sync</Text>
          </View>

          <View style={styles.typeSegmentContainer}>
            <TouchableOpacity
              style={[styles.typeSegmentBtn, transactionType === 'Expense' && styles.typeSegmentActive]}
              onPress={() => setTransactionType('Expense')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeSegmentText, transactionType === 'Expense' && styles.typeSegmentTextActive]}>
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeSegmentBtn, transactionType === 'Income' && styles.typeSegmentActive]}
              onPress={() => setTransactionType('Income')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeSegmentText, transactionType === 'Income' && styles.typeSegmentTextActive]}>
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeSegmentBtn, transactionType === 'Transfer' && styles.typeSegmentActive]}
              onPress={() => setTransactionType('Transfer')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeSegmentText, transactionType === 'Transfer' && styles.typeSegmentTextActive]}>
                Transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Amount Display Card */}
        <View style={styles.amountHeroCard}>
          <TouchableOpacity style={styles.currencyDropdown} activeOpacity={0.8}>
            <Text style={styles.currencyDropdownText}>LKR (RS.)</Text>
            <Ionicons name="chevron-down-outline" size={14} color="#0284C7" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <View style={styles.amountDisplayRow}>
            <Text style={styles.currencyPrefix}>Rs. </Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Quick Amount Add Pills */}
          <View style={styles.quickAddRow}>
            <TouchableOpacity
              style={styles.quickAddPill}
              onPress={() => handleAddAmount(500)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickAddText}>+500</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddPill}
              onPress={() => handleAddAmount(1000)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickAddText}>+1,000</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddPill}
              onPress={() => handleAddAmount(5000)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickAddText}>+5,000</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickClearPill}
              onPress={handleClearAmount}
              activeOpacity={0.8}
            >
              <Text style={styles.quickClearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Picker Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Category</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.editCategoriesLink}>Edit Categories</Text>
            </TouchableOpacity>
          </View>

          {/* 2x3 Grid of Category Tiles */}
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryTile, isActive && styles.categoryTileActive]}
                  onPress={() => setSelectedCategory(cat.name)}
                  activeOpacity={0.85}
                >
                  {isActive && (
                    <View style={styles.activeCheckBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}

                  <View style={[styles.categoryIconCircle, isActive && styles.categoryIconCircleActive]}>
                    <Ionicons name={cat.icon} size={20} color={isActive ? '#FFFFFF' : '#0284C7'} />
                  </View>

                  <Text style={[styles.categoryTileText, isActive && styles.categoryTileTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Details Input Form Card */}
        <View style={styles.sectionCard}>
          {/* Merchant / Store */}
          <View style={styles.inputFieldGroup}>
            <Text style={styles.inputFieldLabel}>MERCHANT / STORE</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="storefront-outline" size={18} color="#0284C7" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Keells, Cargills, Uber, Dialog"
                placeholderTextColor="#94A3B8"
              />
              {merchant ? (
                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 6 }} />
              ) : null}
            </View>
          </View>

          {/* Date & Time Side-by-Side */}
          <View style={styles.sideBySideRow}>
            <View style={[styles.inputFieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputFieldLabel}>DATE</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#0284C7" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInputSmall}
                  value={dateStr}
                  onChangeText={setDateStr}
                />
              </View>
            </View>

            <View style={[styles.inputFieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputFieldLabel}>TIME</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="time-outline" size={16} color="#0284C7" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInputSmall}
                  value={timeStr}
                  onChangeText={setTimeStr}
                />
              </View>
            </View>
          </View>

          {/* Paid From Account Dropdown */}
          <View style={styles.inputFieldGroup}>
            <Text style={styles.inputFieldLabel}>PAID FROM</Text>
            <TouchableOpacity style={styles.accountDropdownWrapper} activeOpacity={0.8}>
              <View style={styles.bankIconCircle}>
                <Ionicons name="business-outline" size={16} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountTitle}>{paidFrom}</Text>
                <Text style={styles.accountSubText}>{accountSub}</Text>
              </View>
              <Ionicons name="chevron-expand-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Notes & Tags */}
          <View style={styles.inputFieldGroup}>
            <Text style={styles.inputFieldLabel}>NOTES & TAGS</Text>
            <View style={styles.notesWrapper}>
              <Ionicons name="pricetag-outline" size={16} color="#94A3B8" style={{ marginRight: 10, marginTop: 2 }} />
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add optional tags (e.g. #groceries, #weekly)"
                placeholderTextColor="#94A3B8"
                multiline
              />
            </View>
          </View>
        </View>

        {/* Attached Receipt Card */}
        {hasReceipt && (
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeaderRow}>
              <View style={styles.receiptTitleRow}>
                <Ionicons name="scan-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.receiptTitle}>Attached Receipt</Text>
              </View>
              <View style={styles.matchedBadge}>
                <Text style={styles.matchedText}>MATCHED 99.4%</Text>
              </View>
            </View>

            {/* Inner Receipt Item Row */}
            <View style={styles.receiptInnerBox}>
              <View style={styles.receiptThumbCircle}>
                <Ionicons name="document-text-outline" size={24} color="#0284C7" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.receiptFileName}>receipt_cargills_24may.jpg</Text>
                <Text style={styles.receiptParsedText}>Parsed 6 grocery items automatically</Text>

                <View style={styles.receiptLinksRow}>
                  <TouchableOpacity activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
                    <Ionicons name="eye-outline" size={13} color="#2563EB" style={{ marginRight: 3 }} />
                    <Text style={styles.viewScanText}>View scan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7} onPress={() => setHasReceipt(false)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="trash-outline" size={13} color="#EF4444" style={{ marginRight: 3 }} />
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.8} style={styles.syncBtn}>
                <Ionicons name="sync-outline" size={16} color="#0284C7" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Save Expense Primary Button */}
        <TouchableOpacity
          style={styles.saveBtnTouch}
          activeOpacity={0.9}
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.saveBtnGradient}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>Save Expense (Rs. {amount})</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Cancel Action */}
        <TouchableOpacity
          style={styles.cancelTouch}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <FloatingBottomNav currentScreen="" navigation={navigation} />
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

  /* Header Section */
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 8 : 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  circleHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },

  /* Top Selector Row */
  topSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  blueDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563EB',
    marginRight: 6,
  },
  aiSyncText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  typeSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeSegmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  typeSegmentActive: {
    backgroundColor: '#2563EB',
  },
  typeSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typeSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Hero Amount Card */
  amountHeroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 26,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  currencyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 10,
  },
  currencyDropdownText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    color: '#64748B',
  },
  amountInput: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
    minWidth: 160,
    textAlign: 'center',
  },

  /* Quick Add Pills */
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  quickClearPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  quickClearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  editCategoriesLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Category Grid */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTile: {
    width: (width - 76) / 3,
    height: 84,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  categoryTileActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  activeCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIconCircleActive: {
    backgroundColor: '#2563EB',
  },
  categoryTileText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTileTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  /* Input Fields */
  inputFieldGroup: {
    marginBottom: 16,
  },
  inputFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  textInputSmall: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  sideBySideRow: {
    flexDirection: 'row',
  },

  /* Account Dropdown */
  accountDropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bankIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  accountTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  accountSubText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* Notes */
  notesWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 56,
  },
  notesInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },

  /* Receipt Card */
  receiptCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  receiptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  matchedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  matchedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },

  /* Inner Receipt Box */
  receiptInnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  receiptThumbCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receiptFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  receiptParsedText: {
    fontSize: 11,
    color: '#64748B',
    marginVertical: 2,
  },
  receiptLinksRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  viewScanText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  removeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  syncBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Save Button */
  saveBtnTouch: {
    borderRadius: 28,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  saveBtnGradient: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Cancel Link */
  cancelTouch: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
