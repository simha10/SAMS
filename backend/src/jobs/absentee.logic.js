const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const { getCurrentDateString } = require('../utils/haversine');
const logger = require('../config/logger');

// Function to mark absentees - exported for cron controller and direct testing
async function markAbsenteeLogic() {
  try {
    const today = getCurrentDateString();
    const todayDate = new Date(today);

    logger.info('Running daily absentee marking job...', { date: today });

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

    logger.info('[CRON][ABSENT] Active employees: ' + employees.length);
    logger.info('[CRON][ABSENT] Present today: ' + employeesWithAttendance.size);
    logger.info('[CRON][ABSENT] On leave: ' + employeesOnLeave.size);

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

    logger.info('[CRON][ABSENT] Marked absent: ' + absentees.length);
    logger.info(`Marked ${absentees.length} employees as absent and ${leavees.length} employees as on leave for ${today}`);

    return { 
      absentees: absentees.length, 
      onLeave: leavees.length,
      totalProcessed: employees.length,
      date: today
    };
  } catch (error) {
    logger.error('Daily absentee marking job error:', error);
    throw error;
  }
}

// Check if date is a Sunday
function isSunday(dateString) {
  const date = new Date(dateString);
  return date.getDay() === 0;
}

module.exports = {
  markAbsenteeLogic
};