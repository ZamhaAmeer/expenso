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
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'Groceries', icon: 'cart-outline', color: '#0284C7', bg: '#E0F2FE' },
  { name: 'Food & Dining', icon: 'restaurant-outline', color: '#F59E0B', bg: '#FEF3C7' },
  { name: 'Health', icon: 'medkit-outline', color: '#10B981', bg: '#DCFCE7' },
  { name: 'Transportation', icon: 'car-outline', color: '#6366F1', bg: '#EEF2FF' },
  { name: 'Shopping', icon: 'bag-handle-outline', color: '#EC4899', bg: '#FCE7F3' },
  { name: 'Utilities', icon: 'flash-outline', color: '#8B5CF6', bg: '#F3E8FF' },
  { name: 'General', icon: 'receipt-outline', color: '#64748B', bg: '#F1F5F9' },
];

const PAYMENT_METHODS = [
  'Credit Card',
  'Commercial Bank',
  'Cash',
  'Sampath Bank',
  'Debit Card',
];

export default function EditReceiptModal({
  visible,
  onClose,
  initialData,
  onSave,
}) {
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [vatTax, setVatTax] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);

  useEffect(() => {
    if (initialData) {
      setStoreName(initialData.storeName || '');
      setLocation(initialData.location || '');
      setTotalAmount(String(initialData.rawAmount || initialData.totalAmount || '0'));
      setVatTax(String(initialData.vatTax || '0'));
      setCategory(initialData.category || 'Groceries');
      setPaymentMethod(initialData.paymentMethod || 'Credit Card');

      const rawItems = (initialData.items || []).map((item, idx) => ({
        id: `item-${idx}-${Date.now()}`,
        name: item.name || 'Item',
        price: typeof item.price === 'number'
          ? item.price
          : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0,
      }));
      setItems(rawItems);
    }
  }, [initialData, visible]);

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }
    const priceNum = parseFloat(newItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price for this item');
      return;
    }

    const updated = [
      ...items,
      {
        id: `item-${Date.now()}`,
        name: newItemName.trim(),
        price: priceNum,
      },
    ];
    setItems(updated);

    // Auto-recalculate total
    const sum = updated.reduce((acc, curr) => acc + curr.price, 0);
    setTotalAmount(sum.toFixed(2));

    setNewItemName('');
    setNewItemPrice('');
    setShowAddItem(false);
  };

  const handleDeleteItem = (itemId) => {
    const updated = items.filter((i) => i.id !== itemId);
    setItems(updated);
    const sum = updated.reduce((acc, curr) => acc + curr.price, 0);
    setTotalAmount(sum.toFixed(2));
  };

  const handleSave = () => {
    if (!storeName.trim()) {
      Alert.alert('Required Field', 'Please provide a store/merchant name');
      return;
    }

    const totalNum = parseFloat(totalAmount);
    if (isNaN(totalNum) || totalNum <= 0) {
      Alert.alert('Invalid Amount', 'Please provide a valid total amount');
      return;
    }

    const formattedItems = items.map((i) => ({
      name: i.name,
      price: `Rs. ${Number(i.price).toFixed(2)}`,
    }));

    onSave({
      storeName: storeName.trim(),
      location: location.trim() || 'Retail Branch',
      totalAmount: totalNum.toFixed(2),
      rawAmount: totalNum,
      vatTax: parseFloat(vatTax) || 0,
      category,
      paymentMethod,
      items: formattedItems.length > 0 ? formattedItems : [{ name: 'Scanned Items', price: `Rs. ${totalNum.toFixed(2)}` }],
    });
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
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="create-outline" size={20} color="#2563EB" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.modalTitle}>Edit Scanned Receipt</Text>
                <Text style={styles.modalSub}>Review & adjust extracted values</Text>
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
            {/* Store Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store / Merchant Name</Text>
              <View style={styles.textInputBox}>
                <Ionicons name="storefront-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Keells Super, Java Lounge"
                  placeholderTextColor="#94A3B8"
                  value={storeName}
                  onChangeText={setStoreName}
                />
              </View>
            </View>

            {/* Location Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Branch / Location</Text>
              <View style={styles.textInputBox}>
                <Ionicons name="location-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Galle Road, Colombo 03"
                  placeholderTextColor="#94A3B8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Total Amount & VAT Row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Total Amount (Rs.)</Text>
                <View style={styles.textInputBox}>
                  <Text style={styles.currencyPrefix}>Rs.</Text>
                  <TextInput
                    style={[styles.textInput, { fontWeight: '700' }]}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Estimated Tax / VAT</Text>
                <View style={styles.textInputBox}>
                  <Text style={styles.currencyPrefix}>Rs.</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={vatTax}
                    onChangeText={setVatTax}
                  />
                </View>
              </View>
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {CATEGORIES.map((cat) => {
                  const isSel = category === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[styles.catChip, isSel && styles.catChipActive]}
                      onPress={() => setCategory(cat.name)}
                    >
                      <View style={[styles.catDot, { backgroundColor: cat.bg }]}>
                        <Ionicons name={cat.icon} size={13} color={cat.color} />
                      </View>
                      <Text style={[styles.catText, isSel && styles.catTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Payment Method Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentRow}>
                {PAYMENT_METHODS.map((method) => {
                  const isSel = paymentMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[styles.paymentChip, isSel && styles.paymentChipActive]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Ionicons
                        name={method === 'Cash' ? 'cash-outline' : 'card-outline'}
                        size={14}
                        color={isSel ? '#2563EB' : '#64748B'}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[styles.paymentText, isSel && styles.paymentTextActive]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Itemized Line Items List */}
            <View style={styles.inputGroup}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.inputLabel}>Scanned Line Items ({items.length})</Text>
                <TouchableOpacity
                  style={styles.addItemBtn}
                  onPress={() => setShowAddItem(!showAddItem)}
                >
                  <Ionicons name={showAddItem ? 'remove-circle' : 'add-circle'} size={16} color="#2563EB" />
                  <Text style={styles.addItemBtnText}>{showAddItem ? 'Cancel' : 'Add Item'}</Text>
                </TouchableOpacity>
              </View>

              {/* Add item inline box */}
              {showAddItem && (
                <View style={styles.addItemBox}>
                  <TextInput
                    style={styles.addItemNameInput}
                    placeholder="Item name (e.g. Milk 1L)"
                    placeholderTextColor="#94A3B8"
                    value={newItemName}
                    onChangeText={setNewItemName}
                  />
                  <View style={styles.addItemPriceRow}>
                    <Text style={styles.currencyPrefix}>Rs.</Text>
                    <TextInput
                      style={styles.addItemPriceInput}
                      placeholder="Price"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={newItemPrice}
                      onChangeText={setNewItemPrice}
                    />
                    <TouchableOpacity style={styles.addItemConfirmBtn} onPress={handleAddItem}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.addItemConfirmText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Items List */}
              <View style={styles.itemListContainer}>
                {items.length === 0 ? (
                  <Text style={styles.noItemsText}>No individual items specified.</Text>
                ) : (
                  items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      </View>
                      <Text style={styles.itemPrice}>Rs. {Number(item.price).toFixed(2)}</Text>
                      <TouchableOpacity
                        style={styles.itemDeleteBtn}
                        onPress={() => handleDeleteItem(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Save Button */}
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
                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Apply & Confirm Values</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    maxHeight: height * 0.9,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
    marginRight: 6,
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  catChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  catDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  paymentRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    gap: 8,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paymentChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  paymentTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 4,
  },
  addItemBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addItemNameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  addItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addItemPriceInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  addItemConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 40,
  },
  addItemConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  itemListContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 10,
  },
  itemDeleteBtn: {
    padding: 4,
  },
  noItemsText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
  saveBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
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
});
