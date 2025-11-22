const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  jti: {
    type: String,
    required: true,
    unique: true
  },
  accessTokenId: {
    type: String,
    required: true,
    unique: true
  },
  refreshTokenId: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for optimized queries
sessionSchema.index({ userId: 1, deviceId: 1 });
sessionSchema.index({ deviceId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired sessions

// Method to deactivate session
sessionSchema.methods.deactivate = async function() {
  this.isActive = false;
  return await this.save();
};

// Static method to deactivate all user sessions on a device
sessionSchema.statics.deactivateDeviceSessions = async function(deviceId, excludeSessionId = null) {
  const query = { deviceId, isActive: true };
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }
  return await this.updateMany(query, { isActive: false });
};

// Static method to deactivate all user sessions
sessionSchema.statics.deactivateUserSessions = async function(userId, excludeSessionId = null) {
  const query = { userId, isActive: true };
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }
  return await this.updateMany(query, { isActive: false });
};

module.exports = mongoose.model('Session', sessionSchema);