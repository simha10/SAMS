const mongoose = require('mongoose');
const User = require('../src/models/User');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create and save a user successfully', async () => {
    const userData = {
      empId: 'EMP001',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'employee',
      officeLocation: {
        lat: 26.91359535056058,
        lng: 80.95348145976982,
        radius: 10
      }
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.empId).toBe(userData.empId);
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.officeLocation.radius).toBe(10);
  });

  it('should hash the password before saving', async () => {
    const userData = {
      empId: 'EMP002',
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'password123',
      role: 'manager'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.password).not.toBe(userData.password);
    const isMatch = await savedUser.comparePassword(userData.password);
    expect(isMatch).toBe(true);
  });

  it('should have the correct default office radius', async () => {
    const userData = {
      empId: 'EMP003',
      name: 'Test User 3',
      email: 'test3@example.com',
      password: 'password123',
      role: 'employee'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.officeLocation.radius).toBe(10);
  });
});