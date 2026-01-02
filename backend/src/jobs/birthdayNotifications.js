const cron = require('node-cron');
const User = require('../models/User');
const logger = require('../config/logger');

// Export the function for testing
async function runBirthdayNotifications() {
    try {
        logger.info('Running birthday notification job...');

        // Get today's date
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
        const currentDay = today.getDate();

        // Find employees whose birthday is today
        const birthdayEmployees = await User.find({
            dob: { $exists: true, $ne: null },
            isActive: true
        });

        const employeesWithBirthdayToday = birthdayEmployees.filter(employee => {
            const dob = new Date(employee.dob);
            return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
        });

        if (employeesWithBirthdayToday.length === 0) {
            logger.info('No birthdays today');
            return;
        }

        // Get all active employees to notify
        const allEmployees = await User.find({
            isActive: true
        }).select('_id name empId');

        // Log birthday notifications instead of sending them
        for (const birthdayEmployee of employeesWithBirthdayToday) {
            const message = `🎉 Hey team, today is ${birthdayEmployee.name}'s birthday! Make sure to contribute for the celebration 🥳🎂`;

            // Notify all employees
            for (const employee of allEmployees) {
                // Skip notifying the birthday person themselves
                if (employee._id.toString() === birthdayEmployee._id.toString()) {
                    continue;
                }

                try {
                    // Log the notification instead of sending it
                    logger.info(`Birthday notification for ${employee.name}: ${message}`);
                } catch (error) {
                    logger.error(`Failed to process birthday notification for ${employee.name}:`, error);
                }
            }

            logger.info(`Birthday notifications processed for ${birthdayEmployee.name}`);
        }

        logger.info(`Birthday notification job completed. Processed ${employeesWithBirthdayToday.length} birthday(s).`);

    } catch (error) {
        logger.error('Birthday notification job error:', error);
    }
}

// Start birthday notifications cron job
function startBirthdayNotificationsJob() {
  // Send birthday notifications at 8:00 AM daily
  cron.schedule('0 8 * * *', runBirthdayNotifications);

  logger.info('Birthday notification cron job initialized');
}

// Export functions for cron controller and testing
module.exports = {
    runBirthdayNotifications,
    startBirthdayNotificationsJob
};