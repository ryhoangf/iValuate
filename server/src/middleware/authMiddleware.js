const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');

function extractBearerToken(headerVal) {
    if (headerVal == null || typeof headerVal !== 'string') return null;
    let v = headerVal.trim();
    while (v.toLowerCase().startsWith('bearer ')) {
        v = v.slice(7).trim();
    }
    return v || null;
}

function tierFromPayload(payload) {
    return payload && payload.subscriptionTier === 'premium' ? 'premium' : 'lite';
}

function optionalAuth(req, res, next) {
    req.subscriptionTier = 'lite';
    delete req.userId;
    delete req.userRole;
    const h = req.headers.authorization || req.headers.Authorization;
    const rawToken = extractBearerToken(h);
    if (!rawToken) {
        return next();
    }
    let secret;
    try {
        secret = getJwtSecret();
    } catch {
        return next();
    }
    try {
        const payload = jwt.verify(rawToken, secret, { algorithms: ['HS256'] });
        req.userId = payload.id;
        req.userRole = payload.role;
        req.subscriptionTier = tierFromPayload(payload);
    } catch {
        // Token không hợp lệ: coi như Lite (không chặn market-price).
    }
    next();
}

function requirePremium(req, res, next) {
    if (req.subscriptionTier !== 'premium') {
        return res.status(403).json({
            code: 'PREMIUM_REQUIRED',
            message:
                'Tính năng này thuộc gói Premium: biểu đồ lịch sử & dự báo, đường cong trượt giá, phân tích yếu tố ML chi tiết.',
        });
    }
    next();
}

function requireAuth(req, res, next) {
    const h = req.headers.authorization || req.headers.Authorization;
    const rawToken = extractBearerToken(h);
    if (!rawToken) {
        return res.status(401).json({ message: 'Cần đăng nhập (Bearer token)' });
    }
    let secret;
    try {
        secret = getJwtSecret();
    } catch (e) {
        console.error('JWT config:', e.message);
        return res.status(500).json({ message: 'Máy chủ chưa cấu hình JWT_SECRET' });
    }
    try {
        const payload = jwt.verify(rawToken, secret, { algorithms: ['HS256'] });
        req.userId = payload.id;
        req.userRole = payload.role;
        req.subscriptionTier = tierFromPayload(payload);
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại.',
            });
        }
        return res.status(401).json({
            message: 'Token không hợp lệ — vui lòng đăng nhập lại (hoặc secret JWT đổi sau khi bạn đăng nhập).',
        });
    }
}

module.exports = { requireAuth, optionalAuth, requirePremium, extractBearerToken };
