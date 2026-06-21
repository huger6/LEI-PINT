const Redis = require('ioredis');
const loadEnvironment = require('./loadEnv');

loadEnvironment();

if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required in production — the in-memory mock has no TTL support and will break account lockouts and rate limits');
}

// If REDIS_URL is not provided or we're running tests, export a lightweight
// in-memory mock so the rest of the app can call `get/set/del` safely.
if (!process.env.REDIS_URL || process.env.NODE_ENV === 'test') {
    const mockStore = new Map();
    const mockRedis = {
        async get(key) {
            return mockStore.has(key) ? mockStore.get(key) : null;
        },
        async incr(key) {
            const current = Number(mockStore.get(key) || 0) + 1;
            mockStore.set(key, String(current));
            return current;
        },
        async ttl(_key) {
            return -1;
        },
        async set(key, value, _mode, _duration) {
            mockStore.set(key, String(value));
            return 'OK';
        },
        async del(key) {
            return mockStore.delete(key) ? 1 : 0;
        },
        async expire(key, _seconds) {
            // no-op for mock
            return 1;
        },
        on() {
            // ignore events in mock
        }
    };

    module.exports = mockRedis;
} else {
    const redis = new Redis(process.env.REDIS_URL, {
        // retry not to crash app
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3
    });

    redis.on('error', (err) => {
        console.error('Erro no Redis:', err);
    });

    module.exports = redis;
}