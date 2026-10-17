const Transaction = require('../models/Transaction');

// @desc Get all transactions for logged-in user
// @route GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get summary statistics (Total balance, income, expense, 52-week grid data)
// @route GET /api/transactions/summary
exports.getTransactionSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    let totalIncome = 0;
    let totalExpense = 0;

    const heatmapData = {}; // Format: YYYY-MM-DD -> count/total amount

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }

      const dateStr = new Date(tx.date).toISOString().split('T')[0];
      if (!heatmapData[dateStr]) {
        heatmapData[dateStr] = 0;
      }
      if (tx.type === 'expense') {
        heatmapData[dateStr] += tx.amount;
      }
    });

    res.json({
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      heatmapData,
      totalCount: transactions.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a transaction
// @route POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      paymentMethod,
      merchant,
      notes,
      date,
      entryMethod,
      rawInput,
      isReviewed,
    } = req.body;

    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'Title and amount are required fields.' });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      title: title.trim(),
      amount: Number(amount),
      type: type || 'expense',
      category: category || 'General',
      paymentMethod: paymentMethod || 'Commercial Bank',
      merchant: merchant || '',
      notes: notes || '',
      date: date || new Date(),
      entryMethod: entryMethod || 'manual',
      rawInput: rawInput || '',
      isReviewed: isReviewed !== undefined ? isReviewed : true,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update a transaction
// @route PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this transaction' });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a transaction
// @route DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
