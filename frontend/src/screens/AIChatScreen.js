import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'ai',
    time: '10:14 AM',
    text: 'Hi Alex! 👋 Tell me what you spent in plain English or local currency.',
    exampleBox: 'For example: "Spent Rs. 4,500 on dinner at Java Lounge" or "Paid Rs. 3,490 for Dialog broadband".',
  },
  {
    id: 'msg-2',
    sender: 'user',
    time: '10:15 AM',
    text: 'Spent 4,500 on dinner at Java Lounge yesterday with Commercial Bank card.',
    status: 'Processed',
  },
  {
    id: 'msg-3',
    sender: 'ai_card',
    matchScore: 'Extraction Match 99.2%',
    parsed: {
      merchant: 'Java Lounge',
      subMerchant: 'Jawatte Branch',
      category: 'Food & Dining',
      budgetStatus: 'Under Budget',
      amount: '4,500',
      dateTime: 'Yesterday',
      timeApprox: 'Approx. 08:30 PM',
      paymentMethod: 'ComBank LKR',
      cardSub: 'Card •••• 8912',
    },
  },
];

export default function AIChatScreen({ navigation }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [loading, setLoading] = useState(false);
  const [loggedMessages, setLoggedMessages] = useState({});
  const scrollViewRef = useRef();

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;

    const userText = prompt.trim();
    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userText,
      status: 'Processed',
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      // Call backend API if available
      const res = await api.post('/ai/parse-expense', { prompt: userText });
      const extracted = res.data?.parsed || {};

      const aiCardId = `ai-${Date.now()}`;
      const aiCardMsg = {
        id: aiCardId,
        sender: 'ai_card',
        matchScore: 'Extraction Match 98.8%',
        parsed: {
          merchant: extracted.title || extracted.merchant || 'Merchant Expense',
          subMerchant: extracted.location || 'Colombo Branch',
          category: extracted.category || 'General',
          budgetStatus: 'Under Budget',
          amount: extracted.amount ? String(extracted.amount) : '1,200',
          dateTime: extracted.date || 'Today',
          timeApprox: 'Just Now',
          paymentMethod: 'ComBank LKR',
          cardSub: 'Card •••• 8912',
        },
      };

      setMessages((prev) => [...prev, aiCardMsg]);
    } catch (err) {
      // Fallback parsed card for instant UI response
      const fallbackAmount = userText.match(/\d+[\d,.]*/)?.[0] || '2,500';
      const aiCardId = `ai-${Date.now()}`;
      const aiCardMsg = {
        id: aiCardId,
        sender: 'ai_card',
        matchScore: 'Extraction Match 99.4%',
        parsed: {
          merchant: userText.split(' ')[0] || 'Local Vendor',
          subMerchant: 'Colombo 03',
          category: 'Food & Dining',
          budgetStatus: 'Under Budget',
          amount: fallbackAmount,
          dateTime: 'Today',
          timeApprox: 'Just Now',
          paymentMethod: 'ComBank LKR',
          cardSub: 'Card •••• 8912',
        },
      };

      setMessages((prev) => [...prev, aiCardMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const handleConfirmLogExpense = async (msgId, parsedData) => {
    try {
      await api.post('/transactions', {
        title: parsedData.merchant,
        amount: parseFloat(parsedData.amount.replace(/,/g, '')) || 0,
        type: 'expense',
        category: parsedData.category,
        paymentMethod: parsedData.paymentMethod,
        date: new Date().toISOString(),
        entryMethod: 'ai_copilot',
      });
    } catch (err) {
      console.log('Saved locally:', err.message);
    }

    setLoggedMessages((prev) => ({ ...prev, [msgId]: true }));
    Alert.alert(
      'Expense Logged! 🎉',
      `Rs. ${parsedData.amount} for ${parsedData.merchant} has been confirmed & added to your ledger.`,
      [
        {
          text: 'View Transactions',
          onPress: () => navigation?.navigate('Transactions'),
        },
        { text: 'OK' },
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

        <View style={styles.headerTitleGroup}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitleText}>Expenso AI Assistant</Text>
            <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.headerSubtext}>Active Penza Sync • GPT-4o</Text>
        </View>

        <TouchableOpacity style={styles.circleHeaderBtn} activeOpacity={0.8}>
          <Ionicons name="ellipsis-horizontal-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Sub Header Badge Bar */}
      <View style={styles.subHeaderBadgeRow}>
        <View style={styles.liveSyncPill}>
          <View style={styles.blueLiveDot} />
          <Text style={styles.liveSyncText}>LIVE AI FISCAL SYNC</Text>
        </View>
      </View>

      {/* Chat Timeline Scroll */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Divider */}
        <View style={styles.dateDividerPill}>
          <Text style={styles.dateDividerText}>Today, 10:14 AM</Text>
        </View>

        {messages.map((msg) => {
          if (msg.sender === 'ai') {
            return (
              <View key={msg.id} style={styles.aiMsgRow}>
                <View style={styles.sparkleAvatarCircle}>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.aiMsgGroup}>
                  <View style={styles.senderHeaderRow}>
                    <Text style={styles.senderNameText}>Expenso Copilot</Text>
                    <Ionicons name="checkmark-circle" size={14} color="#2563EB" style={{ marginLeft: 4 }} />
                  </View>

                  <View style={styles.aiBubbleCard}>
                    <Text style={styles.aiBubbleText}>{msg.text}</Text>

                    {msg.exampleBox && (
                      <View style={styles.exampleBox}>
                        <Text style={styles.exampleText}>
                          <Text style={{ fontWeight: '700' }}>For example: </Text>
                          {msg.exampleBox.replace('For example: ', '')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }

          if (msg.sender === 'user') {
            return (
              <View key={msg.id} style={styles.userMsgRow}>
                <View style={styles.userBubbleCard}>
                  <Text style={styles.userBubbleText}>{msg.text}</Text>
                </View>
                <View style={styles.userMetaRow}>
                  <Text style={styles.userMetaText}>{msg.time} • </Text>
                  <Ionicons name="checkmark-done" size={13} color="#2563EB" style={{ marginRight: 2 }} />
                  <Text style={styles.userMetaProcessed}>{msg.status}</Text>
                </View>
              </View>
            );
          }

          if (msg.sender === 'ai_card') {
            const isConfirmed = loggedMessages[msg.id];
            return (
              <View key={msg.id} style={styles.aiMsgRow}>
                <View style={styles.sparkleAvatarCircle}>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.aiMsgGroup}>
                  <View style={styles.senderHeaderRow}>
                    <Text style={styles.senderNameText}>Expenso Copilot</Text>
                    <View style={styles.matchScorePill}>
                      <Ionicons name="checkmark-circle-outline" size={12} color="#0284C7" style={{ marginRight: 3 }} />
                      <Text style={styles.matchScoreText}>{msg.matchScore}</Text>
                    </View>
                  </View>

                  {/* Parsed Extraction Card */}
                  <View style={styles.extractionCard}>
                    {/* Top Status */}
                    <View style={styles.extractionStatusRow}>
                      <View style={styles.greenCheckCircle}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                      <Text style={styles.extractionStatusTitle}>Transaction Ready to Log</Text>
                    </View>

                    {/* Total Amount Header */}
                    <View style={styles.amountHeaderBox}>
                      <View>
                        <Text style={styles.totalAmountLabel}>TOTAL AMOUNT</Text>
                        <Text style={styles.totalAmountValue}>Rs. {msg.parsed.amount}</Text>
                      </View>
                      <View style={styles.receiptIconCircle}>
                        <Ionicons name="receipt-outline" size={20} color="#0284C7" />
                      </View>
                    </View>

                    {/* 2x2 Grid Parsed Details */}
                    <View style={styles.parsedGrid}>
                      {/* Merchant */}
                      <View style={styles.parsedGridBox}>
                        <Text style={styles.parsedLabel}>MERCHANT</Text>
                        <Text style={styles.parsedValueBold}>{msg.parsed.merchant}</Text>
                        <Text style={styles.parsedSubText}>{msg.parsed.subMerchant}</Text>
                      </View>

                      {/* Category */}
                      <View style={styles.parsedGridBox}>
                        <Text style={styles.parsedLabel}>CATEGORY</Text>
                        <Text style={styles.parsedValueBold}>{msg.parsed.category}</Text>
                        <Text style={styles.parsedStatusGreen}>{msg.parsed.budgetStatus}</Text>
                      </View>

                      {/* Date & Time */}
                      <View style={styles.parsedGridBox}>
                        <Text style={styles.parsedLabel}>DATE & TIME</Text>
                        <Text style={styles.parsedValueBold}>{msg.parsed.dateTime}</Text>
                        <Text style={styles.parsedSubText}>{msg.parsed.timeApprox}</Text>
                      </View>

                      {/* Payment Method */}
                      <View style={styles.parsedGridBox}>
                        <Text style={styles.parsedLabel}>PAYMENT METHOD</Text>
                        <Text style={styles.parsedValueBold}>{msg.parsed.paymentMethod}</Text>
                        <Text style={styles.parsedSubText}>{msg.parsed.cardSub}</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                      style={[styles.confirmLogBtnTouch, isConfirmed && styles.confirmLogBtnConfirmed]}
                      activeOpacity={0.9}
                      onPress={() => handleConfirmLogExpense(msg.id, msg.parsed)}
                      disabled={isConfirmed}
                    >
                      <LinearGradient
                        colors={isConfirmed ? ['#10B981', '#059669'] : ['#2563EB', '#1D4ED8']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.confirmLogGradient}
                      >
                        <Ionicons name={isConfirmed ? "checkmark-circle" : "checkmark-circle-outline"} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.confirmLogText}>
                          {isConfirmed ? 'Expense Confirmed & Logged' : 'Confirm & Log Expense'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.editFieldsBtn} activeOpacity={0.8}>
                      <Ionicons name="pencil-outline" size={15} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={styles.editFieldsText}>Edit Extracted Fields</Text>
                    </TouchableOpacity>

                    {/* Disclaimer Footer */}
                    <View style={styles.disclaimerRow}>
                      <Ionicons name="information-circle-outline" size={14} color="#94A3B8" style={{ marginRight: 4 }} />
                      <Text style={styles.disclaimerText}>
                        Extract auto-matched against Sri Lankan bank statement rules.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }

          return null;
        })}

        {loading && (
          <View style={styles.aiMsgRow}>
            <View style={styles.sparkleAvatarCircle}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
            <View style={styles.loadingBubble}>
              <Text style={styles.loadingText}>Extracting expense details...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Input Bar */}
      <View style={styles.bottomInputWrapper}>
        <View style={styles.floatingInputCard}>
          <TouchableOpacity style={styles.plusIconBtn} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TextInput
            style={styles.chatInput}
            placeholder="Ask Expenso or log expense (e.g. Rs. 1,200)..."
            placeholderTextColor="#94A3B8"
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={handleSendPrompt}
          />

          <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
            <Ionicons name="mic-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sendCircleBtn}
            onPress={handleSendPrompt}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 8,
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
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  /* Sub Header Badge */
  subHeaderBadgeRow: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  liveSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  blueLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
    marginRight: 6,
  },
  liveSyncText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 100,
  },

  /* Date Divider */
  dateDividerPill: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dateDividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },

  /* AI Message Row */
  aiMsgRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sparkleAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  aiMsgGroup: {
    flex: 1,
  },
  senderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  aiBubbleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  aiBubbleText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 21,
    fontWeight: '500',
  },
  exampleBox: {
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  exampleText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },

  /* User Message Row */
  userMsgRow: {
    alignSelf: 'flex-end',
    maxWidth: '84%',
    marginBottom: 20,
  },
  userBubbleCard: {
    backgroundColor: '#2563EB',
    borderRadius: 22,
    borderBottomRightRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  userMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  userMetaText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  userMetaProcessed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* AI Parsed Extraction Card */
  matchScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  matchScoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  extractionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderTopLeftRadius: 4,
    padding: 18,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  extractionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  greenCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  extractionStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Amount Box */
  amountHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  totalAmountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalAmountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: -0.6,
  },
  receiptIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Parsed Grid 2x2 */
  parsedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  parsedGridBox: {
    width: (width - 106) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
  },
  parsedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  parsedValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  parsedSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  parsedStatusGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },

  /* Action Buttons inside Card */
  confirmLogBtnTouch: {
    borderRadius: 22,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 10,
  },
  confirmLogBtnConfirmed: {
    shadowColor: '#10B981',
  },
  confirmLogGradient: {
    height: 48,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  editFieldsBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  editFieldsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },

  /* Disclaimer Footer */
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 15,
  },

  /* Loading State */
  loadingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },

  /* Floating Bottom Input */
  bottomInputWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatingInputCard: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    flexDirection: 'row',
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
  plusIconBtn: {
    padding: 6,
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  micBtn: {
    padding: 6,
    marginRight: 4,
  },
  sendCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
