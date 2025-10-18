const express = require('express');
const router = express.Router();
const { checkin, checkout, getMyAttendance, getTodayStatus } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

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
router.get('/me', protect, getMyAttendance);
router.get('/today', protect, getTodayStatus);

console.log("=== ATTENDANCE ROUTES REGISTERED ===");

module.exports = router;