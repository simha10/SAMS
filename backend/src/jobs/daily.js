const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const { getCurrentDateString } = require('../utils/haversine');
const logger = require('../config/logger');

// Check if date is a Sunday
function isSunday(dateString) {
  const date = new Date(dateString);
  return date.getDay() === 0;
}

// Start daily cron jobs
function startDailyJob() {
  // Mark absentees at 11:00 AM daily
  cron.schedule('0 11 * * *', async () => {
  try {
    logger.info('Running daily absentee marking job...');

    const today = getCurrentDateString();
    const todayDate = new Date(today);

    // Check if today is Sunday
    const isTodaySunday = isSunday(today);

    // Check for declared holidays
    const holiday = await Holiday.findOne({ date: todayDate });
    const isDeclaredHoliday = !!holiday;

    // Check for recurring Sundays
    let isRecurringSunday = false;
    if (isTodaySunday) {
      const sundayHoliday = await Holiday.findOne({
        date: todayDate,
        isRecurringSunday: true
      });
      isRecurringSunday = !!sundayHoliday;
    }

    const isHoliday = isDeclaredHoliday || isRecurringSunday || isTodaySunday;

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

    // Mark absentees and create records for employees on leave
    const absentees = [];
    const leavees = [];
    
    for (const employee of employees) {
      const employeeId = employee._id.toString();

      // Skip if employee already has attendance record
      if (employeesWithAttendance.has(employeeId)) {
        continue;
      }

      // If employee is on approved leave, mark as on-leave
      if (employeesOnLeave.has(employeeId)) {
        const attendanceRecord = await Attendance.create({
          userId: employee._id,
          date: today,
          status: 'on-leave'
        });
        leavees.push(employee);
        continue;
      }

      // Mark as absent
      const attendanceRecord = await Attendance.create({
        userId: employee._id,
        date: today,
        status: 'absent'
      });

      // If today is a holiday, flag the record
      if (isHoliday) {
        attendanceRecord.flagged = true;
        attendanceRecord.flaggedReason = {
          type: 'other',
          message: isTodaySunday ? 'Sunday holiday' : 'Declared holiday'
        };
        await attendanceRecord.save();
      }

      absentees.push(employee);
    }

    logger.info(`Marked ${absentees.length} employees as absent and ${leavees.length} employees as on leave for ${today}`);

  } catch (error) {
    logger.error('Daily absentee marking job error:', error);
  }
  });

  // Send daily summary at 6:30 PM
  cron.schedule('30 18 * * *', async () => {
  try {
    logger.info('Running daily summary job...');

    const today = getCurrentDateString();

    // Get all managers and directors
    const managers = await User.find({
      role: { $in: ['manager', 'director'] },
      isActive: true
    });

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
        onLeave: 0,
        flagged: 0
      };

      attendanceSummary.forEach(item => {
        if (item._id === 'present') {
          summaryData.present = item.count;
        } else if (item._id === 'absent') {
          summaryData.absent = item.count;
        } else if (item._id === 'on-leave') {
          summaryData.onLeave = item.count;
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
      const totalRecorded = summaryData.present + summaryData.absent + summaryData.onLeave;
      if (totalRecorded < summaryData.total) {
        summaryData.absent += (summaryData.total - totalRecorded);
      }

      // Log summary instead of sending notification
      logger.info(`Daily summary for manager ${manager.name}:`, summaryData);
    }

    logger.info('Daily summary job completed');

  } catch (error) {
    logger.error('Daily summary job error:', error);
  }
  });

  logger.info('Daily cron jobs initialized');
}

module.exports = {
  startDailyJob
};