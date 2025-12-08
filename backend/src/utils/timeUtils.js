/**
 * Check if date is a Sunday
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
function isSunday(date) {
  return date.getDay() === 0;
}

/**
 * Check if time is within allowed attendance window (12:01 AM to 11:59 PM)
 * @param {Date} dateTime - DateTime to check
 * @returns {boolean}
 */
function isWithinAllowedAttendanceWindow(dateTime) {
  const time = dateTime.getHours() * 60 + dateTime.getMinutes(); // Convert to minutes
  const minTime = 1; // 12:01 AM in minutes (0 * 60 + 1)
  const maxTime = 23 * 60 + 59; // 11:59 PM in minutes (23 * 60 + 59)
  return time >= minTime && time <= maxTime;
}

/**
 * Check if time is within fair office hours (9:00 AM to 8:00 PM)
 * @param {Date} dateTime - DateTime to check
 * @returns {boolean}
 */
function isFairOfficeHours(dateTime) {
  const hour = dateTime.getHours();
  return hour >= 9 && hour < 20; // 9 AM to 8 PM
}

/**
 * Check if a date is a holiday
 * @param {Date} date - Date to check
 * @param {Array} holidays - Array of holiday dates
 * @returns {boolean}
 */
function isHoliday(date, holidays = []) {
  const dateString = date.toISOString().split('T')[0];
  return holidays.some(holiday => 
    holiday.date && holiday.date.toISOString().split('T')[0] === dateString
  );
}

module.exports = {
  isSunday,
  isWithinAllowedAttendanceWindow,
  isFairOfficeHours,
  isHoliday
};