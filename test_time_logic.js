// Test the isWithinOfficeHours function
function isWithinOfficeHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 20; // 9 AM to 8 PM
}

// Test with 9:17 AM
const testTime = new Date();
testTime.setHours(9, 17, 0, 0); // 9:17 AM

console.log('Test time:', testTime);
console.log('Hour:', testTime.getHours());
console.log('Is within office hours (9:17 AM):', isWithinOfficeHours(testTime));

// Test with 8:59 AM
const testTime2 = new Date();
testTime2.setHours(8, 59, 0, 0); // 8:59 AM

console.log('\nTest time:', testTime2);
console.log('Hour:', testTime2.getHours());
console.log('Is within office hours (8:59 AM):', isWithinOfficeHours(testTime2));