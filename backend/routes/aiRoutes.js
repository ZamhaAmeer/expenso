const express = require('express');
const router = express.Router();
const { parseExpense, scanReceipt } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/parse-expense', parseExpense);
router.post('/scan-receipt', scanReceipt);

module.exports = router;
