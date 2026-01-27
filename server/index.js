// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/db');
const productRoutes = require('./src/routes/productRoutes');
const authRoutes = require('./src/routes/authRoutes');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Cấu hình Routes ---
app.use('/api/products', productRoutes); // Thêm /products vào đây
app.use('/api/auth', authRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Backend iValuate (Layered Architecture) is Running!');
});

app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});