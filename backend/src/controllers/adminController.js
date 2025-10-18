const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { getCurrentDateString } = require('../utils/haversine');
const logger = require('../config/logger');
const { Parser } = require('json2csv');

// Get company insights
const getInsights = async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    // Get total employees
    const totalEmployees = await User.countDocuments({ isActive: true, role: 'employee' });
    
    // Get attendance stats
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDateString, $lte: endDateString }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to object
    const statsObject = {};
    let totalAttendanceRecords = 0;
    attendanceStats.forEach(stat => {
      statsObject[stat._id] = stat.count;
      totalAttendanceRecords += stat.count;
    });
    
    // Calculate overall attendance rate
    const presentCount = statsObject.present || 0;
    const overallAttendanceRate = totalAttendanceRecords > 0 
      ? Math.round((presentCount / totalAttendanceRecords) * 1000) / 10
      : 0;
    
    // Get daily trends
    const dailyTrends = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDateString, $lte: endDateString }
        }
      },
      {
        $group: {
          _id: '$date',
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          flagged: {
            $sum: { $cond: [{ $eq: ['$flagged', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get top performers
    const topPerformers = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDateString, $lte: endDateString }
        }
      },
      {
        $group: {
          _id: '$userId',
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          totalDays: { $sum: 1 }
        }
      },
      {
        $project: {
          attendanceRate: {
            $cond: [
              { $eq: ['$totalDays', 0] },
              0,
              { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] }
            ]
          },
          presentDays: 1,
          totalDays: 1
        }
      },
      {
        $match: {
          totalDays: { $gte: 5 } // Only consider employees with at least 5 attendance records
        }
      },
      {
        $sort: { attendanceRate: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          empId: '$user.empId',
          name: '$user.name',
          attendanceRate: { $round: ['$attendanceRate', 2] },
          presentDays: 1,
          totalDays: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        period: {
          startDate: startDateString,
          endDate: endDateString,
          days
        },
        overview: {
          totalEmployees,
          overallAttendanceRate,
          totalAttendanceRecords
        },
        attendanceStats: statsObject,
        dailyTrends,
        topPerformers
      }
    });
  } catch (error) {
    logger.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, active } = req.query;
    
    // Build query
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    // Get users
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: {
        users,
        total: users.length
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { passwordHash, ...safeUpdateData } = updateData;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      safeUpdateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export attendance data to CSV
const exportAttendance = async (req, res) => {
  try {
    const { from, to, userId } = req.query;
    
    // Build query
    const query = {};
    
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('userId', 'empId name email')
      .sort({ date: 1, userId: 1 });
    
    // Transform data for CSV
    const csvData = attendanceRecords.map(record => ({
      date: record.date,
      empId: record.userId?.empId || 'N/A',
      name: record.userId?.name || 'N/A',
      email: record.userId?.email || 'N/A',
      checkInTime: record.checkInTime ? new Date(record.checkInTime).toISOString() : '',
      checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toISOString() : '',
      checkInLat: record.location?.checkIn?.lat || '',
      checkInLng: record.location?.checkIn?.lng || '',
      checkOutLat: record.location?.checkOut?.lat || '',
      checkOutLng: record.location?.checkOut?.lng || '',
      checkInDistance: record.distanceFromOffice?.checkIn || '',
      checkOutDistance: record.distanceFromOffice?.checkOut || '',
      status: record.status,
      flagged: record.flagged ? 'Yes' : 'No',
      flaggedReason: record.flaggedReason || '',
      workingHours: record.workingHours || 0
    }));
    
    // Create CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);
    
    // Set headers for file download
    res.header('Content-Type', 'text/csv');
    res.attachment('attendance-export.csv');
    res.status(200).send(csv);
  } catch (error) {
    logger.error('Export attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getInsights,
  getAllUsers,
  updateUser,
  exportAttendance
};