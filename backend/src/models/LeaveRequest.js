const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['sick', 'personal', 'vacation', 'emergency'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  days: {
    type: Number, // Allow decimal values like 6.5
    required: true
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['morning', 'afternoon']
  },
  isHalfDayStart: {
    type: Boolean,
    default: false
  },
  isHalfDayEnd: {
    type: Boolean,
    default: false
  },
  halfDayTypeStart: {
    type: String,
    enum: ['morning', 'afternoon']
  },
  halfDayTypeEnd: {
    type: String,
    enum: ['morning', 'afternoon']
  }
}, {
  timestamps: true
});

// Custom validation for half-day fields
leaveRequestSchema.pre('validate', function(next) {
  // If isHalfDay is true, halfDayType is required
  if (this.isHalfDay && !this.halfDayType) {
    next(new Error('halfDayType is required when isHalfDay is true'));
    return;
  }
  
  // If isHalfDayStart is true, halfDayTypeStart is required
  if (this.isHalfDayStart && !this.halfDayTypeStart) {
    next(new Error('halfDayTypeStart is required when isHalfDayStart is true'));
    return;
  }
  
  // If isHalfDayEnd is true, halfDayTypeEnd is required
  if (this.isHalfDayEnd && !this.halfDayTypeEnd) {
    next(new Error('halfDayTypeEnd is required when isHalfDayEnd is true'));
    return;
  }
  
  next();
});

// Index for faster queries
leaveRequestSchema.index({ userId: 1, startDate: 1 });
leaveRequestSchema.index({ status: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);