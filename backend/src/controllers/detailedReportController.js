const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { createDetailedAttendanceExcel, convertDetailedAttendanceToCSV } = require('../utils/detailedAttendanceReport');

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

// Generate detailed attendance report
async function generateDetailedAttendanceReport(req, res) {
    try {
        const { format = 'csv', startDate, endDate, filters = {} } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Validate dates
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

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Ensure end date is inclusive

        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        // Build query
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
                return res.status(400).json({
                    success: false,
                    message: 'Employee not found with provided employee ID'
                });
            }
        } else if (req.user.role === 'manager' || req.user.role === 'director') {
            // If manager or director, get team query based on role
            const teamQuery = getTeamQuery(userId, userRole);
            const teamMembers = await User.find(teamQuery);
            const teamMemberIds = teamMembers.map(member => member._id);
            query.userId = { $in: teamMemberIds };
        }

        // Get attendance records with populated user and branch data
        const attendanceRecords = await Attendance.find(query)
            .sort({ date: 1 })
            .populate('userId', 'empId name')
            .populate('branch', 'name location radius');

        // Generate report based on format
        if (format === 'xlsx') {
            // Generate Excel report
            const workbook = await createDetailedAttendanceExcel(attendanceRecords);
            const buffer = await workbook.xlsx.writeBuffer();

            // Set headers for Excel download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="detailed_attendance_report.xlsx"');

            return res.send(buffer);
        } else {
            // Generate CSV report
            const csvData = convertDetailedAttendanceToCSV(attendanceRecords);

            // Set headers for CSV download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="detailed_attendance_report.csv"');

            return res.send(csvData);
        }
    } catch (error) {
        console.error('Generate detailed attendance report error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    generateDetailedAttendanceReport
};