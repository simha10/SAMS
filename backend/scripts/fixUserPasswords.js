const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');

// Load environment variables
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sams', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Function to check if a string looks like a bcrypt hash
const looksLikeHashedPassword = (password) => {
  // bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor and encoded hash
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
};

// Fix user passwords
const fixUserPasswords = async () => {
  try {
    await connectDB();
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      // Check if password looks like a bcrypt hash
      if (!looksLikeHashedPassword(user.password)) {
        console.log(`Fixing password for user: ${user.empId} (${user.email})`);
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        
        // Save the user
        await user.save();
        fixedCount++;
        console.log(`Fixed password for user: ${user.empId}`);
      }
    }
    
    console.log(`Fixed passwords for ${fixedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user passwords:', error);
    process.exit(1);
  }
};

fixUserPasswords();