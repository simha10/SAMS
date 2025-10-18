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
 * @param {Date} date - Date to check (defaults to now)
 * @returns {boolean}
 */
function isWithinOfficeHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 20; // 9 AM to 8 PM
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
  isWithinOfficeHours,
  formatWorkingHours,
  getCurrentDateString
};