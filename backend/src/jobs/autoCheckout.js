const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

// Auto checkout at 11:59 PM IST (59 18 * * * in UTC)
cron.schedule('59 18 * * *', async () => {
  try {
    logger.info('Running auto checkout job...');
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Find all users who have checked in but not checked out today
    const attendanceRecords = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      checkInTime: { $ne: null },
      checkOutTime: null
    });
    
    logger.info(`Found ${attendanceRecords.length} users to auto-checkout`);
    
    let autoCheckoutCount = 0;
    
    for (const attendance of attendanceRecords) {
      try {
        // Safeguard 1: Idempotency - Skip if checkout already exists
        if (attendance.checkOutTime) {
          logger.info(`Skipping user ${attendance.userId} - checkout already exists`);
          continue;
        }
        
        // Safeguard 2: Manager Approval Protection - Skip if already approved
        if (!attendance.flagged && 
            ['present', 'absent', 'half-day', 'outside-duty', 'on-leave'].includes(attendance.status)) {
          logger.info(`Skipping user ${attendance.userId} - record already approved`);
          continue;
        }
        
        // Set auto checkout time to 11:59 PM
        const autoCheckoutTime = new Date(attendance.date);
        autoCheckoutTime.setHours(23, 59, 0, 0); // 11:59 PM
        
        // Update attendance record with auto checkout
        attendance.checkOutTime = autoCheckoutTime;
        
        // Calculate working hours in minutes
        if (attendance.checkInTime) {
          const checkInTime = new Date(attendance.checkInTime);
          const checkOutTime = new Date(attendance.checkOutTime);
          const diffMs = checkOutTime - checkInTime;
          attendance.workingHours = Math.floor(diffMs / 60000); // Convert to minutes
        }
        
        // Set flagged status and reason for auto-checkout
        attendance.flagged = true;
        attendance.flaggedReason = 'Auto-checkout applied — needs manager verification';
        
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
        
        logger.info(`Auto checked out user ${attendance.userId} at ${attendance.checkOutTime}`);
      } catch (error) {
        logger.error(`Error auto-checking out user ${attendance.userId}:`, error);
      }
    }
    
    logger.info(`Auto checkout job completed. ${autoCheckoutCount} users auto-checked out.`);
    
  } catch (error) {
    logger.error('Auto checkout job error:', error);
  }
});

logger.info('Auto checkout cron job initialized with updated schedule and logic');