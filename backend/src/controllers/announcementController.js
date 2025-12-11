const Announcement = require('../models/Announcement');
const User = require('../models/User');

// Get all active announcements
async function getActiveAnnouncements(req, res) {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name empId');
    
    res.json({
      success: true,
      data: {
        announcements
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get announcement by ID
async function getAnnouncementById(req, res) {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'name empId');
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        announcement
      }
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Create announcement (manager/director only)
async function createAnnouncement(req, res) {
  try {
    // Check if user is manager or director
    if (req.user.role !== 'manager' && req.user.role !== 'director') {
      return res.status(403).json({
        success: false,
        message: 'Only managers and directors can create announcements'
      });
    }
    
    const { heading, description } = req.body;
    
    // Validate required fields
    if (!heading || !description) {
      return res.status(400).json({
        success: false,
        message: 'Heading and description are required'
      });
    }
    
    // Create announcement
    const announcement = new Announcement({
      heading,
      description,
      createdBy: req.user._id,
      isActive: true
    });
    
    await announcement.save();
    
    // Populate creator info
    await announcement.populate('createdBy', 'name empId');
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: {
        announcement
      }
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Update announcement (manager/director only)
async function updateAnnouncement(req, res) {
  try {
    // Check if user is manager or director
    if (req.user.role !== 'manager' && req.user.role !== 'director') {
      return res.status(403).json({
        success: false,
        message: 'Only managers and directors can update announcements'
      });
    }
    
    const { id } = req.params;
    const { heading, description, isActive } = req.body;
    
    // Build update object
    const updateData = {};
    if (heading !== undefined) updateData.heading = heading;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Update announcement
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name empId');
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: {
        announcement
      }
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Delete announcement (manager/director only)
async function deleteAnnouncement(req, res) {
  try {
    // Check if user is manager or director
    if (req.user.role !== 'manager' && req.user.role !== 'director') {
      return res.status(403).json({
        success: false,
        message: 'Only managers and directors can delete announcements'
      });
    }
    
    const { id } = req.params;
    
    // Delete announcement
    const announcement = await Announcement.findByIdAndDelete(id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getActiveAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};