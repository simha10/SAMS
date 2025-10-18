const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['attendance_flag', 'daily_summary', 'leave_request', 'system'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  channel: {
    type: String,
    enum: ['telegram', 'email', 'in-app'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// TTL index to auto-delete old notifications (90 days)
notificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
notificationLogSchema.index({ recipientId: 1, createdAt: -1 });
notificationLogSchema.index({ type: 1 });
notificationLogSchema.index({ status: 1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);