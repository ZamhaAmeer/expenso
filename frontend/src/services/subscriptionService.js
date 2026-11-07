import AsyncStorage from '@react-native-async-storage/async-storage';
import transactionService from './transactionService';

const STORAGE_KEY = '@expenso_recurring_subscriptions_v1';

// Preset subscriptions with default metadata & icons
export const PRESET_SUBSCRIPTIONS = [
  {
    name: 'Netflix',
    category: 'Entertainment',
    defaultAmount: 2200,
    icon: 'film-outline',
    iconBg: '#FEE2E2',
    iconColor: '#EF4444',
  },
  {
    name: 'Spotify',
    category: 'Entertainment',
    defaultAmount: 1190,
    icon: 'musical-notes-outline',
    iconBg: '#DCFCE7',
    iconColor: '#10B981',
  },
  {
    name: 'Dialog Broadband',
    category: 'Utilities',
    defaultAmount: 3490,
    icon: 'wifi-outline',
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
  },
  {
    name: 'CEB Electricity',
    category: 'Utilities',
    defaultAmount: 8250,
    icon: 'flash-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    name: 'Water Board',
    category: 'Utilities',
    defaultAmount: 1650,
    icon: 'water-outline',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
  },
  {
    name: 'Gym Membership',
    category: 'Health',
    defaultAmount: 6500,
    icon: 'barbell-outline',
    iconBg: '#FFE4E6',
    iconColor: '#F43F5E',
  },
  {
    name: 'Apple iCloud',
    category: 'Software & Tech',
    defaultAmount: 350,
    icon: 'cloud-outline',
    iconBg: '#F1F5F9',
    iconColor: '#475569',
  },
  {
    name: 'House Rent',
    category: 'Housing',
    defaultAmount: 65000,
    icon: 'home-outline',
    iconBg: '#FEF9C3',
    iconColor: '#CA8A04',
  },
  {
    name: 'Amazon Prime',
    category: 'Entertainment',
    defaultAmount: 1850,
    icon: 'cart-outline',
    iconBg: '#FFEDD5',
    iconColor: '#EA580C',
  },
  {
    name: 'YouTube Premium',
    category: 'Entertainment',
    defaultAmount: 990,
    icon: 'play-outline',
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
  },
];

// Initial seeded subscriptions if user has none
const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'sub-dialog-wifi',
    title: 'Dialog Home Broadband',
    amount: 3490,
    category: 'Utilities',
    frequency: 'monthly',
    dueDay: 10,
    icon: 'wifi-outline',
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
    isAutoDebit: false,
    lastPaidDate: null,
    notes: 'Fiber 50Mbps unlimited plan',
  },
  {
    id: 'sub-ceb-power',
    title: 'CEB Electricity Bill',
    amount: 8250,
    category: 'Utilities',
    frequency: 'monthly',
    dueDay: 20,
    icon: 'flash-outline',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    isAutoDebit: true,
    lastPaidDate: null,
    notes: 'Account #4321901',
  },
  {
    id: 'sub-netflix',
    title: 'Netflix Premium 4K',
    amount: 2200,
    category: 'Entertainment',
    frequency: 'monthly',
    dueDay: 28,
    icon: 'film-outline',
    iconBg: '#FEE2E2',
    iconColor: '#EF4444',
    isAutoDebit: true,
    lastPaidDate: null,
    notes: 'Family profile 4 screens',
  },
  {
    id: 'sub-spotify',
    title: 'Spotify Family',
    amount: 1190,
    category: 'Entertainment',
    frequency: 'monthly',
    dueDay: 15,
    icon: 'musical-notes-outline',
    iconBg: '#DCFCE7',
    iconColor: '#10B981',
    isAutoDebit: true,
    lastPaidDate: null,
    notes: 'Monthly renewal',
  },
  {
    id: 'sub-gym',
    title: 'Fitness First Gym',
    amount: 6500,
    category: 'Health',
    frequency: 'monthly',
    dueDay: 5,
    icon: 'barbell-outline',
    iconBg: '#FFE4E6',
    iconColor: '#F43F5E',
    isAutoDebit: false,
    lastPaidDate: null,
    notes: 'Monthly trainer & access',
  },
];

/**
 * Calculate next due date and days remaining based on billing day and last payment
 */
