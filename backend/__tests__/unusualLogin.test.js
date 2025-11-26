const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/App');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const UnusualActionLog = require('../src/models/UnusualActionLog');

describe('Unusual Login Detection', () => {
  let server;
  let testUser1, testUser2;
  let testUserPassword = 'password123';

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/sams_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test users
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    
    testUser1 = new User({
      empId: 'UNUSUAL001',
      name: 'Unusual Test User 1',
      email: 'unusual1@test.com',
      password: hashedPassword,
      role: 'employee'
    });
    await testUser1.save();
    
    testUser2 = new User({
      empId: 'UNUSUAL002',
      name: 'Unusual Test User 2',
      email: 'unusual2@test.com',
      password: hashedPassword,
      role: 'employee'
    });
    await testUser2.save();

    // Start server
    server = app.listen(5003);
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Session.deleteMany({});
    await UnusualActionLog.deleteMany({});
    
    // Close connections
    await mongoose.connection.close();
    server.close();
  });

  describe('Multiple User on Same Device Detection', () => {
    it('should detect when different users login on the same device', async () => {
      // First user logs in
      const response1 = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'shared-device-001')
        .send({
          empId: 'UNUSUAL001',
          password: testUserPassword
        })
        .expect(200);

      expect(response1.body.success).toBe(true);
      
      // Second user logs in on the same device
      const response2 = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'shared-device-001')
        .send({
          empId: 'UNUSUAL002',
          password: testUserPassword
        })
        .expect(200);

      // Should still login successfully but flag as unusual
      expect(response2.body.success).toBe(true);
      expect(response2.body.unusual).toBe(true);
      expect(response2.body.unusualActions).toContain('MULTI_USER_DEVICE');
      
      // Check that unusual action was logged
      const logEntry = await UnusualActionLog.findOne({
        actionType: 'MULTI_USER_DEVICE',
        deviceId: 'shared-device-001'
      });
      
      expect(logEntry).not.toBeNull();
      expect(logEntry.severity).toBe('high');
    });
  });

  describe('Rapid Re-login Detection', () => {
    let accessToken;
    let sessionId;

    it('should detect rapid re-login after logout', async () => {
      // User logs in
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'rapid-login-device')
        .send({
          empId: 'UNUSUAL001',
          password: testUserPassword
        })
        .expect(200);

      accessToken = loginResponse.body.data.accessToken;
      sessionId = loginResponse.body.data.sessionId;
      
      // User logs out
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      // Mock time to be within 5 minutes of logout
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000); // 3 minutes ago
      
      // Temporarily modify the user's lastLogoutAt for testing
      await User.findByIdAndUpdate(testUser1._id, {
        lastLogoutAt: fiveMinutesAgo
      });
      
      // User logs back in quickly
      const reloginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Device-Id', 'rapid-login-device')
        .send({
          empId: 'UNUSUAL001',
          password: testUserPassword
        })
        .expect(200);

      // Should still login successfully but flag as unusual
      expect(reloginResponse.body.success).toBe(true);
      expect(reloginResponse.body.unusual).toBe(true);
      expect(reloginResponse.body.unusualActions).toContain('RELOGIN_AFTER_LOGOUT');
      
      // Check that unusual action was logged
      const logEntry = await UnusualActionLog.findOne({
        actionType: 'RELOGIN_AFTER_LOGOUT',
        userId: testUser1._id
      });
      
      expect(logEntry).not.toBeNull();
      expect(logEntry.severity).toBe('medium');
    });
  });
});