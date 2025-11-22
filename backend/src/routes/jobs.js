const express = require('express');
const router = express.Router();
const cronAuth = require('../middleware/cronAuth');
const logger = require('../utils/logger');

// Import job logic
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const notificationService = require('../services/notificationService');
const { getCurrentDateString, isWithinOfficeHours } = require('../utils/haversine');

// Apply authentication middleware to all job routes
router.use(cronAuth);

/**
 * POST /jobs/daily-absent
 * Mark absentees at 11:00 AM daily
 */
router.post('/daily-absent', async (req, res) => {
  const startTime = new Date().toISOString();
  logger.info('Starting daily absentee marking job', { startTime });

  try {
    const today = getCurrentDateString();
    
    // Get all active employees
    const employees = await User.find({ 
      isActive: true, 
      role: 'employee' 
    }).select('_id empId name');

    // Get approved leaves for today
    const approvedLeaves = await LeaveRequest.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
      status: 'approved'
    }).select('userId');

    const employeesOnLeave = new Set(
      approvedLeaves.map(leave => leave.userId.toString())
    );

    // Get existing attendance records for today
    const existingAttendance = await Attendance.find({ 
      date: today 
    }).select('userId status');

    const employeesWithAttendance = new Set(
      existingAttendance.map(att => att.userId.toString())
    );

    // Mark absentees (idempotent - only mark if not already marked)
    const absentees = [];
    for (const employee of employees) {
      const employeeId = employee._id.toString();
      
      // Skip if employee is on approved leave
      if (employeesOnLeave.has(employeeId)) {
        continue;
      }

      // Skip if employee already has attendance record
      if (employeesWithAttendance.has(employeeId)) {
        continue;
      }

      // Check if already marked absent (idempotency)
      const existingAbsent = await Attendance.findOne({
        userId: employee._id,
        date: today,
        status: 'absent'
      });

      if (existingAbsent) {
        continue; // Already marked as absent
      }

      // Mark as absent
      await Attendance.create({
        userId: employee._id,
        date: today,
        status: 'absent'
      });

      absentees.push(employee);
    }

    const endTime = new Date().toISOString();
    logger.info('Daily absentee marking job completed', {
      markedAbsent: absentees.length,
      date: today,
      startTime,
      endTime,
      duration: new Date(endTime) - new Date(startTime)
    });
    
    res.status(200).json({
      success: true,
      message: `Marked ${absentees.length} employees as absent for ${today}`,
      marked: absentees.length,
      date: today
    });
  } catch (error) {
    const endTime = new Date().toISOString();
    logger.error('Daily absentee marking job failed', {
      error: error.message,
      stack: error.stack,
      startTime,
      endTime
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to mark absentees',
      error: error.message
    });
  }
});

/**
 * POST /jobs/daily-summary
 * Send daily summary at 6:30 PM
 */
router.post('/daily-summary', async (req, res) => {
  const startTime = new Date().toISOString();
  logger.info('Starting daily summary job', { startTime });

  try {
    const today = getCurrentDateString();
    
    // Get all managers and directors
    const managers = await User.find({ 
      role: { $in: ['manager', 'director'] },
      isActive: true 
    });

    let totalNotifications = 0;
    for (const manager of managers) {
      // Get team members for this manager
      const teamMembers = await User.find({ 
        managerId: manager._id,
        isActive: true 
      }).select('_id');

      if (teamMembers.length === 0) {
        continue;
      }

      const teamMemberIds = teamMembers.map(member => member._id);

      // Get attendance summary for the team
      const attendanceSummary = await Attendance.aggregate([
        {
          $match: {
            userId: { $in: teamMemberIds },
            date: today
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Calculate summary data
      const summaryData = {
        date: today,
        total: teamMembers.length,
        present: 0,
        absent: 0,
        flagged: 0
      };

      attendanceSummary.forEach(item => {
        if (item._id === 'present') {
          summaryData.present = item.count;
        } else if (item._id === 'absent') {
          summaryData.absent = item.count;
        }
      });

      // Get flagged count separately
      const flaggedCount = await Attendance.countDocuments({
        userId: { $in: teamMemberIds },
        date: today,
        flagged: true
      });

      summaryData.flagged = flaggedCount;

      // Ensure all team members are accounted for
      const totalRecorded = summaryData.present + summaryData.absent;
      if (totalRecorded < summaryData.total) {
        summaryData.absent += (summaryData.total - totalRecorded);
      }

      // Send summary notification
      try {
        await notificationService.sendDailySummary(manager, summaryData);
        totalNotifications++;
      } catch (notifyError) {
        logger.error('Failed to send daily summary to manager', {
          managerId: manager._id,
          error: notifyError.message
        });
      }
    }

    const endTime = new Date().toISOString();
    logger.info('Daily summary job completed', {
      notificationsSent: totalNotifications,
      managersProcessed: managers.length,
      date: today,
      startTime,
      endTime,
      duration: new Date(endTime) - new Date(startTime)
    });
    
    res.status(200).json({
      success: true,
      message: `Sent daily summary to ${totalNotifications} managers`,
      notifications: totalNotifications,
      managers: managers.length,
      date: today
    });
  } catch (error) {
    const endTime = new Date().toISOString();
    logger.error('Daily summary job failed', {
      error: error.message,
      stack: error.stack,
      startTime,
      endTime
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to send daily summaries',
      error: error.message
    });
  }
});

/**
 * POST /jobs/auto-checkout
 * Auto checkout at 9:00 PM daily
 */
router.post('/auto-checkout', async (req, res) => {
  const startTime = new Date().toISOString();
  logger.info('Starting auto checkout job', { startTime });

  try {
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
    
    logger.info('Found users to auto-checkout', { count: attendanceRecords.length });
    
    let autoCheckoutCount = 0;
    
    for (const attendance of attendanceRecords) {
      try {
        // Skip if already auto-checked out (idempotency check)
        if (attendance.flaggedReason && attendance.flaggedReason.includes('Auto checkout applied')) {
          logger.debug('Skipping already auto-checked out user', { 
            userId: attendance.userId._id,
            attendanceId: attendance._id
          });
          continue;
        }

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
        
        logger.info('Auto checked out user', {
          userId: attendance.userId._id,
          checkoutTime: attendance.checkOutTime,
          workingHours: attendance.workingHours
        });
      } catch (userError) {
        logger.error('Error auto-checking out user', {
          userId: attendance.userId._id,
          error: userError.message,
          stack: userError.stack
        });
      }
    }
    
    const endTime = new Date().toISOString();
    logger.info('Auto checkout job completed', {
      autoCheckedOut: autoCheckoutCount,
      totalRecords: attendanceRecords.length,
      startTime,
      endTime,
      duration: new Date(endTime) - new Date(startTime)
    });
    
    res.status(200).json({
      success: true,
      message: `Auto checkout completed for ${autoCheckoutCount} users`,
      processed: autoCheckoutCount,
      total: attendanceRecords.length
    });
  } catch (error) {
    const endTime = new Date().toISOString();
    logger.error('Auto checkout job failed', {
      error: error.message,
      stack: error.stack,
      startTime,
      endTime
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to perform auto checkout',
      error: error.message
    });
  }
});

module.exports = router;