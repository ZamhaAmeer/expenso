import api from './api';

/**
 * Service for managing user transactions and ledger analytics
 */
export const transactionService = {
  /**
   * Fetch all transactions for the logged-in user
   */
  async getTransactions() {
    const response = await api.get('/transactions');
    return response.data;
  },

  /**
   * Fetch summary metrics (Total Balance, Income, Expense, Heatmap data)
   */
  async getSummary() {
    const response = await api.get('/transactions/summary');
    return response.data;
  },

  /**
   * Create a new transaction
   * @param {Object} data - { title, amount, type, category, paymentMethod, merchant, notes, date, entryMethod }
   */
  async createTransaction(data) {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  /**
   * Update an existing transaction
   * @param {string} id - Transaction ID
   * @param {Object} data - Fields to update
   */
  async updateTransaction(id, data) {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  /**
   * Delete a transaction
   * @param {string} id - Transaction ID
   */
  async deleteTransaction(id) {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
};

export default transactionService;
