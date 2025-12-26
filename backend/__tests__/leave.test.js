const mongoose = require('mongoose');
const LeaveRequest = require('../src/models/LeaveRequest');

describe('Leave Request Model', () => {
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

  it('should create and save a leave request successfully', async () => {
    const leaveData = {
      userId: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      reason: 'Test leave request',
      type: 'personal',
      days: 1,
    };

    const leaveRequest = new LeaveRequest(leaveData);
    const savedLeaveRequest = await leaveRequest.save();

    expect(savedLeaveRequest._id).toBeDefined();
    expect(savedLeaveRequest.reason).toBe(leaveData.reason);
    expect(savedLeaveRequest.days).toBe(leaveData.days);
  });

  it('should support half-day leave fields', async () => {
    const leaveData = {
      userId: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      reason: 'Half-day leave',
      type: 'personal',
      days: 0.5,
      isHalfDay: true,
      halfDayType: 'morning',
    };

    const leaveRequest = new LeaveRequest(leaveData);
    const savedLeaveRequest = await leaveRequest.save();

    expect(savedLeaveRequest.isHalfDay).toBe(true);
    expect(savedLeaveRequest.halfDayType).toBe('morning');
    expect(savedLeaveRequest.days).toBe(0.5);
  });

  it('should support partial day leave fields', async () => {
    const leaveData = {
      userId: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      reason: 'Partial day leave',
      type: 'personal',
      days: 0.5,
      isHalfDayStart: true,
      halfDayTypeStart: 'afternoon',
      isHalfDayEnd: false,
    };

    const leaveRequest = new LeaveRequest(leaveData);
    const savedLeaveRequest = await leaveRequest.save();

    expect(savedLeaveRequest.isHalfDayStart).toBe(true);
    expect(savedLeaveRequest.halfDayTypeStart).toBe('afternoon');
    expect(savedLeaveRequest.isHalfDayEnd).toBe(false);
  });
});