const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables only when PLATFORM is not 'gcp'
if (process.env.PLATFORM !== 'gcp') {
    dotenv.config();
}

// Import models
const Attendance = require('../src/models/Attendance');
const User = require('../src/models/User');

/**
 * Diagnostic script - Shows current attendance status for today
 */
async function diagnoseAttendance() {
  try {
    console.log('=== ATTENDANCE DIAGNOSTIC SCRIPT STARTED ===');
    console.log('Time:', new Date().toISOString());
    
    // Connect to database
    console.log('Connecting to database...');
    const connectDB = require('../src/config/database');
    await connectDB();
    console.log('Database connected successfully');
    
    // Get today's date (date only, no time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('\n--- TODAY\'S DATE RANGE ---');
    console.log('From:', today.toISOString());
    console.log('To:', tomorrow.toISOString());
    
    // Find ALL attendance records for today
    const allTodayRecords = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('userId', 'name empId');
    
    console.log(`\n--- ALL ATTENDANCE RECORDS FOR TODAY (${allTodayRecords.length} found) ---`);
    allTodayRecords.forEach((record, index) => {
      console.log(`${index + 1}. User: ${record.userId?.name || 'Unknown'} (${record.userId?.empId || 'Unknown ID'})`);
      console.log(`   Check-in: ${record.checkInTime ? record.checkInTime.toISOString() : 'None'}`);
      console.log(`   Check-out: ${record.checkOutTime ? record.checkOutTime.toISOString() : 'None'}`);
      console.log(`   Status: ${record.status || 'Not set'}`);
      console.log(`   Flagged: ${record.flagged ? 'Yes' : 'No'}`);
      console.log('   ---');
    });
    
    // Find records with check-in but no check-out
    const checkInNoCheckOut = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      checkInTime: { $exists: true, $ne: null },
      $or: [
        { checkOutTime: { $exists: false } },
        { checkOutTime: null }
      ]
    }).populate('userId', 'name empId');
    
    console.log(`\n--- RECORDS WITH CHECK-IN BUT NO CHECK-OUT (${checkInNoCheckOut.length} found) ---`);
    checkInNoCheckOut.forEach((record, index) => {
      console.log(`${index + 1}. User: ${record.userId?.name || 'Unknown'} (${record.userId?.empId || 'Unknown ID'})`);
      console.log(`   Check-in: ${record.checkInTime.toISOString()}`);
      console.log(`   Check-out: ${record.checkOutTime ? record.checkOutTime.toISOString() : 'None'}`);
      console.log(`   Status: ${record.status || 'Not set'}`);
      console.log('   ---');
    });
    
    // Find records with no check-in
    const noCheckIn = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      $or: [
        { checkInTime: { $exists: false } },
        { checkInTime: null }
      ]
    }).populate('userId', 'name empId');
    
    console.log(`\n--- RECORDS WITH NO CHECK-IN (${noCheckIn.length} found) ---`);
    noCheckIn.forEach((record, index) => {
      console.log(`${index + 1}. User: ${record.userId?.name || 'Unknown'} (${record.userId?.empId || 'Unknown ID'})`);
      console.log(`   Check-in: ${record.checkInTime ? record.checkInTime.toISOString() : 'None'}`);
      console.log(`   Check-out: ${record.checkOutTime ? record.checkOutTime.toISOString() : 'None'}`);
      console.log(`   Status: ${record.status || 'Not set'}`);
      console.log('   ---');
    });
    
    console.log('\n=== DIAGNOSTIC SCRIPT COMPLETED ===');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error in diagnostic script:', error);
    
    // Close database connection if it was opened
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  diagnoseAttendance();
}

module.exports = diagnoseAttendance;