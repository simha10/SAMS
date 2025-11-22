const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../src/App');
const User = require('../src/models/User');
const Session = require('../src/models/Session');

describe('Authentication System', () => {
  let server;
  let testUser;
  let testUserPassword = 'password123';

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/sams_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test user
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    testUser = new User({
      empId: 'TEST001',
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'employee'
    });
    await testUser.save();

    // Start server
    server = app.listen(5001);
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Session.deleteMany({});
    
    // Close connections
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'test-device-id')
        .send({
          empId: 'TEST001',
          password: testUserPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.empId).toBe('TEST001');
    });

    it('should fail login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'test-device-id')
        .send({
          empId: 'TEST001',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail login without device ID', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          empId: 'TEST001',
          password: testUserPassword
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Device ID is required. Please refresh your browser.');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Login to get refresh token
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'test-device-id')
        .send({
          empId: 'TEST001',
          password: testUserPassword
        });

      refreshToken = response.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.empId).toBe('TEST001');
    });

    it('should fail to refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken;

    beforeEach(async () => {
      // Login to get access token
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'test-device-id')
        .send({
          empId: 'TEST001',
          password: testUserPassword
        });

      accessToken = response.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.empId).toBe('TEST001');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;
    let sessionId;

    beforeEach(async () => {
      // Login to get tokens
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'test-device-id')
        .send({
          empId: 'TEST001',
          password: testUserPassword
        });

      accessToken = response.body.data.accessToken;
      sessionId = response.body.data.sessionId;
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');

      // Verify session is deactivated
      const session = await Session.findById(sessionId);
      expect(session.isActive).toBe(false);
    });
  });
});