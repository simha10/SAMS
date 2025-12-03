const express = require('express');
const router = express.Router();
const { checkin, checkout, getMyAttendance, getTodayStatus } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

console.log("=== REGISTERING ATTENDANCE ROUTES ===");

// Add logging middleware for attendance routes
router.use((req, res, next) => {
  console.log("=== ATTENDANCE ROUTE REQUEST ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("IP:", req.ip);
  console.log("User:", req.user?.empId || 'Not authenticated');
  console.log("Timestamp:", new Date().toISOString());
  console.log("=== END ATTENDANCE ROUTE REQUEST ===");
  next();
});

// Protected routes
router.post('/checkin', protect, checkin);
router.post('/checkout', protect, checkout);

// Cached routes - 30 seconds TTL for attendance data
router.get('/me', protect, cacheMiddleware({
  ttl: 30,
  prefix: 'attendance',
  keyGenerator: (req) => `user:${req.user._id}:me:${req.query.from || ''}:${req.query.to || ''}`
}), getMyAttendance);

router.get('/today', protect, cacheMiddleware({
  ttl: 30,
  prefix: 'attendance',
  keyGenerator: (req) => `user:${req.user._id}:today`
}), getTodayStatus);

console.log("=== ATTENDANCE ROUTES REGISTERED ===");

module.exports = router;