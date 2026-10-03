import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import api from '../services/api';

export default function AIChatScreen({ navigation }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: 'Hi! Tell me about an expense in natural language.\nFor example: "Spent 25 dollars on dinner at Chipotle yesterday"',
    },
  ]);
  const [loading, setLoading] = useState(false);

  // HITL (Human-in-the-Loop) Review Modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [parsedData, setParsedData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'General',
    merchant: '',
    date: '',
  });

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    const currentPrompt = prompt;
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/ai/parse-expense', { prompt: currentPrompt });
      const extracted = res.data.parsed;

      setParsedData({
        title: extracted.title || currentPrompt.slice(0, 30),
        amount: extracted.amount ? String(extracted.amount) : '0',
        type: extracted.type || 'expense',
        category: extracted.category || 'General',
        merchant: extracted.merchant || '',
        date: extracted.date || new Date().toISOString().split('T')[0],
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `I parsed your prompt as $${extracted.amount} for "${extracted.title}". Please review and confirm the details in the popup!`,
        },
      ]);

      setReviewModalVisible(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Sorry, I had trouble parsing that expense. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransaction = async () => {
    try {
      await api.post('/transactions', {
        title: parsedData.title,
        amount: parseFloat(parsedData.amount) || 0,
        type: parsedData.type,
        category: parsedData.category,
        merchant: parsedData.merchant,
        date: parsedData.date,
        entryMethod: 'ai_chat',
        isReviewed: true,
      });

      setReviewModalVisible(false);
      Alert.alert('Success 🎉', 'Expense validated and saved to database!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save transaction.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Expense Logger 🤖</Text>
        <Text style={styles.headerSubtitle}>Human-in-the-Loop Verified</Text>
      </View>

      <ScrollView style={styles.chatContainer} contentContainerStyle={{ paddingVertical: 10 }}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.msgBubble,
              msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={styles.msgText}>{msg.text}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator color="#38BDF8" style={{ marginVertical: 10 }} />}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Spent $15 on Starbucks..."
          placeholderTextColor="#64748B"
          value={prompt}
          onChangeText={setPrompt}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendPrompt} disabled={loading}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* HITL Validation Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔍 Review & Confirm</Text>
            <Text style={styles.modalSub}>
              Verify AI-extracted details before saving to database.
            </Text>

            <Text style={styles.label}>Title / Description</Text>
            <TextInput
              style={styles.modalInput}
              value={parsedData.title}
              onChangeText={(t) => setParsedData({ ...parsedData, title: t })}
            />

            <Text style={styles.label}>Amount ($)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={parsedData.amount}
              onChangeText={(a) => setParsedData({ ...parsedData, amount: a })}
            />

            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.modalInput}
              value={parsedData.category}
              onChangeText={(c) => setParsedData({ ...parsedData, category: c })}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={styles.cancelText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmTransaction}>
                <Text style={styles.confirmText}>Confirm & Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  aiBubble: {
    backgroundColor: '#1E293B',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#0EA5E9',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  msgText: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
