const mongoose = require('mongoose');
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const Branch = require('../src/models/Branch');

describe('Attendance Model Extended Features', () => {
    let user, branch;

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
        // Create test user with unique empId
        user = new User({
            empId: 'EMP_ATTENDANCE_' + Date.now(),
            name: 'Test User',
            email: 'test.attendance@example.com',
            password: 'password123',
            role: 'employee',
            officeLatitude: 26.913595,
            officeLongitude: 80.953481,
            officeRadius: 50
        });
        await user.save();

        // Create test branch
        branch = new Branch({
            name: 'Test Branch',
            location: {
                lat: 26.913595,
                lng: 80.953481
            },
            radius: 50,
            isActive: true
        });
        await branch.save();
    }, 15000);

    afterEach(async () => {
        // Clear collections after each test
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await Branch.deleteMany({});
    }, 15000);

    it('should support branch reference and distance fields', async () => {
        const attendanceData = {
            userId: user._id,
            date: new Date(),
            status: 'present',
            checkInTime: new Date(),
            checkOutTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours later
            workingHours: 480, // 8 hours
            branch: branch._id,
            distanceFromBranch: 25.5
        };

        const attendance = new Attendance(attendanceData);
        const savedAttendance = await attendance.save();

        expect(savedAttendance._id).toBeDefined();
        expect(savedAttendance.branch.toString()).toBe(branch._id.toString());
        expect(savedAttendance.distanceFromBranch).toBe(25.5);
    }, 15000);

    it('should support flagged attendance with detailed reasons', async () => {
        const attendanceData = {
            userId: user._id,
            date: new Date(),
            status: 'flagged',
            checkInTime: new Date(),
            flagged: true,
            flaggedReason: {
                type: 'location_breach',
                distance: 1500, // 1.5 km away
                message: 'Employee checked in 1.5 km away from office'
            }
        };

        const attendance = new Attendance(attendanceData);
        const savedAttendance = await attendance.save();

        expect(savedAttendance._id).toBeDefined();
        expect(savedAttendance.status).toBe('flagged');
        expect(savedAttendance.flagged).toBe(true);
        expect(savedAttendance.flaggedReason.type).toBe('location_breach');
        expect(savedAttendance.flaggedReason.distance).toBe(1500);
        expect(savedAttendance.flaggedReason.message).toBe('Employee checked in 1.5 km away from office');
    }, 15000);
});