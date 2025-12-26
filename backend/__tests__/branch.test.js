const mongoose = require('mongoose');
const Branch = require('../src/models/Branch');

describe('Branch Model', () => {
    beforeAll(async () => {
        const mongoUri = process.env.MONGO_URI?.trim() || 'mongodb://localhost:27017/test';
        
        if (!mongoUri) {
          throw new Error('MONGO_URI is missing or empty at runtime');
        }
        
        await mongoose
          .connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should create and save a branch successfully', async () => {
        const branchData = {
            name: 'Test Branch',
            location: {
                lat: 26.913595,
                lng: 80.953481
            },
            radius: 50,
            isActive: true
        };

        const branch = new Branch(branchData);
        const savedBranch = await branch.save();

        expect(savedBranch._id).toBeDefined();
        expect(savedBranch.name).toBe(branchData.name);
        expect(savedBranch.location.lat).toBe(branchData.location.lat);
        expect(savedBranch.location.lng).toBe(branchData.location.lng);
        expect(savedBranch.radius).toBe(branchData.radius);
        expect(savedBranch.isActive).toBe(branchData.isActive);
    });

    it('should use default radius when not provided', async () => {
        const branchData = {
            name: 'Branch Without Radius',
            location: {
                lat: 26.913595,
                lng: 80.953481
            }
        };

        const branch = new Branch(branchData);
        const savedBranch = await branch.save();

        expect(savedBranch.radius).toBe(50); // Default value
    });

    it('should use default isActive when not provided', async () => {
        const branchData = {
            name: 'Branch Without Active Status',
            location: {
                lat: 26.913595,
                lng: 80.953481
            }
        };

        const branch = new Branch(branchData);
        const savedBranch = await branch.save();

        expect(savedBranch.isActive).toBe(true); // Default value
    });
});