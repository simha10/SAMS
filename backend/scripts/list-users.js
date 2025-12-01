require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function listUsers() {
  try {
    console.log('Connecting to MongoDB...');

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
    });

    console.log('Connected to MongoDB\n');

    // List all users
    const users = await User.find({}).populate('managerId');

    console.log('=== USERS ===');
    console.log(`Total users: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Employee ID: ${user.empId}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Manager: ${user.managerId ? user.managerId.name : 'None'}`);
      console.log(`   Location: ${user.officeLocation.lat}, ${user.officeLocation.lng}`);
      console.log(`   DOB: ${user.dob ? user.dob.toISOString().split('T')[0] : 'Not set'}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
}

listUsers();