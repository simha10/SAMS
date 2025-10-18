const express = require('express');
const { 
  getNotifications,
  markAsRead
} = require('../controllers/notificationsController');
const { authMiddleware } = require('../middelwares/auth');

const router = express.Router();

// All notifications routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markAsRead);

module.exports = router;