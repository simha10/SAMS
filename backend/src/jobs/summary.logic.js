const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { getCurrentDateString } = require('../utils/haversine');
const logger = require('../config/logger');

// Function to send daily summary - exported for cron controller and direct testing
async function sendDailySummaryLogic() {
  try {
    const today = getCurrentDateString();

    logger.info('Running daily summary job...', { date: today });

    // Get all managers and directors
    const managers = await User.find({
      role: { $in: ['manager', 'director'] },
      isActive: true
    });

    const summaries = [];

    for (const manager of managers) {
      // Get team members for this manager
      const teamMembers = await User.find({
        managerId: manager._id,
        isActive: true
      }).select('_id');

      if (teamMembers.length === 0) {
        continue;
      }

      const teamMemberIds = teamMembers.map(member => member._id);

      // Get attendance summary for the team
      const attendanceSummary = await Attendance.aggregate([
        {
          $match: {
            userId: { $in: teamMemberIds },
            date: today
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Calculate summary data
      const summaryData = {
        date: today,
        total: teamMembers.length,
        present: 0,
        absent: 0,
        onLeave: 0,
        flagged: 0
      };

      attendanceSummary.forEach(item => {
        if (item._id === 'present') {
          summaryData.present = item.count;
        } else if (item._id === 'absent') {
          summaryData.absent = item.count;
        } else if (item._id === 'on-leave') {
          summaryData.onLeave = item.count;
        }
      });

      // Get flagged count separately
      const flaggedCount = await Attendance.countDocuments({
        userId: { $in: teamMemberIds },
        date: today,
        flagged: true
      });

      summaryData.flagged = flaggedCount;

      // Ensure all team members are accounted for
      const totalRecorded = summaryData.present + summaryData.absent + summaryData.onLeave;
      if (totalRecorded < summaryData.total) {
        summaryData.absent += (summaryData.total - totalRecorded);
      }

      // Log summary instead of sending notification
      logger.info(`Daily summary for manager ${manager.name}:`, summaryData);
      
      summaries.push({
        managerId: manager._id,
        managerName: manager.name,
        summary: summaryData
      });
    }

    logger.info('Daily summary job completed', { summariesGenerated: summaries.length });

    return { 
      summaries: summaries.length,
      date: today,
      details: summaries
    };
  } catch (error) {
    logger.error('Daily summary job error:', error);
    throw error;
  }
}

module.exports = {
  sendDailySummaryLogic
};