const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token with 7-day expiry for all environments
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      empId: user.empId
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Consistent 7-day expiry
  );
};

// Login user
async function login(req, res) {
  try {
    const { empId, password } = req.body;

    // Validate input
    if (!empId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and password are required'
      });
    }

    // Find user by empId and select password
    const user = await User.findOne({ empId }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
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

    // Generate token with 7-day expiry
    const token = generateToken(user);

    // Set cookie with 7-day expiration (consistent for all users)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // Configure cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      maxAge: maxAge,
      path: '/', // Explicitly set path to ensure cookie is sent to all routes
      // Add domain only if explicitly set in environment variables
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
    };

    // Add domain option for production
    if (process.env.NODE_ENV === 'production') {
      // Don't set domain for Render deployment as it can cause issues
      // The cookie will be set for the current domain automatically
      console.log('Setting production cookie options');
    }

    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          empId: user.empId,
          name: user.name,
          email: user.email,
          role: user.role,
          managerId: user.managerId,
          dob: user.dob,
          mobile: user.mobile,
          officeLocation: user.officeLocation,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Logout user
async function logout(req, res) {
  try {
    // Clear the token cookie with proper options
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      // Add domain only if explicitly set in environment variables
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
    });
    
    // Also clear any legacy cookies that might exist
    res.clearCookie('token', {
      httpOnly: true,
      path: '/'
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get user profile
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          empId: user.empId,
          name: user.name,
          email: user.email,
          role: user.role,
          managerId: user.managerId,
          dob: user.dob,
          mobile: user.mobile,
          officeLocation: user.officeLocation,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
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

    const { empId, name, email, password, role, managerId, officeLocation, dob, mobile } = req.body;

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
    const userData = {
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
    };

    // Add DOB if provided
    if (dob) {
      userData.dob = dob;
    }

    // Add mobile if provided
    if (mobile) {
      userData.mobile = mobile;
    }

    const user = new User(userData);

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
          dob: user.dob,
          mobile: user.mobile,
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
    const { name, email, dob, mobile } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!name && !email && !dob && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, date of birth, or mobile number is required'
      });
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (dob !== undefined) updateData.dob = dob;
    if (mobile !== undefined) updateData.mobile = mobile;

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
          dob: user.dob,
          mobile: user.mobile,
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
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user and select password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
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

module.exports = {
  login,
  logout,
  getProfile,
  register,
  updateProfile,
  changePassword
};