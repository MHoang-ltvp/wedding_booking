// Toàn bộ code Node.js/Express
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9999;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend đang chạy' });
});

app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
});
