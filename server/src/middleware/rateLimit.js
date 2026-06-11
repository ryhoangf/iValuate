const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

function parsePositiveInt(value, fallback) {
    const n = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

const standardHandler = (_req, res) => {
    res.status(429).json({
        message: 'Too many requests. Please try again later.',
    });
};

function redisStore(prefix) {
    const client = getRedisClient();
    if (!client) return undefined;
    return new RedisStore({
        prefix: `ivaluate:ratelimit:${prefix}:`,
        sendCommand: (...args) => client.sendCommand(args),
    });
}

function createLimiter({ prefix, windowMs, max }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        passOnStoreError: true,
        store: redisStore(prefix),
        handler: standardHandler,
    });
}

const authLoginRegisterLimiter = createLimiter({
    prefix: 'login-register',
    windowMs: parsePositiveInt(process.env.AUTH_LOGIN_RATE_WINDOW_MS, 15 * 60 * 1000),
    max: parsePositiveInt(process.env.AUTH_LOGIN_RATE_MAX, 10),
});

const authForgotPasswordLimiter = createLimiter({
    prefix: 'forgot-password',
    windowMs: parsePositiveInt(process.env.AUTH_FORGOT_RATE_WINDOW_MS, 60 * 60 * 1000),
    max: parsePositiveInt(process.env.AUTH_FORGOT_RATE_MAX, 5),
});

const authResetPasswordLimiter = createLimiter({
    prefix: 'reset-password',
    windowMs: parsePositiveInt(process.env.AUTH_RESET_RATE_WINDOW_MS, 15 * 60 * 1000),
    max: parsePositiveInt(process.env.AUTH_RESET_RATE_MAX, 10),
});

module.exports = {
    authLoginRegisterLimiter,
    authForgotPasswordLimiter,
    authResetPasswordLimiter,
};

