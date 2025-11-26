const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'director'],
    default: 'employee'
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  officeLocation: {
    lat: {
      type: Number,
      default: 26.913595
    },
    lng: {
      type: Number,
      default: 80.953481
    },
    radius: {
      type: Number,
      default: 50 // Updated from 10 to 50 meters
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLogoutAt: {
    type: Date,
    default: null
  },
  flags: {
    allowMultiLogin: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Check if both candidatePassword and this.password exist
    if (!candidatePassword || !this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Index for faster queries
// Note: empId and email already have unique indexes from schema
userSchema.index({ role: 1 });
userSchema.index({ dateOfBirth: 1 }); // For birthday queries
userSchema.index({ isActive: 1 }); // For active user queries

module.exports = mongoose.model('User', userSchema);