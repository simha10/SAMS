const Attendance = require('../models/Attendance');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday'); // Added Holiday model
const { haversine } = require('../utils/haversine');

// Get team attendance for a specific date
async function getTeamAttendance(req, res) {
  try {
    const { date } = req.query;
    const managerId = req.user._id;

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

    // Find all employees under this manager
    const teamMembers = await User.find({
      managerId: managerId,
      isActive: true
    });

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
          email: employee.email
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
    const managerId = req.user._id;

    // Find all employees under this manager
    const teamMembers = await User.find({
      managerId: managerId,
      isActive: true
    });

    const teamMemberIds = teamMembers.map(member => member._id);

    // Build date filter
    const filter = {
      userId: { $in: teamMemberIds },
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

// Get team members for a manager
async function getTeamMembers(req, res) {
  try {
    const managerId = req.user._id;

    // Find all employees under this manager
    const teamMembers = await User.find({
      managerId: managerId,
      isActive: true,
      role: 'employee'
    }).select('empId name email');

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

// Create a new holiday (manager only)
async function createHoliday(req, res) {
  try {
    const { date, name, description, isRecurringSunday } = req.body;
    const createdBy = req.user._id;

    // Validate input
    if (!date || !name) {
      return res.status(400).json({
        success: false,
        message: 'Date and name are required'
      });
    }

    // Check if holiday already exists for this date
    const existingHoliday = await Holiday.findOne({ date: new Date(date) });
    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        message: 'Holiday already exists for this date'
      });
    }

    // Create new holiday
    const holiday = new Holiday({
      date: new Date(date),
      name,
      description,
      isRecurringSunday: isRecurringSunday || false,
      createdBy
    });

    await holiday.save();

    // Populate creator info
    await holiday.populate('createdBy', 'empId name');

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: {
        holiday
      }
    });
  } catch (error) {
    console.error('Create holiday error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get all holidays
async function getHolidays(req, res) {
  try {
    const { year, month } = req.query;

    // Build filter
    const filter = {};

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      filter.date = { $gte: startOfYear, $lte: endOfYear };
    }

    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const holidays = await Holiday.find(filter)
      .sort({ date: 1 })
      .populate('createdBy', 'empId name');

    res.json({
      success: true,
      data: {
        holidays,
        total: holidays.length
      }
    });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Update holiday
async function updateHoliday(req, res) {
  try {
    const { id } = req.params;
    const { date, name, description, isRecurringSunday } = req.body;

    // Validate input
    if (!date || !name) {
      return res.status(400).json({
        success: false,
        message: 'Date and name are required'
      });
    }

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    // Check if another holiday already exists for this date
    const existingHoliday = await Holiday.findOne({
      date: new Date(date),
      _id: { $ne: id } // Exclude current holiday
    });

    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        message: 'Holiday already exists for this date'
      });
    }

    // Update holiday
    holiday.date = new Date(date);
    holiday.name = name;
    holiday.description = description;
    if (isRecurringSunday !== undefined) {
      holiday.isRecurringSunday = isRecurringSunday;
    }

    await holiday.save();

    // Populate creator info
    await holiday.populate('createdBy', 'empId name');

    res.json({
      success: true,
      message: 'Holiday updated successfully',
      data: {
        holiday
      }
    });
  } catch (error) {
    console.error('Update holiday error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Delete holiday
async function deleteHoliday(req, res) {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    await Holiday.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Update attendance status (manager only)
async function updateAttendanceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, approvalReason, checkOutTime } = req.body;
    const managerId = req.user._id;

    // Validate status
    const validStatuses = ['present', 'absent', 'half-day', 'outside-duty'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find the attendance record
    const attendance = await Attendance.findById(id)
      .populate('userId', 'empId name managerId');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if user is under this manager
    if (attendance.userId.managerId.toString() !== managerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this attendance record'
      });
    }

    // Update attendance record
    attendance.status = status;
    attendance.flagged = false; // Unflag after approval

    // If checkout time is provided, update it
    if (checkOutTime) {
      attendance.checkOutTime = new Date(checkOutTime);

      // Recalculate working hours if both check-in and check-out times exist
      if (attendance.checkInTime && attendance.checkOutTime) {
        const checkInTime = new Date(attendance.checkInTime);
        const checkoutTime = new Date(attendance.checkOutTime);
        const diffMs = checkoutTime - checkInTime;
        attendance.workingHours = Math.floor(diffMs / 60000); // Convert to minutes
      }
    }

    if (approvalReason) {
      attendance.flaggedReason = `Approved as ${status}: ${approvalReason}`;
    } else {
      attendance.flaggedReason = `Approved as ${status}`;
    }

    await attendance.save();

    // Populate user info
    await attendance.populate('userId', 'empId name');

    res.json({
      success: true,
      message: `Attendance record updated to ${status} successfully`,
      data: {
        attendance
      }
    });
  } catch (error) {
    console.error('Update attendance status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get lightweight summary for manager dashboard
async function getManagerSummary(req, res) {
  try {
    const { period = 'month' } = req.query;
    const managerId = req.user._id;

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

    // Find all employees under this manager
    const teamMembers = await User.find({
      managerId: managerId,
      isActive: true
    });

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
    const workingDays = await calculateWorkingDays(startDate, endDate, managerId);

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

// Helper function to calculate working days
async function calculateWorkingDays(startDate, endDate, managerId) {
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

// Update employee (manager only)
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const managerId = req.user._id;

    // Validate that the employee belongs to this manager
    const employee = await User.findOne({
      _id: id,
      managerId: managerId,
      role: 'employee'
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
    const managerId = req.user._id;

    // Validate that the employee belongs to this manager
    const employee = await User.findOne({
      _id: id,
      managerId: managerId,
      role: 'employee'
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

module.exports = {
  getTeamAttendance,
  getFlaggedAttendance,
  updateAttendanceStatus,
  getTeamMembers,
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
  getManagerSummary,
  updateEmployee,
  deleteEmployee
};