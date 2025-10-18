const express = require('express');
const router = express.Router();
const { login, logout, getProfile, register } = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');

console.log("=== REGISTERING AUTH ROUTES ===");

// Add logging middleware for auth routes
router.use((req, res, next) => {
  console.log("=== AUTH ROUTE REQUEST ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("IP:", req.ip);
  console.log("User:", req.user?.empId || 'Not authenticated');
  console.log("Timestamp:", new Date().toISOString());
  console.log("=== END AUTH ROUTE REQUEST ===");
  next();
});

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/register', protect, restrictTo('director'), register);

console.log("=== AUTH ROUTES REGISTERED ===");

module.exports = router;