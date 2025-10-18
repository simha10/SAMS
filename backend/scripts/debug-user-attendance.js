require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../src/models/Attendance');
const User = require('../src/models/User');

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sams';
console.log('Connecting to MongoDB:', mongoUri);

async function debugUserAttendance() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
    
    // Find all users
    const allUsers = await User.find({});
    console.log('\nAll users:');
    allUsers.forEach(user => {
      console.log(`- ${user.empId} (${user.name}): ${user._id} - Role: ${user.role}`);
    });
    
    // Find Alice specifically
    const alice = await User.findOne({ empId: 'EMP001' });
    console.log('\nAlice:', alice);
    
    // Find manager
    const manager = await User.findOne({ empId: 'MGR001' });
    console.log('\nManager:', manager);
    
    // Check attendance records for today
    const today = new Date().toISOString().split('T')[0];
    console.log(`\nChecking attendance for today (${today}):`);
    
    const attendanceRecords = await Attendance.find({ date: today });
    console.log(`Found ${attendanceRecords.length} attendance records:`);
    attendanceRecords.forEach(record => {
      console.log(`- User ID: ${record.userId} - Date: ${record.date} - Status: ${record.status}`);
    });
    
    // Check specifically for Alice's attendance
    if (alice) {
      console.log(`\nChecking attendance for Alice (${alice._id}):`);
      const aliceAttendance = await Attendance.find({ userId: alice._id });
      console.log(`Found ${aliceAttendance.length} records for Alice:`);
      aliceAttendance.forEach(record => {
        console.log(`- Date: ${record.date} - Status: ${record.status}`);
      });
    }
    
    // Check specifically for manager's attendance
    if (manager) {
      console.log(`\nChecking attendance for Manager (${manager._id}):`);
      const managerAttendance = await Attendance.find({ userId: manager._id });
      console.log(`Found ${managerAttendance.length} records for Manager:`);
      managerAttendance.forEach(record => {
        console.log(`- Date: ${record.date} - Status: ${record.status}`);
      });
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugUserAttendance();