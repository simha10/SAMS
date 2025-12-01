const mongoose = require('mongoose');
const Holiday = require('../src/models/Holiday');
const User = require('../src/models/User');

describe('Holiday Model Extended Features', () => {
    let user;

    beforeAll(async () => {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Create a test user for createdBy field
        user = new User({
            empId: 'EMP_HOLIDAY_' + Date.now(),
            name: 'Test User',
            email: 'test.holiday@example.com',
            password: 'password123',
            role: 'manager'
        });
        await user.save();
    }, 15000);

    afterAll(async () => {
        await Holiday.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    }, 15000);

    beforeEach(async () => {
        // Clear holidays before each test
        await Holiday.deleteMany({});
    });

    it('should support isRecurringSunday field', async () => {
        const holidayData = {
            date: new Date('2023-12-24'), // Sunday
            name: 'Sunday Holiday',
            isRecurringSunday: true,
            createdBy: user._id
        };

        const holiday = new Holiday(holidayData);
        const savedHoliday = await holiday.save();

        expect(savedHoliday._id).toBeDefined();
        expect(savedHoliday.isRecurringSunday).toBe(true);
    }, 15000);

    it('should use default isRecurringSunday when not provided', async () => {
        const holidayData = {
            date: new Date('2023-12-25'), // Monday
            name: 'Regular Holiday',
            createdBy: user._id
            // isRecurringSunday not provided
        };

        const holiday = new Holiday(holidayData);
        const savedHoliday = await holiday.save();

        expect(savedHoliday._id).toBeDefined();
        expect(savedHoliday.isRecurringSunday).toBe(false); // Default value
    }, 15000);

    it('should support recurring Sunday holidays', async () => {
        const holidayData = {
            date: new Date('2023-12-31'), // Sunday
            name: 'New Year Sunday',
            isRecurringSunday: true,
            createdBy: user._id
        };

        const holiday = new Holiday(holidayData);
        const savedHoliday = await holiday.save();

        expect(savedHoliday._id).toBeDefined();
        expect(savedHoliday.isRecurringSunday).toBe(true);
    }, 15000);
});