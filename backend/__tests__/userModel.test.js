const mongoose = require('mongoose');
const User = require('../src/models/User');

describe('User Model Updates', () => {
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

    it('should create and save a user without officeLocation field', async () => {
        const userData = {
            empId: 'EMP_TEST_' + Date.now(),
            name: 'Test User',
            email: 'test.' + Date.now() + '@example.com',
            password: 'password123',
            role: 'employee'
            // officeLocation field should no longer exist
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.empId).toBe(userData.empId);
        expect(savedUser.name).toBe(userData.name);
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.role).toBe(userData.role);
        
        // officeLocation field should not exist
        expect(savedUser.officeLocation).toBeUndefined();
    });

    it('should support all user roles', async () => {
        const roles = ['employee', 'manager', 'director'];
        
        for (const role of roles) {
            const userData = {
                empId: 'EMP_ROLE_' + role + '_' + Date.now() + Math.random(),
                name: `Test ${role}`,
                email: `test.${role}.${Date.now()}@example.com`,
                password: 'password123',
                role: role
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser.role).toBe(role);
        }
    });

    it('should hash password before saving', async () => {
        const userData = {
            empId: 'EMP_HASH_' + Date.now(),
            name: 'Test User',
            email: 'test.hash.' + Date.now() + '@example.com',
            password: 'plaintext123',
            role: 'employee'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        // Password should be hashed (not equal to plaintext)
        expect(savedUser.password).not.toBe(userData.password);
        // Password should exist
        expect(savedUser.password).toBeDefined();
    });
});