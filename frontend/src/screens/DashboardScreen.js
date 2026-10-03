import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
    heatmapData: {},
  });
  const [recentTx, setRecentTx] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions'),
      ]);
      setSummary(summaryRes.data);
      setRecentTx(txRes.data.slice(0, 5));
    } catch (err) {
      console.log('Error fetching dashboard data:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  // Generate 28-day visual activity grid for GitHub-style spending heatmap
  const renderHeatmap = () => {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const spent = summary.heatmapData[dateStr] || 0;

      let intensityColor = '#1E293B'; // empty / 0
      if (spent > 0 && spent <= 20) intensityColor = '#15803D'; // Low green
      else if (spent > 20 && spent <= 100) intensityColor = '#EAB308'; // Moderate yellow
      else if (spent > 100) intensityColor = '#EF4444'; // High red

      days.push(
        <View key={dateStr} style={[styles.heatmapCell, { backgroundColor: intensityColor }]} />
      );
    }
    return days;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'User'} 👋</Text>
            <Text style={styles.headerSubtitle}>Financial Overview</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net Balance</Text>
          <Text style={styles.balanceAmount}>
            ${summary.balance ? summary.balance.toFixed(2) : '0.00'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>↓ Income</Text>
              <Text style={[styles.statValue, { color: '#22C55E' }]}>
                +${summary.totalIncome ? summary.totalIncome.toFixed(2) : '0.00'}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>↑ Expenses</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                -${summary.totalExpense ? summary.totalExpense.toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* GitHub-style Heatmap */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Spending Heatmap (Last 28 Days)</Text>
          <Text style={styles.sectionSubtitle}>
            Dark Red = High spend • Green = Light spend
          </Text>
          <View style={styles.heatmapGrid}>{renderHeatmap()}</View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentTx.length === 0 ? (
            <Text style={styles.emptyText}>No transactions logged yet.</Text>
          ) : (
            recentTx.map((item) => (
              <View key={item._id} style={styles.txRow}>
                <View>
                  <Text style={styles.txTitle}>{item.title}</Text>
                  <Text style={styles.txMeta}>
                    {item.category} • {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    { color: item.type === 'income' ? '#22C55E' : '#F8FAFC' },
                  ]}
                >
                  {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#38BDF8',
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statBox: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heatmapCell: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    marginVertical: 10,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  txTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  txMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
