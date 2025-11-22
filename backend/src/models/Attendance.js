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
    enum: ['present', 'absent', 'half-day', 'on-leave', 'outside-duty', 'outside-geo'],
    default: 'absent'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  isGeoValid: {
    type: Boolean,
    default: false
  },
  distanceFromBranch: {
    type: Number,
    default: null
  },
  overtimeMinutes: {
    type: Number,
    default: 0
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
    type: String
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['morning', 'afternoon']
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, branchId: 1 });
attendanceSchema.index({ flagged: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ userId: 1, status: 1 });
attendanceSchema.index({ date: -1 }); // For recent attendance queries

module.exports = mongoose.model('Attendance', attendanceSchema);