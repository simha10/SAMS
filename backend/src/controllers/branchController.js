const Branch = require('../models/Branch');

/**
 * Get all branches
 * @access Protected - All authenticated users
 */
async function getAllBranches(req, res) {
  try {
    const { activeOnly = 'true' } = req.query;
    
    const filter = activeOnly === 'true' ? { isActive: true } : {};
    
    const branches = await Branch.find(filter)
      .select('code name location address isActive metadata')
      .sort({ name: 1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        branches,
        count: branches.length
      }
    });
  } catch (error) {
    console.error('Get all branches error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Get branch by ID or code
 * @access Protected - All authenticated users
 */
async function getBranch(req, res) {
  try {
    const { id } = req.params;
    
    // Try to find by ID or code
    const branch = await Branch.findOne({
      $or: [
        { _id: id },
        { code: id.toUpperCase() }
      ]
    }).lean();
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    res.json({
      success: true,
      data: { branch }
    });
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Create new branch
 * @access Protected - Director only
 */
async function createBranch(req, res) {
  try {
    const { code, name, location, address, metadata } = req.body;
    
    // Validate required fields
    if (!code || !name || !location || !location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: 'Branch code, name, latitude, and longitude are required'
      });
    }
    
    // Check if branch code already exists
    const existingBranch = await Branch.findOne({ code: code.toUpperCase() });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: 'Branch with this code already exists'
      });
    }
    
    // Create branch
    const branch = await Branch.create({
      code: code.toUpperCase(),
      name,
      location: {
        lat: location.lat,
        lng: location.lng,
        radius: location.radius || 50
      },
      address: address || '',
      metadata: metadata || {}
    });
    
    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: { branch }
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Update branch
 * @access Protected - Director only
 */
async function updateBranch(req, res) {
  try {
    const { id } = req.params;
    const { name, location, address, metadata, isActive } = req.body;
    
    const branch = await Branch.findById(id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    // Update fields
    if (name) branch.name = name;
    if (location) {
      if (location.lat) branch.location.lat = location.lat;
      if (location.lng) branch.location.lng = location.lng;
      if (location.radius) branch.location.radius = location.radius;
    }
    if (address !== undefined) branch.address = address;
    if (metadata) branch.metadata = { ...branch.metadata, ...metadata };
    if (isActive !== undefined) branch.isActive = isActive;
    
    await branch.save();
    
    res.json({
      success: true,
      message: 'Branch updated successfully',
      data: { branch }
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Delete branch (soft delete - set isActive to false)
 * @access Protected - Director only
 */
async function deleteBranch(req, res) {
  try {
    const { id } = req.params;
    
    const branch = await Branch.findById(id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    // Soft delete
    branch.isActive = false;
    await branch.save();
    
    res.json({
      success: true,
      message: 'Branch deactivated successfully'
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getAllBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch
};
