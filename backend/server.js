const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Expenso API Service is Running 🚀' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Expenso Server] Running on port ${PORT}`);
});
