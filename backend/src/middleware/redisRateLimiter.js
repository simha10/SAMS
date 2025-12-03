const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Redis-based rate limiter middleware
 * Implements sliding window log algorithm for accurate rate limiting
 * 
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Window size in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.prefix - Redis key prefix
 * @param {Function} options.keyGenerator - Function to generate rate limit key
 * @param {Function} options.skip - Function to determine if rate limiting should be skipped
 */
const redisRateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100,
        prefix = 'rate_limit',
        keyGenerator = (req) => {
            // Use user ID if authenticated, otherwise IP
            if (req.user && req.user._id) {
                return `user:${req.user._id}`;
            }

            // Get real IP address considering proxies
            let ip = req.ip || req.connection.remoteAddress;

            // Handle IPv6 localhost
            if (ip === '::1' || ip === '::ffff:127.0.0.1') {
                ip = '127.0.0.1';
            }

            // Handle X-Forwarded-For header
            if (req.headers['x-forwarded-for']) {
                // Get the first IP in the chain (client IP)
                ip = req.headers['x-forwarded-for'].split(',')[0].trim();
            } else if (req.headers['x-real-ip']) {
                ip = req.headers['x-real-ip'];
            }

            return `ip:${ip}`;
        },
        skip = () => false,
        message = 'Too many requests, please try again later.',
        statusCode = 429
    } = options;

    return async (req, res, next) => {
        // If Redis is not configured, skip rate limiting
        if (!redisClient || !redisClient.isOpen) {
            return next();
        }

        try {
            // Check if rate limiting should be skipped
            if (await skip(req, res)) {
                return next();
            }

            // Generate rate limit key
            const key = `${prefix}:${keyGenerator(req)}`;

            // Current timestamp
            const now = Date.now();

            // Window start time
            const windowStart = now - windowMs;

            // Remove expired entries from the sorted set
            await redisClient.zRemRangeByScore(key, 0, windowStart);

            // Count current requests in window
            const currentCount = await redisClient.zCard(key);

            // Check if limit exceeded
            if (currentCount >= max) {
                // Log rate limit hit with detailed information
                logger.warn('RATE LIMIT HIT', {
                    key,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    url: req.url,
                    method: req.method,
                    timestamp: new Date().toISOString()
                });

                return res.status(statusCode).json({
                    success: false,
                    message
                });
            }

            // Add current request to the sorted set
            await redisClient.zAdd(key, {
                score: now,
                value: `${now}-${Math.random()}`
            });

            // Set expiration for the key to clean up memory
            await redisClient.expire(key, Math.ceil(windowMs / 1000));

            // Add rate limit info to response headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - currentCount - 1));
            res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

            next();
        } catch (error) {
            logger.error('Rate limiter error:', error);

            // Fail open - allow request through if Redis is unavailable
            next();
        }
    };
};

module.exports = redisRateLimiter;