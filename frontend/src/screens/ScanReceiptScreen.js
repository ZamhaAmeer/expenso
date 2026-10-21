import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import FloatingBottomNav from '../components/FloatingBottomNav';

const { width } = Dimensions.get('window');

export default function ScanReceiptScreen({ navigation }) {
  const [isSaved, setIsSaved] = useState(false);
  const [extractedData, setExtractedData] = useState({
    storeName: 'Keells Supermarket',
    location: 'Galle Road, Colombo 03',
    totalAmount: '6,840.00',
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

  const handleSaveExpense = () => {
    setIsSaved(true);
    Alert.alert(
      'Expense Saved! 🎉',
      `Rs. ${extractedData.totalAmount} for ${extractedData.storeName} has been logged automatically to your expenses.`,
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F9FD" />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.circleHeaderBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back-outline" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scan Receipt</Text>

        <TouchableOpacity style={styles.circleHeaderBtn} activeOpacity={0.8}>
          <Ionicons name="ellipsis-horizontal-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Optical Camera Viewport Container */}
        <View style={styles.cameraViewportCard}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=80',
            }}
            style={styles.viewportBgImage}
            imageStyle={{ borderRadius: 28 }}
          >
            {/* Dark Scan Overlay Tint */}
            <View style={styles.darkScanOverlay} />

            {/* Top Floating Match Badge */}
            <View style={styles.viewportTopBadge}>
              <View style={styles.blueDot} />
              <Text style={styles.topBadgeText}>
                Receipt Found: <Text style={styles.topBadgeBold}>Keells (Colombo...</Text>
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
              <Text style={styles.bottomBarText}>Hold steady • Auto-scanning optical lines</Text>
            </View>
          </ImageBackground>
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
              <Text style={styles.metricLabel}>DATE & TIME</Text>
              <Text style={styles.metricValue}>{extractedData.dateTime}</Text>
            </View>

            {/* Estimated VAT / Tax */}
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>ESTIMATED VAT / TAX</Text>
              <Text style={styles.metricValue}>Rs. {extractedData.vatTax}</Text>
            </View>

            {/* Category Tag */}
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>CATEGORY TAG</Text>
              <View style={styles.categoryValueRow}>
                <View style={styles.catGreenDot} />
                <Text style={styles.metricValue}>{extractedData.category}</Text>
              </View>
            </View>
          </View>

          {/* Detected Items Inner Card */}
          <View style={styles.detectedItemsCard}>
            <View style={styles.detectedHeaderRow}>
              <Text style={styles.detectedTitle}>Detected Items (4)</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.editLinesText}>Edit Lines</Text>
              </TouchableOpacity>
            </View>

            {extractedData.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemNameText}>{item.name}</Text>
                <Text style={styles.itemPriceText}>{item.price}</Text>
              </View>
            ))}

            <Text style={styles.additionalItemsText}>+ 2 additional items...</Text>
          </View>
        </View>

        {/* Bottom 3 Control Buttons */}
        <View style={styles.controlsRow}>
          {/* From Photos */}
          <TouchableOpacity style={styles.controlBtnWrapper} activeOpacity={0.8}>
            <View style={styles.controlCircle}>
              <Ionicons name="images-outline" size={20} color="#475569" />
            </View>
            <Text style={styles.controlLabel}>From Photos</Text>
          </TouchableOpacity>

          {/* Main Shutter Camera Capture */}
          <TouchableOpacity style={styles.mainShutterWrapper} activeOpacity={0.85}>
            <View style={styles.mainShutterCircle}>
              <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Manual Entry */}
          <TouchableOpacity
            style={styles.controlBtnWrapper}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('AddExpense')}
          >
            <View style={styles.controlCircle}>
              <Ionicons name="create-outline" size={20} color="#475569" />
            </View>
            <Text style={styles.controlLabel}>Manual</Text>
          </TouchableOpacity>
        </View>

        {/* Accept & Save Expense Button */}
        <TouchableOpacity
          style={styles.submitBtnTouch}
          activeOpacity={0.9}
          onPress={handleSaveExpense}
        >
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.submitBtnGradient}
          >
            <Text style={styles.submitBtnText}>Accept & Save Expense</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <FloatingBottomNav currentScreen="" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9FD',
  },

  /* Header Bar */
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 6 : 8,
    paddingBottom: 14,
  },
  circleHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },

  /* Camera Viewport */
  cameraViewportCard: {
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  viewportBgImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    padding: 16,
  },
  darkScanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },

  /* Top Badge inside Viewport */
  viewportTopBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
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
    alignSelf: 'flex-start',
    marginLeft: 30,
    marginTop: 20,
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
    bottom: 50,
    right: 30,
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
    width: 30,
    height: 30,
    borderColor: '#38BDF8',
  },
  cornerTopLeft: {
    top: 24,
    left: 24,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 24,
    right: 24,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 40,
    left: 24,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 40,
    right: 24,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 12,
  },

  /* Viewport Bottom Status */
  viewportBottomBar: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
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
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  additionalItemsText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#94A3B8',
    marginTop: 2,
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
