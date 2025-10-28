// redis.config.js
import { Redis } from 'ioredis';

export const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,

    // Reconnection strategy
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },

    // Connection timeout
    connectTimeout: 10000,

    // Keep alive
    keepAlive: 30000,

    // TLS for production (if using Redis Cloud, AWS ElastiCache, etc.)
    ...(process.env.REDIS_TLS === 'true' && {
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
    }),
};

// Create connection
const redisConnection = new Redis(redisConfig);

// Event handlers for monitoring
redisConnection.on('connect', () => {
    console.log('Redis: Connected');
});

redisConnection.on('ready', () => {
    console.log('Redis: Ready to accept commands');
});

redisConnection.on('error', (err) => {
    console.error('Redis Error:', err.message);
});

redisConnection.on('close', () => {
    console.log('Redis: Connection closed');
});

redisConnection.on('reconnecting', () => {
    console.log('Redis: Reconnecting...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing Redis connection...');
    await redisConnection.quit();
    process.exit(0);
});

export default redisConnection;