const mongoose = require('mongoose');
const Attendance = require('../src/models/Attendance');

describe('Attendance Model with Branch Selection Fields', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }, 15000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 15000);

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

  it('should support new branch selection fields', async () => {
    const branchId = new mongoose.Types.ObjectId();
    const attendanceData = {
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
      status: 'present',
      checkInTime: new Date(),
      // New branch selection fields
      checkInBranch: branchId,
      checkInBranchName: 'Main Branch',
      checkInBranchDistance: 25.5,
      checkOutBranch: branchId,
      checkOutBranchName: 'Main Branch',
      checkOutBranchDistance: 30.2,
      // Legacy fields for backward compatibility
      branch: branchId,
      distanceFromBranch: 25.5
    };

    const attendance = new Attendance(attendanceData);
    const savedAttendance = await attendance.save();

    // Verify new fields
    expect(savedAttendance.checkInBranch.toString()).toBe(branchId.toString());
    expect(savedAttendance.checkInBranchName).toBe('Main Branch');
    expect(savedAttendance.checkInBranchDistance).toBe(25.5);
    expect(savedAttendance.checkOutBranch.toString()).toBe(branchId.toString());
    expect(savedAttendance.checkOutBranchName).toBe('Main Branch');
    expect(savedAttendance.checkOutBranchDistance).toBe(30.2);
    
    // Verify legacy fields still work
    expect(savedAttendance.branch.toString()).toBe(branchId.toString());
    expect(savedAttendance.distanceFromBranch).toBe(25.5);
  });

  it('should support mixed old and new branch fields (backward compatibility)', async () => {
    const branchId = new mongoose.Types.ObjectId();
    const attendanceData = {
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
      status: 'present',
      checkInTime: new Date(),
      // Only legacy fields
      branch: branchId,
      distanceFromBranch: 40.0
    };

    const attendance = new Attendance(attendanceData);
    const savedAttendance = await attendance.save();

    // Legacy fields should work
    expect(savedAttendance.branch.toString()).toBe(branchId.toString());
    expect(savedAttendance.distanceFromBranch).toBe(40.0);
    
    // New fields should be undefined
    expect(savedAttendance.checkInBranch).toBeUndefined();
    expect(savedAttendance.checkOutBranch).toBeUndefined();
  });
});