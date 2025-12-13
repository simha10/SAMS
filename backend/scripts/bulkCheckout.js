const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Import models
const Attendance = require('../src/models/Attendance');
const User = require('../src/models/User');

// Import utilities
const { formatWorkingHours } = require('../src/utils/haversine');

/**
 * Bulk checkout script - Performs checkout at 18:10 for all users 
 * who have checked in today but haven't checked out yet
 */
async function bulkCheckout() {
  try {
    console.log('=== BULK CHECKOUT SCRIPT STARTED ===');
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
    
    // Find all attendance records for today where:
    // 1. checkIn exists
    // 2. checkOut is null or doesn't exist
    const attendanceRecords = await Attendance.find({
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
    
    console.log(`Found ${attendanceRecords.length} users to check out`);
    
    if (attendanceRecords.length === 0) {
      console.log('No users found for checkout');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each attendance record
    for (const attendance of attendanceRecords) {
      try {
        console.log(`\nProcessing user: ${attendance.userId?.name || 'Unknown'} (${attendance.userId?.empId || 'Unknown ID'})`);
        console.log(`  Current check-in time: ${attendance.checkInTime.toISOString()}`);
        
        // Set checkout time to today at 18:10
        const checkoutTime = new Date();
        checkoutTime.setHours(18, 10, 0, 0); // 18:10:00
        
        // But make sure it's today's date
        const attendanceDate = new Date(attendance.date);
        checkoutTime.setFullYear(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate());
        
        // Calculate working hours in minutes
        if (attendance.checkInTime) {
          const checkInTime = new Date(attendance.checkInTime);
          const checkOutTime = new Date(checkoutTime);
          const diffMs = checkOutTime - checkInTime;
          attendance.workingHours = Math.max(0, Math.floor(diffMs / 60000)); // Convert to minutes, ensure non-negative
          
          console.log(`  Working hours calculated: ${attendance.workingHours} minutes (${formatWorkingHours(attendance.workingHours)})`);
        }
        
        // Set checkout time
        attendance.checkOutTime = checkoutTime;
        
        // Save the updated attendance record
        await attendance.save();
        
        console.log(`  ✓ Successfully checked out at ${checkoutTime.toISOString()}`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Error processing user ${attendance.userId?.empId || 'Unknown ID'}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== BULK CHECKOUT SUMMARY ===');
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total records: ${attendanceRecords.length}`);
    console.log('=== BULK CHECKOUT SCRIPT COMPLETED ===');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error in bulk checkout script:', error);
    
    // Close database connection if it was opened
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  bulkCheckout();
}

module.exports = bulkCheckout;