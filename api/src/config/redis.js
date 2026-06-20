const Redis = require('ioredis');
const loadEnvironment = require('./loadEnv');

loadEnvironment();

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
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3
    });

    let connected = false;

    redis.on('ready', () => {
        connected = true;
        console.log('Redis connected.');
    });

    redis.on('error', (err) => {
        connected = false;
        console.error('Erro no Redis:', err.message);
    });

    redis.on('close', () => {
        connected = false;
    });

    const safeRedis = {
        async get(key) {
            if (!connected) return null;
            try { return await redis.get(key); } catch { return null; }
        },
        async incr(key) {
            if (!connected) return 1;
            try { return await redis.incr(key); } catch { return 1; }
        },
        async ttl(key) {
            if (!connected) return -1;
            try { return await redis.ttl(key); } catch { return -1; }
        },
        async set(key, value, mode, duration) {
            if (!connected) return 'OK';
            try { return await redis.set(key, value, mode, duration); } catch { return 'OK'; }
        },
        async del(key) {
            if (!connected) return 0;
            try { return await redis.del(key); } catch { return 0; }
        },
        async expire(key, seconds) {
            if (!connected) return 1;
            try { return await redis.expire(key, seconds); } catch { return 1; }
        },
        on(...args) {
            return redis.on(...args);
        }
    };

    module.exports = safeRedis;
}