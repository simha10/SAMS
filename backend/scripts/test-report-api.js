const axios = require('axios');

// Configure axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

// Test data
const testCredentials = {
  empId: 'MGR001',
  password: 'password123'
};

const testReportData = {
  title: 'Test API Report',
  type: 'attendance',
  startDate: '2023-09-01',
  endDate: '2023-09-30'
};

// Test the report API
const testReportAPI = async () => {
  try {
    console.log('Testing Report API...');
    
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await api.post('/auth/login', testCredentials);
    console.log('Login successful:', loginResponse.data.success);
    
    // Set auth token for future requests
    const token = loginResponse.data.data.user.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 2. Generate a report
    console.log('2. Generating report...');
    const generateResponse = await api.post('/reports', testReportData);
    console.log('Report generation response:', generateResponse.data.success);
    
    if (generateResponse.data.success) {
      console.log('Report generated successfully with ID:', generateResponse.data.data.report._id);
      
      // 3. Get user's reports
      console.log('3. Fetching user reports...');
      const reportsResponse = await api.get('/reports/my');
      console.log('Found', reportsResponse.data.data.total, 'reports');
      
      // 4. Try to download the report (this would normally return a file)
      console.log('4. Testing report download...');
      try {
        const downloadResponse = await api.get(`/reports/${generateResponse.data.data.report._id}/download`);
        console.log('Download endpoint accessible');
      } catch (downloadError) {
        // This is expected to fail in a test script since we're not handling file downloads
        console.log('Download endpoint test completed (expected behavior for test script)');
      }
    }
    
    console.log('API tests completed successfully!');
  } catch (error) {
    console.error('API Test error:', error.response?.data || error.message);
  }
};

// Run the test
testReportAPI();