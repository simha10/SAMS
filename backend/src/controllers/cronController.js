const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const logger = require('../config/logger');
const CronRun = require('../models/CronRun');
const { getCurrentDateString } = require('../utils/haversine');

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
    const decoded = jwt.verify(actualToken, signingKey, {
      algorithms: ['RS256'],
      // Add your Cloud Run service URL as audience
      // Example: 'https://your-service-name-xyz-uc.a.run.app'
      // This should be configured as an environment variable
      audience: process.env.CLOUD_RUN_SERVICE_URL
    });

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

// Middleware to verify OIDC token from Cloud Scheduler
async function verifyCronRequest(req, res, next) {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header in cron request');
      return res.status(401).json({
        success: false,
        message: 'Authorization header required for cron jobs'
      });
    }

    const verifiedToken = await verifyGoogleToken(authHeader);
    if (!verifiedToken) {
      logger.error('Cron request verification failed');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid Google OIDC token'
      });
    }

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
  
  try {
    logger.info('Cron job started: Daily absentee marking', { date: today });
    
    // Check if job already ran today
    if (await checkIfJobRan(jobName, today)) {
      logger.info('Daily absentee job already executed today, skipping', { date: today });
      return res.status(200).json({
        success: true,
        message: 'Job already executed today',
        skipped: true
      });
    }
    
    // Mark job as started
    const executionId = await markJobStarted(jobName, today);
    if (!executionId) {
      logger.warn('Could not start daily absentee job, possibly already running', { date: today });
      return res.status(409).json({
        success: false,
        message: 'Job is already running or failed to start'
      });
    }
    
    // Import the actual logic from the existing job file
    const { markAbsenteeLogic } = require('../jobs/daily');
    await markAbsenteeLogic();
    
    // Mark job as completed
    await markJobCompleted(jobName, executionId);
    
    logger.info('Daily absentee job completed successfully', { date: today });
    return res.status(200).json({
      success: true,
      message: 'Daily absentee marking completed successfully',
      date: today
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
  
  try {
    logger.info('Cron job started: Daily summary report', { date: today });
    
    // Check if job already ran today
    if (await checkIfJobRan(jobName, today)) {
      logger.info('Daily summary job already executed today, skipping', { date: today });
      return res.status(200).json({
        success: true,
        message: 'Job already executed today',
        skipped: true
      });
    }
    
    // Mark job as started
    const executionId = await markJobStarted(jobName, today);
    if (!executionId) {
      logger.warn('Could not start daily summary job, possibly already running', { date: today });
      return res.status(409).json({
        success: false,
        message: 'Job is already running or failed to start'
      });
    }
    
    // Import the actual logic from the existing job file
    const { sendDailySummaryLogic } = require('../jobs/daily');
    await sendDailySummaryLogic();
    
    // Mark job as completed
    await markJobCompleted(jobName, executionId);
    
    logger.info('Daily summary job completed successfully', { date: today });
    return res.status(200).json({
      success: true,
      message: 'Daily summary report completed successfully',
      date: today
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
  
  try {
    logger.info('Cron job started: Auto checkout', { date: today });
    
    // Check if job already ran today
    if (await checkIfJobRan(jobName, today)) {
      logger.info('Auto checkout job already executed today, skipping', { date: today });
      return res.status(200).json({
        success: true,
        message: 'Job already executed today',
        skipped: true
      });
    }
    
    // Mark job as started
    const executionId = await markJobStarted(jobName, today);
    if (!executionId) {
      logger.warn('Could not start auto checkout job, possibly already running', { date: today });
      return res.status(409).json({
        success: false,
        message: 'Job is already running or failed to start'
      });
    }
    
    // Import the actual logic from the existing job file
    const { autoCheckoutLogic } = require('../jobs/autoCheckout');
    await autoCheckoutLogic();
    
    // Mark job as completed
    await markJobCompleted(jobName, executionId);
    
    logger.info('Auto checkout job completed successfully', { date: today });
    return res.status(200).json({
      success: true,
      message: 'Auto checkout completed successfully',
      date: today
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
  
  try {
    logger.info('Cron job started: Birthday notifications', { date: today });
    
    // Check if job already ran today
    if (await checkIfJobRan(jobName, today)) {
      logger.info('Birthday notifications job already executed today, skipping', { date: today });
      return res.status(200).json({
        success: true,
        message: 'Job already executed today',
        skipped: true
      });
    }
    
    // Mark job as started
    const executionId = await markJobStarted(jobName, today);
    if (!executionId) {
      logger.warn('Could not start birthday notifications job, possibly already running', { date: today });
      return res.status(409).json({
        success: false,
        message: 'Job is already running or failed to start'
      });
    }
    
    // Import the actual logic from the existing job file
    const { runBirthdayNotifications } = require('../jobs/birthdayNotifications');
    await runBirthdayNotifications();
    
    // Mark job as completed
    await markJobCompleted(jobName, executionId);
    
    logger.info('Birthday notifications job completed successfully', { date: today });
    return res.status(200).json({
      success: true,
      message: 'Birthday notifications completed successfully',
      date: today
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
    
    return res.status(200).json({
      success: true,
      message: 'Cron service is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cron health check failed', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Cron service health check failed'
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