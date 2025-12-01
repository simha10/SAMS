const axios = require('axios');
require('dotenv').config({ path: __dirname + '/../.env' });

const API_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test users with their credentials
const testUsers = [
  { empId: 'LRMC001', password: 'director123', name: 'LIM Rao (Director)' },
  { empId: 'LRMC002', password: 'manager123', name: 'Vikhas Gupta (Manager)' },
  { empId: 'LRMC003', password: 'employee123', name: 'Uday Singh (Employee)' },
  { empId: 'LRMC004', password: 'employee123', name: 'Simhachalam M (Employee)' },
  { empId: 'LRMC005', password: 'employee123', name: 'Haneef Sd (Employee)' }
];

(async () => {
  console.log('Testing login functionality for all users...\n');

  for (const user of testUsers) {
    try {
      console.log(`Testing login for: ${user.name} (${user.empId})`);
      const loginResponse = await api.post('/auth/login', {
        empId: user.empId,
        password: user.password
      });

      console.log(`✓ Login successful for ${user.name}`);
      console.log('  Status:', loginResponse.status);
      console.log('  User role:', loginResponse.data.data.user.role);
      console.log('  Token in response data:', loginResponse.data.data?.token ? 'Found' : 'Not found');

      // Check cookies
      const cookies = loginResponse.headers['set-cookie'];
      console.log('  Cookies:', cookies ? 'Found' : 'Not found');
      if (cookies) {
        console.log('  Cookie details:', cookies[0]);
      }

      console.log('  Message:', loginResponse.data.message);
      console.log('');

    } catch (error) {
      console.log(`✗ Login failed for ${user.name}`);
      console.log('  Error:', error.response?.data || error.message);
      if (error.response) {
        console.log('  Status:', error.response.status);
      }
      console.log('');
    }
  }

  console.log('Login testing completed.');
})();