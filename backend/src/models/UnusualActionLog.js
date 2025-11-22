const mongoose = require('mongoose');

const unusualActionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: [
      'MULTI_USER_DEVICE',           // Different user on same device
      'RELOGIN_AFTER_LOGOUT',        // User re-logged in after logout
      'ATTENDANCE_OUTSIDE_ALL_BRANCHES', // Check-in outside all branch geofences
      'ATTENDANCE_OUTSIDE_HOURS',    // Check-in outside allowed hours (9 AM - 8 PM)
      'LATE_CHECKIN',                // Check-in after core hours (after 10 AM)
      'EARLY_CHECKOUT',              // Check-out before core hours (before 6 PM)
      'MULTIPLE_CHECKIN_ATTEMPTS',   // Multiple check-in attempts on same day
      'SUSPICIOUS_LOCATION',         // Suspicious location pattern
      'TOKEN_REFRESH_ANOMALY'        // Unusual token refresh pattern
    ],
    required: true
  },
  deviceId: {
    type: String
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for optimized queries
unusualActionLogSchema.index({ userId: 1, createdAt: -1 });
unusualActionLogSchema.index({ actionType: 1, createdAt: -1 });
unusualActionLogSchema.index({ severity: 1, isResolved: 1 });
unusualActionLogSchema.index({ createdAt: -1 }); // For recent logs

// Static method to log unusual action
unusualActionLogSchema.statics.logAction = async function(data) {
  const { userId, actionType, deviceId, sessionId, attendanceId, metadata, severity } = data;
  
  return await this.create({
    userId,
    actionType,
    deviceId,
    sessionId,
    attendanceId,
    metadata: metadata || {},
    severity: severity || 'medium'
  });
};

// Method to resolve log
unusualActionLogSchema.methods.resolve = async function(resolvedBy, notes) {
  this.isResolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.notes = notes;
  return await this.save();
};

module.exports = mongoose.model('UnusualActionLog', unusualActionLogSchema);
