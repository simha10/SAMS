const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { verifyToken } = require('../utils/tokenHelper');

// Protect routes - require Bearer token authentication
async function protect(req, res, next) {
  try {
    logger.debug("=== AUTH PROTECT MIDDLEWARE (BEARER TOKEN) ===");
    logger.debug("URL:", { url: req.url });
    logger.debug("Method:", { method: req.method });
    logger.debug("IP:", { ip: req.ip });
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    logger.debug("Authorization header present:", { hasAuthHeader: !!authHeader });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug("No valid Bearer token found, returning 401");
      logger.debug("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized. Please provide a valid Bearer token.' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify and decode token
    logger.debug("Verifying access token...");
    const decoded = verifyToken(token, 'access');
    logger.debug("Token verified", { userId: decoded.sub, sessionId: decoded.sessionId, deviceId: decoded.deviceId });
    
    // Verify session is active
    const session = await Session.findById(decoded.sessionId);
    
    if (!session) {
      logger.debug("Session not found in database");
      logger.debug("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Session not found. Please log in again.' 
      });
    }

    if (!session.isActive) {
      logger.debug("Session is inactive");
      logger.debug("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Session is inactive. Please log in again.' 
      });
    }

    // Verify access token ID matches session
    if (session.accessTokenId !== decoded.tokenId) {
      logger.debug("Access token ID mismatch");
      logger.debug("=== END AUTH PROTECT MIDDLEWARE ===");
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
    logger.debug("User found:", { userExists: !!user });
    
    if (!user) {
      logger.debug("User not found in database");
      logger.debug("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'User not found. Please log in again.' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      logger.debug("User account is deactivated");
      logger.debug("=== END AUTH PROTECT MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }
    
    // Attach user and session info to request
    req.user = user;
    req.user.sessionId = decoded.sessionId;
    req.user.deviceId = decoded.deviceId;
    
    logger.debug("Authentication successful", { empId: req.user.empId, name: req.user.name });
    logger.debug("=== END AUTH PROTECT MIDDLEWARE ===");
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
    logger.debug("=== ROLE RESTRICTION MIDDLEWARE ===");
    logger.debug("Required roles:", { roles });
    logger.debug("User role:", { userRole: req.user?.role });
    
    if (!req.user) {
      logger.debug("No user found, returning 401");
      logger.debug("=== END ROLE RESTRICTION MIDDLEWARE ===");
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.debug("User role not authorized, returning 403");
      logger.debug("User role not authorized", { userRole: req.user.role, requiredRoles: roles });
      logger.debug("=== END ROLE RESTRICTION MIDDLEWARE ===");
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }
    
    logger.debug("Role authorization successful");
    logger.debug("=== END ROLE RESTRICTION MIDDLEWARE ===");
    next();
  };
}

module.exports = {
  protect,
  restrictTo
};