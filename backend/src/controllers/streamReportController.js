const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { generateAttendanceReportData, generateLeaveReportData, 
        generateSummaryReportData, convertToCSV, createMultiSheetExcel, 
        workbookToBuffer } = require('../utils/excel');

/**
 * Stream report directly to client without storing on filesystem
 */

// Stream report directly to client
async function streamReport(req, res) {
  try {
    const { type, format = 'csv', startDate, endDate, filters = {} } = req.body;
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
    
    // Generate filename for download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${type}_report_${timestamp}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
    
    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', format === 'xlsx' ? 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
      'text/csv');
    
    let reportData = [];
    
    // Generate report based on type
    switch (type) {
      case 'attendance':
        reportData = await generateAttendanceReport(req, start, end, filters);
        // Format the data for attendance reports
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
        // For combined reports, we'll create a multi-sheet Excel file
        if (format !== 'xlsx') {
          return res.status(400).json({ 
            success: false, 
            message: 'Combined reports must be in Excel format' 
          });
        }
        
        const attendanceData = await generateAttendanceReport(req, start, end, filters);
        const leaveData = await generateLeaveReport(req, start, end, filters);
        const summaryData = await generateSummaryReport(req, start, end, filters);
        
        const excelSheets = {
          'Attendance': generateAttendanceReportData(attendanceData, startDate, endDate),
          'Leave': generateLeaveReportData(leaveData),
          'Summary': generateSummaryReportData(summaryData)
        };
        
        // Create Excel workbook with multiple sheets and stream directly
        const workbook = await createMultiSheetExcel(excelSheets);
        const buffer = await workbookToBuffer(workbook);
        return res.send(buffer);
        
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type' 
        });
    }
    
    // Stream report data directly to client
    if (format === 'xlsx') {
      // Single sheet Excel
      const sheetData = type === 'attendance' ? generateAttendanceReportData(reportData, startDate, endDate) :
                       type === 'leave' ? generateLeaveReportData(reportData) :
                       generateSummaryReportData(reportData);
      
      const workbook = await createMultiSheetExcel({ [type]: sheetData });
      const buffer = await workbookToBuffer(workbook);
      res.send(buffer);
    } else {
      // CSV format
      const csv = convertToCSV(reportData);
      res.send(csv);
    }
  } catch (error) {
    console.error('Stream report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
  } else if (req.user.role === 'manager') {
    // If manager, only get reports for their team members
    const teamMembers = await User.find({ managerId: req.user._id, isActive: true });
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
  } else if (req.user.role === 'manager') {
    // If manager, get all team members
    allRelevantUsers = await User.find({ managerId: req.user._id, isActive: true });
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
  } else if (req.user.role === 'manager') {
    // If manager, only get reports for their team members
    const teamMembers = await User.find({ managerId: req.user._id, isActive: true });
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
  } else if (req.user.role === 'manager') {
    // If manager, only get reports for their team members
    const teamMembers = await User.find({ managerId: req.user._id, isActive: true });
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
  } else if (req.user.role === 'manager') {
    // If manager, get all team members
    allRelevantUsers = await User.find({ managerId: req.user._id, isActive: true });
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

module.exports = {
  streamReport
};