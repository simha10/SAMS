require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const listUsers = async () => {
  try {
    // Connect to database using the same connection string as in .env
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, EmpID: ${user.empId}, Name: ${user.name}, Role: ${user.role}`);
    });

    console.log('Total users:', users.length);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
};

listUsers();