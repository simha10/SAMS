const { isWithinAllowedAttendanceWindow } = require('./src/utils/timeUtils');

const testDate = new Date();
testDate.setHours(0, 5, 0, 0);
console.log('00:05 AM within window:', isWithinAllowedAttendanceWindow(testDate));

testDate.setHours(23, 59, 0, 0);
console.log('23:59 PM within window:', isWithinAllowedAttendanceWindow(testDate));