const axios = require('axios');

async function testLogin(empId, password, name) {
    try {
        console.log(`Testing login for ${name} (${empId})...`);

        const response = await axios.post('http://localhost:8080/api/auth/login', {
            empId: empId,
            password: password
        });

        console.log(`✓ Success for ${name}:`);
        console.log(`  Role: ${response.data.data.user.role}`);
        console.log(`  Message: ${response.data.message}`);
        console.log('');
    } catch (error) {
        console.log(`✗ Error for ${name}:`, error.message);
        if (error.response) {
            console.log(`  Response: ${error.response.data.message}`);
            console.log(`  Status: ${error.response.status}`);
        }
        console.log('');
    }
}

async function runAllTests() {
    console.log('Testing login functionality for all users...\n');

    await testLogin('LRMC001', 'director123', 'LIM Rao (Director)');
    await testLogin('LRMC002', 'manager123', 'Vikhas Gupta (Manager)');
    await testLogin('LRMC003', 'employee123', 'Uday Singh (Employee)');
    await testLogin('LRMC004', 'employee123', 'Simhachalam M (Employee)');
    await testLogin('LRMC005', 'employee123', 'Haneef Sd (Employee)');

    console.log('All login tests completed.');
}

runAllTests();