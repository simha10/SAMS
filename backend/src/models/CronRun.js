const mongoose = require('mongoose');

const cronRunSchema = new mongoose.Schema({
  jobName: { 
    type: String, 
    required: true,
    index: true
  },
  date: { 
    type: String, 
    required: true,
    index: true
  }, // Format: 'YYYY-MM-DD'
  executedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'completed', 'failed'], 
    default: 'completed' 
  },
  executionId: { 
    type: String, 
    required: true,
    unique: true
  }, // Unique execution ID
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate job runs for the same date
cronRunSchema.index({ jobName: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CronRun', cronRunSchema);