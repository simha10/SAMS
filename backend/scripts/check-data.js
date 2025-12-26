// Load environment variables only when PLATFORM is not 'gcp'
if (process.env.PLATFORM !== 'gcp') {
    require('dotenv').config();
}
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function checkData() {
    try {
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI?.trim();

        if (!mongoUri) {
          throw new Error('MONGO_URI is missing or empty at runtime');
        }

        await mongoose
          .connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });

        console.log('Connected to MongoDB');

        // Check users with officeLocation field
        const usersWithOfficeLocation = await User.countDocuments({
            officeLocation: { $exists: true, $ne: null }
        });
        console.log('Users with officeLocation field:', usersWithOfficeLocation);

        // Check total users
        const totalUsers = await User.countDocuments();
        console.log('Total users:', totalUsers);

        // Check branches
        const Branch = require('../src/models/Branch');
        const totalBranches = await Branch.countDocuments();
        console.log('Total branches:', totalBranches);

        // Check if we have active branches
        const activeBranches = await Branch.countDocuments({ isActive: true });
        console.log('Active branches:', activeBranches);

        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();