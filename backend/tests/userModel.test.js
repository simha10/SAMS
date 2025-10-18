const mongoose = require('mongoose');
const User = require('../src/models/User');

describe('User Model', () => {
  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/sams-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Password Hashing', () => {
    it('should hash user password before saving', async () => {
      const userData = {
        empId: 'EMP001',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'employee'
      };

      const user = new User(userData);
      await user.save();

      // Check that password is hashed (not the same as original)
      expect(user.password).not.toBe(userData.password);
      
      // Check that password follows bcrypt hash pattern
      expect(user.password).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    });

    it('should validate password correctly', async () => {
      const userData = {
        empId: 'EMP002',
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123',
        role: 'employee'
      };

      const user = new User(userData);
      await user.save();

      // Test correct password
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      // Test incorrect password
      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });
  });
});