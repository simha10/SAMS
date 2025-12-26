const mongoose = require('mongoose');
const User = require('../src/models/User');

describe('User Model Extended Features', () => {
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

    it('should support date of birth field', async () => {
        const userData = {
            empId: 'EMP001',
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            dob: new Date('1990-01-01')
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.dob).toEqual(userData.dob);
    });

    it('should allow user without date of birth', async () => {
        const userData = {
            empId: 'EMP002',
            name: 'Test User 2',
            email: 'test2@example.com',
            password: 'password123'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.dob).toBeUndefined();
    });

    it('should have index on dob field', async () => {
        // Check if the schema has an index on dob field
        const indexes = User.schema.indexes();
        const dobIndex = indexes.find(index => index[0].dob !== undefined);

        expect(dobIndex).toBeDefined();
        expect(dobIndex[0].dob).toBe(1); // Ascending index
    });
});