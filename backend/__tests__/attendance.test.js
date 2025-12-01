const mongoose = require('mongoose');
const Attendance = require('../src/models/Attendance');

describe('Attendance Model', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }, 15000); // Increase timeout to 15 seconds

  afterAll(async () => {
    await mongoose.connection.close();
  }, 15000); // Increase timeout to 15 seconds

  it('should create and save an attendance record successfully', async () => {
    const attendanceData = {
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
      status: 'present',
      workingHours: 480, // 8 hours in minutes
    };

    const attendance = new Attendance(attendanceData);
    const savedAttendance = await attendance.save();

    expect(savedAttendance._id).toBeDefined();
    expect(savedAttendance.status).toBe(attendanceData.status);
    expect(savedAttendance.workingHours).toBe(attendanceData.workingHours);
  });

  it('should support new attendance statuses', async () => {
    const validStatuses = ['present', 'absent', 'half-day', 'on-leave', 'outside-duty'];

    for (const status of validStatuses) {
      const attendanceData = {
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        status: status,
      };

      const attendance = new Attendance(attendanceData);
      const savedAttendance = await attendance.save();

      expect(savedAttendance.status).toBe(status);
    }
  });

  it('should support half-day tracking fields', async () => {
    const attendanceData = {
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
      status: 'half-day',
      isHalfDay: true,
      halfDayType: 'morning',
    };

    const attendance = new Attendance(attendanceData);
    const savedAttendance = await attendance.save();

    expect(savedAttendance.isHalfDay).toBe(true);
    expect(savedAttendance.halfDayType).toBe('morning');
  });
});