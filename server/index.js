// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/db'); // Lưu ý đường dẫn config
const productRoutes = require('./src/routes/productRoutes'); // Import Route
const authRoutes = require('./src/routes/authRoutes'); // <--- Thêm dòng này
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Cấu hình Routes ---
// Tất cả API liên quan đến product sẽ bắt đầu bằng /api
app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Backend iValuate (Layered Architecture) is Running!');
});

app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});