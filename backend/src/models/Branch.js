const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    radius: {
        type: Number,
        default: 50 // Default 50 meters
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
branchSchema.index({ isActive: 1 });

module.exports = mongoose.model('Branch', branchSchema);