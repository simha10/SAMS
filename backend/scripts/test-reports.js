const mongoose = require('mongoose');
const Report = require('../src/models/Report');
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const LeaveRequest = require('../src/models/LeaveRequest');

// Load environment variables
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test report generation
const testReports = async () => {
  try {
    await connectDB();
    
    // Find a manager user for testing
    const manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      console.log('No manager found in database. Please seed data first.');
      process.exit(1);
    }
    
    console.log('Found manager:', manager.name, manager.empId);
    
    // Create a test report
    const testReport = new Report({
      title: 'Test Attendance Report',
      type: 'attendance',
      format: 'csv',
      generatedBy: manager._id,
      dateRange: {
        startDate: '2023-09-01',
        endDate: '2023-09-30'
      },
      filters: {
        department: 'Engineering'
      },
      fileUrl: '/reports/test-attendance-report.csv',
      fileSize: 1024,
      recordCount: 25
    });
    
    await testReport.save();
    console.log('Test report created successfully:', testReport.title);
    
    // Retrieve the report
    const retrievedReport = await Report.findById(testReport._id);
    console.log('Retrieved report:', retrievedReport.title);
    
    // List all reports for this user
    const userReports = await Report.find({ generatedBy: manager._id });
    console.log(`Found ${userReports.length} reports for user ${manager.name}`);
    
    // Clean up test report
    await Report.findByIdAndDelete(testReport._id);
    console.log('Test report cleaned up successfully');
    
    console.log('All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

// Run the test
testReports();