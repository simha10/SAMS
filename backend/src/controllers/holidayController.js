const Holiday = require('../models/Holiday');
const User = require('../models/User');

// Create a new holiday
async function createHoliday(req, res) {
  try {
    const { date, name, description } = req.body;
    const createdBy = req.user._id;

    // Validate input
    if (!date || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date and name are required' 
      });
    }

    // Check if holiday already exists for this date
    const existingHoliday = await Holiday.findOne({ date: new Date(date) });
    if (existingHoliday) {
      return res.status(400).json({ 
        success: false, 
        message: 'Holiday already exists for this date' 
      });
    }

    // Create new holiday
    const holiday = new Holiday({
      date: new Date(date),
      name,
      description,
      createdBy
    });

    await holiday.save();

    // Populate creator info
    await holiday.populate('createdBy', 'empId name');

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: {
        holiday
      }
    });
  } catch (error) {
    console.error('Create holiday error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get all holidays
async function getHolidays(req, res) {
  try {
    const { year, month } = req.query;
    
    // Build filter
    const filter = {};
    
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      filter.date = { $gte: startOfYear, $lte: endOfYear };
    }
    
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const holidays = await Holiday.find(filter)
      .sort({ date: 1 })
      .populate('createdBy', 'empId name');

    res.json({
      success: true,
      data: {
        holidays,
        total: holidays.length
      }
    });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get holiday by ID
async function getHolidayById(req, res) {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findById(id)
      .populate('createdBy', 'empId name');

    if (!holiday) {
      return res.status(404).json({ 
        success: false, 
        message: 'Holiday not found' 
      });
    }

    res.json({
      success: true,
      data: {
        holiday
      }
    });
  } catch (error) {
    console.error('Get holiday error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Update holiday
async function updateHoliday(req, res) {
  try {
    const { id } = req.params;
    const { date, name, description } = req.body;

    // Validate input
    if (!date || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date and name are required' 
      });
    }

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ 
        success: false, 
        message: 'Holiday not found' 
      });
    }

    // Check if another holiday already exists for this date
    const existingHoliday = await Holiday.findOne({ 
      date: new Date(date),
      _id: { $ne: id } // Exclude current holiday
    });
    
    if (existingHoliday) {
      return res.status(400).json({ 
        success: false, 
        message: 'Holiday already exists for this date' 
      });
    }

    // Update holiday
    holiday.date = new Date(date);
    holiday.name = name;
    holiday.description = description;

    await holiday.save();

    // Populate creator info
    await holiday.populate('createdBy', 'empId name');

    res.json({
      success: true,
      message: 'Holiday updated successfully',
      data: {
        holiday
      }
    });
  } catch (error) {
    console.error('Update holiday error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Delete holiday
async function deleteHoliday(req, res) {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ 
        success: false, 
        message: 'Holiday not found' 
      });
    }

    await Holiday.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Check if a date is a holiday
async function isHoliday(req, res) {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date parameter is required' 
      });
    }

    const holiday = await Holiday.findOne({ date: new Date(date) });

    res.json({
      success: true,
      data: {
        isHoliday: !!holiday,
        holiday: holiday || null
      }
    });
  } catch (error) {
    console.error('Check holiday error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
  isHoliday // Export the isHoliday function
};