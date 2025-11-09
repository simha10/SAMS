const ExcelJS = require('exceljs');

// Generate attendance report data in the required format
function generateAttendanceReportData(attendanceRecords, startDate, endDate) {
  // Handle empty records
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return [{
      'Employee ID': 'No Data',
      'Employee Name': 'No records found for the selected period',
      'Day 1': '', 'Day 2': '', 'Day 3': '', 'Day 4': '', 'Day 5': '',
      'Day 6': '', 'Day 7': '', 'Day 8': '', 'Day 9': '', 'Day 10': '',
      'Day 11': '', 'Day 12': '', 'Day 13': '', 'Day 14': '', 'Day 15': '',
      'Day 16': '', 'Day 17': '', 'Day 18': '', 'Day 19': '', 'Day 20': '',
      'Day 21': '', 'Day 22': '', 'Day 23': '', 'Day 24': '', 'Day 25': '',
      'Day 26': '', 'Day 27': '', 'Day 28': '', 'Day 29': '', 'Day 30': '',
      'Day 31': '',
      'Total Days': 0,
      'Present Days': 0,
      'Absent Days': 0,
      'Half Days': 0,
      'Leave Days': 0,
      'Outside Duty Days': 0
    }];
  }
  
  // Calculate total days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Set end date to end of day to include the entire last day
  end.setHours(23, 59, 59, 999);
  // Calculate difference in days (inclusive)
  const timeDiff = end.getTime() - start.getTime();
  const totalDaysInRange = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
  
  // Group records by employee
  const employeeData = {};
  
  attendanceRecords.forEach(record => {
    const user = record.userId;
    const recordDate = new Date(record.date);
    const dayOfMonth = recordDate.getDate(); // Get day of month (1-31)
    
    if (!employeeData[user._id]) {
      employeeData[user._id] = {
        'Employee ID': user.empId,
        'Employee Name': user.name,
        'Day 1': '', 'Day 2': '', 'Day 3': '', 'Day 4': '', 'Day 5': '',
        'Day 6': '', 'Day 7': '', 'Day 8': '', 'Day 9': '', 'Day 10': '',
        'Day 11': '', 'Day 12': '', 'Day 13': '', 'Day 14': '', 'Day 15': '',
        'Day 16': '', 'Day 17': '', 'Day 18': '', 'Day 19': '', 'Day 20': '',
        'Day 21': '', 'Day 22': '', 'Day 23': '', 'Day 24': '', 'Day 25': '',
        'Day 26': '', 'Day 27': '', 'Day 28': '', 'Day 29': '', 'Day 30': '',
        'Day 31': '',
        'Total Days': totalDaysInRange, // Total days in range
        'Present Days': 0,
        'Absent Days': 0,
        'Half Days': 0,
        'Leave Days': 0,
        'Outside Duty Days': 0
      };
    }
    
    // Map status to required format and count different statuses
    let status = ''; // Default to empty
    switch (record.status) {
      case 'present':
        status = 'P';
        employeeData[user._id]['Present Days']++;
        break;
      case 'absent':
        status = 'A';
        // Don't increment absent days here, we'll calculate it at the end
        break;
      case 'half-day':
        status = '1/2';
        employeeData[user._id]['Half Days']++;
        break;
      case 'on-leave':
        status = 'L';
        employeeData[user._id]['Leave Days']++;
        break;
      case 'outside-duty':
        status = 'OD';
        employeeData[user._id]['Outside Duty Days']++;
        break;
    }
    
    // Set the status for this day
    if (dayOfMonth >= 1 && dayOfMonth <= 31) {
      employeeData[user._id][`Day ${dayOfMonth}`] = status;
    }
  });
  
  // Convert to array and calculate absent days
  const result = Object.values(employeeData).map(employee => {
    // Calculate absent days as per the formula:
    // Total Absents = Total Days - Present Days - Half Days - Leave Days
    const present = employee['Present Days'];
    const halfDays = employee['Half Days'];
    const leaveDays = employee['Leave Days'];
    const outsideDutyDays = employee['Outside Duty Days'];
    
    // Calculate absent days based on the formula provided
    employee['Absent Days'] = employee['Total Days'] - present - halfDays - leaveDays - outsideDutyDays;
    
    return employee;
  });
  
  // Ensure we always have headers by returning at least one row
  return result.length > 0 ? result : [{
    'Employee ID': 'No Data',
    'Employee Name': 'No records found',
    'Day 1': '', 'Day 2': '', 'Day 3': '', 'Day 4': '', 'Day 5': '',
    'Day 6': '', 'Day 7': '', 'Day 8': '', 'Day 9': '', 'Day 10': '',
    'Day 11': '', 'Day 12': '', 'Day 13': '', 'Day 14': '', 'Day 15': '',
    'Day 16': '', 'Day 17': '', 'Day 18': '', 'Day 19': '', 'Day 20': '',
    'Day 21': '', 'Day 22': '', 'Day 23': '', 'Day 24': '', 'Day 25': '',
    'Day 26': '', 'Day 27': '', 'Day 28': '', 'Day 29': '', 'Day 30': '',
    'Day 31': '',
    'Total Days': totalDaysInRange,
    'Present Days': 0,
    'Absent Days': totalDaysInRange,
    'Half Days': 0,
    'Leave Days': 0,
    'Outside Duty Days': 0
  }];
}

