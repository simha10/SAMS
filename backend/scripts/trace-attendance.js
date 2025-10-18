require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sams';
console.log('Connecting to MongoDB:', mongoUri);

async function traceAttendance() {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
    
    // Find Alice and Manager
    const alice = await User.findOne({ empId: 'EMP001' });
    const manager = await User.findOne({ empId: 'MGR001' });
    
    console.log('Alice ID:', alice._id.toString());
    console.log('Manager ID:', manager._id.toString());
    
    // Generate tokens for both users
    const aliceToken = jwt.sign({ userId: alice._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const managerToken = jwt.sign({ userId: manager._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('\nTokens:');
    console.log('Alice token payload:', jwt.decode(aliceToken));
    console.log('Manager token payload:', jwt.decode(managerToken));
    
    // Verify tokens
    const aliceDecoded = jwt.verify(aliceToken, process.env.JWT_SECRET);
    const managerDecoded = jwt.verify(managerToken, process.env.JWT_SECRET);
    
    console.log('\nDecoded tokens:');
    console.log('Alice decoded:', aliceDecoded);
    console.log('Manager decoded:', managerDecoded);
    
    // Verify that the decoded IDs match the original IDs
    console.log('\nVerification:');
    console.log('Alice token ID matches Alice ID:', aliceDecoded.userId === alice._id.toString());
    console.log('Manager token ID matches Manager ID:', managerDecoded.userId === manager._id.toString());
    
  } catch (error) {
    console.error('Trace error:', error);
  } finally {
    mongoose.connection.close();
  }
}

traceAttendance();