#!/usr/bin/env node

/**
 * Script to fix incorrectly flagged attendance records
 * Changes status from 'outside-duty' to 'present' for records that were flagged incorrectly
 * 
 * Usage: 
 *   node fix-flagged-attendance.js          # Fix all flagged records
 *   node fix-flagged-attendance.js EMP123   # Fix records for specific employee
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const Attendance = require('../src/models/Attendance');
const User = require('../src/models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Function to fix flagged attendance records
const fixFlaggedAttendance = async () => {
  try {
    console.log('Starting to fix flagged attendance records...');
    
    // Find all attendance records that are flagged as 'outside-duty' 
    // but should be 'present' (within geofence and office hours)
    const flaggedRecords = await Attendance.find({
      status: 'outside-duty',
      flagged: true,
      flaggedReason: { $regex: 'radius' } // Only those flagged for geofence issues
    });
    
    console.log(`Found ${flaggedRecords.length} flagged attendance records to fix`);
    
    let updatedCount = 0;
    
    // Process each flagged record
    for (const record of flaggedRecords) {
      try {
        // Update the record to present status
        record.status = 'present';
        record.flagged = false;
        record.flaggedReason = '';
        
        await record.save();
        updatedCount++;
        
        console.log(`Fixed attendance record ID: ${record._id} for user ID: ${record.userId}`);
      } catch (error) {
        console.error(`Error updating record ID ${record._id}:`, error.message);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} attendance records`);
    
    // Show summary of current attendance status
    const totalRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({ status: 'present' });
    const outsideDutyRecords = await Attendance.countDocuments({ status: 'outside-duty', flagged: true });
    const absentRecords = await Attendance.countDocuments({ status: 'absent' });
    const halfDayRecords = await Attendance.countDocuments({ status: 'half-day' });
    
    console.log('\n=== Attendance Status Summary ===');
    console.log(`Total Records: ${totalRecords}`);
    console.log(`Present Records: ${presentRecords}`);
    console.log(`Flagged (Outside Duty) Records: ${outsideDutyRecords}`);
    console.log(`Absent Records: ${absentRecords}`);
    console.log(`Half Day Records: ${halfDayRecords}`);
    
    return updatedCount;
  } catch (error) {
    console.error('Error fixing flagged attendance records:', error.message);
    throw error;
  }
};

// Function to fix specific user's attendance by employee ID
const fixUserAttendance = async (empId) => {
  try {
    console.log(`Finding attendance records for employee ID: ${empId}`);
    
    // Find user by employee ID
    const user = await User.findOne({ empId });
    if (!user) {
      console.error(`User with employee ID ${empId} not found`);
      return 0;
    }
    
    console.log(`Found user: ${user.name} (${user.empId})`);
    
    // Find all attendance records for this user that are flagged
    const userRecords = await Attendance.find({
      userId: user._id,
      flagged: true
    });
    
    console.log(`Found ${userRecords.length} flagged records for this user`);
    
    let updatedCount = 0;
    
    // Process each record
    for (const record of userRecords) {
      try {
        // Update the record to present status
        record.status = 'present';
        record.flagged = false;
        record.flaggedReason = '';
        
        await record.save();
        updatedCount++;
        
        console.log(`Fixed attendance record ID: ${record._id} for date: ${record.date.toISOString().split('T')[0]}`);
      } catch (error) {
        console.error(`Error updating record ID ${record._id}:`, error.message);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} records for user ${empId}`);
    
    return updatedCount;
  } catch (error) {
    console.error('Error fixing user attendance records:', error.message);
    throw error;
  }
};

// Main function
const main = async () => {
  let connection;
  
  try {
    // Connect to database
    connection = await connectDB();
    
    // Check if a specific employee ID was provided as command line argument
    const empId = process.argv[2];
    
    let updatedCount;
    
    if (empId) {
      console.log(`Fixing attendance for specific employee ID: ${empId}`);
      updatedCount = await fixUserAttendance(empId);
    } else {
      console.log('Fixing all incorrectly flagged attendance records');
      updatedCount = await fixFlaggedAttendance();
    }
    
    console.log(`\n=== Script Completed ===`);
    console.log(`Total records updated: ${updatedCount}`);
    
  } catch (error) {
    console.error('Script failed with error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    if (connection) {
      await connection.connection.close();
      console.log('Database connection closed');
    }
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixFlaggedAttendance, fixUserAttendance };