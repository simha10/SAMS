const express = require('express');
const router = express.Router();
const {
    generateDetailedAttendanceReport
} = require('../controllers/detailedReportController');
const { protect } = require('../middleware/auth');

console.log("=== REGISTERING DETAILED REPORT ROUTES ===");

// Add logging middleware for detailed report routes
router.use((req, res, next) => {
    console.log("=== DETAILED REPORT ROUTE REQUEST ===");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("IP:", req.ip);
    console.log("User:", req.user?.empId || 'Not authenticated');
    console.log("Timestamp:", new Date().toISOString());
    console.log("=== END DETAILED REPORT ROUTE REQUEST ===");
    next();
});

// Protected routes
router.post('/attendance/detailed', protect, generateDetailedAttendanceReport);

console.log("=== DETAILED REPORT ROUTES REGISTERED ===");

module.exports = router;