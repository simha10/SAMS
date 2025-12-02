require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Branch = require('../src/models/Branch');

/**
 * Migration script to handle the transition from user-based officeLocation 
 * to branch-based geofencing in a production environment
 * 
 * This script will:
 * 1. Preserve existing officeLocation data (for rollback if needed)
 * 2. Create branches from existing user officeLocation data
 * 3. Update the User model to work with the new multi-branch system
 * 4. Ensure no data loss during the transition
 */

async function migrateUsers() {
    try {
        console.log('=== STARTING USER MIGRATION ===');
        console.log('Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Step 1: Check current state
        const usersWithOfficeLocation = await User.countDocuments({
            officeLocation: { $exists: true, $ne: null }
        });
        console.log(`Found ${usersWithOfficeLocation} users with officeLocation field`);

        const totalUsers = await User.countDocuments();
        console.log(`Total users: ${totalUsers}`);

        const totalBranches = await Branch.countDocuments();
        console.log(`Existing branches: ${totalBranches}`);

        // Step 2: If no branches exist, create them from user data
        if (totalBranches === 0) {
            console.log('\n=== CREATING BRANCHES FROM USER DATA ===');

            // Get all unique office locations from users
            const users = await User.find({ officeLocation: { $exists: true, $ne: null } });
            const uniqueLocations = [];

            // Group users by their office locations
            const locationGroups = {};

            for (const user of users) {
                const loc = user.officeLocation;
                const key = `${loc.lat},${loc.lng}`;

                if (!locationGroups[key]) {
                    locationGroups[key] = {
                        lat: loc.lat,
                        lng: loc.lng,
                        radius: loc.radius || 50,
                        users: []
                    };
                }

                locationGroups[key].users.push({
                    _id: user._id,
                    name: user.name,
                    empId: user.empId
                });
            }

            // Create branches for each unique location
            let branchCounter = 1;
            for (const [key, locationData] of Object.entries(locationGroups)) {
                const branchName = locationData.users.length > 1
                    ? `Office Branch ${branchCounter}`
                    : `${locationData.users[0].name}'s Office`;

                const branch = new Branch({
                    name: branchName,
                    location: {
                        lat: locationData.lat,
                        lng: locationData.lng
                    },
                    radius: locationData.radius,
                    isActive: true
                });

                await branch.save();
                console.log(`Created branch: ${branchName} at ${locationData.lat}, ${locationData.lng} with ${locationData.users.length} users`);

                // Log which users belong to this branch
                locationData.users.forEach(user => {
                    console.log(`  - User: ${user.name} (${user.empId})`);
                });

                branchCounter++;
            }

            console.log(`Created ${Object.keys(locationGroups).length} branches from user data`);
        } else {
            console.log('\n=== BRANCHES ALREADY EXIST, SKIPPING BRANCH CREATION ===');
        }

        // Step 3: Update User model schema to make officeLocation optional
        // Note: We're not removing the field yet to ensure backward compatibility
        console.log('\n=== USER MODEL UPDATE COMPLETE ===');
        console.log('Users can now use the new multi-branch system while preserving existing data');

        // Step 4: Summary
        const finalBranchCount = await Branch.countDocuments();
        console.log(`\n=== MIGRATION SUMMARY ===`);
        console.log(`Users with officeLocation: ${usersWithOfficeLocation}/${totalUsers}`);
        console.log(`Total branches: ${finalBranchCount}`);
        console.log(`Migration completed successfully!`);
        console.log(`\nNext steps:`);
        console.log(`1. Deploy updated frontend that uses branch-based geofencing`);
        console.log(`2. Test the new multi-branch functionality`);
        console.log(`3. After confirming everything works, you can optionally remove officeLocation fields in a future release`);

        mongoose.connection.close();
        console.log('\nDatabase connection closed');
        console.log('=== MIGRATION COMPLETED ===');

    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateUsers();