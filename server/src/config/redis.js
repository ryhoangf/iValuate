const { createClient } = require('redis');

const redisUrl = String(process.env.REDIS_URL || '').trim();
let client = null;
let connectPromise = null;

function getRedisClient() {
    if (!redisUrl) return null;
    if (!client) {
        client = createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => Math.min(retries * 200, 3000),
            },
        });
        client.on('error', (error) => {
            console.warn('[redis] connection error:', error.message);
        });
    }
    return client;
}

async function connectRedis() {
    const redisClient = getRedisClient();
    if (!redisClient) return false;
    if (redisClient.isReady) return true;
    if (!connectPromise) {
        connectPromise = redisClient
            .connect()
            .then(() => {
                console.log('[redis] connected');
                return true;
            })
            .catch((error) => {
                console.warn('[redis] startup connection failed:', error.message);
                return false;
            })
            .finally(() => {
                connectPromise = null;
            });
    }
    return connectPromise;
}

function isRedisReady() {
    return Boolean(client?.isReady);
}

module.exports = {
    connectRedis,
    getRedisClient,
    isRedisReady,
};

