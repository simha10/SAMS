const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Redis-based caching middleware
 * Implements cache-aside pattern with configurable TTL
 * 
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in seconds (default: 60)
 * @param {string} options.prefix - Cache key prefix (default: 'cache')
 * @param {Function} options.keyGenerator - Function to generate cache key
 * @param {boolean} options.skipOnAuth - Skip caching for authenticated requests (default: false)
 */
const cacheMiddleware = (options = {}) => {
    const {
        ttl = 60, // 1 minute default
        prefix = 'cache',
        keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
        skipOnAuth = false
    } = options;

    return async (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip caching for authenticated requests if configured
        if (skipOnAuth && req.user) {
            return next();
        }

        try {
            // Generate cache key
            const key = `${prefix}:${keyGenerator(req)}`;

            // Try to get cached response
            const cachedResponse = await redisClient.get(key);

            if (cachedResponse) {
                // Cache hit - return cached response
                logger.info(`Cache HIT for key: ${key}`);
                return res.json(JSON.parse(cachedResponse));
            }

            // Cache miss - capture original send function
            logger.info(`Cache MISS for key: ${key}`);

            const originalSend = res.send;
            res.send = function (body) {
                // Restore original send function
                res.send = originalSend;

                // Cache the response if it's successful
                try {
                    const responseData = JSON.parse(body);
                    if (responseData.success !== false) {
                        redisClient.setEx(key, ttl, body);
                        logger.info(`Cached response for key: ${key} with TTL: ${ttl}s`);
                    }
                } catch (e) {
                    // Not a JSON response, don't cache
                    logger.debug(`Non-JSON response, not caching key: ${key}`);
                }

                // Send the response
                return res.send(body);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', error);
            // Continue without caching if Redis is unavailable
            next();
        }
    };
};

module.exports = cacheMiddleware;