const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Budget category is required'],
      trim: true,
    },
    limit: {
      type: Number,
      required: [true, 'Budget limit amount is required'],
      min: [1, 'Budget limit must be at least 1'],
    },
    period: {
      type: String,
      enum: ['monthly', 'weekly', 'yearly'],
      default: 'monthly',
    },
    month: {
      type: Number, // 1 - 12
      default: () => new Date().getMonth() + 1,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    alertThreshold: {
      type: Number, // Percentage: e.g. 80 (80%)
      default: 80,
    },
    color: {
      type: String,
      default: '#2563EB',
    },
  },
  { timestamps: true }
);

// Compound index so a user only has one budget per category per month/year
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
