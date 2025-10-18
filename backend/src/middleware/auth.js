const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
async function protect(req, res, next) {
  try {
    console.log("=== AUTH PROTECT MIDDLEWARE ===");
    console.log("URL:", req.url);
    console.log("Method:", req.method);
    console.log("IP:", req.ip);
    
    // Get token from cookie
    const token = req.cookies.token;
    console.log("Token present:", !!token);
    
    if (!token) {
      console.log("No token found, returning 401");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, no token' 
      });
    }
    
    // Verify token
    console.log("Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified, user ID:", decoded.id);
    console.log("Token expiration:", new Date(decoded.exp * 1000));
    console.log("Token issued at:", new Date(decoded.iat * 1000));
    
    // Get user from token
    req.user = await User.findById(decoded.id);
    console.log("User found:", !!req.user);
    
    if (!req.user) {
      console.log("CRITICAL ERROR: User not found in database!");
      console.log("This usually happens when:");
      console.log("1. Database was re-seeded and user IDs changed");
      console.log("2. User was deleted from database");
      console.log("3. Token contains invalid user ID");
      console.log("SOLUTION: User needs to log out and log in again to get a fresh token");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, user not found. Please log out and log in again.' 
      });
    }
    
    // Check if user is active
    if (!req.user.isActive) {
      console.log("User account is deactivated");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }
    
    console.log("Authentication successful for user:", req.user.empId, req.user.name);
    console.log("=== END AUTH PROTECT MIDDLEWARE ===");
    next();
  } catch (error) {
    console.error('=== AUTHENTICATION ERROR ===');
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('URL:', req.url);
    console.error('Method:', req.method);
    console.error('IP:', req.ip);
    
    if (error.name === 'TokenExpiredError') {
      console.log("Token has expired, user needs to log in again");
    } else if (error.name === 'JsonWebTokenError') {
      console.log("Token is invalid, user needs to log in again");
    }
    
    console.error('=== END AUTHENTICATION ERROR ===');
    res.status(401).json({ 
      success: false, 
      message: 'Not authorized, token failed. Please log out and log in again.' 
      });
  }
}

// Restrict to specific roles
function restrictTo(...roles) {
  return (req, res, next) => {
    console.log("=== ROLE RESTRICTION MIDDLEWARE ===");
    console.log("Required roles:", roles);
    console.log("User role:", req.user?.role);
    
    if (!req.user) {
      console.log("No user found, returning 401");
      console.log("=== END ROLE RESTRICTION MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log("User role not authorized, returning 403");
      console.log("User has role:", req.user.role, "but needs one of:", roles);
      console.log("=== END ROLE RESTRICTION MIDDLEWARE ===");
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }
    
    console.log("Role authorization successful");
    console.log("=== END ROLE RESTRICTION MIDDLEWARE ===");
    next();
  };
}

module.exports = {
  protect,
  restrictTo
};