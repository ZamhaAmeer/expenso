import api from './api';

/**
 * Service for managing user budget targets, category limits and alerts
 */
export const budgetService = {
  /**
   * Fetch current month's budget tracking and category spending
   * @param {number} month - 1 to 12
   * @param {number} year - e.g. 2026
   */
  async getBudgets(month, year) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get('/budgets', { params });
    return response.data;
  },

  /**
   * Set or update a category budget limit
   * @param {Object} data - { category, limit, month, year, alertThreshold, color }
   */
  async setBudget(data) {
    const response = await api.post('/budgets', data);
    return response.data;
  },

  /**
   * Delete a budget limit
   * @param {string} id - Budget document ID
   */
  async deleteBudget(id) {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

export default budgetService;
