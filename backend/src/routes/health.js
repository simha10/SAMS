const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const logger = require('../utils/logger');
const { version } = require('../../package.json');

/**
 * GET /health
 * Human-friendly health check endpoint
 */
router.get('/health', (req, res) => {
  const healthData = {
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version
  };

  logger.info('Health check requested', healthData);
  res.status(200).json(healthData);
});

/**
 * GET /healthz
 * Cloud Run readiness check with database connectivity verification
 */
router.get('/healthz', async (req, res) => {
  try {
    // Check database connectivity
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1; // 1 = connected
    
    // Try to ping the database
    let dbPingSuccess = false;
    let dbPingTime = null;
    
    if (isDbConnected) {
      const pingStart = Date.now();
      try {
        await mongoose.connection.db.admin().ping();
        dbPingSuccess = true;
        dbPingTime = Date.now() - pingStart;
      } catch (pingError) {
        logger.error('Database ping failed', { error: pingError.message });
      }
    }

    const healthData = {
      status: isDbConnected && dbPingSuccess ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'sams-backend',
      version,
      database: {
        connected: isDbConnected,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState],
        ping: dbPingSuccess ? 'successful' : 'failed',
        pingTimeMs: dbPingTime
      },
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
      }
    };

    // Log health check
    logger.info('Cloud Run health check', healthData);

    // Return 200 if healthy, 503 if unhealthy
    if (isDbConnected && dbPingSuccess) {
      res.status(200).json(healthData);
    } else {
      logger.warn('Health check failed - service unhealthy', healthData);
      res.status(503).json(healthData);
    }
  } catch (error) {
    logger.error('Health check endpoint error', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'sams-backend',
      error: error.message
    });
  }
});

module.exports = router;