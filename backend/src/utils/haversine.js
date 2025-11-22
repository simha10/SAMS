/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // in meters
  return distance; // Return precise distance without rounding
}

/**
 * Check if a location is within the geofence
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {number} officeLat - Office latitude
 * @param {number} officeLng - Office longitude
 * @param {number} radius - Allowed radius in meters
 * @returns {object} { isWithin: boolean, distance: number }
 */
function isWithinGeofence(userLat, userLng, officeLat, officeLng, radius) {
  const distance = calculateDistance(userLat, userLng, officeLat, officeLng);
  return {
    isWithin: distance <= radius,
    distance
  };
}

/**
 * Haversine formula to calculate distance between two points in meters with improved precision
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters (more precise)
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // in meters
  return distance; // Return precise distance without rounding
}

/**
 * Check if time is within office hours (9 AM to 8 PM)
 * @deprecated Use isWithinAttendanceWindow instead
 * @param {Date} date - Date to check (defaults to now)
 * @returns {boolean}
 */
function isWithinOfficeHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 20; // 9 AM to 8 PM
}

/**
 * Check if time is within attendance window (9 AM to 8 PM)
 * Check-in/out allowed: 9:00 AM → 8:00 PM
 * @param {Date} date - Date to check (defaults to now)
 * @returns {boolean}
 */
function isWithinAttendanceWindow(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 20; // 9 AM to 8 PM (20:00)
}

/**
 * Check if time is within core office hours (10 AM to 6 PM)
 * Official working hours: 10:00 AM → 6:00 PM
 * @param {Date} date - Date to check (defaults to now)
 * @returns {boolean}
 */
function isWithinCoreOfficeHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 10 && hour < 18; // 10 AM to 6 PM (18:00)
}

/**
 * Get overtime flags based on check-in and check-out times
 * @param {Date} checkInTime - Check-in timestamp
 * @param {Date} checkOutTime - Check-out timestamp (optional)
 * @returns {object} { earlyArrival, lateStay, overtimeMinutes, details }
 */
function getOvertimeFlags(checkInTime, checkOutTime = null) {
  const result = {
    earlyArrival: false,
    lateStay: false,
    overtimeMinutes: 0,
    details: {
      earlyMinutes: 0,
      lateMinutes: 0
    }
  };

  if (!checkInTime) {
    return result;
  }

  const checkInHour = checkInTime.getHours();
  const checkInMinute = checkInTime.getMinutes();
  const coreStartHour = 10; // 10 AM
  const coreEndHour = 18; // 6 PM

  // Check for early arrival (before 10 AM)
  if (checkInHour < coreStartHour) {
    result.earlyArrival = true;
    const coreStart = new Date(checkInTime);
    coreStart.setHours(coreStartHour, 0, 0, 0);
    result.details.earlyMinutes = Math.floor((coreStart - checkInTime) / (1000 * 60));
  } else if (checkInHour === coreStartHour && checkInMinute === 0) {
    result.earlyArrival = false; // Exactly at 10:00 AM
  }

  // Check for late stay (after 6 PM) only if checkout time is provided
  if (checkOutTime) {
    const checkOutHour = checkOutTime.getHours();
    const checkOutMinute = checkOutTime.getMinutes();

    if (checkOutHour > coreEndHour || (checkOutHour === coreEndHour && checkOutMinute > 0)) {
      result.lateStay = true;
      const coreEnd = new Date(checkOutTime);
      coreEnd.setHours(coreEndHour, 0, 0, 0);
      result.details.lateMinutes = Math.floor((checkOutTime - coreEnd) / (1000 * 60));
    }
  }

  // Calculate total overtime minutes
  result.overtimeMinutes = result.details.earlyMinutes + result.details.lateMinutes;

  return result;
}

/**
 * Check if check-in time is late (after 10 AM)
 * @param {Date} checkInTime - Check-in timestamp
 * @returns {object} { isLate, minutesLate }
 */
function isLateCheckIn(checkInTime) {
  const hour = checkInTime.getHours();
  const minute = checkInTime.getMinutes();
  const coreStartHour = 10; // 10 AM

  if (hour > coreStartHour || (hour === coreStartHour && minute > 0)) {
    const coreStart = new Date(checkInTime);
    coreStart.setHours(coreStartHour, 0, 0, 0);
    const minutesLate = Math.floor((checkInTime - coreStart) / (1000 * 60));
    return { isLate: true, minutesLate };
  }

  return { isLate: false, minutesLate: 0 };
}

/**
 * Check if check-out time is early (before 6 PM)
 * @param {Date} checkOutTime - Check-out timestamp
 * @returns {object} { isEarly, minutesEarly }
 */
function isEarlyCheckOut(checkOutTime) {
  const hour = checkOutTime.getHours();
  const minute = checkOutTime.getMinutes();
  const coreEndHour = 18; // 6 PM

  if (hour < coreEndHour || (hour === coreEndHour && minute === 0)) {
    const coreEnd = new Date(checkOutTime);
    coreEnd.setHours(coreEndHour, 0, 0, 0);
    const minutesEarly = Math.floor((coreEnd - checkOutTime) / (1000 * 60));
    return { isEarly: minutesEarly > 0, minutesEarly };
  }

  return { isEarly: false, minutesEarly: 0 };
}

/**
 * Format working hours as HH:MM
 * @param {number} minutes - Total minutes from 00:00
 * @returns {string} Formatted time as HH:MM
 */
function formatWorkingHours(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get current date in YYYY-MM-DD format
 * @param {Date} date - Date to format (defaults to now)
 * @returns {string}
 */
function getCurrentDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

module.exports = {
  calculateDistance,
  isWithinGeofence,
  haversine,
  isWithinOfficeHours, // Deprecated - kept for backward compatibility
  isWithinAttendanceWindow,
  isWithinCoreOfficeHours,
  getOvertimeFlags,
  isLateCheckIn,
  isEarlyCheckOut,
  formatWorkingHours,
  getCurrentDateString
};