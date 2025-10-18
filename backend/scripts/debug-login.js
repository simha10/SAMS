const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

(async () => {
  try {
    console.log('Testing login response structure...');
    const loginResponse = await api.post('/auth/login', {
      empId: 'EMP001',
      password: 'employee123'
    });
    console.log('Login response structure:');
    console.log('Status:', loginResponse.status);
    console.log('Headers:', loginResponse.headers);
    console.log('Data:', JSON.stringify(loginResponse.data, null, 2));

    // Check if token is in response data
    const token = loginResponse.data.data?.token;
    console.log('Token from data.data.token:', token ? 'Found' : 'Not found');

    // Check if token is in headers
    const authHeader = loginResponse.headers.authorization;
    console.log('Token from headers.authorization:', authHeader ? 'Found' : 'Not found');

    // Check cookies
    const cookies = loginResponse.headers['set-cookie'];
    console.log('Cookies:', cookies ? 'Found' : 'Not found');
    if (cookies) {
      console.log('Cookie details:', cookies);
    }

  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
})();
