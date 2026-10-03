const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionSummary,
  createTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTransactions);
router.get('/summary', getTransactionSummary);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
