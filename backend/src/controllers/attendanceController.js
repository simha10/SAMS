const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Holiday = require('../models/Holiday');
const Branch = require('../models/Branch');
const UnusualActionLog = require('../models/UnusualActionLog');
const { 
  haversine, 
  isWithinAttendanceWindow, 
  isWithinCoreOfficeHours,
  getOvertimeFlags,
  isLateCheckIn,
  isEarlyCheckOut,
  formatWorkingHours 
} = require('../utils/haversine');
const mongoose = require('mongoose');

// Branch cache with 15-minute TTL
let branchCache = {
  data: null,
  timestamp: null,
  ttl: 15 * 60 * 1000 // 15 minutes
};

/**
 * Get active branches (with caching)
 * @returns {Promise<Array>} Active branches
 */
async function getActiveBranchesWithCache() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (branchCache.data && branchCache.timestamp && (now - branchCache.timestamp) < branchCache.ttl) {
    console.log('Returning cached branches');
    return branchCache.data;
  }
  
  // Fetch fresh data
  console.log('Fetching fresh branch data from database');
  const branches = await Branch.getActiveBranches();
  
  // Update cache
  branchCache.data = branches;
  branchCache.timestamp = now;
  
  return branches;
}

/**
 * Find nearest branch within radius
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @param {Array} branches - List of branches
 * @returns {object|null} { branch, distance, isValid }
 */
function findNearestBranch(lat, lng, branches) {
  let nearestBranch = null;
  let minDistance = Infinity;
  
  for (const branch of branches) {
    const distance = haversine(lat, lng, branch.location.lat, branch.location.lng);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestBranch = {
        branch,
        distance,
        isValid: distance <= branch.location.radius
      };
    }
  }
  
  return nearestBranch;
}

