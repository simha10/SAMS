const Report = require('../models/Report');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { generateAttendanceReportData, generateLeaveReportData,
  generateSummaryReportData, convertToCSV, createMultiSheetExcel, workbookToBuffer } = require('../utils/excel');

// Generate report - streamlined to work without file storage
async function generateReport(req, res) {
  try {
    const { title, type, format = 'csv', startDate, endDate, filters = {} } = req.body;
    const userId = req.user._id;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Ensure end date is inclusive

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // For streamlined approach, we don't store reports anymore
    // Return success message indicating the report can be streamed directly
    res.json({
      success: true,
      message: 'Report generation available via streaming. Use the stream endpoint to download.',
      data: {
        title,
        type,
        format: format === 'xlsx' ? 'xlsx' : 'csv',
        startDate: start,
        endDate: end,
        filters
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Preview report - keep this functionality but without file storage
async function previewReport(req, res) {
  try {
    const { type, startDate, endDate, filters = {} } = req.body;

    // Log incoming data for debugging
    console.log("=== PREVIEW REPORT REQUEST DATA ===");
    console.log("Type:", type);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("Filters:", filters);

    // Validate required fields
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required'
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date is required'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }

    if (isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format'
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    let reportData = [];
    let recordCount = 0;

    // Generate preview data (limited to 10 records)
    switch (type) {
      case 'attendance':
        reportData = await generateAttendanceReport(req, start, end, filters, 10);
        // Format for preview
        reportData = generateAttendanceReportData(reportData, startDate, endDate);
        recordCount = reportData.length;
        break;
      case 'leave':
        reportData = await generateLeaveReport(req, start, end, filters, 10);
        reportData = generateLeaveReportData(reportData);
        recordCount = reportData.length;
        break;
      case 'summary':
        reportData = await generateSummaryReport(req, start, end, filters, 10);
        reportData = generateSummaryReportData(reportData);
        recordCount = reportData.length;
        break;
      case 'combined':
        // For combined reports, we'll create a preview with data from all three report types
        const attendanceData = await generateAttendanceReport(req, start, end, filters, 5);
        const leaveData = await generateLeaveReport(req, start, end, filters, 5);
        const summaryData = await generateSummaryReport(req, start, end, filters, 5);

        // Format the data for preview
        const formattedAttendanceData = generateAttendanceReportData(attendanceData, startDate, endDate);
        const formattedLeaveData = generateLeaveReportData(leaveData);
        const formattedSummaryData = generateSummaryReportData(summaryData);

        // Combine the data for preview
        reportData = {
          attendance: formattedAttendanceData.slice(0, 3), // Limit to 3 records for preview
          leave: formattedLeaveData.slice(0, 3),
          summary: formattedSummaryData.slice(0, 3)
        };

        recordCount = reportData.attendance.length + reportData.leave.length + reportData.summary.length;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Valid types are: attendance, leave, summary, combined'
        });
    }

    // Ensure we always return an array or object, even if empty
    if (type !== 'combined' && !Array.isArray(reportData)) {
      reportData = [];
    }

    res.json({
      success: true,
      message: 'Report preview generated',
      data: {
        reportData,
        recordCount: recordCount
      }
    });
  } catch (error) {
    console.error('Preview report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get user's reports - return empty array since we're not storing reports anymore
async function getMyReports(req, res) {
  try {
    // Since we're not storing reports anymore, return empty array
    res.json({
      success: true,
      data: {
        reports: [],
        total: 0
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Download report - return error since we're not storing reports anymore
async function downloadReport(req, res) {
  try {
    return res.status(400).json({
      success: false,
      message: 'Report storage has been disabled. Please use the streaming endpoint to generate reports directly.'
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Delete report - return error since we're not storing reports anymore
async function deleteReport(req, res) {
  try {
    return res.status(400).json({
      success: false,
      message: 'Report storage has been disabled. No reports to delete.'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Helper function to get team query based on user role
function getTeamQuery(userId, userRole) {
  if (userRole === 'director') {
    // Directors see all employees in the organization (except themselves)
    return {
      role: 'employee',
      isActive: true,
      _id: { $ne: userId } // Exclude the director themselves
    };
  } else {
    // Managers see employees under their management
    return {
      managerId: userId,
      role: 'employee',
      isActive: true
    };
  }
}

// Helper function to generate attendance report data
async function generateAttendanceReport(req, start, end, filters, limit = 0) {
  // Ensure end date is inclusive by setting it to end of day
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const query = {
    date: {
      $gte: start,
      $lte: endDate
    }
  };

  // Apply filters
  if (filters.employeeId) {
    const user = await User.findOne({ empId: filters.employeeId });
    if (user) {
      query.userId = user._id;
    } else {
      return []; // No user found with that empId
    }
  } else if (req.user.role === 'manager' || req.user.role === 'director') {
    // If manager or director, get team query based on role
    const teamQuery = getTeamQuery(req.user._id, req.user.role);
    const teamMembers = await User.find(teamQuery);
    const teamMemberIds = teamMembers.map(member => member._id);
    query.userId = { $in: teamMemberIds };
  }

  const options = { sort: { date: 1 } }; // Sort by date ascending for proper day mapping
  if (limit > 0) {
    options.limit = limit;
  }

  // Get all attendance records for the date range
  const attendanceRecords = await Attendance.find(query, null, options)
    .populate('userId', 'empId name');

  // Calculate total days in the range
  const totalDaysInRange = Math.ceil((endDate - start) / (1000 * 60 * 60 * 24)) + 1;

  // For each user, ensure they have records for all days in the range
  // This is needed to properly calculate totals
  const userRecordsMap = {};

  // Group existing records by user
  attendanceRecords.forEach(record => {
    const userId = record.userId._id.toString();
    if (!userRecordsMap[userId]) {
      userRecordsMap[userId] = [];
    }
    userRecordsMap[userId].push(record);
  });

  // Get all relevant users to ensure they appear in the report even if they have no records
  let allRelevantUsers = [];
  if (filters.employeeId) {
    const user = await User.findOne({ empId: filters.employeeId });
    if (user) {
      allRelevantUsers = [user];
    }
  } else if (req.user.role === 'manager' || req.user.role === 'director') {
    // If manager or director, get team query based on role
    const teamQuery = getTeamQuery(req.user._id, req.user.role);
    allRelevantUsers = await User.find(teamQuery);
  } else {
    // For admin, get all active users
    allRelevantUsers = await User.find({ isActive: true });
  }

  // Add missing users to the map with empty arrays
  allRelevantUsers.forEach(user => {
    const userId = user._id.toString();
    if (!userRecordsMap[userId]) {
      userRecordsMap[userId] = [];
    }
  });

  // Flatten the map back to a single array with proper total days
  const enhancedAttendanceRecords = [];
  for (const [userId, records] of Object.entries(userRecordsMap)) {
    // Add all existing records
    enhancedAttendanceRecords.push(...records);

    // If a user has no records, we still want them in the report
    // The formatting function will handle users with no records
    if (records.length === 0) {
      // Find the user object
      const user = allRelevantUsers.find(u => u._id.toString() === userId);
      if (user) {
        // We don't need to add dummy records, the formatting function handles this
      }
    }
  }

  return enhancedAttendanceRecords;
}

// Helper function to generate leave report data
async function generateLeaveReport(req, start, end, filters, limit = 0) {
  // Filter by approved date instead of start date
  const query = {
    approvedAt: {
      $gte: start,
      $lte: end
    },
    status: 'approved' // Only include approved leave requests
  };

  // Apply filters
  if (filters.employeeId) {
    const user = await User.findOne({ empId: filters.employeeId });
    if (user) {
      query.userId = user._id;
    } else {
      return []; // No user found with that empId
    }
  } else if (req.user.role === 'manager' || req.user.role === 'director') {
    // If manager or director, get team query based on role
    const teamQuery = getTeamQuery(req.user._id, req.user.role);
    const teamMembers = await User.find(teamQuery);
    const teamMemberIds = teamMembers.map(member => member._id);
    query.userId = { $in: teamMemberIds };
  }

  const options = { sort: { approvedAt: -1 } };
  if (limit > 0) {
    options.limit = limit;
  }

  return await LeaveRequest.find(query, null, options)
    .populate('userId', 'empId name');
}

// Helper function to generate summary report data
async function generateSummaryReport(req, start, end, filters, limit = 0) {
  // Calculate the total number of days in the date range
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  const totalDaysInRange = Math.ceil((endDate - start) / (1000 * 60 * 60 * 24)) + 1;

  const query = {
    date: {
      $gte: start,
      $lte: endDate
    }
  };

  // Apply filters
  if (filters.employeeId) {
    const user = await User.findOne({ empId: filters.employeeId });
    if (user) {
      query.userId = user._id;
    } else {
      return []; // No user found with that empId
    }
  } else if (req.user.role === 'manager' || req.user.role === 'director') {
    // If manager or director, get team query based on role
    const teamQuery = getTeamQuery(req.user._id, req.user.role);
    const teamMembers = await User.find(teamQuery);
    const teamMemberIds = teamMembers.map(member => member._id);
    query.userId = { $in: teamMemberIds };
  }

  // Aggregate attendance data to generate summary
  const attendanceRecords = await Attendance.find(query)
    .populate('userId', 'empId name');

  // Group by user
  const userSummary = {};

  attendanceRecords.forEach(record => {
    const userId = record.userId._id.toString();
    if (!userSummary[userId]) {
      userSummary[userId] = {
        empId: record.userId.empId,
        name: record.userId.name,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        halfDays: 0,
        outsideDutyDays: 0
      };
    }

    userSummary[userId].totalDays++;

    switch (record.status) {
      case 'present':
        userSummary[userId].presentDays++;
        break;
      case 'absent':
        userSummary[userId].absentDays++;
        break;
      case 'half-day':
        userSummary[userId].halfDays++;
        break;
      case 'on-leave':
        userSummary[userId].leaveDays++;
        break;
      case 'outside-duty':
        userSummary[userId].outsideDutyDays++;
        break;
    }
  });

  // For users who might not have records for all days in the range,
  // we need to get all relevant users and ensure they're in the summary
  let allRelevantUsers = [];
  if (filters.employeeId) {
    const user = await User.findOne({ empId: filters.employeeId });
    if (user) {
      allRelevantUsers = [user];
    }
  } else if (req.user.role === 'manager' || req.user.role === 'director') {
    // If manager or director, get team query based on role
    const teamQuery = getTeamQuery(req.user._id, req.user.role);
    allRelevantUsers = await User.find(teamQuery);
  } else {
    // For admin, get all active users
    allRelevantUsers = await User.find({ isActive: true });
  }

  // Add users who don't have any attendance records in the date range
  allRelevantUsers.forEach(user => {
    const userId = user._id.toString();
    if (!userSummary[userId]) {
      userSummary[userId] = {
        empId: user.empId,
        name: user.name,
        totalDays: 0, // They have zero records in the date range
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        halfDays: 0,
        outsideDutyDays: 0
      };
    }
  });

  // Calculate attendance rate
  const summaryData = Object.values(userSummary).map(user => {
    // For the summary report, we want to show the total days in range
    // But the current logic counts actual records
    // Let's adjust this to be more accurate

    const totalWorkingDays = user.presentDays + user.halfDays * 0.5 + user.outsideDutyDays;
    const attendanceRate = totalDaysInRange > 0 ? (totalWorkingDays / totalDaysInRange) * 100 : 0;

    return {
      ...user,
      totalDays: totalDaysInRange, // Show the actual range total, not just record count
      attendanceRate
    };
  });

  // Sort by attendance rate (descending)
  summaryData.sort((a, b) => b.attendanceRate - a.attendanceRate);

  // Apply limit if specified
  if (limit > 0) {
    return summaryData.slice(0, limit);
  }

  return summaryData;
}

// Stream report directly to client without storing
async function streamReport(req, res) {
  try {
    const { type, format = 'csv', startDate, endDate, filters = {} } = req.body;

    // Validate required fields
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required'
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date is required'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Ensure end date is inclusive

    // Check if dates are valid
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }

    if (isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format'
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    let reportData = [];

    // Generate full report data
    switch (type) {
      case 'attendance':
        reportData = await generateAttendanceReport(req, start, end, filters);
        reportData = generateAttendanceReportData(reportData, startDate, endDate);
        break;
      case 'leave':
        reportData = await generateLeaveReport(req, start, end, filters);
        reportData = generateLeaveReportData(reportData);
        break;
      case 'summary':
        reportData = await generateSummaryReport(req, start, end, filters);
        reportData = generateSummaryReportData(reportData);
        break;
      case 'combined':
        // For combined reports, generate data for all three report types
        const attendanceData = await generateAttendanceReport(req, start, end, filters);
        const leaveData = await generateLeaveReport(req, start, end, filters);
        const summaryData = await generateSummaryReport(req, start, end, filters);

        // Format the data
        const formattedAttendanceData = generateAttendanceReportData(attendanceData, startDate, endDate);
        const formattedLeaveData = generateLeaveReportData(leaveData);
        const formattedSummaryData = generateSummaryReportData(summaryData);

        // Create a multi-sheet Excel workbook
        if (format === 'xlsx') {
          const sheetsData = {
            'Attendance': formattedAttendanceData,
            'Leave': formattedLeaveData,
            'Summary': formattedSummaryData
          };

          const workbook = await createMultiSheetExcel(sheetsData);
          const buffer = await workbookToBuffer(workbook);

          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename=combined_report_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`);
          return res.send(buffer);
        } else {
          // For CSV format, concatenate all data with headers
          let csvContent = '';
          csvContent += '=== ATTENDANCE REPORT ===\n';
          csvContent += convertToCSV(formattedAttendanceData);
          csvContent += '\n\n=== LEAVE REPORT ===\n';
          csvContent += convertToCSV(formattedLeaveData);
          csvContent += '\n\n=== SUMMARY REPORT ===\n';
          csvContent += convertToCSV(formattedSummaryData);

          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=combined_report_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
          return res.send(csvContent);
        }
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Valid types are: attendance, leave, summary, combined'
        });
    }

    // Handle single report types
    if (format === 'xlsx' && type !== 'combined') {
      // Create Excel workbook for single sheet
      const sheetsData = {};
      sheetsData[type.charAt(0).toUpperCase() + type.slice(1)] = reportData;

      const workbook = await createMultiSheetExcel(sheetsData);
      const buffer = await workbookToBuffer(workbook);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`);
      return res.send(buffer);
    } else {
      // Convert to CSV for single report types
      const csvContent = convertToCSV(reportData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
      return res.send(csvContent);
    }
  } catch (error) {
    console.error('Stream report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  generateReport,
  previewReport,
  getMyReports,
  downloadReport,
  deleteReport,
  streamReport
};