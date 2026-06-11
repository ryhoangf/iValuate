const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createCorsOptions, getAllowedOrigins } = require('./src/config/cors');
const { connectRedis, getRedisClient, isRedisReady } = require('./src/config/redis');

try {
    require('./src/config/jwt').getJwtSecret();
} catch (error) {
    console.error('JWT_SECRET is required:', error.message);
    process.exit(1);
}

const db = require('./src/config/db');
const app = express();
const port = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(cors(createCorsOptions()));
app.use(express.json());

app.get('/', (_req, res) => {
    res.send('Backend iValuate is running');
});

app.get('/health/live', (_req, res) => {
    res.json({ ok: true, service: 'ivaluate-api' });
});

app.get('/health/ready', async (_req, res) => {
    const checks = { mysql: false, redis: !process.env.REDIS_URL };
    try {
        await db.query('SELECT 1');
        checks.mysql = true;
    } catch (error) {
        checks.mysqlError = error.message;
    }

    if (process.env.REDIS_URL && isRedisReady()) {
        try {
            checks.redis = (await getRedisClient().ping()) === 'PONG';
        } catch (error) {
            checks.redisError = error.message;
        }
    }

    const ok = checks.mysql && checks.redis;
    res.status(ok ? 200 : 503).json({ ok, service: 'ivaluate-api', checks });
});

async function start() {
    await connectRedis();
    const productRoutes = require('./src/routes/productRoutes');
    const authRoutes = require('./src/routes/authRoutes');
    const watchRoutes = require('./src/routes/watchRoutes');

    app.use('/api/products', productRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/watches', watchRoutes);

    app.listen(port, '0.0.0.0', () => {
        const origins = getAllowedOrigins();
        console.log(`Server listening on 0.0.0.0:${port}`);
        if (origins.length) {
            console.log(`CORS origins: ${origins.join(', ')}`);
        }
    });
}

start().catch((error) => {
    console.error('Unable to start server:', error);
    process.exit(1);
});
