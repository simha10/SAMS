const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    radius: {
      type: Number,
      required: true,
      min: 1,
      default: 50 // meters
    }
  },
  address: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    city: String,
    state: String,
    country: String,
    timezone: String
  }
}, {
  timestamps: true
});

// Indexes for optimized queries
// Note: code already has unique index from schema, isActive has index from field definition
branchSchema.index({ name: 1 });
branchSchema.index({ 'location.lat': 1, 'location.lng': 1 }); // Geospatial queries

// Static method to get all active branches (cached)
branchSchema.statics.getActiveBranches = async function() {
  return await this.find({ isActive: true })
    .select('code name location')
    .lean();
};

// Method to check if coordinates are within branch radius
branchSchema.methods.isWithinRadius = function(lat, lng) {
  const { calculateDistance } = require('../utils/haversine');
  const distance = calculateDistance(
    lat,
    lng,
    this.location.lat,
    this.location.lng
  );
  return {
    isWithin: distance <= this.location.radius,
    distance
  };
};

module.exports = mongoose.model('Branch', branchSchema);
