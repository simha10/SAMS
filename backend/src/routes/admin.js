const express = require('express');
const { 
  getInsights,
  getAllUsers,
  updateUser,
  exportAttendance
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and director role
router.use(protect);
router.use(restrictTo('director'));

// Analytics
router.get('/insights', getInsights);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

// Export
router.get('/export/attendance', exportAttendance);

module.exports = router;