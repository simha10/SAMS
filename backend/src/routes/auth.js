const express = require('express');
const router = express.Router();
const { login, logout, getProfile, register, updateProfile, changePassword, refresh } = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');

logger.info("=== REGISTERING AUTH ROUTES ===");

// Add logging middleware for auth routes
router.use((req, res, next) => {
  logger.debug("=== AUTH ROUTE REQUEST ===");
  logger.debug("Method:", { method: req.method });
  logger.debug("URL:", { url: req.url });
  logger.debug("IP:", { ip: req.ip });
  logger.debug("User:", { empId: req.user?.empId || 'Not authenticated' });
  logger.debug("Timestamp:", { timestamp: new Date().toISOString() });
  logger.debug("=== END AUTH ROUTE REQUEST ===");
  next();
});

// Public routes
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh); // Token refresh endpoint

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/register', protect, restrictTo('director'), register);

logger.info("=== AUTH ROUTES REGISTERED ===");

module.exports = router;