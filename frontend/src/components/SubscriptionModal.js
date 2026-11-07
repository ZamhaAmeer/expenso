import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PRESET_SUBSCRIPTIONS } from '../services/subscriptionService';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'Utilities', icon: 'flash-outline', bg: '#FEF3C7', color: '#D97706' },
  { name: 'Entertainment', icon: 'film-outline', bg: '#FEE2E2', color: '#EF4444' },
  { name: 'Health', icon: 'barbell-outline', bg: '#FFE4E6', color: '#F43F5E' },
  { name: 'Housing', icon: 'home-outline', bg: '#FEF9C3', color: '#CA8A04' },
  { name: 'Software & Tech', icon: 'cloud-outline', bg: '#E0F2FE', color: '#0284C7' },
  { name: 'Food & Dining', icon: 'restaurant-outline', bg: '#FFEDD5', color: '#EA580C' },
  { name: 'General', icon: 'receipt-outline', bg: '#F1F5F9', color: '#475569' },
];

export default function SubscriptionModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData = null,
}) {
  const isEditing = Boolean(initialData && initialData.id);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [frequency, setFrequency] = useState('monthly');
  const [dueDay, setDueDay] = useState('10');
  const [isAutoDebit, setIsAutoDebit] = useState(false);
  const [notes, setNotes] = useState('');
  const [icon, setIcon] = useState('receipt-outline');
  const [iconBg, setIconBg] = useState('#E0F2FE');
  const [iconColor, setIconColor] = useState('#0284C7');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategory(initialData.category || 'Utilities');
      setFrequency(initialData.frequency || 'monthly');
      setDueDay(initialData.dueDay ? String(initialData.dueDay) : '10');
      setIsAutoDebit(Boolean(initialData.isAutoDebit));
      setNotes(initialData.notes || '');
      setIcon(initialData.icon || 'receipt-outline');
      setIconBg(initialData.iconBg || '#E0F2FE');
      setIconColor(initialData.iconColor || '#0284C7');
    } else {
      // Reset form
      setTitle('');
      setAmount('');
      setCategory('Utilities');
      setFrequency('monthly');
      setDueDay('10');
      setIsAutoDebit(false);
      setNotes('');
      setIcon('receipt-outline');
      setIconBg('#E0F2FE');
      setIconColor('#0284C7');
    }
  }, [initialData, visible]);

  const handleApplyPreset = (preset) => {
    setTitle(preset.name);
    setCategory(preset.category);
    setAmount(String(preset.defaultAmount));
    setIcon(preset.icon);
    setIconBg(preset.iconBg);
    setIconColor(preset.iconColor);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a name or provider for this subscription.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid billing amount.');
      return;
    }

    const parsedDueDay = parseInt(dueDay, 10);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      Alert.alert('Invalid Day', 'Due day must be between 1 and 31.');
      return;
    }

    const matchedCat = CATEGORIES.find((c) => c.name === category);

    const payload = {
      title: title.trim(),
      amount: numAmount,
      category,
      frequency,
      dueDay: parsedDueDay,
      isAutoDebit,
      notes: notes.trim(),
      icon: icon || matchedCat?.icon || 'receipt-outline',
      iconBg: iconBg || matchedCat?.bg || '#E0F2FE',
      iconColor: iconColor || matchedCat?.color || '#0284C7',
    };

    onSave(payload, initialData?.id);
  };

  const handleDelete = () => {
    if (!isEditing || !onDelete) return;

    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to stop tracking "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(initialData.id),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.headerIconCircle, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Subscription' : 'Add Recurring Bill'}
                </Text>
                <Text style={styles.modalSub}>
                  {isEditing
                    ? 'Update billing schedule & amount'
                    : 'Track repeating charges and get countdown alerts'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Quick Presets (Only when adding new) */}
            {!isEditing && (
              <View style={styles.presetSection}>
                <Text style={styles.sectionLabel}>Popular Presets (Tap to Auto-fill)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetRow}
                >
                  {PRESET_SUBSCRIPTIONS.map((p) => {
                    const isSelected = title.toLowerCase() === p.name.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={p.name}
                        style={[
                          styles.presetChip,
                          isSelected && styles.presetChipActive,
                        ]}
                        onPress={() => handleApplyPreset(p)}
                      >
                        <View style={[styles.presetIconDot, { backgroundColor: p.iconBg }]}>
                          <Ionicons name={p.icon} size={14} color={p.iconColor} />
                        </View>
                        <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Bill Title / Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bill / Subscription Name</Text>
              <View style={styles.textInputBox}>
                <Ionicons name="bookmark-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dialog Broadband, Netflix, Gym"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Amount & Frequency Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Billing Amount</Text>
                <View style={styles.textInputBox}>
                  <Text style={styles.currencyPrefix}>Rs.</Text>
                  <TextInput
                    style={[styles.textInput, { fontWeight: '700' }]}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Billing Day (1-31)</Text>
                <View style={styles.textInputBox}>
                  <Ionicons name="calendar-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInput, { textAlign: 'center', fontWeight: '700' }]}
                    placeholder="10"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={dueDay}
                    onChangeText={setDueDay}
                  />
                  <Text style={styles.daySuffix}>th</Text>
                </View>
              </View>
            </View>

            {/* Frequency Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Billing Frequency</Text>
              <View style={styles.frequencyRow}>
                {[
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'yearly', label: 'Yearly' },
                  { id: 'weekly', label: 'Weekly' },
                ].map((freq) => {
                  const isSel = frequency === freq.id;
                  return (
                    <TouchableOpacity
                      key={freq.id}
                      style={[styles.frequencyBtn, isSel && styles.frequencyBtnActive]}
                      onPress={() => setFrequency(freq.id)}
                    >
                      <Text style={[styles.frequencyText, isSel && styles.frequencyTextActive]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSel = category === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.catCard,
                        isSel && styles.catCardActive,
                      ]}
                      onPress={() => {
                        setCategory(cat.name);
                        setIcon(cat.icon);
                        setIconBg(cat.bg);
                        setIconColor(cat.color);
                      }}
                    >
                      <View style={[styles.catIconDot, { backgroundColor: cat.bg }]}>
                        <Ionicons name={cat.icon} size={16} color={cat.color} />
                      </View>
                      <Text
                        style={[styles.catName, isSel && styles.catNameActive]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Auto-Debit Toggle */}
            <View style={styles.toggleRowCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="card-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.toggleTitle}>Auto-Debit Enabled</Text>
                </View>
                <Text style={styles.toggleDesc}>
                  Charges are deducted automatically from your linked card/bank
                </Text>
              </View>
              <Switch
                value={isAutoDebit}
                onValueChange={setIsAutoDebit}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={isAutoDebit ? '#2563EB' : '#FFFFFF'}
              />
            </View>

            {/* Notes / Account # */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Reference (Optional)</Text>
              <View style={styles.textInputBox}>
                <Ionicons name="document-text-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Account #87192, Shared with roommate"
                  placeholderTextColor="#94A3B8"
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.btnSection}>
              <TouchableOpacity
                style={styles.saveBtnWrapper}
                activeOpacity={0.88}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Save Changes' : 'Start Tracking Bill'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  activeOpacity={0.8}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Stop Tracking This Bill</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.88,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  presetSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  presetIconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  presetTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
    marginRight: 6,
  },
  daySuffix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  frequencyBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  frequencyBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  frequencyTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: (width - 56) / 2,
  },
  catCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  catIconDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  catName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  catNameActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  toggleRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  btnSection: {
    marginTop: 8,
  },
  saveBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