export const calculateDueDateStatus = (sub) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDate = now.getDate();

  const dueDay = Math.min(31, Math.max(1, parseInt(sub.dueDay || 1, 10)));

  // Check if already paid this calendar month
  let isPaidForCycle = false;
  if (sub.lastPaidDate) {
    const lastPaid = new Date(sub.lastPaidDate);
    if (
      lastPaid.getFullYear() === currentYear &&
      lastPaid.getMonth() === currentMonth
    ) {
      isPaidForCycle = true;
    }
  }

  let nextDueYear = currentYear;
  let nextDueMonth = currentMonth;

  if (isPaidForCycle) {
    // If paid this month, next due is next month
    nextDueMonth = currentMonth + 1;
    if (nextDueMonth > 11) {
      nextDueMonth = 0;
      nextDueYear += 1;
    }
  } else {
    // If not paid, and today is strictly past the due day, it is overdue in the current month
    // If today is on or before dueDay, it is due this month
  }

  // Get max days in target month (e.g. Feb 28/29)
  const daysInTargetMonth = new Date(nextDueYear, nextDueMonth + 1, 0).getDate();
  const safeDueDay = Math.min(dueDay, daysInTargetMonth);

  const nextDueDate = new Date(nextDueYear, nextDueMonth, safeDueDay, 23, 59, 59);

  // Calculate day difference
  const startOfToday = new Date(currentYear, currentMonth, todayDate).getTime();
  const startOfDueDate = new Date(nextDueYear, nextDueMonth, safeDueDay).getTime();
  const diffMs = startOfDueDate - startOfToday;
  const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isOverdue = !isPaidForCycle && daysUntilDue < 0;
  const isDueToday = !isPaidForCycle && daysUntilDue === 0;
  const isDueTomorrow = !isPaidForCycle && daysUntilDue === 1;
  const isDueSoon = !isPaidForCycle && daysUntilDue > 1 && daysUntilDue <= 3;

  let statusBadge = {
    label: `Due ${nextDueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    color: '#0284C7',
    bg: '#E0F2FE',
    type: 'upcoming',
  };

  if (isPaidForCycle) {
    statusBadge = {
      label: 'Paid This Cycle',
      color: '#16A34A',
      bg: '#DCFCE7',
      type: 'paid',
    };
  } else if (isOverdue) {
    statusBadge = {
      label: `Overdue by ${Math.abs(daysUntilDue)}d`,
      color: '#DC2626',
      bg: '#FEE2E2',
      type: 'overdue',
    };
  } else if (isDueToday) {
    statusBadge = {
      label: 'Due Today!',
      color: '#EA580C',
      bg: '#FFEDD5',
      type: 'today',
    };
  } else if (isDueTomorrow) {
    statusBadge = {
      label: 'Due Tomorrow',
      color: '#D97706',
      bg: '#FEF3C7',
      type: 'tomorrow',
    };
  } else if (isDueSoon) {
    statusBadge = {
      label: `Due in ${daysUntilDue} days`,
      color: '#D97706',
      bg: '#FEF3C7',
      type: 'due_soon',
    };
  }

  return {
    nextDueDate,
    daysUntilDue,
    isPaidForCycle,
    isOverdue,
    isDueToday,
    isDueTomorrow,
    isDueSoon,
    statusBadge,
  };
};

export const subscriptionService = {
  /**
   * Fetch all subscriptions with computed due status and sorted chronologically
   */
  async getSubscriptions() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let list = [];

      if (!stored) {
        list = INITIAL_SUBSCRIPTIONS;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } else {
        list = JSON.parse(stored);
      }

      // Enrich with calculated dynamic status
      const enriched = list.map((sub) => {
        const status = calculateDueDateStatus(sub);
        return {
          ...sub,
          ...status,
        };
      });

      // Sort: Overdue first, then Due Today, then Due Soon, then Upcoming by date, then Paid
      return enriched.sort((a, b) => {
        if (a.isPaidForCycle && !b.isPaidForCycle) return 1;
        if (!a.isPaidForCycle && b.isPaidForCycle) return -1;
        return a.daysUntilDue - b.daysUntilDue;
      });
    } catch (error) {
      console.error('[subscriptionService.getSubscriptions Error]:', error);
      return [];
    }
  },

  /**
   * Add a new recurring subscription / bill
   */
  async addSubscription(data) {
    try {
      const current = await this.getRawList();
      const newSub = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: data.title || 'Untitled Subscription',
        amount: Number(data.amount) || 0,
        category: data.category || 'Utilities',
        frequency: data.frequency || 'monthly',
        dueDay: Number(data.dueDay) || 1,
        icon: data.icon || 'receipt-outline',
        iconBg: data.iconBg || '#E0F2FE',
        iconColor: data.iconColor || '#0284C7',
        isAutoDebit: Boolean(data.isAutoDebit),
        notes: data.notes || '',
        lastPaidDate: null,
        createdAt: new Date().toISOString(),
      };

      const updated = [newSub, ...current];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newSub;
    } catch (error) {
      console.error('[subscriptionService.addSubscription Error]:', error);
      throw error;
    }
  },

  /**
   * Update an existing subscription
   */
  async updateSubscription(id, data) {
    try {
      const current = await this.getRawList();
      const index = current.findIndex((item) => item.id === id);
      if (index === -1) throw new Error('Subscription not found');

      current[index] = {
        ...current[index],
        ...data,
        amount: Number(data.amount !== undefined ? data.amount : current[index].amount),
        dueDay: Number(data.dueDay !== undefined ? data.dueDay : current[index].dueDay),
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      return current[index];
    } catch (error) {
      console.error('[subscriptionService.updateSubscription Error]:', error);
      throw error;
    }
  },

  /**
   * Delete a subscription
   */
  async deleteSubscription(id) {
    try {
      const current = await this.getRawList();
      const filtered = current.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('[subscriptionService.deleteSubscription Error]:', error);
      throw error;
    }
  },

  /**
   * Mark a subscription as paid for this cycle and automatically record a real transaction
   */
  async markAsPaid(id, paymentMethod = 'Commercial Bank') {
    try {
      const current = await this.getRawList();
      const sub = current.find((item) => item.id === id);
      if (!sub) throw new Error('Subscription not found');

      // 1. Create real transaction in transaction history
      let createdTx = null;
      try {
        createdTx = await transactionService.createTransaction({
          title: sub.title,
          amount: Number(sub.amount),
          type: 'expense',
          category: sub.category || 'Utilities',
          paymentMethod: paymentMethod || 'Commercial Bank',
          merchant: sub.title,
          notes: `Recurring subscription auto-logged (${sub.frequency || 'monthly'})`,
          date: new Date().toISOString(),
          entryMethod: 'manual',
        });
      } catch (txErr) {
        console.warn('[subscriptionService] Could not record backend transaction, logging locally:', txErr.message);
      }

      // 2. Update subscription lastPaidDate
      const nowIso = new Date().toISOString();
      const updatedList = current.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            lastPaidDate: nowIso,
          };
        }
        return item;
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      return { success: true, transaction: createdTx };
    } catch (error) {
      console.error('[subscriptionService.markAsPaid Error]:', error);
      throw error;
    }
  },

  /**
   * Reset or re-seed sample data
   */
  async resetToDefaults() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUBSCRIPTIONS));
    return this.getSubscriptions();
  },

  /**
   * Calculate high-level subscription summary metrics
   */
  async getSummaryMetrics() {
    const list = await this.getSubscriptions();

    let totalMonthlyCommitment = 0;
    let upcomingNext7DaysSum = 0;
    let upcomingNext7DaysCount = 0;
    let overdueCount = 0;
    let dueSoonCount = 0;
    let paidCount = 0;

    list.forEach((sub) => {
      // Normalize to monthly equivalent
      let monthlyAmt = Number(sub.amount) || 0;
      if (sub.frequency === 'yearly') monthlyAmt = monthlyAmt / 12;
      if (sub.frequency === 'weekly') monthlyAmt = monthlyAmt * 4.33;

      totalMonthlyCommitment += monthlyAmt;

      if (sub.isPaidForCycle) {
        paidCount += 1;
      } else {
        if (sub.isOverdue) overdueCount += 1;
        if (sub.isDueToday || sub.isDueTomorrow || sub.isDueSoon) dueSoonCount += 1;

        if (sub.daysUntilDue >= 0 && sub.daysUntilDue <= 7) {
          upcomingNext7DaysCount += 1;
          upcomingNext7DaysSum += Number(sub.amount) || 0;
        }
      }
    });

    return {
      totalSubscriptions: list.length,
      totalMonthlyCommitment: Math.round(totalMonthlyCommitment),
      upcomingNext7DaysSum: Math.round(upcomingNext7DaysSum),
      upcomingNext7DaysCount,
      overdueCount,
      dueSoonCount,
      paidCount,
    };
  },

  /**
   * Detect recurring subscriptions from real transaction history
   */
  async autoDetectFromTransactions(transactions = []) {
    if (!transactions || transactions.length < 2) return [];

    const existing = await this.getRawList();
    const existingTitles = new Set(existing.map((s) => s.title.toLowerCase().trim()));

    // Group by merchant or title
    const groups = {};
    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const key = (tx.merchant || tx.title || '').trim().toLowerCase();
      if (!key || key.length < 3) return;

      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    const suggestions = [];
    Object.keys(groups).forEach((key) => {
      const items = groups[key];
      if (items.length >= 2 && !existingTitles.has(key)) {
        // Average amount
        const avgAmt = items.reduce((sum, i) => sum + Number(i.amount || 0), 0) / items.length;
        const lastTx = items[items.length - 1];
        const txDate = new Date(lastTx.date || Date.now());

        suggestions.push({
          title: lastTx.merchant || lastTx.title,
          amount: Math.round(avgAmt),
          category: lastTx.category || 'General',
          frequency: 'monthly',
          dueDay: txDate.getDate(),
          occurrences: items.length,
          icon: 'repeat-outline',
          iconBg: '#E0F2FE',
          iconColor: '#0284C7',
        });
      }
    });

    return suggestions;
  },

  /**
   * Internal helper to get raw stored array
   */
  async getRawList() {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_SUBSCRIPTIONS;
  },
};

export default subscriptionService;

