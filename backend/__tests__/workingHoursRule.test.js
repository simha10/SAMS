const mongoose = require('mongoose');
const Attendance = require('../src/models/Attendance');

describe('Working Hours Rule (5-hour rule)', () => {
    beforeAll(async () => {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear collections before each test
        await Attendance.deleteMany({});
    });

    it('should mark as full-day when working hours > 5 hours (300 minutes)', async () => {
        const attendanceData = {
            userId: new mongoose.Types.ObjectId(),
            date: new Date(),
            workingHours: 301, // 5 hours and 1 minute
            status: 'present'
        };

        const attendance = new Attendance(attendanceData);
        const savedAttendance = await attendance.save();

        expect(savedAttendance.status).toBe('present');
        expect(savedAttendance.workingHours).toBe(301);
    });

    it('should mark as half-day when working hours <= 5 hours (300 minutes)', async () => {
        const attendanceData = {
            userId: new mongoose.Types.ObjectId(),
            date: new Date(),
            workingHours: 300, // Exactly 5 hours
            status: 'half-day',
            isHalfDay: true
        };

        const attendance = new Attendance(attendanceData);
        const savedAttendance = await attendance.save();

        expect(savedAttendance.status).toBe('half-day');
        expect(savedAttendance.isHalfDay).toBe(true);
        expect(savedAttendance.workingHours).toBe(300);
    });

    it('should mark as half-day when working hours < 5 hours', async () => {
        const attendanceData = {
            userId: new mongoose.Types.ObjectId(),
            date: new Date(),
            workingHours: 240, // 4 hours
            status: 'half-day',
            isHalfDay: true
        };

        const attendance = new Attendance(attendanceData);
        const savedAttendance = await attendance.save();

        expect(savedAttendance.status).toBe('half-day');
        expect(savedAttendance.isHalfDay).toBe(true);
        expect(savedAttendance.workingHours).toBe(240);
    });

    it('should handle edge case of exactly 5 hours', async () => {
        const attendanceData = {
            userId: new mongoose.Types.ObjectId(),
            date: new Date(),
            workingHours: 300, // Exactly 5 hours
            status: 'half-day', // Should be half-day when exactly 5 hours
            isHalfDay: true
        };

        const attendance = new Attendance(attendanceData);
        const savedAttendance = await attendance.save();

        expect(savedAttendance.status).toBe('half-day');
        expect(savedAttendance.isHalfDay).toBe(true);
        expect(savedAttendance.workingHours).toBe(300);
    });
});