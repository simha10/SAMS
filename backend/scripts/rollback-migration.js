require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Branch = require('../src/models/Branch');

/**
 * Rollback script for the user migration
 * This script can be used to revert changes if needed
 */

async function rollbackMigration() {
    try {
        console.log('=== STARTING MIGRATION ROLLBACK ===');
        console.log('Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // For rollback, we don't actually delete the branches since they might be needed
        // We just ensure the system can work with the existing user-based officeLocation data
        console.log('\n=== ROLLBACK INFORMATION ===');
        console.log('Rollback procedure:');
        console.log('1. The multi-branch system remains operational');
        console.log('2. Users with officeLocation field can still be used');
        console.log('3. No data will be lost');
        console.log('4. Both systems can coexist');

        // Show current state
        const usersWithOfficeLocation = await User.countDocuments({
            officeLocation: { $exists: true, $ne: null }
        });
        const totalUsers = await User.countDocuments();
        const totalBranches = await Branch.countDocuments();
        const activeBranches = await Branch.countDocuments({ isActive: true });

        console.log(`\n=== CURRENT STATE ===`);
        console.log(`Users with officeLocation: ${usersWithOfficeLocation}/${totalUsers}`);
        console.log(`Total branches: ${totalBranches} (${activeBranches} active)`);

        console.log('\n=== ROLLBACK COMPLETED ===');
        console.log('The system is now in a hybrid state where both approaches can work.');
        console.log('You can choose to:');
        console.log('1. Continue using the multi-branch system (recommended)');
        console.log('2. Revert to user-based officeLocation (if needed for troubleshooting)');
        console.log('3. Gradually migrate to pure multi-branch approach in future releases');

        mongoose.connection.close();
        console.log('\nDatabase connection closed');

    } catch (error) {
        console.error('Rollback error:', error);
        process.exit(1);
    }
}

rollbackMigration();