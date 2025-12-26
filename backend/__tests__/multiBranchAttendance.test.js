const mongoose = require('mongoose');
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const Branch = require('../src/models/Branch');

describe('Multi-Branch Attendance Validation', () => {
    let user, branch1, branch2;

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
    }, 15000);

    afterAll(async () => {
        await mongoose.connection.close();
    }, 15000);

    beforeEach(async () => {
        // Clear collections before each test to ensure isolation
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await Branch.deleteMany({});
    }, 15000);

    afterEach(async () => {
        // Clear collections after each test
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await Branch.deleteMany({});
    }, 15000);

    it('should allow employee to check in from any branch with new branch selection fields', async () => {
        // Create test user
        const user = new User({
            empId: 'EMP_MULTI_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: 'Test User',
            email: 'test.multi.' + Date.now() + '@example.com',
            password: 'password123',
            role: 'employee'
        });
        await user.save();

        // Create test branches
        const branch1 = new Branch({
            name: 'Branch 1',
            location: {
                lat: 26.913595,
                lng: 80.953481
            },
            radius: 50,
            isActive: true
        });
        await branch1.save();

        const branch2 = new Branch({
            name: 'Branch 2',
            location: {
                lat: 28.704059,
                lng: 77.102490
            },
            radius: 50,
            isActive: true
        });
        await branch2.save();

        // Check in from branch 1 using new branch selection fields
        const attendance1 = new Attendance({
            userId: user._id,
            date: new Date(),
            status: 'present',
            checkInTime: new Date(),
            // New branch selection fields
            checkInBranch: branch1._id,
            checkInBranchName: branch1.name,
            checkInBranchDistance: 10,
            // Legacy field for backward compatibility
            branch: branch1._id,
            distanceFromBranch: 10
        });
        const savedAttendance1 = await attendance1.save();

        expect(savedAttendance1._id).toBeDefined();
        expect(savedAttendance1.checkInBranch.toString()).toBe(branch1._id.toString());
        expect(savedAttendance1.checkInBranchName).toBe(branch1.name);
        expect(savedAttendance1.checkInBranchDistance).toBe(10);
        expect(savedAttendance1.branch.toString()).toBe(branch1._id.toString());
        expect(savedAttendance1.distanceFromBranch).toBe(10);

        // Check in from branch 2 on same day (should update the existing record with new branch info)
        const attendance2 = new Attendance({
            userId: user._id,
            date: new Date(), // Same date
            status: 'present',
            checkInTime: new Date(),
            // New branch selection fields for branch 2
            checkInBranch: branch2._id,
            checkInBranchName: branch2.name,
            checkInBranchDistance: 15,
            // Legacy field for backward compatibility
            branch: branch2._id,
            distanceFromBranch: 15
        });

        // Since we're directly creating records, we need to handle the fact that 
        // the second save will overwrite the first due to the unique index on userId + date
        // In real usage, the controller prevents multiple check-ins on the same day
        const savedAttendance2 = await attendance2.save();

        expect(savedAttendance2._id).toBeDefined();
        expect(savedAttendance2.checkInBranch.toString()).toBe(branch2._id.toString());
        expect(savedAttendance2.checkInBranchName).toBe(branch2.name);
        expect(savedAttendance2.checkInBranchDistance).toBe(15);
        expect(savedAttendance2.branch.toString()).toBe(branch2._id.toString());
        expect(savedAttendance2.distanceFromBranch).toBe(15);
    }, 15000);

    it('should support multiple branches for same employee on different days with new fields', async () => {
        // Create test user
        const user = new User({
            empId: 'EMP_MULTI_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: 'Test User',
            email: 'test.multi.' + Date.now() + '@example.com',
            password: 'password123',
            role: 'employee'
        });
        await user.save();

        // Create test branches
        const branch1 = new Branch({
            name: 'Branch 1',
            location: {
                lat: 26.913595,
                lng: 80.953481
            },
            radius: 50,
            isActive: true
        });
        await branch1.save();

        const branch2 = new Branch({
            name: 'Branch 2',
            location: {
                lat: 28.704059,
                lng: 77.102490
            },
            radius: 50,
            isActive: true
        });
        await branch2.save();

        // Use different dates to ensure separate records
        const date1 = new Date('2023-01-01T10:00:00Z');
        const date2 = new Date('2023-01-02T10:00:00Z');

        // Create attendance for branch 1 on day 1 with new fields
        const attendance1 = new Attendance({
            userId: user._id,
            date: date1,
            status: 'present',
            checkInTime: date1,
            // New branch selection fields
            checkInBranch: branch1._id,
            checkInBranchName: branch1.name,
            checkInBranchDistance: 20,
            // Legacy field for backward compatibility
            branch: branch1._id,
            distanceFromBranch: 20
        });
        await attendance1.save();

        // Create attendance for branch 2 on day 2 with new fields
        const attendance2 = new Attendance({
            userId: user._id,
            date: date2,
            status: 'present',
            checkInTime: date2,
            // New branch selection fields
            checkInBranch: branch2._id,
            checkInBranchName: branch2.name,
            checkInBranchDistance: 25,
            // Legacy field for backward compatibility
            branch: branch2._id,
            distanceFromBranch: 25
        });
        await attendance2.save();

        // Wait a bit to ensure saves are complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify both records exist with correct branches using new fields
        const attendances = await Attendance.find({ userId: user._id })
            .sort({ date: 1 })
            .populate('checkInBranch');

        console.log('Found attendances:', attendances.length);
        console.log('Expected 2, got:', attendances.length);

        expect(attendances.length).toBe(2);
        expect(attendances[0].checkInBranch._id.toString()).toBe(branch1._id.toString());
        expect(attendances[0].checkInBranchName).toBe(branch1.name);
        expect(attendances[0].checkInBranchDistance).toBe(20);
        expect(attendances[1].checkInBranch._id.toString()).toBe(branch2._id.toString());
        expect(attendances[1].checkInBranchName).toBe(branch2.name);
        expect(attendances[1].checkInBranchDistance).toBe(25);
    }, 15000);

    it('should allow attendance with mixed old and new branch fields (backward compatibility)', async () => {
        // Create test user
        const user = new User({
            empId: 'EMP_MULTI_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: 'Test User',
            email: 'test.multi.' + Date.now() + '@example.com',
            password: 'password123',
            role: 'employee'
        });
        await user.save();

        // Create test branch
        const branch1 = new Branch({
            name: 'Branch 1',
            location: {
                lat: 26.913595,
                lng: 80.953481
            },
            radius: 50,
            isActive: true
        });
        await branch1.save();

        // Mix of new and old fields
        const attendance = new Attendance({
            userId: user._id,
            date: new Date(),
            status: 'present',
            checkInTime: new Date(),
            // New branch selection fields
            checkInBranch: branch1._id,
            checkInBranchName: branch1.name,
            checkInBranchDistance: 12,
            // Legacy field only
            branch: branch1._id,
            distanceFromBranch: 12
        });
        const savedAttendance = await attendance.save();

        expect(savedAttendance._id).toBeDefined();
        expect(savedAttendance.checkInBranch.toString()).toBe(branch1._id.toString());
        expect(savedAttendance.checkInBranchName).toBe(branch1.name);
        expect(savedAttendance.checkInBranchDistance).toBe(12);
        expect(savedAttendance.branch.toString()).toBe(branch1._id.toString());
        expect(savedAttendance.distanceFromBranch).toBe(12);
    }, 15000);
});