// Generate leave report data
function generateLeaveReportData(leaveRequests) {
  // Handle empty records
  if (!leaveRequests || leaveRequests.length === 0) {
    return [{
      'Employee Name': 'No leave requests found for the selected period',
      'Leave Applied Date': '',
      'From Date': '',
      'Is From Date Half Day': '',
      'Last Date': '',
      'Is Last Day Half Day': ''
    }];
  }
  
  return leaveRequests.map(request => {
    const user = request.userId;
    return {
      'Employee Name': user.name,
      'Leave Applied Date': request.createdAt ? request.createdAt.toISOString().split('T')[0] : '',
      'From Date': request.startDate ? request.startDate.toISOString().split('T')[0] : '',
      'Is From Date Half Day': request.isHalfDayStart ? 'Yes' : 'No',
      'Last Date': request.endDate ? request.endDate.toISOString().split('T')[0] : '',
      'Is Last Day Half Day': request.isHalfDayEnd ? 'Yes' : 'No'
    };
  });
}

// Generate summary report data
function generateSummaryReportData(summaryData) {
  // Handle empty records
  if (!summaryData || summaryData.length === 0) {
    return [{
      'Employee ID': 'No Data',
      'Employee Name': 'No attendance records found for the selected period',
      'Total Days': 0,
      'Present Days': 0,
      'Absent Days': 0,
      'Leave Days': 0,
      'Half Days': 0,
      'Outside Duty Days': 0,
      'Attendance Rate': '0%'
    }];
  }
  
  return summaryData.map(item => {
    // Calculate the attendance rate properly
    const totalWorkingDays = item.presentDays + item.halfDays * 0.5;
    const attendanceRate = item.totalDays > 0 ? ((totalWorkingDays / item.totalDays) * 100).toFixed(2) + '%' : '0%';
    
    return {
      'Employee ID': item.empId,
      'Employee Name': item.name,
      'Total Days': item.totalDays,
      'Present Days': item.presentDays,
      'Absent Days': item.absentDays,
      'Leave Days': item.leaveDays,
      'Half Days': item.halfDays,
      'Outside Duty Days': item.outsideDutyDays,
      'Attendance Rate': attendanceRate
    };
  });
}

// Convert array of objects to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Create a multi-sheet Excel workbook
async function createMultiSheetExcel(sheetsData) {
  const workbook = new ExcelJS.Workbook();
  
  // Add each sheet to the workbook
  for (const [sheetName, sheetData] of Object.entries(sheetsData)) {
    const worksheet = workbook.addWorksheet(sheetName);
    
    if (sheetData.length > 0) {
      // Add headers
      const headers = Object.keys(sheetData[0]);
      worksheet.addRow(headers);
      
      // Add data rows
      sheetData.forEach(row => {
        const values = headers.map(header => row[header]);
        worksheet.addRow(values);
      });
      
      // Format headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };
      
      // Apply conditional formatting for attendance status
      if (sheetName === 'Attendance') {
        // Apply styling for status columns
        for (let i = 3; i <= 33; i++) { // Day 1 to Day 31 columns
          const column = worksheet.getColumn(i);
          column.eachCell((cell, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
              const value = cell.value;
              if (value === 'P') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFD4EDDA' } // Light green for Present
                };
                cell.font = { color: { argb: 'FF155724' } }; // Dark green text
              } else if (value === 'A') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF8D7DA' } // Light red for Absent
                };
                cell.font = { color: { argb: 'FF721C24' } }; // Dark red text
              } else if (value === 'L') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFF3CD' } // Light yellow for Leave
                };
                cell.font = { color: { argb: 'FF856404' } }; // Dark yellow text
              } else if (value === '1/2') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFCCE7FF' } // Light blue for Half Day
                };
                cell.font = { color: { argb: 'FF004085' } }; // Dark blue text
              } else if (value === 'OD') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFD1ECF1' } // Light cyan for Outside Duty
                };
                cell.font = { color: { argb: 'FF0C5460' } }; // Dark cyan text
              }
            }
          });
        }
      }
    }
  }
  
  return workbook;
}

// Convert workbook to buffer
async function workbookToBuffer(workbook) {
  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  generateAttendanceReportData,
  generateLeaveReportData,
  generateSummaryReportData,
  convertToCSV,
  createMultiSheetExcel,
  workbookToBuffer
};