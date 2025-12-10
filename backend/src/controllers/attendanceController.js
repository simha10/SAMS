const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Holiday = require('../models/Holiday');
const { haversine, isWithinOfficeHours, formatWorkingHours } = require('../utils/haversine');
const { findNearestBranch } = require('./branchController');
const mongoose = require('mongoose');

// Check if date is a Sunday
function isSunday(date) {
  return date.getDay() === 0;
}

// Check if time is within full attendance hours (12:01 AM to 11:59 PM)
function isWithinFullAttendanceHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 0 && hour < 24; // 12:01 AM to 11:59 PM
}

// Check if time is within clean attendance hours (9 AM to 7 PM)
function isWithinCleanHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 19; // 9 AM to 7 PM
}

// Check-in function
async function checkin(req, res) {
  try {
    const { lat, lng } = req.body;
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if today is a holiday or Sunday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isTodaySunday = isSunday(today);

    // Check for declared holidays
    const holiday = await Holiday.findOne({ date: today });
    const isDeclaredHoliday = !!holiday;

    // Check for recurring Sundays
    let isRecurringSunday = false;
    if (isTodaySunday) {
      const sundayHoliday = await Holiday.findOne({
        date: today,
        isRecurringSunday: true
      });
      isRecurringSunday = !!sundayHoliday;
    }

    const isHoliday = isDeclaredHoliday || isRecurringSunday || isTodaySunday;

    // Check if user already has a check-in for today
    let attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // If attendance record exists with check-in time, they're already checked in
    if (attendance && attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    // Find nearest branch
    const nearestBranchResult = await findNearestBranch(lat, lng);
    let branch = null;
    let distanceFromBranch = null;

    if (nearestBranchResult) {
      branch = nearestBranchResult.branch;
      distanceFromBranch = nearestBranchResult.distance;
    }

    // Check if within allowed radius of any branch
    const isWithinBranchRadius = !!nearestBranchResult;

    // Create or update attendance record
    if (!attendance) {
      // No attendance record exists, create a new one
      attendance = new Attendance({
        userId,
        date: new Date(new Date().toISOString().split('T')[0]), // Use date-only format to match daily job
        location: { checkIn: { lat, lng } },
        distanceFromOffice: { checkIn: distanceFromBranch },
        branch: branch ? branch._id : null,
        distanceFromBranch: distanceFromBranch
      });
    } else {
      // Attendance record exists (possibly marked as absent), update it
      attendance.location.checkIn = { lat, lng };
      attendance.distanceFromOffice.checkIn = distanceFromBranch;
      attendance.branch = branch ? branch._id : null;
      attendance.distanceFromBranch = distanceFromBranch;
      // Reset flagged status when user checks in (unless it's a holiday)
      if (!isHoliday) {
        attendance.flagged = false;
        attendance.flaggedReason = '';
      }
    }

    // Set check-in time
    attendance.checkInTime = new Date();

    // Check if within office hours
    const isWithinFullHours = isWithinFullAttendanceHours(new Date(attendance.checkInTime));
    const isWithinCleanAttendanceHours = isWithinCleanHours(new Date(attendance.checkInTime));

    // Determine status based on location, time, and holiday
    let status = 'present';
    let flagged = false;
    let flaggedReason = '';

    if (isTodaySunday) {
      // If it's Sunday, always flag the attendance
      status = 'present'; // Keep status as present
      flagged = true;
      flaggedReason = 'Working on Sunday - Awaiting manager approval';
    } else if (isHoliday) {
      // If it's a holiday, flag the attendance
      status = 'present'; // Keep status as present
      flagged = true;
      flaggedReason = 'Working on holiday - Awaiting manager approval';
    } else if (!isWithinBranchRadius) {
      status = 'outside-duty';  // Changed from 'absent' to 'outside-duty'
      flagged = true;
      flaggedReason = `Outside geofence - ${distanceFromBranch ? distanceFromBranch.toFixed(2) : 'unknown'} meters away from nearest office branch - Awaiting manager approval`;
      console.log('User is outside geofence during check-in, marking as outside-duty');
    } else if (!isWithinFullHours) {
      status = 'outside-duty';
      flagged = true;
      flaggedReason = 'Check-in outside allowed hours (12:01 AM - 11:59 PM)';
      console.log('User is outside full attendance hours during check-in, marking as outside-duty');
    } else if (!isWithinCleanAttendanceHours) {
      // Within full hours but outside clean hours - may be flagged depending on other factors
      console.log('User is within full hours but outside clean hours during check-in');
    } else {
      console.log('User is within geofence and office hours during check-in, marking as present');
    }

    attendance.status = status;
    attendance.flagged = flagged;
    attendance.flaggedReason = flaggedReason;

    await attendance.save();

    // Add holiday information to response if it's a holiday
    const responseData = {
      success: true,
      message: isHoliday ? 'Check-in successful (holiday attendance will be flagged for manager approval)' : 'Check-in successful',
      data: {
        checkInTime: attendance.checkInTime,
        distance: distanceFromBranch,
        status,
        flagged,
        flaggedReason,
        isHoliday,
        isSunday: isTodaySunday,
        holiday: holiday || null
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Check-out function
async function checkout(req, res) {
  try {
    const { lat, lng } = req.body;
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    // Find nearest branch
    const nearestBranchResult = await findNearestBranch(lat, lng);
    let branch = null;
    let distanceFromBranch = null;

    if (nearestBranchResult) {
      branch = nearestBranchResult.branch;
      distanceFromBranch = nearestBranchResult.distance;
    }

    // Update checkout information
    attendance.location.checkOut = { lat, lng };
    attendance.distanceFromOffice.checkOut = distanceFromBranch;
    attendance.checkOutTime = new Date();

    // Calculate working hours in minutes
    if (attendance.checkInTime) {
      const checkInTime = new Date(attendance.checkInTime);
      const checkOutTime = new Date(attendance.checkOutTime);
      const diffMs = checkOutTime - checkInTime;
      attendance.workingHours = Math.floor(diffMs / 60000); // Convert to minutes
      console.log('Working hours calculated:', attendance.workingHours, 'minutes');
    }

    // Check if within allowed radius
    const isWithinBranchRadius = !!nearestBranchResult;

    // Check if within office hours
    const isWithinFullHours = isWithinFullAttendanceHours(new Date(attendance.checkOutTime));
    const isWithinCleanAttendanceHours = isWithinCleanHours(new Date(attendance.checkOutTime));

    console.log('Checkout validation:', {
      isWithinBranchRadius,
      isWithinFullHours,
      isWithinCleanAttendanceHours,
      currentStatus: attendance.status,
      isFlagged: attendance.flagged
    });

    // Update status if needed
    console.log('Before status update:', {
      currentStatus: attendance.status,
      isFlagged: attendance.flagged,
      flaggedReason: attendance.flaggedReason,
      isWithinBranchRadius,
      isWithinFullHours,
      isWithinCleanAttendanceHours,
      workingHours: attendance.workingHours
    });

    // Handle the case where user was previously flagged as outside-duty due to geofence
    if (!isWithinBranchRadius) {
      // User is currently outside the geofence
      if (!attendance.flagged || attendance.status !== 'outside-duty' ||
        !attendance.flaggedReason || !attendance.flaggedReason.includes('geofence')) {
        // Only update if not already flagged for geofence issues
        attendance.status = 'outside-duty';
        attendance.flagged = true;
        attendance.flaggedReason = `Outside geofence - ${distanceFromBranch ? distanceFromBranch.toFixed(2) : 'unknown'} meters away from nearest office branch - Awaiting manager approval`;
        console.log('User is outside geofence, setting status to outside-duty');
      } else {
        console.log('User is outside geofence but already flagged for geofence issues');
      }
    } else {
      // User is currently within the geofence
      // Check if they were previously flagged for geofence issues and update accordingly
      if (attendance.flagged && attendance.status === 'outside-duty' &&
        attendance.flaggedReason && attendance.flaggedReason.includes('geofence')) {
        // User was previously outside but is now inside, update status to present
        attendance.status = 'present';
        attendance.flagged = false;
        attendance.flaggedReason = '';
        console.log('User was previously outside but is now inside, updating status to present');
      } else {
        console.log('User is inside geofence, keeping current status');
      }
      // If they were flagged for other reasons, keep that flag
    }

    // Check full attendance hours only if user is within geofence and not already flagged for geofence issues
    if (isWithinBranchRadius && !isWithinFullHours &&
      (!attendance.flagged || !attendance.flaggedReason || !attendance.flaggedReason.includes('geofence'))) {
      attendance.status = 'outside-duty';
      attendance.flagged = true;
      attendance.flaggedReason = 'Check-out outside allowed hours (12:01 AM - 11:59 PM)';
      console.log('User is within geofence but outside full attendance hours, setting status to outside-duty');
    }

    // Auto-mark as full-day or half-day based on working hours (5-hour rule)
    // If working hours > 5 hours = Full day (present), otherwise = Half day
    if (attendance.status === 'present' || attendance.status === 'outside-duty') {
      if (attendance.workingHours > 300) { // 5 hours = 300 minutes
        // Keep as present (full day) if not already outside-duty
        if (attendance.status !== 'outside-duty') {
          attendance.status = 'present';
        }
        console.log('Working hours > 5 hours, keeping as present (full day)');
      } else if (attendance.workingHours > 0) {
        // Mark as half-day
        attendance.status = 'half-day';
        attendance.isHalfDay = true;
        console.log('Working hours <= 5 hours, marking as half-day');
      }
    }

    console.log('After status update:', {
      updatedStatus: attendance.status,
      isFlagged: attendance.flagged,
      flaggedReason: attendance.flaggedReason,
      workingHours: attendance.workingHours
    });

    await attendance.save();

    res.json({
      success: true,
      message: 'Check-out successful',
      data: {
        checkOutTime: attendance.checkOutTime,
        distance: distanceFromBranch,
        workingHours: attendance.workingHours,
        formattedWorkingHours: formatWorkingHours(attendance.workingHours)
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get user's attendance records
async function getMyAttendance(req, res) {
  try {
    const { from, to } = req.query;
    const userId = req.user._id;

    // Build date filter
    const filter = { userId };
    if (from || to) {
      filter.date = {};
      if (from) {
        // Convert to date-only format to ensure consistency
        const fromDate = new Date(from);
        filter.date.$gte = new Date(fromDate.toISOString().split('T')[0]);
      }
      if (to) {
        // Convert to date-only format to ensure consistency
        const toDate = new Date(to);
        // Add one day to include the entire end date
        toDate.setDate(toDate.getDate() + 1);
        filter.date.$lte = new Date(toDate.toISOString().split('T')[0]);
      }
    }

    const attendance = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate('userId', 'empId name')
      .populate('branch', 'name location radius');

    res.json({
      success: true,
      data: {
        attendance,
        total: attendance.length
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get today's attendance status
async function getTodayStatus(req, res) {
  try {
    const userId = req.user._id;

    // Use date-only format to ensure consistency
    const today = new Date(new Date().toISOString().split('T')[0]);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('branch', 'name location radius');

    res.json({
      success: true,
      data: {
        date: today,
        attendance: attendance || null
      }
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  checkin,
  checkout,
  getMyAttendance,
  getTodayStatus
};