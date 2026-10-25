import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FloatingBottomNav from '../components/FloatingBottomNav';
import aiService from '../services/aiService';
import transactionService from '../services/transactionService';

const { width } = Dimensions.get('window');

export default function ScanReceiptScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extracted Receipt State
  const [extractedData, setExtractedData] = useState({
    storeName: 'Keells Supermarket',
    location: 'Galle Road, Colombo 03',
    totalAmount: '6,840.00',
    rawAmount: 6840.0,
    dateTime: 'Today, 03:42 PM',
    vatTax: '540.00',
    category: 'Groceries',
    confidence: '99.4%',
    storeBadge: 'Keells Store #104',
    items: [
      { name: 'Anchor Fresh Milk 1L', price: 'Rs. 520.00' },
      { name: 'Organic Bananas (Cavendish) 1.2kg', price: 'Rs. 480.00' },
    ],
  });

  // Pick receipt from device photo gallery
  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access in settings to upload receipt images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        if (asset.base64) {
          processReceiptImage(asset.base64);
        }
      }
    } catch (error) {
      console.error('[Gallery Error]:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  // Capture live receipt photo using device camera
  const captureWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera access in settings to snap receipt photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        if (asset.base64) {
          processReceiptImage(asset.base64);
        }
      }
    } catch (error) {
      console.error('[Camera Error]:', error);
      Alert.alert('Error', 'Failed to launch camera');
    }
  };

  // Send image to backend OCR endpoint
  const processReceiptImage = async (base64String) => {
    try {
      setIsScanning(true);
      const res = await aiService.scanReceipt(base64String);

      if (res && res.extracted) {
        const data = res.extracted;
        const total = parseFloat(data.totalAmount) || 0;
        const vat = parseFloat(data.vatTax) || 0;

        const formattedItems = (data.items || []).map((item) => ({
          name: item.name || 'Item',
          price: `Rs. ${(parseFloat(item.price) || 0).toFixed(2)}`,
        }));

        setExtractedData({
          storeName: data.storeName || 'Merchant Store',
          location: data.location || 'Retail Location',
          totalAmount: total.toFixed(2),
          rawAmount: total,
          dateTime: data.dateTime || new Date().toISOString().split('T')[0],
          vatTax: vat.toFixed(2),
          category: data.category || 'Groceries',
          confidence: data.confidence || '98.5%',
          storeBadge: data.storeBadge || 'Verified Merchant',
          items: formattedItems.length > 0 ? formattedItems : [
            { name: 'Scanned Items Total', price: `Rs. ${total.toFixed(2)}` }
          ],
        });

        Alert.alert('Receipt Analyzed ✨', `Extracted Rs. ${total.toFixed(2)} from ${data.storeName || 'receipt'}.`);
      }
    } catch (error) {
      console.error('[OCR Error]:', error);
      Alert.alert('Scan Issue', 'Could not extract receipt data. You can log manually or try another picture.');
    } finally {
      setIsScanning(false);
    }
  };

  // Save the extracted expense to the live user transactions
  const handleSaveExpense = async () => {
    try {
      setIsSaving(true);
      const newTransaction = {
        title: extractedData.storeName || 'Scanned Receipt',
        amount: parseFloat(extractedData.rawAmount) || parseFloat(extractedData.totalAmount) || 0,
        type: 'expense',
        category: extractedData.category || 'Groceries',
        merchant: extractedData.storeName || 'Merchant',
        paymentMethod: 'Credit Card',
        notes: `Auto-scanned receipt (${extractedData.confidence} confidence). Location: ${extractedData.location}`,
        date: new Date().toISOString(),
        entryMethod: 'ocr',
      };

      await transactionService.createTransaction(newTransaction);

      Alert.alert(
        'Expense Saved! 🎉',
        `Rs. ${extractedData.totalAmount} for ${extractedData.storeName} has been logged to your transactions.`,
        [
          {
            text: 'View Transactions',
            onPress: () => navigation?.navigate('Transactions'),
          },
          {
            text: 'Done',
            onPress: () => navigation?.navigate('Dashboard'),
          },
        ]
      );
    } catch (error) {
      console.error('[Save Expense Error]:', error);
      Alert.alert('Save Failed', error.response?.data?.message || 'Could not record transaction to backend.');
    } finally {
      setIsSaving(false);
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

            <Text style={styles.headerTitle}>Scan Receipt (AI OCR)</Text>

            <TouchableOpacity
              style={styles.circleHeaderBtn}
              activeOpacity={0.8}
              onPress={captureWithCamera}
            >
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Optical Camera Viewport Container */}
          <View style={styles.cameraViewportCard}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.viewportBgImage}
              />
            ) : (
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=80',
                }}
                style={styles.viewportBgImage}
              />
            )}

            {/* Dark Scan Overlay Tint */}
            <View style={styles.darkScanOverlay} />

            {/* Scanning In-Progress Indicator Overlay */}
            {isScanning && (
              <View style={styles.scanningLoadingOverlay}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.scanningLoadingText}>AI Neural Engine Extracting Receipt...</Text>
              </View>
            )}

            {/* Top Floating Match Badge */}
            <View style={styles.viewportTopBadge}>
              <View style={styles.blueDot} />
              <Text style={styles.topBadgeText} numberOfLines={1}>
                Receipt: <Text style={styles.topBadgeBold}>{extractedData.storeName}</Text>
              </Text>
              <View style={styles.confidencePill}>
                <Text style={styles.confidenceText}>{extractedData.confidence}</Text>
              </View>
            </View>

            {/* Middle Store Annotation Tag */}
            <View style={styles.middleAnnotationTag}>
              <View style={styles.greenDot} />
              <Text style={styles.annotationText}>{extractedData.storeBadge}</Text>
            </View>

            {/* Price Badge Tag */}
            <View style={styles.priceTagPill}>
              <Ionicons name="scan-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.priceTagText}>Rs. {extractedData.totalAmount}</Text>
            </View>

            {/* 4 Neon Cyan Camera Reticle Scanning Corners */}
            <View style={[styles.cornerReticle, styles.cornerTopLeft]} />
            <View style={[styles.cornerReticle, styles.cornerTopRight]} />
            <View style={[styles.cornerReticle, styles.cornerBottomLeft]} />
            <View style={[styles.cornerReticle, styles.cornerBottomRight]} />

            {/* Bottom Optical Scanning Status Bar */}
            <View style={styles.viewportBottomBar}>
              <Ionicons name="scan-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.bottomBarText}>
                {isScanning ? 'Extracting text with AI Vision...' : 'Tap shutter below or choose from Photos'}
              </Text>
            </View>
          </View>

          {/* Extracted Insights Details Container */}
          <View style={styles.insightsCard}>
            {/* Store Info Header */}
            <View style={styles.storeHeaderRow}>
              <View style={styles.storeIconCircle}>
                <Ionicons name="storefront-outline" size={20} color="#0284C7" />
              </View>

              <View style={styles.storeTextGroup}>
                <Text style={styles.storeNameText}>{extractedData.storeName}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color="#0284C7" style={{ marginRight: 3 }} />
                  <Text style={styles.locationText}>{extractedData.location}</Text>
                </View>
              </View>
            </View>

            {/* 2x2 Grid Metrics */}
            <View style={styles.metricsGrid}>
              {/* Total Extracted */}
              <View style={[styles.metricBox, styles.metricBoxBlue]}>
                <Text style={styles.metricLabelBlue}>TOTAL EXTRACTED</Text>
                <Text style={styles.metricValueBlue}>Rs. {extractedData.totalAmount}</Text>
              </View>

              {/* Date & Time */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DATE</Text>
                <Text style={styles.metricValue}>{extractedData.dateTime}</Text>
              </View>

              {/* Estimated VAT / Tax */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>ESTIMATED TAX / VAT</Text>
                <Text style={styles.metricValue}>Rs. {extractedData.vatTax}</Text>
              </View>

              {/* Category Tag */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>CATEGORY</Text>
                <View style={styles.categoryValueRow}>
                  <View style={styles.catGreenDot} />
                  <Text style={styles.metricValue}>{extractedData.category}</Text>
                </View>
              </View>
            </View>

            {/* Detected Items Inner Card */}
            <View style={styles.detectedItemsCard}>
              <View style={styles.detectedHeaderRow}>
                <Text style={styles.detectedTitle}>Detected Items ({extractedData.items.length})</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation?.navigate('AddExpense')}
                >
                  <Text style={styles.editLinesText}>Edit in Manual</Text>
                </TouchableOpacity>
              </View>

              {extractedData.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemNameText} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPriceText}>{item.price}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom 3 Control Buttons */}
          <View style={styles.controlsRow}>
            {/* From Photos */}
            <TouchableOpacity
              style={styles.controlBtnWrapper}
              activeOpacity={0.8}
              onPress={pickFromGallery}
              disabled={isScanning || isSaving}
            >
              <View style={styles.controlCircle}>
                <Ionicons name="images-outline" size={22} color="#475569" />
              </View>
              <Text style={styles.controlLabel}>From Photos</Text>
            </TouchableOpacity>

            {/* Main Shutter Camera Capture */}
            <TouchableOpacity
              style={styles.mainShutterWrapper}
              activeOpacity={0.85}
              onPress={captureWithCamera}
              disabled={isScanning || isSaving}
            >
              <View style={styles.mainShutterCircle}>
                <Ionicons name="camera-outline" size={28} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Manual Entry */}
            <TouchableOpacity
              style={styles.controlBtnWrapper}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('AddExpense')}
              disabled={isScanning || isSaving}
            >
              <View style={styles.controlCircle}>
                <Ionicons name="create-outline" size={22} color="#475569" />
              </View>
              <Text style={styles.controlLabel}>Manual</Text>
            </TouchableOpacity>
          </View>

          {/* Accept & Save Expense Button */}
          <TouchableOpacity
            style={styles.submitBtnTouch}
            activeOpacity={0.9}
            onPress={handleSaveExpense}
            disabled={isScanning || isSaving}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.submitBtnGradient}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Accept & Save to Ledger</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </LinearGradient>
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
    paddingBottom: 110,
    paddingTop: 14,
  },

  /* Camera Viewport */
  cameraViewportCard: {
    height: 290,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  viewportBgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  darkScanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.40)',
  },
  scanningLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scanningLoadingText: {
    color: '#38BDF8',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Top Badge inside Viewport */
  viewportTopBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    maxWidth: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  blueDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0284C7',
    marginRight: 6,
  },
  topBadgeText: {
    fontSize: 12,
    color: '#334155',
    marginRight: 8,
  },
  topBadgeBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  confidencePill: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },

  /* Middle Annotation Tag */
  middleAnnotationTag: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  annotationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Price Tag Pill */
  priceTagPill: {
    position: 'absolute',
    bottom: 52,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  priceTagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Reticle Corners */
  cornerReticle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38BDF8',
  },
  cornerTopLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    top: 20,
    right: 20,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    bottom: 42,
    left: 20,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: 42,
    right: 20,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 10,
  },

  /* Viewport Bottom Status */
  viewportBottomBar: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.70)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  bottomBarText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '500',
  },

  /* Extracted Insights Card */
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  /* Store Header */
  storeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeTextGroup: {
    flex: 1,
  },
  storeNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Metrics 2x2 Grid */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metricBox: {
    width: (width - 72) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricBoxBlue: {
    backgroundColor: '#EFF6FF',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  metricLabelBlue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricValueBlue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  categoryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },

  /* Detected Items Card */
  detectedItemsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
  },
  detectedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detectedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  editLinesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Controls Row */
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  controlBtnWrapper: {
    alignItems: 'center',
  },
  controlCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  mainShutterWrapper: {
    alignItems: 'center',
  },
  mainShutterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  /* Primary Action Button */
  submitBtnTouch: {
    borderRadius: 28,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnGradient: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
