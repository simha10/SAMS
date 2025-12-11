const Attendance = require('../models/Attendance');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday'); // Added Holiday model
// Helper function to get team query based on user role
function getTeamQuery(userId, userRole) {
  if (userRole === 'director') {
    // Directors see all employees in the organization (except themselves)
    return {
      role: 'employee',
      isActive: true,
      _id: { $ne: userId } // Exclude the director themselves
    };
  } else {
    // Managers see employees under their management
    return {
      managerId: userId,
      role: 'employee',
      isActive: true
    };
  }
}

// Get team attendance for a specific date
async function getTeamAttendance(req, res) {
  try {
    const { date } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate date
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

    // Get team query based on user role
    const teamQuery = getTeamQuery(userId, userRole);

    // Find all employees based on role
    const teamMembers = await User.find(teamQuery).select('empId name email dob mobile isActive createdAt updatedAt');

    const teamMemberIds = teamMembers.map(member => member._id);

    // Get attendance records for team members on the specified date
    const attendanceRecords = await Attendance.find({
      userId: { $in: teamMemberIds },
      date: {
        $gte: targetDate,
        $lt: nextDate
      }
    }).populate('userId', 'empId name email');

    // Create a map for quick lookup
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.userId._id.toString()] = record;
    });

    // Build team attendance data
    const team = teamMembers.map(employee => {
      const attendance = attendanceMap[employee._id.toString()] || null;

      return {
        employee: {
          id: employee._id,
          empId: employee.empId,
          name: employee.name,
          email: employee.email,
          dob: employee.dob,
          mobile: employee.mobile,
          isActive: employee.isActive,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt
        },
        attendance: attendance ? {
          status: attendance.status,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          workingHours: attendance.workingHours,
          location: attendance.location,
          distanceFromOffice: attendance.distanceFromOffice,
          flagged: attendance.flagged
        } : {
          status: 'absent',
          checkInTime: null,
          checkOutTime: null,
          workingHours: null,
          location: null,
          distanceFromOffice: null,
          flagged: false
        }
      };
    });

    // Calculate summary
    const summary = {
      total: teamMembers.length,
      present: team.filter(t => t.attendance.status === 'present').length,
      absent: team.filter(t => t.attendance.status === 'absent').length,
      flagged: team.filter(t => t.attendance.flagged).length,
      onLeave: team.filter(t => t.attendance.status === 'on-leave').length,
      halfDay: team.filter(t => t.attendance.status === 'half-day').length,
      outsideDuty: team.filter(t => t.attendance.status === 'outside-duty').length
    };

    res.json({
      success: true,
      data: {
        date: targetDate,
        team,
        summary
      }
    });
  } catch (error) {
    console.error('Get team attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get flagged attendance records
async function getFlaggedAttendance(req, res) {
  try {
    const { from, to } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Find all employees (no team restriction for managers/directors)
    const allEmployees = await User.find({
      role: 'employee',
      isActive: true
    });

    const allEmployeeIds = allEmployees.map(employee => employee._id);

    // Build date filter
    const filter = {
      userId: { $in: allEmployeeIds },
      flagged: true
    };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const flaggedRecords = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate('userId', 'empId name');

    res.json({
      success: true,
      data: {
        flaggedRecords,
        total: flaggedRecords.length
      }
    });
  } catch (error) {
    console.error('Get flagged attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Update attendance status for a team member
async function updateAttendanceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, approvalReason, checkOutTime } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate input
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Find the attendance record and populate user info
    const attendance = await Attendance.findById(id)
      .populate('userId', 'empId name');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Validate that the attendance record is flagged
    if (!attendance.flagged) {
      return res.status(400).json({
        success: false,
        message: 'Only flagged attendance records can be updated'
      });
    }

    // Store previous status for logging
    const previousStatus = attendance.status;

    // Update attendance status
    attendance.status = status;
    attendance.approvalReason = approvalReason || '';

    // If a checkOutTime is provided, update it
    if (checkOutTime) {
      // Create checkout datetime using the attendance date
      // Assume the checkout is on the same day as the attendance date
      attendance.checkOutTime = new Date(`${attendance.date.toISOString().split('T')[0]}T${checkOutTime}`);
      
      // Recalculate working hours when checkout time is updated
      if (attendance.checkInTime && attendance.checkOutTime) {
        const checkInTime = new Date(attendance.checkInTime);
        const checkOutTimeObj = new Date(attendance.checkOutTime);
        const diffMs = checkOutTimeObj - checkInTime;
        attendance.workingHours = Math.floor(diffMs / 60000); // Convert to minutes
        console.log('Working hours recalculated:', attendance.workingHours, 'minutes');
      }
    }

    // Unflag the attendance when manually approved/rejected
    attendance.flagged = false;
    attendance.flaggedReason = {};

    await attendance.save();

    res.json({
      success: true,
      message: `Attendance record updated from ${previousStatus} to ${status}`,
      data: {
        attendance
      }
    });
  } catch (error) {
    console.error('Update attendance status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get team members for a manager
async function getTeamMembers(req, res) {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get team query based on user role
    const teamQuery = getTeamQuery(userId, userRole);

    // Add projection for team members
    const teamMembers = await User.find(teamQuery).select('empId name email');

    res.json({
      success: true,
      data: {
        employees: teamMembers,
        total: teamMembers.length
      }
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get lightweight summary for manager dashboard
async function getManagerSummary(req, res) {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Calculate date range based on period
    const endDate = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
    }

    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    // Get team query based on user role
    const teamQuery = getTeamQuery(userId, userRole);

    // Find all employees based on role
    const teamMembers = await User.find(teamQuery);

    const teamMemberIds = teamMembers.map(member => member._id);

    // Get attendance stats for the period
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          userId: { $in: teamMemberIds },
          date: { $gte: startDateString, $lte: endDateString }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object
    const statsObject = {};
    let totalAttendanceRecords = 0;
    attendanceStats.forEach(stat => {
      statsObject[stat._id] = stat.count;
      totalAttendanceRecords += stat.count;
    });

    // Get leave counts for the period
    const leaveStats = await LeaveRequest.aggregate([
      {
        $match: {
          userId: { $in: teamMemberIds },
          startDate: { $gte: startDate, $lte: endDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ]);

    const leaveCounts = leaveStats.length > 0 ? leaveStats[0].total : 0;

    // Get working days (business days excluding weekends and holidays)
    const workingDays = await calculateWorkingDays(startDate, endDate);

    // Get simple attendance graph array (daily present count for last 30 days)
    const graphStartDate = new Date();
    graphStartDate.setDate(graphStartDate.getDate() - 30);
    const graphStartDateString = graphStartDate.toISOString().split('T')[0];

    const dailyAttendance = await Attendance.aggregate([
      {
        $match: {
          userId: { $in: teamMemberIds },
          date: { $gte: graphStartDateString, $lte: endDateString },
          status: 'present'
        }
      },
      {
        $group: {
          _id: '$date',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format the response
    res.json({
      success: true,
      data: {
        totalPresent: statsObject.present || 0,
        totalAbsent: statsObject.absent || 0,
        totalFlagged: statsObject.flagged || 0,
        leaveCounts,
        workingDays,
        attendanceGraph: dailyAttendance.map(item => ({
          date: item._id,
          present: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Get manager summary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Update employee (manager only)
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get team query based on user role to validate employee ownership
    const teamQuery = getTeamQuery(userId, userRole);

    // Validate that the employee belongs to this user's team
    const employee = await User.findOne({
      _id: id,
      ...teamQuery
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not under your management'
      });
    }

    // Prevent updating sensitive fields
    const { empId, role, managerId: newManagerId, password, ...safeUpdateData } = updateData;

    // Update employee
    const updatedEmployee = await User.findByIdAndUpdate(
      id,
      safeUpdateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        employee: updatedEmployee
      }
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Delete employee (manager only)
async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get team query based on user role to validate employee ownership
    const teamQuery = getTeamQuery(userId, userRole);

    // Validate that the employee belongs to this user's team
    const employee = await User.findOne({
      _id: id,
      ...teamQuery
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not under your management'
      });
    }

    // Set employee as inactive instead of deleting
    employee.isActive = false;
    await employee.save();

    res.json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Helper function to calculate working days
async function calculateWorkingDays(startDate, endDate) {
  // For simplicity, we'll calculate business days (Monday-Friday) minus holidays
  let workingDays = 0;
  const currentDate = new Date(startDate);

  // Get holidays for the period
  const holidays = await Holiday.find({
    date: { $gte: startDate, $lte: endDate }
  });

  const holidayDates = holidays.map(holiday => holiday.date.toISOString().split('T')[0]);

  // Count business days
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // Monday to Friday (1-5), excluding weekends (0, 6)
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      const dateString = currentDate.toISOString().split('T')[0];
      // Exclude holidays
      if (!holidayDates.includes(dateString)) {
        workingDays++;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

module.exports = {
  getTeamAttendance,
  getFlaggedAttendance,
  updateAttendanceStatus,
  getTeamMembers,
  getManagerSummary,
  updateEmployee,
  deleteEmployee
};