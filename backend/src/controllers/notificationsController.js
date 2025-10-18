const NotificationLog = require('../models/NotificationLog');
const notificationService = require('../services/notificationService');
const logger = require('../config/logger');

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const notifications = await notificationService.getNotifications(
      req.user._id,
      parseInt(limit),
      parseInt(skip)
    );
    
    res.json({
      success: true,
      data: {
        notifications,
        total: notifications.length
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await NotificationLog.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if notification belongs to user
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};