// server/config/db.js
const mysql = require('mysql2');
require('dotenv').config(); // Đọc file .env

// Tạo một "hồ chứa" kết nối (Connection Pool)
// Giúp tái sử dụng kết nối, tăng tốc độ thay vì mở/đóng liên tục
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Chuyển sang dạng Promise để dùng async/await cho gọn
const promisePool = pool.promise();

console.log("✅ Đã cấu hình kết nối MySQL!");

module.exports = promisePool;