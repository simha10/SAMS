const logger = require('../utils/logger');

/**
 * Middleware to authenticate cron job requests
 * Validates X-Cron-Secret header against CRON_SECRET environment variable
 */
function cronAuth(req, res, next) {
  const cronSecret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;

  // If no secret is configured, allow the request (dev mode)
  if (!expectedSecret) {
    logger.warn('CRON_SECRET not configured, allowing cron job request');
    return next();
  }

  // Validate the secret
  if (!cronSecret || cronSecret !== expectedSecret) {
    logger.warn('Unauthorized cron job request attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing cron secret'
    });
  }

  logger.info('Cron job authentication successful', {
    job: req.path,
    timestamp: new Date().toISOString()
  });
  
  next();
}

module.exports = cronAuth;