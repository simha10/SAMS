// Test timezone handling
function isWithinOfficeHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 20; // 9 AM to 8 PM
}

// Simulate a check-in at 9:17 AM in different timezones
console.log('Testing timezone handling...\n');

// Current server time
const serverTime = new Date();
console.log('Server time:', serverTime.toISOString());
console.log('Server time (local):', serverTime.toString());
console.log('Server hour:', serverTime.getHours());

// Test with a specific time (9:17 AM)
const testTime = new Date();
testTime.setHours(9, 17, 0, 0); // 9:17 AM in local time
console.log('\nTest time (9:17 AM local):', testTime.toString());
console.log('Test hour:', testTime.getHours());
console.log('Is within office hours:', isWithinOfficeHours(testTime));

// Test with UTC time
const utcTime = new Date(testTime.toISOString());
console.log('\nUTC time:', utcTime.toISOString());
console.log('UTC time (local):', utcTime.toString());
console.log('UTC hour:', utcTime.getHours());
console.log('Is within office hours (UTC):', isWithinOfficeHours(utcTime));

// Test with a specific date/time
const specificTime = new Date('2025-12-12T09:17:00'); // 9:17 AM UTC
console.log('\nSpecific time (UTC):', specificTime.toISOString());
console.log('Specific time (local):', specificTime.toString());
console.log('Specific hour:', specificTime.getHours());
console.log('Is within office hours (specific):', isWithinOfficeHours(specificTime));