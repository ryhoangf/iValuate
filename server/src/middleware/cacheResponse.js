const crypto = require('crypto');
const { getRedisClient, isRedisReady } = require('../config/redis');

function cacheResponse(ttlSeconds, namespace) {
    return async function redisResponseCache(req, res, next) {
        if (req.method !== 'GET' || !isRedisReady()) return next();

        const redis = getRedisClient();
        const tier = req.subscriptionTier || 'public';
        const digest = crypto
            .createHash('sha256')
            .update(`${req.originalUrl}|tier=${tier}`)
            .digest('hex');
        const key = `ivaluate:v1:${namespace}:${digest}`;

        try {
            const cached = await redis.get(key);
            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.type('application/json').send(cached);
            }
        } catch (error) {
            console.warn(`[redis] cache read failed (${namespace}):`, error.message);
            return next();
        }

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                redis
                    .set(key, JSON.stringify(body), { EX: ttlSeconds })
                    .catch((error) =>
                        console.warn(`[redis] cache write failed (${namespace}):`, error.message)
                    );
            }
            res.set('X-Cache', 'MISS');
            return originalJson(body);
        };
        next();
    };
}

module.exports = { cacheResponse };

