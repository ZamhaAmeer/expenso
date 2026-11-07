import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import subscriptionService from '../services/subscriptionService';
import SubscriptionModal from './SubscriptionModal';

export default function RecurringBillsTracker({
  navigation,
  onBillsUpdated,
  currency = 'Rs.',
  compact = false,
}) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [metrics, setMetrics] = useState({
    totalMonthlyCommitment: 0,
    upcomingNext7DaysSum: 0,
    upcomingNext7DaysCount: 0,
    overdueCount: 0,
    dueSoonCount: 0,
    paidCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'due_soon', 'paid'
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubForEdit, setSelectedSubForEdit] = useState(null);
  const [payingSubId, setPayingSubId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, summary] = await Promise.all([
        subscriptionService.getSubscriptions(),
        subscriptionService.getSummaryMetrics(),
      ]);
      setSubscriptions(list);
      setMetrics(summary);
      if (onBillsUpdated) {
        onBillsUpdated(list, summary);
      }
    } catch (err) {
      console.error('[RecurringBillsTracker Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedSubForEdit(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (sub) => {
    setSelectedSubForEdit(sub);
    setModalVisible(true);
  };

  const handleSaveSubscription = async (formData, editId) => {
    try {
      if (editId) {
        await subscriptionService.updateSubscription(editId, formData);
      } else {
        await subscriptionService.addSubscription(formData);
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      Alert.alert('Error', 'Failed to save subscription. Please try again.');
    }
  };

  const handleDeleteSubscription = async (id) => {
    try {
      await subscriptionService.deleteSubscription(id);
      setModalVisible(false);
      loadData();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete subscription.');
    }
  };

  const handleMarkAsPaid = async (sub) => {
    Alert.alert(
      'Mark as Paid',
      `Record payment of ${currency} ${Number(sub.amount).toLocaleString()} for "${sub.title}"? This will log it to your transaction history and schedule the next due date.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Log',
          style: 'default',
          onPress: async () => {
            try {
              setPayingSubId(sub.id);
              await subscriptionService.markAsPaid(sub.id, 'Commercial Bank');
              await loadData();
              Alert.alert(
                'Payment Logged! 🎉',
                `"${sub.title}" has been recorded as paid and your balance has been updated.`
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to record payment. Please try again.');
            } finally {
              setPayingSubId(null);
            }
          },
        },
      ]
    );
  };

  const filteredList = subscriptions.filter((sub) => {
    if (filterTab === 'due_soon') {
      return !sub.isPaidForCycle && (sub.isOverdue || sub.isDueToday || sub.isDueTomorrow || sub.isDueSoon);
    }
    if (filterTab === 'paid') {
      return sub.isPaidForCycle;
    }
    return true; // 'all'
  });

  if (compact) {
    // Compact View for Dashboard
    return (
      <View style={styles.compactContainer}>
        {/* Compact Header */}
        <View style={styles.compactHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.compactIconCircle}>
              <Ionicons name="repeat-outline" size={18} color="#2563EB" />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.compactTitle}>Upcoming Subscriptions & Bills</Text>
              <Text style={styles.compactSub}>
                {metrics.upcomingNext7DaysCount > 0
                  ? `${metrics.upcomingNext7DaysCount} due soon (${currency} ${metrics.upcomingNext7DaysSum.toLocaleString()})`
                  : `${currency} ${metrics.totalMonthlyCommitment.toLocaleString()}/mo committed`}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.compactAddBtn} onPress={handleOpenAdd}>
            <Ionicons name="add" size={16} color="#2563EB" />
            <Text style={styles.compactAddText}>Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 14 }} />
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyCompact}>
            <Text style={styles.emptyCompactText}>No recurring bills tracked yet.</Text>
            <TouchableOpacity onPress={handleOpenAdd}>
              <Text style={styles.emptyCompactLink}>+ Track first bill</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactCardsScroll}>
            {subscriptions.slice(0, 5).map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.compactCard,
                  sub.isOverdue && styles.compactCardOverdue,
                  sub.isDueToday && styles.compactCardDueToday,
                ]}
                activeOpacity={0.85}
                onPress={() => handleOpenEdit(sub)}
              >
                <View style={styles.compactCardTop}>
                  <View style={[styles.compactCardIcon, { backgroundColor: sub.iconBg }]}>
                    <Ionicons name={sub.icon} size={16} color={sub.iconColor} />
                  </View>
                  <View style={[styles.miniStatusBadge, { backgroundColor: sub.statusBadge?.bg }]}>
                    <Text style={[styles.miniStatusText, { color: sub.statusBadge?.color }]}>
                      {sub.statusBadge?.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.compactCardTitle} numberOfLines={1}>
                  {sub.title}
                </Text>
                <Text style={styles.compactCardAmount}>
                  {currency} {Number(sub.amount).toLocaleString()}
                </Text>

                {!sub.isPaidForCycle && (
                  <TouchableOpacity
                    style={styles.compactPayBtn}
                    onPress={() => handleMarkAsPaid(sub)}
                    disabled={payingSubId === sub.id}
                  >
                    {payingSubId === sub.id ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={12} color="#2563EB" style={{ marginRight: 2 }} />
                        <Text style={styles.compactPayText}>Pay</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <SubscriptionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveSubscription}
          onDelete={handleDeleteSubscription}
          initialData={selectedSubForEdit}
        />
      </View>
    );
  }

  // Full Tracker View for Calendar / Dedicated Screen
  return (
    <View style={styles.container}>
      {/* Metrics Banner */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.metricsCard}
      >
        <View style={styles.metricsTopRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="repeat" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.metricsHeaderTitle}>Recurring Bills Commitment</Text>
            </View>
            <Text style={styles.metricsBigAmount}>
              {currency} {metrics.totalMonthlyCommitment.toLocaleString()}
              <Text style={styles.metricsPerMo}> / month</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.addBillBtn} onPress={handleOpenAdd} activeOpacity={0.88}>
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addBillGradient}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBillText}>Add Bill</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Highlights Pill Row */}
        <View style={styles.highlightsRow}>
          <View style={styles.highlightPill}>
            <View style={[styles.highlightDot, { backgroundColor: metrics.overdueCount > 0 ? '#EF4444' : '#10B981' }]} />
            <Text style={styles.highlightText}>
              {metrics.overdueCount > 0 ? `${metrics.overdueCount} Overdue` : '0 Overdue'}
            </Text>
          </View>

          <View style={styles.highlightPill}>
            <View style={[styles.highlightDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.highlightText}>
              {metrics.upcomingNext7DaysCount} Due in 7 Days ({currency} {metrics.upcomingNext7DaysSum.toLocaleString()})
            </Text>
          </View>

          <View style={styles.highlightPill}>
            <View style={[styles.highlightDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.highlightText}>{metrics.paidCount} Paid</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {[
          { id: 'all', label: `All (${subscriptions.length})` },
          { id: 'due_soon', label: `Due Soon (${metrics.dueSoonCount + metrics.overdueCount})` },
          { id: 'paid', label: `Paid (${metrics.paidCount})` },
        ].map((tab) => {
          const isSel = filterTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isSel && styles.filterTabActive]}
              onPress={() => setFilterTab(tab.id)}
            >
              <Text style={[styles.filterTabText, isSel && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List of Subscriptions */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 30 }} />
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={40} color="#CBD5E1" style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>No bills in this category</Text>
          <Text style={styles.emptySub}>
            {filterTab === 'due_soon'
              ? 'Awesome! You have no upcoming bills due in the immediate cycle.'
              : 'Add your recurring expenses like Netflix, Spotify, or Wifi to keep them organized.'}
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAdd}>
            <Text style={styles.emptyAddBtnText}>+ Add New Subscription</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredList.map((sub) => (
            <View key={sub.id} style={styles.subCard}>
              <TouchableOpacity
                style={styles.cardMainTap}
                activeOpacity={0.8}
                onPress={() => handleOpenEdit(sub)}
              >
                <View style={[styles.iconCircle, { backgroundColor: sub.iconBg }]}>
                  <Ionicons name={sub.icon} size={22} color={sub.iconColor} />
                </View>

                <View style={styles.cardDetails}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {sub.title}
                    </Text>
                    {sub.isAutoDebit && (
                      <View style={styles.autoDebitChip}>
                        <Ionicons name="refresh" size={10} color="#0284C7" />
                        <Text style={styles.autoDebitText}>Auto</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardSub}>
                    {sub.category} • {sub.frequency.charAt(0).toUpperCase() + sub.frequency.slice(1)} (Day {sub.dueDay})
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.cardRightCol}>
                <Text style={styles.cardAmount}>
                  {currency} {Number(sub.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={[styles.statusBadge, { backgroundColor: sub.statusBadge?.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: sub.statusBadge?.color }]}>
                      {sub.statusBadge?.label}
                    </Text>
                  </View>

                  {!sub.isPaidForCycle && (
                    <TouchableOpacity
                      style={styles.payBtn}
                      activeOpacity={0.8}
                      onPress={() => handleMarkAsPaid(sub)}
                      disabled={payingSubId === sub.id}
                    >
                      {payingSubId === sub.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.payBtnText}>Pay</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add / Edit Subscription Modal */}
      <SubscriptionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveSubscription}
        onDelete={handleDeleteSubscription}
        initialData={selectedSubForEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  metricsCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  metricsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  metricsHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsBigAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  metricsPerMo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  addBillBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addBillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  listContainer: {
    gap: 10,
  },
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMainTap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  autoDebitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  autoDebitText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 2,
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  cardRightCol: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  payBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  emptyAddBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Compact Mode Styles for Dashboard */
  compactContainer: {
    marginTop: 18,
    marginBottom: 10,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  compactIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  compactSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  compactAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  compactAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 2,
  },
  compactCardsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  compactCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  compactCardOverdue: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  compactCardDueToday: {
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
  },
  compactCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  miniStatusText: {
    fontSize: 8,
    fontWeight: '700',
  },
  compactCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  compactCardAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 8,
  },
  compactPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 4,
  },
  compactPayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  emptyCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCompactText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyCompactLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
});

