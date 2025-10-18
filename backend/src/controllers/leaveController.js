const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a leave request
async function createLeaveRequest(req, res) {
  try {
    const { startDate, endDate, reason, type, isHalfDay, halfDayType, 
            isHalfDayStart, isHalfDayEnd, halfDayTypeStart, halfDayTypeEnd } = req.body;
    const userId = req.user._id;
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format' 
      });
    }
    
    if (end < start) {
      return res.status(400).json({ 
        success: false, 
        message: 'End date must be after or equal to start date' 
      });
    }
    
    // Calculate number of days
    let days = 1;
    if (end > start) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    // Adjust for half-day leaves
    if (isHalfDay) {
      days = 0.5;
    } else if (isHalfDayStart || isHalfDayEnd) {
      // If either start or end is half-day, subtract 0.5 day
      if (isHalfDayStart) days -= 0.5;
      if (isHalfDayEnd) days -= 0.5;
    }
    
    // Prepare leave request object with only the fields that have values
    const leaveRequestData = {
      userId,
      startDate: start,
      endDate: end,
      reason,
      type,
      days
    };
    
    // Only add half-day fields if they have truthy values
    if (isHalfDay) {
      leaveRequestData.isHalfDay = true;
      if (halfDayType) leaveRequestData.halfDayType = halfDayType;
    } else {
      leaveRequestData.isHalfDay = false;
    }
    
    if (isHalfDayStart) {
      leaveRequestData.isHalfDayStart = true;
      if (halfDayTypeStart) leaveRequestData.halfDayTypeStart = halfDayTypeStart;
    } else {
      leaveRequestData.isHalfDayStart = false;
    }
    
    if (isHalfDayEnd) {
      leaveRequestData.isHalfDayEnd = true;
      if (halfDayTypeEnd) leaveRequestData.halfDayTypeEnd = halfDayTypeEnd;
    } else {
      leaveRequestData.isHalfDayEnd = false;
    }
    
    // Create leave request
    const leaveRequest = new LeaveRequest(leaveRequestData);
    
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
    res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
  }
}

// Get user's leave requests
async function getMyLeaveRequests(req, res) {
  try {
    const userId = req.user._id;
    
    const leaveRequests = await LeaveRequest.find({ userId })
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
    console.error('Get leave requests error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Cancel a leave request (only if pending)
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

// Get team leave requests (manager only)
async function getTeamLeaveRequests(req, res) {
  try {
    const userId = req.user._id;
    
    // Find all employees under this manager
    const teamMembers = await User.find({ managerId: userId });
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

// Update leave request status (manager only)
async function updateLeaveRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const managerId = req.user._id;
    
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
    
    // Check if user is under this manager
    if (leaveRequest.userId.managerId.toString() !== managerId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this leave request' 
      });
    }
    
    // Update leave request
    leaveRequest.status = status;
    leaveRequest.approvedBy = managerId;
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