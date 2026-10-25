const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const DEFAULT_CATEGORIES = [
  { category: 'Groceries', limit: 25000, color: '#0284C7' },
  { category: 'Food & Dining', limit: 20000, color: '#F59E0B' },
  { category: 'Transportation', limit: 12000, color: '#10B981' },
  { category: 'Utilities', limit: 15000, color: '#8B5CF6' },
  { category: 'Shopping', limit: 18000, color: '#EC4899' },
  { category: 'Entertainment', limit: 10000, color: '#6366F1' },
];

// @desc Get all budgets with spent amount for current month
// @route GET /api/budgets
exports.getBudgets = async (req, res) => {
  try {
    const currentMonth = Number(req.query.month) || new Date().getMonth() + 1;
    const currentYear = Number(req.query.year) || new Date().getFullYear();

    let budgets = await Budget.find({
      user: req.user.id,
      month: currentMonth,
      year: currentYear,
    });

    // Seed default budgets if user has no budgets for this month
    if (budgets.length === 0) {
      const defaultDocs = DEFAULT_CATEGORIES.map((cat) => ({
        user: req.user.id,
        category: cat.category,
        limit: cat.limit,
        month: currentMonth,
        year: currentYear,
        color: cat.color,
      }));
      budgets = await Budget.insertMany(defaultDocs);
    }

    // Calculate actual spent per category for the current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const expenseTransactions = await Transaction.find({
      user: req.user.id,
      type: 'expense',
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const categorySpending = {};
    expenseTransactions.forEach((tx) => {
      const cat = tx.category || 'General';
      categorySpending[cat] = (categorySpending[cat] || 0) + tx.amount;
    });

    const results = budgets.map((b) => {
      const spent = categorySpending[b.category] || 0;
      const percentage = b.limit > 0 ? Math.min(Math.round((spent / b.limit) * 100), 100) : 0;
      const isOverBudget = spent > b.limit;
      const isNearLimit = percentage >= (b.alertThreshold || 80);

      return {
        _id: b._id,
        category: b.category,
        limit: b.limit,
        spent,
        remaining: Math.max(0, b.limit - spent),
        percentage,
        isOverBudget,
        isNearLimit,
        color: b.color || '#2563EB',
        month: b.month,
        year: b.year,
      };
    });

    // Total budget summary
    const totalBudget = results.reduce((acc, curr) => acc + curr.limit, 0);
    const totalSpent = results.reduce((acc, curr) => acc + curr.spent, 0);

    res.json({
      budgets: results,
      totalBudget,
      totalSpent,
      totalRemaining: Math.max(0, totalBudget - totalSpent),
      overallPercentage: totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create or update a category budget
// @route POST /api/budgets
exports.setBudget = async (req, res) => {
  try {
    const { category, limit, month, year, alertThreshold, color } = req.body;

    if (!category || limit === undefined) {
      return res.status(400).json({ message: 'Category and limit amount are required' });
    }

    const currentMonth = Number(month) || new Date().getMonth() + 1;
    const currentYear = Number(year) || new Date().getFullYear();

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user.id,
        category: category.trim(),
        month: currentMonth,
        year: currentYear,
      },
      {
        $set: {
          limit: Number(limit),
          alertThreshold: alertThreshold || 80,
          color: color || '#2563EB',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a category budget
// @route DELETE /api/budgets/:id
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await budget.deleteOne();
    res.json({ message: 'Budget category removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
