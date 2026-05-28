require('dotenv').config();

/**
 * Chuẩn hoá secret (tránh \\r cuối dòng từ .env Windows làm lệch ký token).
 */
function getJwtSecret() {
    const raw = process.env.JWT_SECRET;
    if (raw == null || String(raw).trim() === '') {
        throw new Error('JWT_SECRET is not set');
    }
    return String(raw).trim();
}

module.exports = { getJwtSecret };
