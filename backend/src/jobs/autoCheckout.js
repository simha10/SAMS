const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { isWithinOfficeHours, haversine } = require('../utils/haversine');
const logger = require('../config/logger');
const { redisClient } = require('../config/redis');

// Function to auto checkout - exported for cron controller
// This function has been moved to autoCheckout.logic.js for better separation of concerns
// Please use require('../jobs/autoCheckout.logic').autoCheckoutLogic instead

// Start auto checkout cron job
function startAutoCheckoutJob() {
  // Auto checkout at 11:59 PM IST
  // Cron expression: "At 59 minutes past hour 23 (11 PM) in Asia/Kolkata timezone"
  // This will run at 11:59 PM IST regardless of server timezone
  cron.schedule('59 23 * * *', async () => {
  try {
    await autoCheckoutLogic();
  } catch (error) {
    logger.error('Auto checkout job error:', error);
  }
  }, {
    timezone: "Asia/Kolkata" // Explicitly set timezone to IST
  });

  logger.info('Auto checkout cron job initialized');
}

module.exports = {
  startAutoCheckoutJob
};