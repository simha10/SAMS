const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const CronRun = require('../models/CronRun');
const { getCurrentDateString } = require('../utils/haversine');

// Function to check if MongoDB connection is ready
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1; // 1 means connected
}

// Google's JWKS client for verifying OIDC tokens
const client = jwksClient({
  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
  requestHeaders: {},
  timeout: 30000
});

// Verify Google OIDC token from Cloud Scheduler
async function verifyGoogleToken(token) {
  if (!token) {
    logger.error('No token provided for cron verification');
    return null;
  }

  try {
    // Remove 'Bearer ' prefix if present
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Get the header to extract kid
    const tokenHeader = jwt.decode(actualToken, { complete: true });
    if (!tokenHeader) {
      logger.error('Invalid token format');
      return null;
    }

    // Get signing key from Google's JWKS
    const key = await client.getSigningKey(tokenHeader.header.kid);
    const signingKey = key.getPublicKey();

    // Verify the token
    // Extract the origin (protocol + host) from the CLOUD_RUN_SERVICE_URL
    let expectedAudience = process.env.CLOUD_RUN_SERVICE_URL;
    let decoded;
    
    if (expectedAudience) {
      try {
        // Parse the URL to extract just the origin (protocol + host)
        const url = new URL(expectedAudience);
        expectedAudience = `${url.protocol}//${url.host}`;
      } catch (urlError) {
        logger.warn('Invalid CLOUD_RUN_SERVICE_URL format, using as-is', { CLOUD_RUN_SERVICE_URL: process.env.CLOUD_RUN_SERVICE_URL });
        // If URL parsing fails, use the original value
      }
      
      decoded = jwt.verify(actualToken, signingKey, {
        algorithms: ['RS256'],
        // Use only the origin part of the URL as audience
        audience: expectedAudience
      });
    } else {
      logger.error('CLOUD_RUN_SERVICE_URL is not set');
      return null;
    }

    // Verify it's from Google Cloud Scheduler
    if (decoded.iss !== 'https://accounts.google.com' && decoded.iss !== 'accounts.google.com') {
      logger.error('Token issuer is not Google', { issuer: decoded.iss });
      return null;
    }

    // Verify the email is from Google's scheduler service
    if (decoded.email && !decoded.email.endsWith('@gcp-sa-scheduler.iam.gserviceaccount.com')) {
      logger.error('Token email is not from Google Cloud Scheduler service', { email: decoded.email });
      return null;
    }

    logger.info('Google OIDC token verified successfully', { 
      email: decoded.email, 
      sub: decoded.sub,
      exp: decoded.exp
    });

    return decoded;
  } catch (error) {
    logger.error('Failed to verify Google OIDC token', { error: error.message });
    return null;
  }
}

// Middleware to verify cron request authentication (dual-mode: production vs development)
async function verifyCronRequest(req, res, next) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const isGCP = process.env.PLATFORM === 'gcp';
    const isSecureEnvironment = isProduction && isGCP;
    
    // Validate environment configuration at startup
    if (isSecureEnvironment) {
      // Production environment: only OIDC is allowed
      if (process.env.ALLOW_LOCAL_CRON === 'true') {
        logger.error('SECURITY VIOLATION: ALLOW_LOCAL_CRON enabled in production environment', { isProduction, isGCP });
        return res.status(500).json({
          success: false,
          message: 'Security configuration error: ALLOW_LOCAL_CRON not allowed in production'
        });
      }
      
      if (!process.env.CLOUD_RUN_SERVICE_URL) {
        logger.error('MISSING CONFIGURATION: CLOUD_RUN_SERVICE_URL required in production', { isProduction, isGCP });
        return res.status(500).json({
          success: false,
          message: 'Missing CLOUD_RUN_SERVICE_URL in production environment'
        });
      }
    } else {
      // Development environment: ensure proper dev configuration
      if (!process.env.CRON_DEV_SECRET && process.env.ALLOW_LOCAL_CRON !== 'true') {
        logger.warn('WARNING: No cron authentication method configured for development', { isProduction, isGCP });
      }
    }
    
    // In development/local environments, allow alternative authentication methods
    if (!isSecureEnvironment) {
      // Check for development cron secret
      const devSecret = req.headers['x-cron-dev-key'];
      const allowLocalCron = process.env.ALLOW_LOCAL_CRON === 'true';
      
      if (devSecret && devSecret === process.env.CRON_DEV_SECRET) {
        logger.info('Development cron request authenticated with X-CRON-DEV-KEY', { 
          source: 'local', 
          isSecureEnvironment 
        });
        req.verifiedToken = { source: 'local-dev' };
        return next();
      }
      
      if (allowLocalCron) {
        logger.info('Development cron request authenticated via ALLOW_LOCAL_CRON', { 
          source: 'local', 
          isSecureEnvironment 
        });
        req.verifiedToken = { source: 'local-dev' };
        return next();
      }
      
      // If not authenticated via dev methods, fall back to Google OIDC
      // This allows testing with real OIDC tokens in development
    }
    
    // For production or if development methods fail, use Google OIDC
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header in cron request', { isSecureEnvironment });
      return res.status(401).json({
        success: false,
        message: 'Authorization header required for cron jobs'
      });
    }

    const verifiedToken = await verifyGoogleToken(authHeader);
    if (!verifiedToken) {
      logger.error('Cron request verification failed', { isSecureEnvironment });
      
      // In non-production environments, provide more detailed error message
      if (!isSecureEnvironment) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid Google OIDC token. In development, use X-CRON-DEV-KEY header or set ALLOW_LOCAL_CRON=true',
          help: 'Set ALLOW_LOCAL_CRON=true or use X-CRON-DEV-KEY header with CRON_DEV_SECRET value'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid Google OIDC token'
        });
      }
    }

    logger.info('Cron request authenticated via Google OIDC', { 
      source: 'google-scheduler', 
      isSecureEnvironment,
      email: verifiedToken.email
    });
    
    // Add verified token to request for potential use in handlers
    req.verifiedToken = verifiedToken;
    next();
  } catch (error) {
    logger.error('Error in cron verification middleware', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
  }
}

