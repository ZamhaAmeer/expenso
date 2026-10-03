const express = require('express');
const router = express.Router();
const { parseExpense } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/parse-expense', parseExpense);

module.exports = router;
