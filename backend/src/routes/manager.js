const express = require('express');
const router = express.Router();
const { 
  getTeamAttendance, 
  getFlaggedAttendance, 
  getRecentActivities, 
  updateAttendanceStatus, 
  getTeamMembers,
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday
} = require('../controllers/managerController');
const { protect, restrictTo } = require('../middleware/auth');
const { getTeamLeaveRequests, updateLeaveRequest } = require('../controllers/leaveController');

// Manager routes
router.get('/team/attendance', protect, restrictTo('manager', 'director'), getTeamAttendance);
router.get('/team/flagged', protect, restrictTo('manager', 'director'), getFlaggedAttendance);
router.get('/team/activities', protect, restrictTo('manager', 'director'), getRecentActivities);
router.get('/team/leaves', protect, restrictTo('manager', 'director'), getTeamLeaveRequests);
router.get('/team/members', protect, restrictTo('manager', 'director'), getTeamMembers); // Add this route
router.put('/leaves/:id', protect, restrictTo('manager', 'director'), updateLeaveRequest);
router.put('/attendance/:id', protect, restrictTo('manager', 'director'), updateAttendanceStatus);

// Holiday management routes
router.post('/holidays', protect, restrictTo('manager', 'director'), createHoliday);
router.get('/holidays', protect, restrictTo('manager', 'director'), getHolidays);
router.put('/holidays/:id', protect, restrictTo('manager', 'director'), updateHoliday);
router.delete('/holidays/:id', protect, restrictTo('manager', 'director'), deleteHoliday);

module.exports = router;