// Helper function to check if a cron job has already run today
async function checkIfJobRan(jobName, date = getCurrentDateString()) {
  try {
    const existingRun = await CronRun.findOne({
      jobName,
      date
    });

    return existingRun ? true : false;
  } catch (error) {
    logger.error('Error checking if job already ran', { jobName, date, error: error.message });
    return false; // If there's an error, assume it hasn't run to be safe
  }
}

// Helper function to mark job as started
async function markJobStarted(jobName, date = getCurrentDateString()) {
  try {
    const executionId = `${jobName}-${date}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const cronRun = new CronRun({
      jobName,
      date,
      status: 'running',
      executionId
    });

    await cronRun.save();
    return executionId;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - job already running
      logger.warn('Cron job already running', { jobName, date });
      return null;
    }
    
    logger.error('Error marking job as started', { jobName, date, error: error.message });
    return null;
  }
}

// Helper function to mark job as completed
async function markJobCompleted(jobName, executionId) {
  try {
    await CronRun.updateOne(
      { executionId },
      { 
        $set: { 
          status: 'completed',
          executedAt: new Date()
        }
      }
    );
  } catch (error) {
    logger.error('Error marking job as completed', { jobName, executionId, error: error.message });
  }
}

// Helper function to mark job as failed
async function markJobFailed(jobName, executionId, errorMessage) {
  try {
    await CronRun.updateOne(
      { executionId },
      { 
        $set: { 
          status: 'failed',
          error: errorMessage,
          executedAt: new Date()
        }
      }
    );
  } catch (error) {
    logger.error('Error marking job as failed', { jobName, executionId, error: error.message });
  }
}

// Cron job: Daily absentee marking
const markAbsentee = async (req, res) => {
  const jobName = 'daily-absentee';
  const today = getCurrentDateString();
  let executionId = null;
  
  logger.info('=== CRON JOB START: Daily absentee marking ===', { 
    jobName,
    date: today, 
    source: req.verifiedToken?.source || 'unknown',
    executionId: req.verifiedToken?.email || 'local'
  });
  
  try {
    const source = req.verifiedToken?.source || 'google-scheduler';
    
    // Check if database is connected
    if (!isDatabaseConnected()) {
      logger.error('Database not connected for daily absentee job', { date: today });
      logger.info('=== CRON JOB END: Daily absentee marking - FAILED ===', { jobName, date: today, status: 'FAILED', reason: 'Database not connected' });
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }
    
    // Check if job already ran today
    if (await checkIfJobRan(jobName, today)) {
      logger.info('Daily absentee job already executed today, skipping', { date: today, source });
      
      // Create a CronRun record to track that the job was checked today
      executionId = `${jobName}-${today}-${Date.now()}-skipped`;
      const cronRun = new CronRun({
        jobName,
        date: today,
        status: 'completed',
        executionId,
        executedAt: new Date(),
        source: source // Track execution source
      });
      try {
        await cronRun.save();
      } catch (saveError) {
        if (saveError.code === 11000) {
          // Duplicate key error - another instance already created the skipped record
          logger.warn('CronRun record already exists for skipped job', { jobName, date: today, source });
        } else {
          logger.error('Error saving CronRun record for skipped job', { jobName, date: today, error: saveError.message });
        }
      }
      
      logger.info('CronRun record created for skipped job', { jobName, date: today, source });
      logger.info('=== CRON JOB END: Daily absentee marking - SKIPPED ===', { jobName, date: today, status: 'SKIPPED', reason: 'Already executed today' });
      
      return res.status(200).json({
        success: true,
        message: 'Job already executed today',
        skipped: true,
        source
      });
    }
    
    // Mark job as started
    executionId = await markJobStarted(jobName, today);
    if (!executionId) {
      logger.warn('Could not start daily absentee job, possibly already running', { date: today });
      logger.info('=== CRON JOB END: Daily absentee marking - SKIPPED ===', { jobName, date: today, status: 'SKIPPED', reason: 'Already running or failed to start' });
      return res.status(200).json({  // Changed from 409 to 200 to return success for duplicate execution
        success: true,
        message: 'Job already executed today',
        skipped: true,
        source
      });
    }
    
    // Import the actual logic from the new logic file
    const { markAbsenteeLogic } = require('../jobs/absentee.logic');
    const result = await markAbsenteeLogic();
    
    // Mark job as completed
    await markJobCompleted(jobName, executionId);
    
    logger.info('Daily absentee job completed successfully', { date: today, result, source });
    logger.info('=== CRON JOB END: Daily absentee marking - SUCCESS ===', { jobName, date: today, status: 'SUCCESS', result });
    return res.status(200).json({
      success: true,
      message: 'Daily absentee marking completed successfully',
      date: today,
      result: result,
      source
    });
  } catch (error) {
    logger.error('Daily absentee job failed', { 
      date: today, 
      error: error.message, 
      stack: error.stack 
    });
    
    // Mark job as failed
    if (executionId) {
      await markJobFailed(jobName, executionId, error.message);
    }
    
    logger.info('=== CRON JOB END: Daily absentee marking - FAILED ===', { jobName, date: today, status: 'FAILED', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Daily absentee job failed',
      error: error.message
    });
  }
};

// Cron job: Daily summary report
const sendDailySummary = async (req, res) => {
  const jobName = 'daily-summary';
  const today = getCurrentDateString();
  let executionId = null;
  
  logger.info('=== CRON JOB START: Daily summary report ===', { 
    jobName,
    date: today, 
    source: req.verifiedToken?.source || 'unknown',
    executionId: req.verifiedToken?.email || 'local'
  });
  
  try {
    const source = req.verifiedToken?.source || 'google-scheduler';
    
    // Check if database is connected
    if (!isDatabaseConnected()) {
      logger.error('Database not connected for daily summary job', { date: today });
      logger.info('=== CRON JOB END: Daily summary report - FAILED ===', { jobName, date: today, status: 'FAILED', reason: 'Database not connected' });
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }
    
    // Check if job already ran today
    if (await checkIfJobRan(jobName, today)) {
      logger.info('Daily summary job already executed today, skipping', { date: today, source });
      
      // Create a CronRun record to track that the job was checked today
      executionId = `${jobName}-${today}-${Date.now()}-skipped`;
      const cronRun = new CronRun({
        jobName,
        date: today,
        status: 'completed',
        executionId,
        executedAt: new Date(),
        source: source // Track execution source
      });
      try {
        await cronRun.save();
      } catch (saveError) {
        if (saveError.code === 11000) {
          // Duplicate key error - another instance already created the skipped record
          logger.warn('CronRun record already exists for skipped job', { jobName, date: today, source });
        } else {
          logger.error('Error saving CronRun record for skipped job', { jobName, date: today, error: saveError.message });
        }
      }
      
      logger.info('CronRun record created for skipped job', { jobName, date: today, source });
      logger.info('=== CRON JOB END: Daily summary report - SKIPPED ===', { jobName, date: today, status: 'SKIPPED', reason: 'Already executed today' });
      
      return res.status(200).json({
        success: true,
        message: 'Job already executed today',
        skipped: true,
        source
      });
    }
    
    // Mark job as started
    executionId = await markJobStarted(jobName, today);
    if (!executionId) {
      logger.warn('Could not start daily summary job, possibly already running', { date: today });
      logger.info('=== CRON JOB END: Daily summary report - SKIPPED ===', { jobName, date: today, status: 'SKIPPED', reason: 'Already running or failed to start' });
      return res.status(200).json({  // Changed from 409 to 200 to return success for duplicate execution
        success: true,
        message: 'Job already executed today',
        skipped: true,
        source
      });
    }
    
    // Import the actual logic from the new logic file
    const { sendDailySummaryLogic } = require('../jobs/summary.logic');
    const result = await sendDailySummaryLogic();
    
    // Mark job as completed
    await markJobCompleted(jobName, executionId);
    
    logger.info('Daily summary job completed successfully', { date: today, result, source });
    logger.info('=== CRON JOB END: Daily summary report - SUCCESS ===', { jobName, date: today, status: 'SUCCESS', result });
    return res.status(200).json({
      success: true,
      message: 'Daily summary report completed successfully',
      date: today,
      result: result,
      source
    });
  } catch (error) {
    logger.error('Daily summary job failed', { 
      date: today, 
      error: error.message, 
      stack: error.stack 
    });
    
    // Mark job as failed
    if (executionId) {
      await markJobFailed(jobName, executionId, error.message);
    }
    
    logger.info('=== CRON JOB END: Daily summary report - FAILED ===', { jobName, date: today, status: 'FAILED', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Daily summary job failed',
      error: error.message
    });
  }
};

// Cron job: Auto checkout
const autoCheckout = async (req, res) => {
  const jobName = 'auto-checkout';
  const today = getCurrentDateString();
  let executionId = null;
  
  logger.info('=== CRON JOB START: Auto checkout ===', { 
    jobName,
    date: today, 
    source: req.verifiedToken?.source || 'unknown',
    executionId: req.verifiedToken?.email || 'local'
  });
  
  try {
    const source = req.verifiedToken?.source || 'google-scheduler';
    
    // Check if database is connected
    if (!isDatabaseConnected()) {
      logger.error('Database not connected for auto checkout job', { date: today });
      logger.info('=== CRON JOB END: Auto checkout - FAILED ===', { jobName, date: today, status: 'FAILED', reason: 'Database not connected' });
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }
    
    // Check if job already ran today
    if (await checkIfJobRan(jobName, today)) {
      logger.info('Auto checkout job already executed today, skipping', { date: today, source });
      
      // Create a CronRun record to track that the job was checked today
      executionId = `${jobName}-${today}-${Date.now()}-skipped`;
      const cronRun = new CronRun({
        jobName,
        date: today,
        status: 'completed',
        executionId,
        executedAt: new Date(),
        source: source // Track execution source
      });
      try {
        await cronRun.save();
      } catch (saveError) {
        if (saveError.code === 11000) {
          // Duplicate key error - another instance already created the skipped record
          logger.warn('CronRun record already exists for skipped job', { jobName, date: today, source });
        } else {
          logger.error('Error saving CronRun record for skipped job', { jobName, date: today, error: saveError.message });
        }
      }
      
      logger.info('CronRun record created for skipped job', { jobName, date: today, source });
      logger.info('=== CRON JOB END: Auto checkout - SKIPPED ===', { jobName, date: today, status: 'SKIPPED', reason: 'Already executed today' });
      
      return res.status(200).json({
        success: true,
        message: 'Job already executed today',
        skipped: true,
        source
      });
    }
    
    // Mark job as started
    executionId = await markJobStarted(jobName, today);
    if (!executionId) {
      logger.warn('Could not start auto checkout job, possibly already running', { date: today });
      logger.info('=== CRON JOB END: Auto checkout - SKIPPED ===', { jobName, date: today, status: 'SKIPPED', reason: 'Already running or failed to start' });
      return res.status(200).json({  // Changed from 409 to 200 to return success for duplicate execution
        success: true,
        message: 'Job already executed today',
        skipped: true,
        source
      });
    }
    
    // Import the actual logic from the new logic file
    const { autoCheckoutLogic } = require('../jobs/autoCheckout.logic');
    const result = await autoCheckoutLogic();
    
    // Mark job as completed
    await markJobCompleted(jobName, executionId);
    
    logger.info('Auto checkout job completed successfully', { date: today, result, source });
    logger.info('=== CRON JOB END: Auto checkout - SUCCESS ===', { jobName, date: today, status: 'SUCCESS', result });
    return res.status(200).json({
      success: true,
      message: 'Auto checkout completed successfully',
      date: today,
      result: result,
      source
    });
  } catch (error) {
    logger.error('Auto checkout job failed', { 
      date: today, 
      error: error.message, 
      stack: error.stack 
    });
    
    // Mark job as failed
    if (executionId) {
      await markJobFailed(jobName, executionId, error.message);
    }
    
    logger.info('=== CRON JOB END: Auto checkout - FAILED ===', { jobName, date: today, status: 'FAILED', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Auto checkout job failed',
      error: error.message
    });
  }
};

// Cron job: Birthday notifications
const sendBirthdayWishes = async (req, res) => {
  const jobName = 'birthday-notifications';
  const today = getCurrentDateString();
  let executionId = null;
  
  logger.info('=== CRON JOB START: Birthday notifications ===', { 
    jobName,
    date: today, 
    source: req.verifiedToken?.source || 'unknown',
    executionId: req.verifiedToken?.email || 'local'
  });
  
  try {
    const source = req.verifiedToken?.source || 'google-scheduler';
    
    // Check if database is connected
    if (!isDatabaseConnected()) {
      logger.error('Database not connected for birthday notifications job', { date: today });
      logger.info('=== CRON JOB END: Birthday notifications - FAILED ===', { jobName, date: today, status: 'FAILED', reason: 'Database not connected' });
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }
    
    // Check if job already ran today
    if (await checkIfJobRan(jobName, today)) {
      logger.info('Birthday notifications job already executed today, skipping', { date: today, source });
      
      // Create a CronRun record to track that the job was checked today
      executionId = `${jobName}-${today}-${Date.now()}-skipped`;
      const cronRun = new CronRun({
        jobName,
        date: today,
        status: 'completed',
        executionId,
        executedAt: new Date(),
        source: source // Track execution source
      });
      try {
        await cronRun.save();
      } catch (saveError) {
        if (saveError.code === 11000) {
          // Duplicate key error - another instance already created the skipped record
          logger.warn('CronRun record already exists for skipped job', { jobName, date: today, source });
        } else {
          logger.error('Error saving CronRun record for skipped job', { jobName, date: today, error: saveError.message });
        }
      }
      
      logger.info('CronRun record created for skipped job', { jobName, date: today, source });
      logger.info('=== CRON JOB END: Birthday notifications - SKIPPED ===', { jobName, date: today, status: 'SKIPPED', reason: 'Already executed today' });
      
      return res.status(200).json({
        success: true,
        message: 'Job already executed today',
        skipped: true,
        source
      });
    }
    
    // Mark job as started
    executionId = await markJobStarted(jobName, today);
    if (!executionId) {
      logger.warn('Could not start birthday notifications job, possibly already running', { date: today });
      logger.info('=== CRON JOB END: Birthday notifications - SKIPPED ===', { jobName, date: today, status: 'SKIPPED', reason: 'Already running or failed to start' });
      return res.status(200).json({  // Changed from 409 to 200 to return success for duplicate execution
        success: true,
        message: 'Job already executed today',
        skipped: true,
        source
      });
    }
    
    // Import the actual logic from the new logic file
    const { runBirthdayNotifications } = require('../jobs/birthday.logic');
    const result = await runBirthdayNotifications();
    
    // Mark job as completed
    await markJobCompleted(jobName, executionId);
    
    logger.info('Birthday notifications job completed successfully', { date: today, result, source });
    logger.info('=== CRON JOB END: Birthday notifications - SUCCESS ===', { jobName, date: today, status: 'SUCCESS', result });
    return res.status(200).json({
      success: true,
      message: 'Birthday notifications completed successfully',
      date: today,
      result: result,
      source
    });
  } catch (error) {
    logger.error('Birthday notifications job failed', { 
      date: today, 
      error: error.message, 
      stack: error.stack 
    });
    
    // Mark job as failed
    if (executionId) {
      await markJobFailed(jobName, executionId, error.message);
    }
    
    logger.info('=== CRON JOB END: Birthday notifications - FAILED ===', { jobName, date: today, status: 'FAILED', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Birthday notifications job failed',
      error: error.message
    });
  }
};

// Health check for cron endpoints
const cronHealthCheck = async (req, res) => {
  try {
    // Verify the request is properly authenticated
    if (!req.verifiedToken) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Additional health checks
    const isDBConnected = mongoose.connection.readyState === 1;
    
    if (!isDBConnected) {
      logger.warn('Cron health check: Database not connected', { source: req.verifiedToken.source });
      return res.status(503).json({
        success: false,
        message: 'Database not connected',
        timestamp: new Date().toISOString(),
        databaseConnected: false
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Cron service is healthy',
      timestamp: new Date().toISOString(),
      databaseConnected: isDBConnected,
      source: req.verifiedToken.source
    });
  } catch (error) {
    logger.error('Cron health check failed', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Cron service health check failed',
      error: error.message
    });
  }
};

module.exports = {
  verifyCronRequest,
  markAbsentee,
  sendDailySummary,
  autoCheckout,
  sendBirthdayWishes,
  cronHealthCheck
};