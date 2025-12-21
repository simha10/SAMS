const jwt = require('jsonwebtoken');

/**
 * Token utilities for persistent authentication
 */

/**
 * Generate a new JWT token with extended expiration
 * @param {Object} user - User object containing id, role, and empId
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      empId: user.empId
    },
    process.env.JWT_SECRET,
    { expiresIn: '90d' } // 90-day expiry for persistent login
  );
};

/**
 * Check if token needs refresh based on age
 * @param {Object} decodedToken - Decoded JWT token
 * @returns {Boolean} Whether token needs refresh
 */
const shouldRefreshToken = (decodedToken) => {
  const now = Math.floor(Date.now() / 1000);
  const tokenIssuedAt = decodedToken.iat;
  const tokenAge = now - tokenIssuedAt;
  
  // Refresh if token is older than 30 days
  return tokenAge > 30 * 24 * 60 * 60;
};

/**
 * Generate cookie options for authentication tokens
 * @returns {Object} Cookie options
 */
const getCookieOptions = () => {
  const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
  
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: maxAge,
    path: '/'
  };
};

/**
 * Refresh token if needed and update response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Object} user - User object
 * @param {Object} decodedToken - Decoded JWT token
 */
const refreshTokenIfNeeded = (req, res, user, decodedToken) => {
  if (shouldRefreshToken(decodedToken)) {
    console.log("Refreshing token for user:", user.empId);
    
    // Generate new token
    const newToken = generateToken(user);
    
    // Set new cookie
    const cookieOptions = getCookieOptions();
    res.cookie('token', newToken, cookieOptions);
    
    console.log("Token refreshed and cookie updated for user:", user.empId);
    return true;
  }
  return false;
};

module.exports = {
  generateToken,
  shouldRefreshToken,
  getCookieOptions,
  refreshTokenIfNeeded
};