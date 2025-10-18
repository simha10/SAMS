const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      empId: user.empId, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

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
    
    // Generate token
    const token = generateToken(user);
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
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
    res.clearCookie('token');
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

// Register user (admin only)
async function register(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== 'director') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only directors can register new users' 
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
      managerId: role === 'employee' ? managerId : undefined,
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

module.exports = {
  login,
  logout,
  getProfile,
  register
};