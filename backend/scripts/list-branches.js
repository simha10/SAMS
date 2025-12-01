require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Branch = require('../src/models/Branch');

async function listBranches() {
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

        // List all branches
        const branches = await Branch.find({});

        console.log('=== BRANCHES ===');
        console.log(`Total branches: ${branches.length}\n`);

        branches.forEach((branch, index) => {
            console.log(`${index + 1}. ${branch.name}`);
            console.log(`   ID: ${branch._id}`);
            console.log(`   Location: ${branch.location.lat}, ${branch.location.lng}`);
            console.log(`   Radius: ${branch.radius} meters`);
            console.log(`   Active: ${branch.isActive}`);
            console.log(`   Created: ${branch.createdAt}`);
            console.log('');
        });

        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Error listing branches:', error);
        process.exit(1);
    }
}

listBranches();