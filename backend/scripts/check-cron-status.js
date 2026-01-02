/**
 * Script to check cron job status and recent attendance records
 * This will help identify issues with auto-checkout and absentee marking
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../src/models/Attendance');
const User = require('../src/models/User');
const cron = require('node-cron');

async function checkCronStatus() {
  console.log('=== CRON JOB STATUS CHECK ===\n');
  
  // Check if MongoDB connection is available
  console.log('1. Checking MongoDB connection...');
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sams');
    console.log('✅ MongoDB connection successful\n');
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return;
  }
  
  // Check recent attendance records around the date in question
  console.log('2. Checking attendance records for 31-12-2025...');
  
  const targetDate = new Date('2025-12-31T00:00:00.000Z');
  const nextDay = new Date('2026-01-01T00:00:00.000Z');
  
  try {
    const attendanceRecords = await Attendance.find({
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    }).populate('userId', 'name empId');
    
    console.log(`Found ${attendanceRecords.length} attendance records for 31-12-2025\n`);
    
    if (attendanceRecords.length > 0) {
      console.log('Attendance records for 31-12-2025:');
      attendanceRecords.forEach((record, index) => {
        console.log(`${index + 1}. Employee: ${record.userId?.name || record.userId} (${record.userId?.empId || 'N/A'})`);
        console.log(`   Check-in: ${record.checkInTime ? new Date(record.checkInTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'None'}`);
        console.log(`   Check-out: ${record.checkOutTime ? new Date(record.checkOutTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'None'}`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Flagged: ${record.flagged} (${record.flaggedReason ? record.flaggedReason.message || record.flaggedReason.type : 'None'})`);
        console.log('   ---');
      });
    }
    
    // Look for auto-checkout records specifically
    console.log('\n3. Checking for auto-checkout records (check-out time around 11:59 PM)...');
    const autoCheckoutRecords = attendanceRecords.filter(record => {
      if (!record.checkOutTime) return false;
      const checkOutIST = new Date(new Date(record.checkOutTime).getTime() + (5.5 * 60 * 60 * 1000));
      const hour = checkOutIST.getHours();
      const minute = checkOutIST.getMinutes();
      return hour === 23 && minute >= 55; // Around 11:55 PM to 11:59 PM
    });
    
    console.log(`Found ${autoCheckoutRecords.length} records with check-out around 11:59 PM IST\n`);
    
    // Look for any records with check-out at 5:29 AM
    console.log('4. Checking for records with check-out at 5:29 AM...');
    const fiveTwentyNineRecords = attendanceRecords.filter(record => {
      if (!record.checkOutTime) return false;
      const checkOutIST = new Date(new Date(record.checkOutTime).getTime() + (5.5 * 60 * 60 * 1000));
      const hour = checkOutIST.getHours();
      const minute = checkOutIST.getMinutes();
      return hour === 5 && minute === 29; // Exactly 5:29 AM
    });
    
    console.log(`Found ${fiveTwentyNineRecords.length} records with check-out at 5:29 AM IST\n`);
    
    if (fiveTwentyNineRecords.length > 0) {
      console.log('Records with check-out at 5:29 AM IST:');
      fiveTwentyNineRecords.forEach((record, index) => {
        console.log(`${index + 1}. Employee: ${record.userId?.name || record.userId} (${record.userId?.empId || 'N/A'})`);
        console.log(`   Check-in: ${record.checkInTime ? new Date(record.checkInTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'None'}`);
        console.log(`   Check-out: ${record.checkOutTime ? new Date(record.checkOutTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'None'}`);
        console.log(`   UTC Check-out: ${record.checkOutTime ? new Date(record.checkOutTime).toISOString() : 'None'}`);
        console.log(`   Status: ${record.status}`);
        console.log('   ---');
      });
    }
    
    // Check for absentee marking by looking for 'absent' status records
    console.log('\n5. Checking for absentee marking records (status: "absent")...');
    const absentRecords = attendanceRecords.filter(record => record.status === 'absent');
    console.log(`Found ${absentRecords.length} absent records for 31-12-2025\n`);
    
    if (absentRecords.length > 0) {
      console.log('Absent records:');
      absentRecords.forEach((record, index) => {
        console.log(`${index + 1}. Employee: ${record.userId?.name || record.userId} (${record.userId?.empId || 'N/A'})`);
        console.log(`   Check-in: ${record.checkInTime ? new Date(record.checkInTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'None'}`);
        console.log(`   Check-out: ${record.checkOutTime ? new Date(record.checkOutTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'None'}`);
        console.log(`   Flagged: ${record.flagged} (${record.flaggedReason ? record.flaggedReason.message || record.flaggedReason.type : 'None'})`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.log('❌ Error checking attendance records:', error.message);
  }
  
  // Check if cron jobs are properly scheduled
  console.log('\n6. Checking cron job scheduling...');
  console.log('Active cron jobs:', cron.getTasks() ? Object.keys(cron.getTasks()).length : 0);
  
  // Check environment variable that might affect cron jobs
  console.log('\n7. Environment variables:');
  console.log('RUN_CRON:', process.env.RUN_CRON || 'Not set (defaults to true)');
  
  // Check for recent attendance records to see if absentee marking is working
  console.log('\n8. Checking recent attendance records (last 7 days) for absentee marking...');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  try {
    const recentRecords = await Attendance.find({
      date: { $gte: sevenDaysAgo }
    }).populate('userId', 'name empId');
    
    console.log(`Found ${recentRecords.length} recent attendance records`);
    
    const recentAbsent = recentRecords.filter(record => record.status === 'absent');
    console.log(`Found ${recentAbsent.length} absent records in the last 7 days`);
    
    if (recentAbsent.length > 0) {
      console.log('\nRecent absent records:');
      recentAbsent.slice(0, 5).forEach((record, index) => {
        console.log(`${index + 1}. Date: ${new Date(record.date).toLocaleDateString()}, Employee: ${record.userId?.name || record.userId}`);
      });
    }
  } catch (error) {
    console.log('❌ Error checking recent records:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n=== CRON STATUS CHECK COMPLETED ===');
}

// Run the check
async function runCheck() {
  try {
    await checkCronStatus();
  } catch (error) {
    console.error('Error running cron status check:', error);
  }
}

runCheck();