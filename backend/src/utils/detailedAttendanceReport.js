const ExcelJS = require('exceljs');

// Generate detailed attendance report data including branch and distance information
function generateDetailedAttendanceReportData(attendanceRecords) {
    // Handle empty records
    if (!attendanceRecords || attendanceRecords.length === 0) {
        return [{
            'Employee ID': 'No Data',
            'Employee Name': 'No records found',
            'Date': '',
            'Check In Time': '',
            'Check Out Time': '',
            'Working Hours': '',
            'Status': '',
            'Flagged': '',
            'Flagged Reason': '',
            'Branch': '',
            'Distance From Branch (m)': '',
            'Check In Location': '',
            'Check Out Location': ''
        }];
    }

    return attendanceRecords.map(record => {
        const user = record.userId;
        const branch = record.branch;

        // Format locations
        const checkInLocation = record.location?.checkIn ?
            `${record.location.checkIn.lat}, ${record.location.checkIn.lng}` : '';
        const checkOutLocation = record.location?.checkOut ?
            `${record.location.checkOut.lat}, ${record.location.checkOut.lng}` : '';

        // Format working hours
        const workingHours = record.workingHours ?
            `${Math.floor(record.workingHours / 60)}h ${record.workingHours % 60}m` : '';

        return {
            'Employee ID': user.empId,
            'Employee Name': user.name,
            'Date': record.date ? record.date.toISOString().split('T')[0] : '',
            'Check In Time': record.checkInTime ? record.checkInTime.toLocaleTimeString() : '',
            'Check Out Time': record.checkOutTime ? record.checkOutTime.toLocaleTimeString() : '',
            'Working Hours': workingHours,
            'Status': record.status || '',
            'Flagged': record.flagged ? 'Yes' : 'No',
            'Flagged Reason': record.flaggedReason || '',
            'Branch': branch ? branch.name : 'N/A',
            'Distance From Branch (m)': record.distanceFromBranch !== undefined ?
                record.distanceFromBranch.toFixed(2) : 'N/A',
            'Check In Location': checkInLocation,
            'Check Out Location': checkOutLocation
        };
    });
}

// Create detailed attendance Excel report
async function createDetailedAttendanceExcel(attendanceRecords) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detailed Attendance');

    // Generate report data
    const reportData = generateDetailedAttendanceReportData(attendanceRecords);

    if (reportData.length > 0) {
        // Add headers
        const headers = Object.keys(reportData[0]);
        worksheet.addRow(headers);

        // Add data rows
        reportData.forEach(row => {
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

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = 20;
        });

        // Apply conditional formatting for flagged records
        const flaggedColumnIndex = headers.indexOf('Flagged') + 1;
        if (flaggedColumnIndex > 0) {
            worksheet.getColumn(flaggedColumnIndex).eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && cell.value === 'Yes') { // Skip header row
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFF3CD' } // Light yellow for flagged records
                    };
                    cell.font = { color: { argb: 'FF856404' } }; // Dark yellow text
                }
            });
        }
    }

    return workbook;
}

// Convert detailed attendance data to CSV
function convertDetailedAttendanceToCSV(attendanceRecords) {
    const reportData = generateDetailedAttendanceReportData(attendanceRecords);

    if (!reportData || reportData.length === 0) return '';

    const headers = Object.keys(reportData[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of reportData) {
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

module.exports = {
    generateDetailedAttendanceReportData,
    createDetailedAttendanceExcel,
    convertDetailedAttendanceToCSV
};