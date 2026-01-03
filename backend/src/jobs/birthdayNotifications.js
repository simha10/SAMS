const cron = require('node-cron');
const User = require('../models/User');
const logger = require('../config/logger');

// Export the function for testing
// This function has been moved to birthday.logic.js for better separation of concerns
// Please use require('../jobs/birthday.logic').runBirthdayNotifications instead

// Start birthday notifications cron job
function startBirthdayNotificationsJob() {
  // Send birthday notifications at 8:00 AM daily
  cron.schedule('0 8 * * *', runBirthdayNotifications);

  logger.info('Birthday notification cron job initialized');
}

// Export functions for cron controller and testing
module.exports = {
    startBirthdayNotificationsJob
};