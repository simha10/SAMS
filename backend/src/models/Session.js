const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['checkin', 'checkout'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    lat: Number,
    lng: Number
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for efficient queries
sessionSchema.index({ userId: 1, timestamp: -1 });
sessionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Session', sessionSchema);