import api from './api';

/**
 * Service for AI parsing and OCR receipt scanning
 */
export const aiService = {
  /**
   * Parse natural language expense string
   * @param {string} prompt - e.g. "Spent 45 on Italian dinner with friends"
   */
  async parseExpense(prompt) {
    const response = await api.post('/ai/parse-expense', { prompt });
    return response.data;
  },

  /**
   * Scan receipt image via OCR / GPT-4o Vision
   * @param {string} imageBase64 - Base64 encoded image string
   */
  async scanReceipt(imageBase64) {
    const response = await api.post('/ai/scan-receipt', { imageBase64 });
    return response.data;
  },
};

export default aiService;
