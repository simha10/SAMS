// Utility functions for date handling

/**
 * Generate an array of dates between start and end dates (inclusive)
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Date[]} Array of dates
 */
function getDateSequence(startDate, endDate) {
  const dates = [];
  
  // Handle string dates properly to avoid timezone issues
  let start, end;
  
  if (typeof startDate === 'string') {
    // Parse YYYY-MM-DD string to local date
    const [year, month, day] = startDate.split('-').map(Number);
    start = new Date(year, month - 1, day); // Month is 0-indexed
  } else {
    start = new Date(startDate);
  }
  
  if (typeof endDate === 'string') {
    // Parse YYYY-MM-DD string to local date
    const [year, month, day] = endDate.split('-').map(Number);
    end = new Date(year, month - 1, day); // Month is 0-indexed
  } else {
    end = new Date(endDate);
  }
  
  // Normalize times
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999); // Ensure end date is inclusive
  
  // Work with local dates to avoid timezone issues
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    // Push a copy of the current date
    dates.push(new Date(currentDate));
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Format a date to MMM-DD format (e.g., NOV-15)
 * @param {Date} date 
 * @returns {string} Formatted date string
 */
function formatDateToMMMDD(date) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  return `${month}-${day}`;
}

module.exports = {
  getDateSequence,
  formatDateToMMMDD
};