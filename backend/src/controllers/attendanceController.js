const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { haversine, isWithinOfficeHours, formatWorkingHours } = require('../utils/haversine');
const mongoose = require('mongoose');

// Check-in function
async function checkin(req, res) {
  try {
    const { lat, lng } = req.body;
    const userId = req.user._id;
    
    // Get user with office location
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('User office location:', user.officeLocation);
    
    // Check if user already has a check-in for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // If attendance record exists, check if already checked in
    if (attendance && attendance.checkInTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already checked in today' 
      });
    }
    
    // Calculate distance from office
    const distance = haversine(
      lat, 
      lng, 
      user.officeLocation.lat, 
      user.officeLocation.lng
    );
    
    console.log('Geofence check:', {
      userLat: lat,
      userLng: lng,
      officeLat: user.officeLocation.lat,
      officeLng: user.officeLocation.lng,
      calculatedDistance: distance,
      allowedRadius: user.officeLocation.radius,
      isWithinRadius: distance <= user.officeLocation.radius
    });
    
    // Check if within allowed radius
    const isWithinRadius = distance <= user.officeLocation.radius;
    
    // Create or update attendance record
    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: new Date(new Date().toISOString().split('T')[0]), // Use date-only format to match daily job
        location: { checkIn: { lat, lng } },
        distanceFromOffice: { checkIn: distance }
      });
    } else {
      attendance.location.checkIn = { lat, lng };
      attendance.distanceFromOffice.checkIn = distance;
    }
    
    // Set check-in time
    attendance.checkInTime = new Date();
    
    // Check if within office hours
    const isWithinHours = isWithinOfficeHours(new Date(attendance.checkInTime));
    
    // Determine status based on location and time
    let status = 'present';
    let flagged = false;
    let flaggedReason = '';
    
    if (!isWithinRadius) {
      status = 'outside-duty';  // Changed from 'absent' to 'outside-duty'
      flagged = true;
      flaggedReason = `Outside allowed radius (${distance.toFixed(2)}m from office, allowed ${user.officeLocation.radius}m) - Awaiting manager approval`;
      console.log('User is outside geofence during check-in, marking as outside-duty');
    } else if (!isWithinHours) {
      status = 'outside-duty';
      flagged = true;
      flaggedReason = 'Check-in outside office hours';
      console.log('User is outside office hours during check-in, marking as outside-duty');
    } else {
      console.log('User is within geofence and office hours during check-in, marking as present');
    }
    
    attendance.status = status;
    attendance.flagged = flagged;
    attendance.flaggedReason = flaggedReason;
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Check-in successful',
      data: {
        checkInTime: attendance.checkInTime,
        distance,
        status,
        flagged,
        flaggedReason
      }
    });
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
    
    // Get user with office location
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('User office location (checkout):', user.officeLocation);
    
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
    
    // Calculate distance from office
    const distance = haversine(
      lat, 
      lng, 
      user.officeLocation.lat, 
      user.officeLocation.lng
    );
    
    console.log('Geofence check (checkout):', {
      userLat: lat,
      userLng: lng,
      officeLat: user.officeLocation.lat,
      officeLng: user.officeLocation.lng,
      calculatedDistance: distance,
      allowedRadius: user.officeLocation.radius,
      isWithinRadius: distance <= user.officeLocation.radius
    });
    
    // Update checkout information
    attendance.location.checkOut = { lat, lng };
    attendance.distanceFromOffice.checkOut = distance;
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
    const isWithinRadius = distance <= user.officeLocation.radius;
    
    // Check if within office hours
    const isWithinHours = isWithinOfficeHours(new Date(attendance.checkOutTime));
    
    console.log('Checkout validation:', {
      isWithinRadius,
      isWithinHours,
      currentStatus: attendance.status,
      isFlagged: attendance.flagged
    });
    
    // Update status if needed
    console.log('Before status update:', {
      currentStatus: attendance.status,
      isFlagged: attendance.flagged,
      flaggedReason: attendance.flaggedReason,
      isWithinRadius,
      isWithinHours,
      workingHours: attendance.workingHours
    });
    
    // Handle the case where user was previously flagged as outside-duty due to geofence
    if (!isWithinRadius) {
      // User is currently outside the geofence
      if (!attendance.flagged || attendance.status !== 'outside-duty' || 
          !attendance.flaggedReason || !attendance.flaggedReason.includes('radius')) {
        // Only update if not already flagged for geofence issues
        attendance.status = 'outside-duty';
        attendance.flagged = true;
        attendance.flaggedReason = `Outside allowed radius at checkout (${distance.toFixed(2)}m from office, allowed ${user.officeLocation.radius}m) - Awaiting manager approval`;
        console.log('User is outside geofence, setting status to outside-duty');
      } else {
        console.log('User is outside geofence but already flagged for geofence issues');
      }
    } else {
      // User is currently within the geofence
      // Check if they were previously flagged for geofence issues and update accordingly
      if (attendance.flagged && attendance.status === 'outside-duty' && 
          attendance.flaggedReason && attendance.flaggedReason.includes('radius')) {
        // User was previously outside but is now inside, update status to present
        attendance.status = 'present';
        attendance.flagged = false;
        attendance.flaggedReason = '';
        console.log('User was previously outside but is now inside, updating status to present');
      } else {
        console.log('User is inside geofence, keeping current status');
      }
      // If they were flagged for other reasons (like office hours), keep that flag
    }
    
    // Check office hours only if user is within geofence and not already flagged for geofence issues
    if (isWithinRadius && !isWithinHours && 
        (!attendance.flagged || !attendance.flaggedReason || !attendance.flaggedReason.includes('radius'))) {
      attendance.status = 'outside-duty';
      attendance.flagged = true;
      attendance.flaggedReason = 'Check-out outside office hours';
      console.log('User is within geofence but outside office hours, setting status to outside-duty');
    }
    
    // Auto-mark as full-day or half-day based on working hours
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
        distance,
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
      .populate('userId', 'empId name');
    
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
    });
    
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