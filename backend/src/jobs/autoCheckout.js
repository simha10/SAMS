const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { isWithinOfficeHours, haversine } = require('../utils/haversine');
const logger = require('../config/logger');

// Auto checkout at 9:00 PM daily
cron.schedule('0 21 * * *', async () => {
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
    }).populate('userId', 'officeLocation');
    
    logger.info(`Found ${attendanceRecords.length} users to auto-checkout`);
    
    let autoCheckoutCount = 0;
    
    for (const attendance of attendanceRecords) {
      try {
        // Set auto checkout time to 9:00 PM
        const autoCheckoutTime = new Date();
        autoCheckoutTime.setHours(21, 0, 0, 0); // 9:00 PM
        
        // If check-in time is after 9:00 PM, set checkout time to check-in time + 1 minute
        if (attendance.checkInTime > autoCheckoutTime) {
          autoCheckoutTime.setTime(attendance.checkInTime.getTime() + 60000); // Add 1 minute
        }
        
        // Update attendance record with auto checkout
        attendance.checkOutTime = autoCheckoutTime;
        
        // Calculate working hours in minutes
        if (attendance.checkInTime) {
          const checkInTime = new Date(attendance.checkInTime);
          const checkOutTime = new Date(attendance.checkOutTime);
          const diffMs = checkOutTime - checkInTime;
          attendance.workingHours = Math.floor(diffMs / 60000); // Convert to minutes
        }
        
        // Check if within office hours at checkout time
        const isWithinHours = isWithinOfficeHours(new Date(attendance.checkOutTime));
        
        // Determine auto checkout reason based on existing flagged reason or create new one
        let autoCheckoutReason = '';
        
        if (attendance.flagged && attendance.flaggedReason) {
          // If already flagged, append auto checkout info
          autoCheckoutReason = `${attendance.flaggedReason} | Auto checkout applied at 9:00 PM`;
        } else {
          // Check if check-in was outside office hours
          const checkInWithinHours = isWithinOfficeHours(new Date(attendance.checkInTime));
          
          if (!checkInWithinHours) {
            autoCheckoutReason = 'Check-in outside office hours | Auto checkout applied at 9:00 PM';
            attendance.status = 'outside-duty';
            attendance.flagged = true;
          } else {
            // Check if current time (9:00 PM) is outside office hours
            if (!isWithinHours) {
              autoCheckoutReason = 'Auto checkout outside office hours | Auto checkout applied at 9:00 PM';
              attendance.status = 'outside-duty';
              attendance.flagged = true;
            } else {
              autoCheckoutReason = 'Auto checkout applied at 9:00 PM';
              // Keep existing status or set to present if not already set
              if (!attendance.status || attendance.status === 'absent') {
                attendance.status = 'present';
              }
            }
          }
        }
        
        // Update flagged reason
        attendance.flaggedReason = autoCheckoutReason;
        
        // Save the updated attendance record
        await attendance.save();
        autoCheckoutCount++;
        
        logger.info(`Auto checked out user ${attendance.userId._id} at ${attendance.checkOutTime}`);
      } catch (error) {
        logger.error(`Error auto-checking out user ${attendance.userId._id}:`, error);
      }
    }
    
    logger.info(`Auto checkout job completed. ${autoCheckoutCount} users auto-checked out.`);
    
  } catch (error) {
    logger.error('Auto checkout job error:', error);
  }
});

logger.info('Auto checkout cron job initialized');