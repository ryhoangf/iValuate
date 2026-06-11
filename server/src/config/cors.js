/**
 * Danh sách origin được phép gọi API trực tiếp từ trình duyệt.
 * CORS_ORIGINS (phân tách bằng dấu phẩy) ưu tiên; không có thì dùng APP_BASE_URL / FRONTEND_URL.
 */
function getAllowedOrigins() {
    const raw = process.env.CORS_ORIGINS;
    if (raw && String(raw).trim()) {
        return [
            ...new Set(
                String(raw)
                    .split(',')
                    .map((s) => s.trim().replace(/\/$/, ''))
                    .filter(Boolean)
            ),
        ];
    }

    const fromUrls = [];
    for (const key of ['APP_BASE_URL', 'FRONTEND_URL']) {
        const v = process.env[key];
        if (v && String(v).trim()) {
            fromUrls.push(String(v).trim().replace(/\/$/, ''));
        }
    }

    if (fromUrls.length > 0) {
        return [...new Set(fromUrls)];
    }

    if (process.env.NODE_ENV !== 'production') {
        return ['http://localhost:3000', 'http://127.0.0.1:3000'];
    }

    return [];
}

function createCorsOptions() {
    const allowedOrigins = getAllowedOrigins();

    return {
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    };
}

module.exports = { getAllowedOrigins, createCorsOptions };
