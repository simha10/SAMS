const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { verifyToken } = require('../utils/tokenHelper');

// Protect routes - require Bearer token authentication
async function protect(req, res, next) {
  try {
    console.log("=== AUTH PROTECT MIDDLEWARE (BEARER TOKEN) ===");
    console.log("URL:", req.url);
    console.log("Method:", req.method);
    console.log("IP:", req.ip);
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log("Authorization header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No valid Bearer token found, returning 401");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized. Please provide a valid Bearer token.' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify and decode token
    console.log("Verifying access token...");
    const decoded = verifyToken(token, 'access');
    console.log("Token verified, user ID:", decoded.sub);
    console.log("Session ID:", decoded.sessionId);
    console.log("Device ID:", decoded.deviceId);
    
    // Verify session is active
    const session = await Session.findById(decoded.sessionId);
    
    if (!session) {
      console.log("Session not found in database");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Session not found. Please log in again.' 
      });
    }

    if (!session.isActive) {
      console.log("Session is inactive");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Session is inactive. Please log in again.' 
      });
    }

    // Verify access token ID matches session
    if (session.accessTokenId !== decoded.tokenId) {
      console.log("Access token ID mismatch");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid access token. Please log in again.' 
      });
    }

    // Update session last seen
    session.lastSeenAt = new Date();
    await session.save();
    
    // Get user from token
    const user = await User.findById(decoded.sub);
    console.log("User found:", !!user);
    
    if (!user) {
      console.log("User not found in database");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'User not found. Please log in again.' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      console.log("User account is deactivated");
      console.log("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }
    
    // Attach user and session info to request
    req.user = user;
    req.user.sessionId = decoded.sessionId;
    req.user.deviceId = decoded.deviceId;
    
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
    
    let message = 'Not authorized. Please log in again.';
    
    if (error.message === 'Token has expired') {
      console.log("Access token has expired, client should use refresh token");
      message = 'Access token expired. Please refresh your token.';
    } else if (error.message === 'Invalid token') {
      console.log("Token is invalid");
      message = 'Invalid access token. Please log in again.';
    }
    
    console.error('=== END AUTHENTICATION ERROR ===');
    res.status(401).json({ 
      success: false, 
      message,
      requireRefresh: error.message === 'Token has expired'
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