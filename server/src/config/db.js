// server/config/db.js
const mysql = require('mysql2');
require('dotenv').config();

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Keep TCP connections alive through SSH tunnel
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 15000,
  });
}

let pool = createPool();
let promisePool = pool.promise();

// Auto-recreate pool on fatal connection errors (SSH tunnel drop/reconnect)
pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      // Pool will create a new connection automatically on next acquire
    }
  });
});

pool.on('error', (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
    console.warn('[db] Pool connection lost, recreating pool...');
    try { pool.end(() => {}); } catch (_) {}
    pool = createPool();
    promisePool = pool.promise();
    // Re-attach error handler
    pool.on('error', () => {});
    console.log('[db] Pool recreated.');
  }
});

// Wrapper that retries once on lost-connection errors
const MAX_RETRIES = 2;
const wrappedPool = {
  query: async (...args) => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await promisePool.query(...args);
      } catch (err) {
        const isRetryable =
          err.code === 'PROTOCOL_CONNECTION_LOST' ||
          err.code === 'ECONNRESET' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR';
        if (isRetryable && attempt < MAX_RETRIES) {
          console.warn(`[db] Retryable error (attempt ${attempt}): ${err.code}. Retrying...`);
          await new Promise((r) => setTimeout(r, 300 * attempt));
          continue;
        }
        throw err;
      }
    }
  },
  execute: async (...args) => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await promisePool.execute(...args);
      } catch (err) {
        const isRetryable =
          err.code === 'PROTOCOL_CONNECTION_LOST' ||
          err.code === 'ECONNRESET' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR';
        if (isRetryable && attempt < MAX_RETRIES) {
          console.warn(`[db] Retryable error (attempt ${attempt}): ${err.code}. Retrying...`);
          await new Promise((r) => setTimeout(r, 300 * attempt));
          continue;
        }
        throw err;
      }
    }
  },
  getConnection: (...args) => promisePool.getConnection(...args),
};

console.log('✅ Đã cấu hình kết nối MySQL!');

module.exports = wrappedPool;