const mongoose = require('mongoose');
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const Branch = require('../src/models/Branch');

describe('Multi-Branch Attendance Validation', () => {
    let user, branch1, branch2;

    beforeAll(async () => {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Clear collections
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await Branch.deleteMany({});
    }, 15000);

    afterAll(async () => {
        await mongoose.connection.close();
    }, 15000);

    beforeEach(async () => {
        // Clear collections before each test to ensure isolation
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await Branch.deleteMany({});

        // Create test user with unique empId
        user = new User({
            empId: 'EMP_MULTI_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: 'Test User',
            email: 'test.multi.' + Date.now() + '@example.com',
            password: 'password123',
            role: 'employee',
            officeLatitude: 26.913595,
            officeLongitude: 80.953481,
            officeRadius: 50
        });
        await user.save();

        // Create test branches
        branch1 = new Branch({
            name: 'Branch 1',
            location: {
                lat: 26.913595,
                lng: 80.953481
            },
            radius: 50,
            isActive: true
        });
        await branch1.save();

        branch2 = new Branch({
            name: 'Branch 2',
            location: {
                lat: 28.704059,
                lng: 77.102490
            },
            radius: 50,
            isActive: true
        });
        await branch2.save();
    }, 15000);

    afterEach(async () => {
        // Clear collections after each test
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await Branch.deleteMany({});
    }, 15000);

    it('should allow employee to check in from any branch', async () => {
        // Check in from branch 1
        const attendance1 = new Attendance({
            userId: user._id,
            date: new Date(),
            status: 'present',
            checkInTime: new Date(),
            branch: branch1._id,
            distanceFromBranch: 10
        });
        const savedAttendance1 = await attendance1.save();

        expect(savedAttendance1._id).toBeDefined();
        expect(savedAttendance1.branch.toString()).toBe(branch1._id.toString());
        expect(savedAttendance1.distanceFromBranch).toBe(10);

        // Check in from branch 2 on same day (should update the existing record with new branch info)
        const attendance2 = new Attendance({
            userId: user._id,
            date: new Date(), // Same date
            status: 'present',
            checkInTime: new Date(),
            branch: branch2._id,
            distanceFromBranch: 15
        });

        // Since we're directly creating records, we need to handle the fact that 
        // the second save will overwrite the first due to the unique index on userId + date
        // In real usage, the controller prevents multiple check-ins on the same day
        const savedAttendance2 = await attendance2.save();

        expect(savedAttendance2._id).toBeDefined();
        expect(savedAttendance2.branch.toString()).toBe(branch2._id.toString());
        expect(savedAttendance2.distanceFromBranch).toBe(15);
    }, 15000);

    it('should support multiple branches for same employee on different days', async () => {
        // Use different dates to ensure separate records
        const date1 = new Date('2023-01-01T10:00:00Z');
        const date2 = new Date('2023-01-02T10:00:00Z');

        // Create attendance for branch 1 on day 1
        const attendance1 = new Attendance({
            userId: user._id,
            date: date1,
            status: 'present',
            checkInTime: date1,
            branch: branch1._id,
            distanceFromBranch: 20
        });
        await attendance1.save();

        // Create attendance for branch 2 on day 2
        const attendance2 = new Attendance({
            userId: user._id,
            date: date2,
            status: 'present',
            checkInTime: date2,
            branch: branch2._id,
            distanceFromBranch: 25
        });
        await attendance2.save();

        // Wait a bit to ensure saves are complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify both records exist with correct branches
        const attendances = await Attendance.find({ userId: user._id })
            .sort({ date: 1 })
            .populate('branch');

        console.log('Found attendances:', attendances.length);
        console.log('Expected 2, got:', attendances.length);

        expect(attendances.length).toBe(2);
        expect(attendances[0].branch._id.toString()).toBe(branch1._id.toString());
        expect(attendances[0].distanceFromBranch).toBe(20);
        expect(attendances[1].branch._id.toString()).toBe(branch2._id.toString());
        expect(attendances[1].distanceFromBranch).toBe(25);
    }, 15000);

    it('should allow attendance without branch reference (backward compatibility)', async () => {
        const attendance = new Attendance({
            userId: user._id,
            date: new Date(),
            status: 'present',
            checkInTime: new Date(),
            // No branch reference - testing backward compatibility
            distanceFromBranch: 5
        });
        const savedAttendance = await attendance.save();

        expect(savedAttendance._id).toBeDefined();
        expect(savedAttendance.distanceFromBranch).toBe(5);
        // branch should be undefined/null
        expect(savedAttendance.branch).toBeFalsy();
    }, 15000);
});