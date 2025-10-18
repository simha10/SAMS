const express = require('express');
const { 
  getInsights,
  getAllUsers,
  updateUser,
  exportAttendance
} = require('../controllers/adminController');
const { authMiddleware, adminOnly } = require('../middelwares/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// Analytics
router.get('/insights', getInsights);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

// Export
router.get('/export/attendance', exportAttendance);

module.exports = router;