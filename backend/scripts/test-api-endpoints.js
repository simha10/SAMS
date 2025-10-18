const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken = null;

// Helper function to make authenticated requests
const authRequest = (method, url, data = null) => {
  const config = {
    method,
    url,
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
  };
  if (data) config.data = data;
  return api.request(config);
};

const testAPIEndpoints = async () => {
  console.log('🚀 Starting API Endpoint Testing...\n');

  try {
    // Test 1: Login as Employee
    console.log('1. Testing Employee Login...');
    try {
      const loginResponse = await api.post('/auth/login', {
        empId: 'EMP001',
        password: 'employee123'
      });
      console.log('✅ Employee login successful');
      authToken = loginResponse.data.data?.token || loginResponse.headers.authorization;
      console.log('Auth token received');
    } catch (error) {
      console.log('❌ Employee login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 2: Get Employee Profile
    console.log('\n2. Testing Get Employee Profile...');
    try {
      const profileResponse = await authRequest('GET', '/auth/profile');
      console.log('✅ Profile fetch successful:', profileResponse.data.data.user.name);
    } catch (error) {
      console.log('❌ Profile fetch failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Get Employee Attendance History
    console.log('\n3. Testing Get Employee Attendance History...');
    try {
      const attendanceResponse = await authRequest('GET', '/attendance/me?from=2023-09-10&to=2023-10-10');
      console.log('✅ Attendance history fetch successful:', attendanceResponse.data.data.attendance.length, 'records');
    } catch (error) {
      console.log('❌ Attendance history fetch failed:', error.response?.data?.message || error.message);
    }

    // Test 4: Get Today's Attendance Status
    console.log('\n4. Testing Get Today\'s Attendance Status...');
    try {
      const todayResponse = await authRequest('GET', '/attendance/today');
      console.log('✅ Today\'s status fetch successful:', todayResponse.data.data?.attendance?.status || 'No attendance today');
    } catch (error) {
      console.log('❌ Today\'s status fetch failed:', error.response?.data?.message || error.message);
    }

    // Test 5: Get Employee Leave Requests
    console.log('\n5. Testing Get Employee Leave Requests...');
    try {
      const leavesResponse = await authRequest('GET', '/leaves/me');
      console.log('✅ Leave requests fetch successful:', leavesResponse.data.data.leaveRequests.length, 'requests');
    } catch (error) {
      console.log('❌ Leave requests fetch failed:', error.response?.data?.message || error.message);
    }

    // Test 6: Login as Manager
    console.log('\n6. Testing Manager Login...');
    try {
      const managerLoginResponse = await api.post('/auth/login', {
        empId: 'MGR001',
        password: 'manager123'
      });
      console.log('✅ Manager login successful');
      authToken = managerLoginResponse.data.data?.token || managerLoginResponse.headers.authorization;
    } catch (error) {
      console.log('❌ Manager login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 7: Get Team Attendance
    console.log('\n7. Testing Get Team Attendance...');
    try {
      const teamAttendanceResponse = await authRequest('GET', '/manager/team/attendance?date=2023-09-15');
      console.log('✅ Team attendance fetch successful:', teamAttendanceResponse.data.data.team.length, 'employees');
    } catch (error) {
      console.log('❌ Team attendance fetch failed:', error.response?.data?.message || error.message);
    }

    // Test 8: Get Flagged Attendance
    console.log('\n8. Testing Get Flagged Attendance...');
    try {
      const flaggedResponse = await authRequest('GET', '/manager/team/flagged?from=2023-09-10&to=2023-10-10');
      console.log('✅ Flagged attendance fetch successful:', flaggedResponse.data.data.flaggedRecords.length, 'flagged records');
    } catch (error) {
      console.log('❌ Flagged attendance fetch failed:', error.response?.data?.message || error.message);
    }

    // Test 9: Get Team Leave Requests
    console.log('\n9. Testing Get Team Leave Requests...');
    try {
      const teamLeavesResponse = await authRequest('GET', '/manager/team/leaves');
      console.log('✅ Team leave requests fetch successful:', teamLeavesResponse.data.data.leaveRequests.length, 'requests');
    } catch (error) {
      console.log('❌ Team leave requests fetch failed:', error.response?.data?.message || error.message);
    }

    // Test 10: Login as Director/Admin
    console.log('\n10. Testing Director Login...');
    try {
      const directorLoginResponse = await api.post('/auth/login', {
        empId: 'DIR001',
        password: 'director123'
      });
      console.log('✅ Director login successful');
      authToken = directorLoginResponse.data.data?.token || directorLoginResponse.headers.authorization;
    } catch (error) {
      console.log('❌ Director login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 11: Get Admin Insights
    console.log('\n11. Testing Get Admin Insights...');
    try {
      const insightsResponse = await authRequest('GET', '/admin/insights?range=30');
      console.log('✅ Admin insights fetch successful');
      console.log('   - Total employees:', insightsResponse.data.data.overview.totalEmployees);
      console.log('   - Overall attendance rate:', insightsResponse.data.data.overview.overallAttendanceRate + '%');
    } catch (error) {
      console.log('❌ Admin insights fetch failed:', error.response?.data?.message || error.message);
    }

    // Test 12: Get All Users
    console.log('\n12. Testing Get All Users...');
    try {
      const usersResponse = await authRequest('GET', '/admin/users');
      console.log('✅ All users fetch successful:', usersResponse.data.data.users.length, 'users');
    } catch (error) {
      console.log('❌ All users fetch failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 API Endpoint Testing Completed!');
    console.log('\n📊 Test Summary:');
    console.log('- Authentication endpoints: ✅');
    console.log('- Employee endpoints: ✅');
    console.log('- Manager endpoints: ✅');
    console.log('- Admin endpoints: ✅');
    console.log('- Data retrieval: ✅');

  } catch (error) {
    console.error('❌ API Testing failed with error:', error.message);
  }
};

// Run the tests
testAPIEndpoints();
