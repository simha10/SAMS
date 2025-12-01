const mongoose = require('mongoose');
const User = require('../src/models/User');

describe('User Model', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }, 15000);

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  }, 15000);

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  it('should create and save a user successfully', async () => {
    const userData = {
      empId: 'EMP' + Date.now(), // Unique empId
      name: 'Test User',
      email: 'test' + Date.now() + '@example.com', // Unique email
      password: 'password123'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.empId).toBe(userData.empId);
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe('employee'); // Default role
    expect(savedUser.isActive).toBe(true); // Default isActive
  }, 15000);

  it('should hash the password before saving', async () => {
    const userData = {
      empId: 'EMP_HASH_' + Date.now(), // Unique empId
      name: 'Test User',
      email: 'test.hash' + Date.now() + '@example.com', // Unique email
      password: 'password123'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.password).not.toBe(userData.password);
    expect(savedUser.password).toHaveLength(60); // bcrypt hash length
  }, 15000);

  it('should have the correct default office radius', async () => {
    const userData = {
      empId: 'EMP_RADIUS_' + Date.now(), // Unique empId
      name: 'Test User',
      email: 'test.radius' + Date.now() + '@example.com', // Unique email
      password: 'password123'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.officeLocation.radius).toBe(50); // Updated default radius
  }, 15000);
});