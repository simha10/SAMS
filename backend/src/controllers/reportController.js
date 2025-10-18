const Report = require('../models/Report');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { generateAttendanceReportData, generateLeaveReportData, 
        generateSummaryReportData, convertToCSV, createMultiSheetExcel, 
        workbookToBuffer } = require('../utils/excel');
const fs = require('fs');
const path = require('path');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate report
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
    
    let reportData = [];
    let recordCount = 0;
    
    // Generate report based on type
    switch (type) {
      case 'attendance':
        reportData = await generateAttendanceReport(req, start, end, filters);
        // Format the data for attendance reports
        reportData = generateAttendanceReportData(reportData);
        recordCount = reportData.length;
        break;
      case 'leave':
        reportData = await generateLeaveReport(req, start, end, filters);
        reportData = generateLeaveReportData(reportData);
        recordCount = reportData.length;
        break;
      case 'summary':
        reportData = await generateSummaryReport(req, start, end, filters);
        reportData = generateSummaryReportData(reportData);
        recordCount = reportData.length;
        break;
      case 'combined':
        // For combined reports, we'll create a multi-sheet Excel file
        if (format !== 'xlsx') {
          return res.status(400).json({ 
            success: false, 
            message: 'Combined reports must be in Excel format' 
          });
        }
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report type' 
        });
    }
    
    // For combined reports, generate all three reports
    let excelSheets = null;
    if (type === 'combined') {
      const attendanceData = await generateAttendanceReport(req, start, end, filters);
      const leaveData = await generateLeaveReport(req, start, end, filters);
      const summaryData = await generateSummaryReport(req, start, end, filters);
      
      excelSheets = {
        'Attendance': generateAttendanceReportData(attendanceData),
        'Leave': generateLeaveReportData(leaveData),
        'Summary': generateSummaryReportData(summaryData)
      };
      
      recordCount = Math.max(
        attendanceData.length, 
        leaveData.length, 
        summaryData.length
      );
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${type}_report_${timestamp}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
    const filePath = path.join(reportsDir, fileName);
    
    // Save report data to file
    if (type === 'combined') {
      // Create Excel workbook with multiple sheets
      const workbook = await createMultiSheetExcel(excelSheets);
      const buffer = await workbookToBuffer(workbook);
      fs.writeFileSync(filePath, buffer);
    } else if (format === 'xlsx') {
      // Single sheet Excel
      const sheetData = type === 'attendance' ? generateAttendanceReportData(reportData) :
                       type === 'leave' ? generateLeaveReportData(reportData) :
                       generateSummaryReportData(reportData);
      
      const workbook = await createMultiSheetExcel({ [type]: sheetData });
      const buffer = await workbookToBuffer(workbook);
      fs.writeFileSync(filePath, buffer);
    } else {
      // CSV format
      const csv = convertToCSV(reportData);
      fs.writeFileSync(filePath, csv);
    }
    
    // Save report metadata
    const report = new Report({
      title,
      type,
      format: format === 'xlsx' ? 'xlsx' : 'csv',
      startDate: start,
      endDate: end,
      filters,
      fileName,
      recordCount,
      generatedBy: userId
    });
    
    await report.save();
    
    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        report
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Preview report
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
        reportData = generateAttendanceReportData(reportData);
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
        const formattedAttendanceData = generateAttendanceReportData(attendanceData);
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

// Get user's reports
async function getMyReports(req, res) {
  try {
    const userId = req.user._id;
    const { type } = req.query;
    
    const filter = { generatedBy: userId };
    if (type) {
      filter.type = type;
    }
    
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        reports,
        total: reports.length
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Download report
async function downloadReport(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const report = await Report.findOne({ _id: id, generatedBy: userId });
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }
    
    const filePath = path.join(reportsDir, report.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report file not found' 
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.setHeader('Content-Type', report.format === 'xlsx' ? 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
      'text/csv');
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Delete report
async function deleteReport(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the report
    const report = await Report.findOne({ _id: id, generatedBy: userId });
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found or you do not have permission to delete it' 
      });
    }
    
    // Delete the report file from filesystem
    const filePath = path.join(reportsDir, report.fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileError) {
        console.error('Error deleting report file:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }
    
    // Delete the report from database
    await Report.deleteOne({ _id: id, generatedBy: userId });
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
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
  
  return await Attendance.find(query, null, options)
    .populate('userId', 'empId name');
}

// Helper function to generate leave report data
async function generateLeaveReport(req, start, end, filters, limit = 0) {
  const query = {
    startDate: {
      $gte: start,
      $lte: end
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
  
  const options = { sort: { startDate: -1 } };
  if (limit > 0) {
    options.limit = limit;
  }
  
  return await LeaveRequest.find(query, null, options)
    .populate('userId', 'empId name');
}

// Helper function to generate summary report data
async function generateSummaryReport(req, start, end, filters, limit = 0) {
  const query = {
    date: {
      $gte: start,
      $lte: end
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
  
  // Calculate attendance rate
  const summaryData = Object.values(userSummary).map(user => {
    const totalWorkingDays = user.presentDays + user.halfDays * 0.5;
    const attendanceRate = user.totalDays > 0 ? (totalWorkingDays / user.totalDays) * 100 : 0;
    
    return {
      ...user,
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
  generateReport,
  previewReport,
  getMyReports,
  downloadReport,
  deleteReport
};