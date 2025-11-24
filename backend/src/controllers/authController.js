const User = require('../models/User');
const Session = require('../models/Session');
const UnusualActionLog = require('../models/UnusualActionLog');
const jwt = require('jsonwebtoken');
const { 
  generateTokens, 
  refreshAccessToken, 
  invalidateSession,
  verifyToken 
} = require('../utils/tokenHelper');

// Login user with Bearer token authentication and device tracking
async function login(req, res) {
  try {
    const { empId, password, rememberMe = false } = req.body;
    const deviceId = req.headers['x-device-id'];
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Validate input
    if (!empId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID and password are required' 
      });
    }

    // Validate device ID
    if (!deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device ID is required. Please refresh your browser.' 
      });
    }
    
    // Find user by empId
    const user = await User.findOne({ empId });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }
    
    // Compare password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check for unusual login patterns
    let unusual = false;
    const unusualActions = [];

    // Check if different user is already logged in on same device
    const existingDeviceSession = await Session.findOne({ 
      deviceId, 
      isActive: true,
      userId: { $ne: user._id }
    }).populate('userId', 'empId name');

    if (existingDeviceSession) {
      unusual = true;
      await UnusualActionLog.logAction({
        userId: user._id,
        actionType: 'MULTI_USER_DEVICE',
        deviceId,
        metadata: {
          previousUser: existingDeviceSession.userId.empId,
          currentUser: user.empId,
          message: 'Different user logging in on same device'
        },
        severity: 'high'
      });
      unusualActions.push('MULTI_USER_DEVICE');
    }

    // Check if user is re-logging in after recent logout
    if (user.lastLogoutAt) {
      const timeSinceLogout = new Date() - new Date(user.lastLogoutAt);
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeSinceLogout < fiveMinutes) {
        unusual = true;
        await UnusualActionLog.logAction({
          userId: user._id,
          actionType: 'RELOGIN_AFTER_LOGOUT',
          deviceId,
          metadata: {
            lastLogoutAt: user.lastLogoutAt,
            timeSinceLogout: Math.floor(timeSinceLogout / 1000),
            message: 'User re-logged in shortly after logout'
          },
          severity: 'medium'
        });
        unusualActions.push('RELOGIN_AFTER_LOGOUT');
      }
    }

    // Deactivate all existing sessions for this user on this device (single login per device)
    await Session.updateMany(
      { userId: user._id, deviceId, isActive: true },
      { isActive: false }
    );

    // Generate new tokens and create session
    const { accessToken, refreshToken, session, expiresAt } = await generateTokens(
      user, 
      deviceId, 
      { userAgent, ipAddress }
    );

    // Update user login metadata
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    await user.save();

    // Prepare response
    const responseData = {
      accessToken,
      expiresAt,
      user: {
        _id: user._id,
        empId: user.empId,
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId,
        officeLocation: user.officeLocation,
        isActive: user.isActive,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
    
    // Only send refreshToken in response data if not using rememberMe
    if (!rememberMe) {
      responseData.refreshToken = refreshToken;
    }
    
    const response = {
      success: true,
      message: unusual ? 'Login successful, but unusual activity detected' : 'Login successful',
      data: responseData
    };

    // Add unusual flag if detected
    if (unusual) {
      response.unusual = true;
      response.unusualActions = unusualActions;
    }
    
    // Set secure cookie with refresh token if rememberMe is true
    if (rememberMe) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });
    }
    
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Logout user with session invalidation
async function logout(req, res) {
  try {
    const sessionId = req.user?.sessionId;
    const userId = req.user?._id;

    // Update user logout timestamp
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        lastLogoutAt: new Date()
      });
    }

    // Invalidate session if available
    if (sessionId) {
      await invalidateSession(sessionId);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    }).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get user profile (optimized with lean)
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Register user (managers and directors can register new users)
async function register(req, res) {
  try {
    // Check if user is manager or director
    if (req.user.role !== 'manager' && req.user.role !== 'director') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only managers and directors can register new users' 
      });
    }
    
    const { empId, name, email, password, role, managerId, officeLocation } = req.body;
    
    // Validate required fields
    if (!empId || !name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID, name, email, password, and role are required' 
      });
    }
    
    // Managers can only register employees, not other managers or directors
    if (req.user.role === 'manager' && role !== 'employee') {
      return res.status(403).json({ 
        success: false, 
        message: 'Managers can only register employees' 
      });
    }
    
    // If manager is registering an employee, set the managerId to the current manager
    const effectiveManagerId = req.user.role === 'manager' ? req.user._id : managerId;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ empId }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this Employee ID or Email already exists' 
      });
    }
    
    // Create user
    const user = new User({
      empId,
      name,
      email,
      password,
      role,
      managerId: role === 'employee' ? effectiveManagerId : undefined,
      officeLocation: officeLocation || {
        lat: process.env.OFFICE_DEFAULT_LAT || 26.913595,
        lng: process.env.OFFICE_DEFAULT_LNG || 80.953481,
        radius: process.env.OFFICE_DEFAULT_RADIUS || 50
      }
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          empId: user.empId,
          name: user.name,
          email: user.email,
          role: user.role,
          managerId: user.managerId,
          officeLocation: user.officeLocation,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Update user profile
async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!name && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name or email is required' 
      });
    }
    
    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          empId: user.empId,
          name: user.name,
          email: user.email,
          role: user.role,
          managerId: user.managerId,
          officeLocation: user.officeLocation,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Change password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All password fields are required' 
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password and confirm password do not match' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Refresh access token using refresh token
async function refresh(req, res) {
  try {
    // Check for refresh token in body or cookie
    let refreshToken = req.body.refreshToken;
    
    // If not in body, check cookie (for remember me feature)
    if (!refreshToken && req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token is required' 
      });
    }

    // Refresh the access token
    const { accessToken, user } = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
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
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Handle specific errors
    if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('inactive')) {
      return res.status(401).json({ 
        success: false, 
        message: error.message,
        requireLogin: true
      });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  login,
  logout,
  getProfile,
  register,
  updateProfile,
  changePassword,
  refresh
};