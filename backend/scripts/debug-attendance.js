// Load environment variables only when PLATFORM is not 'gcp'
if (process.env.PLATFORM !== 'gcp') {
    require('dotenv').config();
}
const mongoose = require('mongoose');
const Attendance = require('../src/models/Attendance');
const User = require('../src/models/User');

// MongoDB connection
const mongoUri = process.env.MONGO_URI?.trim() || 'mongodb://localhost:27017/sams';
console.log('Connecting to MongoDB:', mongoUri);

async function debugAttendance() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
    
    console.log('Debugging attendance records...');
    
    // Check all attendance records
    const allAttendance = await Attendance.find({});
    console.log('All attendance records:', allAttendance);
    
    // Check specific date
    const targetDate = '2025-10-16';
    console.log(`\nChecking attendance for date: ${targetDate}`);
    
    const attendanceForDate = await Attendance.find({ date: targetDate });
    console.log(`Found ${attendanceForDate.length} records for ${targetDate}:`, attendanceForDate);
    
    // Check specific user
    const userId = '68f0be35db77baa5a691f1d2'; // Alice's user ID from the record
    console.log(`\nChecking attendance for user ID: ${userId}`);
    
    const attendanceForUser = await Attendance.find({ userId: userId });
    console.log(`Found ${attendanceForUser.length} records for user ${userId}:`, attendanceForUser);
    
    // Check specific user and date
    console.log(`\nChecking attendance for user ${userId} on date ${targetDate}`);
    const attendanceForUserAndDate = await Attendance.find({ 
      userId: userId,
      date: targetDate
    });
    console.log(`Found ${attendanceForUserAndDate.length} records:`, attendanceForUserAndDate);
    
    // Check all users
    console.log('\nChecking all users:');
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users:`, allUsers.map(u => ({ 
      id: u._id, 
      empId: u.empId, 
      name: u.name,
      managerId: u.managerId
    })));
    
    // Check Alice specifically
    console.log('\nChecking Alice (EMP001):');
    const alice = await User.findOne({ empId: 'EMP001' });
    console.log('Alice user record:', alice);
    
    // Check team members for Alice's manager
    if (alice && alice.managerId) {
      console.log(`\nChecking team members for manager ${alice.managerId}:`);
      const teamMembers = await User.find({ 
        managerId: alice.managerId,
        isActive: true 
      }).select('_id empId name email');
      console.log(`Found ${teamMembers.length} team members:`, teamMembers);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugAttendance();