const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Verify JWT token from cookie
const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth middleware called for:', req.path);
    const token = req.cookies.token;
    console.log('Token from cookies:', token ? 'Present' : 'Missing');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    const user = await User.findById(decoded.userId).select('-passwordHash');
    console.log('User found:', user ? { id: user._id, empId: user.empId, role: user.role } : null);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user deactivated.' 
      });
    }

    // Add debug logging
    console.log('Auth middleware - Token decoded:', decoded);
    console.log('Auth middleware - User found:', { 
      id: user._id, 
      empId: user.empId, 
      name: user.name,
      role: user.role
    });
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Role-based access control
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    console.log('Role middleware check:', {
      allowedRoles,
      user: req.user ? { id: req.user._id, role: req.user.role } : null
    });
    
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log('User role not allowed:', req.user.role, 'Allowed roles:', allowedRoles);
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    console.log('Role check passed, proceeding to next middleware');
    next();
  };
};

// Admin only middleware
const adminOnly = roleMiddleware(['director']);

// Manager and above middleware
const managerAndAbove = roleMiddleware(['manager', 'director']);

module.exports = {
  authMiddleware,
  roleMiddleware,
  adminOnly,
  managerAndAbove
};