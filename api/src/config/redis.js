const Redis = require('ioredis');
const loadEnvironment = require('./loadEnv');

loadEnvironment();

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