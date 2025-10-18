const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['attendance', 'summary', 'leave', 'combined'],
    required: true
  },
  format: {
    type: String,
    enum: ['csv', 'xlsx'],
    default: 'csv'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  filters: {
    type: mongoose.Schema.Types.Mixed
  },
  fileName: {
    type: String,
    required: true
  },
  recordCount: {
    type: Number,
    default: 0
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
reportSchema.index({ generatedBy: 1, createdAt: -1 });
reportSchema.index({ type: 1 });

module.exports = mongoose.model('Report', reportSchema);