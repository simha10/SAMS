const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { isWithinOfficeHours, haversine } = require('../utils/haversine');
const logger = require('../config/logger');
const { redisClient } = require('../config/redis');

// Function to auto checkout - exported for cron controller
async function autoCheckoutLogic() {
  try {
    // Get today's date in IST
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istNow = new Date(now.getTime() + istOffset);
    
    // Get today's date in IST (midnight)
    const todayIST = new Date(istNow);
    todayIST.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date in IST
    const tomorrowIST = new Date(todayIST.getTime() + 24 * 60 * 60 * 1000);
    
    logger.info('Running auto checkout job...', {
      dateRange: `${todayIST.toISOString()} to ${tomorrowIST.toISOString()}`
    });
    
    // Find all users who have checked in but not checked out today (IST)
    const attendanceRecords = await Attendance.find({
      date: {
        $gte: todayIST,
        $lt: tomorrowIST
      },
      checkInTime: { $ne: null },
      checkOutTime: null
    }).populate('userId', 'officeLocation');
    
    logger.info(`Found ${attendanceRecords.length} users to auto-checkout`);
    
    let autoCheckoutCount = 0;
    
    for (const attendance of attendanceRecords) {
      try {
        // Safeguard 2: Manager Approval Protection - Skip if already approved by manager
        // Only skip if the record is flagged with a manager approval reason
        if (attendance.flagged && attendance.flaggedReason && 
            typeof attendance.flaggedReason === 'object' &&
            attendance.flaggedReason.type === 'manager_approval') {
          logger.info(`Skipping user ${attendance.userId} - record already approved by manager`);
          continue;
        }
        
        // Set auto checkout time to 11:59 PM IST
        const autoCheckoutTime = new Date(attendance.date);
        autoCheckoutTime.setHours(23, 59, 0, 0); // 11:59 PM
        
        // Update attendance record with auto checkout
        attendance.checkOutTime = autoCheckoutTime;
        
        // Calculate working hours in minutes
        if (attendance.checkInTime) {
          const checkInTime = new Date(attendance.checkInTime);
          const diffMs = autoCheckoutTime - checkInTime;
          attendance.workingHours = Math.floor(diffMs / 60000); // Convert to minutes
        }
        
        // Remove flagged status and update status based on working hours
        attendance.flagged = false;
        attendance.flaggedReason = null;
        
        // Update status based on working hours:
        // - Less than 5 hours (300 minutes) = Half Day
        // - 5 hours or more = Present
        // - 0 hours = Absent (though this shouldn't happen with auto-checkout)
        if (attendance.workingHours >= 300) {
          attendance.status = 'present';
        } else if (attendance.workingHours > 0 && attendance.workingHours < 300) {
          attendance.status = 'half-day';
        } else {
          attendance.status = 'absent';
        }
        
        // Save the updated attendance record
        await attendance.save();
        autoCheckoutCount++;
        
        // Invalidate Redis cache for this user
        try {
          if (redisClient && redisClient.isOpen) {
            // Delete cache keys for this user's attendance data
            const userPrefix = `attendance:user:${attendance.userId}`;
            const pattern = `${userPrefix}:*`;
            
            // Get all keys matching the pattern
            const keys = [];
            for await (const key of redisClient.scanIterator({
              MATCH: pattern,
              COUNT: 100
            })) {
              keys.push(key);
            }
            
            // Delete all matching keys
            if (keys.length > 0) {
              await redisClient.del(keys);
              logger.info(`Invalidated ${keys.length} cache keys for user ${attendance.userId}`);
            }
          }
        } catch (cacheError) {
          logger.error(`Error invalidating cache for user ${attendance.userId}:`, cacheError);
        }
        
        logger.info(`Auto checked out user ${attendance.userId} at ${attendance.checkOutTime} with status ${attendance.status}`);
      } catch (error) {
        logger.error(`Error auto-checking out user ${attendance.userId._id}:`, error);
      }
    }
    
    logger.info(`Auto checkout job completed. ${autoCheckoutCount} users auto-checked out.`);
    
    return { processed: autoCheckoutCount, date: todayIST.toISOString() };
  } catch (error) {
    logger.error('Auto checkout job error:', error);
    throw error;
  }
}

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
  startAutoCheckoutJob,
  autoCheckoutLogic
};