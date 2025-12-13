const ExcelJS = require('exceljs');
const { getDateSequence, formatDateToMMMDD } = require('./dateUtils');

// Generate attendance report data in the required format
function generateAttendanceReportData(attendanceRecords, startDate, endDate) {
  // SYSTEM_ATTENDANCE_START_DATE constant
  const SYSTEM_ATTENDANCE_START_DATE = new Date('2025-12-03');
  
  // Handle empty records
  if (!attendanceRecords || attendanceRecords.length === 0) {
    // Generate date headers
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Adjust start date to be no earlier than system start date
    const adjustedStart = start < SYSTEM_ATTENDANCE_START_DATE ? SYSTEM_ATTENDANCE_START_DATE : start;
    
    const dateSequence = getDateSequence(adjustedStart, end);
    
    // Create initial row with date headers
    const emptyRow = {
      'Employee ID': 'No Data',
      'Employee Name': 'No records found for the selected period'
    };
    
    // Add date columns
    dateSequence.forEach(date => {
      const dateHeader = formatDateToMMMDD(date);
      emptyRow[dateHeader] = '';
    });
    
    // Add summary columns
    emptyRow['Total Days'] = dateSequence.length;
    emptyRow['Present Days'] = 0;
    emptyRow['Absent Days'] = 0;
    emptyRow['Half Days'] = 0;
    emptyRow['Leave Days'] = 0;
    emptyRow['Outside Duty Days'] = 0;
    
    return [emptyRow];
  }
  
  // Calculate total days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Adjust start date to be no earlier than system start date
  const adjustedStart = start < SYSTEM_ATTENDANCE_START_DATE ? SYSTEM_ATTENDANCE_START_DATE : start;
  
  const dateSequence = getDateSequence(adjustedStart, end);
  const totalDaysInRange = dateSequence.length;
  
  // Create a map of all dates to their formatted headers
  const dateHeaderMap = {};
  dateSequence.forEach(date => {
    // Get date in local format to match our record processing
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const dateHeader = formatDateToMMMDD(date);
    dateHeaderMap[dateString] = dateHeader;
  });
  
  // Group records by employee
  const employeeData = {};
  
  // Initialize all employees with empty data for all dates
  attendanceRecords.forEach(record => {
    const user = record.userId;
    
    if (!employeeData[user._id]) {
      employeeData[user._id] = {
        'Employee ID': user.empId,
        'Employee Name': user.name,
        'createdAt': user.createdAt // Store user creation date for effective date calculation
      };
      
      // Initialize all date columns with empty values
      dateSequence.forEach(date => {
        const dateHeader = formatDateToMMMDD(date);
        employeeData[user._id][dateHeader] = '';
      });
      
      // Initialize summary columns
      employeeData[user._id]['Total Days'] = 0;
      employeeData[user._id]['Present Days'] = 0;
      employeeData[user._id]['Absent Days'] = 0;
      employeeData[user._id]['Half Days'] = 0;
      employeeData[user._id]['Leave Days'] = 0;
      employeeData[user._id]['Outside Duty Days'] = 0;
    }
  });
  
  // Populate attendance data
  attendanceRecords.forEach(record => {
    const user = record.userId;
    const recordDate = record.date;
    // Get date in local format to match our dateHeaderMap
    const year = recordDate.getFullYear();
    const month = String(recordDate.getMonth() + 1).padStart(2, '0');
    const day = String(recordDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Map status to required format and count different statuses
    let status = ''; // Default to empty
    switch (record.status) {
      case 'present':
        status = 'P';
        employeeData[user._id]['Present Days']++;
        break;
      case 'absent':
        status = 'A';
        employeeData[user._id]['Absent Days']++;
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
    
    // Set the status for this date if it exists in our range
    if (dateHeaderMap[dateString]) {
      const dateHeader = dateHeaderMap[dateString];
      employeeData[user._id][dateHeader] = status;
    }
  });
  
  // Convert to array and calculate absent days with effective date logic
  const result = Object.values(employeeData).map(employee => {
    // Calculate effective start date for this employee
    const employeeCreatedAt = new Date(employee.createdAt);
    const effectiveStartDate = new Date(
      Math.max(
        adjustedStart.getTime(),
        SYSTEM_ATTENDANCE_START_DATE.getTime(),
        employeeCreatedAt.getTime()
      )
    );
    
    // Count total days from effective start date to end date
    const effectiveDateSequence = getDateSequence(effectiveStartDate, end);
    const effectiveTotalDays = effectiveDateSequence.length;
    
    // Update employee data with effective total days
    employee['Total Days'] = effectiveTotalDays;
    
    // Apply cell rendering rules: for dates before effective start date, show '-'
    dateSequence.forEach(date => {
      // Check if date is before effective start date
      if (date < effectiveStartDate) {
        const dateHeader = formatDateToMMMDD(date);
        employee[dateHeader] = '-';
      }
    });
    
    // Direct counting: Total Days = Present + Absent + Half + Leave + OD
    const present = employee['Present Days'];
    const absent = employee['Absent Days'];
    const halfDays = employee['Half Days'];
    const leaveDays = employee['Leave Days'];
    const outsideDutyDays = employee['Outside Duty Days'];
    
    // Calculate total days as sum of all types
    employee['Total Days'] = present + absent + halfDays + leaveDays + outsideDutyDays;
    
    // Remove the createdAt field as it's not needed in the final output
    delete employee.createdAt;
    
    return employee;
  });
  
  // Ensure we always have headers by returning at least one row
  if (result.length === 0) {
    // Generate date headers
    const emptyRow = {
      'Employee ID': 'No Data',
      'Employee Name': 'No records found'
    };
    
    // Add date columns
    dateSequence.forEach(date => {
      const dateHeader = formatDateToMMMDD(date);
      emptyRow[dateHeader] = '';
    });
    
    // Add summary columns
    emptyRow['Total Days'] = 0;
    emptyRow['Present Days'] = 0;
    emptyRow['Absent Days'] = 0;
    emptyRow['Half Days'] = 0;
    emptyRow['Leave Days'] = 0;
    emptyRow['Outside Duty Days'] = 0;
    
    return [emptyRow];
  }
  
  return result;
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

// Create a multi-sheet Excel workbook with streaming
async function createMultiSheetExcel(sheetsData) {
  const workbook = new ExcelJS.Workbook();
  
  // Add each sheet to the workbook
  for (const [sheetName, sheetData] of Object.entries(sheetsData)) {
    const worksheet = workbook.addWorksheet(sheetName);
    
    if (sheetData.length > 0) {
      // Add headers
      const headers = Object.keys(sheetData[0]);
      worksheet.addRow(headers);
      
      // Add data rows with batch processing to prevent memory issues
      const batchSize = 1000;
      for (let i = 0; i < sheetData.length; i += batchSize) {
        const batch = sheetData.slice(i, i + batchSize);
        batch.forEach(row => {
          const values = headers.map(header => {
            // Sanitize data to prevent injection attacks
            const value = row[header];
            if (typeof value === 'string') {
              // Special handling for '1/2' to prevent Excel from interpreting it as a date
              if (value === '1/2') {
                // Prefix with single quote to treat as text
                return "'" + value;
              }
              // Prefix potentially dangerous formulas with a single quote to treat as text
              if (value.startsWith('=') || value.startsWith('+') || value.startsWith('-') || value.startsWith('@')) {
                return "'" + value;
              }
            }
            return value;
          });
          worksheet.addRow(values);
        });
        
        // Allow event loop to process other tasks
        await new Promise(resolve => setImmediate(resolve));
      }
      
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
        // Apply styling for status columns (find columns that match date format)
        const headers = Object.keys(sheetData[0]);
        headers.forEach((header, index) => {
          // Check if header matches MMM-DD format (e.g., NOV-15)
          if (/^[A-Z]{3}-\d{1,2}$/.test(header)) {
            const columnIndex = index + 1; // Excel columns are 1-indexed
            const column = worksheet.getColumn(columnIndex);
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
        });
      }
    }
  }
  
  return workbook;
}

// Convert workbook to buffer with error handling
async function workbookToBuffer(workbook) {
  try {
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error('Error converting workbook to buffer:', error);
    throw new Error('Failed to generate Excel file');
  }
}

module.exports = {
  generateAttendanceReportData,
  generateLeaveReportData,
  generateSummaryReportData,
  convertToCSV,
  createMultiSheetExcel,
  workbookToBuffer
};