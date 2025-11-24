const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');
const { randomUUID } = require('crypto');

/**
 * Generate a unique token ID
 * @returns {string} UUID v4 string
 */
function generateTokenId() {
  return randomUUID();
}

/**
 * Generate access token
 * @param {Object} user - User object
 * @param {string} sessionId - Session ID
 * @param {string} deviceId - Device ID
 * @param {string} tokenId - Token ID
 * @returns {string} JWT access token
 */
function generateAccessToken(user, sessionId, deviceId, tokenId) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      sessionId: sessionId.toString(),
      deviceId,
      tokenId,
      role: user.role,
      empId: user.empId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '30m',
      issuer: 'sams-backend',
      audience: 'sams-frontend',
      jwtid: tokenId
    }
  );
}

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @param {string} sessionId - Session ID
 * @param {string} deviceId - Device ID
 * @param {string} tokenId - Token ID
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user, sessionId, deviceId, tokenId) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      sessionId: sessionId.toString(),
      deviceId,
      tokenId,
      role: user.role,
      empId: user.empId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: 'sams-backend',
      audience: 'sams-frontend',
      jwtid: tokenId
    }
  );
}

/**
 * Generate both access and refresh tokens along with session
 * @param {Object} user - User object
 * @param {String} deviceId - Device ID
 * @param {Object} metadata - Additional metadata (userAgent, ipAddress)
 * @returns {Promise<Object>} - Tokens and session info
 */
async function generateTokens(user, deviceId, metadata = {}) {
  try {
    // Generate unique token IDs
    const accessTokenId = generateTokenId();
    const refreshTokenId = generateTokenId();
    
    // Generate session ID and JTI (JWT ID)
    const sessionId = generateTokenId();
    const jti = generateTokenId();

    // Calculate refresh token expiry
    const refreshTokenLifetime = process.env.REFRESH_TOKEN_LIFETIME || '7d';
    const expiresAt = new Date();
    
    // Parse the lifetime string (e.g., '7d', '30d')
    const match = refreshTokenLifetime.match(/^(\d+)([dhm])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      
      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
      }
    } else {
      // Default to 7 days
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    // Create session in database
    const session = await Session.create({
      userId: user._id,
      deviceId,
      sessionId, // Add the required sessionId field
      jti,       // Add the required jti field
      accessTokenId,
      refreshTokenId,
      isActive: true,
      lastSeenAt: new Date(),
      expiresAt,
      userAgent: metadata.userAgent || null,
      ipAddress: metadata.ipAddress || null
    });

    // Generate tokens
    const accessToken = generateAccessToken(user, session._id, deviceId, accessTokenId);
    const refreshToken = generateRefreshToken(user, session._id, deviceId, refreshTokenId);

    return {
      accessToken,
      refreshToken,
      session,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new Error('Failed to generate authentication tokens');
  }
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {Object} Decoded token payload
 */
function verifyToken(token, type = 'access') {
  try {
    const secret = process.env.JWT_SECRET;
    const options = {
      issuer: 'sams-backend',
      audience: 'sams-frontend'
    };

    // Add expiration check for access tokens
    if (type === 'access') {
      options.maxAge = process.env.JWT_ACCESS_EXPIRY || '30m';
    }

    return jwt.verify(token, secret, options);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token and user info
 */
async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');
    
    // Find session
    const session = await Session.findById(decoded.sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!session.isActive) {
      throw new Error('Session is inactive');
    }
    
    // Verify refresh token ID matches session
    if (session.refreshTokenId !== decoded.tokenId) {
      throw new Error('Invalid refresh token');
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      // Deactivate expired session
      await session.deactivate();
      throw new Error('Session has expired');
    }
    
    // Find user
    const user = await User.findById(decoded.sub);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }
    
    // Generate new access token
    const newAccessTokenId = generateTokenId();
    const newAccessToken = generateAccessToken(user, session._id, decoded.deviceId, newAccessTokenId);
    
    // Update session with new access token ID
    session.accessTokenId = newAccessTokenId;
    session.lastSeenAt = new Date();
    await session.save();
    
    return {
      accessToken: newAccessToken,
      user: {
        _id: user._id,
        empId: user.empId,
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId,
        officeLocation: user.officeLocation,
        isActive: user.isActive,
        dateOfBirth: user.dateOfBirth
      }
    };
  } catch (error) {
    if (error.message === 'Token has expired') {
      throw new Error('Refresh token has expired');
    } else if (error.message === 'Invalid token') {
      throw new Error('Invalid refresh token');
    } else {
      throw error;
    }
  }
}

/**
 * Invalidate user session
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateSession(sessionId) {
  try {
    if (!sessionId) {
      return false;
    }
    
    const session = await Session.findById(sessionId);
    
    if (session) {
      await session.deactivate();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
}

module.exports = {
  generateTokenId,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  refreshAccessToken,
  invalidateSession
};