// Check-in function with multi-branch geo-fencing and timing constraints
async function checkin(req, res) {
  try {
    const { lat, lng } = req.body;
    const userId = req.user._id;
    const deviceId = req.user.deviceId; // From auth middleware
    
    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required' 
      });
    }
    
    // Get user
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if today is a holiday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const holiday = await Holiday.findOne({ date: today }).lean();
    const isHoliday = !!holiday;
    
    // Check if within attendance window (9 AM - 8 PM)
    const checkInTime = new Date();
    if (!isWithinAttendanceWindow(checkInTime)) {
      // Log unusual action
      await UnusualActionLog.logAction({
        userId,
        actionType: 'ATTENDANCE_OUTSIDE_HOURS',
        deviceId,
        metadata: {
          checkInTime: checkInTime.toISOString(),
          lat,
          lng,
          message: 'Attempted check-in outside allowed hours (9 AM - 8 PM)'
        },
        severity: 'high'
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Check-in is only allowed between 9:00 AM and 8:00 PM' 
      });
    }
    
    // Check for existing attendance record today
    let attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // If attendance record exists with check-in time, log unusual action
    if (attendance && attendance.checkInTime) {
      await UnusualActionLog.logAction({
        userId,
        actionType: 'MULTIPLE_CHECKIN_ATTEMPTS',
        deviceId,
        attendanceId: attendance._id,
        metadata: {
          firstCheckIn: attendance.checkInTime,
          attemptedCheckIn: checkInTime.toISOString(),
          message: 'Multiple check-in attempts on same day'
        },
        severity: 'medium'
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Already checked in today' 
      });
    }
    
    // Get all active branches (cached)
    const branches = await getActiveBranchesWithCache();
    
    if (!branches || branches.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'No active branches configured. Please contact administrator.' 
      });
    }
    
    // Find nearest branch and validate geo-fence
    const nearestBranchResult = findNearestBranch(lat, lng, branches);
    
    if (!nearestBranchResult) {
      return res.status(500).json({ 
        success: false, 
        message: 'Unable to determine branch location' 
      });
    }
    
    const { branch, distance, isValid: isGeoValid } = nearestBranchResult;
    
    // Determine if check-in is late (after 10 AM core hours)
    const lateCheckIn = isLateCheckIn(checkInTime);
    const isWithinCore = isWithinCoreOfficeHours(checkInTime);
    
    // Initialize status and flags
    let status = 'present';
    let flagged = false;
    let flaggedReasons = [];
    
    // Check geo-fencing
    if (!isGeoValid) {
      status = 'outside-geo';
      flagged = true;
      flaggedReasons.push(`Outside all branch geofences (nearest: ${branch.name}, ${distance.toFixed(2)}m away, allowed: ${branch.location.radius}m)`);
      
      // Log unusual action
      await UnusualActionLog.logAction({
        userId,
        actionType: 'ATTENDANCE_OUTSIDE_ALL_BRANCHES',
        deviceId,
        metadata: {
          userLocation: { lat, lng },
          nearestBranch: {
            code: branch.code,
            name: branch.name,
            distance
          },
          message: 'Check-in attempted outside all branch geofences'
        },
        severity: 'critical'
      });
    }
    
    // Check if it's a holiday
    if (isHoliday) {
      flagged = true;
      flaggedReasons.push(`Working on holiday: ${holiday.name || 'Holiday'}`);
    }
    
    // Check if late check-in
    if (lateCheckIn.isLate && isGeoValid) {
      flagged = true;
      flaggedReasons.push(`Late check-in: ${lateCheckIn.minutesLate} minutes after 10:00 AM`);
      
      // Log late check-in
      await UnusualActionLog.logAction({
        userId,
        actionType: 'LATE_CHECKIN',
        deviceId,
        metadata: {
          checkInTime: checkInTime.toISOString(),
          minutesLate: lateCheckIn.minutesLate,
          branchCode: branch.code
        },
        severity: 'low'
      });
    }
    
    // Create or update attendance record
    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: new Date(new Date().toISOString().split('T')[0]),
        location: { checkIn: { lat, lng } },
        distanceFromOffice: { checkIn: distance }
      });
    } else {
      // Update existing absent record
      attendance.location.checkIn = { lat, lng };
      attendance.distanceFromOffice.checkIn = distance;
    }
    
    // Set check-in details
    attendance.checkInTime = checkInTime;
    attendance.branchId = branch._id;
    attendance.isGeoValid = isGeoValid;
    attendance.distanceFromBranch = distance;
    attendance.status = status;
    attendance.flagged = flagged;
    attendance.flaggedReason = flaggedReasons.join('; ');
    
    await attendance.save();
    
    // Prepare response
    res.json({
      success: true,
      message: flagged 
        ? 'Check-in successful but flagged for review' 
        : 'Check-in successful',
      data: {
        checkInTime: attendance.checkInTime,
        branch: {
          code: branch.code,
          name: branch.name
        },
        distance: parseFloat(distance.toFixed(2)),
        isGeoValid,
        status,
        flagged,
        flaggedReason: attendance.flaggedReason,
        isHoliday,
        isLate: lateCheckIn.isLate,
        minutesLate: lateCheckIn.minutesLate,
        holiday: holiday || null
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Check-out function with overtime tracking and timing validation
async function checkout(req, res) {
  try {
    const { lat, lng } = req.body;
    const userId = req.user._id;
    const deviceId = req.user.deviceId;
    
    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude are required' 
      });
    }
    
    // Get user
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if within attendance window (9 AM - 8 PM)
    const checkOutTime = new Date();
    if (!isWithinAttendanceWindow(checkOutTime)) {
      await UnusualActionLog.logAction({
        userId,
        actionType: 'ATTENDANCE_OUTSIDE_HOURS',
        deviceId,
        metadata: {
          checkOutTime: checkOutTime.toISOString(),
          lat,
          lng,
          message: 'Attempted check-out outside allowed hours (9 AM - 8 PM)'
        },
        severity: 'medium'
      });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Check-out is only allowed between 9:00 AM and 8:00 PM' 
      });
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
    
    if (!attendance.checkInTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot check out without checking in first' 
      });
    }
    
    if (attendance.checkOutTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already checked out today' 
      });
    }
    
    // Get all active branches (cached)
    const branches = await getActiveBranchesWithCache();
    
    if (!branches || branches.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'No active branches configured' 
      });
    }
    
    // Find nearest branch and validate geo-fence
    const nearestBranchResult = findNearestBranch(lat, lng, branches);
    
    if (!nearestBranchResult) {
      return res.status(500).json({ 
        success: false, 
        message: 'Unable to determine branch location' 
      });
    }
    
    const { branch, distance, isValid: isGeoValid } = nearestBranchResult;
    
    // Update checkout information
    attendance.location.checkOut = { lat, lng };
    attendance.distanceFromOffice.checkOut = distance;
    attendance.checkOutTime = checkOutTime;
    
    // Calculate working hours in minutes
    const checkInTime = new Date(attendance.checkInTime);
    const diffMs = checkOutTime - checkInTime;
    attendance.workingHours = Math.floor(diffMs / 60000); // Convert to minutes
    
    // Calculate overtime flags
    const overtimeData = getOvertimeFlags(checkInTime, checkOutTime);
    attendance.overtimeMinutes = overtimeData.overtimeMinutes;
    
    // Check if early checkout (before 6 PM)
    const earlyCheckOut = isEarlyCheckOut(checkOutTime);
    
    // Determine final status based on geo-validation and working hours
    let flaggedReasons = attendance.flaggedReason ? [attendance.flaggedReason] : [];
    
    // Handle geo-validation for checkout
    if (!isGeoValid && attendance.isGeoValid) {
      // User checked in valid location but checking out from invalid location
      flaggedReasons.push(`Check-out outside geofence (${distance.toFixed(2)}m from ${branch.name})`);
      attendance.flagged = true;
    }
    
    // Check for early checkout
    if (earlyCheckOut.isEarly && attendance.isGeoValid) {
      flaggedReasons.push(`Early check-out: ${earlyCheckOut.minutesEarly} minutes before 6:00 PM`);
      attendance.flagged = true;
      
      // Log early checkout
      await UnusualActionLog.logAction({
        userId,
        actionType: 'EARLY_CHECKOUT',
        deviceId,
        attendanceId: attendance._id,
        metadata: {
          checkOutTime: checkOutTime.toISOString(),
          minutesEarly: earlyCheckOut.minutesEarly,
          branchCode: branch.code
        },
        severity: 'low'
      });
    }
    
    // Determine status based on working hours and geo-validity
    if (attendance.status === 'outside-geo') {
      // Keep as outside-geo if checked in outside geofence
      attendance.status = 'outside-geo';
    } else if (attendance.workingHours >= 300) {
      // 5 hours or more = full day
      attendance.status = 'present';
      attendance.isHalfDay = false;
    } else if (attendance.workingHours > 0) {
      // Less than 5 hours = half day
      attendance.status = 'half-day';
      attendance.isHalfDay = true;
      attendance.halfDayType = checkInTime.getHours() < 13 ? 'morning' : 'afternoon';
    } else {
      // No working hours (shouldn't happen normally)
      attendance.status = 'absent';
    }
    
    // Update flagged reason if any
    if (flaggedReasons.length > 0) {
      attendance.flaggedReason = flaggedReasons.join('; ');
    }
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Check-out successful',
      data: {
        checkOutTime: attendance.checkOutTime,
        branch: {
          code: branch.code,
          name: branch.name
        },
        distance: parseFloat(distance.toFixed(2)),
        isGeoValid,
        workingHours: attendance.workingHours,
        formattedWorkingHours: formatWorkingHours(attendance.workingHours),
        status: attendance.status,
        isHalfDay: attendance.isHalfDay,
        overtime: {
          earlyArrival: overtimeData.earlyArrival,
          lateStay: overtimeData.lateStay,
          totalMinutes: overtimeData.overtimeMinutes,
          details: overtimeData.details
        },
        flagged: attendance.flagged,
        flaggedReason: attendance.flaggedReason
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get user's attendance records (optimized with lean and projection)
async function getMyAttendance(req, res) {
  try {
    const { from, to, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;
    
    // Build date filter
    const filter = { userId };
    if (from || to) {
      filter.date = {};
      if (from) {
        const fromDate = new Date(from);
        filter.date.$gte = new Date(fromDate.toISOString().split('T')[0]);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        filter.date.$lte = new Date(toDate.toISOString().split('T')[0]);
      }
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Fetch attendance records with lean() for performance
    const attendance = await Attendance.find(filter)
      .select('date checkInTime checkOutTime status workingHours branchId isGeoValid distanceFromBranch overtimeMinutes flagged flaggedReason isHalfDay')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('branchId', 'code name')
      .lean();
    
    // Get total count for pagination
    const total = await Attendance.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get today's attendance status (optimized with lean)
async function getTodayStatus(req, res) {
  try {
    const userId = req.user._id;
    
    const today = new Date(new Date().toISOString().split('T')[0]);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .select('date checkInTime checkOutTime status workingHours branchId isGeoValid distanceFromBranch overtimeMinutes flagged flaggedReason isHalfDay')
    .populate('branchId', 'code name')
    .lean();
    
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