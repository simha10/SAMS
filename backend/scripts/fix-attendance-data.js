require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../src/models/Attendance');
const User = require('../src/models/User');

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sams';
console.log('Connecting to MongoDB:', mongoUri);

async function fixAttendanceData() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
    
    // Find Alice Employee
    const alice = await User.findOne({ empId: 'EMP001' });
    if (!alice) {
      console.log('Alice not found');
      return;
    }
    
    console.log('Alice user record:', alice);
    
    // Find the incorrect attendance record (with manager's ID)
    const incorrectRecord = await Attendance.findOne({ 
      userId: '68f0be35db77baa5a691f1d2', // Manager's ID
      date: '2025-10-16'
    });
    
    if (!incorrectRecord) {
      console.log('No incorrect attendance record found');
      return;
    }
    
    console.log('Found incorrect attendance record:', incorrectRecord);
    
    // Check if there's already a correct record for Alice
    const correctRecord = await Attendance.findOne({ 
      userId: alice._id, // Alice's ID
      date: '2025-10-16'
    });
    
    if (correctRecord) {
      console.log('Correct attendance record already exists:', correctRecord);
      // Delete the incorrect record
      await Attendance.deleteOne({ _id: incorrectRecord._id });
      console.log('Deleted incorrect attendance record');
    } else {
      // Fix the incorrect record by updating the userId
      incorrectRecord.userId = alice._id;
      await incorrectRecord.save();
      console.log('Fixed attendance record for Alice');
    }
    
    // Verify the fix
    const fixedRecord = await Attendance.findOne({ 
      userId: alice._id,
      date: '2025-10-16'
    });
    
    console.log('Fixed record:', fixedRecord);
    
  } catch (error) {
    console.error('Fix error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAttendanceData();