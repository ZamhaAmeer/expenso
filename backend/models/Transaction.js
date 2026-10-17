const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title/Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      default: 'expense',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'General',
    },
    paymentMethod: {
      type: String,
      default: 'Commercial Bank',
    },
    merchant: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    entryMethod: {
      type: String,
      enum: ['manual', 'ai_chat', 'ocr'],
      default: 'manual',
    },
    rawInput: {
      type: String,
      default: '',
    },
    isReviewed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
