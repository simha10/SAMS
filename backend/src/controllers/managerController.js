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

// Get recent activities
async function getRecentActivities(req, res) {
  try {
    const { period = '7' } = req.query; // Default to last 7 days
    const managerId = req.user._id;

    // Find all employees under this manager
    const teamMembers = await User.find({
      managerId: managerId,
      isActive: true
    });

    const teamMemberIds = teamMembers.map(member => member._id);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get recent attendance records (check-ins and check-outs)
    const recentAttendance = await Attendance.find({
      userId: { $in: teamMemberIds },
      $or: [
        { checkInTime: { $gte: startDate } },
        { checkOutTime: { $gte: startDate } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'empId name');

    // Transform attendance records into activities
    const activities = recentAttendance.map(record => {
      const activities = [];

      if (record.checkInTime && record.checkInTime >= startDate) {
        activities.push({
          id: `${record._id}-checkin`,
          userId: record.userId._id,
          userName: record.userId.name,
          userEmpId: record.userId.empId,
          action: 'checkin',
          timestamp: record.checkInTime,
          location: record.location?.checkIn || null
        });
      }

      if (record.checkOutTime && record.checkOutTime >= startDate) {
        activities.push({
          id: `${record._id}-checkout`,
          userId: record.userId._id,
          userName: record.userId.name,
          userEmpId: record.userId.empId,
          action: 'checkout',
          timestamp: record.checkOutTime,
          location: record.location?.checkOut || null
        });
      }

      return activities;
    }).flat();

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: {
        activities: activities.slice(0, 50), // Limit to 50 most recent
        total: activities.length
      }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
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

module.exports = {
  getTeamAttendance,
  getFlaggedAttendance,
  getRecentActivities,
  updateAttendanceStatus,
  getTeamMembers,  // Add this export
  createHoliday,   // Add holiday management exports
  getHolidays,
  updateHoliday,
  deleteHoliday
};