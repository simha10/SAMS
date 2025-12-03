const express = require('express');
const router = express.Router();
const {
  getTeamAttendance,
  getFlaggedAttendance,
  updateAttendanceStatus,
  getTeamMembers,
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
  getManagerSummary
} = require('../controllers/managerController');
const { getTeamLeaveRequests, updateLeaveRequest } = require('../controllers/leaveController');
const { protect, restrictTo } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

// Manager routes with caching for read-heavy endpoints
// Team attendance - cached for 30 seconds
router.get('/team/attendance', protect, restrictTo('manager', 'director'), cacheMiddleware({
  ttl: 30,
  prefix: 'manager',
  keyGenerator: (req) => `team:${req.user._id}:attendance:${req.query.date || 'today'}`
}), getTeamAttendance);

// Flagged attendance - cached for 60 seconds
router.get('/team/flagged', protect, restrictTo('manager', 'director'), cacheMiddleware({
  ttl: 60,
  prefix: 'manager',
  keyGenerator: (req) => `team:${req.user._id}:flagged:${req.query.from || ''}:${req.query.to || ''}`
}), getFlaggedAttendance);

// Team leaves - cached for 30 seconds
router.get('/team/leaves', protect, restrictTo('manager', 'director'), cacheMiddleware({
  ttl: 30,
  prefix: 'manager',
  keyGenerator: (req) => `team:${req.user._id}:leaves`
}), getTeamLeaveRequests);

// Team members - cached for 5 minutes (less frequent updates)
router.get('/team/members', protect, restrictTo('manager', 'director'), cacheMiddleware({
  ttl: 300,
  prefix: 'manager',
  keyGenerator: (req) => `team:${req.user._id}:members`
}), getTeamMembers);

// Lightweight summary - cached for 30 seconds
router.get('/summary', protect, restrictTo('manager', 'director'), cacheMiddleware({
  ttl: 30,
  prefix: 'manager',
  keyGenerator: (req) => `team:${req.user._id}:summary:${req.query.period || 'month'}`
}), getManagerSummary);

// Write operations (no caching)
router.put('/leaves/:id', protect, restrictTo('manager', 'director'), updateLeaveRequest);
router.put('/attendance/:id', protect, restrictTo('manager', 'director'), updateAttendanceStatus);

// Holiday management routes (less frequent, no caching for now)
router.post('/holidays', protect, restrictTo('manager', 'director'), createHoliday);
router.get('/holidays', protect, restrictTo('manager', 'director'), getHolidays);
router.put('/holidays/:id', protect, restrictTo('manager', 'director'), updateHoliday);
router.delete('/holidays/:id', protect, restrictTo('manager', 'director'), deleteHoliday);

module.exports = router;