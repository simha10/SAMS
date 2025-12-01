const mongoose = require('mongoose');
const Holiday = require('../src/models/Holiday');

describe('Holiday Rules', () => {
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

    beforeEach(async () => {
        // Clear collections before each test
        await Holiday.deleteMany({});
    });

    it('should support isRecurringSunday field for Sunday holidays', async () => {
        const holidayData = {
            date: new Date('2023-12-24'), // A Sunday
            name: 'Sunday Holiday',
            isRecurringSunday: true,
            createdBy: new mongoose.Types.ObjectId()
        };

        const holiday = new Holiday(holidayData);
        const savedHoliday = await holiday.save();

        expect(savedHoliday._id).toBeDefined();
        expect(savedHoliday.isRecurringSunday).toBe(true);
    });

    it('should support regular declared holidays', async () => {
        const holidayData = {
            date: new Date('2023-12-25'),
            name: 'Christmas',
            description: 'Christmas Day',
            isRecurringSunday: false,
            createdBy: new mongoose.Types.ObjectId()
        };

        const holiday = new Holiday(holidayData);
        const savedHoliday = await holiday.save();

        expect(savedHoliday._id).toBeDefined();
        expect(savedHoliday.isRecurringSunday).toBe(false);
        expect(savedHoliday.name).toBe('Christmas');
    });

    it('should allow holidays without isRecurringSunday (default false)', async () => {
        const holidayData = {
            date: new Date('2023-12-26'),
            name: 'Boxing Day',
            description: 'Boxing Day',
            createdBy: new mongoose.Types.ObjectId()
        };

        const holiday = new Holiday(holidayData);
        const savedHoliday = await holiday.save();

        expect(savedHoliday._id).toBeDefined();
        expect(savedHoliday.isRecurringSunday).toBe(false); // Default value
    });

    it('should correctly identify Sunday holidays', async () => {
        // Create a Sunday date
        const sundayDate = new Date('2023-12-24'); // This is a Sunday
        expect(sundayDate.getDay()).toBe(0); // 0 = Sunday

        const holidayData = {
            date: sundayDate,
            name: 'Regular Sunday',
            isRecurringSunday: false, // Not marked as recurring
            createdBy: new mongoose.Types.ObjectId()
        };

        const holiday = new Holiday(holidayData);
        const savedHoliday = await holiday.save();

        expect(savedHoliday._id).toBeDefined();
        expect(savedHoliday.date.getDay()).toBe(0); // Confirm it's a Sunday
    });
});