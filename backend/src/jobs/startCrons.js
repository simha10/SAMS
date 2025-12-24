const logger = require('../config/logger');
const { startDailyJob } = require('./daily');
const { startAutoCheckoutJob } = require('./autoCheckout');
const { startBirthdayNotificationsJob } = require('./birthdayNotifications');

/**
 * Start all cron jobs if RUN_CRON environment variable is set to 'true'
 * This allows controlling cron execution per environment:
 * - Render: Set RUN_CRON=true to run cron jobs
 * - Cloud Run: Set RUN_CRON=false to disable cron (use Cloud Scheduler instead)
 */
function startCrons() {
  const shouldRunCron = process.env.RUN_CRON === 'true';

  if (shouldRunCron) {
    logger.info('=== STARTING CRON JOBS ===');
    logger.info('RUN_CRON=true - Cron jobs will be started');
    
    // Start all cron jobs
    startDailyJob();
    startAutoCheckoutJob();
    startBirthdayNotificationsJob();
    
    logger.info('All cron jobs started successfully');
    logger.info('=== END STARTING CRON JOBS ===');
  } else {
    logger.info('=== CRON JOBS DISABLED ===');
    logger.info('RUN_CRON is not set to "true" - Cron jobs will NOT run');
    logger.info('Set RUN_CRON=true in environment to enable cron jobs');
    logger.info('=== END CRON JOBS DISABLED ===');
  }
}

module.exports = {
  startCrons
};

