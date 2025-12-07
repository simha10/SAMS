const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');

// Create a new leave request
async function createLeaveRequest(req, res) {
  try {
    const { startDate, endDate, reason, type, isHalfDay, halfDayType, isHalfDayStart, isHalfDayEnd, halfDayTypeStart, halfDayTypeEnd } = req.body;
    const userId = req.user._id;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    // Calculate number of days
    let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Adjust for half days
    if (isHalfDay) {
      days = 0.5;
    } else if (isHalfDayStart || isHalfDayEnd) {
      if (isHalfDayStart && isHalfDayEnd) {
        days = days - 1; // Two half days = one full day deduction
      } else {
        days = days - 0.5; // One half day = half day deduction
      }
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      userId,
      startDate: start,
      endDate: end,
      reason,
      type,
      days,
      isHalfDay,
      halfDayType,
      isHalfDayStart,
      isHalfDayEnd,
      halfDayTypeStart,
      halfDayTypeEnd
    });

    await leaveRequest.save();

    // Populate user info
    await leaveRequest.populate('userId', 'empId name');

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: {
        leaveRequest
      }
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get my leave requests
async function getMyLeaveRequests(req, res) {
  try {
    const userId = req.user._id;

    const leaveRequests = await LeaveRequest.find({ userId })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'empId name');

    res.json({
      success: true,
      data: {
        leaveRequests,
        total: leaveRequests.length
      }
    });
  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Cancel leave request
async function cancelLeaveRequest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const leaveRequest = await LeaveRequest.findOne({ _id: id, userId });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be cancelled'
      });
    }

    await LeaveRequest.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Leave request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get team leave requests (manager/director)
async function getTeamLeaveRequests(req, res) {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

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

    // Get team query based on user role
    const teamQuery = getTeamQuery(userId, userRole);

    // Find all employees based on role
    const teamMembers = await User.find(teamQuery);
    const teamMemberIds = teamMembers.map(member => member._id);

    const leaveRequests = await LeaveRequest.find({
      userId: { $in: teamMemberIds }
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'empId name')
      .populate('approvedBy', 'empId name');

    res.json({
      success: true,
      data: {
        leaveRequests,
        total: leaveRequests.length
      }
    });
  } catch (error) {
    console.error('Get team leave requests error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Update leave request status (manager/director)
async function updateLeaveRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    // Find the leave request
    const leaveRequest = await LeaveRequest.findById(id)
      .populate('userId', 'empId name managerId');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

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

    // Get team query based on user role
    const teamQuery = getTeamQuery(userId, userRole);

    // Check if user is under this manager/director
    const employee = await User.findOne({
      _id: leaveRequest.userId._id,
      ...teamQuery
    });

    if (!employee) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this leave request'
      });
    }

    // Update leave request
    leaveRequest.status = status;
    leaveRequest.approvedBy = userId;
    leaveRequest.approvedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      leaveRequest.rejectionReason = rejectionReason;
    }

    await leaveRequest.save();

    // Populate user info
    await leaveRequest.populate('userId', 'empId name');
    await leaveRequest.populate('approvedBy', 'empId name');

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: {
        leaveRequest
      }
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getTeamLeaveRequests,
  updateLeaveRequest
};