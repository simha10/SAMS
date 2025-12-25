const redis = require('redis');
const logger = require('./logger');

// Load environment variables only when PLATFORM is not 'gcp'
if (process.env.PLATFORM !== 'gcp') {
    require('dotenv').config();
}

// Build Redis configuration from environment variables
const getRedisConfig = () => {
    // Log environment variable availability for debugging (without exposing secrets)
    logger.info('Checking Redis configuration:');
    logger.info(`PLATFORM: ${process.env.PLATFORM || 'NOT SET'}`);
    logger.info(`REDIS_HOST: ${process.env.REDIS_HOST ? 'SET' : 'NOT SET'}`);
    logger.info(`REDIS_PORT: ${process.env.REDIS_PORT ? 'SET' : 'NOT SET'}`);
    logger.info(`REDIS_USERNAME: ${process.env.REDIS_USERNAME ? 'SET' : 'NOT SET'}`);
    logger.info(`REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? 'SET' : 'NOT SET'}`);

    // Use only split Redis configuration (no REDIS_URL support)
    if (process.env.REDIS_HOST) {
        logger.info('Using individual Redis configuration parameters');
        return {
            username: process.env.REDIS_USERNAME || 'default',
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT) || 6379
            }
        };
    }

    // No Redis configuration provided
    logger.warn('No Redis configuration found in environment variables');
    return null;
};

// Create Redis client with modern configuration
let redisClient;
const redisConfig = getRedisConfig();

if (redisConfig) {
    logger.info('Creating Redis client with configuration');
    redisClient = redis.createClient(redisConfig);

    redisClient.on('connect', () => {
        logger.info('Connected to Redis');
    });

    redisClient.on('ready', () => {
        logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
        logger.error('Redis error:', err);
    });

    redisClient.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
    });

    redisClient.on('end', () => {
        logger.info('Redis connection ended');
    });
} else {
    logger.warn('No Redis configuration found - Redis client not created');
}

// Connect to Redis (async)
const connectRedis = async () => {
    try {
        if (redisConfig) {
            logger.info('Attempting to connect to Redis');
            await redisClient.connect();
            logger.info('Redis connected successfully');
        } else {
            logger.warn('Redis not configured - skipping connection');
        }
    } catch (error) {
        logger.error('Redis connection error:', error);
        throw error; // Re-throw to allow caller to handle
    }
};

// Graceful shutdown
const disconnectRedis = async () => {
    try {
        if (redisConfig && redisClient && redisClient.isOpen) {
            await redisClient.quit();
            logger.info('Redis disconnected gracefully');
        }
    } catch (error) {
        logger.error('Error disconnecting Redis:', error);
    }
};

module.exports = {
    redisClient,
    connectRedis,
    disconnectRedis
};