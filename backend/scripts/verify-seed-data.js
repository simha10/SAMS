const mongoose = require('mongoose');
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const LeaveRequest = require('../src/models/LeaveRequest');
const NotificationLog = require('../src/models/NotificationLog');
require('dotenv').config();

const verifySeededData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Verify Users
    console.log('\n=== USERS ===');
    const users = await User.find({}).select('empId name role isActive');
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.empId}: ${user.name} (${user.role}) - ${user.isActive ? 'Active' : 'Inactive'}`);
    });

    // Verify Attendance Records
    console.log('\n=== ATTENDANCE RECORDS ===');
    const attendanceCount = await Attendance.countDocuments();
    console.log(`Total attendance records: ${attendanceCount}`);

    // Get attendance stats
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Attendance status breakdown:');
    attendanceStats.forEach(stat => {
      console.log(`- ${stat._id}: ${stat.count}`);
    });

    // Get attendance by user
    const attendanceByUser = await Attendance.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: '$user.empId',
          name: { $first: '$user.name' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    console.log('Attendance records by user:');
    attendanceByUser.forEach(user => {
      console.log(`- ${user._id} (${user.name}): ${user.count} records`);
    });

    // Verify Leave Requests
    console.log('\n=== LEAVE REQUESTS ===');
    const leaveCount = await LeaveRequest.countDocuments();
    console.log(`Total leave requests: ${leaveCount}`);

    const leaveStats = await LeaveRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Leave request status breakdown:');
    leaveStats.forEach(stat => {
      console.log(`- ${stat._id}: ${stat.count}`);
    });

    const leaveTypes = await LeaveRequest.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Leave request types:');
    leaveTypes.forEach(type => {
      console.log(`- ${type._id}: ${type.count}`);
    });

    // Verify Notifications
    console.log('\n=== NOTIFICATIONS ===');
    const notificationCount = await NotificationLog.countDocuments();
    console.log(`Total notifications: ${notificationCount}`);

    const notificationTypes = await NotificationLog.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Notification types:');
    notificationTypes.forEach(type => {
      console.log(`- ${type._id}: ${type.count}`);
    });

    // Sample data verification
    console.log('\n=== SAMPLE DATA VERIFICATION ===');

    // Get one attendance record with user details
    const sampleAttendance = await Attendance.findOne()
      .populate('userId', 'empId name')
      .limit(1);
    if (sampleAttendance) {
      console.log('Sample attendance record:');
      console.log(`- User: ${sampleAttendance.userId?.empId} (${sampleAttendance.userId?.name})`);
      console.log(`- Date: ${sampleAttendance.date}`);
      console.log(`- Status: ${sampleAttendance.status}`);
      console.log(`- Check-in: ${sampleAttendance.checkInTime}`);
      console.log(`- Check-out: ${sampleAttendance.checkOutTime}`);
      console.log(`- Working hours: ${sampleAttendance.workingHours}`);
    }

    // Get one leave request with user details
    const sampleLeave = await LeaveRequest.findOne()
      .populate('userId', 'empId name')
      .populate('approvedBy', 'empId name')
      .limit(1);
    if (sampleLeave) {
      console.log('\nSample leave request:');
      console.log(`- User: ${sampleLeave.userId?.empId} (${sampleLeave.userId?.name})`);
      console.log(`- Type: ${sampleLeave.type}`);
      console.log(`- Status: ${sampleLeave.status}`);
      console.log(`- Dates: ${sampleLeave.startDate} to ${sampleLeave.endDate}`);
      console.log(`- Reason: ${sampleLeave.reason}`);
      if (sampleLeave.approvedBy) {
        console.log(`- Approved by: ${sampleLeave.approvedBy.empId} (${sampleLeave.approvedBy.name})`);
      }
    }

    // Get one notification
    const sampleNotification = await NotificationLog.findOne().limit(1);
    if (sampleNotification) {
      console.log('\nSample notification:');
      console.log(`- Type: ${sampleNotification.type}`);
      console.log(`- Title: ${sampleNotification.title}`);
      console.log(`- Message: ${sampleNotification.message}`);
      console.log(`- Recipients: ${sampleNotification.recipients?.length || 0}`);
    }

    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('✅ All data models have been seeded successfully!');

  } catch (error) {
    console.error('Error verifying seeded data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run verification
verifySeededData();
