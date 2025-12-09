const { isSunday, isWithinAllowedAttendanceWindow, isFairOfficeHours } = require('../src/utils/timeUtils');

// Test cases for the attendance logic update

console.log('=== Attendance Logic Test Cases ===\n');

// Test 1: Check-in 10 AM → fair
console.log('Test 1: Check-in 10 AM');
const date1 = new Date();
date1.setHours(10, 0, 0, 0);
console.log('isWithinAllowedAttendanceWindow:', isWithinAllowedAttendanceWindow(date1));
console.log('isFairOfficeHours:', isFairOfficeHours(date1));
console.log('isSunday:', isSunday(date1));
console.log('Expected: Within allowed window and fair hours\n');

// Test 2: Check-in 6 AM → flagged (outside office hours)
console.log('Test 2: Check-in 6 AM');
const date2 = new Date();
date2.setHours(6, 0, 0, 0);
console.log('isWithinAllowedAttendanceWindow:', isWithinAllowedAttendanceWindow(date2));
console.log('isFairOfficeHours:', isFairOfficeHours(date2));
console.log('Expected: Within allowed window but outside fair hours\n');

// Test 3: Check-in 10 PM → flagged
console.log('Test 3: Check-in 10 PM');
const date3 = new Date();
date3.setHours(22, 0, 0, 0);
console.log('isWithinAllowedAttendanceWindow:', isWithinAllowedAttendanceWindow(date3));
console.log('isFairOfficeHours:', isFairOfficeHours(date3));
console.log('Expected: Within allowed window but outside fair hours\n');

// Test 4: Check-in on Sunday → flagged
console.log('Test 4: Check-in on Sunday');
const date4 = new Date('2023-10-01'); // A known Sunday
console.log('isSunday:', isSunday(date4));
console.log('isWithinAllowedAttendanceWindow:', isWithinAllowedAttendanceWindow(date4));
console.log('Expected: Sunday flag\n');

// Test 5: Auto-checkout at 23:59 → flagged
console.log('Test 5: Auto-checkout at 23:59');
const date5 = new Date();
date5.setHours(23, 59, 0, 0);
console.log('isWithinAllowedAttendanceWindow:', isWithinAllowedAttendanceWindow(date5));
console.log('Expected: Within allowed window\n');

// Test 6: Checkout after midnight (01:00 AM next day) → allowed + flagged
console.log('Test 6: Checkout after midnight (01:00 AM next day)');
const date6 = new Date();
date6.setHours(1, 0, 0, 0);
date6.setDate(date6.getDate() + 1); // Next day
console.log('isWithinAllowedAttendanceWindow:', isWithinAllowedAttendanceWindow(date6));
console.log('Expected: This should be rejected by checkout logic\n');

// Test 7: Re-check-in at 12:05 AM next day → Allowed (new day)
console.log('Test 7: Re-check-in at 12:05 AM next day');
const date7 = new Date();
date7.setHours(0, 5, 0, 0);
date7.setDate(date7.getDate() + 1); // Next day
console.log('isWithinAllowedAttendanceWindow:', isWithinAllowedAttendanceWindow(date7));
console.log('Expected: Within allowed window\n');

console.log('=== End of Test Cases ===');