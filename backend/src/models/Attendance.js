const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  location: {
    checkIn: {
      lat: Number,
      lng: Number
    },
    checkOut: {
      lat: Number,
      lng: Number
    }
  },
  distanceFromOffice: {
    checkIn: Number,
    checkOut: Number
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'on-leave', 'outside-duty', 'flagged'],
    default: 'absent'
  },
  workingHours: {
    type: Number,
    default: 0
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flaggedReason: {
    type: {
      type: String,
      enum: ['location_breach', 'late_checkin', 'early_checkout', 'other']
    },
    distance: Number,
    message: String
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['morning', 'afternoon']
  },
  // Multi-branch support
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  distanceFromBranch: {
    type: Number
  }
}, {
  timestamps: true
});

// Index for faster queries - explicitly set unique to false
attendanceSchema.index({ userId: 1, date: 1 }, { unique: false });
attendanceSchema.index({ branch: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);