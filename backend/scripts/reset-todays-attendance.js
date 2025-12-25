const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables only when PLATFORM is not 'gcp'
if (process.env.PLATFORM !== 'gcp') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// Import models
const Attendance = require('../src/models/Attendance');
const User = require('../src/models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Reset today's attendance records
const resetTodaysAttendance = async () => {
  try {
    await connectDB();
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`Resetting attendance records for ${today.toDateString()}`);
    
    // Find all attendance records for today where check-in exists (ignore absents)
    const attendanceRecords = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      checkInTime: { $ne: null } // Only records with check-in
    });
    
    console.log(`Found ${attendanceRecords.length} attendance records to reset`);
    
    let updatedCount = 0;
    
    for (const record of attendanceRecords) {
      try {
        // Set check-in time to 9:50 AM today
        const newCheckInTime = new Date(record.date);
        newCheckInTime.setHours(9, 50, 0, 0);
        
        // Set check-out time to 6:30 PM today
        const newCheckOutTime = new Date(record.date);
        newCheckOutTime.setHours(18, 30, 0, 0);
        
        // Calculate working hours (in minutes)
        const workingHours = Math.floor((newCheckOutTime - newCheckInTime) / 60000);
        
        // Update the record
        record.checkInTime = newCheckInTime;
        record.checkOutTime = newCheckOutTime;
        record.workingHours = workingHours;
        record.status = 'present'; // Set status to present
        record.flagged = false; // Remove flagged status
        record.flaggedReason = {}; // Clear flagged reason
        
        // Save the updated record
        await record.save();
        updatedCount++;
        
        console.log(`Updated record for user ${record.userId}: Check-in: ${newCheckInTime}, Check-out: ${newCheckOutTime}, Working Hours: ${workingHours} minutes`);
      } catch (error) {
        console.error(`Error updating record for user ${record.userId}:`, error);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} attendance records`);
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error resetting attendance records:', error);
    process.exit(1);
  }
};

// Run the script
resetTodaysAttendance();